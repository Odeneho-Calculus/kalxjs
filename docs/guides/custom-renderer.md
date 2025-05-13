# Custom Renderer Guide

The KalxJS Custom Renderer provides a template-based rendering system that bypasses the virtual DOM implementation while still leveraging KalxJS's state management and routing capabilities. This can be useful for applications that need more direct DOM manipulation or when you want to use HTML templates directly.

## Overview

The Custom Renderer works by:

1. Using HTML templates directly from your project
2. Binding data from your store to the DOM
3. Setting up event listeners for user interactions
4. Updating the DOM when state changes

This approach can provide better performance in certain scenarios and offers a more direct way to work with the DOM.

## Getting Started

### Enable the Custom Renderer

When creating a new KalxJS application, you can enable the Custom Renderer during project creation:

```bash
npx @kalxjs/cli create my-app
# Select "Yes" when asked about Custom Renderer support
```

In an existing application, you can enable the Custom Renderer by adding the following to your main.js file:

```js
import { createApp } from '@kalxjs/core';
import App from './App';

const app = createApp(App);

// Enable the custom renderer
app.useCustomRenderer(true);

app.mount('#app');
```

### Creating Templates

Create HTML templates in your project's `src/templates` directory:

```html
<!-- src/templates/counter.html -->
<div class="counter-container">
  <h2>Counter Example</h2>
  <div class="counter-value" id="counter-value">0</div>
  <div class="counter-info">
    Double: <span id="double-count">0</span>
  </div>
  <div>
    <button id="decrement-button">-</button>
    <button id="increment-button">+</button>
  </div>
</div>
```

### Using the Custom Renderer with Router

The Custom Renderer works seamlessly with the KalxJS Router:

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
    },
    decrement(state) {
      state.count--;
    }
  }
});

// Create and initialize the custom renderer
const renderer = createCustomRenderer(router, store);
renderer.init('#router-view');
```

## Advanced Usage

### Direct DOM Manipulation

You can directly manipulate the DOM in your components:

```js
// Update counter value
document.getElementById('counter-value').textContent = store.state.count;

// Add event listeners
document.getElementById('increment-button').addEventListener('click', () => {
  store.commit('increment');
});
```

### Template Components

You can create reusable template components:

```js
import { createTemplateComponent } from '@kalxjs/core/template';

const Counter = createTemplateComponent({
  template: `
    <div class="counter">
      <h2>{{ title }}</h2>
      <div>Count: {{ count }}</div>
      <button @click="increment">+</button>
    </div>
  `,
  props: {
    title: 'Counter'
  },
  data() {
    return {
      count: 0
    };
  },
  methods: {
    increment() {
      this.setState({ count: this.getState('count') + 1 });
    }
  }
});

// Mount the component
Counter.mount('#counter-container');
```

## Performance Considerations

The Custom Renderer can provide better performance in certain scenarios:

- Applications with simple DOM structures
- When you need direct DOM manipulation
- When you want to avoid the overhead of virtual DOM diffing

However, for complex applications with frequent updates to many elements, the virtual DOM approach might still be more efficient.

## Fallback Mechanism

The Custom Renderer includes a fallback mechanism that will automatically revert to the virtual DOM renderer if there's an error during initialization. This ensures your application will still work even if there are issues with the Custom Renderer.

## Conclusion

The KalxJS Custom Renderer provides a flexible alternative to the virtual DOM approach, allowing you to work directly with HTML templates and the DOM while still leveraging KalxJS's reactivity and component system.

For more information, check out the [API Reference](../api/renderer.md) and the [Custom Renderer Example](../../examples/custom-renderer-example).