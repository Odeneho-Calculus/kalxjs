# Composition API Guide

The Composition API is a set of functions that allows you to organize component logic in a more flexible and reusable way. It's an alternative to the Options API and is especially useful for complex components.

## Basic Usage

```js
import { useRef, useComputed, onMounted } from '@kalxjs/core';

export default {
  setup() {
    // Reactive state
    const count = useRef(0);
    
    // Computed property
    const doubleCount = useComputed(() => count.value * 2);
    
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

### useRef

Creates a reactive reference to a value.

```js
import { useRef } from '@kalxjs/core';

const count = useRef(0);
console.log(count.value); // 0
count.value++;
console.log(count.value); // 1
```

### useReactive

Creates a reactive object.

```js
import { useReactive } from '@kalxjs/core';

const state = useReactive({
  count: 0,
  name: 'John'
});

console.log(state.count); // 0
state.count++;
console.log(state.count); // 1
```

### useComputed

Creates a computed property.

```js
import { useRef, useComputed } from '@kalxjs/core';

const count = useRef(0);
const doubleCount = useComputed(() => count.value * 2);

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
import { useLocalStorage } from '@kalxjs/core';

const theme = useLocalStorage('theme', 'light');
console.log(theme.value); // 'light' or the value from localStorage

theme.value = 'dark'; // Updates localStorage
```

### useDebounce

Creates a debounced version of a function.

```js
import { useDebounce } from '@kalxjs/core';

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
import { useThrottle } from '@kalxjs/core';

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
import { useMouse } from '@kalxjs/core';

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
import { useRef, readonly } from '@kalxjs/core';

const count = useRef(0);
const readonlyCount = readonly(count);

count.value++; // Works
readonlyCount.value++; // Error: Cannot set a readonly ref
```

### writableComputed

Creates a computed reference that can be both read and written.

```js
import { useRef, writableComputed } from '@kalxjs/core';

const firstName = useRef('John');
const lastName = useRef('Doe');

const fullName = writableComputed({
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