# CLI Programmatic API Reference

Reference documentation for using KalxJS CLI as a JavaScript module for automation and integration.

## Table of Contents

1. [Installation](#installation)
2. [Core API](#core-api)
3. [Commands API](#commands-api)
4. [Generators API](#generators-api)
5. [Utilities API](#utilities-api)
6. [Events API](#events-api)
7. [Examples](#examples)

---

## Installation

```bash
npm install @kalxjs/cli
```

---

## Core API

### Main Module

```javascript
const cli = require('@kalxjs/cli');

// Available exports
const {
  create,
  component,
  generate,
  serve,
  build,
  version
} = require('@kalxjs/cli/dist/src/commands');
```

### CLI Instance

```javascript
const CLI = require('@kalxjs/cli');

const cli = new CLI({
  cwd: process.cwd(),
  verbose: false
});
```

**Properties:**
- `cwd` (string) — Working directory
- `verbose` (boolean) — Enable verbose logging
- `packageManager` (string) — npm, yarn, or pnpm (auto-detected)

---

## Commands API

### create(projectName, options)

Create a new KalxJS project.

**Signature:**
```javascript
async function create(
  projectName: string,
  options?: CreateOptions
): Promise<void>
```

**Options:**
```typescript
interface CreateOptions {
  router?: boolean;              // Add router
  state?: boolean;               // Add state management
  scss?: boolean;                // Add SCSS support
  testing?: boolean;             // Add testing setup
  linting?: boolean;             // Add ESLint
  skipInstall?: boolean;         // Skip npm install
  skipPrompts?: boolean;         // Use defaults
  cwd?: string;                  // Working directory
  template?: string;             // Custom template path
}
```

**Example:**
```javascript
const { create } = require('@kalxjs/cli/dist/src/commands');

await create('my-app', {
  router: true,
  state: true,
  skipInstall: false
});
```

**Returns:**
- Resolves when project is created
- Rejects with error message on failure

**Error Handling:**
```javascript
try {
  await create('123-invalid');
} catch (error) {
  console.error('Failed:', error.message);
  // "Project name cannot start with a number"
}
```

---

### component(componentName, options)

Generate a component.

**Signature:**
```javascript
async function component(
  componentName: string,
  options?: ComponentOptions
): Promise<void>
```

**Options:**
```typescript
interface ComponentOptions {
  dir?: string;                  // Target directory
  style?: 'css' | 'scss' | null; // Stylesheet type
  test?: boolean;                // Generate test file
  props?: boolean;               // Include props
  state?: boolean;               // Include data state
  methods?: boolean;             // Include methods
  lifecycle?: boolean;           // Include lifecycle hooks
  composition?: boolean;         // Use Composition API
}
```

**Example:**
```javascript
const { component } = require('@kalxjs/cli/dist/src/commands');

await component('Button', {
  dir: 'src/components',
  style: 'scss',
  test: true,
  props: true,
  composition: true
});
```

**Generated Files:**
- `src/components/Button.js` (component)
- `src/styles/components/Button.scss` (with --style)
- `src/components/__tests__/Button.test.js` (with --test)

---

### generate(type, name, options)

Generate various artifacts.

**Signature:**
```javascript
async function generate(
  type: 'component' | 'route' | 'store' | 'page',
  name: string,
  options?: GenerateOptions
): Promise<void>
```

**Options:**
```typescript
interface GenerateOptions {
  dir?: string;
  composition?: boolean;
  style?: 'css' | 'scss' | null;
  test?: boolean;
  persist?: boolean;             // For stores
}
```

**Examples:**
```javascript
const { generate } = require('@kalxjs/cli/dist/src/commands');

// Generate component
await generate('component', 'Card', { style: 'scss' });

// Generate route
await generate('route', 'about', { composition: true });

// Generate store
await generate('store', 'user', { persist: true });

// Generate full page
await generate('page', 'products', {
  composition: true,
  style: 'scss',
  test: true
});
```

---

### serve(options)

Start development server.

**Signature:**
```javascript
async function serve(
  options?: ServeOptions
): Promise<void>
```

**Options:**
```typescript
interface ServeOptions {
  port?: number | string;        // Server port (default: 3000)
  host?: string | boolean;       // Server host (default: localhost)
  open?: boolean;                // Auto-open browser
  https?: boolean;               // Enable HTTPS
  mode?: 'development' | 'production'; // Mode
}
```

**Example:**
```javascript
const { serve } = require('@kalxjs/cli/dist/src/commands');

await serve({
  port: 8080,
  open: true,
  https: false
});
```

**Note:** Serve doesn't return until server stops (Ctrl+C).

---

### build(options)

Build for production.

**Signature:**
```javascript
async function build(
  options?: BuildOptions
): Promise<void>
```

**Options:**
```typescript
interface BuildOptions {
  verbose?: boolean;             // Verbose output
  mode?: 'development' | 'production';
  output?: string;               // Output directory (default: dist)
  noMinify?: boolean;            // Disable minification
  analyze?: boolean;             // Analyze bundle
  sourcemaps?: boolean;          // Generate source maps
}
```

**Example:**
```javascript
const { build } = require('@kalxjs/cli/dist/src/commands');

await build({
  output: 'dist',
  analyze: true,
  verbose: true
});

console.log('Build complete!');
```

---

### version()

Get CLI version.

**Signature:**
```javascript
function version(): string
```

**Example:**
```javascript
const { version } = require('@kalxjs/cli');

console.log(`KalxJS CLI v${version()}`);
// Output: KalxJS CLI v2.0.31
```

---

## Generators API

### Component Generator

```javascript
const { generateComponent } = require('@kalxjs/cli/dist/src/generators/component-generator');

await generateComponent({
  name: 'Button',
  dir: 'src/components',
  options: {
    style: 'scss',
    test: true,
    props: true
  }
});
```

### Route Generator

```javascript
const { generateRoute } = require('@kalxjs/cli/dist/src/generators/route-generator');

await generateRoute({
  name: 'about',
  dir: 'src/router/routes',
  options: {
    composition: true
  }
});
```

### Store Generator

```javascript
const { generateStore } = require('@kalxjs/cli/dist/src/generators/store-generator');

await generateStore({
  name: 'user',
  dir: 'src/stores',
  options: {
    persist: true
  }
});
```

---

## Utilities API

### Package Manager Detection

```javascript
const { detectPackageManager } = require('@kalxjs/cli/dist/src/utils/package-manager');

const manager = detectPackageManager();
// Returns: 'npm' | 'yarn' | 'pnpm'
```

### File System Utilities

```javascript
const fs = require('@kalxjs/cli/dist/src/utils/file-system');

// Create file with template processing
await fs.createFile('src/components/Button.js', template);

// Create directory
await fs.createDirectory('src/components');

// Check if file exists
const exists = await fs.fileExists('package.json');

// Read file
const content = await fs.readFile('package.json');
```

### Logger

```javascript
const Logger = require('@kalxjs/cli/dist/src/utils/logger');

const logger = new Logger({
  level: 'info',  // debug, info, warn, error
  colors: true
});

logger.info('Starting build...');
logger.warn('This is deprecated');
logger.error('Build failed!');
logger.debug('Detailed debug info');
```

### Process Templates

```javascript
const { processTemplates } = require('@kalxjs/cli/dist/src/utils/processTemplates');

const variables = {
  projectName: 'my-app',
  author: 'John Doe'
};

const processed = await processTemplates(
  'template/src',
  'src',
  variables
);
```

---

## Events API

Monitor CLI events:

```javascript
const CLI = require('@kalxjs/cli');

const cli = new CLI();

// Listen to events
cli.on('create:start', (projectName) => {
  console.log(`Creating ${projectName}...`);
});

cli.on('create:complete', (projectName) => {
  console.log(`${projectName} created!`);
});

cli.on('create:error', (error) => {
  console.error(`Error: ${error.message}`);
});

// Available events
// create:start, create:complete, create:error
// generate:start, generate:complete, generate:error
// serve:start, serve:stop
// build:start, build:complete, build:error
```

---

## Examples

### Example 1: Batch Component Generation

```javascript
const { component } = require('@kalxjs/cli/dist/src/commands');

async function generateComponents() {
  const components = [
    'Button',
    'Input',
    'Modal',
    'Card',
    'Dropdown'
  ];

  for (const comp of components) {
    console.log(`Generating ${comp}...`);

    await component(comp, {
      dir: 'src/ui',
      style: 'scss',
      test: true,
      composition: true
    });
  }

  console.log('✅ All components generated!');
}

generateComponents().catch(console.error);
```

### Example 2: Create Project with Specific Configuration

```javascript
const { create, component, generate } = require('@kalxjs/cli/dist/src/commands');

async function setupProject() {
  // Create base project
  console.log('Creating project...');
  await create('my-app', {
    router: true,
    state: true,
    scss: true,
    skipInstall: true  // Install manually later
  });

  // Generate common components
  console.log('Generating components...');
  await component('Header', { dir: 'src/components', style: 'scss' });
  await component('Footer', { dir: 'src/components', style: 'scss' });
  await component('Sidebar', { dir: 'src/components', style: 'scss' });

  // Generate pages
  console.log('Generating pages...');
  await generate('page', 'dashboard', { composition: true });
  await generate('page', 'settings', { composition: true });

  // Generate stores
  console.log('Generating stores...');
  await generate('store', 'user', { persist: true });
  await generate('store', 'app');

  console.log('✅ Project setup complete!');
  console.log('Next steps:');
  console.log('  cd my-app');
  console.log('  npm install');
  console.log('  npm run dev');
}

setupProject().catch(console.error);
```

### Example 3: Custom Build Script with Error Handling

```javascript
const { build } = require('@kalxjs/cli/dist/src/commands');
const fs = require('fs-extra');

async function buildWithCleanup() {
  try {
    // Clean dist directory
    console.log('Cleaning dist...');
    await fs.remove('dist');

    // Build project
    console.log('Building project...');
    await build({
      output: 'dist',
      verbose: true,
      analyze: process.env.ANALYZE === 'true'
    });

    // Verify build
    console.log('Verifying build...');
    const distExists = await fs.pathExists('dist');
    const indexExists = await fs.pathExists('dist/index.html');

    if (!distExists || !indexExists) {
      throw new Error('Build verification failed');
    }

    console.log('✅ Build successful!');
    console.log(`📦 Output: dist/`);

    // Log file sizes
    const stats = await fs.stat('dist');
    console.log(`📊 Size: ${stats.size} bytes`);

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildWithCleanup();
```

### Example 4: Programmatic Server with Custom Middleware

```javascript
const { serve } = require('@kalxjs/cli/dist/src/commands');

async function startDevServer() {
  // Add custom configuration
  process.env.VITE_API_URL = 'http://localhost:3001';
  process.env.VITE_DEBUG = 'true';

  try {
    console.log('Starting development server...');

    await serve({
      port: 3000,
      host: 'localhost',
      open: true,
      https: false
    });

  } catch (error) {
    console.error('Server error:', error);
  }
}

startDevServer();
```

### Example 5: Automated Feature Generation

```javascript
const { generate } = require('@kalxjs/cli/dist/src/commands');

async function createFeature(featureName) {
  const normalized = featureName.toLowerCase().replace(/\s+/g, '-');

  console.log(`Creating feature: ${featureName}`);

  try {
    // Generate page
    await generate('page', normalized, {
      composition: true,
      style: 'scss',
      test: true
    });

    // Generate components for feature
    await generate('component', `${normalized}-item`, {
      composition: true,
      style: 'scss'
    });

    await generate('component', `${normalized}-list`, {
      composition: true,
      style: 'scss'
    });

    // Generate store
    await generate('store', normalized, {
      persist: false
    });

    console.log(`✅ Feature "${featureName}" created!`);
    console.log(`📁 Location: src/pages/${normalized}/`);

  } catch (error) {
    console.error(`❌ Failed to create feature: ${error.message}`);
    throw error;
  }
}

// Usage
createFeature('Product Management').catch(console.error);
```

---

## Type Definitions

TypeScript support (types may need to be installed separately):

```typescript
import {
  create,
  component,
  generate,
  serve,
  build
} from '@kalxjs/cli/dist/src/commands';

interface CreateOptions {
  router?: boolean;
  state?: boolean;
  scss?: boolean;
  testing?: boolean;
  linting?: boolean;
  skipInstall?: boolean;
  skipPrompts?: boolean;
  cwd?: string;
  template?: string;
}

interface ComponentOptions {
  dir?: string;
  style?: 'css' | 'scss' | null;
  test?: boolean;
  props?: boolean;
  state?: boolean;
  methods?: boolean;
  lifecycle?: boolean;
  composition?: boolean;
}

// Usage
const createProject = async (name: string, opts: CreateOptions) => {
  await create(name, opts);
};
```

---

## Troubleshooting

### Issue: Module Not Found

**Solution:** Ensure @kalxjs/cli is installed:
```bash
npm install @kalxjs/cli
```

### Issue: Async/Await Not Working

**Solution:** Use modern Node.js (12+) or wrap in IIFE:
```javascript
(async () => {
  const { create } = require('@kalxjs/cli/dist/src/commands');
  await create('my-app');
})();
```

### Issue: Events Not Firing

**Solution:** Use CLI instance with event emitter:
```javascript
const CLI = require('@kalxjs/cli');
const cli = new CLI();
cli.on('create:start', () => {});
```

---

## Next Steps

- [Advanced Usage](./ADVANCED_USAGE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Commands Reference](./COMMANDS.md)