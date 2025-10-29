# @kalxjs/cli

A command-line tool for scaffolding KalxJS projects and generating code artifacts. The CLI streamlines project initialization, code generation, and development workflows.

## Features

- **Project Scaffolding** - Initialize new KalxJS projects with preconfigured templates and dependencies
- **Code Generators** - Generate components, routes, and store modules with boilerplate code
- **Development Server** - Start a development server with hot module reloading via Vite
- **Production Build** - Compile and optimize projects for production deployment
- **Package Manager Auto-detection** - Automatically detect npm, yarn, or pnpm
- **TypeScript Support** - Optional TypeScript configuration and templates
- **Template Flexibility** - Support for different component styles (Options API, Composition API)
- **Configuration Files** - Optional ESLint and code formatting setup
- **Testing Integration** - Generate test files alongside components and stores
- **Migration Tools** - Convert .klx files to JavaScript components
- **Error Recovery** - Detailed error messages and recovery guidance
- **Cross-platform** - Works on Windows, macOS, and Linux

## Installation

Install globally to use the CLI from any directory:

```bash
npm install -g @kalxjs/cli
```

## Quick Start

Create a new project:

```bash
kalxjs create my-app
cd my-app
npm install
npm run dev
```

## Commands

### create

Create a new KalxJS project.

```bash
kalxjs create <project-name> [options]
```

**Options:**

- `--router` - Include router support
- `--state` - Include state management
- `--scss` - Include SCSS support
- `--testing` - Include testing setup
- `--linting` - Include ESLint configuration
- `--skip-install` - Skip automatic dependency installation
- `--skip-prompts` - Use default options without prompts
- `--cwd <directory>` - Create project in specified directory

**Examples:**

```bash
# Basic project
kalxjs create my-app

# With specific features
kalxjs create my-app --router --state --testing

# With custom working directory
kalxjs create my-app --cwd /custom/path

# Skip prompts with predefined features
kalxjs create my-app --router --state --skip-prompts --skip-install
```

### generate

Generate code artifacts including components, routes, stores, and pages.

```bash
kalxjs generate <type> <name> [options]
```

Or use shorthand:

```bash
kalxjs g <type> <name> [options]
```

**Supported types:**

- `component` or `c` - Generate a new component
- `route` or `r` - Generate a new route with view component
- `store` or `s` - Generate a store module
- `page` or `p` - Generate a page (combined route and view component)

**Options:**

- `-d, --dir <directory>` - Target directory for generated files
- `--composition` - Use Composition API for component generation
- `-s, --style [css|scss]` - Add stylesheet
- `-t, --test` - Generate accompanying test file

**Examples:**

```bash
# Generate a basic component
kalxjs generate component Button

# Generate component with test file
kalxjs g c Button --test

# Generate Composition API component
kalxjs g c Form --composition

# Generate route with view component
kalxjs generate route about

# Generate store module
kalxjs g s user

# Generate page with lazy loading
kalxjs g p products --composition
```

### component

Generate a component (shorthand for `generate component`).

```bash
kalxjs component <name> [options]
```

**Options:**

- `-d, --dir <directory>` - Target directory for the component
- `-s, --style [css|scss]` - Add stylesheet
- `-t, --test` - Generate test file
- `-p, --props` - Include props definition
- `--state` - Include state/data setup
- `--methods` - Include methods section
- `--lifecycle` - Include lifecycle hooks

**Examples:**

```bash
# Generate component with stylesheet and test
kalxjs component Card -s css -t

# Generate component with all features
kalxjs component Profile --props --state --methods --lifecycle --test
```

### serve

Start the development server.

```bash
kalxjs serve [options]
```

Or use the alias:

```bash
kalxjs dev [options]
```

**Options:**

- `-p, --port <port>` - Port to serve on (default: 3000)
- `-h, --host [host]` - Host to serve on (default: localhost)
- `-o, --open` - Open browser window automatically
- `-s, --https` - Enable HTTPS protocol
- `-m, --mode <mode>` - Server mode: development or production (default: development)

**Examples:**

```bash
# Start dev server on default port
kalxjs serve

# Start on custom port with browser auto-open
kalxjs serve --port 8080 --open

# Start HTTPS dev server
kalxjs serve --https --port 3443

# Start in production mode
kalxjs serve --mode production
```

### build

Build the project for production.

```bash
kalxjs build [options]
```

**Options:**

- `-v, --verbose` - Enable verbose build output
- `-m, --mode <mode>` - Build mode: development or production (default: production)
- `-o, --output <dir>` - Output directory (default: dist)
- `--no-minify` - Disable code minification
- `--analyze` - Analyze bundle size

**Examples:**

```bash
# Build for production
kalxjs build

# Build with verbose output
kalxjs build --verbose

# Build to custom output directory
kalxjs build --output build

# Build without minification (for debugging)
kalxjs build --no-minify

# Build and analyze bundle size
kalxjs build --analyze
```

### version

Display the CLI version.

```bash
kalxjs version
```

Or use version flags:

```bash
kalxjs -v
kalxjs -V
kalxjs --version
```

## Project Structure

When you create a new project, the following directory structure is generated:

```
my-app/
├── src/
│   ├── components/          # Reusable components
│   ├── views/              # Page components
│   ├── assets/             # Static assets
│   ├── main.js             # Application entry point
│   └── App.js              # Root component
├── public/                 # Static files
├── package.json            # Project metadata and dependencies
├── index.html              # HTML template
├── .gitignore              # Git ignore rules
└── README.md               # Project documentation
```

