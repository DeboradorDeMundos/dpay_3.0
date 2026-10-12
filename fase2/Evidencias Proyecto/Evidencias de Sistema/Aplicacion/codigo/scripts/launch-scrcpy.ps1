# Espejo del celular/POS en PC (scrcpy). Uso: npm run scrcpy
. "$PSScriptRoot\env-android.ps1"

$DeviceId = $args[0]
if (-not $DeviceId) { $DeviceId = Get-AdbDeviceId -First }
if (-not $DeviceId) {
    Write-Host "ERROR: No hay dispositivo adb. Conecta el celular y activa Depuracion USB." -ForegroundColor Red
    adb devices
    exit 1
}

$scrcpy = $script:ScrcpyExe
if (-not $scrcpy) {
    $cmd = Get-Command scrcpy -ErrorAction SilentlyContinue
    if ($cmd) { $scrcpy = $cmd.Source }
}
if (-not $scrcpy) {
    Write-Host "ERROR: scrcpy no esta en PATH. Instala: winget install Genymobile.scrcpy" -ForegroundColor Red
    exit 1
}

Write-Host "Abriendo scrcpy -> $DeviceId ..." -ForegroundColor Cyan
& $scrcpy -s $DeviceId --window-title=D-PAY-3.0 --max-size=1080
