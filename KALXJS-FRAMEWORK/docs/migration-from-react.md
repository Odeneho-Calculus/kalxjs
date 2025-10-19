# Migrating from React to KALXJS

This guide helps React developers transition to KALXJS smoothly.

## Key Differences

### Reactivity Model

**React:**
```javascript
const [count, setCount] = useState(0);
setCount(count + 1);
```

**KALXJS:**
```javascript
const count = ref(0);
count.value++; // Direct mutation
```

### Components

**React:**
```jsx
function Counter({ initial }) {
  const [count, setCount] = useState(initial);
  return <div onClick={() => setCount(count + 1)}>{count}</div>;
}
```

**KALXJS:**
```vue
<template>
  <div @click="count++">{{ count }}</div>
</template>

<script>
import { ref } from '@kalxjs/core';

export default {
  props: ['initial'],
  setup(props) {
    const count = ref(props.initial);
    return { count };
  },
};
</script>
```

## Concept Mapping

| React | KALXJS | Notes |
|-------|--------|-------|
| `useState` | `ref` | KALXJS uses `.value` |
| `useEffect` | `watchEffect` | Auto-tracking |
| `useMemo` | `computed` | Cached computed values |
| `useCallback` | N/A | Not needed (no re-renders) |
| `useRef` | `ref` | Same concept |
| `useContext` | `provide/inject` | Dependency injection |
| `useReducer` | Store | Use Pinia-style stores |

## Lifecycle Comparison

**React:**
```javascript
useEffect(() => {
  // Mount
  return () => {
    // Unmount
  };
}, []);

useEffect(() => {
  // Update when deps change
}, [dep1, dep2]);
```

**KALXJS:**
```javascript
onMounted(() => {
  // Mount
});

onUnmounted(() => {
  // Unmount
});

watch([dep1, dep2], () => {
  // Update when deps change
});
```

## State Management

**React (Redux):**
```javascript
const initialState = { count: 0 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'increment' });
```

**KALXJS (Store):**
```javascript
import { defineStore } from '@kalxjs/store';

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment() {
      this.count++;
    },
  },
});

const store = useCounterStore();
store.increment();
```

## Routing

**React Router:**
```jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
  </Routes>
</BrowserRouter>
```

**KALXJS Router:**
```javascript
import { createRouter } from '@kalxjs/router';

const router = createRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
  ],
});
```

## Performance

### Optimization in React

```javascript
// Memoization required
const MemoizedComponent = memo(Component);
const memoizedValue = useMemo(() => compute(), [dep]);
const memoizedCallback = useCallback(() => {}, [dep]);
```

### Optimization in KALXJS

```javascript
// Automatic optimization
// No memo/callback needed
// Fine-grained reactivity tracks only what changed
const computed = computed(() => expensive());
```

## Migration Steps

### 1. Install KALXJS

```bash
npm install @kalxjs/core @kalxjs/router @kalxjs/store
```

### 2. Convert Components

Replace React components with KALXJS SFCs:

```jsx
// Before (React)
function TodoItem({ todo, onDelete }) {
  return (
    <div className="todo-item">
      <span>{todo.text}</span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </div>
  );
}
```

```vue
<!-- After (KALXJS) -->
<template>
  <div class="todo-item">
    <span>{{ todo.text }}</span>
    <button @click="$emit('delete', todo.id)">Delete</button>
  </div>
</template>

<script>
export default {
  props: ['todo'],
  emits: ['delete'],
};
</script>
```

### 3. Convert State Management

```javascript
// React Context
const ThemeContext = createContext();

// KALXJS Provide/Inject
provide('theme', theme);
const theme = inject('theme');
```

### 4. Update Routing

Replace React Router with KALXJS Router:

```javascript
// Update imports
import { useNavigate, useParams } from '@kalxjs/router';

// Navigation
const navigate = useNavigate();
navigate('/about');

// Route params
const { id } = useParams();
```

## Best Practices

### Do's ✅

- Use `ref` for primitive values
- Use `reactive` for objects
- Leverage `computed` for derived state
- Use SFC (.klx) files for better DX
- Enable TypeScript for type safety

### Don'ts ❌

- Don't use `.value` in templates (automatic unwrapping)
- Don't mutate props directly
- Don't forget to return from `setup()`
- Don't mix reactive and plain objects

## Common Patterns

### Fetching Data

**React:**
```javascript
useEffect(() => {
  fetch('/api/data')
    .then(res => res.json())
    .then(setData);
}, []);
```

**KALXJS:**
```javascript
onMounted(async () => {
  const response = await fetch('/api/data');
  data.value = await response.json();
});
```

### Form Handling

**React:**
```jsx
const [value, setValue] = useState('');
<input value={value} onChange={(e) => setValue(e.target.value)} />
```

**KALXJS:**
```vue
<input v-model="value" />
```

## Resources

- [KALXJS Documentation](./index.md)
- [API Reference](./api/index.md)
- [Examples](../examples/)
- [React vs KALXJS Comparison](./comparisons/react-vs-kalxjs.md)