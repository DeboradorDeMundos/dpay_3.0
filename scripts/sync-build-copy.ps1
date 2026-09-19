# Sincroniza dpay_3.0 (repo Git) -> copia build Android (ruta corta Windows).
#
# Repo Git: Documents\CAPSTONE\dpay_3.0
# Build:    C:\dpay  o  C:\p\a  (-ShortPaths, maximo acortamiento)
#
# Uso:
#   .\scripts\sync-build-copy.ps1
#   .\scripts\sync-build-copy.ps1 -ShortPaths -InstallNpm
#   .\scripts\sync-build-copy.ps1 -Mirror
#   .\scripts\sync-build-copy.ps1 -Reverse
#   .\scripts\sync-build-copy.ps1 -ShortPaths -Reverse

param(
    [string]$Source = "",
    [string]$Dest = "",
    [switch]$ShortPaths,
    [switch]$Mirror,
    [switch]$Reverse,
    [switch]$InstallNpm,
    [switch]$SkipConfirm
)

$ErrorActionPreference = "Stop"

if (-not $Source) {
    $Source = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

if (-not $Dest) {
    $Dest = if ($ShortPaths) { "C:\p" } else { "C:\dpay" }
}

# Mapeo nombre largo (repo) -> nombre corto (copia build)
$FolderMap = if ($ShortPaths) {
    @{
        "codigo"        = "a"
        "webpay-proxy"  = "w"
        "scripts"       = "s"
        "fase2"         = "f2"
        "fase1"         = "f1"
        "fase3"         = "f3"
        ".github"       = ".github"
    }
} else {
    $null
}

function Get-CodigoDestPath {
    param([string]$BaseDest)
    if ($ShortPaths) { return Join-Path $BaseDest "a" }
    return Join-Path $BaseDest "codigo"
}

function Invoke-RoboSync {
    param(
        [string]$From,
        [string]$To,
        [bool]$UseMirror
    )
    if (-not (Test-Path $From)) {
        Write-Host "  omitido (no existe): $From" -ForegroundColor DarkGray
        return 0
    }
    if (-not (Test-Path $To)) {
        New-Item -ItemType Directory -Path $To -Force | Out-Null
    }

    $excludeDirs = @(".git", "node_modules", ".gradle", "build", ".cxx", ".idea", ".vscode")
    $excludeFiles = @("*.apk", "*.aab", "*.keystore", ".env", ".env.local")

    $args = @($From, $To, "/E", "/R:2", "/W:2", "/NFL", "/NDL", "/NJH", "/NJS", "/NP")
    foreach ($d in $excludeDirs) { $args += "/XD"; $args += $d }
    foreach ($f in $excludeFiles) { $args += "/XF"; $args += $f }
    if ($UseMirror) { $args += "/MIR" }

    & robocopy @args | Out-Null
    return [int]$LASTEXITCODE
}

if (-not (Test-Path $Source)) {
    Write-Host "ERROR: Origen no existe: $Source" -ForegroundColor Red
    exit 1
}

$repoRoot = $Source
$buildRoot = $Dest

Write-Host ""
Write-Host "========== D-PAY sync-build-copy ==========" -ForegroundColor Cyan
Write-Host "Repo:    $repoRoot"
Write-Host "Build:   $buildRoot"
Write-Host "Layout:  $(if ($ShortPaths) { 'ShortPaths (C:\p\a, C:\p\w, ...)' } else { 'Standard (C:\dpay\codigo, ...)' })"
Write-Host "Modo:    $(if ($Reverse) { 'Reverse (build -> repo)' } else { 'Repo -> build' })$(if ($Mirror) { ' + MIRROR' } else { '' })"
Write-Host ""

if ($Mirror -and -not $SkipConfirm) {
    Write-Host "MIRROR elimina en destino archivos que no esten en origen (excepto /XD)." -ForegroundColor Yellow
    $confirm = Read-Host "Continuar? (s/N)"
    if ($confirm -notmatch '^[sS]') {
        Write-Host "Cancelado." -ForegroundColor Yellow
        exit 0
    }
}

if (-not (Test-Path $buildRoot)) {
    New-Item -ItemType Directory -Path $buildRoot -Force | Out-Null
}

$maxRc = 0

if ($Reverse -and $FolderMap) {
    Write-Host "Sincronizando (reverse, nombres cortos)..." -ForegroundColor Yellow
    foreach ($entry in $FolderMap.GetEnumerator()) {
        $from = Join-Path $buildRoot $entry.Value
        $to = Join-Path $repoRoot $entry.Key
        Write-Host "  $($entry.Value) -> $($entry.Key)"
        $rc = Invoke-RoboSync -From $from -To $to -UseMirror:$Mirror
        if ($rc -ge 8) { Write-Host "ERROR robocopy $rc en $($entry.Key)" -ForegroundColor Red; exit $rc }
        if ($rc -gt $maxRc) { $maxRc = $rc }
    }
    # Raiz: README, etc.
    $rootFiles = @("README.md", "LICENSE", ".gitignore")
    foreach ($f in $rootFiles) {
        $srcF = Join-Path $buildRoot $f
        if (Test-Path $srcF) { Copy-Item $srcF (Join-Path $repoRoot $f) -Force }
    }
} elseif ($Reverse) {
    Write-Host "Sincronizando (reverse)..." -ForegroundColor Yellow
    $rc = Invoke-RoboSync -From $buildRoot -To $repoRoot -UseMirror:$Mirror
    if ($rc -ge 8) { exit $rc }
    $maxRc = $rc
} elseif ($FolderMap) {
    Write-Host "Sincronizando (ShortPaths)..." -ForegroundColor Yellow
    foreach ($entry in $FolderMap.GetEnumerator()) {
        $from = Join-Path $repoRoot $entry.Key
        $to = Join-Path $buildRoot $entry.Value
        Write-Host "  $($entry.Key) -> $($entry.Value)"
        $rc = Invoke-RoboSync -From $from -To $to -UseMirror:$Mirror
        if ($rc -ge 8) { Write-Host "ERROR robocopy $rc en $($entry.Key)" -ForegroundColor Red; exit $rc }
        if ($rc -gt $maxRc) { $maxRc = $rc }
    }
    foreach ($f in @("README.md", ".gitignore")) {
        $srcF = Join-Path $repoRoot $f
        if (Test-Path $srcF) { Copy-Item $srcF (Join-Path $buildRoot $f) -Force }
    }
} else {
    Write-Host "Sincronizando (standard)..." -ForegroundColor Yellow
    $rc = Invoke-RoboSync -From $repoRoot -To $buildRoot -UseMirror:$Mirror
    if ($rc -ge 8) { exit $rc }
    $maxRc = $rc
}

Write-Host "Sync OK (robocopy max=$maxRc)." -ForegroundColor Green

$codigoPath = Get-CodigoDestPath -BaseDest $buildRoot

if ($InstallNpm -and -not $Reverse) {
    if (Test-Path (Join-Path $codigoPath "package.json")) {
        Write-Host ""
        Write-Host "npm install en $codigoPath ..." -ForegroundColor Yellow
        Push-Location $codigoPath
        try {
            npm install
            if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        } finally {
            Pop-Location
        }
        Write-Host "npm install OK." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Siguiente (build Honor):" -ForegroundColor Cyan
Write-Host "  cd $codigoPath"
Write-Host "  npm run dev:mobile -- -DeviceId `"<SERIAL>`""
Write-Host ""
Write-Host "Ver: scripts/PATH-BUILD-WINDOWS.md" -ForegroundColor DarkGray
Write-Host "Repo Git: $repoRoot" -ForegroundColor DarkGray
Write-Host ""

exit 0
