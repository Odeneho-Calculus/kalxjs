# Custom Renderer API Reference

## Overview

The Custom Renderer API in KalxJS provides a template-based rendering system that works directly with the DOM instead of using a virtual DOM. This approach can offer better performance in certain scenarios and provides a fallback rendering mechanism when needed.

## Installation

```bash
# Install latest version
npm install @kalxjs/core@latest
```

Current version: 2.2.3

## Importing

```js
// Import the custom renderer functions
import { createElement, renderToDOM, createSimpleComponent } from '@kalxjs/core/renderer';

// Import the custom renderer factory
import { createCustomRenderer } from '@kalxjs/core/renderer';
```

## Core Functions

### createElement

Creates a DOM element from a virtual DOM node.

```js
const element = createElement(vnode);
```

**Parameters:**
- `vnode` (Object|String|Number): Virtual DOM node, string, or number
  - If `vnode` is a string or number, a text node is created
  - If `vnode` is an object, it should have the following structure:
    - `tag` (String): HTML tag name
    - `props` (Object): Element properties and attributes
    - `children` (Array|String|Number): Child nodes

**Returns:**
- (HTMLElement): Created DOM element

**Example:**
```js
const vnode = {
  tag: 'div',
  props: { 
    class: 'container',
    style: 'color: blue'
  },
  children: ['Hello World']
};

const element = createElement(vnode);
document.body.appendChild(element);
```

### renderToDOM

Renders a virtual DOM node to a DOM container.

```js
renderToDOM(vnode, container);
```

**Parameters:**
- `vnode` (Object|String|Number): Virtual DOM node to render
- `container` (HTMLElement): DOM container to render into

**Example:**
```js
const vnode = {
  tag: 'div',
  props: { class: 'greeting' },
  children: ['Hello World']
};

renderToDOM(vnode, document.getElementById('app'));
```

### createSimpleComponent

Creates a simple component with the given content.

```js
const component = createSimpleComponent(title, message);
```

**Parameters:**
- `title` (String): Component title
- `message` (String): Component message

**Returns:**
- (Object): Virtual DOM node representing the component

**Example:**
```js
const component = createSimpleComponent('Welcome', 'Hello to KalxJS!');
renderToDOM(component, document.getElementById('app'));
```

## Custom Renderer Factory

### createCustomRenderer

Creates a new custom renderer instance that integrates with KalxJS router and state management.

```js
const renderer = createCustomRenderer(router, store);
```

**Parameters:**
- `router` (Object): KalxJS router instance
- `store` (Object): KalxJS state store instance

**Returns:**
- (Object): Custom renderer instance with methods for rendering components

**Example:**
```js
import { createRouter } from '@kalxjs/router';
import { createStore } from '@kalxjs/state';
import { createCustomRenderer } from '@kalxjs/core/renderer';

// Create router
const router = createRouter({
  routes: [
    { path: '/', component: 'home' },
    { path: '/about', component: 'about' }
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
renderer.init('#app');
```

## CustomRenderer Methods

### init

Initializes the renderer with a container element.

```js
renderer.init(selector);
```

**Parameters:**
- `selector` (String|HTMLElement): CSS selector or DOM element for the router view

**Example:**
```js
renderer.init('#app');
```

## Error Handling

The Custom Renderer includes robust error handling to prevent application crashes:

### Error Types Handled

1. **Invalid Virtual Node**: When a virtual node is missing required properties
2. **Component Function Errors**: When a component function throws an error
3. **Invalid Tag Names**: When trying to create an element with an invalid tag
4. **Property Setting Errors**: When setting properties on an element fails
5. **Child Creation Errors**: When creating child elements fails

### Error Display

When an error occurs, the Custom Renderer will display a fallback error message instead of crashing:

```js
// This happens automatically when an error occurs
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
```

## Working with Virtual DOM Nodes

### Virtual DOM Node Structure

A virtual DOM node is an object with the following structure:

```js
{
  tag: 'div',           // HTML tag name (required)
  props: {              // Properties and attributes (optional)
    class: 'container',
    style: 'color: blue',
    onClick: () => alert('Clicked!')
  },
  children: [           // Child nodes (optional)
    'Text content',
    {
      tag: 'span',
      props: { class: 'highlight' },
      children: ['Nested content']
    }
  ]
}
```

