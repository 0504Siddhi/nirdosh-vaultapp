@echo off
echo ==============================================
echo   Nirdosh Vault Setup ^& Start Script
echo ==============================================
echo.

echo [1/4] Installing Backend Dependencies...
cd api
call npm install
cd ..
echo.

echo [2/4] Installing Frontend Dependencies...
cd ui
call npm install
cd ..
echo.

echo [3/4] Starting Backend Server...
start "Nirdosh Vault API" cmd /k "cd api && npm run dev"

echo [4/4] Starting Frontend Server...
start "Nirdosh Vault UI" cmd /k "cd ui && npm run dev"

echo.
echo ==============================================
echo Setup complete! Both servers are starting in separate windows.
echo.
echo Frontend UI: http://localhost:5173
echo Backend API: http://localhost:3000
echo ==============================================
echo.
pause
