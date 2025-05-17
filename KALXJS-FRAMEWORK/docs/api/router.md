<!-- kalxjs/docs/api/router.md -->
# Router API

The kalxjs router enables building single-page applications with dynamic navigation without page reloads.

## Installation

```bash
# Install latest version
npm install @kalxjs/router@latest
```

Current version: 2.0.0

## Import

```javascript
import { createRouter } from '@kalxjs/router'
```

## Setup

```javascript
import { createRouter, createWebHistory } from '@kalxjs/router'
import routes from './router/routes'

const router = createRouter({ 
  history: createWebHistory(),
  routes 
})

// Use with app
import { createApp } from '@kalxjs/core'
import App from './App.klx'

const app = createApp(App)
app.use(router)
app.mount('#app')
```

## createRouter()

Creates a new router instance.

```javascript
import { createRouter, createWebHistory } from '@kalxjs/router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('./pages/Home.klx')
    },
    {
      path: '/about',
      component: () => import('./pages/About.klx')
    },
    {
      path: '/users/:id',
      component: () => import('./pages/UserProfile.klx')
    }
  ]
})
```

### Arguments

- `{Object} options` - Router configuration options

### Options

- `history` - History implementation (created with `createWebHistory()`, `createWebHashHistory()`, or `createMemoryHistory()`)
- `routes` - Array of route definitions
- `scrollBehavior` - Function that controls scroll behavior after navigation

### Returns

- `{Object}` - Router instance

## Route Objects

Each route can have the following properties:

```javascript
{
  path: '/users/:id',          // Route path (supports params with :param syntax)
  component: UserComponent,    // Component to render for this route
  // Component can also be a function that returns a Promise (for lazy loading)
  component: () => import('./pages/UserProfile.klx'),
  meta: { requiresAuth: true } // Custom metadata for the route
}
```

## Router Instance Properties

### router.currentRoute

A reactive reference to the current route.

```javascript
import { watch } from '@kalxjs/core'

// Watch for route changes
watch(() => router.currentRoute.value, (newRoute) => {
  console.log('Route changed to:', newRoute.path)
})

// Access current route properties
console.log(router.currentRoute.value.path)
console.log(router.currentRoute.value.params)
console.log(router.currentRoute.value.query)
```

## Router Instance Methods

### router.push()

Navigate to a specific route and add an entry to the browser history.

```javascript
// Navigate to a path
router.push('/about')

// Navigate with object
router.push({
  path: '/users/123',
  query: { tab: 'profile' }
})
```

### router.replace()

Navigate to a route without adding an entry to the history.

```javascript
router.replace('/about')
```

### router.handleRoute()

Programmatically handle a route change.

```javascript
router.handleRoute('/about')
```

## Navigation Guards

The router supports navigation guards to control navigation.

### Global Guards

```javascript
// Before each route change
router.beforeEach = async (to, from) => {
  // Check if route requires authentication
  if (to.matched[0]?.meta?.requiresAuth && !isAuthenticated()) {
    // Redirect to login page
    return '/login'
  }
  
  // Allow navigation
  return true
}

// After each route change
router.afterEach = (to, from) => {
  console.log(`Navigated from ${from} to ${to}`)
}
```

## Components

### router-link

A component that renders a link that triggers navigation when clicked.

```klx
<template>
  <nav>
    <router-link to="/">Home</router-link>
    <router-link to="/about">About</router-link>
    <router-link :to="{ path: '/users', query: { sort: 'name' } }">Users</router-link>
  </nav>
</template>
```

#### Props

- `to` - String path or object with path and query
- `replace` - Boolean, use router.replace instead of router.push

### router-view

A component that displays the component matching the current route.

```klx
<template>
  <div class="app">
    <header>
      <!-- Navigation -->
    </header>
    
    <main>
      <!-- Route component will be rendered here -->
      <router-view />
    </main>
    
    <footer>
      <!-- Footer content -->
    </footer>
  </div>
</template>
```

## Accessing Route Information in Components

### Composition API

```javascript
import { useRoute, useRouter } from '@kalxjs/router'

export default {
  setup() {
    // Get current route
    const route = useRoute()
    
    // Get router instance
    const router = useRouter()
    
    // Access route params
    const userId = route.params.id
    
    // Navigate programmatically
    function goToHome() {
      router.push('/')
    }
    
    return {
      userId,
      goToHome
    }
  }
}
```

### Options API

```javascript
export default {
  computed: {
    // Access route params
    userId() {
      return this.$route.params.id
    }
  },
  methods: {
    // Navigate programmatically
    goToHome() {
      this.$router.push('/')
    }
  }
}
```

## Dynamic Routes

Routes can have dynamic segments that are passed as params to the component.

```javascript
const routes = [
  // Dynamic segment :id
  { path: '/users/:id', component: UserProfile },
  
  // Multiple dynamic segments
  { path: '/posts/:category/:id', component: Post }
]
```

Accessing params:

```javascript
// In a component
export default {
  setup() {
    const route = useRoute()
    console.log(route.params.id) // Access the :id param
  }
}
```

## Lazy Loading Routes

For better performance, you can lazy-load route components:

```javascript
const routes = [
  {
    path: '/',
    component: () => import('./pages/Home.klx')
  },
  {
    path: '/about',
    component: () => import('./pages/About.klx')
  }
]
```

This uses dynamic imports to split your code into chunks that are loaded only when needed.

## History Modes

The router supports different history modes:

### createWebHistory()

Uses the HTML5 History API for clean URLs without hashes.

```javascript
import { createRouter, createWebHistory } from '@kalxjs/router'

const router = createRouter({
  history: createWebHistory(),
  routes: [...]
})
```

### createWebHashHistory()

Uses URL hash for routing, works without server configuration.

```javascript
import { createRouter, createWebHashHistory } from '@kalxjs/router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [...]
})
```

### createMemoryHistory()

Keeps history in memory, useful for testing or server-side rendering.

```javascript
import { createRouter, createMemoryHistory } from '@kalxjs/router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [...]
})
```

## Implementation Details

The kalxjs router is built on a lightweight implementation that efficiently handles route matching and navigation:

### Route Matching

The router uses a path-to-regexp based algorithm to match URLs to routes:

1. When a URL changes, the router parses the URL
2. It matches the path against all registered routes
3. It extracts parameters from dynamic segments
4. It renders the matched component

### Navigation Guards

Navigation guards are implemented as middleware-like functions that can control the navigation flow:

```javascript
// Simplified implementation
async function runGuards(to, from) {
  // Run global beforeEach guards
  const globalGuardResult = await router.beforeEach(to, from);
  if (globalGuardResult !== true) {
    return globalGuardResult; // Redirect or cancel
  }
  
  // Run route-specific guards
  for (const match of to.matched) {
    if (match.beforeEnter) {
      const guardResult = await match.beforeEnter(to, from);
      if (guardResult !== true) {
        return guardResult; // Redirect or cancel
      }
    }
  }
  
  return true; // Allow navigation
}
```

### Integration with Components

The router integrates with the component system through:

1. The `<router-view>` component that renders the matched route component
2. The `<router-link>` component that provides navigation without page reloads
3. The `useRouter()` and `useRoute()` composables for accessing router functionality

## Version Information

For detailed version history and changes, please refer to the [CHANGELOG.md](https://github.com/Odeneho-Calculus/kalxjs/blob/main/KALXJS-FRAMEWORK/packages/router/CHANGELOG.md) file in the repository.