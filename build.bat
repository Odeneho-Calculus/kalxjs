@echo off
echo Building KalxJS framework...

REM Create dist directory if it doesn't exist
if not exist packages\core\dist mkdir packages\core\dist

REM Build the core package
echo Building core package...
cd packages\core
npx rollup -c rollup.config.js
cd ..\..

echo Build completed successfully!
echo The following files have been generated:
dir packages\core\dist

echo KalxJS is ready to use!