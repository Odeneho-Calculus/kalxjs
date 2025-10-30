# KALXJS Framework

🚀 A modern JavaScript framework for building powerful web applications with an intuitive CLI and comprehensive developer tools.

## Overview

KALXJS is a progressive JavaScript framework designed for building user interfaces. It provides a component-based architecture, reactive data binding, virtual DOM rendering, powerful CLI tooling, and comprehensive developer tools for an exceptional development experience.

## 📁 Repository Structure

```
kalxjs/
├── KALXJS-FRAMEWORK/          # Main framework source (framework, packages, documentation)
├── kalxjsDevToolBrowserExtension/  # Browser DevTools extension (Chrome/Firefox)
├── scripts/                    # Utility scripts
├── create-kalxjs-app.js       # Project initializer script
├── framework-patch.js         # Framework configuration patching
└── README.md                  # This file
```

## 🎯 Quick Links

### 📚 Main Framework Documentation
All comprehensive framework documentation is in the **[KALXJS-FRAMEWORK](./KALXJS-FRAMEWORK)** directory:

- **[Framework README](./KALXJS-FRAMEWORK/README.md)** — Complete framework overview and documentation hub
- **[Getting Started](./KALXJS-FRAMEWORK/docs/getting-started.md)** — Quick introduction to KALXJS
- **[CLI Documentation](./KALXJS-FRAMEWORK/docs/cli/README.md)** — Complete CLI reference and guides
- **[DevTools Documentation](./KALXJS-FRAMEWORK/docs/devtools/README.md)** — DevTools and debugging tools
- **[API Reference](./KALXJS-FRAMEWORK/docs/api/README.md)** — Complete API documentation
- **[Guides & Tutorials](./KALXJS-FRAMEWORK/docs/guides/)** — In-depth guides and step-by-step tutorials

### 🔧 Browser DevTools Extension
- **[DevTools Extension README](./kalxjsDevToolBrowserExtension/README.md)** — Browser extension for debugging
- **[Quick Start Guide](./kalxjsDevToolBrowserExtension/QUICK_START.md)** — Get started with DevTools

## 🚀 Quick Start

### Option 1: Using the Script Initializer

```bash
# Create a new project
node create-kalxjs-app.js my-app
cd my-app

# Start development server
npm run dev
```

### Option 2: Using Global CLI

```bash
# Install CLI globally (requires npm link in KALXJS-FRAMEWORK/packages/cli)
npm install -g @kalxjs/cli

# Create a new project
kalxjs create my-app
cd my-app

# Start development server
npm run dev
```

## ✨ Key Features

- **Component-Based Architecture** — Build encapsulated, reusable components
- **Reactive Data Binding** — Automatic UI updates when data changes
- **Virtual DOM** — Efficient rendering with optimized diffing
- **Routing** — Built-in router for single-page applications
- **State Management** — Centralized state management with store
- **CLI Tools** — Powerful scaffolding and code generation
- **DevTools** — Browser extension and programmatic debugging tools
- **Composition API** — Function-based component development
- **Plugin System** — Extend with custom plugins and middleware
- **TypeScript Support** — Full TypeScript support throughout
- **Performance Optimization** — Built-in profiling and optimization tools
- **AI Capabilities** — Integrated AI features for enhanced development

## 📖 Documentation Overview

### Framework Essentials (5 core docs)
- Components, Reactivity, Routing, State Management, Getting Started

### CLI Tools (9 comprehensive guides)
- Installation, Quick Start, Commands Reference, Code Generation, Project Structure, Usage Patterns, Programmatic API, Troubleshooting

### DevTools (7 detailed guides)
- Overview, Installation, Quick Start, API Reference, Usage Guide, Browser Extension, Troubleshooting

### API Reference (8 modules)
- Components, Reactivity, Router, State Management, Virtual DOM, Renderer, AI, plus more

### Guides (11 in-depth guides)
- Introduction, Composition API, State Management, Performance, Plugins, Custom Renderers, API Integration, AI Capabilities, and more

### Tutorials (4 step-by-step tutorials)
- Getting Started, Component Lifecycle, Reactivity Deep Dive, Building a Todo App

## 🛠️ Development Scripts

From the root directory:

```bash
# Create a new project
node create-kalxjs-app.js my-app

# Start an existing project
node start-kalxjs.js my-app

# Fix/patch an existing project
node framework-patch.js

# Check syntax
node check-syntax.js
```

