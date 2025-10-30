# KALXJS Framework

A modern, lightweight JavaScript framework for building reactive web applications with powerful developer tools and an intuitive CLI.

## Features

- **Component-based architecture** — Build reusable, composable UI components
- **Reactive state management** — Automatic reactivity with fine-grained dependency tracking
- **Virtual DOM implementation** — Efficient rendering with optimized diffing
- **Client-side routing** — Built-in router for single-page applications
- **CLI tools** — Project scaffolding, code generation, and development server
- **Performance optimization** — Built-in profiling and optimization tools
- **Developer tools** — Browser extension and DevTools for debugging
- **Composition API** — Flexible function-based component development
- **Plugin system** — Extend framework with custom functionality
- **AI capabilities** — Integrated AI features for enhanced development

## Packages

- **core**: Core functionality including virtual DOM and component system
- **router**: Client-side routing with nested routes and lazy loading
- **state**: State management system
- **store**: Persistent store management
- **cli**: Command-line interface tools for project scaffolding and code generation
- **compiler**: Template compilation
- **composition**: Composition API for function-based components
- **api**: API utilities and integration helpers
- **plugins**: Plugin system for framework extensions
- **performance**: Performance optimization tools
- **devtools**: Developer tools and debugging utilities
- **ui**: Reusable UI component library
- **i18n**: Internationalization support
- **pwa**: Progressive Web App utilities
- **a11y**: Accessibility utilities

## Getting Started

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm test
```

## Documentation

Comprehensive documentation is organized by topic and use case:

### 📚 Framework Essentials
- **[Getting Started](./docs/getting-started.md)** — Quick introduction to KALXJS
- **[Components](./docs/components.md)** — Component fundamentals and lifecycle
- **[Reactivity](./docs/reactivity.md)** — Understanding reactivity and state
- **[Routing](./docs/routing.md)** — Client-side routing and navigation
- **[State Management](./docs/state-management.md)** — Global state patterns

### 🛠️ CLI Documentation

Complete guide for using the KALXJS CLI:

- **[CLI README](./docs/cli/README.md)** — Overview and feature summary
- **[Installation](./docs/cli/INSTALLATION.md)** — Install and configure CLI
- **[Quick Start](./docs/cli/QUICK_START.md)** — 5-minute getting started guide
- **[Commands Reference](./docs/cli/COMMANDS.md)** — All available commands
- **[Code Generation](./docs/cli/GENERATION.md)** — Generate components, routes, stores, and pages
- **[Project Structure](./docs/cli/PROJECT_STRUCTURE.md)** — Understand generated project layout
- **[Usage Patterns](./docs/cli/USAGE.md)** — Advanced usage patterns
- **[Programmatic API](./docs/cli/API_REFERENCE.md)** — Use CLI as a JavaScript module
- **[Troubleshooting](./docs/cli/TROUBLESHOOTING.md)** — Common issues and solutions

### 🔧 DevTools Documentation

DevTools for debugging and development:

- **[DevTools README](./docs/devtools/README.md)** — Overview and key features
- **[Installation](./docs/devtools/INSTALLATION.md)** — Set up DevTools
- **[Quick Start](./docs/devtools/QUICK_START.md)** — Start using DevTools
- **[API Reference](./docs/devtools/API.md)** — Complete API documentation
- **[Usage Guide](./docs/devtools/USAGE_GUIDE.md)** — Practical usage patterns
- **[Browser Extension](./docs/devtools/BROWSER_EXTENSION.md)** — Chrome/Firefox DevTools extension
- **[Troubleshooting](./docs/devtools/TROUBLESHOOTING.md)** — Common issues and solutions

### 📖 API Reference

Detailed API documentation for all framework modules:

- **[API Overview](./docs/api/README.md)** — Navigation hub for API docs
- **[Component API](./docs/api/component.md)** — Component creation and lifecycle
- **[Reactivity API](./docs/api/reactivity.md)** — Reactive primitives (ref, computed, watch)
- **[Router API](./docs/api/router.md)** — Routing system API
- **[State Management API](./docs/api/state.md)** — State management utilities
- **[Virtual DOM API](./docs/api/vdom.md)** — VNode and rendering API
- **[Renderer API](./docs/api/renderer.md)** — Custom renderer implementation
- **[AI API](./docs/api/ai.md)** — AI capabilities integration

### 🎓 Guides

In-depth guides for common patterns and advanced features:

- **[Introduction](./docs/guides/introduction.md)** — Framework concepts overview
- **[Composition API Guide](./docs/guides/composition-api.md)** — Function-based component API
- **[State Management](./docs/guides/state-management.md)** — State management patterns
- **[Performance Optimization](./docs/guides/performance.md)** — Performance best practices
- **[Plugins](./docs/guides/plugins.md)** — Creating and using plugins
- **[Custom Renderer](./docs/guides/custom-renderer.md)** — Implement custom renderers
- **[API Integration](./docs/guides/api-integration.md)** — Integrate external APIs
- **[AI Capabilities](./docs/guides/ai-capabilities.md)** — Using AI features
- **[Migrating to JS](./docs/guides/migrating-to-js.md)** — Migrate from other frameworks

### 📚 Tutorials

Step-by-step tutorials for building projects:

- **[Getting Started](./docs/tutorials/getting-started.md)** — Build your first app
- **[Component Lifecycle](./docs/tutorials/component-lifecycle.md)** — Understanding component lifecycle
- **[Reactivity Deep Dive](./docs/tutorials/reactivity.md)** — Master reactivity concepts
- **[Building a Todo App](./docs/tutorials/todo-app.md)** — Build a complete todo application

### 🚀 Additional Resources

- **[Best Practices](./docs/best-practices.md)** — Development best practices
- **[Performance Optimization](./docs/performance-optimization.md)** — Performance tuning guide
- **[Project Structure](./docs/project-structure.md)** — Recommended project organization
- **[Migration from React](./docs/migration-from-react.md)** — Migrate React apps to KALXJS
- **[Migration Guide](./docs/migration-guide.md)** — Version migration guide

## Examples

Check the `examples` directory for sample applications:

- `counter` — Simple counter application
- `counter-app` — Advanced counter with state management
- `todo-app` — Full-featured todo application
- `blog-app` — Blog application with routing
- `dashboard` — Dashboard with charts and data
- `router-example` — Routing system examples
- `store-api` — State management patterns
- `composition-api` — Composition API examples
- `ai-features` — AI capabilities showcase
- `custom-renderer-example` — Custom renderer implementation

## Development

```bash
# Install workspace dependencies
pnpm install

# Build all packages
pnpm run build

# Build specific package
pnpm run build:core
pnpm run build:router
pnpm run build:cli
pnpm run build:devtools

# Run all tests
pnpm test

# Run tests with coverage
pnpm run test:coverage

# Run E2E tests
pnpm run test:e2e

# Build documentation
pnpm run docs:build

# Start dev server
pnpm run dev
```

## Testing

- **Unit Tests**: Run with `pnpm test`
- **Integration Tests**: Included in main test suite
- **E2E Tests**: Run with `pnpm run test:e2e` (Playwright-based)
- **DevTools Tests**: Comprehensive test suite in `/tests/unit/devtools.test.js`
- **CLI Tests**: Complete test coverage in `/packages/cli/__tests__`

## License

MIT