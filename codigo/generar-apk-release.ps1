# Script para generar APK de Release para publicación en TUU App Store
# D-PAY v2.0

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  D-PAY - Generación de APK de Producción" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si existe el keystore de release
$keystorePath = "android\app\dpay-release.keystore"

if (-Not (Test-Path $keystorePath)) {
    Write-Host "⚠️  No se encontró el keystore de producción" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "¿Deseas crear uno ahora? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq "S" -or $response -eq "s") {
        Write-Host ""
        Write-Host "📝 Creando keystore de producción..." -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANTE: Guarda la contraseña que ingreses en un lugar seguro." -ForegroundColor Red
        Write-Host ""
        
        Set-Location android\app
        
        keytool -genkeypair -v -storetype PKCS12 -keystore dpay-release.keystore -alias dpay-key -keyalg RSA -keysize 2048 -validity 10000
        
        Set-Location ..\..
        
        Write-Host ""
        Write-Host "✅ Keystore creado exitosamente" -ForegroundColor Green
        Write-Host ""
        Write-Host "Ahora debes configurar el archivo android\gradle.properties con:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "DPAY_RELEASE_STORE_FILE=dpay-release.keystore" -ForegroundColor Cyan
        Write-Host "DPAY_RELEASE_KEY_ALIAS=dpay-key" -ForegroundColor Cyan
        Write-Host "DPAY_RELEASE_STORE_PASSWORD=[TU_PASSWORD]" -ForegroundColor Cyan
        Write-Host "DPAY_RELEASE_KEY_PASSWORD=[TU_PASSWORD]" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Presiona Enter para continuar después de configurar..." -ForegroundColor Yellow
        Read-Host
    } else {
        Write-Host ""
        Write-Host "❌ No se puede generar el APK sin keystore de producción" -ForegroundColor Red
        Write-Host "Por favor, sigue las instrucciones en PUBLICACION_TUU.md" -ForegroundColor Yellow
        exit 1
    }
}

# Verificar configuración en gradle.properties
$gradlePropsPath = "android\gradle.properties"
$hasReleaseConfig = $false

if (Test-Path $gradlePropsPath) {
    $content = Get-Content $gradlePropsPath -Raw
    if ($content -match "DPAY_RELEASE_STORE_FILE") {
        $hasReleaseConfig = $true
    }
}

if (-Not $hasReleaseConfig) {
    Write-Host "⚠️  No se encontró configuración de release en gradle.properties" -ForegroundColor Yellow
    Write-Host "El APK se firmará con debug keystore" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "🧹 Limpiando build anterior..." -ForegroundColor Yellow
Set-Location android
.\gradlew clean
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Error al limpiar el proyecto" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host ""
Write-Host "🏗️  Compilando APK de Release..." -ForegroundColor Green
Write-Host "Esto puede tomar varios minutos..." -ForegroundColor Yellow
Write-Host ""

# Aumentar memoria heap de Node.js para evitar "out of memory" al hacer el bundle
$env:NODE_OPTIONS = "--max-old-space-size=4096"

.\gradlew assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Error al compilar el APK" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "✅ APK generado exitosamente" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

$apkPath = "android\app\build\outputs\apk\release\d-pay_v2.0-universal-release.apk"

if (Test-Path $apkPath) {
    $apkSize = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
    Write-Host "📦 Ubicación: $apkPath" -ForegroundColor Cyan
    Write-Host "📊 Tamaño: $apkSize MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Yellow
    Write-Host "1. Verifica el APK en un dispositivo de prueba" -ForegroundColor White
    Write-Host "2. Prepara el ícono (assets\logos\d_isotipo.png)" -ForegroundColor White
    Write-Host "3. Sigue la guía en PUBLICACION_TUU.md para subir a TUU App Store" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  No se encontró el APK en la ubicación esperada" -ForegroundColor Yellow
    Write-Host "Busca en: android\app\build\outputs\apk\release\" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Presiona Enter para salir..." -ForegroundColor Gray
Read-Host
