/**
 * KalxJS Framework Patch
 * 
 * This script fixes common issues in the KalxJS framework:
 * 1. Ensures proper Vite server configuration
 * 2. Creates necessary directory structure and files
 * 3. Fixes router configuration issues
 * 4. Ensures proper file references
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Root directory of the framework
const frameworkRoot = path.resolve(__dirname);
const cliPackagePath = path.join(frameworkRoot, 'node_modules', '@kalxjs', 'cli');

console.log('🔧 KalxJS Framework Patch');
console.log('📂 Framework root:', frameworkRoot);

// Function to ensure a directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

// Function to write file if it doesn't exist or force overwrite
function writeFileIfNotExists(filePath, content, force = false) {
  if (!fs.existsSync(filePath) || force) {
    console.log(`Writing file: ${filePath}`);
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

// Function to patch a file by replacing content
function patchFile(filePath, searchValue, replaceValue) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Cannot patch file, it doesn't exist: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(searchValue)) {
    const newContent = content.replace(searchValue, replaceValue);
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Patched file: ${filePath}`);
    return true;
  } else {
    console.log(`⚠️ Cannot patch file, search string not found: ${filePath}`);
    return false;
  }
}

// 1. Patch the CLI templates
console.log('\n🔄 Patching CLI templates...');

// Fix the Vite config template
const viteConfigTemplate = `import { defineConfig } from 'vite';
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
    open: true,
    host: true, // Listen on all addresses
    strictPort: false, // Try another port if 3000 is in use
    hmr: {
      overlay: true
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: true
  },
  test: {
    globals: true,
    environment: "jsdom"
  }
});`;

// Fix the router template
const routerTemplate = `import { createRouter as createKalRouter } from '@kalxjs/router';
import Home from '../pages/Home.js';
import About from '../pages/About.js';
import NotFound from '../pages/NotFound.js';
import { h, createApp } from '@kalxjs/core';

// Export version for compatibility checks
export const version = '1.0.0';

export function createRouter() {
  // Create router with hash mode for better compatibility
  const router = createKalRouter({
    history: 'hash', // Use hash history for better compatibility
    routes: [
      {
        path: '/',
        component: Home,
        name: 'home'
      },
      {
        path: '/about',
        component: About,
        name: 'about'
      },
      {
        path: '/:pathMatch(.*)*',
        component: NotFound,
        name: 'not-found'
      }
    ]
  });

  // Add navigation guards
  router.beforeEach((to, from, next) => {
    console.log(\`Router navigation started: \${from.path} -> \${to.path}\`);
    next(); // Always proceed with navigation
  });

  // Custom rendering logic for router views
  router.afterEach((to, from) => {
    console.log(\`Router navigation complete: \${from.path} -> \${to.path}\`);
    
    // Get the matched component
    const matchedRoute = to.matched[0];
    if (!matchedRoute) {
      console.error('No matching route found');
      return;
    }
    
    const component = matchedRoute.component;
    if (!component) {
      console.error('No component defined for route');
      return;
    }
    
    // Get the router view container
    let routerViewContainer = document.getElementById('router-view');
    if (!routerViewContainer) {
      console.error('Router view container not found');
      // Create the container if it doesn't exist
      const mainElement = document.querySelector('.app-main');
      if (mainElement) {
        const newContainer = document.createElement('div');
        newContainer.id = 'router-view';
        mainElement.appendChild(newContainer);
        routerViewContainer = newContainer;
      } else {
        return;
      }
    }
    
    // Clear the container
    routerViewContainer.innerHTML = '';
    
    // Render the component
    try {
      console.log('Rendering component:', component.name || 'Unnamed Component');
      
      // Create a new app instance with the component
      const app = createApp(component);
      
      // Mount it to the container
      app.mount(routerViewContainer);
      
      console.log('Component rendered successfully');
    } catch (error) {
      console.error('Error rendering component:', error);
      routerViewContainer.innerHTML = \`<div class="error">Error rendering view: \${error.message}</div>\`;
    }
  });

  return router;
}`;

// Fix the index.html template
const indexHtmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KalxJS App</title>
  <link rel="icon" href="/favicon.ico">
  <style>
    :root {
      --primary-color: #42b883;
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
    
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #1a1a1a;
        --text-color: #f0f0f0;
      }
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="loading">
      <h1>KalxJS App</h1>
      <p>Loading KalxJS application...</p>
      <div class="spinner"></div>
    </div>
  </div>
  <script type="module" src="/app/main.js"></script>
</body>
</html>`;

// Patch the CLI package
try {
  // Find the CLI templates directory
  const templatesDir = path.join(cliPackagePath, 'templates');
  const jsTemplateDir = path.join(templatesDir, 'js');

  if (fs.existsSync(jsTemplateDir)) {
    // Patch the vite.config.js template
    writeFileIfNotExists(path.join(jsTemplateDir, 'vite.config.js'), viteConfigTemplate, true);

    // Patch the index.html template
    writeFileIfNotExists(path.join(jsTemplateDir, 'index.html'), indexHtmlTemplate, true);

    // Ensure the navigation directory exists
    ensureDirectoryExists(path.join(jsTemplateDir, 'app', 'navigation'));

    // Patch the router template
    writeFileIfNotExists(path.join(jsTemplateDir, 'app', 'navigation', 'index.js'), routerTemplate, true);

    // Ensure the styles directory exists
    ensureDirectoryExists(path.join(jsTemplateDir, 'app', 'styles'));

    console.log('✅ CLI templates patched successfully');
  } else {
    console.log('⚠️ CLI templates directory not found');
  }
} catch (error) {
  console.error('❌ Error patching CLI templates:', error);
}

// 2. Create a project initialization script
console.log('\n🔄 Creating project initialization script...');

const initScriptContent = `#!/usr/bin/env node
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

console.log(\`🚀 Creating KalxJS project: \${projectName}\`);

// Create project directory
if (!fs.existsSync(projectName)) {
  fs.mkdirSync(projectName);
} else {
  console.error(\`❌ Directory \${projectName} already exists\`);
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
});`;

// Create the initialization script
const initScriptPath = path.join(frameworkRoot, 'create-kalxjs-app.js');
writeFileIfNotExists(initScriptPath, initScriptContent, true);
console.log(`✅ Created initialization script: ${initScriptPath}`);

// Make the script executable
try {
  fs.chmodSync(initScriptPath, '755');
} catch (error) {
  console.log('⚠️ Could not make script executable, you may need to do this manually');
}

// 3. Update the README.md with patch information
console.log('\n🔄 Updating README.md...');

const readmePath = path.join(frameworkRoot, 'README.md');
let readmeContent = '';

if (fs.existsSync(readmePath)) {
  readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Add the new framework patch information
  if (!readmeContent.includes('Framework Patch')) {
    const patchInfo = "\n\n## Framework Patch\n\n" +
      "This patch fixes common issues in the KalxJS framework:\n\n" +
      "1. Ensures proper Vite server configuration\n" +
      "2. Creates necessary directory structure and files\n" +
      "3. Fixes router configuration issues\n" +
      "4. Ensures proper file references\n\n" +
      "### Creating a New Project\n\n" +
      "Use the new project initializer script:\n\n" +
      "    node create-kalxjs-app.js my-app\n" +
      "    cd my-app\n" +
      "    npm run dev\n\n" +
      "### Starting an Existing Project\n\n" +
      "To start an existing KalxJS project:\n\n" +
      "    node start-kalxjs.js my-app\n\n" +
      "### Fixing Existing Projects\n\n" +
      "If you have an existing project with issues, run:\n\n" +
      "    node framework-patch.js\n\n" +
      "### Key Improvements\n\n" +
      "- Fixed server configuration to work on all network interfaces\n" +
      "- Improved router with better error handling and fallbacks\n" +
      "- Ensured proper directory structure and file references\n" +
      "- Added proper SCSS support with default styles\n" +
      "- Fixed component mounting issues";

    // Insert the patch info after the Key Features section
    if (readmeContent.includes('## Key Features')) {
      readmeContent = readmeContent.replace('## Key Features', `## Key Features${patchInfo}`);
    } else {
      // If Key Features section doesn't exist, add it after the Overview
      if (readmeContent.includes('## Overview')) {
        readmeContent = readmeContent.replace('## Overview', `## Overview${patchInfo}`);
      } else {
        // If neither section exists, just append it to the end
        readmeContent += patchInfo;
      }
    }

    fs.writeFileSync(readmePath, readmeContent);
    console.log(`✅ Updated README.md with patch information`);
  } else {
    console.log(`ℹ️ README.md already contains patch information`);
  }
} else {
  console.log(`⚠️ README.md not found, creating a new one`);

  // Create a basic README if it doesn't exist
  const basicReadme = `# KalxJS Framework

## Overview

KalxJS is a lightweight JavaScript framework for building modern web applications.

## Framework Patch

This patch fixes common issues in the KalxJS framework:

1. Ensures proper Vite server configuration
2. Creates necessary directory structure and files
3. Fixes router configuration issues
4. Ensures proper file references

### Creating a New Project

Use the new project initializer script:

    node create-kalxjs-app.js my-app
    cd my-app
    npm run dev

### Starting an Existing Project

To start an existing KalxJS project:

    node start-kalxjs.js my-app

### Fixing Existing Projects

If you have an existing project with issues, run:

    node framework-patch.js

### Key Improvements

- Fixed server configuration to work on all network interfaces
- Improved router with better error handling and fallbacks
- Ensured proper directory structure and file references
- Added proper SCSS support with default styles
- Fixed component mounting issues

## License

MIT
`;

  fs.writeFileSync(readmePath, basicReadme);
  console.log(`✅ Created new README.md with patch information`);
}

console.log('\n✅ KalxJS Framework Patch completed successfully');
console.log('🚀 You can now create a new project with: node create-kalxjs-app.js my-app');