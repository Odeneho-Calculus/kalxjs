<!-- kalxjs/docs/api/reactivity.md -->
# Reactivity API

The reactivity system is one of kalxjs's core features. It allows your application to automatically update the UI when the underlying data changes.

## reactive()

Creates a reactive proxy of an object that tracks changes to its properties.

```javascript
import { reactive } from 'kalxjs';

const state = reactive({
  count: 0,
  message: 'Hello'
});

// Modifying properties triggers updates
state.count++; // UI will update
```

### Arguments

- `{Object} target` - The object to make reactive

### Returns

- `{Proxy}` - A reactive proxy of the object

### Notes

- Only objects can be made reactive. Primitive values like strings and numbers should use `ref()` instead.
- The reactivity is deep by default, meaning all nested objects are also made reactive.

## ref()

Creates a reactive reference to any value, including primitives.

```javascript
import { ref } from 'kalxjs';

const count = ref(0);
const message = ref('Hello');

// Access or modify the value using .value
console.log(count.value); // 0
count.value++; // UI will update
```

### Arguments

- `{any} value` - The value to make reactive

### Returns

- `{Object}` - A reactive reference object with a `value` property

### Notes

- Use `ref` when you need to make primitive values reactive
- Always use `.value` to access or modify the referenced value

## computed()

Creates a computed property based on a getter function.

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
```

### Arguments

- `{Function} getter` - Function that returns the computed value
- `{Function} [setter]` - Optional function to handle setting the value

### Returns

- `{Object}` - A computed reference object with a `value` property

### Notes

- Computed values are cached and only recalculated when dependencies change
- Computed values are read-only by default unless a setter is provided

## effect()

Runs a function and automatically tracks its reactive dependencies.

```javascript
import { reactive, effect } from 'kalxjs';

const state = reactive({ count: 0 });

effect(() => {
  console.log(`Count is: ${state.count}`);
});

// Logs: "Count is: 0"
state.count = 1; // Automatically logs: "Count is: 1"
```

### Arguments

- `{Function} fn` - The function to run reactively

### Returns

- `{Function}` - A wrapped effect function that can be triggered again

### Notes

- Effects automatically re-run when any reactive values they access change
- This is primarily used internally by the framework but can be useful for custom reactivity