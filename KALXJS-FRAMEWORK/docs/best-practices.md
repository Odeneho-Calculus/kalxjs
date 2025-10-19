# KALXJS Best Practices

This guide covers best practices for building production-ready KALXJS applications.

## Project Structure

### Recommended Structure

```
src/
├── assets/          # Static assets
├── components/      # Reusable components
│   ├── common/     # Shared components
│   └── features/   # Feature-specific components
├── composables/    # Composition functions
├── layouts/        # Layout components
├── router/         # Router configuration
├── store/          # State management
│   └── modules/    # Store modules
├── utils/          # Utility functions
├── views/          # Page components
├── App.klx         # Root component
└── main.js         # Entry point
```

### File Naming

- **Components**: PascalCase (`UserProfile.klx`)
- **Composables**: camelCase with `use` prefix (`useAuth.js`)
- **Utilities**: camelCase (`formatDate.js`)
- **Stores**: camelCase (`userStore.js`)

## Component Design

### Single Responsibility

```javascript
// ❌ Bad: Too many responsibilities
export default {
  setup() {
    // User management
    const user = ref(null);
    const fetchUser = async () => { /* ... */ };

    // API handling
    const api = { /* ... */ };

    // UI state
    const modal = ref(false);

    // ... too much
  },
};

// ✅ Good: Single responsibility
export default {
  setup() {
    const { user, fetchUser } = useUser();
    const { showModal, closeModal } = useModal();

    return { user, fetchUser, showModal, closeModal };
  },
};
```

### Props Validation

```javascript
export default {
  props: {
    // ❌ Bad: No validation
    userId: String,

    // ✅ Good: With validation
    userId: {
      type: String,
      required: true,
      validator: (value) => value.length > 0,
    },
    status: {
      type: String,
      default: 'active',
      validator: (value) => ['active', 'inactive'].includes(value),
    },
  },
};
```

### Emit Events

```javascript
// ✅ Good: Declare emits
export default {
  emits: ['update', 'delete', 'save'],
  setup(props, { emit }) {
    const handleSave = () => {
      emit('save', data);
    };

    return { handleSave };
  },
};
```

## Reactivity

### Choose the Right Primitive

```javascript
// ✅ Use ref for primitives
const count = ref(0);
const name = ref('John');
const isActive = ref(true);

// ✅ Use reactive for objects
const user = reactive({
  name: 'John',
  age: 30,
  address: {
    city: 'New York',
  },
});

// ✅ Use computed for derived state
const fullName = computed(() => `${user.firstName} ${user.lastName}`);
```

### Avoid Ref Loss

```javascript
// ❌ Bad: Loses reactivity
const { count } = user;

// ✅ Good: Use toRefs
const { count } = toRefs(user);

// ✅ Good: Keep reactive object
const userCount = () => user.count;
```

### Shallow Reactivity

```javascript
// ✅ Use shallowRef for large objects
const hugeDataset = shallowRef({
  items: [...thousands of items],
});

// Trigger update only when replacing entire object
hugeDataset.value = newDataset;
```

## Performance

### Lazy Loading

```javascript
// ✅ Lazy load routes
const routes = [
  {
    path: '/admin',
    component: () => import('./views/Admin.klx'),
  },
];

// ✅ Lazy load components
const HeavyComponent = defineAsyncComponent(() =>
  import('./components/HeavyComponent.klx')
);
```

### Virtual Scrolling

```javascript
// ✅ Use virtual scrolling for long lists
import { VirtualScroller } from '@kalxjs/ui';

export default {
  components: { VirtualScroller },
  setup() {
    const items = ref(Array.from({ length: 10000 }));
    return { items };
  },
};
```

### Memoization

```javascript
// ✅ Use memo for expensive computations
const expensiveResult = memo(() => {
  return complexCalculation(data.value);
});
```

## State Management

### Store Organization