## 🔗 Building & Working with the Framework

```bash
cd KALXJS-FRAMEWORK

# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Build specific packages
pnpm run build:core
pnpm run build:router
pnpm run build:cli
pnpm run build:devtools

# Run tests
pnpm test

# Run with coverage
pnpm run test:coverage

# Run E2E tests
pnpm run test:e2e
```

## 📦 Framework Packages

| Package | Purpose |
|---------|---------|
| **core** | Core framework with virtual DOM and component system |
| **router** | Client-side routing with nested routes |
| **state** | State management utilities |
| **store** | Persistent store management |
| **cli** | Command-line tools for scaffolding and generation |
| **compiler** | Template compilation engine |
| **composition** | Composition API for functional components |
| **devtools** | Developer tools and debugging |
| **plugins** | Plugin system for extensions |
| **performance** | Performance profiling and optimization |
| **ui** | Reusable component library |
| **i18n** | Internationalization support |
| **pwa** | Progressive Web App utilities |
| **a11y** | Accessibility utilities |

## 🎓 Learning Paths

### Beginner
1. Read [Getting Started](./KALXJS-FRAMEWORK/docs/getting-started.md)
2. Follow the [CLI Quick Start](./KALXJS-FRAMEWORK/docs/cli/QUICK_START.md)
3. Work through [Component Tutorial](./KALXJS-FRAMEWORK/docs/tutorials/getting-started.md)
4. Build a simple app with [Component Lifecycle](./KALXJS-FRAMEWORK/docs/tutorials/component-lifecycle.md)

### Intermediate
1. Master [Reactivity](./KALXJS-FRAMEWORK/docs/reactivity.md)
2. Learn [Routing](./KALXJS-FRAMEWORK/docs/routing.md)
3. Understand [State Management](./KALXJS-FRAMEWORK/docs/state-management.md)
4. Build the [Todo App Tutorial](./KALXJS-FRAMEWORK/docs/tutorials/todo-app.md)

### Advanced
1. Explore [Composition API Guide](./KALXJS-FRAMEWORK/docs/guides/composition-api.md)
2. Study [Performance Optimization](./KALXJS-FRAMEWORK/docs/guides/performance.md)
3. Create [Custom Plugins](./KALXJS-FRAMEWORK/docs/guides/plugins.md)
4. Build [Custom Renderers](./KALXJS-FRAMEWORK/docs/guides/custom-renderer.md)

## 🐛 Troubleshooting

### CLI Issues
See [CLI Troubleshooting](./KALXJS-FRAMEWORK/docs/cli/TROUBLESHOOTING.md)

### DevTools Issues
See [DevTools Troubleshooting](./KALXJS-FRAMEWORK/docs/devtools/TROUBLESHOOTING.md)

### Framework Issues
Check [FRAMEWORK_FIXES.md](./FRAMEWORK_FIXES.md) for known issues and patches

## 📝 Examples

The [KALXJS-FRAMEWORK/examples](./KALXJS-FRAMEWORK/examples/) directory contains sample projects:

- **counter** — Simple counter application
- **todo-app** — Full-featured todo app with state management
- **blog-app** — Blog with routing and API integration
- **dashboard** — Dashboard with charts and data visualization
- **router-example** — Routing system examples
- **ai-features** — AI capabilities showcase
- And more...

## 🔄 Development Workflow

1. **Create Project** — Use `node create-kalxjs-app.js my-app` or `kalxjs create my-app`
2. **Generate Code** — Use `kalxjs generate component/page/store [name]`
3. **Develop** — Run `npm run dev` for hot-reload development
4. **Debug** — Use DevTools browser extension or programmatic API
5. **Test** — Run `npm test` for unit tests
6. **Build** — Run `npm run build` for production build
7. **Deploy** — Deploy the `dist` directory to your hosting

## 📋 Latest Updates

- ✅ Comprehensive CLI documentation (9 guides + API reference)
- ✅ Complete DevTools documentation (7 guides + API reference)
- ✅ 153+ passing tests across all modules
- ✅ Full DevTools test suite with edge case coverage
- ✅ CLI test coverage across all generation types
- ✅ Browser extension for Chrome and Firefox
- ✅ Professional documentation across all packages

## 📄 License

MIT

---

**For complete documentation and guides**, visit the [KALXJS-FRAMEWORK](./KALXJS-FRAMEWORK) directory and explore the comprehensive docs folder.