# Composition API Guide

The Composition API in KalxJS v2.1.14 is a set of functions that allows you to organize component logic in a more flexible and reusable way. It's an alternative to the Options API and is especially useful for complex components.

## Basic Usage

```js
import { ref, computed, onMounted } from '@kalxjs/core';

export default {
  setup() {
    // Reactive state
    const count = ref(0);
    
    // Computed property
    const doubleCount = computed(() => count.value * 2);
    
    // Method
    function increment() {
      count.value++;
    }
    
    // Lifecycle hook
    onMounted(() => {
      console.log('Component mounted');
    });
    
    // Expose to template
    return {
      count,
      doubleCount,
      increment
    };
  }
};
```

## Reactivity

### ref

Creates a reactive reference to a value.

```js
import { ref } from '@kalxjs/core';

const count = ref(0);
console.log(count.value); // 0
count.value++;
console.log(count.value); // 1
```

### reactive

Creates a reactive object.

```js
import { reactive } from '@kalxjs/core';

const state = reactive({
  count: 0,
  name: 'John'
});

console.log(state.count); // 0
state.count++;
console.log(state.count); // 1
```

### computed

Creates a computed property.

```js
import { ref, computed } from '@kalxjs/core';

const count = ref(0);
const doubleCount = computed(() => count.value * 2);

console.log(doubleCount.value); // 0
count.value++;
console.log(doubleCount.value); // 2
```

### watch

Watches for changes in a reactive source.

```js
import { useRef, watch } from '@kalxjs/core';

const count = useRef(0);

watch(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`);
});

count.value++; // Logs: Count changed from 0 to 1
```

## Lifecycle Hooks

### onCreated

Called when the component is created.

```js
import { onCreated } from '@kalxjs/core';

onCreated(() => {
  console.log('Component created');
});
```

### onBeforeMount

Called before the component is mounted.

```js
import { onBeforeMount } from '@kalxjs/core';

onBeforeMount(() => {
  console.log('Component will be mounted');
});
```

### onMounted

Called when the component is mounted.

```js
import { onMounted } from '@kalxjs/core';

onMounted(() => {
  console.log('Component mounted');
});
```

### onBeforeUpdate

Called before the component is updated.

```js
import { onBeforeUpdate } from '@kalxjs/core';

onBeforeUpdate(() => {
  console.log('Component will be updated');
});
```

### onUpdated

Called when the component is updated.

```js
import { onUpdated } from '@kalxjs/core';

onUpdated(() => {
  console.log('Component updated');
});
```

### onBeforeUnmount

Called before the component is unmounted.

```js
import { onBeforeUnmount } from '@kalxjs/core';

onBeforeUnmount(() => {
  console.log('Component will be unmounted');
});
```

### onUnmounted

Called when the component is unmounted.

```js
import { onUnmounted } from '@kalxjs/core';

onUnmounted(() => {
  console.log('Component unmounted');
});
```

### onErrorCaptured

Called when an error is captured from a child component.

```js
import { onErrorCaptured } from '@kalxjs/core';

onErrorCaptured((error, instance, info) => {
  console.error('Error captured:', error);
  return false; // Prevent the error from propagating
});
```

## Utility Functions

### useLocalStorage

Creates a reactive reference that is synchronized with localStorage.

```js
import { useLocalStorage } from '@kalxjs/core/composition';

const theme = useLocalStorage('theme', 'light');
console.log(theme.value); // 'light' or the value from localStorage

theme.value = 'dark'; // Updates localStorage
```

### useDebounce

Creates a debounced version of a function.

```js
import { useDebounce } from '@kalxjs/core/composition';

const debouncedSearch = useDebounce((query) => {
  // Search logic here
  console.log('Searching for:', query);
}, 300);

// Call the debounced function
debouncedSearch('hello'); // Will only execute after 300ms of inactivity
```

### useThrottle

Creates a throttled version of a function.

```js
import { useThrottle } from '@kalxjs/core/composition';

const throttledScroll = useThrottle(() => {
  // Scroll logic here
  console.log('Scrolling');
}, 100);

// Call the throttled function
window.addEventListener('scroll', throttledScroll);
```

### useMouse

Creates a reactive reference that tracks mouse position.

```js
import { useMouse } from '@kalxjs/core/composition';

const mouse = useMouse();
console.log(mouse.x, mouse.y); // Current mouse position
```

## Advanced Usage

### getCurrentInstance

Gets the current component instance.

```js
import { getCurrentInstance } from '@kalxjs/core';

const instance = getCurrentInstance();
console.log(instance); // Component instance
```

### customRef

Creates a reactive reference with a custom getter and setter.

```js
import { customRef } from '@kalxjs/core';

const debounceRef = (value, delay = 300) => {
  let timeout;
  return customRef((track, trigger) => {
    return {
      get() {
        track();
        return value;
      },
      set(newValue) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          value = newValue;
          trigger();
        }, delay);
      }
    };
  });
};

const text = debounceRef('hello');
text.value = 'world'; // Will only update after 300ms
```

### readonly

Creates a readonly reference.

```js
import { ref, readonly } from '@kalxjs/core';

const count = ref(0);
const readonlyCount = readonly(count);

count.value++; // Works
readonlyCount.value++; // Error: Cannot set a readonly ref
```

### computed with getter and setter

Creates a computed reference that can be both read and written.

```js
import { ref, computed } from '@kalxjs/core';

const firstName = ref('John');
const lastName = ref('Doe');

const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (newValue) => {
    const parts = newValue.split(' ');
    firstName.value = parts[0];
    lastName.value = parts[1];
  }
});

console.log(fullName.value); // 'John Doe'
fullName.value = 'Jane Smith';
console.log(firstName.value); // 'Jane'
console.log(lastName.value); // 'Smith'
```