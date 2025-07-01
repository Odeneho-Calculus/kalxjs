#!/bin/bash

# Clear the debug file
echo "" > letdebug.txt

# Run the tests with verbose output
echo "Running tests and capturing output to letdebug.txt..."
npx jest --verbose --no-cache "tests/**/*.test.js" > letdebug.txt 2>&1

# Show a success message
echo "Tests completed. Output saved to letdebug.txt"

# Show the last few lines of the output
echo "Last few lines of test output:"
tail -n 20 letdebug.txt