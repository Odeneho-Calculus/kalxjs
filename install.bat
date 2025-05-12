@echo off
echo Installing KalxJS dependencies...

REM Install dependencies
npm install

REM Build the framework
call build.bat

echo KalxJS has been installed and built successfully!
echo You can now use KalxJS in your projects.