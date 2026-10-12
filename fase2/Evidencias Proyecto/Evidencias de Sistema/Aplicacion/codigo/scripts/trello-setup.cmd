@echo off
setlocal
cd /d "%~dp0\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0trello-setup.ps1" %*
if errorlevel 1 pause
endlocal
