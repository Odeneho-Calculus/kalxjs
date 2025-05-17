# Reactivity

KALXJS uses a reactive system to automatically update the DOM when your data changes.

## Reactive State

The core of KALXJS's reactivity system is the `ref` and `reactive` functions:

```javascript
import { ref, reactive } from 'kalxjs-framework/core';

// For primitive values
const count = ref(0);

// Access or modify the value
console.log(count.value); // 0
count.value++;
console.log(count.value); // 1

// For objects
const state = reactive({
  name: 'John',
  age: 30
});

// Access or modify properties directly
console.log(state.name); // 'John'
state.age++;
console.log(state.age); // 31
```

## Computed Properties

Computed properties are derived values that automatically update when their dependencies change:

```javascript
import { ref, computed } from 'kalxjs-framework/core';

const count = ref(0);
const doubleCount = computed(() => count.value * 2);

console.log(doubleCount.value); // 0
count.value = 2;
console.log(doubleCount.value); // 4
```

## Watchers

Watchers let you perform side effects when reactive state changes:

```javascript
import { ref, watch } from 'kalxjs-framework/core';

const count = ref(0);

// Watch a single ref
watch(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`);
});

// Watch multiple sources
const name = ref('John');
watch([count, name], ([newCount, newName], [oldCount, oldName]) => {
  console.log(`Count: ${oldCount} -> ${newCount}, Name: ${oldName} -> ${newName}`);
});

// Deep watching with options
const user = reactive({ name: 'John', address: { city: 'New York' } });
watch(
  () => user,
  (newValue, oldValue) => {
    console.log('User changed:', newValue);
  },
  { deep: true }
);
```

## Using Reactivity in Components

Reactivity is integrated into the component system:

```javascript
import { createApp, ref } from 'kalxjs-framework/core';

const App = {
  setup() {
    // Create reactive state
    const count = ref(0);
    
    // Create methods that modify state
    const increment = () => {
      count.value++;
    };
    
    // Return values to expose to the template
    return {
      count,
      increment
    };
  },
  template: `
    <div>
      <p>Count: {{ count }}</p>
      <button @click="increment">Increment</button>
    </div>
  `
};

const app = createApp(App);
app.mount('#app');
```

## Reactivity Caveats

1. **Array Mutation Methods**: Use array methods like `push`, `pop`, `shift`, etc. to trigger reactivity.

2. **Adding New Properties**: To add new properties to reactive objects, use:
   ```javascript
   import { reactive } from 'kalxjs-framework/core';
   
   const state = reactive({ count: 0 });
   
   // This won't trigger updates
   state.newProp = 'value';
   
   // Instead, create a new object
   const newState = { ...state, newProp: 'value' };
   Object.assign(state, newState);
   ```

3. **Collection Types**: Maps and Sets are also reactive when wrapped with `reactive`.