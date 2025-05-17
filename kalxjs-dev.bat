@echo off
setlocal enabledelayedexpansion

:: KALXJS Framework Developer Tools
:: This batch file provides an easy interface for common development tasks

:: Check for ANSI color support
for /f "tokens=3" %%a in ('reg query HKCU\Console /v VirtualTerminalLevel 2^>nul ^| find "0x1"') do (
    set "ANSI_SUPPORT=yes"
)

:: Set colors based on terminal support
if defined ANSI_SUPPORT (
    :: ANSI color codes for terminals that support it
    set "CYAN=[36m"
    set "GREEN=[32m"
    set "YELLOW=[33m"
    set "RED=[31m"
    set "MAGENTA=[35m"
    set "BLUE=[34m"
    set "WHITE=[37m"
    set "BRIGHT=[1m"
    set "RESET=[0m"
) else (
    :: Fallback for terminals without ANSI support
    set "CYAN="
    set "GREEN="
    set "YELLOW="
    set "RED="
    set "MAGENTA="
    set "BLUE="
    set "WHITE="
    set "BRIGHT="
    set "RESET="
)

:: Set framework directory
set "FRAMEWORK_DIR=%~dp0KALXJS-FRAMEWORK"

:: Check if we're in the right directory
if not exist "%FRAMEWORK_DIR%" (
    echo %RED%Error: KALXJS-FRAMEWORK directory not found.%RESET%
    echo Please run this script from the root of the kaljs repository.
    exit /b 1
)

:: Display header
cls

:: Enable ANSI escape sequences if supported
if defined ANSI_SUPPORT (
    echo %CYAN%%BRIGHT%
) else (
    echo.
)

echo  _  __    _    _     __  __     _  ____    _____ ____      _    __  __ _______        _____  ____  _  __
echo ^| ^|/ /   / \  ^| ^|   \ \/ /    ^| ^|/ ___^|  ^|  ___^|  _ \    / \  ^|  \/  ^|  ___\ \      / / _ \^|  _ \^| ^|/ /
echo ^| ' /   / _ \ ^| ^|    \  /_____^| ^|\___ \  ^| ^|_  ^| ^|_) ^|  / _ \ ^| ^|\/^| ^| ^|_   \ \ /\ / / ^| ^| ^| ^|_) ^| ' / 
echo ^| . \  / ___ \^| ^|___ /  \^|_____^| ^| ___) ^| ^|  _^| ^|  _ ^<  / ___ \^| ^|  ^| ^|  _^|   \ V  V /^| ^|_^| ^|  _ ^<^| . \ 
echo ^|_^|\_\/_/   \_\^|_____/_/\_\     ^|_^|^|____/  ^|_^|   ^|_^| \_\/_/   \_\_^|  ^|_^|_^|      \_/\_/  \___/^|_^| \_\_^|\_\
echo.
echo %RESET%%BRIGHT%Developer Tools%RESET%
echo.

:: Main menu function
:main_menu
echo %CYAN%%BRIGHT%Choose an operation:%RESET%
echo.
echo %WHITE%%BRIGHT%[1]%RESET% %GREEN%Build Framework%RESET%        - Build all packages
echo %WHITE%%BRIGHT%[2]%RESET% %GREEN%Build Package%RESET%         - Build a specific package
echo %WHITE%%BRIGHT%[3]%RESET% %YELLOW%Clean%RESET%                - Clean node_modules and build artifacts
echo %WHITE%%BRIGHT%[4]%RESET% %BLUE%Install Dependencies%RESET%   - Install all dependencies
echo %WHITE%%BRIGHT%[5]%RESET% %MAGENTA%Run Tests%RESET%             - Run test suite
echo %WHITE%%BRIGHT%[6]%RESET% %CYAN%Create Project%RESET%        - Create a new KALXJS project
echo %WHITE%%BRIGHT%[7]%RESET% %YELLOW%Lint Code%RESET%            - Run ESLint on all packages
echo %WHITE%%BRIGHT%[8]%RESET% %GREEN%Publish%RESET%              - Publish packages to npm
echo %WHITE%%BRIGHT%[9]%RESET% %BLUE%Documentation%RESET%        - Build or serve documentation
echo %WHITE%%BRIGHT%[10]%RESET% %RED%Exit%RESET%                 - Exit this tool
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

