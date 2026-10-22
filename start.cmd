@echo off
setlocal
cd /d "%~dp0"
if exist "%LOCALAPPDATA%\WeddingDev\node-v24.22.0-win-x64\node.exe" set "PATH=%LOCALAPPDATA%\WeddingDev\node-v24.22.0-win-x64;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js LTS from https://nodejs.org
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  call npm.cmd install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Wedding invitation: http://localhost:5173
node node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5173 --strictPort --open
pause
