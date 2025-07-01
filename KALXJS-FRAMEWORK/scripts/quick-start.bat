@echo off
REM KalxJS Development Tools - Quick Start Script for Windows
REM This script provides a quick way to get started with KalxJS development

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   KalxJS Development Tools Quick Start
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed or not in PATH
    echo Please install npm or check your Node.js installation
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available
echo.

REM Show menu
:menu
echo Choose an option:
echo.
echo 1. Setup local testing environment
echo 2. Start test applications
echo 3. Clean unused files (dry run)
echo 4. Analyze dependencies
echo 5. Check environment status
echo 6. Show help
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto test
if "%choice%"=="3" goto cleanup
if "%choice%"=="4" goto analyze
if "%choice%"=="5" goto status
if "%choice%"=="6" goto help
if "%choice%"=="7" goto exit
echo Invalid choice. Please try again.
goto menu

:setup
echo.
echo 🚀 Setting up local testing environment...
echo This will:
echo   - Clean previous installations
echo   - Build and link packages
echo   - Create test applications
echo   - Setup development servers
echo.
set /p confirm="Continue? (y/N): "
if /i not "%confirm%"=="y" goto menu

npm run dev:setup
if errorlevel 1 (
    echo.
    echo ❌ Setup failed. Check the logs for details.
    pause
    goto menu
)

echo.
echo ✅ Setup completed successfully!
echo.
echo Test applications are available at:
echo   - Basic Test:       http://localhost:3001
echo   - SFC Test:         http://localhost:3002
echo   - Router Test:      http://localhost:3003
echo   - Performance Test: http://localhost:3004
echo.
pause
goto menu

:test
echo.
echo 🧪 Starting test applications...
echo This will start all test applications with hot reload monitoring.
echo Press Ctrl+C to stop all applications.
echo.
set /p confirm="Continue? (y/N): "
if /i not "%confirm%"=="y" goto menu

npm run dev:test
pause
goto menu

:cleanup
echo.
echo 🧹 Analyzing unused files (dry run)...
echo This will show what files would be removed without actually deleting them.
echo.
npm run dev:cleanup
if errorlevel 1 (
    echo.
    echo ❌ Cleanup analysis failed. Check the logs for details.
    pause
    goto menu
)

echo.
echo Analysis completed. Check the cleanup report for details.
echo To actually remove files, run: npm run dev:cleanup:live
echo.
pause
goto menu

:analyze
echo.
echo 🔍 Analyzing dependencies and code quality...
echo This will analyze the entire codebase for:
echo   - Dependency relationships
echo   - Circular dependencies
echo   - Unused exports
echo   - Dead code
echo   - Bundle optimization opportunities
echo.
npm run dev:analyze
if errorlevel 1 (
    echo.
    echo ❌ Analysis failed. Check the logs for details.
    pause
    goto menu
)

echo.
echo ✅ Analysis completed! Check the generated reports.
pause
goto menu

:status
echo.
echo 📊 Checking environment status...
echo.
npm run dev:status --verbose
echo.
pause
goto menu

:help
echo.
echo 🆘 KalxJS Development Tools Help
echo.
echo Available npm scripts:
echo   npm run dev:setup      - Setup local testing environment
echo   npm run dev:test       - Start test applications
echo   npm run dev:cleanup    - Analyze unused files (dry run)
echo   npm run dev:cleanup:live - Remove unused files (live)
echo   npm run dev:analyze    - Analyze dependencies
echo   npm run dev:status     - Check environment status
echo.
echo Direct script access:
echo   npm run local:setup    - Setup local testing
echo   npm run local:test     - Run test orchestrator
echo   npm run local:cleanup  - Clean unused files
echo   npm run local:analyze  - Analyze dependencies
echo.
echo For detailed help on any command:
echo   npm run dev-tools help
echo   npm run dev-tools ^<command^> --help
echo.
echo Documentation:
echo   scripts/README.md      - Development tools documentation
echo   README.md              - Main project documentation
echo.
pause
goto menu

:exit
echo.
echo 👋 Thanks for using KalxJS Development Tools!
echo.
exit /b 0