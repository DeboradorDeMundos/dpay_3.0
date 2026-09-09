# Levanta Metro + scrcpy + app D-PAY en el POS conectado por USB.
# Uso:
#   .\scripts\dev-pos.ps1
#   .\scripts\dev-pos.ps1 -SkipBuild          # solo Metro + scrcpy + abrir app
#   .\scripts\dev-pos.ps1 -ResetCache         # Metro con cache limpio
#   .\scripts\dev-pos.ps1 -DeviceId "OTRO_ID"

param(
    [string]$DeviceId = "",
    [switch]$SkipBuild,
    [switch]$ResetCache
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root
. (Join-Path $PSScriptRoot "adb-utils.ps1")

function Test-MetroRunning {
    return [bool](netstat -ano 2>$null | Select-String ":8081\s+.*LISTENING")
}

function Wait-MetroReady {
    param([int]$TimeoutSec = 90)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-MetroRunning) { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

Write-Host ""
Write-Host "========== D-PAY Dev ==========" -ForegroundColor Cyan
Write-Host "Proyecto: $Root"
Write-Host ""

$DeviceId = Get-AdbDeviceId -PreferredId $DeviceId
Write-Host "Device:   $DeviceId"
Write-Host ""

if (-not $SkipBuild) {
    Write-Host "Aplicando parche bluetooth printer..." -ForegroundColor Yellow
    node (Join-Path $Root "scripts\patch-bluetooth-printer.js")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (Test-MetroRunning) {
    Write-Host "Metro ya corre en :8081" -ForegroundColor Green
} else {
    $metroScript = if ($ResetCache) { "start:reset" } else { "start" }
    Write-Host "Iniciando Metro ($metroScript) en ventana nueva..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$Root'; Write-Host 'Metro D-PAY' -ForegroundColor Cyan; npm run $metroScript"
    )
    Write-Host "Esperando Metro en :8081..."
    if (-not (Wait-MetroReady)) {
        Write-Host "ERROR: Metro no respondio a tiempo en el puerto 8081." -ForegroundColor Red
        exit 1
    }
    Write-Host "Metro listo." -ForegroundColor Green
}

$ScrcpyExe = Get-ScrcpyExe
$ScrcpyDir = Split-Path $ScrcpyExe -Parent

Write-Host "Iniciando scrcpy..." -ForegroundColor Yellow
Start-Process -FilePath $ScrcpyExe -WorkingDirectory $ScrcpyDir -ArgumentList @(
    "-s", $DeviceId,
    "--window-title", "D-PAY Dev",
    "--max-size", "1024",
    "--always-on-top"
)

Write-Host "Configurando adb reverse (8081)..." -ForegroundColor Yellow
adb -s $DeviceId reverse tcp:8081 tcp:8081 | Out-Null

if ($SkipBuild) {
    Write-Host "Abriendo app (sin rebuild)..." -ForegroundColor Yellow
    adb -s $DeviceId shell monkey -p com.dtemitepos -c android.intent.category.LAUNCHER 1 | Out-Null
} else {
    Write-Host "Compilando e instalando en POS..." -ForegroundColor Yellow
    npx react-native run-android --active-arch-only --deviceId $DeviceId
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ""
Write-Host "Listo." -ForegroundColor Green
Write-Host "  Metro:  http://localhost:8081"
Write-Host "  scrcpy: ventana 'D-PAY POS'"
Write-Host "  Hot reload: guarda cambios JS/TS o agita el POS -> Reload"
Write-Host ""
