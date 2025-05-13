# KalxJS v2.1.14

A cutting-edge JavaScript framework for building modern web applications with exceptional performance, developer experience, and scalability. Inspired by Vue.js but with its own unique features and improvements.

## Overview

KalxJS empowers developers to build fast, maintainable applications using modern patterns like:
- Proxy-based reactivity system
- Composition API for better code organization
- Single-file components with `.klx` files
- Virtual DOM for efficient rendering
- Progressive framework design

## Core Features

### Reactivity System
- **Proxy-Based Reactivity**: Fine-grained updates with automatic dependency tracking using JavaScript Proxies
- **Composition API**: Functional approach to organizing component logic
- **Ref and Reactive**: Flexible ways to create reactive state
- **Computed Properties**: Derived state that updates automatically
- **Watch API**: React to state changes with custom logic

### Component System
- **Single-File Components**: Combine template, script, and style in `.klx` files
- **Options API**: Familiar object-based component definition
- **Composition API**: Alternative functional approach for complex components
- **Lifecycle Hooks**: Control component behavior throughout its lifecycle
- **Props and Events**: Clean parent-child component communication

### Performance
- **Virtual DOM**: Intelligent diffing with optimized updates
- **Efficient Rendering**: Only update what changed
- **Lazy Loading**: Load components only when needed
- **Tree Shaking**: Dead code elimination
- **Compiler Optimizations**: Static analysis for better performance

### Unique Features (v2.1.0)
- **Custom Rendering System**: Template-based rendering with native DOM APIs for improved reliability
- **Built-in AI Capabilities**: AI-powered components for text and image generation
- **Native Mobile Bridge**: Native capabilities for hybrid apps
- **Built-in Testing Framework**: Comprehensive testing utilities
- **Server-Side Rendering**: SSR with hydration for better performance and SEO
- **Advanced Animation System**: Timeline-based animations with physics support
- **Built-in State Management**: No need for external state libraries
- **Automatic API Integration**: Simplified data fetching with caching

## Installation

### Prerequisites
- Node.js v16.0.0 or higher (Node.js 18+ recommended)
- Git
- npm v7.0.0 or higher (npm 9+ recommended, or yarn/pnpm)

### Option 1: Direct Clone

```bash
# Clone the repository
git clone https://github.com/Odeneho-Calculus/kalxjs.git

# Navigate to project
cd kalxjs

# Install dependencies and build (Windows)
install.bat

# Or on Unix systems
npm install
./build.sh
```

### Option 2: Package Managers

```bash
# Using npm
npm install @kalxjs/core@2.1.14

# Using yarn
yarn add @kalxjs/core@2.1.14

# Using pnpm
pnpm add @kalxjs/core@2.1.14
```

### Option 3: CDN

```html
<!-- Development version -->
<script src="https://unpkg.com/@kalxjs/core@2.1.14/dist/kalxjs.iife.js"></script>

<!-- Production version -->
<script src="https://unpkg.com/@kalxjs/core@2.1.14/dist/kalxjs.iife.min.js"></script>
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

### Basic Usage

```js
import { createApp, ref, computed } from '@kalxjs/core';

const app = createApp({
  setup() {
    // Reactive state
    const count = ref(0);
    
    // Computed property
    const doubleCount = computed(() => count.value * 2);
    
    // Method
    function increment() {
      count.value++;
    }
    
    // Expose to template
    return {
      count,
      doubleCount,
      increment
    };
  },
  render() {
    return h('div', {}, [
      h('h1', {}, ['Counter']),
      h('p', {}, [`Count: ${this.count.value}`]),
      h('p', {}, [`Double Count: ${this.doubleCount.value}`]),
      h('button', { onClick: this.increment }, ['Increment'])
    ]);
  }
});

app.mount('#app');
```

### Using AI Features

```js
import { createApp, useAI } from '@kalxjs/core';

export default {
  setup() {
    const ai = useAI({
      apiKeys: {
        openai: 'your-api-key'
      }
    });
    
    const prompt = ref('');
    const result = ref('');
    
    async function generateText() {
      result.value = await ai.generateText({
        prompt: prompt.value,
        model: 'gpt-3.5-turbo'
      });
    }
    
    return {
      prompt,
      result,
      generateText
    };
  }
};
```

### Using the Custom Rendering System

```js
import { createRouter } from '@kalxjs/router';
import { createStore } from '@kalxjs/state';
import { createCustomRenderer } from '@kalxjs/core/renderer';

// Create router
const router = createRouter({
  mode: 'hash',
  routes: [
    { path: '/', component: 'home' },
    { path: '/counter', component: 'counter' }
  ]
});

// Create store
const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++;
    }
  }
});

// Create and initialize the custom renderer
const renderer = createCustomRenderer(router, store);
renderer.init('#router-view');
```

### Using the Animation System

```js
import { createTimeline, createTrack, EASING } from '@kalxjs/core';

// Create a timeline
const timeline = createTimeline({
  duration: 1000,
  easing: EASING.EASE_IN_OUT
});

// Add animation tracks
timeline.add(createTrack(
  element.style,
  'transform',
  [
    { time: 0, value: 'translateX(0)' },
    { time: 1, value: 'translateX(200px)' }
  ]
));

// Play the animation
timeline.play();
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

- **@kalxjs/core** (v2.1.14): Core runtime library for reactivity and rendering
- **@kalxjs/cli** (v1.3.9): Command-line interface for project scaffolding
- **@kalxjs/router** (v1.2.32): Routing system for single-page applications
- **@kalxjs/state** (v1.2.28): State management for complex applications
- **@kalxjs/devtools** (v1.3.1): Browser extension for debugging and profiling
- **@kalxjs/ai** (v1.2.8): AI integration utilities for text and image generation
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