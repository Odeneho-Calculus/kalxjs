# Advanced CLI Usage Guide

Advanced techniques, customizations, and integrations for power users.

## Table of Contents

1. [Custom Templates](#custom-templates)
2. [Configuration Files](#configuration-files)
3. [Environment Setup](#environment-setup)
4. [Programmatic API](#programmatic-api)
5. [CI/CD Integration](#cicd-integration)
6. [Performance Optimization](#performance-optimization)
7. [Debugging](#debugging)

---

## Custom Templates

### Creating Custom Project Templates

Create a custom template directory:

```
my-custom-template/
├── src/
│   ├── components/
│   ├── App.js
│   └── main.js
├── public/
├── package.json
├── vite.config.js
└── .kalxjstemplate        # Identifies as KalxJS template
```

### Using Custom Templates

```bash
# Point to local template directory
kalxjs create my-app --template ./my-custom-template

# Or use template from npm
npm install my-kalxjs-template
kalxjs create my-app --template my-kalxjs-template
```

### Template Structure

**package.json:**
```json
{
  "name": "my-kalxjs-template",
  "version": "1.0.0",
  "kalxjsTemplate": {
    "description": "Custom KalxJS template",
    "features": ["router", "state", "testing"],
    "author": "Your Name"
  }
}
```

**.kalxjstemplate:**
```json
{
  "ignore": [".git", "node_modules"],
  "variables": {
    "projectName": "{{projectName}}",
    "author": "{{author}}"
  }
}
```

### Distributing Templates

1. Create template repository
2. Add `.kalxjstemplate` marker file
3. Publish to npm:

```bash
npm publish
```

4. Users can install:
```bash
kalxjs create my-app --template my-org/my-template
```

---

## Configuration Files

### kalxjs.config.js

Create in project root for CLI customization:

```javascript
module.exports = {
  // Component generation defaults
  component: {
    apiStyle: 'composition',  // 'options' or 'composition'
    defaultStyle: 'scss',     // 'css', 'scss', or null
    includeTest: true,
    testLocation: 'src/__tests__'
  },

  // Store generation defaults
  store: {
    style: 'pinia',           // 'pinia' or 'vuex'
    persist: true,
    location: 'src/stores'
  },

  // Generation paths
  paths: {
    components: 'src/components',
    stores: 'src/stores',
    pages: 'src/pages',
    routes: 'src/router/routes',
    views: 'src/views',
    composables: 'src/composables',
    utils: 'src/utils'
  },

  // Development server
  devServer: {
    port: 3000,
    https: false,
    openBrowser: true
  },

  // Build options
  build: {
    outDir: 'dist',
    sourcemaps: false,
    analyzeBundle: false
  },

  // Logging
  logging: {
    level: 'info',           // 'debug', 'info', 'warn', 'error'
    colors: true
  }
};
```

### .env Configuration

Create `.env` file in project root:

```bash
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_API_TIMEOUT=30000

# App Configuration
VITE_APP_NAME=My KalxJS App
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true

# Deployment
VITE_PUBLIC_PATH=/

# CLI Settings
KALXJS_SKIP_PROMPTS=false
KALXJS_AUTO_INSTALL=true
KALXJS_VERBOSE=false
```

Use in code:

```javascript
const apiUrl = import.meta.env.VITE_API_URL;
const timeout = parseInt(import.meta.env.VITE_API_TIMEOUT);
const appName = import.meta.env.VITE_APP_NAME;

if (import.meta.env.VITE_ENABLE_DEBUG) {
  console.log('Debug mode enabled');
}
```

---

## Environment Setup

### Per-Project Environment Variables

Create `.env.local` (not git-tracked):

```bash
VITE_API_TOKEN=your_secret_token
VITE_DB_PASSWORD=secret_password
```

### Environment-Specific Builds

Create multiple `.env` files:

```bash
.env                  # Shared
.env.development      # Development
.env.production       # Production
.env.staging          # Staging
.env.local            # Local (git-ignored)
```

Build for specific environment:

```bash
# Development
VITE_ENV=development kalxjs build

# Staging
VITE_ENV=staging kalxjs build

# Production
VITE_ENV=production kalxjs build
```

### CI/CD Environment Variables

GitHub Actions example:

```yaml
jobs:
  build:
    env:
      VITE_API_URL: ${{ secrets.VITE_API_URL }}
      VITE_API_TOKEN: ${{ secrets.VITE_API_TOKEN }}
    steps:
      - run: kalxjs build
```

---

## Programmatic API

Use KalxJS CLI from Node.js scripts:

### Installation

```bash
npm install @kalxjs/cli
```

### Creating Projects Programmatically

```javascript
const { create } = require('@kalxjs/cli/dist/src/commands');

async function createProject() {
  await create('my-app', {
    router: true,
    state: true,
    scss: true,
    skipInstall: false,
    skipPrompts: true
  });

  console.log('Project created!');
}

createProject().catch(console.error);
```

### Generating Components

```javascript
const { component } = require('@kalxjs/cli/dist/src/commands');

async function generateComponent() {
  await component('Button', {
    dir: 'src/ui',
    style: 'scss',
    test: true,
    props: true,
    methods: true
  });
}

generateComponent().catch(console.error);
```

### Building Projects

```javascript
const { build } = require('@kalxjs/cli/dist/src/commands');

async function buildProject() {
  await build({
    verbose: true,
    output: 'dist',
    analyze: true
  });
}

buildProject().catch(console.error);
```

### Custom Build Script

Create `scripts/generate-components.js`:

```javascript
const { component } = require('@kalxjs/cli/dist/src/commands');

const components = [
  'Button',
  'Card',
  'Modal',
  'Input',
  'Select'
];

async function generateAll() {
  for (const comp of components) {
    console.log(`Generating ${comp}...`);
    await component(comp, {
      style: 'scss',
      test: true,
      dir: 'src/components'
    });
  }
  console.log('✅ All components generated!');
}

generateAll().catch(console.error);
```

Run:
```bash
node scripts/generate-components.js
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/build.yml`:

```yaml
name: Build

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x]

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}

    - name: Install dependencies
      run: npm install

    - name: Run tests
      run: npm test

    - name: Build
      env:
        VITE_API_URL: ${{ secrets.VITE_API_URL }}
      run: kalxjs build

    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v1.2
      with:
        publish-dir: './dist'
        production-branch: main
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  image: node:18
  script:
    - npm install
    - npm run build
  artifacts:
    paths:
      - dist
    expire_in: 1 day

test:
  stage: test
  image: node:18
  script:
    - npm install
    - npm test

deploy:
  stage: deploy
  image: node:18
  script:
    - npm install
    - kalxjs build
  environment:
    name: production
  only:
    - main
```

### Jenkins Pipeline

Create `Jenkinsfile`:

```groovy
pipeline {
  agent any

  stages {
    stage('Build') {
      steps {
        sh 'npm install'
        sh 'kalxjs build'
      }
    }

    stage('Test') {
      steps {
        sh 'npm test'
      }
    }

    stage('Deploy') {
      when {
        branch 'main'
      }
      steps {
        sh 'deploy.sh'
      }
    }
  }

  post {
    always {
      junit 'test-results/**/*.xml'
    }
  }
}
```

---

## Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
kalxjs build --analyze

# Build without source maps (smaller)
kalxjs build --no-sourcemaps

# Build with compression
kalxjs build --compress gzip
```

### Development Server Optimization

```javascript
// vite.config.js
export default {
  server: {
    middlewareMode: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    }
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      '@kalxjs/core',
      '@kalxjs/router'
    ],
    exclude: ['some-large-package']
  }
};
```

### Code Splitting Strategy

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            '@kalxjs/core',
            '@kalxjs/router',
            '@kalxjs/store'
          ],
          utils: [
            'src/utils',
            'src/helpers'
          ]
        }
      }
    }
  }
};
```

### Lazy Loading Components

```javascript
import { defineAsyncComponent } from '@kalxjs/core';

const HeavyComponent = defineAsyncComponent(() =>
  import('./components/HeavyComponent.js')
);

export default {
  components: { HeavyComponent }
};
```

---

## Debugging

### Enable Debug Logging

```bash
# View detailed CLI operations
DEBUG=kalxjs* kalxjs create my-app

# View Vite debug info
DEBUG=vite* kalxjs serve

# View all debug info
DEBUG=* kalxjs build
```

### CLI Verbose Mode

```bash
# Enable verbose output
kalxjs create my-app --verbose

# For build
kalxjs build --verbose
```

### Environment Variable Logging

```bash
# Enable CLI verbose logging
KALXJS_VERBOSE=true kalxjs create my-app

# Enable debug mode
KALXJS_DEBUG=true kalxjs generate component Button
```

### Development Server Inspection

In browser console:

```javascript
// Check app instance
console.log(__KALXJS_DEVTOOLS_HOOK__)

// Check component
console.log(app._context)

// Check store
console.log(store.user)
```

### Build Analysis

```bash
# Generate bundle report
kalxjs build --analyze

# Shows:
# - Module sizes
# - Duplicate modules
# - Optimization opportunities
```

### Test Debugging

```bash
# Run tests in debug mode
NODE_DEBUG_PORT=9229 npm test

# Or with inspector
node --inspect-brk ./node_modules/jest/bin/jest.js
```

---

## Advanced Patterns

### Monorepo Support

For monorepo projects, create shared templates:

```
monorepo/
├── packages/
│   ├── shared-template/
│   ├── app-1/
│   └── app-2/
└── lerna.json
```

Create apps from shared template:

```bash
kalxjs create app-3 --template ./packages/shared-template
```

### Custom Code Generators

Create `scripts/custom-generator.js`:

```javascript
const fs = require('fs-extra');
const path = require('path');

async function generateFeature(featureName) {
  const basePath = path.join(process.cwd(), 'src/features', featureName);

  // Create directory structure
  await fs.ensureDir(`${basePath}/components`);
  await fs.ensureDir(`${basePath}/stores`);
  await fs.ensureDir(`${basePath}/pages`);

  // Create files
  await fs.writeFile(
    `${basePath}/index.js`,
    `export * from './stores.js';\nexport * from './components/index.js';`
  );

  console.log(`✅ Feature ${featureName} created!`);
}

generateFeature(process.argv[2]).catch(console.error);
```

Run:
```bash
node scripts/custom-generator.js my-feature
```

### Pre-commit Hooks

Using husky and lint-staged:

```bash
npm install husky lint-staged --save-dev
npx husky install
```

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

Create `package.json` config:

```json
{
  "lint-staged": {
    "src/**/*.js": "eslint --fix",
    "src/**/*.{js,css,scss}": "prettier --write"
  }
}
```

---

## Next Steps

- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [API Reference](./API_REFERENCE.md)
- [Commands Reference](./COMMANDS.md)