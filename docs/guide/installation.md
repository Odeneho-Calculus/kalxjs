# Installation Guide

There are several ways to install and use KalxJS in your project.

## Using NPM or Yarn

The recommended way to install KalxJS is using NPM or Yarn:

```bash
# Using NPM
npm install @kalxjs/core

# Using Yarn
yarn add @kalxjs/core

# Using PNPM
pnpm add @kalxjs/core
```

Then you can import KalxJS in your JavaScript files:

```js
// ESM
import { createApp, ref, computed } from '@kalxjs/core';

// CommonJS
const { createApp, ref, computed } = require('@kalxjs/core');
```

## Using CDN

You can also use KalxJS directly from a CDN:

```html
<!-- Development version -->
<script src="https://unpkg.com/@kalxjs/core@2.0.0/dist/kalxjs.iife.js"></script>

<!-- Production version -->
<script src="https://unpkg.com/@kalxjs/core@2.0.0/dist/kalxjs.iife.min.js"></script>
```

Or using jsDelivr:

```html
<!-- Development version -->
<script src="https://cdn.jsdelivr.net/npm/@kalxjs/core@2.0.0/dist/kalxjs.iife.js"></script>

<!-- Production version -->
<script src="https://cdn.jsdelivr.net/npm/@kalxjs/core@2.0.0/dist/kalxjs.iife.min.js"></script>
```

When using KalxJS from a CDN, it will be available as a global variable `kalxjs`:

```html
<script>
  const { createApp, ref, computed } = kalxjs;
  
  const app = createApp({
    setup() {
      const count = ref(0);
      const doubleCount = computed(() => count.value * 2);
      
      function increment() {
        count.value++;
      }
      
      return {
        count,
        doubleCount,
        increment
      };
    }
  });
  
  app.mount('#app');
</script>
```

## Using with a Build Tool

### Vite

```bash
# Create a new Vite project
npm create vite@latest my-kalxjs-app -- --template vanilla

# Navigate to the project directory
cd my-kalxjs-app

# Install KalxJS
npm install @kalxjs/core
```

Then update your `main.js` file:

```js
import { createApp, ref, computed } from '@kalxjs/core';
import './style.css';

const app = createApp({
  setup() {
    const count = ref(0);
    const doubleCount = computed(() => count.value * 2);
    
    function increment() {
      count.value++;
    }
    
    return {
      count,
      doubleCount,
      increment
    };
  },
  render() {
    return h('div', {}, [
      h('h1', {}, ['KalxJS Counter']),
      h('p', {}, [`Count: ${this.count.value}`]),
      h('p', {}, [`Double Count: ${this.doubleCount.value}`]),
      h('button', { onClick: this.increment }, ['Increment'])
    ]);
  }
});

app.mount('#app');
```

### Webpack

```bash
# Install Webpack and related packages
npm install webpack webpack-cli webpack-dev-server --save-dev

# Install KalxJS
npm install @kalxjs/core
```

Create a `webpack.config.js` file:

```js
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public')
    },
    compress: true,
    port: 9000
  }
};
```

Then create your `src/index.js` file:

```js
import { createApp, ref, computed } from '@kalxjs/core';

const app = createApp({
  setup() {
    const count = ref(0);
    const doubleCount = computed(() => count.value * 2);
    
    function increment() {
      count.value++;
    }
    
    return {
      count,
      doubleCount,
      increment
    };
  },
  render() {
    return h('div', {}, [
      h('h1', {}, ['KalxJS Counter']),
      h('p', {}, [`Count: ${this.count.value}`]),
      h('p', {}, [`Double Count: ${this.doubleCount.value}`]),
      h('button', { onClick: this.increment }, ['Increment'])
    ]);
  }
});

app.mount('#app');
```

## Using with Single-File Components

To use KalxJS with single-file components (`.klx` files), you need to install the compiler:

```bash
npm install @kalxjs/compiler
```

### Webpack Configuration

```js
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.klx$/,
        use: '@kalxjs/compiler/dist/webpack-loader'
      }
    ]
  }
};
```

### Vite Configuration

```js
// vite.config.js
import { defineConfig } from 'vite';
import { viteKlxPlugin } from '@kalxjs/compiler';

export default defineConfig({
  plugins: [
    viteKlxPlugin()
  ]
});
```

Then you can import `.klx` files in your JavaScript:

```js
import Counter from './Counter.klx';

const app = createApp({
  render() {
    return h(Counter, {});
  }
});

app.mount('#app');
```

## Optional Packages

KalxJS has several optional packages that you can install:

```bash
# Router
npm install @kalxjs/router

# State management (if you don't want to use the built-in one)
npm install @kalxjs/state

# Developer tools
npm install @kalxjs/devtools

# CLI tools
npm install @kalxjs/cli
```

## Next Steps

Now that you have installed KalxJS, you can start building your application. Check out the following guides:

- [Getting Started](./getting-started.md)
- [Composition API](./composition-api.md)
- [State Management](./state-management.md)
- [API Integration](./api-integration.md)
- [Performance Optimization](./performance.md)