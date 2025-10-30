# KALXJS Framework Documentation

Welcome to the KALXJS Framework documentation. This guide will help you get started with using the framework and explore its features.

## Introduction

KALXJS is a modern, lightweight JavaScript framework for building reactive web applications. It provides a component-based architecture, reactive state management, and various tools to enhance your development experience.

## Getting Started

### Installation

```bash
npm install kalxjs-framework
```

### Basic Usage

```javascript
import { createApp } from 'kalxjs-framework/core';
import App from './App.js';

const app = createApp(App);
app.mount('#app');
```

## Core Concepts

- [Components](./components.md)
- [Reactivity](./reactivity.md)
- [Virtual DOM](./virtual-dom.md)
- [Lifecycle Hooks](./lifecycle-hooks.md)
- [Event Handling](./event-handling.md)

## Advanced Topics

- [State Management](./state-management.md)
- [Routing](./routing.md)
- [Composition API](./composition-api.md)
- [Plugins](./plugins.md)
- [Performance Optimization](./performance.md)

## API Reference

- [Core API](./api/core.md)
- [Router API](./api/router.md)
- [State API](./api/state.md)
- [Composition API](./api/composition.md)
- **[CLI API](./cli/API_REFERENCE.md)** - Programmatic CLI access
- **[DevTools API](./devtools/README.md)** - Developer tools and debugging

## Command-Line Interface (CLI)

- **[CLI Documentation](./cli/README.md)** - Complete CLI reference
  - [Quick Start](./cli/QUICK_START.md) - Get started in 5 minutes
  - [Installation](./cli/INSTALLATION.md) - Setup and installation
  - [Commands Reference](./cli/COMMANDS.md) - All CLI commands
  - [Code Generation](./cli/GENERATION.md) - Generate components, routes, stores
  - [Project Structure](./cli/PROJECT_STRUCTURE.md) - Understand project layout
  - [Advanced Usage](./cli/ADVANCED_USAGE.md) - Custom templates and integrations
  - [API Reference](./cli/API_REFERENCE.md) - Programmatic API
  - [Troubleshooting](./cli/TROUBLESHOOTING.md) - Common issues

## Developer Tools

- **[DevTools Documentation](./devtools/README.md)** - Complete DevTools guide
  - [Quick Start](./devtools/QUICK_START.md) - Get started in 5 minutes
  - [Installation Guide](./devtools/INSTALLATION.md) - Setup instructions
  - [API Reference](./devtools/API.md) - Complete API specification
  - [Usage Guide](./devtools/USAGE_GUIDE.md) - Practical patterns
  - [Browser Extension](./devtools/BROWSER_EXTENSION.md) - Extension guide
  - [Troubleshooting](./devtools/TROUBLESHOOTING.md) - Common issues

## Examples

Check the `examples` directory in the repository for sample applications built with KALXJS Framework.