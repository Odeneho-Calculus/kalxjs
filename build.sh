#!/bin/bash

# Build script for KalxJS

echo "Building KalxJS framework..."

# Create dist directory if it doesn't exist
mkdir -p packages/core/dist

# Build the core package
echo "Building core package..."
cd packages/core
npx rollup -c rollup.config.js

echo "Build completed successfully!"
echo "The following files have been generated:"
ls -la dist/

echo "KalxJS is ready to use!"