# kalxjs/docs/tutorials/component-lifecycle.md

# Component Lifecycle in kalxjs

This tutorial explains the lifecycle of kalxjs components and how to use lifecycle hooks effectively.

## Understanding Component Lifecycle

Every kalxjs component goes through a series of initialization steps when it's created, updated, and destroyed. Lifecycle hooks give you the opportunity to run code at specific stages in a component's lifecycle.

## Available Lifecycle Hooks

kalxjs provides the following lifecycle hooks:

### Creation Hooks

1. **beforeCreate**
   - Called before the component instance is initialized
   - Data observation and event/watcher setup have not yet occurred

2. **created**
   - Called after the component instance has been created
   - Data observation, computed properties, methods, and event/watcher callbacks are now active
   - The DOM has not yet been mounted or rendered

### DOM Mounting Hooks

3. **beforeMount**
   - Called right before the component is inserted into the DOM
   - The render function has been compiled but not yet rendered

4. **mounted**
   - Called after the component has been inserted into the DOM
   - All child components have also been mounted
   - Safe to access the DOM and manipulate it directly if needed

### Updating Hooks

5. **beforeUpdate**
   - Called when reactive data changes and before the DOM is re-rendered
   - Good place to access the existing DOM before an update

6. **updated**
   - Called after a data change causes the DOM to re-render
   - All child components will also have been re-rendered
   - Good for post-update operations

### Destruction Hooks

7. **beforeUnmount**
   - Called right before a component is torn down
   - The component is still fully functional at this stage
   - Good for cleanup operations like removing event listeners

8. **unmounted**
   - Called after a component has been removed from the DOM
   - All directives have been unbound and event listeners removed
   - The component instance is effectively destroyed

## Using Lifecycle Hooks

Here's how to use lifecycle hooks in a component:

```javascript
import { defineComponent, h } from 'kalxjs';

export default defineComponent({
  data() {
    return {
      message: 'Hello World'
    };
  },
  
  beforeCreate() {
    console.log('Component is being initialized');
  },
  
  created() {
    console.log('Component has been created');
    // Data is now reactive - you can manipulate it here
    console.log(this.message); // "Hello World"
  },
  
  beforeMount() {
    console.log('Component will be inserted into the DOM soon');
  },
  
  mounted() {
    console.log('Component is now in the DOM');
    // Safe to manipulate the DOM now
    console.log(this.$el); // The root DOM element
  },
  
  beforeUpdate() {
    console.log('Component data changed, update pending');
  },
  
  updated() {
    console.log('Component updated in the DOM');
  },
  
  beforeUnmount() {
    console.log('Component is about to be destroyed');
    // Clean up event listeners, timers, etc.
  },
  
  unmounted() {
    console.log('Component has been destroyed');
  },
  
  render() {
    return h('div', {}, this.message);
  }
});
```

## Common Use Cases for Lifecycle Hooks

### Data Fetching

The `created` hook is ideal for fetching initial data:

```javascript
created() {
  // Fetch data when the component is created
  fetch('https://api.example.com/data')
    .then(response => response.json())
    .then(data => {
      this.apiData = data;
    });
}
```

### DOM Manipulation

Use the `mounted` hook for direct DOM interactions:

```javascript
mounted() {
  // Initialize a third-party library on an element
  if (this.$el) {
    // Example: initialize a chart
    new Chart(this.$el.querySelector('.chart'), {
      // chart options
    });
  }
}
```

### Cleanup

Use `beforeUnmount` for cleanup operations:

```javascript
beforeUnmount() {
  // Remove event listeners
  window.removeEventListener('resize', this.handleResize);
  
  // Clear intervals or timeouts
  clearInterval(this.timer);
}
```

## Lifecycle Flow Diagram

```
Creation:
  ↓ new Component()
  ↓ beforeCreate()
  ↓ Initialize data, computed, methods, etc.
  ↓ created()
  ↓ Compile template/render function
  ↓ beforeMount()
  ↓ Create DOM elements
  ↓ mounted()

Updates:
  ↓ Data changes
  ↓ beforeUpdate()
  ↓ Re-render virtual DOM and patch
  ↓ updated()

Destruction:
  ↓ Component removal triggered
  ↓ beforeUnmount()
  ↓ Remove DOM elements
  ↓ unmounted()
```

## Best Practices

1. **Avoid using `mounted` for data initialization** - Use `created` instead to avoid delaying DOM rendering.
2. **Always clean up** - Remove event listeners and timers in `beforeUnmount`.
3. **Don't rely on child component order** - When a parent component's `mounted` hook is called, children may not be mounted yet.
4. **Use lifecycle hooks sparingly** - Too many hooks can make a component harder to understand.

## Next Steps

- Learn about [component communication](./component-communication.md)
- Explore [routing in kalxjs](./routing.md)
- Check out [state management](./state-management.md)