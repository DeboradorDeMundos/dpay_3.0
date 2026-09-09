# Espejo del dispositivo Android en PC (scrcpy).
# Uso: .\scripts\launch-scrcpy.ps1
#      .\scripts\launch-scrcpy.ps1 -DeviceId "SERIAL"

param(
    [string]$DeviceId = ""
)

. (Join-Path $PSScriptRoot "adb-utils.ps1")

$DeviceId = Get-AdbDeviceId -PreferredId $DeviceId
$ScrcpyExe = Get-ScrcpyExe
$ScrcpyDir = Split-Path $ScrcpyExe -Parent

Set-Location $ScrcpyDir
Write-Host "Abriendo scrcpy -> $DeviceId ..." -ForegroundColor Cyan
& $ScrcpyExe -s $DeviceId --window-title "D-PAY Dev" --max-size 1024 --always-on-top
