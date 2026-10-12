# Build APK release UNIVERSAL para tienda / TUU (sin Metro en el dispositivo).
#
# Flujo:
#   1) Bundle JS embebido (--dev false → __DEV__=false, API pro.dtemite.cl, TUU prod)
#   2) Gradle assembleRelease con todas las ABI + APK universal
#
# Gradle NO vuelve a ejecutar Metro (debuggableVariants=release en build.gradle).
# El APK instalado funciona sin PC, sin Metro, sin adb reverse.
#
# Uso:
#   .\scripts\build-release.ps1              # Universal (TUU / tienda) — USAR ESTE en Kozen P8 (armeabi-v7a)
#   .\scripts\build-release.ps1 -PosOnly     # Solo arm64 — NO instalar en Kozen P8 (rompe libVisionCamera.so)

param(
    [switch]$PosOnly
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

# Universal = las 4 ABI (misma estructura que releases TUU 2.0–2.3)
$Abi = if ($PosOnly) { "arm64-v8a" } else { "armeabi-v7a,arm64-v8a,x86,x86_64" }

if ($PosOnly) {
    Write-Host ""
    Write-Host "AVISO: -PosOnly compila nativos solo arm64-v8a." -ForegroundColor Yellow
    Write-Host "       NO instalar el split armeabi-v7a en Kozen P8 (crash libVisionCamera.so)." -ForegroundColor Yellow
    Write-Host "       Use el build universal sin -PosOnly para POS armeabi-v7a." -ForegroundColor Yellow
    Write-Host ""
}
Write-Host "Modo: $(if ($PosOnly) { 'POS arm64' } else { 'UNIVERSAL (TUU/tienda)' })"
Write-Host "ABI:  $Abi"
Write-Host ""

Write-Host "[1/5] Parches nativos..." -ForegroundColor Yellow
node (Join-Path $Root "scripts\patch-bluetooth-printer.js")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node (Join-Path $Root "scripts\sync-scan-sound.js")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[2/5] Bundle JS release (embebido en APK)..." -ForegroundColor Yellow
$assetsDir = Join-Path $Root "android\app\src\main\assets"
$resDir = Join-Path $Root "android\app\src\main\res"
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

$env:NODE_OPTIONS = "--max-old-space-size=8192"
$env:CI = "true"
npx react-native bundle `
  --platform android `
  --dev false `
  --entry-file index.js `
  --bundle-output (Join-Path $assetsDir "index.android.bundle") `
  --assets-dest $resDir `
  --max-workers 1
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[3/5] Deteniendo daemons Gradle previos..." -ForegroundColor Yellow
Set-Location (Join-Path $Root "android")
.\gradlew --stop 2>$null | Out-Null

Write-Host "[4/5] Gradle :app:assembleRelease (puede tardar varios minutos)..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--max-old-space-size=8192"
$env:CMAKE_BUILD_PARALLEL_LEVEL = "1"
$env:GRADLE_OPTS = "-Xmx3072m -XX:MaxMetaspaceSize=512m -Xss512k"
# Solo el módulo app (evita assembleRelease de cada librería por separado).
$gradleArgs = @(":app:assembleRelease", "--no-daemon", "--max-workers=1", "-x", "lintVitalAnalyzeRelease")

if ($PosOnly) {
    & .\gradlew.bat @gradleArgs "-PreactNativeArchitectures=arm64-v8a"
} else {
    & .\gradlew.bat @gradleArgs
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[5/5] APK generados:" -ForegroundColor Green
$apks = Get-ChildItem -Path "app\build\outputs\apk\release" -Filter "*.apk" -Recurse |
  Sort-Object LastWriteTime -Descending

foreach ($apk in $apks) {
  $sizeMb = [math]::Round($apk.Length / 1MB, 1)
  Write-Host "  $sizeMb MB  $($apk.FullName)" -ForegroundColor Green
}

$universal = $apks | Where-Object { $_.Name -match "universal" } | Select-Object -First 1
if ($universal) {
  Write-Host ""
  Write-Host ">>> SUBIR A TUU / distribuir este archivo:" -ForegroundColor Cyan
  Write-Host "    $($universal.FullName)" -ForegroundColor White
} elseif (-not $PosOnly) {
  Write-Host ""
  Write-Host "AVISO: no se encontró APK universal. Revisa splits/universalApk en build.gradle." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Instalar en dispositivo:" -ForegroundColor Cyan
Write-Host '  adb install -r "ruta\al\apk\...-universal-release.apk"'
Write-Host ""
