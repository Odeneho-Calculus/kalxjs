@echo off
setlocal enabledelayedexpansion

:: KALXJS Framework Developer Tools
:: This batch file provides an easy interface for common development tasks

:: Set framework directory
set "FRAMEWORK_DIR=%~dp0KALXJS-FRAMEWORK"

:: Check if we're in the right directory
if not exist "%FRAMEWORK_DIR%" (
    echo Error: KALXJS-FRAMEWORK directory not found.
    echo Please run this script from the root of the kaljs repository.
    exit /b 1
)

:: Display header
cls
echo.
echo  KALXJS FRAMEWORK DEVELOPER TOOLS
echo  ===============================
echo.

:: Main menu function
:main_menu
echo Choose an operation:
echo.
echo [1] Build Framework        - Build all packages
echo [2] Build Package         - Build a specific package
echo [3] Clean                - Clean node_modules and build artifacts
echo [4] Install Dependencies   - Install all dependencies
echo [5] Run Tests             - Run test suite
echo [6] Create Project        - Create a new KALXJS project
echo [7] Lint Code            - Run ESLint on all packages
echo [8] Publish              - Publish packages to npm
echo [9] Documentation        - Build or serve documentation
echo [10] Exit                 - Exit this tool
echo.

set /p choice="Enter your choice (1-10): "
echo.

if "%choice%"=="1" goto build_all
if "%choice%"=="2" goto build_package
if "%choice%"=="3" goto clean
if "%choice%"=="4" goto install
if "%choice%"=="5" goto tests
if "%choice%"=="6" goto create_project
if "%choice%"=="7" goto lint
if "%choice%"=="8" goto publish
if "%choice%"=="9" goto documentation
if "%choice%"=="10" goto exit

echo Invalid choice. Please try again.
timeout /t 2 >nul
cls
goto main_menu

:: Build all packages
:build_all
echo Building all packages...
cd "%FRAMEWORK_DIR%"
call npm run build
echo.
echo Build complete!
pause
cls
goto main_menu

:: Build specific package
:build_package
echo Select a package to build:
echo.
echo [1] Core
echo [2] Router
echo [3] State
echo [4] CLI
echo [5] DevTools
echo [6] Composition
echo [7] Performance
echo [8] Plugins
echo [9] API
echo [10] Back to main menu
echo.

set /p pkg_choice="Enter your choice (1-10): "
echo.

set "pkg_name="
if "%pkg_choice%"=="1" set "pkg_name=core"
if "%pkg_choice%"=="2" set "pkg_name=router"
if "%pkg_choice%"=="3" set "pkg_name=state"
if "%pkg_choice%"=="4" set "pkg_name=cli"
if "%pkg_choice%"=="5" set "pkg_name=devtools"
if "%pkg_choice%"=="6" set "pkg_name=composition"
if "%pkg_choice%"=="7" set "pkg_name=performance"
if "%pkg_choice%"=="8" set "pkg_name=plugins"
if "%pkg_choice%"=="9" set "pkg_name=api"
if "%pkg_choice%"=="10" (
    cls
    goto main_menu
)

if not defined pkg_name (
    echo Invalid choice. Please try again.
    timeout /t 2 >nul
    cls
    goto build_package
)

echo Building %pkg_name% package...
cd "%FRAMEWORK_DIR%"
call npm run build:%pkg_name%
echo.
echo Build complete!
pause
cls
goto main_menu

:: Clean
:clean
echo Cleaning node_modules and build artifacts...
cd "%FRAMEWORK_DIR%"
call npm run clean
echo.
echo Clean complete!
pause
cls
goto main_menu

:: Install dependencies
:install
echo Installing dependencies...
cd "%FRAMEWORK_DIR%"
call npm install
echo.
echo Installation complete!
pause
cls
goto main_menu

:: Run tests
:tests
echo Select test option:
echo.
echo [1] Run all tests
echo [2] Run tests with watch mode
echo [3] Run tests with coverage
echo [4] Clear Jest cache
echo [5] Back to main menu
echo.

set /p test_choice="Enter your choice (1-5): "
echo.

if "%test_choice%"=="1" (
    echo Running all tests...
    cd "%FRAMEWORK_DIR%"
    call npm test
)
if "%test_choice%"=="2" (
    echo Running tests in watch mode...
    cd "%FRAMEWORK_DIR%"
    call npm run test:watch
)
if "%test_choice%"=="3" (
    echo Running tests with coverage...
    cd "%FRAMEWORK_DIR%"
    call npm run test:coverage
)
if "%test_choice%"=="4" (
    echo Clearing Jest cache...
    cd "%FRAMEWORK_DIR%"
    call npm run clear-jest-cache
)
if "%test_choice%"=="5" (
    cls
    goto main_menu
)

