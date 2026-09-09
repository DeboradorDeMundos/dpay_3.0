# Utilidades ADB compartidas (dev POS / celular genérico).

function Initialize-AdbPath {
    $sdkPlatformTools = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools"
    if (Test-Path $sdkPlatformTools) {
        $env:Path = "$sdkPlatformTools;$env:Path"
    }
    adb start-server 2>$null | Out-Null
}

function Get-AdbDeviceId {
    param(
        [string]$PreferredId = ""
    )

    Initialize-AdbPath

    $devices = @(adb devices 2>$null |
        Select-String "^\S+\s+(device|unauthorized)\s*$" |
        ForEach-Object {
            $parts = ($_.Line.Trim() -split "\s+")
            [PSCustomObject]@{
                Serial = $parts[0]
                State  = $parts[1]
            }
        })

    if ($devices.Count -eq 0) {
        Write-Host "ERROR: Ningún dispositivo USB detectado." -ForegroundColor Red
        Write-Host "  1. Cable de datos (no solo carga)" -ForegroundColor Yellow
        Write-Host "  2. Modo USB: Transferencia de archivos / MTP" -ForegroundColor Yellow
        Write-Host "  3. Acepta 'Permitir depuración USB' en el celular" -ForegroundColor Yellow
        Write-Host "  4. Ejecuta: adb devices" -ForegroundColor Yellow
        adb devices
        exit 1
    }

    $unauthorized = @($devices | Where-Object { $_.State -eq "unauthorized" })
    if ($unauthorized.Count -gt 0 -and ($devices | Where-Object { $_.State -eq "device" }).Count -eq 0) {
        Write-Host "ERROR: Dispositivo conectado pero NO autorizado." -ForegroundColor Red
        Write-Host "Desbloquea el celular y acepta 'Permitir depuración USB' (marca 'Siempre')." -ForegroundColor Yellow
        adb devices
        exit 1
    }

    $ready = @($devices | Where-Object { $_.State -eq "device" })
    if ($PreferredId) {
        $match = $ready | Where-Object { $_.Serial -eq $PreferredId }
        if ($match) { return $PreferredId }
        Write-Host "AVISO: $PreferredId no encontrado; usando $($ready[0].Serial)" -ForegroundColor Yellow
    }

    if ($ready.Count -gt 1) {
        Write-Host "Varios dispositivos; usando $($ready[0].Serial)" -ForegroundColor Yellow
    }

    return $ready[0].Serial
}

function Get-ScrcpyExe {
    $cmd = Get-Command scrcpy -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $wingetScrcpy = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter "scrcpy.exe" -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
    if ($wingetScrcpy) { return $wingetScrcpy }

    Write-Host "ERROR: scrcpy no encontrado. Instala con: winget install Genymobile.scrcpy" -ForegroundColor Red
    exit 1
}
