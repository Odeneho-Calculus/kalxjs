# Understanding Reactivity in kalxjs v2.1.14

Modern guide to kalxjs's reactivity system including signals, effect scopes, and performance optimizations.

## Core Reactivity Systems

### Signal-Based Reactivity

```typescript
import { signal, computed, effect } from '@kalxjs/core/reactivity'

// Create a signal
const count = signal(0)
const doubled = computed(() => count() * 2)

// Effects automatically track dependencies
effect(() => {
  console.log(`Count is ${count()}, doubled is ${doubled()}`)
})

// Update signal value
count.set(5) // Triggers effect: "Count is 5, doubled is 10"

// Update with previous value
count.update(prev => prev + 1)
```

### Effect Scopes

```typescript
import { effectScope } from '@kalxjs/core/reactivity'

const scope = effectScope()

scope.run(() => {
  const counter = signal(0)
  
  // Effects are automatically cleaned up when scope is disposed
  effect(() => console.log(counter()))
  
  // Nested scopes are also cleaned up
  const childScope = effectScope()
})

// Clean up all effects in scope
scope.stop()
```

## Reactive Data

kalxjs offers several ways to create reactive data:

### 1. Using `reactive()`

The `reactive()` function creates a reactive object:

```javascript
import { reactive } from '@kalxjs/core';

const state = reactive({
  count: 0,
  message: 'Hello'
});

// Modifying the state will trigger UI updates
state.count++;
state.message = 'Hello World';
```

Reactive objects track all property access and modifications, keeping everything reactive.

### 2. Using `ref()`

For simple values, you can use `ref()`:

```javascript
import { ref } from '@kalxjs/core';

const count = ref(0);

// Accessing the value
console.log(count.value); // 0

// Modifying the value
count.value++;
```

Note that you always need to use `.value` to access or modify the value of a ref.

## Computed Properties

Computed properties are values that depend on other reactive values. They're automatically recalculated when their dependencies change:

```javascript
import { reactive, computed } from '@kalxjs/core';

const state = reactive({
  firstName: 'John',
  lastName: 'Doe'
});

const fullName = computed(() => {
  return `${state.firstName} ${state.lastName}`;
});

console.log(fullName.value); // "John Doe"

// When reactive dependencies change, computed values update automatically
state.lastName = 'Smith';
console.log(fullName.value); // "John Smith"
```

## Watching for Changes

You can use the `effect()` function to run side effects when reactive data changes:

```javascript
import { reactive, effect } from '@kalxjs/core';

const state = reactive({
  count: 0
});

effect(() => {
  console.log(`Count changed: ${state.count}`);
});

// This will trigger the effect
state.count = 5; // Console: "Count changed: 5"
```

## Reactivity in Components

kalxjs components automatically integrate with the reactivity system:

```javascript
import { defineComponent, reactive, h } from '@kalxjs/core';

export default defineComponent({
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
    return h('div', {}, [
      h('p', {}, `Count: ${this.count}`),
      h('button', { onClick: this.increment }, 'Increment')
    ]);
  }
});
```

In this component:
1. The `count` data property is automatically made reactive
2. When the button is clicked, `count` is incremented
3. The render function re-runs, updating the DOM with the new count

## Advanced Patterns

### Lazy Computation

```typescript
import { lazy } from '@kalxjs/core/performance'

const expensive = lazy(() => {
  // Only computed when accessed
  return heavyCalculation()
})

// Triggers computation
console.log(expensive())
```

### Batched Updates

```typescript
import { batch } from '@kalxjs/core/reactivity'

batch(() => {
  // Multiple updates are batched into one render
  count.value++
  title.value = 'Updated'
  items.value.push(newItem)
})
```

### Async Effects

```typescript
import { asyncEffect } from '@kalxjs-framework/runtime'

asyncEffect(async () => {
  const data = await fetchData(id.value)
  results.value = data
})
```

## Performance Optimization

```typescript
import { untrack, markRaw } from '@kalxjs-framework/runtime'

// Prevent tracking
const value = untrack(() => state.someValue)

// Mark objects as non-reactive
const rawObject = markRaw({ 
  heavy: 'data' 
})
```

## Best Practices

1. **Use Signals** for simpler reactivity when possible
2. **Scope Effects** for automatic cleanup
3. **Batch Updates** for better performance
4. **Lazy Computation** for expensive calculations
5. **Mark Raw** data that doesn't need reactivity

## Next Steps

- Explore [component lifecycle hooks](./component-lifecycle.md)
- Learn about [state management](./state-management.md)
- See how to [optimize rendering performance](./performance-optimization.md)