```javascript
// ✅ Good: Organized store
import { defineStore } from '@kalxjs/store';

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref(null);
  const isAuthenticated = computed(() => !!currentUser.value);

  // Actions
  async function login(credentials) {
    const user = await api.login(credentials);
    currentUser.value = user;
  }

  function logout() {
    currentUser.value = null;
  }

  // Return public API
  return {
    currentUser,
    isAuthenticated,
    login,
    logout,
  };
});
```

### Local vs Global State

```javascript
// ✅ Local state for component-specific data
const isModalOpen = ref(false);

// ✅ Global state for shared data
const userStore = useUserStore();
```

## Composables

### Reusable Logic

```javascript
// composables/useAsync.js
export function useAsync(fn) {
  const data = ref(null);
  const error = ref(null);
  const loading = ref(false);

  const execute = async (...args) => {
    loading.value = true;
    error.value = null;

    try {
      data.value = await fn(...args);
    } catch (e) {
      error.value = e;
    } finally {
      loading.value = false;
    }
  };

  return { data, error, loading, execute };
}

// Usage
const { data, error, loading, execute } = useAsync(fetchUsers);
```

### Cleanup

```javascript
// ✅ Clean up side effects
export function useEventListener(target, event, handler) {
  onMounted(() => {
    target.addEventListener(event, handler);
  });

  onUnmounted(() => {
    target.removeEventListener(event, handler);
  });
}
```

## Async Operations

### Error Handling

```javascript
// ✅ Handle errors gracefully
async function fetchData() {
  try {
    loading.value = true;
    const response = await api.getData();
    data.value = response;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    showError('Failed to load data');
  } finally {
    loading.value = false;
  }
}
```

### Suspense

```javascript
// ✅ Use Suspense for async components
<Suspense>
  <template #default>
    <AsyncComponent />
  </template>
  <template #fallback>
    <LoadingSpinner />
  </template>
</Suspense>
```

## TypeScript

### Component Props

```typescript
interface UserProps {
  id: string;
  name: string;
  email?: string;
}

export default defineComponent<UserProps>({
  props: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: String,
  },
});
```

### Composables

```typescript
import { Ref } from '@kalxjs/core';

interface UseCounterReturn {
  count: Ref<number>;
  increment: () => void;
  decrement: () => void;
}

export function useCounter(initial = 0): UseCounterReturn {
  const count = ref(initial);

  const increment = () => count.value++;
  const decrement = () => count.value--;

  return { count, increment, decrement };
}
```

## Testing

### Component Tests

```javascript
import { mount } from '@kalxjs/core/testing';
import Counter from './Counter.klx';

describe('Counter', () => {
  it('increments count', async () => {
    const wrapper = mount(Counter, {
      props: { initial: 0 },
    });

    await wrapper.find('button').trigger('click');

    expect(wrapper.vm.count).toBe(1);
  });
});
```

### Store Tests

```javascript
import { setActivePinia, createPinia } from '@kalxjs/store';
import { useUserStore } from './userStore';

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('logs in user', async () => {
    const store = useUserStore();
    await store.login({ email: 'test@example.com' });

    expect(store.isAuthenticated).toBe(true);
  });
});
```

## Security

### XSS Prevention

```vue
<!-- ❌ Dangerous: Can execute scripts -->
<div v-html="userInput"></div>

<!-- ✅ Safe: Escaped automatically -->
<div>{{ userInput }}</div>
```

### CSRF Protection

```javascript
// ✅ Include CSRF token in requests
import { api } from '@kalxjs/api';

api.defaults.headers.common['X-CSRF-Token'] = getCsrfToken();
```

## Accessibility

### Semantic HTML

```vue
<!-- ✅ Use semantic elements -->
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

<!-- ✅ Add ARIA labels -->
<button aria-label="Close modal" @click="close">
  ×
</button>
```

### Keyboard Navigation

```javascript
// ✅ Support keyboard navigation
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    closeModal();
  } else if (e.key === 'Enter') {
    submit();
  }
};
```

## Resources

- [API Reference](./api/index.md)
- [Performance Guide](./performance.md)
- [Security Guide](./security.md)
- [Testing Guide](./testing.md)