### Special Properties

The Custom Renderer handles several special properties:

1. **Event Handlers**: Properties starting with `on` (e.g., `onClick`) are treated as event listeners
2. **Style Objects**: The `style` property can be an object with CSS properties
3. **Class Names**: Both `class` and `className` properties are supported
4. **Inner HTML**: The `dangerouslySetInnerHTML` property can be used to set raw HTML

Example:
```js
const vnode = {
  tag: 'div',
  props: {
    class: 'container',
    style: { color: 'blue', fontSize: '16px' },
    onClick: () => console.log('Clicked!'),
    dangerouslySetInnerHTML: { __html: '<strong>Bold text</strong>' }
  },
  children: []
};
```

## Integration with KalxJS

### Using with Router and State

The Custom Renderer is designed to work seamlessly with KalxJS router and state management:

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
renderer.init('#app');

// Update the DOM when state changes
store.subscribe((mutation, state) => {
  if (mutation.type === 'increment') {
    document.getElementById('counter-value').textContent = state.count;
  }
});
```

## Performance Considerations

The Custom Renderer can provide better performance in certain scenarios:

- Applications with simple DOM structures
- When you need direct DOM manipulation
- When you want to avoid the overhead of virtual DOM diffing

However, for complex applications with frequent updates to many elements, the virtual DOM approach might still be more efficient.

## Browser Support

The Custom Renderer supports all modern browsers. For older browsers, you may need to include appropriate polyfills for modern JavaScript features.

## Implementation Details

The Custom Renderer is implemented as a lightweight alternative to the Virtual DOM system:

### Direct DOM Manipulation

Unlike the Virtual DOM approach, the Custom Renderer directly creates and manipulates DOM elements:

```javascript
// Simplified implementation of createElement
function createElement(vnode) {
  // Handle text nodes
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return document.createTextNode(vnode);
  }
  
  // Create element
  const element = document.createElement(vnode.tag);
  
  // Set properties
  if (vnode.props) {
    for (const [key, value] of Object.entries(vnode.props)) {
      // Handle event handlers
      if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      }
      // Handle style objects
      else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      }
      // Handle regular attributes
      else {
        element[key] = value;
      }
    }
  }
  
  // Add children
  if (vnode.children) {
    for (const child of Array.isArray(vnode.children) ? vnode.children : [vnode.children]) {
      element.appendChild(createElement(child));
    }
  }
  
  return element;
}
```

### Error Handling

The Custom Renderer includes robust error handling to prevent application crashes:

```javascript
// Simplified error handling implementation
function safeRender(vnode, container) {
  try {
    // Clear container
    container.innerHTML = '';
    
    // Create and append element
    const element = createElement(vnode);
    container.appendChild(element);
  } catch (error) {
    // Display fallback error message
    container.innerHTML = `
      <div style="padding: 20px; border: 1px solid #d9534f; background-color: #f2dede; color: #a94442;">
        <h3>Rendering Error</h3>
        <p>${error.message}</p>
      </div>
    `;
    
    // Log error for debugging
    console.error('Custom Renderer Error:', error);
  }
}
```

### Integration with Router and State

The Custom Renderer integrates with the router and state management through a subscription model:

```javascript
// Simplified integration implementation
function createCustomRenderer(router, store) {
  let container = null;
  
  // Initialize renderer
  function init(selector) {
    container = typeof selector === 'string' 
      ? document.querySelector(selector) 
      : selector;
    
    // Subscribe to router changes
    router.afterEach(() => {
      renderCurrentRoute();
    });
    
    // Subscribe to store changes
    store.subscribe(() => {
      renderCurrentRoute();
    });
    
    // Initial render
    renderCurrentRoute();
  }
  
  // Render current route
  function renderCurrentRoute() {
    const component = router.currentRoute.value.component;
    if (typeof component === 'function') {
      const vnode = component({ store });
      safeRender(vnode, container);
    }
  }
  
  return { init };
}
```

## Version Information

For detailed version history and changes, please refer to the [CHANGELOG.md](https://github.com/Odeneho-Calculus/kalxjs/blob/main/KALXJS-FRAMEWORK/packages/core/CHANGELOG.md) file in the repository.