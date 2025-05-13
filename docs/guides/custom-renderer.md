# Custom Renderer Guide

The KalxJS v2.1.14 Custom Renderer provides a template-based rendering system that bypasses the virtual DOM implementation while still leveraging KalxJS's state management and routing capabilities. This can be useful for applications that need more direct DOM manipulation or when you want to use HTML templates directly.

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

### Using the Custom Renderer with Router and Store

The Custom Renderer works seamlessly with the KalxJS Router and State management:

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

## How the Custom Renderer Works

The Custom Renderer uses a different approach than the virtual DOM:

### Virtual DOM vs. Custom Renderer

| Virtual DOM | Custom Renderer |
|-------------|----------------|
| Creates a virtual representation of the DOM | Works directly with the actual DOM |
| Performs diffing to determine changes | Updates elements directly when state changes |
| More efficient for complex UIs with many updates | More efficient for simpler UIs or when direct DOM access is needed |

### Core Functions

The Custom Renderer provides several core functions:

#### createElement

Creates a DOM element from a virtual DOM node:

```js
import { createElement } from '@kalxjs/core/renderer';

const vnode = {
  tag: 'div',
  props: { class: 'container' },
  children: ['Hello World']
};

const element = createElement(vnode);
document.body.appendChild(element);
```

#### renderToDOM

Renders a virtual DOM node to a DOM container:

```js
import { renderToDOM } from '@kalxjs/core/renderer';

const vnode = {
  tag: 'div',
  props: { class: 'container' },
  children: ['Hello World']
};

renderToDOM(vnode, document.getElementById('app'));
```

#### createSimpleComponent

Creates a simple component with the given content:

```js
import { createSimpleComponent, renderToDOM } from '@kalxjs/core/renderer';

const component = createSimpleComponent('Hello', 'Welcome to KalxJS!');
renderToDOM(component, document.getElementById('app'));
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

### Creating Virtual DOM Nodes Manually

You can create virtual DOM nodes manually:

```js
const vnode = {
  tag: 'div',
  props: { 
    class: 'custom-component',
    style: 'color: blue; font-size: 16px;'
  },
  children: [
    {
      tag: 'h2',
      props: {},
      children: ['Title']
    },
    {
      tag: 'p',
      props: {},
      children: ['Content goes here']
    }
  ]
};

renderToDOM(vnode, document.getElementById('app'));
```

### Error Handling

The Custom Renderer includes robust error handling to prevent application crashes:

```js
try {
  renderToDOM(component, container);
} catch (error) {
  console.error('Rendering error:', error);
  // Fallback to a simple error message
  container.innerHTML = `<div class="error">An error occurred: ${error.message}</div>`;
}
```

## Performance Considerations

The Custom Renderer can provide better performance in certain scenarios:

- Applications with simple DOM structures
- When you need direct DOM manipulation
- When you want to avoid the overhead of virtual DOM diffing

However, for complex applications with frequent updates to many elements, the virtual DOM approach might still be more efficient.

## Fallback Mechanism

The Custom Renderer includes a fallback mechanism that will automatically display an error message if there's an issue during rendering. This ensures your application will still show something to the user even if there are rendering problems:

```js
// This is handled automatically by the Custom Renderer
try {
  // Rendering code
} catch (error) {
  // Fallback HTML is displayed
  container.innerHTML = `
    <div style="padding: 20px; border: 1px solid #d9534f; background-color: #f2dede; color: #a94442; border-radius: 4px; margin: 20px;">
      <h3>Custom Renderer Fallback</h3>
      <p>The custom renderer encountered an issue while rendering content.</p>
      <p>This is a fallback message to ensure you see something instead of a blank page.</p>
      <div style="margin-top: 15px; padding: 10px; background: #f8f8f8; border-radius: 4px;">
        <h4>Error Details:</h4>
        <pre style="overflow: auto; max-height: 200px;">${error.message}</pre>
      </div>
    </div>
  `;
}
```

## Conclusion

The KalxJS Custom Renderer provides a flexible alternative to the virtual DOM approach, allowing you to work directly with HTML templates and the DOM while still leveraging KalxJS's reactivity and component system. It's particularly useful for:

- Applications that need direct DOM manipulation
- Projects migrating from traditional DOM manipulation to a more structured approach
- Performance-critical sections of your application
- Fallback rendering when the main rendering pipeline fails

For more information, check out the [API Reference](../api/renderer.md) and the [Custom Renderer Example](../../examples/custom-renderer-example).