# CLI Commands Reference

Complete documentation of all KalxJS CLI commands with options, examples, and best practices.

## Table of Contents

- [create](#create) - Create new project
- [generate](#generate) - Generate code artifacts
- [component](#component) - Generate component
- [serve](#serve) - Development server
- [build](#build) - Production build
- [version](#version) - Display version

---

## create

Create a new KalxJS project with optional features.

### Syntax
```bash
kalxjs create <project-name> [options]
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--router` | flag | false | Include Vue Router integration |
| `--state` | flag | false | Include state management |
| `--scss` | flag | false | Include SCSS support |
| `--testing` | flag | false | Include testing setup (Jest) |
| `--linting` | flag | false | Include ESLint configuration |
| `--skip-install` | flag | false | Skip npm install after creation |
| `--skip-prompts` | flag | false | Use defaults, skip interactive prompts |
| `--cwd <directory>` | string | process.cwd() | Working directory for project creation |

### Examples

#### Basic Project
```bash
kalxjs create my-app
cd my-app
npm install
npm run dev
```

Output:
```
✅ Project created successfully!
📁 Project: my-app
📦 Next steps:
   cd my-app
   npm install
   npm run dev
```

#### Project with Router & State
```bash
kalxjs create my-dashboard --router --state
```

Creates:
- Router configuration in `src/router/`
- Store setup in `src/stores/`
- Example route and store modules

#### Project with All Features
```bash
kalxjs create my-app --router --state --scss --testing --linting
```

Includes:
- ✅ Vue Router
- ✅ State management
- ✅ SCSS support
- ✅ Jest testing
- ✅ ESLint + Prettier

#### Non-Interactive Setup
```bash
kalxjs create my-app --skip-prompts --skip-install
cd my-app
npm install
```

#### Custom Directory
```bash
kalxjs create my-app --cwd /custom/path
```

### Interactive Prompts

If no flags are provided, you'll be prompted:

```
? Select project type:
  ❯ Single Page Application (SPA)
    Server-Side Rendering (SSR)
    Progressive Web App (PWA)

? Include Vue Router? (y/N)
? Include state management? (y/N)
? Include SCSS support? (y/N)
? Include testing setup? (y/N)
? Include ESLint? (y/N)
? Install dependencies now? (Y/n)
```

### Created Project Structure

```
my-app/
├── src/
│   ├── components/
│   ├── assets/
│   ├── main.js
│   └── App.js
├── public/
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
├── README.md
└── [optional: router/, stores/, tests/]
```

### Validation

- ✅ Project name must be valid npm package name
- ✅ Project name cannot start with a number
- ✅ Project name cannot contain uppercase letters (will be lowercased)
- ✅ Directory must not exist (prevents accidental overwrites)

### Error Handling

**Error: Invalid project name**
```
❌ Invalid project name: "123-app"
  ✖ Error: Project name cannot start with a number
```

**Solution:** Use a valid name:
```bash
kalxjs create my-app-123
```

**Error: Directory already exists**
```
❌ Directory my-app already exists.
```

**Solution:** Choose a different name or delete existing directory:
```bash
rm -rf my-app
kalxjs create my-app
```

---

## generate

Generate code artifacts including components, routes, stores, and pages.

### Syntax
```bash
kalxjs generate <type> <name> [options]
kalxjs g <type> <name> [options]
```

### Types

| Type | Alias | Description |
|------|-------|-------------|
| `component` | `c` | Reusable component |
| `route` | `r` | Route with view component |
| `store` | `s` | State management module |
| `page` | `p` | Combined route + view + store |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `-d, --dir <path>` | string | src | Target directory |
| `--composition` | flag | false | Use Composition API |
| `-s, --style <type>` | string | none | Style: css, scss |
| `-t, --test` | flag | false | Generate test file |

### generate component

```bash
kalxjs generate component <name> [options]
kalxjs g c <name> [options]
```

**Examples:**
```bash
# Basic
kalxjs g c Button

# With styles
kalxjs g c Button --style scss

# With tests
kalxjs g c Button --test

# Composition API
kalxjs g c Button --composition

# All options
kalxjs g c Button --style scss --test --composition --dir src/ui
```

**Output:**
```
src/components/Button.js
src/styles/components/Button.scss (with --style)
src/components/__tests__/Button.test.js (with --test)
```

### generate route

```bash
kalxjs generate route <name> [options]
kalxjs g r <name> [options]
```

Creates route definition and view component.

**Examples:**
```bash
# Basic route
kalxjs g r about

# Composition API route
kalxjs g r dashboard --composition

# With tests
kalxjs g r products --test
```

**Output:**
```
src/router/routes/about.js
src/views/AboutView.js
```

### generate store

```bash
kalxjs generate store <name> [options]
kalxjs g s <name> [options]
```

Creates state management module.

**Examples:**
```bash
# Basic store
kalxjs g s user

# With localStorage persistence
kalxjs g s user --persist

# With tests
kalxjs g s auth --test
```

**Output:**
```
src/stores/user.js
src/stores/__tests__/user.test.js (with --test)
```

### generate page

```bash
kalxjs generate page <name> [options]
kalxjs g p <name> [options]
```

Generates complete page setup (route + view + store).

**Examples:**
```bash
# Full page setup
kalxjs g p products

# Composition API
kalxjs g p dashboard --composition

# With styles and tests
kalxjs g p profile --style scss --test
```

**Output:**
```
src/router/routes/products.js (route)
src/views/ProductsView.js (view component)
src/stores/products.js (store)
src/views/__tests__/ProductsView.test.js (with --test)
src/styles/views/ProductsView.scss (with --style)
```

---

## component

Generate a component with advanced options.

### Syntax
```bash
kalxjs component <name> [options]
kalxjs c <name> [options]
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `-d, --dir <path>` | string | Target directory |
| `-s, --style <type>` | string | Style: css, scss |
| `-t, --test` | flag | Generate test file |
| `-p, --props` | flag | Include props definition |
| `--state` | flag | Include data state |
| `--methods` | flag | Include methods section |
| `--lifecycle` | flag | Include lifecycle hooks |
| `--composition` | flag | Use Composition API |

### Examples

#### Basic Component
```bash
kalxjs component Button
```

#### Component with Props
```bash
kalxjs component Button --props
```

Generated:
```javascript
<script>
export default {
  props: {
    // Define your props here
    value: {
      type: String,
      default: ''
    }
  }
};
</script>
```

#### Component with State
```bash
kalxjs component Counter --state
```

Generated:
```javascript
data() {
  return {
    count: 0
  };
}
```

#### Component with Methods
```bash
kalxjs component Counter --state --methods
```

Generated:
```javascript
methods: {
  increment() {
    this.count++;
  },
  decrement() {
    this.count--;
  }
}
```

#### Component with Lifecycle Hooks
```bash
kalxjs component DataLoader --lifecycle
```

Generated:
```javascript
mounted() {
  // Component mounted
},
beforeUnmount() {
  // Cleanup before unmount
}
```

#### Full-Featured Component
```bash
kalxjs component UserProfile --props --state --methods --lifecycle --style scss --test
```

Generates:
- ✅ Props
- ✅ State (data)
- ✅ Methods
- ✅ Lifecycle hooks
- ✅ SCSS stylesheet
- ✅ Test file

#### Custom Directory
```bash
kalxjs component Button --dir src/ui/buttons
```

Creates: `src/ui/buttons/Button.js`

---

## serve

Start the development server with hot module replacement (HMR).

### Syntax
```bash
kalxjs serve [options]
kalxjs dev [options]
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `-p, --port <port>` | number | 3000 | Server port |
| `-h, --host <host>` | string | localhost | Server host |
| `-o, --open` | flag | false | Auto-open browser |
| `-s, --https` | flag | false | Enable HTTPS |
| `-m, --mode <mode>` | string | development | Mode: development, production |

### Examples

#### Default Server
```bash
kalxjs serve
```

Output:
```
  VITE v4.4.0  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

#### Custom Port
```bash
kalxjs serve --port 8080
```

#### Auto-Open Browser
```bash
kalxjs serve --open
# Automatically opens http://localhost:3000 in your default browser
```

#### HTTPS Development Server
```bash
kalxjs serve --https
```

Output:
```
  ➜  Local:   https://localhost:3000/
```

Note: Browser will show self-signed certificate warning (expected).

#### Custom Host (Network Access)
```bash
# Allow external devices on network
kalxjs serve --host 0.0.0.0

# Then access from other machine:
# http://<your-ip-address>:3000
```

#### Production Mode
```bash
kalxjs serve --mode production
```

Enables optimizations like minification.

#### Combined Options
```bash
kalxjs serve --port 8080 --open --https
```

Starts HTTPS server on port 8080 and opens browser.

### Auto Port Fallback

If port 3000 is busy:
```bash
kalxjs serve
```

Output:
```
Port 3000 is already in use.
Trying port 3001... ✓
```

Automatically uses 3001, 3002, etc.

### Hot Module Replacement (HMR)

Changes to files are reflected instantly:

1. Save a file
2. Browser automatically reloads
3. Development state is preserved (for HMR-compatible changes)

---

## build

Create optimized production build.

### Syntax
```bash
kalxjs build [options]
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `-v, --verbose` | flag | false | Enable verbose output |
| `-m, --mode <mode>` | string | production | Build mode |
| `-o, --output <dir>` | string | dist | Output directory |
| `--no-minify` | flag | false | Disable minification |
| `--analyze` | flag | false | Analyze bundle size |

### Examples

#### Basic Build
```bash
kalxjs build
```

Output:
```
dist/index.html                 2.5 kB │ gzip: 1.2 kB
dist/assets/app-abc123.js     145.2 kB │ gzip: 42.3 kB
dist/assets/app.css             5.8 kB │ gzip: 2.1 kB

✓ built in 12.34s
```

#### Build with Verbose Output
```bash
kalxjs build --verbose
```

Shows detailed build information.

#### Custom Output Directory
```bash
kalxjs build --output build
```

Creates `build/` instead of `dist/`.

#### Build Without Minification
```bash
kalxjs build --no-minify
```

Useful for debugging production build issues.

#### Analyze Bundle Size
```bash
kalxjs build --analyze
```

Generates bundle analysis report showing:
- File sizes
- Module sizes
- Dependencies

#### Development Build
```bash
kalxjs build --mode development
```

Creates development build (larger file size, source maps).

### Production Build Features

- ✅ Code minification
- ✅ Tree-shaking dead code
- ✅ CSS optimization
- ✅ Asset compression
- ✅ Source maps (optional)

### Environment Variables

```bash
# Debug build process
DEBUG=vite:* kalxjs build

# Custom output format
VITE_OUTPUT_FORMAT=esm kalxjs build

# Production check
NODE_ENV=production kalxjs build
```

---

## version

Display CLI version information.

### Syntax
```bash
kalxjs version
kalxjs --version
kalxjs -V
kalxjs -v
```

### Examples

```bash
$ kalxjs version
KalxJS CLI version: 2.0.31

$ kalxjs --version
2.0.31

$ kalxjs -V
2.0.31

$ kalxjs -v
2.0.31
```

---

## Help

Display help for CLI or specific command.

### Syntax
```bash
kalxjs --help
kalxjs -h
kalxjs create --help
kalxjs generate --help
```

### Examples

```bash
# General help
kalxjs --help

# Create command help
kalxjs create --help

# Generate command help
kalxjs generate --help

# Component command help
kalxjs component --help

# Serve command help
kalxjs serve --help

# Build command help
kalxjs build --help
```

---

## Common Workflows

### Workflow 1: Create Project → Generate Components → Build

```bash
# Step 1: Create project
kalxjs create my-app --router --state
cd my-app

# Step 2: Generate components
kalxjs g c Header --style scss
kalxjs g c Footer --style scss
kalxjs g c Dashboard --composition

# Step 3: Generate store
kalxjs g s app

# Step 4: Start dev server
npm run dev

# Step 5: Build for production
kalxjs build
```

### Workflow 2: Quick Component Development

```bash
# Generate component with all features
kalxjs c MyButton --style scss --test --props --state --methods

# Start dev server
kalxjs serve --open

# Run tests
npm test
```

### Workflow 3: Production Deployment

```bash
# Build with analysis
kalxjs build --analyze

# Serve built app locally (verification)
npx http-server dist -p 8000

# Deploy dist/ folder to hosting
# (See your hosting provider's guide)
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Misuse of command |
| 126 | Command invoked cannot execute |
| 127 | Command not found |

---

## Tips & Best Practices

### 1. Use Aliases for Speed
```bash
kalxjs c Button        # component command
kalxjs g c Button      # generate component
kalxjs g r about       # generate route
kalxjs g s user        # generate store
```

### 2. Batch Generation
```bash
# Generate multiple components quickly
kalxjs g c Button
kalxjs g c Input
kalxjs g c Modal
kalxjs g c Dialog
```

### 3. Composition API
```bash
# Recommended for new projects
kalxjs g c Form --composition
kalxjs g r dashboard --composition
```

### 4. Testing Workflow
```bash
# Generate with tests
kalxjs g c Button --test

# Watch tests during development
npm test -- --watch
```

### 5. Styling Strategy
```bash
# Decide on preprocessor upfront
kalxjs c Button --style scss    # SCSS
kalxjs c Input --style css      # CSS
```

---

## Next Steps

- [Code Generation Guide](./GENERATION.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
- [Advanced Usage](./ADVANCED_USAGE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)