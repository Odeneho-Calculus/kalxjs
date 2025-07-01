# Reactivity

KALXJS uses a reactive system to automatically update the DOM when your data changes.

## Reactive State

The core of KALXJS's reactivity system is the `ref` and `reactive` functions:

```javascript
import { ref, reactive } from '@kalxjs/core';

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
import { ref, computed } from '@kalxjs/core';

const count = ref(0);
const doubleCount = computed(() => count.value * 2);

console.log(doubleCount.value); // 0
count.value = 2;
console.log(doubleCount.value); // 4
```

## Watchers

Watchers let you perform side effects when reactive state changes:

```javascript
import { ref, watch } from '@kalxjs/core';

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
import { createApp, ref } from '@kalxjs/core';

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

## Advanced Reactivity Features

### Effects

Effects allow you to run side effects when reactive state changes:

```javascript
import { ref, effect } from '@kalxjs/core';

const count = ref(0);

// Create an effect that runs when dependencies change
effect(() => {
  console.log(`The count is now: ${count.value}`);
  document.title = `Count: ${count.value}`;
});

// This will trigger the effect
count.value = 5; // Logs: "The count is now: 5" and updates document title
```

### Handling Complex Scenarios

#### Circular References

The reactivity system handles circular references gracefully:

```javascript
import { reactive } from '@kalxjs/core';

const parent = reactive({ name: 'Parent' });
const child = reactive({ name: 'Child' });

// Create circular reference
parent.child = child;
child.parent = parent;

// This works without issues
parent.child.name = 'Updated Child';
console.log(parent.child.name); // "Updated Child"
```

#### Nested Effects

Effects can be nested, with proper dependency tracking:

```javascript
import { ref, effect } from '@kalxjs/core';

const count = ref(0);
const double = ref(0);

// Outer effect
effect(() => {
  console.log(`Count changed to: ${count.value}`);
  
  // Nested effect
  effect(() => {
    double.value = count.value * 2;
    console.log(`Double is now: ${double.value}`);
  });
});

// This triggers both effects
count.value = 5;
```

#### Computed with Multiple Dependencies

Computed properties can depend on multiple reactive sources:

```javascript
import { ref, computed } from '@kalxjs/core';

const firstName = ref('John');
const lastName = ref('Doe');
const age = ref(30);

const person = computed(() => {
  return {
    fullName: `${firstName.value} ${lastName.value}`,
    isAdult: age.value >= 18
  };
});

console.log(person.value.fullName); // "John Doe"
firstName.value = 'Jane';
console.log(person.value.fullName); // "Jane Doe"
```

## Performance Optimizations

The reactivity system includes several optimizations:

1. **Fine-grained Dependency Tracking**: Only tracks the specific properties that are accessed, not entire objects
2. **Batched Updates**: Multiple state changes in the same event loop are batched for efficiency
3. **Lazy Evaluation**: Computed properties are only recalculated when accessed
4. **Caching**: Computed values are cached until dependencies change
5. **Memory Management**: Automatically cleans up effect dependencies when they're no longer needed

## Reactivity Caveats and Best Practices

1. **Array Mutation Methods**: Use array methods like `push`, `pop`, `shift`, etc. to trigger reactivity.

2. **Adding New Properties**: To add new properties to reactive objects, use:
   ```javascript
   import { reactive } from '@kalxjs/core';
   
   const state = reactive({ count: 0 });
   
   // This won't trigger updates
   state.newProp = 'value';
   
   // Instead, create a new object
   const newState = { ...state, newProp: 'value' };
   Object.assign(state, newState);
   ```

3. **Collection Types**: Maps and Sets are also reactive when wrapped with `reactive`.

4. **Avoid Excessive Nesting**: While the system handles deep nesting, excessive nesting can impact performance.

5. **Use Refs for Primitives**: Always use `ref` for primitive values to ensure reactivity.

6. **Destructuring Loses Reactivity**: When destructuring reactive objects, the reactivity is lost:
   ```javascript
   const state = reactive({ count: 0 });
   
   // This breaks reactivity
   const { count } = state;
   
   // Instead, use computed or toRefs
   import { toRefs } from '@kalxjs/core';
   const { count } = toRefs(state);
   ```

7. **Conditional Access in Effects**: If an effect conditionally accesses reactive properties, it will still re-run when any tracked property changes:
   ```javascript
   effect(() => {
     if (showDetails.value) {
       console.log(user.details); // Only accessed conditionally
     }
   });
   
   // This will trigger the effect even when showDetails is false
   user.details = { age: 30 };
   ```