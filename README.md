# kalxjs

A cutting-edge, open-source JavaScript framework for modern web development.

## Overview

kalxjs is designed to empower developers to build dynamic, scalable, and high-performance web applications. Inspired by the flexibility and reactivity of frameworks like Vue, React, and Angular, kalxjs provides a seamless development experience with a focus on simplicity, performance, and extensibility.

## Key Features

- **Reactive Data Binding**: Automatic DOM updates when data changes
- **Component-Based Architecture**: Create reusable and modular components
- **Virtual DOM**: Optimize rendering performance
- **Built-in Routing**: Handle navigation within single-page applications
- **Single File Components**: Write components in .klx files with template, script, and style blocks
- **First-Class Development Tools**: HMR, TypeScript support, and IDE features for .klx files
- **State Management**: Centralized state management solution
- **CLI Tool**: Streamline project setup and development
- **Plugin System**: Extend functionality through plugins
- **Performance Optimization**: Lazy loading, code splitting, and SSR support
- **Developer Tools**: Rich set of tools for debugging and profiling

## Installation

```bash
# npm
npm install kalxjs

# yarn
yarn add kalxjs

# Using CLI
npm install -g kalxjs-cli
kalxjs create my-project
```

## Quick Start

Create a new project:

```bash
npm create kalx@latest my-klx-app
cd my-klx-app
npm install
npm run dev
```

Create a Single File Component (Counter.klx):

```klx
<template>
  <div class="counter">
    <h2>{{ title }}</h2>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<script setup>
import { ref } from 'kalxjs'

const title = ref('Counter Component')
const count = ref(0)

function increment() {
  count.value++
}
</script>

<style scoped>
.counter {
  text-align: center;
  padding: 20px;
}

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

Use components in your app (App.klx):

```klx
<template>
  <div class="app">
    <Counter />
  </div>
</template>

<script setup>
import Counter from './components/Counter.klx'
</script>
```

## Development Tools

KalxJS provides first-class tooling support:

- **@kalx/compiler-sfc**: Compiles .klx files into JavaScript
- **vite-plugin-klx**: First-class Vite integration
- **@kalx/language-service**: TypeScript and IDE support
- **klx-loader**: Webpack integration
- **@kalx/devtools**: Browser devtools extension

## Project Structure

```
my-klx-app/
├── src/
│   ├── components/
│   │   └── Counter.klx
│   ├── App.klx
│   └── main.js
├── vite.config.js
└── package.json
```

## Project Setup

Use our Vite-based template to get started quickly:

```bash
# npm
npm create kalx@latest my-klx-app

# yarn
yarn create kalx my-klx-app

# pnpm
pnpm create kalx my-klx-app
```

## Documentation

For detailed documentation, visit:

- [API Reference](./docs/api/README.md)
- [Guides](./docs/guides/README.md)
- [Tutorials](./docs/tutorials/README.md)

## Contributing