@echo off
setlocal
cd /d "%~dp0\.."
python "%~dp0trello.py" %*
endlocal
