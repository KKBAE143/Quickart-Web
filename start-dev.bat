@echo off
title Quickart Development Server
color 0A

echo ============================================
echo       QUICKART DEV SERVER STARTUP
echo ============================================
echo.

:: Kill any existing processes on ports
echo [1/4] Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 2^>nul') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 2^>nul') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4040 2^>nul') do taskkill /PID %%a /F >nul 2>&1

:: Set paths
set PROJECT_ROOT=%~dp0
set CLIENT_DIR=%PROJECT_ROOT%client
set SERVER_DIR=%PROJECT_ROOT%server

echo [2/4] Starting Backend Server (port 5000)...
start "Quickart Backend" cmd /k "cd /d %SERVER_DIR% && npm run dev"
timeout /t 3 /nobreak >nul

echo [3/4] Starting Frontend Server (port 5173)...
start "Quickart Frontend" cmd /k "cd /d %CLIENT_DIR% && npm run dev"
timeout /t 5 /nobreak >nul

echo [4/4] Starting ngrok tunnel for frontend (port 5173)...
start "ngrok Tunnel" cmd /k "npx ngrok http 5173"
timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo       ALL SERVERS STARTED!
echo ============================================
echo.
echo   Backend:   http://localhost:5000
echo   Frontend:  http://localhost:5173
echo   ngrok:     http://localhost:4040 (dashboard)
echo.
echo   IMPORTANT: Update your .env files with ngrok URL!
echo   Check ngrok window for your public URL like:
echo   https://xxxx-xx-xx-xxx-xxx.ngrok-free.app
echo.
echo ============================================
echo   Press any key to open ngrok dashboard...
echo ============================================
pause >nul

:: Open ngrok dashboard to see the URL
start http://localhost:4040
