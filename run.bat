@echo off
setlocal enabledelayedexpansion

echo ================================================
echo    Multi-SPV Financial Dashboard - Starter
echo ================================================
echo.

:: Root folder
set "ROOT=%~dp0"

:: Remove trailing space if any
if "%ROOT:~-1%"==" " set "ROOT=%ROOT:~0,-1%"

set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"

echo [OK] Root Folder: %ROOT%
echo [OK] Backend  : %BACKEND_DIR%
echo [OK] Frontend : %FRONTEND_DIR%
echo.

echo Starting Backend...
start "Backend Server" cmd /k "cd /d \"%BACKEND_DIR%\" && npm run dev"

echo Starting Frontend...
start "Frontend Server" cmd /k "cd /d \"%FRONTEND_DIR%\" && npm run dev"

echo.
echo Servers started in separate windows.
timeout /t 8 /nobreak >nul

echo Opening Browser...
start http://localhost:5173/login

echo.
echo All done!
pause