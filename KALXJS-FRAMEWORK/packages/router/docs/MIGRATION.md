# Migration Guide: Upgrading to KalxJS Router 2.0

This guide helps you migrate from the previous version of KalxJS Router to the new enhanced version that surpasses Vue Router in features and capabilities.

## Table of Contents

- [Breaking Changes](#breaking-changes)
- [New Features](#new-features)
- [Migration Steps](#migration-steps)
- [Examples](#examples)

## Breaking Changes

### Promise-Based Navigation

Navigation methods now return promises instead of being void:

```javascript
// Before
router.push('/dashboard')

// After
router.push('/dashboard')
  .then(route => {
    console.log('Navigation complete:', route)
  })
  .catch(error => {
    console.error('Navigation failed:', error)
  })

// Or with async/await
async function navigate() {
  try {
    const route = await router.push('/dashboard')
    console.log('Navigation complete:', route)
  } catch (error) {
    console.error('Navigation failed:', error)
  }
}
```

### Enhanced Route Matching

Route matching is now more strict and supports more advanced patterns:

```javascript
// Before
{ path: '/users/:id' } // Would match /users/123 and /users/abc

// After
{ path: '/users/:id(\\d+)' } // Only matches numeric IDs like /users/123
```

### Navigation Guards

Navigation guards now have more consistent behavior:

```javascript
// Before
router.beforeEach((to, from, next) => {
  // Inconsistent behavior with redirects
  next('/login')
})

// After
router.beforeEach((to, from, next) => {
  // More consistent behavior
  next('/login') // Redirects properly
  
  // Or return the location directly
  return { path: '/login' }
  
  // Or for simple paths
  return '/login'
})
```

## New Features

### History Modes

Three history modes are now available:

```javascript
import { 
  createRouter, 
  createWebHistory, 
  createWebHashHistory, 
  createMemoryHistory 
} from '@kalxjs/router'

// HTML5 History Mode
const router1 = createRouter({
  history: createWebHistory('/base/'),
  routes: [...]
})

// Hash History Mode
const router2 = createRouter({
  history: createWebHashHistory('/base/'),
  routes: [...]
})

// Memory History Mode (for testing/SSR)
const router3 = createRouter({
  history: createMemoryHistory('/initial/path'),
  routes: [...]
})
```

### Enhanced useRouter Hook

The `useRouter` hook now provides more features:

```javascript
// Before
const { router, route, params, query, path } = useRouter()

// After
const { 
  router,
  route,
  params,
  query,
  path,
  hash,
  fullPath,
  meta,
  name,
  matched,
  isActive,
  isExactActive,
  resolve,
  beforeEach,
  beforeResolve,
  afterEach
} = useRouter()
```

### Enhanced RouterLink Component

The `RouterLink` component now supports more features:

```javascript
// Before
<RouterLink to="/about">About</RouterLink>

// After
<RouterLink 
  to="/about"
  activeClass="my-active-class"
  exactActiveClass="my-exact-active-class"
  replace
  custom
  ariaCurrentValue="page"
>About</RouterLink>
```

### Advanced Route Matching

More powerful route matching patterns:

```javascript
const routes = [
  // Optional parameters
  { path: '/users/:id?' },
  
  // Custom regex patterns
  { path: '/products/:id(\\d+)' },
  
  // Multiple parameters with patterns
  { path: '/articles/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug' },
  
  // Catch-all routes
  { path: '/:pathMatch(.*)*', name: 'not-found' }
]
```

### Dynamic Route Management

Add and remove routes dynamically:

```javascript
// Add a route
router.addRoute({
  path: '/dynamic',
  name: 'dynamic-route',
  component: DynamicComponent
})

// Add a nested route
router.addRoute('parent-name', {
  path: 'child',
  name: 'child-route',
  component: ChildComponent
})

// Remove a route
router.removeRoute('route-name')

// Check if a route exists
const exists = router.hasRoute('route-name')

// Get all routes
const routes = router.getRoutes()
```

## Migration Steps

Follow these steps to migrate to the new router:

1. **Update Import Statements**

```javascript
// Before
import { createRouter } from '@kalxjs/router'

// After
import { 
  createRouter, 
  createWebHistory, // or createWebHashHistory
  createMemoryHistory 
} from '@kalxjs/router'
```

2. **Update Router Creation**

```javascript
// Before
const router = createRouter({
  mode: 'history', // or 'hash'
  base: '/app/',
  routes: [...]
})

// After
const router = createRouter({
  history: createWebHistory('/app/'), // or createWebHashHistory('/app/')
  routes: [...],
  // New options
  scrollBehavior: (to, from, savedPosition) => {
    // Return desired position
  },
  caseSensitive: false,
  trailingSlash: false
})
```

3. **Update Navigation Calls**

```javascript
// Before
router.push('/dashboard')

// After
router.push('/dashboard').catch(err => {
  console.error('Navigation failed:', err)
})

// Or with async/await
async function navigate() {
  try {
    await router.push('/dashboard')
  } catch (error) {
    console.error('Navigation failed:', error)
  }
}
```

4. **Update Navigation Guards**

```javascript
// Before
router.beforeEach((to, from, next) => {
  if (!isAuthenticated && to.meta.requiresAuth) {
    next('/login')
  } else {
    next()
  }
})

// After
router.beforeEach((to, from, next) => {
  if (!isAuthenticated && to.meta.requiresAuth) {
    // Option 1: Use next
    next('/login')
    
    // Option 2: Return location directly
    return '/login'
    
    // Option 3: Return location object
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  }
  
  // Continue navigation
  next()
  // Or simply return true or undefined
})
```

5. **Update Components Using useRouter**

```javascript
// Before
const { router, route, params } = useRouter()
console.log(params.value.id)

// After
const { 
  router, 
  route, 
  params,
  meta,
  isActive,
  resolve
} = useRouter()

// Use new features
console.log(meta.value.title)
const isProfileActive = isActive('/profile')
const { href } = resolve({ name: 'user', params: { id: 123 } })
```

## Examples

### Basic Router Setup

```javascript
import { createApp } from '@kalxjs/core'
import { createRouter, createWebHistory } from '@kalxjs/router'
import App from './App'
import Home from './pages/Home'
import About from './pages/About'
import User from './pages/User'
import NotFound from './pages/NotFound'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { 
    path: '/users/:id(\\d+)', 
    component: User,
    props: true,
    meta: { requiresAuth: true }
  },
  { path: '/:pathMatch(.*)*', component: NotFound }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return '/login'
  }
  next()
})

const app = createApp(App)
app.use(router)
app.mount('#app')
```

### Component with useRouter

```javascript
import { ref, computed } from '@kalxjs/core'
import { useRouter } from '@kalxjs/router'

export default {
  setup() {
    const { 
      route, 
      params, 
      push, 
      isActive,
      meta
    } = useRouter()
    
    const userId = computed(() => params.value.id)
    const pageTitle = computed(() => meta.value.title || 'User Page')
    const isProfileActive = isActive('/profile')
    
    const userData = ref(null)
    
    // Fetch user data when ID changes
    watch(() => params.value.id, async (newId) => {
      if (!newId) return
      
      try {
        userData.value = await fetchUserData(newId)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }, { immediate: true })
    
    const goToSettings = () => {
      push(`/users/${userId.value}/settings`)
    }
    
    return {
      userId,
      userData,
      pageTitle,
      isProfileActive,
      goToSettings
    }
  }
}
```

### Advanced Route Configuration

```javascript
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'overview',
        name: 'dashboard-overview',
        component: DashboardOverview
      },
      {
        path: 'stats/:period(daily|weekly|monthly)?',
        name: 'dashboard-stats',
        component: DashboardStats,
        props: true
      }
    ]
  },
  {
    path: '/products',
    component: ProductLayout,
    children: [
      {
        path: '',
        name: 'products-list',
        component: ProductList
      },
      {
        path: ':id(\\d+)',
        name: 'product-details',
        component: ProductDetails,
        props: true,
        // Route-specific guard
        beforeEnter: [checkProductAccess, loadProductData]
      }
    ]
  }
]
```