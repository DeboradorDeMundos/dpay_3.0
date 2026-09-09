# Ejecutar D-PAY en Android (auto-detecta celular conectado)
. "$PSScriptRoot\scripts\env-android.ps1"

Write-Host "Entorno Android" -ForegroundColor Cyan
Write-Host "  JAVA_HOME:    $env:JAVA_HOME"
Write-Host "  ANDROID_HOME: $env:ANDROID_HOME"
Write-Host ""
Write-Host "Dispositivos:" -ForegroundColor Cyan
adb devices
Write-Host ""

$device = Get-AdbDeviceId -First
if ($device) {
    Write-Host "Usando dispositivo: $device" -ForegroundColor Green
    adb -s $device reverse tcp:8081 tcp:8081 | Out-Null
    npx react-native run-android --active-arch-only --deviceId $device
} else {
    Write-Host "Ningun dispositivo. Conecta el celular con USB debugging." -ForegroundColor Yellow
    npx react-native run-android
}
