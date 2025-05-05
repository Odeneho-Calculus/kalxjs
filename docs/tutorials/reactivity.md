# kalxjs/docs/tutorials/reactivity.md

# Understanding Reactivity in kalxjs

This tutorial explains kalxjs's reactivity system and how to use it effectively in your applications.

## What is Reactivity?

Reactivity is the system that allows kalxjs to automatically update the DOM when your data changes. When you modify reactive data, any part of the UI that depends on that data will automatically update.

## Reactive Data

kalxjs offers several ways to create reactive data:

### 1. Using `reactive()`

The `reactive()` function creates a reactive object:

```javascript
import { reactive } from 'kalxjs';

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
import { ref } from 'kalxjs';

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
import { reactive, computed } from 'kalxjs';

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
import { reactive, effect } from 'kalxjs';

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
import { defineComponent, reactive, h } from 'kalxjs';

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

## Best Practices

1. **Avoid directly modifying nested objects/arrays** - Always update reactive objects using their methods or properties.
2. **Use computed properties** for derived values instead of methods.
3. **Keep reactive data simple** - Complex nested structures can be harder to track.
4. **Avoid unnecessary reactivity** - Not everything needs to be reactive.

## Next Steps

- Explore [component lifecycle hooks](./component-lifecycle.md)
- Learn about [state management](./state-management.md)
- See how to [optimize rendering performance](./performance-optimization.md)