# Script para ejecutar la app en Android
# Configura variables de entorno y ejecuta React Native

Write-Host "🚀 Configurando entorno Android..." -ForegroundColor Cyan

# Variables de entorno
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$env:LOCALAPPDATA\Android\platform-tools"

Write-Host "✅ JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
Write-Host "✅ ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green

# Verificar dispositivo conectado
Write-Host "`n📱 Dispositivos conectados:" -ForegroundColor Cyan
adb devices

Write-Host "`n🏃 Ejecutando React Native..." -ForegroundColor Cyan
npm run android
