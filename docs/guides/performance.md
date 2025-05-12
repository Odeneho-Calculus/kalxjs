# Performance Optimization Guide

KalxJS provides several built-in performance optimization features to help you build fast and efficient applications.

## Memoization

Memoization is a technique for caching the results of expensive function calls to avoid redundant calculations.

```js
import { memoize } from '@kalxjs/core';

// Create a memoized function
const expensiveCalculation = memoize((a, b) => {
  console.log('Calculating...');
  return a + b;
});

// First call (calculates the result)
console.log(expensiveCalculation(1, 2)); // Logs: Calculating... 3

// Second call with the same arguments (returns cached result)
console.log(expensiveCalculation(1, 2)); // Logs: 3

// Call with different arguments (calculates the result)
console.log(expensiveCalculation(2, 3)); // Logs: Calculating... 5
```

You can also provide a custom key function:

```js
const getUserById = memoize(
  id => fetchUser(id),
  id => `user-${id}`
);
```

## Component Memoization

The `memo` function creates a component that only re-renders when its props change:

```js
import { memo, defineComponent } from '@kalxjs/core';

// Create a memoized component
const MemoizedComponent = memo(defineComponent({
  props: ['message'],
  render() {
    console.log('Rendering MemoizedComponent');
    return h('div', {}, [this.message]);
  }
}));

// Usage
const app = createApp({
  setup() {
    const message = ref('Hello');
    const count = ref(0);
    
    return {
      message,
      count,
      updateMessage: () => { message.value = 'Hello World'; },
      increment: () => { count.value++; }
    };
  },
  render() {
    return h('div', {}, [
      h(MemoizedComponent, { message: this.message }),
      h('div', {}, [`Count: ${this.count}`]),
      h('button', { onClick: this.updateMessage }, ['Update Message']),
      h('button', { onClick: this.increment }, ['Increment'])
    ]);
  }
});
```

In this example, `MemoizedComponent` will only re-render when the `message` prop changes, not when the `count` state changes.

## Lazy Loading

The `lazy` function creates a component that is only loaded when it's needed:

```js
import { lazy, defineComponent } from '@kalxjs/core';

// Create a lazy-loaded component
const LazyComponent = lazy(() => import('./HeavyComponent.js'));

// Usage
const app = createApp({
  render() {
    return h('div', {}, [
      h(LazyComponent, { message: 'Hello' })
    ]);
  }
});
```

The `LazyComponent` will only be loaded when it's rendered for the first time. While it's loading, a loading indicator will be shown.

## Deferred Rendering

The `deferRender` function creates a component that is only rendered when it's visible in the viewport:

```js
import { deferRender, defineComponent } from '@kalxjs/core';

// Create a component
const HeavyComponent = defineComponent({
  render() {
    return h('div', {}, [
      // Lots of content
    ]);
  }
});

// Create a deferred component
const DeferredComponent = deferRender(HeavyComponent, {
  rootMargin: '100px',
  threshold: 0.1,
  once: true
});

// Usage
const app = createApp({
  render() {
    return h('div', {}, [
      h(DeferredComponent, {})
    ]);
  }
});
```

The `DeferredComponent` will only be rendered when it's visible in the viewport. Until then, a placeholder will be shown.

## Virtualized Lists

The `createVirtualList` function creates a component that only renders the items that are visible in the viewport:

```js
import { createVirtualList, defineComponent } from '@kalxjs/core';

// Create a virtualized list component
const VirtualList = createVirtualList({
  itemHeight: 50,
  overscan: 5,
  getKey: (item) => item.id
});

// Usage
const app = createApp({
  setup() {
    const items = ref(Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      text: `Item ${i}`
    })));
    
    return {
      items
    };
  },
  render() {
    return h('div', { style: { height: '500px' } }, [
      h(VirtualList, {
        items: this.items,
        renderItem: (item) => h('div', {}, [item.text])
      })
    ]);
  }
});
```

The `VirtualList` component will only render the items that are visible in the viewport, which can significantly improve performance when rendering large lists.

## Performance Plugin

KalxJS provides a performance plugin that adds all these optimization features to your application:

```js
import { createApp, createPerformancePlugin } from '@kalxjs/core';

const app = createApp({
  // App options
});

// Use the performance plugin
app.use(createPerformancePlugin());

app.mount('#app');
```

Once the plugin is installed, you can access the performance utilities in your components:

```js
export default {
  setup() {
    // Use memoization
    const expensiveCalculation = this.$perf.memoize((a, b) => {
      return a + b;
    });
    
    return {
      calculate: expensiveCalculation
    };
  }
};
```

## Best Practices

1. **Use memoization for expensive calculations**: If you have a function that performs expensive calculations, use `memoize` to cache the results.

2. **Use memo for pure components**: If a component only depends on its props and doesn't have internal state, use `memo` to prevent unnecessary re-renders.

3. **Use lazy loading for large components**: If a component is large and not immediately needed, use `lazy` to load it only when necessary.

4. **Use deferred rendering for below-the-fold content**: If a component is below the fold, use `deferRender` to render it only when it's visible.

5. **Use virtualized lists for large lists**: If you're rendering a large list, use `createVirtualList` to render only the visible items.

6. **Avoid unnecessary re-renders**: Use the reactive system wisely to avoid unnecessary re-renders. For example, use computed properties instead of methods for derived state.

7. **Use the key attribute for lists**: Always use the key attribute when rendering lists to help the virtual DOM algorithm identify which items have changed.

8. **Avoid deep nesting**: Avoid deeply nested component hierarchies, as they can make updates more expensive.

9. **Use the performance plugin**: Use the performance plugin to add all these optimization features to your application.

10. **Measure performance**: Use browser developer tools to measure the performance of your application and identify bottlenecks.