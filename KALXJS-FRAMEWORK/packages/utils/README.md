# @kalxjs/utils

> Utility functions for KalxJS applications

This package provides common utility functions for KalxJS applications.

## Installation

```bash
npm install @kalxjs/utils
```

## Usage

```js
import { debounce, throttle, deepClone } from '@kalxjs/utils';

// Debounce a function
const debouncedFn = debounce(() => {
  console.log('Debounced function called');
}, 300);

// Throttle a function
const throttledFn = throttle(() => {
  console.log('Throttled function called');
}, 300);

// Deep clone an object
const original = { a: 1, b: { c: 2 } };
const clone = deepClone(original);
```

## API

### Function Utilities

- `debounce(fn, wait, immediate)`: Creates a debounced function
- `throttle(fn, wait, options)`: Creates a throttled function
- `once(fn)`: Creates a function that is restricted to be called only once

### Object Utilities

- `deepClone(obj)`: Creates a deep clone of an object
- `deepMerge(target, ...sources)`: Deep merges objects
- `pick(obj, keys)`: Creates an object with the picked object properties
- `omit(obj, keys)`: Creates an object with properties omitted

### Array Utilities

- `unique(array)`: Returns a new array with unique values
- `flatten(array)`: Flattens an array
- `groupBy(array, key)`: Groups array items by key

### String Utilities

- `capitalize(str)`: Capitalizes the first letter of a string
- `camelCase(str)`: Converts a string to camelCase
- `kebabCase(str)`: Converts a string to kebab-case
- `snakeCase(str)`: Converts a string to snake_case

### DOM Utilities

- `addClass(el, className)`: Adds a class to an element
- `removeClass(el, className)`: Removes a class from an element
- `toggleClass(el, className)`: Toggles a class on an element
- `hasClass(el, className)`: Checks if an element has a class

## License

MIT