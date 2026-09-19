# Metro + scrcpy + build/install en celular Android conectado por USB.
# Uso: .\scripts\dev-mobile.ps1
#      .\scripts\dev-mobile.ps1 -SkipBuild
#      .\scripts\dev-mobile.ps1 -DeviceId "SERIAL"

param(
    [string]$DeviceId = "",
    [switch]$SkipBuild,
    [switch]$ResetCache
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root
. (Join-Path $PSScriptRoot "env-android.ps1")

if (-not $DeviceId) { $DeviceId = Get-AdbDeviceId -First }
if (-not $DeviceId) {
    Write-Host "ERROR: Celular no detectado. USB debugging ON y acepta 'Confiar en este PC'." -ForegroundColor Red
    adb devices
    exit 1
}

function Test-MetroRunning {
    return [bool](netstat -ano 2>$null | Select-String ":8081\s+.*LISTENING")
}

function Wait-MetroReady {
    param([int]$TimeoutSec = 120)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-MetroRunning) { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

Write-Host ""
Write-Host "========== D-PAY 3.0 Mobile Dev ==========" -ForegroundColor Cyan
Write-Host "Proyecto: $Root"
Write-Host "Device:   $DeviceId"
Write-Host ""

if (-not $SkipBuild) {
    Write-Host "Parche bluetooth printer..." -ForegroundColor Yellow
    node (Join-Path $Root "scripts\patch-bluetooth-printer.js")
}

if (Test-MetroRunning) {
    Write-Host "Metro ya corre en :8081" -ForegroundColor Green
} else {
    $metroScript = if ($ResetCache) { "start:reset" } else { "start" }
    Write-Host "Iniciando Metro ($metroScript)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command",
        "Set-Location '$Root'; `$env:Path='C:\Program Files\nodejs;' + `$env:Path; npm run $metroScript"
    )
    if (-not (Wait-MetroReady)) {
        Write-Host "ERROR: Metro no respondio en :8081" -ForegroundColor Red
        exit 1
    }
}

$scrcpy = $script:ScrcpyExe
if (-not $scrcpy) {
    $cmd = Get-Command scrcpy -ErrorAction SilentlyContinue
    if ($cmd) { $scrcpy = $cmd.Source }
}
if ($scrcpy) {
    Write-Host "Iniciando scrcpy..." -ForegroundColor Yellow
    Start-Process -FilePath $scrcpy -ArgumentList @(
        "-s", $DeviceId, "--window-title=D-PAY-3.0", "--max-size=1080"
    )
} else {
    Write-Host "scrcpy no encontrado (opcional). winget install Genymobile.scrcpy" -ForegroundColor Yellow
}

Write-Host "adb reverse 8081..." -ForegroundColor Yellow
adb -s $DeviceId reverse tcp:8081 tcp:8081 | Out-Null

if ($SkipBuild) {
    adb -s $DeviceId shell monkey -p com.dtemitepos -c android.intent.category.LAUNCHER 1 | Out-Null
} else {
    Write-Host "Compilando e instalando (arm64)..." -ForegroundColor Yellow
    npx react-native run-android --active-arch-only --deviceId $DeviceId
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ""
Write-Host "Listo. Metro :8081 | scrcpy | Hot reload activo." -ForegroundColor Green
Write-Host ""
