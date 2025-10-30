# Code Generation Guide

Comprehensive guide to generating KalxJS code artifacts: components, routes, stores, and pages. Learn patterns, best practices, and advanced techniques.

## Table of Contents

1. [Component Generation](#component-generation)
2. [Route Generation](#route-generation)
3. [Store Generation](#store-generation)
4. [Page Generation](#page-generation)
5. [Generation Patterns](#generation-patterns)
6. [Best Practices](#best-practices)
7. [Batch Operations](#batch-operations)

---

## Component Generation

Generate reusable components with configurable features.

### Basic Component

```bash
kalxjs generate component Button
# or shorter
kalxjs g c Button
```

**Generated file:** `src/components/Button.js`

```javascript
<template>
  <div class="button">
    <!-- Component template -->
  </div>
</template>

<script>
export default {
  name: 'Button',
  data() {
    return {
      // State here
    };
  }
};
</script>
```

### Component with Props

```bash
kalxjs g c Button --props
```

**Generated structure:**
```javascript
props: {
  // Define component props
  label: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
}
```

**Usage:**
```html
<Button label="Click me" :disabled="false" />
```

### Component with State

```bash
kalxjs g c Counter --state
```

**Generated:**
```javascript
data() {
  return {
    count: 0,
    message: ''
  };
}
```

### Component with Methods

```bash
kalxjs g c Counter --methods
```

**Generated:**
```javascript
methods: {
  handleAction() {
    // Method implementation
  },
  processData() {
    // Another method
  }
}
```

### Component with Lifecycle Hooks

```bash
kalxjs g c DataLoader --lifecycle
```

**Generated:**
```javascript
mounted() {
  // Runs after component is mounted to DOM
  console.log('Component mounted');
},
beforeUnmount() {
  // Cleanup before unmount
  console.log('Component will unmount');
}
```

### Component with Style

```bash
kalxjs g c Card --style css
# or
kalxjs g c Card --style scss
```

**Generated files:**
- `src/components/Card.js`
- `src/styles/components/Card.css` (or `.scss`)

**Component includes style import:**
```javascript
import '../styles/components/Card.css';
```

**SCSS supports:**
- ✅ Variables
- ✅ Mixins
- ✅ Nesting
- ✅ Functions

### Component with Tests

```bash
kalxjs g c Button --test
```

**Generated files:**
- `src/components/Button.js`
- `src/components/__tests__/Button.test.js`

**Test structure:**
```javascript
describe('Button', () => {
  it('renders correctly', () => {
    // Test implementation
  });

  it('emits click event', async () => {
    // Test event emission
  });
});
```

### Composition API Component

```bash
kalxjs g c Counter --composition
```

**Generated:**
```javascript
<script>
import { ref, computed } from '@kalxjs/core';

export default {
  name: 'Counter',
  setup() {
    const count = ref(0);
    const doubled = computed(() => count.value * 2);

    const increment = () => {
      count.value++;
    };

    return { count, doubled, increment };
  }
};
</script>
```

**Advantages:**
- ✅ Better logic organization
- ✅ Easier code reuse via composables
- ✅ Better type support (TypeScript)

### Full-Featured Component

Combine multiple options:

```bash
kalxjs g c UserCard \
  --props \
  --state \
  --methods \
  --lifecycle \
  --style scss \
  --test \
  --composition
```

**Creates:**
- ✅ Props with definitions
- ✅ Reactive state (ref)
- ✅ Methods
- ✅ Lifecycle hooks
- ✅ SCSS stylesheet
- ✅ Jest test file
- ✅ Composition API setup

### Custom Component Directory

```bash
kalxjs g c Button --dir src/ui/buttons
```

**Created:** `src/ui/buttons/Button.js`

Create nested structure:
```bash
kalxjs g c Button --dir src/components/form/inputs
# Creates: src/components/form/inputs/Button.js
```

---

## Route Generation

Create routes with view components automatically.

### Basic Route

```bash
kalxjs g r about
```

**Generated:**
- `src/router/routes/about.js` (route definition)
- `src/views/AboutView.js` (view component)

**Route file:**
```javascript
export default {
  path: '/about',
  name: 'About',
  component: () => import('../views/AboutView.js')
};
```

**View component:**
```javascript
<template>
  <div class="about-view">
    <h1>About Page</h1>
  </div>
</template>
```

### Route with Composition API

```bash
kalxjs g r dashboard --composition
```

Creates view using Composition API patterns.

### Route with Lazy Loading

Routes automatically use lazy-loading via dynamic imports:

```javascript
component: () => import('../views/AboutView.js')
```

This means:
- ✅ Code split automatically
- ✅ Loaded only when needed
- ✅ Smaller initial bundle

### Route with Parameters

```bash
kalxjs g r user-profile
```

**Manual edit:** Add parameter to route:

```javascript
export default {
  path: '/user/:id',
  name: 'UserProfile',
  component: () => import('../views/UserProfileView.js')
};
```

**Access in component:**
```javascript
setup() {
  const route = useRoute();
  const userId = computed(() => route.params.id);
  return { userId };
}
```

### Route with Tests

```bash
kalxjs g r products --test
```

Creates test file for view component.

---

## Store Generation

Create state management modules (Pinia-style).

### Basic Store

```bash
kalxjs g s user
```

**Generated:** `src/stores/user.js`

```javascript
import { defineStore } from '@kalxjs/store';
import { ref, computed } from '@kalxjs/core';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const isAuthenticated = computed(() => !!user.value);

  const setUser = (userData) => {
    user.value = userData;
  };

  const logout = () => {
    user.value = null;
  };

  return {
    user,
    isAuthenticated,
    setUser,
    logout
  };
});
```

### Store Usage in Components

```javascript
import { useUserStore } from '@/stores/user.js';

export default {
  setup() {
    const userStore = useUserStore();

    // Access state
    const user = computed(() => userStore.user);
    const authenticated = computed(() => userStore.isAuthenticated);

    // Call actions
    const handleLogin = (userData) => {
      userStore.setUser(userData);
    };

    return { user, authenticated, handleLogin };
  }
};
```

### Store with Persistence

```bash
kalxjs g s auth --persist
```

**Generated with localStorage:**
```javascript
import { defineStore } from '@kalxjs/store';

export const useAuthStore = defineStore('auth', () => {
  // ...store implementation...

  // Persist state
  const persistState = () => {
    localStorage.setItem('auth', JSON.stringify(state.value));
  };

  const restoreState = () => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      state.value = JSON.parse(stored);
    }
  };

  return { persistState, restoreState };
}, {
  persist: true
});
```

**Auto-saves on changes:**
- ✅ User data persists across browser sessions
- ✅ Automatically restored on app load

### Store with Tests

```bash
kalxjs g s products --test
```

**Test structure:**
```javascript
describe('Products Store', () => {
  it('initializes with empty products', () => {
    const store = useProductsStore();
    expect(store.products).toEqual([]);
  });

  it('adds product to store', () => {
    const store = useProductsStore();
    store.addProduct({ id: 1, name: 'Widget' });
    expect(store.products.length).toBe(1);
  });
});
```

### Multi-Module Store

For complex applications, create multiple stores:

```bash
kalxjs g s user
kalxjs g s products
kalxjs g s cart
kalxjs g s settings
```

**Use together:**
```javascript
import { useUserStore } from '@/stores/user.js';
import { useCartStore } from '@/stores/cart.js';
import { useProductsStore } from '@/stores/products.js';

export default {
  setup() {
    const userStore = useUserStore();
    const cartStore = useCartStore();
    const productsStore = useProductsStore();

    return { userStore, cartStore, productsStore };
  }
};
```

---

## Page Generation

Generate complete pages (route + view + store combined).

### Basic Page

```bash
kalxjs g p products
```

**Generates:**
- `src/router/routes/products.js` (route)
- `src/views/ProductsView.js` (view component)
- `src/stores/products.js` (store)

### Page with Styling

```bash
kalxjs g p dashboard --style scss
```

Also creates:
- `src/styles/views/DashboardView.scss`

### Page with Tests

```bash
kalxjs g p profile --test
```

Includes test files for all generated artifacts.

### Page with Composition API

```bash
kalxjs g p analytics --composition
```

All components use Composition API.

### Typical Page Structure

**Route:** `src/router/routes/products.js`
```javascript
export default {
  path: '/products',
  name: 'Products',
  component: () => import('../views/ProductsView.js')
};
```

**View:** `src/views/ProductsView.js`
```javascript
import { useProductsStore } from '@/stores/products.js';

export default {
  name: 'ProductsView',
  setup() {
    const store = useProductsStore();
    // Component logic here
  }
};
```

**Store:** `src/stores/products.js`
```javascript
import { defineStore } from '@kalxjs/store';

export const useProductsStore = defineStore('products', () => {
  // Store implementation
});
```

---

## Generation Patterns

### Pattern 1: Card Component System

Create reusable card components:

```bash
kalxjs g c Card --style scss
kalxjs g c CardHeader --style scss
kalxjs g c CardBody --style scss
kalxjs g c CardFooter --style scss
```

**Usage:**
```html
<Card>
  <CardHeader>
    <h2>Title</h2>
  </CardHeader>
  <CardBody>
    <p>Content</p>
  </CardBody>
  <CardFooter>
    <button>Action</button>
  </CardFooter>
</Card>
```

### Pattern 2: Form with Validation

```bash
kalxjs g c Form --composition --props --state --methods --test
kalxjs g c FormInput --props
kalxjs g c FormError --props
```

### Pattern 3: Data-Driven Page

```bash
# Generate page with store
kalxjs g p users

# Generate components for list
kalxjs g c UserList --composition --test
kalxjs g c UserCard --props --composition

# Generate modals
kalxjs g c UserModal --composition
kalxjs g c DeleteConfirmDialog --composition
```

### Pattern 4: Nested Routes

```bash
# Generate main route
kalxjs g r admin

# Generate nested pages
kalxjs g p admin/users
kalxjs g p admin/settings
kalxjs g p admin/reports
```

### Pattern 5: Reusable Composables

```bash
# Generate component using composable logic
kalxjs g c DataTable --composition

# Composables (manually created or generated separately)
# src/composables/useDataFetch.js
# src/composables/useDataSort.js
# src/composables/usePagination.js
```

---

## Best Practices

### 1. Naming Conventions

**Components:**
```bash
# PascalCase
kalxjs g c UserProfile
kalxjs g c FormInput
kalxjs g c ModalDialog

# Not: user-profile, form_input, modal-dialog
```

**Routes & Pages:**
```bash
# kebab-case
kalxjs g r user-profile
kalxjs g p admin-dashboard

# Corresponds to URLs: /user-profile, /admin-dashboard
```

**Stores:**
```bash
# camelCase with 'use' prefix (convention)
# Generated: useUserStore, useProductsStore
kalxjs g s user
kalxjs g s products
```

### 2. Component Organization

**Small projects (< 5 pages):**
```
src/components/
├── Button.js
├── Card.js
├── Header.js
└── Footer.js
```

**Medium projects (5-20 pages):**
```
src/components/
├── common/
│   ├── Button.js
│   ├── Card.js
│   └── Modal.js
├── form/
│   ├── Input.js
│   ├── Select.js
│   └── Checkbox.js
└── layout/
    ├── Header.js
    └── Sidebar.js
```

**Large projects (20+ pages):**
```
src/components/
├── common/
├── form/
├── layout/
├── dashboard/
│   ├── widgets/
│   └── charts/
└── admin/
    ├── tables/
    └── modals/
```

### 3. Features per Component

**Minimal Component:**
```bash
kalxjs g c Badge
```

**Simple Component:**
```bash
kalxjs g c Button --props --methods
```

**Complex Component:**
```bash
kalxjs g c DataTable --props --state --methods --lifecycle --test --style scss
```

### 4. Testing Strategy

**Always test:**
```bash
kalxjs g c Button --test          # UI component
kalxjs g s user --test            # Store logic
kalxjs g r admin --test           # Route views
```

**Run tests during development:**
```bash
npm test -- --watch
```

### 5. Code Generation vs Manual Creation

**Use CLI generation:**
- ✅ Standard components
- ✅ Repeated structures
- ✅ Quick prototyping

**Create manually:**
- ✅ Complex components
- ✅ Custom patterns
- ✅ Specialized logic

---

## Batch Operations

### Generate Component Suite

```bash
# Typography components
kalxjs g c Typography
kalxjs g c Heading --props
kalxjs g c Paragraph --props
kalxjs g c Text --props

# Form components
kalxjs g c Input --props --test
kalxjs g c TextArea --props --test
kalxjs g c Select --props --test
kalxjs g c Checkbox --props --test

# Layout components
kalxjs g c Container
kalxjs g c Row
kalxjs g c Column
```

### Generate Feature Pages

```bash
# Authentication
kalxjs g p login --composition --test
kalxjs g p register --composition --test
kalxjs g p forgot-password --composition

# User Management
kalxjs g p users --composition --test
kalxjs g p user-detail --composition
kalxjs g p user-edit --composition

# Products
kalxjs g p products --composition --test
kalxjs g p product-detail --composition
kalxjs g p product-manage --composition
```

### Automated Batch with Script

Create `generate.sh`:

```bash
#!/bin/bash

# Generate all components
kalxjs g c Button --style scss --test
kalxjs g c Input --style scss --test
kalxjs g c Modal --style scss --test
kalxjs g c Card --style scss --test

# Generate all pages
kalxjs g p dashboard --composition --test
kalxjs g p products --composition --test
kalxjs g p settings --composition --test

echo "✅ Generation complete!"
```

Run:
```bash
chmod +x generate.sh
./generate.sh
```

---

## Advanced Scenarios

### Scenario 1: Admin Dashboard

```bash
# Create base project
kalxjs create admin-app --router --state

# Generate layout
kalxjs g c Sidebar --composition
kalxjs g c TopBar --composition
kalxjs g c Layout --composition

# Generate pages
kalxjs g p dashboard --composition
kalxjs g p users --composition
kalxjs g p products --composition
kalxjs g p analytics --composition
kalxjs g p settings --composition

# Generate stores
kalxjs g s user --persist
kalxjs g s ui
kalxjs g s notifications
```

### Scenario 2: E-commerce Application

```bash
# Create base
kalxjs create shop-app --router --state

# Generate product components
kalxjs g c ProductCard --props --style scss
kalxjs g c ProductGrid --composition
kalxjs g c ProductFilter --composition

# Generate shopping cart
kalxjs g c CartItem --props
kalxjs g c CartSummary --composition
kalxjs g p cart --composition

# Generate checkout
kalxjs g p checkout --composition
kalxjs g c CheckoutForm --composition
kalxjs g c PaymentMethod --props

# Generate stores
kalxjs g s products --persist
kalxjs g s cart --persist
kalxjs g s orders
```

### Scenario 3: Multi-tenanted SaaS

```bash
# Create base
kalxjs create saas-app --router --state --testing

# Generate authentication
kalxjs g p login --composition --test
kalxjs g p register --composition --test
kalxjs g s auth --persist

# Generate tenant management
kalxjs g c TenantSelector --composition
kalxjs g p tenant-settings --composition
kalxjs g s tenant

# Generate workspace
kalxjs g p workspace --composition
kalxjs g c Workspace --composition
kalxjs g s workspace
```

---

## Troubleshooting Generation Issues

### Issue: Component not created

```bash
# Verify project structure
ls src/components/

# Check file permissions
chmod 755 src/components/
```

### Issue: Cannot generate in custom directory

```bash
# Directory doesn't exist - CLI creates it
kalxjs g c Button --dir src/new-dir

# Verify creation
ls src/new-dir/
```

### Issue: Style file not created

```bash
# Explicitly specify style
kalxjs g c Button --style scss

# Verify
ls src/styles/components/
```

---

## Next Steps

- [Project Structure](./PROJECT_STRUCTURE.md)
- [Advanced Usage](./ADVANCED_USAGE.md)
- [Commands Reference](./COMMANDS.md)
- [Troubleshooting](./TROUBLESHOOTING.md)