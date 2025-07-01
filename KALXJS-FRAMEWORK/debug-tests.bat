@echo off
echo Running tests and capturing output to letdebug.txt...

:: Clear the debug file
echo. > letdebug.txt

:: Run the tests with verbose output
npx jest --verbose --no-cache "tests/**/*.test.js" > letdebug.txt 2>&1

:: Show a success message
echo Tests completed. Output saved to letdebug.txt

:: Show the last few lines of the output (using PowerShell to get the last 20 lines)
echo Last few lines of test output:
powershell -Command "Get-Content -Tail 20 letdebug.txt"

pause