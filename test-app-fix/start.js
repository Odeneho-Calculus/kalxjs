#!/usr/bin/env node
/**
 * KalxJS Application Starter
 * This script helps start your KalxJS application with proper configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Helper function to log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Helper function to ensure a directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

// Check if index.html exists in both root and public directory
function checkIndexHtml() {
  const rootIndexPath = path.join(process.cwd(), 'index.html');
  const publicIndexPath = path.join(process.cwd(), 'public', 'index.html');

  if (!fileExists(rootIndexPath) && !fileExists(publicIndexPath)) {
    log('⚠️ No index.html found in root or public directory', colors.yellow);

    // Create a basic index.html file
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>KalxJS Application</title>
  <style>
    :root {
      --primary-color: #42b883;
      --primary-color-dark: #35a070;
      --secondary-color: #35495e;
      --bg-color: white;
      --text-color: #333;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: var(--bg-color);
      color: var(--text-color);
    }

    #app {
      min-height: 100vh;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
    }

    .loading h1 {
      color: var(--primary-color);
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .loading p {
      color: var(--secondary-color);
      margin-bottom: 2rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(66, 184, 131, 0.2);
      border-radius: 50%;
      border-top-color: var(--primary-color);
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    #router-view {
      min-height: calc(100vh - 120px);
      padding: 20px;
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="loading">
      <h1>KalxJS Application</h1>
      <p>Loading application...</p>
      <div class="spinner"></div>
    </div>
    <div id="router-view"></div>
  </div>
  <script type="module" src="/app/main.js"></script>
</body>
</html>`;

    // Create in both locations to be safe
    ensureDir(path.join(process.cwd(), 'public'));
    fs.writeFileSync(rootIndexPath, indexHtml);
    fs.writeFileSync(publicIndexPath, indexHtml);

    log('✅ Created index.html files', colors.green);
  }
}

// Check if vite.config.js exists and has proper configuration
function checkViteConfig() {
  const viteConfigPath = path.join(process.cwd(), 'vite.config.js');

  if (!fileExists(viteConfigPath)) {
    log('⚠️ No vite.config.js found', colors.yellow);

    // Create a basic vite.config.js file
    const viteConfig = `import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
      '@core': path.resolve(__dirname, './app/core'),
      '@components': path.resolve(__dirname, './app/components'),
      '@assets': path.resolve(__dirname, './app/assets'),
      '@config': path.resolve(__dirname, './config')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow connections from all network interfaces
    open: true,
    strictPort: false,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: true
  }
});
`;

    fs.writeFileSync(viteConfigPath, viteConfig);
    log('✅ Created vite.config.js', colors.green);
  } else {
    // Check if the vite config has the host setting
    const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf8');
    if (!viteConfigContent.includes('host:') || !viteConfigContent.includes('0.0.0.0')) {
      log('⚠️ Vite config might not have proper host configuration', colors.yellow);
      log('  Consider adding "host: \'0.0.0.0\'" to the server section', colors.yellow);
    }
  }
}

// Main function to start the application
async function startApp() {
  try {
    log('🚀 Starting KalxJS Application...', colors.cyan + colors.bright);

    // Check for required files and fix if needed
    checkIndexHtml();
    checkViteConfig();

    // Check if node_modules exists
    if (!fileExists(path.join(process.cwd(), 'node_modules'))) {
      log('📦 Installing dependencies...', colors.magenta);
      try {
        execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
      } catch (err) {
        log('⚠️ Failed to install dependencies with --legacy-peer-deps, trying with --force', colors.yellow);
        execSync('npm install --force', { stdio: 'inherit' });
      }
    }

    // Start the development server
    log('🌐 Starting development server...', colors.green);
    execSync('npm run dev', { stdio: 'inherit' });

  } catch (error) {
    log('❌ Error starting application:', colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run the app
startApp();
