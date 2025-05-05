<!-- kalxjs/docs/api/reactivity.md -->
# Reactivity API

The reactivity system is one of kalxjs's core features. It allows your application to automatically update the UI when the underlying data changes.

## Import

```javascript
import { ref, reactive, computed, effect } from '@kalxjs-framework/runtime'
```

## ref()

Creates a reactive reference to any value, including primitives.

```javascript
import { ref } from '@kalxjs-framework/runtime'

const count = ref(0)
const message = ref('Hello')

// Access or modify the value using .value
console.log(count.value) // 0
count.value++ // UI will update
```

### Arguments

- `{any} value` - The initial value to make reactive

### Returns

- `{Object}` - A reactive reference object with a `value` property

### Notes

- Use `ref` when you need to make primitive values reactive
- Always use `.value` to access or modify the referenced value
- When used in templates, refs are automatically unwrapped (no need for .value)

## reactive()

Creates a reactive proxy of an object that tracks changes to its properties.

```javascript
import { reactive } from '@kalxjs-framework/runtime'

const state = reactive({
  count: 0,
  message: 'Hello'
})

// Modifying properties triggers updates
state.count++ // UI will update
```

### Arguments

- `{Object} target` - The object to make reactive

### Returns

- `{Proxy}` - A reactive proxy of the object

### Notes

- Only objects can be made reactive. Primitive values like strings and numbers should use `ref()` instead.
- The reactivity is deep by default, meaning all nested objects are also made reactive.
- Unlike refs, reactive objects don't need .value to access or modify properties.

## computed()

Creates a computed property based on a getter function.

```javascript
import { reactive, computed } from '@kalxjs-framework/runtime'

const state = reactive({
  firstName: 'John',
  lastName: 'Doe'
})

const fullName = computed(() => {
  return `${state.firstName} ${state.lastName}`
})

console.log(fullName.value) // "John Doe"
```

### Arguments

- `{Function} getter` - Function that returns the computed value
- `{Object} options` - Optional options object
  - `{Function} [setter]` - Optional function to handle setting the value

### Returns

- `{Object}` - A computed reference object with a `value` property

### Notes

- Computed values are cached and only recalculated when dependencies change
- Computed values are read-only by default unless a setter is provided
- Access the computed value using the `.value` property
- When used in templates, computed refs are automatically unwrapped (no need for .value)

## effect()

Runs a function and automatically tracks its reactive dependencies.

```javascript
import { reactive, effect } from '@kalxjs-framework/runtime'

const state = reactive({ count: 0 })

effect(() => {
  console.log(`Count is: ${state.count}`)
})

// Logs: "Count is: 0"
state.count = 1 // Automatically logs: "Count is: 1"
```

### Arguments

- `{Function} fn` - The function to run reactively
- `{Object} options` - Optional options object
  - `{boolean} [lazy=false]` - If true, the effect is not run immediately
  - `{Function} [scheduler]` - Custom scheduler function

### Returns

- `{Function}` - A wrapped effect function that can be triggered again

### Notes

- Effects automatically re-run when any reactive values they access change
- This is primarily used internally by the framework but can be useful for custom reactivity
- Unlike Vue's watchEffect, effect is lower-level and doesn't handle error boundaries

## Usage with Components

In components, reactive state is typically defined in the `setup()` function:

```javascript
import { ref, computed } from '@kalxjs-framework/runtime'

export default {
  setup() {
    // Reactive state
    const count = ref(0)
    
    // Computed property
    const doubleCount = computed(() => count.value * 2)
    
    // Method
    function increment() {
      count.value++
    }
    
    // Return exposed properties
    return {
      count,
      doubleCount,
      increment
    }
  }
}
```

## Reactivity Caveats

### Array Indexing and Length

Direct array index assignment might not trigger updates in some edge cases. Use array methods like `splice` instead:

```javascript
// This might not trigger updates
state.array[index] = newValue

// Use this instead
state.array.splice(index, 1, newValue)
```

### Adding New Properties

Adding new properties to reactive objects won't automatically trigger updates. Use the spread operator or `Object.assign` to create a new object:

```javascript
// This won't trigger updates
state.newProperty = 'value'

// Use this instead
state = { ...state, newProperty: 'value' }
```

Or use `ref` for properties that might be added later:

```javascript
const state = reactive({
  existingProperty: 'value',
  dynamicProperty: ref(null)
})

// This will trigger updates
state.dynamicProperty.value = 'new value'
```