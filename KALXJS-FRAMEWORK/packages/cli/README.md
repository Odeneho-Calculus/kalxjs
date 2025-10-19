# @kalxjs/CLI

Command-line interface for scaffolding and managing KALXJS projects.

## Features

🚀 **Interactive Project Scaffolding** - Create new projects with multiple templates

🎨 **Code Generators** - Generate components, routes, and store modules

📦 **Multiple Template Support** - SPA, SSR, SSG, PWA, Library, and Full-Stack

⚙️ **Package Manager Detection** - Auto-detect npm, yarn, or pnpm

🎯 **TypeScript Support** - Optional TypeScript setup

🔧 **ESLint & Prettier** - Automated linting configuration

🧪 **Testing Setup** - Vitest and Playwright integration

## Installation

```bash
# Global installation
npm install -g @kalxjs/cli

# Or use with npx
npx @kalxjs/cli create my-app
```

## Usage

### Create New Project

```bash
# Interactive mode
kalxjs create my-app

# With options
kalxjs create my-app --template spa --typescript
```

**Available Templates:**
- `spa` - Single Page Application
- `ssr` - Server-Side Rendering
- `ssg` - Static Site Generation
- `pwa` - Progressive Web App
- `library` - Component Library
- `fullstack` - Full-Stack Application

### Generate Component

```bash
# Generate SFC component
kalxjs generate component MyComponent

# Generate JS component
kalxjs generate component MyComponent --type js

# With options
kalxjs generate component MyComponent --props --tests --storybook
```

**Options:**
- `--type` - Component type (`sfc`, `js`, `ts`)
- `--props` - Add props definition
- `--emits` - Add emits definition
- `--tests` - Create test file
- `--storybook` - Create Storybook story

### Generate Route

```bash
# Generate route with view
kalxjs generate route about

# Custom path
kalxjs generate route about --path /about-us

# With options
kalxjs generate route about --lazy --guard
```

**Options:**
- `--path` - Custom route path
- `--lazy` - Use lazy loading
- `--guard` - Add navigation guard
- `--no-view` - Skip view component creation

### Generate Store Module

```bash
# Generate Pinia-style store
kalxjs generate store user

# Generate Vuex-style store
kalxjs generate store user --style vuex

# With persistence
kalxjs generate store user --persist
```

**Options:**
- `--style` - Store style (`pinia`, `vuex`)
- `--persist` - Enable state persistence

## Project Structure

### SPA Template

```
my-app/
├── src/
│   ├── main.js
│   ├── App.klx
│   ├── components/
│   │   └── HelloWorld.klx
│   ├── views/
│   │   ├── Home.klx
│   │   └── About.klx
│   ├── router/
│   │   ├── index.js
│   │   └── routes.js
│   ├── store/
│   │   ├── index.js
│   │   └── modules/
│   └── assets/
│       └── styles/
│           └── main.css
├── public/
│   ├── index.html
│   └── favicon.ico
├── package.json
└── README.md
```

### SSR Template

Includes server-side rendering setup with Node.js backend.

### PWA Template

Includes service worker, manifest, and offline support.

## Commands

### create

Create a new KALXJS project

```bash
kalxjs create <project-name> [options]
```

**Options:**
- `--template, -t` - Project template
- `--typescript, --ts` - Use TypeScript
- `--no-git` - Skip Git initialization
- `--no-install` - Skip dependency installation

### generate (g)

Generate code from templates

```bash
kalxjs generate <type> <name> [options]
kalxjs g <type> <name> [options]  # Shorthand
```

**Types:**
- `component` (or `c`) - Generate component
- `route` (or `r`) - Generate route
- `store` (or `s`) - Generate store module
- `page` (or `p`) - Generate page (view + route)

### serve

Start development server

```bash
kalxjs serve [options]
```

**Options:**
- `--port, -p` - Port number (default: 3000)
- `--host, -h` - Host (default: localhost)
- `--open, -o` - Open browser

### build

Build for production

```bash
kalxjs build [options]
```

**Options:**
- `--mode, -m` - Build mode (default: production)
- `--ssr` - Build for SSR
- `--analyze` - Analyze bundle size

## Configuration

### kalxjs.config.js

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

## Programmatic Usage

```javascript
import { generateComponent, generateRoute, generateStore } from '@kalxjs/cli';

// Generate component
await generateComponent('MyComponent', {
  type: 'sfc',
  withProps: true,
  withTests: true,
});

// Generate route
await generateRoute('about', {
  path: '/about',
  lazy: true,
});

// Generate store
await generateStore('user', {
  style: 'pinia',
  withPersistence: true,
});
```

## Utilities

### Logger

```javascript
import { logger } from '@kalxjs/cli';

logger.info('Information message');
logger.success('Success message');
logger.warn('Warning message');
logger.error('Error message');

const spinner = logger.createSpinner('Loading...');
spinner.start();
// ... do something
spinner.succeed('Done!');
```

### Package Manager

```javascript
import { packageManager } from '@kalxjs/cli';

// Detect package manager
const pm = packageManager.detect();

// Install dependencies
await packageManager.install(pm, '/path/to/project');

// Add package
await packageManager.addPackage(pm, 'lodash', { dev: true });
```

### File System

```javascript
import { fileSystem } from '@kalxjs/cli';

// Ensure directory exists
await fileSystem.ensureDir('/path/to/dir');

// Write file
await fileSystem.writeFile('/path/to/file.js', content);

// Copy directory
await fileSystem.copyDir(source, destination);
```

## Examples

### Create Full-Stack App

```bash
kalxjs create my-fullstack-app \
  --template fullstack \
  --typescript \
  --features testing,i18n,a11y
```

### Generate Page (View + Route)

```bash
kalxjs generate page Products --path /products --lazy
```

### Generate Component with All Options

```bash
kalxjs generate component ProductCard \
  --type sfc \
  --props \
  --emits \
  --tests \
  --storybook
```

## Migration

### From Vue CLI

```bash
# Install KALXJS CLI
npm install -g @kalxjs/cli

# Create new project
kalxjs create my-app --template spa

# Copy components
# Update imports from 'vue' to '@kalxjs/core'
```

### From Create React App

```bash
kalxjs create my-app --template spa

# Components use similar structure
# Replace JSX with KALXJS templates
```

## Troubleshooting

### Port already in use

```bash
# Use different port
kalxjs serve --port 3001
```

### TypeScript errors

```bash
# Regenerate TypeScript config
kalxjs init --typescript --force
```

### Module not found

```bash
# Reinstall dependencies
npm install
# or
yarn install
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

## License

MIT

## Links

- [Documentation](https://kalxjs.dev/docs)
- [GitHub](https://github.com/kalxjs/kalxjs)
- [Discord](https://discord.gg/kalxjs)
