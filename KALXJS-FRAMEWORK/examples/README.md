# KALXJS Framework Examples

This directory contains example applications built with the KALXJS Framework to demonstrate its features and capabilities.

## Examples

### Counter
A simple counter application demonstrating basic reactivity and event handling.

```bash
# Navigate to the counter example
cd counter

# Open index.html in your browser
```

### Todo App
A more complex todo application demonstrating state management, components, and conditional rendering.

```bash
# Navigate to the todo-app example
cd todo-app

# Open index.html in your browser
```

### Blog App
A blog application demonstrating routing, forms, and more advanced state management.

```bash
# Navigate to the blog-app example
cd blog-app

# Open index.html in your browser
```

## Running the Examples

Each example is a standalone HTML file that can be opened directly in a browser. For the best experience, you should build the framework packages first:

```bash
# From the root directory
npm run build

# Or build specific packages
npm run build:core
npm run build:router
npm run build:state
```

## Creating Your Own Examples

Feel free to use these examples as a starting point for your own applications. The basic structure of a KALXJS application includes:

1. Import the necessary packages
2. Define your components
3. Create an app instance
4. Mount the app to a DOM element

```javascript
import { createApp } from '../../packages/core/dist/kalxjs-core.esm.js';

const App = {
  template: `<div>Hello KALXJS!</div>`
};

const app = createApp(App);
app.mount('#app');
```