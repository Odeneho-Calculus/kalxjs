# KalxJS Single File Components Example

This example demonstrates the use of Single File Components (SFCs) with the `.kal` extension in the KalxJS framework.

## Overview

Single File Components allow you to define a component's template, script, and styles in a single file, making it easier to organize and maintain your components. This approach is similar to Vue's SFC system but uses `.kal` files instead of `.vue` files.

## Components in this Example

1. **Counter.kal**: A simple counter component that demonstrates basic reactivity and event handling.
2. **TodoList.kal**: A more complex todo list component with filtering, local storage persistence, and a clean UI.
3. **App.kal**: A main application component that uses both the Counter and TodoList components.

## Features Demonstrated

- Template syntax with interpolation (`{{ }}`)
- Event handling (`@click`, `@keyup.enter`)
- Conditional rendering (`v-if`)
- List rendering (`v-for` with `:key`)
- Two-way binding (`v-model`)
- Class binding (`:class`)
- Scoped CSS
- Component composition
- Props and events
- Lifecycle hooks
- Computed properties
- Watchers
- Custom blocks (docs)

## How KAL Files Work

Each `.kal` file consists of three main sections:

### 1. Template Section

```html
<template>
  <!-- Your HTML template goes here -->
  <div>{{ message }}</div>
</template>
```

### 2. Script Section

```html
<script>
import { ref } from '@kalxjs/core';

export default {
  name: 'MyComponent',
  
  setup() {
    const message = ref('Hello, KalxJS!');
    return { message };
  }
}
</script>
```

### 3. Style Section

```html
<style scoped>
/* Your component styles go here */
div {
  color: blue;
}
</style>
```

### 4. Optional Custom Blocks

```html
<docs>
# Component Documentation
This is a markdown documentation block for the component.
</docs>
```

## Compilation Process

When you use a `.kal` file in your project, the KalxJS compiler:

1. Parses the file into separate sections (template, script, style, custom blocks)
2. Compiles the template into a render function
3. Processes the script to extract component options
4. Processes styles, adding scoping if needed
5. Combines everything into a JavaScript module that exports the component

## Using the Vite Plugin

To use `.kal` files in your project, you need to configure the Vite plugin:

```js
// vite.config.js
import { defineConfig } from 'vite';
import { kalPlugin } from '@kalxjs/compiler';

export default defineConfig({
  plugins: [
    kalPlugin()
  ]
});
```

## Running this Example

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open your browser and navigate to the local development URL (usually http://localhost:3000)

## Advanced Features

The KalxJS SFC compiler includes several optimizations:

- Static content hoisting
- Patch flags for efficient updates
- Automatic dependency tracking
- Scoped CSS
- Custom block support
- Detailed error reporting

These optimizations help make your components more efficient and easier to debug.