# Prueba compartida: emulador Android + Metro en este PC.
# No usa el celular ni adb reverse. El docente ve la ventana del emulador.
# El proxy del host se alcanza como http://10.0.2.2:8787
#
# Uso: npm run dev:emulator
#      npm run dev:emulator -- -SkipBuild

param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root
. (Join-Path $PSScriptRoot "env-android.ps1")

function Test-MetroRunning {
    return [bool](netstat -ano 2>$null | Select-String ":8081\s+.*LISTENING")
}

Write-Host ""
Write-Host "========== D-PAY 3.0 Emulador (sin celular) ==========" -ForegroundColor Cyan
Write-Host "Proyecto: $Root"
Write-Host "Proxy esperado en el PC: http://127.0.0.1:8787"
Write-Host "El emulador lo ve como:   http://10.0.2.2:8787"
Write-Host ""

$sdk = $env:ANDROID_HOME
$emulator = Join-Path $sdk "emulator\emulator.exe"
$adb = Join-Path $sdk "platform-tools\adb.exe"
if (-not (Test-Path $adb)) {
    Write-Host "ERROR: adb no está en $adb" -ForegroundColor Red
    exit 1
}

$online = & $adb devices | Select-String "emulator-\d+\s+device"
if (-not $online) {
    if (-not (Test-Path $emulator)) {
        Write-Host "ERROR: no hay emulador encendido y no existe $emulator" -ForegroundColor Red
        Write-Host "Crea un AVD en Android Studio (Device Manager) y vuelve a correr este script."
        exit 1
    }
    $avds = & $emulator -list-avds
    $avd = $avds | Where-Object { $_ -and $_.Trim() } | Select-Object -First 1
    if (-not $avd) {
        Write-Host "ERROR: no hay AVD. Android Studio > Device Manager > Create device." -ForegroundColor Red
        exit 1
    }
    Write-Host "Iniciando emulador $avd ..." -ForegroundColor Yellow
    Start-Process -FilePath $emulator -ArgumentList @("-avd", $avd)
    $deadline = (Get-Date).AddMinutes(3)
    do {
        Start-Sleep -Seconds 3
        $online = & $adb devices | Select-String "emulator-\d+\s+device"
    } while (-not $online -and (Get-Date) -lt $deadline)
    if (-not $online) {
        Write-Host "ERROR: el emulador no llegó a estado device." -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-MetroRunning)) {
    Write-Host "Iniciando Metro..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command",
        "Set-Location '$Root'; `$env:Path='C:\Program Files\nodejs;' + `$env:Path; npm start"
    )
    $deadline = (Get-Date).AddMinutes(2)
    do {
        Start-Sleep -Seconds 2
    } while (-not (Test-MetroRunning) -and (Get-Date) -lt $deadline)
    if (-not (Test-MetroRunning)) {
        Write-Host "ERROR: Metro no respondió en :8081" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Metro ya corre en :8081" -ForegroundColor Green
}

Write-Host "Sin adb reverse: el emulador usa 10.0.2.2, no el cable." -ForegroundColor Yellow

if ($SkipBuild) {
    $id = (& $adb devices | Select-String "emulator-\d+\s+device" | Select-Object -First 1).ToString().Split()[0]
    & $adb -s $id shell monkey -p com.dtemitepos -c android.intent.category.LAUNCHER 1 | Out-Null
} else {
    Write-Host "Compilando e instalando en el emulador..." -ForegroundColor Yellow
    npx react-native run-android
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ""
Write-Host "Listo. Comparte la ventana del emulador. El celular no participa." -ForegroundColor Green
Write-Host "Datos móviles del Honor: instala con npm run dev:mobile y desconecta el cable." -ForegroundColor Green
Write-Host "Webpay en la calle exige WEBPAY_PROXY_PUBLIC_URL (HTTPS). Efectivo y DTE ya salen a proqa.dtemite.cl." -ForegroundColor Green
Write-Host ""
