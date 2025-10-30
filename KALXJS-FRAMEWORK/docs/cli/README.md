# KalxJS CLI Documentation

Welcome to the comprehensive guide for **@kalxjs/cli** — the command-line interface for the KalxJS framework. This documentation covers project scaffolding, code generation, development workflows, and production deployment.

## Quick Navigation

| Guide | Purpose | Best For |
|-------|---------|----------|
| **[Quick Start](./QUICK_START.md)** | Get up and running in 5 minutes | First-time users, quick setup |
| **[Installation](./INSTALLATION.md)** | Installation and setup procedures | Getting the CLI onto your machine |
| **[Commands Reference](./COMMANDS.md)** | Complete command documentation | Day-to-day CLI usage |
| **[Code Generation](./GENERATION.md)** | Generating components, stores, routes | Creating project artifacts |
| **[Project Structure](./PROJECT_STRUCTURE.md)** | Generated project layouts and templates | Understanding project organization |
| **[Advanced Usage](./ADVANCED_USAGE.md)** | Custom templates, configurations, integrations | Advanced workflows |
| **[API Reference](./API_REFERENCE.md)** | Programmatic CLI API | Scripting and automation |
| **[Troubleshooting](./TROUBLESHOOTING.md)** | Problem-solving guide | Debugging issues |

---

## Overview

KalxJS CLI is a powerful command-line tool for developing KalxJS applications. It provides:

### 🚀 Project Scaffolding
- Initialize new KalxJS projects with preconfigured templates
- Choose between Options API and Composition API styles
- Optional feature setup (Router, State Management, Testing, SCSS, Linting)
- Automatic dependency installation with auto-detected package manager

### 🎨 Code Generation
- Generate components with configurable features (props, state, methods, lifecycle)
- Create routes with automatic view components
- Generate store modules (Pinia-style or Vuex-style)
- Create pages with combined route + view functionality

### ⚡ Development Tools
- Start development server with hot module replacement (Vite-powered)
- Automatic port detection and fallback
- HTTPS support for secure local development
- Auto-open browser window on startup

### 📦 Production Ready
- Optimize and minify code for production
- Bundle analysis to identify size bottlenecks
- Source maps for debugging production builds
- Multiple build modes (development, production)

### 🔧 Developer Experience
- Interactive prompts for guided setup
- Command aliases for faster typing (`c` for `component`, `g` for `generate`)
- Clear, colored, user-friendly output with progress indicators
- Comprehensive error messages with recovery guidance
- Cross-platform support (Windows, macOS, Linux)

---

## Feature Highlights

### Package Manager Auto-Detection
The CLI automatically detects your preferred package manager:
- **npm** — Default
- **yarn** — Detected if `yarn.lock` exists
- **pnpm** — Detected if `pnpm-lock.yaml` exists

### TypeScript Support (Optional)
Projects can be generated with TypeScript templates and configuration.

### Testing Integration
Generate test files alongside components and stores:
- Jest integration by default
- Test files in collocated `__tests__` directories
- Example tests with component setup

### Migration Tools
Migrate `.klx` files to modern JavaScript components:
```bash
kalxjs-migrate path/to/file.klx
```

---

## Installation

### Global Installation (Recommended)
```bash
npm install -g @kalxjs/cli
```

Then verify:
```bash
kalxjs --version
```

### Local Installation
```bash
npm install --save-dev @kalxjs/cli
```

Run commands with `npx`:
```bash
npx kalxjs create my-app
```

### Using Alternative Package Managers
```bash
# With yarn
yarn global add @kalxjs/cli

# With pnpm
pnpm add -g @kalxjs/cli
```

---

## Core Commands

### Create a New Project
```bash
kalxjs create my-app
```

### Generate Code Artifacts
```bash
# Component
kalxjs generate component Button

# Route
kalxjs generate route about

# Store
kalxjs generate store user

# Page (combined route + view)
kalxjs generate page products
```

### Start Development Server
```bash
kalxjs serve
# or
kalxjs dev
```

### Build for Production
```bash
kalxjs build
```