## Component Generation

### Options API Component

Generated components use the Options API by default:

```javascript
<template>
  <div class="my-component">
    <h1>{{ title }}</h1>
    <p>{{ message }}</p>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script>
export default {
  name: 'MyComponent',
  props: {
    title: {
      type: String,
      default: 'My Component'
    }
  },
  data() {
    return {
      message: 'Welcome to KalxJS!',
      count: 0
    };
  },
  methods: {
    increment() {
      this.count++;
    }
  },
  mounted() {
    console.log('MyComponent mounted');
  }
};
</script>
```

### Composition API Component

Generate with `--composition` flag:

```javascript
<template>
  <div class="my-component">
    <h1>{{ title }}</h1>
    <p>{{ message }}</p>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script>
import { ref, computed } from '@kalxjs/core';

export default {
  name: 'MyComponent',
  props: {
    title: {
      type: String,
      default: 'My Component'
    }
  },
  setup(props) {
    const message = ref('Welcome to KalxJS!');
    const count = ref(0);

    const increment = () => {
      count.value++;
    };

    return {
      message,
      count,
      increment
    };
  }
};
</script>
```

## Store Generation

### Pinia-style Store

Generate store modules with Pinia composition:

```bash
kalxjs generate store user
```

Generated output:

```javascript
import { defineStore } from '@kalxjs/store';
import { ref, computed } from '@kalxjs/core';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const isAuthenticated = computed(() => !!user.value);

  const setUser = (userData) => {
    user.value = userData;
  };

  const logout = () => {
    user.value = null;
  };

  return {
    user,
    isAuthenticated,
    setUser,
    logout
  };
});
```

### Vuex-style Store

Generate with `--style vuex` option:

```bash
kalxjs generate store user --style vuex
```

### Store Persistence

Enable automatic state persistence:

```bash
kalxjs generate store user --persist
```

This adds localStorage persistence to your store with automatic serialization and deserialization.

## Route Generation

Generate routes with view components:

```bash
kalxjs generate route about
```

The command:
- Creates a view component at `src/views/About.klx`
- Updates `src/router/routes.js` with the new route

## Programmatic Usage

Use the CLI as a library in your Node.js applications:

```javascript
import { generateComponent, generateRoute, generateStore } from '@kalxjs/cli';

// Generate a component
await generateComponent('Button', {
  type: 'sfc',
  directory: 'src/components',
  withProps: true,
  withTests: true
});

// Generate a route
await generateRoute('dashboard', {
  path: '/dashboard',
  lazy: true,
  createView: true
});

// Generate a store module
await generateStore('app', {
  style: 'pinia',
  withPersistence: true
});
```

## Utilities

The CLI exports utility functions for working with the file system, logging, and package managers.

### File System Utilities

```javascript
import { fileSystem } from '@kalxjs/cli';

// Ensure directory exists
await fileSystem.ensureDir('/path/to/dir');

// Write file with content
await fileSystem.writeFile('/path/to/file.js', content);

// Read file content
const content = await fileSystem.readFile('/path/to/file.js');

// Check if file exists
const exists = await fileSystem.fileExists('/path/to/file.js');

// Copy directory recursively
await fileSystem.copyDir(source, destination);
```

### Logger Utilities

```javascript
import { logger } from '@kalxjs/cli';

logger.info('Information message');
logger.success('Operation completed successfully');
logger.warn('Warning: something needs attention');
logger.error('Error: operation failed');
```

### Package Manager Utilities

```javascript
import { packageManager } from '@kalxjs/cli';

// Detect package manager
const pm = packageManager.detectPackageManager();  // returns 'npm', 'yarn', or 'pnpm'

// Get install command
const cmd = packageManager.getInstallCommand('npm');  // 'npm install'

// Get add package command
const addCmd = packageManager.getAddCommand('npm', 'lodash', false);  // 'npm install --save lodash'
```

## Configuration

### kalxjs.config.js

Create a `kalxjs.config.js` file in your project root to customize build behavior:

```javascript
export default {
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },

  // Dev server configuration
  server: {
    port: 3000,
    open: true,
  },

  // Plugins
  plugins: [
    // Add plugins here
  ],
};
```

## Migration

### Converting .klx Files

Use the migration tool to convert .klx template files to JavaScript:

```bash
kalxjs-migrate path/to/component.klx.js
```

This tool:
- Extracts template, script, and style sections
- Converts templates to render functions
- Generates equivalent JavaScript components
- Preserves scoped styles as separate modules

## Error Messages

The CLI provides detailed error messages to help resolve issues:

- **Invalid project name** - Project names must follow npm package naming conventions
- **Directory already exists** - Choose a different project name or use `--cwd` option
- **Package.json not found** - Ensure you're running commands in a valid project directory
- **Vite not found** - Dependencies may need to be installed with `npm install`
- **Port in use** - Use the `--port` option to specify a different port

For additional help, check the project README or visit the KalxJS documentation.

## Requirements

- Node.js 14.0.0 or higher
- npm, yarn, or pnpm

## License

MIT

## Support

For issues, feature requests, or questions, visit the [KalxJS repository](https://github.com/Odeneho-Calculus/kalxjs).
