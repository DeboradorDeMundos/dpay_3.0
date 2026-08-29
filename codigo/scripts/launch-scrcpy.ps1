# Espejo del POS en PC (scrcpy). Ejecutar desde PowerShell o doble clic.
$ScrcpyDir = "C:\Users\mauro\AppData\Local\scrcpy"
$DeviceId = "6010B232561701920"
$env:Path += ";C:\Users\mauro\AppData\Local\Android\Sdk\platform-tools"

if (-not (Test-Path (Join-Path $ScrcpyDir "scrcpy.exe"))) {
    Write-Host "ERROR: Instala scrcpy o ajusta la ruta en scripts/launch-scrcpy.ps1" -ForegroundColor Red
    pause
    exit 1
}

$dev = adb devices 2>$null | Select-String "^\s*$DeviceId\s+device"
if (-not $dev) {
    Write-Host "ERROR: POS no conectado ($DeviceId). Revisa USB y adb devices." -ForegroundColor Red
    adb devices
    pause
    exit 1
}

Set-Location $ScrcpyDir
Write-Host "Abriendo scrcpy -> $DeviceId (P8 Neo)..." -ForegroundColor Cyan
& .\scrcpy.exe -s $DeviceId --window-title "D-PAY POS" --max-size 1024 --always-on-top
