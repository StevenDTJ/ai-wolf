@echo off
echo ========================================
echo   AI Debate Arena
echo ========================================
echo.

if not exist "node_modules" (
    echo First run: Installing dependencies...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo Installation failed. Please check if Node.js is installed correctly.
        pause
        exit /b 1
    )
    echo.
)

if not exist ".next" (
    echo Building application...
    echo.
    call npm run build
    if errorlevel 1 (
        echo.
        echo Build failed.
        pause
        exit /b 1
    )
    echo.
)

echo Starting application...
echo Please visit: http://localhost:3000
echo.
echo If port 3000 is busy, it will use port 3001
echo.
echo Press Ctrl+C to stop the server
echo.

npm run start || npm run dev

pause
