# kalxjs

A cutting-edge JavaScript framework for building modern web applications with exceptional performance, developer experience, and scalability.

## Overview

kalxjs empowers developers to build fast, maintainable applications using modern patterns like:
- Signal-based reactivity
- Server components
- Atomic state management
- Hybrid rendering strategies
- Type-safe development

## Core Features

### Runtime
- **Signal-Based Reactivity**: Fine-grained updates with automatic dependency tracking
- **Effect System**: Automatic cleanup and batched updates
- **Server Components**: First-class SSR with streaming
- **Suspense Integration**: Built-in data loading patterns

### Development Experience
- **Hot Module Replacement**: Fast refresh with state preservation
- **TypeScript First**: Complete type inference and safety
- **DevTools**: Advanced debugging and profiling
- **Error Boundaries**: Graceful error handling
- **Time Travel Debugging**: State and action replay

### Performance
- **Virtual DOM**: Intelligent diffing with static analysis
- **Automatic Batching**: Smart update scheduling
- **Tree Shaking**: Dead code elimination
- **Code Splitting**: Automatic chunk optimization
- **Static Hoisting**: Compile-time optimizations

## Installation

### Prerequisites
- Node.js v16.0.0 or higher
- Git
- npm v7.0.0 or higher (or yarn/pnpm)

### Option 1: Direct Clone

```bash
# Clone the repository
git clone https://github.com/Odeneho-Calculus/kalxjs.git

# Navigate to project
cd kalxjs

# Install dependencies
npm install

# Build the framework
npm run build

# Create a new project using local build
npm run create my-app
```

### Option 2: Package Managers

```bash
# Using npm
npm create kalx@latest my-klx-app

# Using yarn
yarn create kalx my-klx-app

# Using pnpm
pnpm create kalx my-klx-app
```

### Option 3: Individual Packages

```bash
# Core package (v1.2.7)
npm install @kalxjs/core

# CLI tools (v1.2.28)
npm install @kalxjs/cli

# Router (v1.2.7)
npm install @kalxjs/router

# State management (v1.2.7)
npm install @kalxjs/state

# Developer tools (v1.2.8)
npm install @kalxjs/devtools
```

### Troubleshooting Installation

```bash
# Clear package manager cache
npm cache clean --force

# Verify node version
node --version

# Update npm
npm install -g npm@latest
```

## Quick Start

```bash
# Create new project
npm create kalx@latest my-app

# Select features
✔ Add TypeScript
✔ Add Router
✔ Add State Management
✔ Add Testing
✔ Add ESLint
✔ Add Prettier
✔ Add PWA Support
```

```bash
# Navigate and install dependencies
cd my-app
npm install

# Start development server
npm run dev
```

## Single File Components

kalxjs uses .klx files for single file components, combining template, script, and style in one file:

```klx
<template>
  <button @click="increment">
    Count is: {{ count }}
  </button>
</template>

<script>
import { ref } from '@kalxjs-framework/runtime'

export default {
  name: 'Counter',
  setup() {
    const count = ref(0)
    const increment = () => count.value++
    return { count, increment }
  }
}
</script>

<style>
button {
  padding: 8px 16px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

## Project Structure

```
my-app/
├── src/
│   ├── components/      # Reusable components
│   ├── views/          # Page components
│   ├── store/          # State management
│   ├── router/         # Application routing
│   ├── composables/    # Shared composition functions
│   └── styles/         # Global styles
├── public/             # Static assets
└── tests/              # Test files
```

## Architecture

```
packages/
├── runtime/          # Core runtime
├── compiler/         # Template compiler
├── router/           # Routing system
├── state/           # State management
├── testing/         # Testing utilities
└── cli/             # Development tools
```

## Development Tools

kalxjs provides first-class tooling support:

- **@kalxjs/core** (v1.2.7): Core runtime library for reactivity and rendering
- **@kalxjs/cli** (v1.2.28): Command-line interface for project scaffolding
- **@kalxjs/router** (v1.2.7): Routing system for single-page applications
- **@kalxjs/state** (v1.2.7): State management for complex applications
- **@kalxjs/devtools** (v1.2.8): Browser extension for debugging and profiling
- **vite-plugin-kalx**: First-class Vite integration for fast development
- **kalxjs-language-service**: IDE support for .klx files

## Documentation

For detailed documentation, visit:

- [API Reference](./docs/api/README.md) - Detailed API documentation
- [Guides](./docs/guides/README.md) - Step-by-step guides for common tasks
- [Tutorials](./docs/tutorials/README.md) - Practical tutorials to help you learn kalxjs

## Contributing

We welcome contributions of all sizes! Here's how you can help:

### Development Setup

```bash
# Clone repository
git clone https://github.com/Odeneho-Calculus/kalxjs.git

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build all packages
pnpm build
```

### Contribution Guidelines

1. **Commit Messages**: Follow conventional commits
2. **Testing**: Add tests for new features
3. **Documentation**: Update relevant docs
4. **Types**: Maintain TypeScript definitions

### Development Process

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Community

- [Discord Server](https://discord.gg/kalxjs)
- [Twitter](https://twitter.com/kalxjs)
- [Blog](https://blog.kalxjs.org)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/kalxjs)

## License

kalxjs is MIT licensed. See [LICENSE](LICENSE) for details.