#!/usr/bin/env node
/**
 * KalxJS Project Initializer
 * 
 * This script initializes a new KalxJS project with proper configuration
 * and ensures all necessary files and directories are created.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get project name from command line arguments
const projectName = process.argv[2];

if (!projectName) {
  console.error('❌ Please provide a project name');
  console.log('Usage: npx create-kalxjs-app my-app');
  process.exit(1);
}

console.log(`🚀 Creating KalxJS project: ${projectName}`);

// Create project directory
if (!fs.existsSync(projectName)) {
  fs.mkdirSync(projectName);
} else {
  console.error(`❌ Directory ${projectName} already exists`);
  process.exit(1);
}

// Change to project directory
process.chdir(projectName);

// Initialize package.json
console.log('📦 Initializing package.json...');
execSync('npm init -y');

// Update package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.name = projectName;
packageJson.version = '0.1.0';
packageJson.private = true;
packageJson.scripts = {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "lint": "eslint . --ext .js",
  "lint:fix": "eslint . --ext .js --fix"
};
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

// Install dependencies
console.log('📦 Installing dependencies...');
execSync('npm install @kalxjs/core @kalxjs/cli @kalxjs/router @kalxjs/store @kalxjs/state @kalxjs/utils');
execSync('npm install vite sass vitest @testing-library/dom eslint --save-dev');

// Create project structure
console.log('📂 Creating project structure...');

// Create directories
const directories = [
  'app',
  'app/core',
  'app/components',
  'app/pages',
  'app/assets',
  'app/styles',
  'app/navigation',
  'app/state',
  'app/extensions',
  'config',
  'public',
  'public/assets'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});