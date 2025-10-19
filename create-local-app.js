#!/usr/bin/env node
/**
 * KalxJS Local App Initializer
 * 
 * This script initializes a new KalxJS local application with proper configuration
 * and ensures all necessary files and directories are created.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get project name from command line arguments
const projectName = process.argv[2];

if (!projectName) {
    console.error('❌ Please provide a project name');
    console.log('Usage: node create-local-app.js my-app');
    process.exit(1);
}

console.log(`🚀 Creating KalxJS local app: ${projectName}`);

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

// Create main.js
console.log('📝 Creating main application files...');
const mainJs = `import { createApp, h } from '@kalxjs/core';
import { createRouter, RouterView } from '@kalxjs/router';
import App from './app/App.js';

// Create router instance
const router = createRouter({
  mode: 'hash',
  routes: [
    { path: '/', component: () => import('./app/pages/Home.js') },
    { path: '/about', component: () => import('./app/pages/About.js') },
    { path: '*', component: () => import('./app/pages/NotFound.js') }
  ]
});

// Create the app
const app = createApp(App);

// Install the router
app.use(router);

// Mount the app
app.mount('#app');
`;
fs.writeFileSync('main.js', mainJs);

// Create index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} - KalxJS App</title>
  <link rel="stylesheet" href="/app/styles/main.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/main.js"></script>
</body>
</html>
`;
fs.writeFileSync('index.html', indexHtml);

// Create App.js
const appJs = `import { h } from '@kalxjs/core';
import { RouterView } from '@kalxjs/router';
import Navigation from './components/Navigation.js';

export default {
  setup() {
    return () => h('div', { class: 'app-container' }, [
      h('header', {}, [
        h('h1', {}, '${projectName}'),
        h(Navigation)
      ]),
      h('main', {}, [
        h(RouterView)
      ]),
      h('footer', {}, [
        h('p', {}, '© ${new Date().getFullYear()} - Built with KalxJS')
      ])
    ]);
  }
};
`;
fs.writeFileSync('app/App.js', appJs);

// Create Navigation component
const navigationJs = `import { h } from '@kalxjs/core';
import { RouterLink, useRouter } from '@kalxjs/router';

export default {
  setup() {
    const { isActive } = useRouter();
    
    return () => h('nav', { class: 'main-navigation' }, [
      h(RouterLink, {
        to: '/',
        class: isActive('/') ? 'active' : ''
      }, { default: () => 'Home' }),
      
      h(RouterLink, {
        to: '/about',
        class: isActive('/about') ? 'active' : ''
      }, { default: () => 'About' })
    ]);
  }
};
`;
fs.writeFileSync('app/components/Navigation.js', navigationJs);

// Create Home page
const homeJs = `import { h } from '@kalxjs/core';
import { onMounted } from '@kalxjs/core';

export default {
  setup() {
    onMounted(() => {
      console.log('Home page mounted');
    });
    
    return () => h('div', { class: 'home-page' }, [
      h('h2', {}, 'Welcome to ${projectName}'),
      h('p', {}, 'This is a KalxJS application. Edit app/pages/Home.js to customize this page.')
    ]);
  }
};
`;
fs.writeFileSync('app/pages/Home.js', homeJs);

// Create About page
const aboutJs = `import { h } from '@kalxjs/core';

export default {
  setup() {
    return () => h('div', { class: 'about-page' }, [
      h('h2', {}, 'About'),
      h('p', {}, 'This is the about page of your KalxJS application.')
    ]);
  }
};
`;
fs.writeFileSync('app/pages/About.js', aboutJs);

// Create NotFound page
const notFoundJs = `import { h } from '@kalxjs/core';

export default {
  setup() {
    return () => h('div', { class: 'not-found-page' }, [
      h('h2', {}, '404 - Page Not Found'),
      h('p', {}, 'The page you are looking for does not exist.')
    ]);
  }
};
`;
fs.writeFileSync('app/pages/NotFound.js', notFoundJs);

// Create CSS file
const cssContent = `/* Main styles for ${projectName} */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  line-height: 1.6;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  margin-bottom: 20px;
}

.main-navigation {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.main-navigation a {
  text-decoration: none;
  color: #333;
}

.main-navigation a.active {
  font-weight: bold;
  color: #0066cc;
}

footer {
  margin-top: 40px;
  text-align: center;
  color: #666;
}
`;
fs.writeFileSync('app/styles/main.css', cssContent);

// Create vite.config.js
const viteConfig = `export default {
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    minify: true
  }
};
`;
fs.writeFileSync('vite.config.js', viteConfig);

// Create README.md
const readme = `# ${projectName}

A KalxJS local application.

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
\`\`\`

## Project Structure

- \`app/\`: Application source code
  - \`components/\`: Reusable UI components
  - \`pages/\`: Page components
  - \`styles/\`: CSS styles
  - \`App.js\`: Main application component
- \`public/\`: Static assets
- \`main.js\`: Application entry point
- \`index.html\`: HTML template

## Built With

- KalxJS - A lightweight JavaScript framework
- Vite - Next generation frontend tooling
`;
fs.writeFileSync('README.md', readme);

// Create .gitignore
const gitignore = `# Dependencies
node_modules/

# Build output
dist/

# Environment variables
.env
.env.local

# Editor directories and files
.vscode/
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# System Files
.DS_Store
Thumbs.db
`;
fs.writeFileSync('.gitignore', gitignore);

console.log('✅ Local app created successfully!');
console.log(`
To get started:
  cd ${projectName}
  npm run dev
`);