echo %RED%Invalid choice. Please try again.%RESET%
timeout /t 2 >nul
cls
goto main_menu

:: Build all packages
:build_all
echo %CYAN%%BRIGHT%Building all packages...%RESET%
cd "%FRAMEWORK_DIR%"
call npm run build
echo.
echo %GREEN%Build complete!%RESET%
pause
cls
goto main_menu

:: Build specific package
:build_package
echo %CYAN%%BRIGHT%Select a package to build:%RESET%
echo.
echo %WHITE%%BRIGHT%[1]%RESET% Core
echo %WHITE%%BRIGHT%[2]%RESET% Router
echo %WHITE%%BRIGHT%[3]%RESET% State
echo %WHITE%%BRIGHT%[4]%RESET% CLI
echo %WHITE%%BRIGHT%[5]%RESET% DevTools
echo %WHITE%%BRIGHT%[6]%RESET% Composition
echo %WHITE%%BRIGHT%[7]%RESET% Performance
echo %WHITE%%BRIGHT%[8]%RESET% Plugins
echo %WHITE%%BRIGHT%[9]%RESET% API
echo %WHITE%%BRIGHT%[10]%RESET% Back to main menu
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
    echo %RED%Invalid choice. Please try again.%RESET%
    timeout /t 2 >nul
    cls
    goto build_package
)

echo %CYAN%%BRIGHT%Building %pkg_name% package...%RESET%
cd "%FRAMEWORK_DIR%"
call npm run build:%pkg_name%
echo.
echo %GREEN%Build complete!%RESET%
pause
cls
goto main_menu

:: Clean
:clean
echo %YELLOW%%BRIGHT%Cleaning node_modules and build artifacts...%RESET%
cd "%FRAMEWORK_DIR%"
call npm run clean
echo.
echo %GREEN%Clean complete!%RESET%
pause
cls
goto main_menu

:: Install dependencies
:install
echo %BLUE%%BRIGHT%Installing dependencies...%RESET%
cd "%FRAMEWORK_DIR%"
call npm install
echo.
echo %GREEN%Installation complete!%RESET%
pause
cls
goto main_menu

:: Run tests
:tests
echo %MAGENTA%%BRIGHT%Select test option:%RESET%
echo.
echo %WHITE%%BRIGHT%[1]%RESET% Run all tests
echo %WHITE%%BRIGHT%[2]%RESET% Run tests with watch mode
echo %WHITE%%BRIGHT%[3]%RESET% Run tests with coverage
echo %WHITE%%BRIGHT%[4]%RESET% Clear Jest cache
echo %WHITE%%BRIGHT%[5]%RESET% Back to main menu
echo.

set /p test_choice="Enter your choice (1-5): "
echo.

if "%test_choice%"=="1" (
    echo %MAGENTA%%BRIGHT%Running all tests...%RESET%
    cd "%FRAMEWORK_DIR%"
    call npm test
)
if "%test_choice%"=="2" (
    echo %MAGENTA%%BRIGHT%Running tests in watch mode...%RESET%
    cd "%FRAMEWORK_DIR%"
    call npm run test:watch
)
if "%test_choice%"=="3" (
    echo %MAGENTA%%BRIGHT%Running tests with coverage...%RESET%
    cd "%FRAMEWORK_DIR%"
    call npm run test:coverage
)
if "%test_choice%"=="4" (
    echo %MAGENTA%%BRIGHT%Clearing Jest cache...%RESET%
    cd "%FRAMEWORK_DIR%"
    call npm run clear-jest-cache
)
if "%test_choice%"=="5" (
    cls
    goto main_menu
)

if "%test_choice%" NEQ "1" if "%test_choice%" NEQ "2" if "%test_choice%" NEQ "3" if "%test_choice%" NEQ "4" if "%test_choice%" NEQ "5" (
    echo %RED%Invalid choice. Please try again.%RESET%
    timeout /t 2 >nul
    cls
    goto tests
)

echo.
echo %GREEN%Tests complete!%RESET%
pause
cls
goto main_menu

:: Create project
:create_project
echo %CYAN%%BRIGHT%Create a new KALXJS project%RESET%
echo.
set /p project_name="Enter project name: "

if "%project_name%"=="" (
    echo %RED%Project name cannot be empty.%RESET%
    timeout /t 2 >nul
    cls
    goto create_project
)

