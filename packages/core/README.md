# kalxjs Core

The core package of the kalxjs framework, providing the fundamental functionality for building modern web applications.

## Features

- **Reactive Data Binding**: Automatically updates the DOM when data changes
- **Component-Based Architecture**: Create reusable and modular components
- **Virtual DOM**: Optimize rendering performance with efficient DOM updates
- **Lifecycle Hooks**: Control component behavior at different stages

## Installation

```bash
npm install @kalxjs/core
```

## Basic Usage

```javascript
import kalxjs from '@kalxjs/core';

// Create a reactive object
const state = kalxjs.reactive({
  count: 0
});

// Create a component
const Counter = kalxjs.defineComponent({
  data() {
    return {
      message: 'Counter Example'
    };
  },
  
  methods: {
    increment() {
      state.count++;
    }
  },
  
  render(h) {
    return h('div', { class: 'counter' }, [
      h('h1', {}, this.message),
      h('p', {}, `Count: ${state.count}`),
      h('button', { onClick: this.increment }, 'Increment')
    ]);
  }
});

// Create and mount the app
const app = kalxjs.createApp({
  render(h) {
    return h(Counter);
  }
});

app.mount('#app');
```

## API Documentation

### Reactivity

- `reactive(obj)`: Create a reactive object
- `ref(value)`: Create a reactive reference
- `computed(getter, setter?)`: Create a computed property
- `effect(fn)`: Run a function reactively

### Component System

- `defineComponent(options)`: Define a component
- `createComponent(options)`: Create a component instance

### Rendering

- `h(type, props, ...children)`: Create virtual DOM nodes
- `createElement(tag, props, children)`: Low-level element creation

### Application

- `createApp(options)`: Create a new application instance
  - `app.mount(el)`: Mount the application
  - `app.unmount()`: Unmount the application
  - `app.use(plugin, options?)`: Use a plugin
  - `app.component(name, component)`: Register a global component
  - `app.provide(key, value)`: Provide a value to all components

## License

MIT