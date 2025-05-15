#!/usr/bin/env node
/**
 * KalxJS Application Launcher
 * 
 * This script starts a KalxJS application with proper configuration.
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the app directory
const appDir = process.argv[2] || '.';
const fullAppDir = path.resolve(appDir);

// Check if the directory exists
if (!fs.existsSync(fullAppDir)) {
    console.error(`Error: Directory ${fullAppDir} not found`);
    process.exit(1);
}

// Check if it's a KalxJS app
const packageJsonPath = path.join(fullAppDir, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.error(`Error: No package.json found in ${fullAppDir}`);
    process.exit(1);
}

try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasKalxDependency = Object.keys(packageJson.dependencies || {})
        .some(dep => dep.startsWith('@kalxjs/'));

    if (!hasKalxDependency) {
        console.warn('Warning: This does not appear to be a KalxJS application');
        console.warn('Continuing anyway...');
    }
} catch (error) {
    console.error('Error reading package.json:', error.message);
}

console.log('Starting the application...');
console.log('App directory:', fullAppDir);

// Change to the app directory and run the dev server
const child = exec(`cd "${fullAppDir}" && npm run dev`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return;
    }
    console.log(`Stdout: ${stdout}`);
});

// Forward the output to the console
child.stdout.on('data', (data) => {
    console.log(data.toString());
});

child.stderr.on('data', (data) => {
    console.error(data.toString());
});

console.log('Server starting...');
console.log('Press Ctrl+C to stop the server');