### Display Version
```bash
kalxjs --version
# or
kalxjs version
```

---

## Common Workflows

### Workflow 1: Create a New Project with Router & State Management
```bash
kalxjs create my-blog --router --state
cd my-blog
npm run dev
```

### Workflow 2: Generate a Component with Styling and Tests
```bash
kalxjs generate component Card --style scss --test
```

### Workflow 3: Create a Page with Lazy Loading
```bash
kalxjs generate page dashboard --composition --test
```

### Workflow 4: Quick Component Generation Using Aliases
```bash
# These are equivalent
kalxjs component Button
kalxjs c Button

# These are equivalent
kalxjs generate component Button
kalxjs g c Button
```

### Workflow 5: Build and Deploy
```bash
# Local development
kalxjs serve --port 3000 --open

# Production build
kalxjs build --analyze

# Build to custom directory
kalxjs build --output build
```

---

## API Versions

| Version | Status | Node | Release Date |
|---------|--------|------|--------------|
| 2.0.31+ | Current | ≥14 | 2024 |
| 2.0.0 - 2.0.30 | Older | ≥14 | 2024 |
| 1.x | Legacy | ≥12 | 2023 |

---

## Architecture Overview

### Command Structure
```
@kalxjs/cli
├── bin/kalxjs.js          # CLI entry point
├── src/
│   ├── cli.js             # CLI initialization
│   ├── commands/          # Command implementations
│   │   ├── create.js      # Project scaffolding
│   │   ├── component.js   # Component generation
│   │   ├── generate.js    # Multi-type generation
│   │   ├── serve.js       # Dev server
│   │   ├── build.js       # Production build
│   │   └── index.js       # Command exports
│   ├── generators/        # Code generation utilities
│   │   ├── component-generator.js
│   │   ├── route-generator.js
│   │   └── store-generator.js
│   ├── scaffolding/       # Project templates
│   │   ├── project-templates.js
│   │   └── prompts.js
│   ├── compiler/          # KLX compiler
│   │   └── klx-compiler.js
│   └── utils/             # Helper utilities
│       ├── file-system.js
│       ├── logger.js
│       ├── package-manager.js
│       └── processTemplates.js
└── templates/             # Project templates
    ├── base/              # Base SPA template
    ├── js/                # JavaScript template
    └── ...
```

### Dependencies
- **commander** — CLI command parsing
- **inquirer** — Interactive prompts
- **ora** — Spinner animations
- **chalk** — Colored output
- **gradient-string** — Gradient text effects
- **figlet** — ASCII art text
- **boxen** — Styled terminal boxes
- **vite** — Development server & build tool
- **fs-extra** — Enhanced file system operations
- **execa** — Process execution

---

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Windows  | ✅ Supported | All features work |
| macOS    | ✅ Supported | All features work |
| Linux    | ✅ Supported | All features work |
| WSL      | ✅ Supported | Windows Subsystem for Linux |

---

## Getting Help

### CLI Help Command
```bash
# General help
kalxjs --help

# Command-specific help
kalxjs create --help
kalxjs generate --help
kalxjs serve --help
```

### Resources
- **Documentation**: See sidebar navigation above
- **Issues**: Report bugs on [GitHub Issues](https://github.com/Odeneho-Calculus/kalxjs/issues)
- **Discussions**: Ask questions on [GitHub Discussions](https://github.com/Odeneho-Calculus/kalxjs/discussions)

---

## Version & License

- **Current Version**: 2.0.31+
- **License**: MIT
- **Package**: [@kalxjs/cli on npm](https://www.npmjs.com/package/@kalxjs/cli)

---

## Next Steps

1. **New to KalxJS?** → Start with [Quick Start](./QUICK_START.md)
2. **Ready to create a project?** → Read [Installation](./INSTALLATION.md) → [Commands Reference](./COMMANDS.md)
3. **Looking for code generation patterns?** → Check [Code Generation](./GENERATION.md)
4. **Need advanced features?** → See [Advanced Usage](./ADVANCED_USAGE.md)
5. **Troubleshooting?** → Visit [Troubleshooting](./TROUBLESHOOTING.md)