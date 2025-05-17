# @kalxjs/composition

Composition API utilities for KalxJs framework.

## Installation

```bash
npm install @kalxjs/composition
```

## Usage

```javascript
import { useWindowSize, useLocalStorage, useMouse, useForm, useDebounce, useAsync } from '@kalxjs/composition';

// Window size hook
const { width, height, breakpoints } = useWindowSize();
console.log(width.value, height.value);
console.log(breakpoints.isMobile.value);

// Local storage hook
const { value, setValue, removeItem } = useLocalStorage('user-preferences', { theme: 'light' });
setValue({ theme: 'dark' });

// Mouse position hook
const { x, y } = useMouse();
console.log(x.value, y.value);

// Form handling hook
const { values, errors, touched, isSubmitting, isValid, setValue, reset, handleSubmit } = useForm(
  { name: '', email: '' },
  (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Name is required';
    if (!values.email) errors.email = 'Email is required';
    return errors;
  },
  async (values) => {
    await api.post('/users', values);
  }
);

// Debounce hook
const searchTerm = ref('');
const debouncedSearchTerm = useDebounce(searchTerm, 500);

// Async hook
const { isLoading, error, data, execute } = useAsync(async (id) => {
  const response = await fetch(`https://api.example.com/users/${id}`);
  return response.json();
});

// Execute the async function
execute(1);
```

## Available Hooks

### useWindowSize

Track window dimensions with reactive references.

### useLocalStorage

Persist state in localStorage with automatic serialization/deserialization.

### useMouse

Track mouse position with reactive references.

### useForm

Manage form state, validation, and submission.

### useDebounce

Create a debounced version of a reactive value.

### useAsync

Handle async operations with loading, error, and data states.

## License

MIT