echo.
echo %CYAN%Select features to include:%RESET%
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
echo %CYAN%%BRIGHT%Creating project %project_name%...%RESET%
cd "%FRAMEWORK_DIR%"
call npm run create -- %project_name% %options%
echo.
echo %GREEN%Project created!%RESET%
pause
cls
goto main_menu

:: Lint code
:lint
echo %YELLOW%%BRIGHT%Linting code...%RESET%
cd "%FRAMEWORK_DIR%"
call npm run lint
echo.
echo %GREEN%Linting complete!%RESET%
pause
cls
goto main_menu

:: Publish packages
:publish
echo %GREEN%%BRIGHT%Select publish option:%RESET%
echo.
echo %WHITE%%BRIGHT%[1]%RESET% Publish all packages
echo %WHITE%%BRIGHT%[2]%RESET% Publish from package
echo %WHITE%%BRIGHT%[3]%RESET% Publish canary version
echo %WHITE%%BRIGHT%[4]%RESET% Bump version
echo %WHITE%%BRIGHT%[5]%RESET% Back to main menu
echo.

set /p publish_choice="Enter your choice (1-5): "
echo.

if "%publish_choice%"=="1" (
    echo %GREEN%%BRIGHT%Publishing all packages...%RESET%
    cd "%FRAMEWORK_DIR%"
    call npm run publish
)
if "%publish_choice%"=="2" (
    echo %GREEN%%BRIGHT%Publishing from package...%RESET%
    cd "%FRAMEWORK_DIR%"
    call npm run publish:from-package
)
if "%publish_choice%"=="3" (
    echo %GREEN%%BRIGHT%Publishing canary version...%RESET%
    cd "%FRAMEWORK_DIR%"
    call npm run publish:canary
)
if "%publish_choice%"=="4" (
    echo %GREEN%%BRIGHT%Bumping version...%RESET%
    cd "%FRAMEWORK_DIR%"
    call npm run version:bump
)
if "%publish_choice%"=="5" (
    cls
    goto main_menu
)

if "%publish_choice%" NEQ "1" if "%publish_choice%" NEQ "2" if "%publish_choice%" NEQ "3" if "%publish_choice%" NEQ "4" if "%publish_choice%" NEQ "5" (
    echo %RED%Invalid choice. Please try again.%RESET%
    timeout /t 2 >nul
    cls
    goto publish
)

echo.
echo %GREEN%Publish operation complete!%RESET%
pause
cls
goto main_menu

:: Documentation
:documentation
echo %BLUE%%BRIGHT%Select documentation option:%RESET%
echo.
echo %WHITE%%BRIGHT%[1]%RESET% Start documentation dev server
echo %WHITE%%BRIGHT%[2]%RESET% Build documentation
echo %WHITE%%BRIGHT%[3]%RESET% Deploy documentation
echo %WHITE%%BRIGHT%[4]%RESET% Back to main menu
echo.

set /p docs_choice="Enter your choice (1-4): "
echo.

if "%docs_choice%"=="1" (
    echo %BLUE%%BRIGHT%Starting documentation dev server...%RESET%
    cd "%FRAMEWORK_DIR%"
    call npm run docs:dev
)
if "%docs_choice%"=="2" (
    echo %BLUE%%BRIGHT%Building documentation...%RESET%
    cd "%FRAMEWORK_DIR%"
    call npm run docs:build
)
if "%docs_choice%"=="3" (
    echo %BLUE%%BRIGHT%Deploying documentation...%RESET%
    cd "%FRAMEWORK_DIR%"
    call npm run docs:deploy
)
if "%docs_choice%"=="4" (
    cls
    goto main_menu
)

if "%docs_choice%" NEQ "1" if "%docs_choice%" NEQ "2" if "%docs_choice%" NEQ "3" if "%docs_choice%" NEQ "4" (
    echo %RED%Invalid choice. Please try again.%RESET%
    timeout /t 2 >nul
    cls
    goto documentation
)

echo.
echo %GREEN%Documentation operation complete!%RESET%
pause
cls
goto main_menu

:: Exit
:exit
echo %CYAN%%BRIGHT%Thank you for using KALXJS Developer Tools!%RESET%
echo.
endlocal
exit /b 0