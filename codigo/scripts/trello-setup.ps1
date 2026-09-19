# Configura codigo/.env.trello e prueba conexión con Trello API.
# Uso: scripts\trello-setup.cmd   (desde codigo/)

$ErrorActionPreference = "Stop"
$codigoRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $codigoRoot ".env.trello"
$example = Join-Path $codigoRoot ".env.trello.example"

Write-Host ""
Write-Host "========== D-PAY Trello setup ==========" -ForegroundColor Cyan
Write-Host "Tablero: D-PAY 3.0 Capstone (xUz6zs7Y)"
Write-Host ""

if (-not (Test-Path $example)) {
    Write-Error "No se encontró .env.trello.example en $codigoRoot"
}

if (Test-Path $envFile) {
    $overwrite = Read-Host ".env.trello ya existe. ¿Sobrescribir? (s/N)"
    if ($overwrite -notmatch '^[sS]') {
        Write-Host "Cancelado."
        exit 0
    }
}

Write-Host "1) API Key: https://trello.com/power-ups/admin"
Write-Host "   Power-Up -> API Key -> Generate"
Write-Host ""
$key = Read-Host "Pegue TRELLO_API_KEY"
if ([string]::IsNullOrWhiteSpace($key)) {
    Write-Error "API Key vacía."
}

$authUrl = "https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=DPAY%20CLI%20Local&key=$key"
Write-Host ""
Write-Host "2) Abra en el navegador y pulse Allow:" -ForegroundColor Yellow
Write-Host $authUrl
Write-Host ""
Start-Process $authUrl | Out-Null
$token = Read-Host "Pegue TRELLO_API_TOKEN (ATTA...)"
if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Error "Token vacío."
}

$template = Get-Content $example -Raw
$content = $template -replace '(?m)^TRELLO_API_KEY=.*', "TRELLO_API_KEY=$key"
$content = $content -replace '(?m)^TRELLO_API_TOKEN=.*', "TRELLO_API_TOKEN=$token"
Set-Content -Path $envFile -Value $content.TrimEnd() -Encoding UTF8 -NoNewline
Add-Content -Path $envFile -Value "`n"

Write-Host ""
Write-Host "Guardado: $envFile" -ForegroundColor Green
Write-Host "Probando conexión..." -ForegroundColor Cyan

Push-Location $codigoRoot
try {
    python scripts\trello.py lists
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host ""
    Write-Host "OK — Trello configurado. Prueba: python scripts\trello.py cards qa" -ForegroundColor Green
}
finally {
    Pop-Location
}
