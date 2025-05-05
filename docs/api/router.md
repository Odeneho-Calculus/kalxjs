<!-- kalxjs/docs/api/router.md -->
# Router API

The kalxjs router enables building single-page applications with dynamic navigation without page reloads.

## Import

```javascript
import { createRouter } from '@kalxjs-framework/runtime'
```

## Setup

```javascript
import { createRouter } from '@kalxjs-framework/runtime'
import routes from './router/routes'

const router = createRouter({ 
  history: 'html5', // or 'hash'
  routes 
})

// Use with app
import { createApp } from '@kalxjs-framework/runtime'
import App from './App.klx'

const app = createApp(App)
app.use(router)
app.mount('#app')
```

## createRouter()

Creates a new router instance.

```javascript
import { createRouter } from '@kalxjs-framework/runtime'

const router = createRouter({
  history: 'html5', // or 'hash'
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

- `history` - Router mode ('html5' or 'hash')
- `routes` - Array of route definitions

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
import { watch } from '@kalxjs-framework/runtime'

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
import { useRoute, useRouter } from '@kalxjs-framework/runtime'

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