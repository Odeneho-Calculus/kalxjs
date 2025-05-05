<!-- kalxjs/docs/api/component.md -->
# Component API

kalxjs applications are built using a component-based architecture. This page documents the component system API.

## defineComponent()

Defines a kalxjs component with options.

```javascript
import { defineComponent, h } from 'kalxjs';

const Counter = defineComponent({
  // Component options
  data() {
    return {
      count: 0
    };
  },
  methods: {
    increment() {
      this.count++;
    }
  },
  render() {
    return h('div', [
      h('h1', `Count: ${this.count}`),
      h('button', { onClick: this.increment }, 'Increment')
    ]);
  }
});
```

### Arguments

- `{Object} options` - Component options

### Returns

- `{Function}` - Component constructor function

### Component Options

- `data` - Function returning the component's reactive data
- `props` - Object defining the component's props
- `methods` - Object containing component methods
- `computed` - Object containing computed properties
- `render` - Function returning the component's virtual DOM
- `beforeCreate` - Lifecycle hook called before the component is created
- `created` - Lifecycle hook called after the component is created
- `beforeMount` - Lifecycle hook called before the component is mounted
- `mounted` - Lifecycle hook called after the component is mounted
- `beforeUpdate` - Lifecycle hook called before the component updates
- `updated` - Lifecycle hook called after the component updates
- `beforeUnmount` - Lifecycle hook called before the component is unmounted
- `unmounted` - Lifecycle hook called after the component is unmounted

## createComponent()

Low-level API to create a component instance directly.

```javascript
import { createComponent } from 'kalxjs';

const component = createComponent({
  data() {
    return { message: 'Hello' };
  },
  render() {
    return h('div', this.message);
  }
});

// Mount the component
component.$mount('#app');
```

### Arguments

- `{Object} options` - Component options

### Returns

- `{Object}` - Component instance

### Component Instance Methods

- `$mount(element)` - Mount the component to a DOM element
- `$unmount()` - Unmount the component
- `$forceUpdate()` - Force a component update

### Component Instance Properties

- `$data` - Component data object
- `$props` - Component props object
- `$el` - The component's root DOM element
- `$parent` - Parent component (if any)
- `$root` - Root component instance
- `$children` - Array of child components
- `$options` - Component options used during instantiation

## Lifecycle Hooks

kalxjs components have a series of lifecycle hooks that let you run code at specific stages:

- `beforeCreate` - Called before the component instance is created
- `created` - Called after the component instance is created
- `beforeMount` - Called before the component is mounted to the DOM
- `mounted` - Called after the component is mounted to the DOM
- `beforeUpdate` - Called before the component updates due to data changes
- `updated` - Called after the component has updated
- `beforeUnmount` - Called before the component is unmounted from the DOM
- `unmounted` - Called after the component is unmounted from the DOM

Example usage:

```javascript
defineComponent({
  data() {
    return { count: 0 };
  },
  created() {
    console.log('Component created');
  },
  mounted() {
    console.log('Component mounted to DOM');
  },
  beforeUnmount() {
    console.log('Component about to be removed from DOM');
  }
});
```