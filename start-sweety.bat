@echo off
title Sweety Blood Glucose Tracker Launcher
color 0A
echo ======================================================================
echo             Starting Sweety Blood Glucose Tracker (MERN)
echo ======================================================================
echo.

echo [1/3] Starting Backend API Server (Port 5000)...
start "Sweety Backend Server (Port 5000)" cmd /k "cd /d %~dp0server && node src/server.js"

echo [2/3] Waiting 4 seconds for database and API to start...
timeout /t 4 /nobreak >nul

echo [3/3] Starting Frontend React App (Port 3000)...
start "Sweety Frontend Client (Port 3000)" cmd /k "cd /d %~dp0client && node node_modules\vite\bin\vite.js"

echo Waiting 3 seconds for Vite server...
timeout /t 3 /nobreak >nul

echo Launching browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo ======================================================================
echo   Sweety is now running!
echo.
echo   Web App URL:  http://localhost:3000
echo   Backend API:  http://localhost:5000
echo.
echo   Demo Patient Credentials:
echo     Email:    demo@sweety.com
echo     Password: Password123!
echo     (Or click the green 'Fill Demo' button on the login screen!)
echo.
echo   To STOP the app:
echo     Simply close the two opened black command prompt windows.
echo ======================================================================
echo.
pause
