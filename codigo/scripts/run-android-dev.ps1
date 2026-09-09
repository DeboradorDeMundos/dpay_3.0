# adb reverse + run-android en el primer dispositivo USB conectado.
. (Join-Path $PSScriptRoot "adb-utils.ps1")

$DeviceId = Get-AdbDeviceId
Write-Host "Dispositivo: $DeviceId" -ForegroundColor Cyan
adb -s $DeviceId reverse tcp:8081 tcp:8081
npx react-native run-android --active-arch-only --deviceId $DeviceId
exit $LASTEXITCODE
