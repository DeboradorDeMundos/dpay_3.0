# Entorno Android para Diego — source: . .\scripts\env-android.ps1
$jdk = Get-ChildItem "C:\Program Files\Microsoft\jdk-17*" -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending | Select-Object -First 1
if (-not $jdk) {
    $jdk = Get-ChildItem "C:\Program Files\Java\jdk-*" -Directory -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending | Select-Object -First 1
}
if ($jdk) { $env:JAVA_HOME = $jdk.FullName }

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:GRADLE_USER_HOME = "C:\gradle"
if (-not (Test-Path $env:GRADLE_USER_HOME)) { New-Item -ItemType Directory -Force -Path $env:GRADLE_USER_HOME | Out-Null }
$env:Path = @(
    "C:\Program Files\nodejs",
    "$env:JAVA_HOME\bin",
    "$env:ANDROID_HOME\platform-tools",
    "$env:ANDROID_HOME\cmdline-tools\latest\bin",
    "$env:ANDROID_HOME\emulator",
    "$env:WINDIR\System32",
    "$env:WINDIR",
    "$env:WINDIR\System32\WindowsPowerShell\v1.0"
) -join ";"

$cmd = Get-Command scrcpy -ErrorAction SilentlyContinue
$script:ScrcpyExe = @(
    $(if ($cmd) { $cmd.Source }),
    "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Genymobile.scrcpy_Microsoft.Winget.Source_8wekyb3d8bbwe\scrcpy-win64-v4.1\scrcpy.exe",
    "$env:LOCALAPPDATA\scrcpy\scrcpy.exe"
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

function Get-AdbDeviceId {
    param([switch]$First)
    $lines = & adb devices 2>$null | Select-String "^\S+\s+device$"
    if (-not $lines) { return $null }
    $ids = $lines | ForEach-Object { ($_ -split "\s+")[0].Trim() }
    if ($First) { return $ids | Select-Object -First 1 }
    return $ids
}