if "%test_choice%" NEQ "1" if "%test_choice%" NEQ "2" if "%test_choice%" NEQ "3" if "%test_choice%" NEQ "4" if "%test_choice%" NEQ "5" (
    echo Invalid choice. Please try again.
    timeout /t 2 >nul
    cls
    goto tests
)

echo.
echo Tests complete!
pause
cls
goto main_menu

:: Create project
:create_project
echo Create a new KALXJS project
echo.
set /p project_name="Enter project name: "

if "%project_name%"=="" (
    echo Project name cannot be empty.
    timeout /t 2 >nul
    cls
    goto create_project
)

echo.
echo Select features to include:
echo.
set "use_router="
set /p use_router="Include router? (y/n): "
set "use_state="
set /p use_state="Include state management? (y/n): "
set "use_scss="
set /p use_scss="Include SCSS support? (y/n): "
set "use_testing="
set /p use_testing="Include testing setup? (y/n): "
set "use_linting="
set /p use_linting="Include linting? (y/n): "

set "options="
if /i "%use_router%"=="y" set "options=!options! --router"
if /i "%use_state%"=="y" set "options=!options! --state"
if /i "%use_scss%"=="y" set "options=!options! --scss"
if /i "%use_testing%"=="y" set "options=!options! --testing"
if /i "%use_linting%"=="y" set "options=!options! --linting"

echo.
echo Creating project %project_name%...
cd "%FRAMEWORK_DIR%"
call npm run create -- %project_name% %options%
echo.
echo Project created!
pause
cls
goto main_menu

:: Lint code
:lint
echo Linting code...
cd "%FRAMEWORK_DIR%"
call npm run lint
echo.
echo Linting complete!
pause
cls
goto main_menu

:: Publish packages
:publish
echo Select publish option:
echo.
echo [1] Publish all packages
echo [2] Publish from package
echo [3] Publish canary version
echo [4] Bump version
echo [5] Back to main menu
echo.

set /p publish_choice="Enter your choice (1-5): "
echo.

if "%publish_choice%"=="1" (
    echo Publishing all packages...
    cd "%FRAMEWORK_DIR%"
    call npm run publish
)
if "%publish_choice%"=="2" (
    echo Publishing from package...
    cd "%FRAMEWORK_DIR%"
    call npm run publish:from-package
)
if "%publish_choice%"=="3" (
    echo Publishing canary version...
    cd "%FRAMEWORK_DIR%"
    call npm run publish:canary
)
if "%publish_choice%"=="4" (
    echo Bumping version...
    cd "%FRAMEWORK_DIR%"
    call npm run version:bump
)
if "%publish_choice%"=="5" (
    cls
    goto main_menu
)

if "%publish_choice%" NEQ "1" if "%publish_choice%" NEQ "2" if "%publish_choice%" NEQ "3" if "%publish_choice%" NEQ "4" if "%publish_choice%" NEQ "5" (
    echo Invalid choice. Please try again.
    timeout /t 2 >nul
    cls
    goto publish
)

echo.
echo Publish operation complete!
pause
cls
goto main_menu

:: Documentation
:documentation
echo Select documentation option:
echo.
echo [1] Start documentation dev server
echo [2] Build documentation
echo [3] Deploy documentation
echo [4] Back to main menu
echo.

set /p docs_choice="Enter your choice (1-4): "
echo.

if "%docs_choice%"=="1" (
    echo Starting documentation dev server...
    cd "%FRAMEWORK_DIR%"
    call npm run docs:dev
)
if "%docs_choice%"=="2" (
    echo Building documentation...
    cd "%FRAMEWORK_DIR%"
    call npm run docs:build
)
if "%docs_choice%"=="3" (
    echo Deploying documentation...
    cd "%FRAMEWORK_DIR%"
    call npm run docs:deploy
)
if "%docs_choice%"=="4" (
    cls
    goto main_menu
)

if "%docs_choice%" NEQ "1" if "%docs_choice%" NEQ "2" if "%docs_choice%" NEQ "3" if "%docs_choice%" NEQ "4" (
    echo Invalid choice. Please try again.
    timeout /t 2 >nul
    cls
    goto documentation
)

echo.
echo Documentation operation complete!
pause
cls
goto main_menu

:: Exit
:exit
echo Thank you for using KALXJS Developer Tools!
echo.
endlocal
exit /b 0