# KalxJS Router API Reference

This document provides a comprehensive API reference for the KalxJS Router, which offers more powerful features than Vue Router.

## Table of Contents

- [Router Creation](#router-creation)
  - [createRouter](#createrouter)
  - [createWebHistory](#createwebhistory)
  - [createWebHashHistory](#createwebhashhistory)
  - [createMemoryHistory](#creatememoryhistory)
- [Router Instance](#router-instance)
  - [router.push](#routerpush)
  - [router.replace](#routerreplace)
  - [router.go](#routergo)
  - [router.back](#routerback)
  - [router.forward](#routerforward)
  - [router.beforeEach](#routerbeforeeach)
  - [router.beforeResolve](#routerbeforeresolve)
  - [router.afterEach](#routeraftereach)
  - [router.addRoute](#routeraddroute)
  - [router.removeRoute](#routerremoveroute)
  - [router.hasRoute](#routerhasroute)
  - [router.getRoutes](#routergetroutes)
  - [router.install](#routerinstall)
- [Composition API](#composition-api)
  - [useRouter](#userouter)
- [Components](#components)
  - [RouterLink](#routerlink)
  - [RouterView](#routerview)
- [Route Record](#route-record)
- [Location Format](#location-format)
- [Navigation Guards](#navigation-guards)
- [Meta Fields](#meta-fields)
- [TypeScript Support](#typescript-support)

## Router Creation

### createRouter

Creates a new router instance.

```javascript
import { createRouter } from '@kalxjs/router'

const router = createRouter({
  // History implementation to use
  history: createWebHistory(),
  
  // Array of route records
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ],
  
  // Optional configuration
  scrollBehavior: (to, from, savedPosition) => {
    // Return desired position
  },
  
  // Case sensitivity for routes
  caseSensitive: false,
  
  // Trailing slash handling
  trailingSlash: false,
  
  // Custom query parsing
  parseQuery: (queryString) => {
    // Return parsed query object
  },
  
  // Custom query stringifying
  stringifyQuery: (queryObject) => {
    // Return query string
  }
})
```

### createWebHistory

Creates an HTML5 history implementation for `createRouter()`.

```javascript
import { createRouter, createWebHistory } from '@kalxjs/router'

const router = createRouter({
  history: createWebHistory('/base/path/'),
  routes: [...]
})
```

### createWebHashHistory

Creates a hash history implementation for `createRouter()`.

```javascript
import { createRouter, createWebHashHistory } from '@kalxjs/router'

const router = createRouter({
  history: createWebHashHistory('/base/path/'),
  routes: [...]
})
```

### createMemoryHistory

Creates a memory history implementation for `createRouter()`, useful for server-side rendering and testing.

```javascript
import { createRouter, createMemoryHistory } from '@kalxjs/router'

const router = createRouter({
  history: createMemoryHistory('/initial/path'),
  routes: [...]
})
```

## Router Instance

### router.push

Navigate to a new URL programmatically. Returns a Promise that resolves when navigation is complete.

```javascript
// Navigate to a path
router.push('/users/123')

// Navigate with an object
router.push({
  path: '/users/123',
  query: { plan: 'premium' }
})

// Navigate to a named route
router.push({
  name: 'user',
  params: { id: '123' },
  query: { plan: 'premium' },
  hash: '#bio'
})

// With promise handling
router.push('/users/123')
  .then(route => {
    console.log('Navigation complete:', route)
  })
  .catch(error => {
    console.error('Navigation failed:', error)
  })
```

### router.replace

Navigate to a new URL, replacing the current history entry. Returns a Promise that resolves when navigation is complete.

```javascript
// Replace current URL
router.replace('/users/123')

// Replace with an object
router.replace({
  name: 'user',
  params: { id: '123' }
})

// With promise handling
router.replace('/login')
  .then(route => {
    console.log('Navigation complete:', route)
  })
  .catch(error => {
    console.error('Navigation failed:', error)
  })
```

### router.go

Go forward or backward in history. Returns a Promise.

```javascript
// Go back one record
router.go(-1)

// Go forward one record
router.go(1)

// Go back 3 records
router.go(-3)
```

### router.back

Go back in history. Equivalent to `router.go(-1)`. Returns a Promise.

```javascript
router.back()
```

### router.forward

Go forward in history. Equivalent to `router.go(1)`. Returns a Promise.

```javascript
router.forward()
```

### router.beforeEach

Add a global navigation guard that runs before any route navigation. Returns an unregister function.

```javascript
const unregisterGuard = router.beforeEach((to, from, next) => {
  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated()) {
    // Redirect to login
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    // Continue navigation
    next()
  }
})

// Later, unregister the guard
unregisterGuard()
```

### router.beforeResolve

Add a global navigation guard that runs after all component-specific guards and async route components are resolved. Returns an unregister function.

```javascript
const unregisterGuard = router.beforeResolve(async (to, from, next) => {
  try {
    // Fetch data before navigation completes
    await fetchDataForRoute(to)
    next()
  } catch (error) {
    next(error) // Abort navigation with error
  }
})

// Later, unregister the guard
unregisterGuard()
```

### router.afterEach

Add a global hook that runs after navigation is complete. Returns an unregister function.

```javascript
const unregisterHook = router.afterEach((to, from) => {
  // Update page title
  document.title = to.meta.title || 'KalxJS App'
  
  // Track page view
  analytics.trackPageView(to.fullPath)
})

// Later, unregister the hook
unregisterHook()
```

### router.addRoute

Dynamically add a new route to the router. If a `parentName` is provided, the route will be added as a child of that route.

```javascript
// Add a top-level route
router.addRoute({
  path: '/dynamic',
  name: 'dynamic-route',
  component: DynamicComponent
})

// Add a child route
router.addRoute('parent-name', {
  path: 'child', // Will be '/parent-path/child'
  name: 'child-route',
  component: ChildComponent
})
```

### router.removeRoute

Remove a route by name.

```javascript
router.removeRoute('route-name')
```

### router.hasRoute

Check if a route with the given name exists.

```javascript
const exists = router.hasRoute('route-name')
```

### router.getRoutes

Get a list of all route records.

```javascript
const routes = router.getRoutes()
```

### router.install

Install the router on a KalxJS application.

```javascript
import { createApp } from '@kalxjs/core'
import { createRouter } from '@kalxjs/router'

const app = createApp(App)
const router = createRouter({ /* options */ })

app.use(router)
// or
router.install(app)
```

## Composition API

### useRouter

Composition API hook to access the router and current route from any component.

```javascript
import { useRouter } from '@kalxjs/router'

export default {
  setup() {
    const {
      // Router instance
      router,
      
      // Route state (reactive)
      route,
      params,
      query,
      path,
      hash,
      fullPath,
      meta,
      name,
      matched,
      
      // Navigation methods
      push,
      replace,
      go,
      back,
      forward,
      
      // Route matching helpers
      isActive,
      isExactActive,
      
      // Route construction helpers
      resolve,
      
      // Navigation guards
      beforeEach,
      beforeResolve,
      afterEach
    } = useRouter()
    
    // Examples of usage
    
    // Navigate programmatically
    const goToProfile = () => {
      push('/profile')
    }
    
    // Check if a route is active
    const isProfileActive = isActive('/profile')
    
    // Resolve a route to get its URL
    const { href } = resolve({ name: 'user', params: { id: 123 } })
    
    return {
      goToProfile,
      isProfileActive,
      // ...
    }
  }
}
```

## Components

### RouterLink

Component for navigation with automatic active class application.

```javascript
import { RouterLink } from '@kalxjs/router'

// Basic usage
<RouterLink to="/about">About</RouterLink>

// With named route
<RouterLink to={{ name: 'user', params: { id: 123 } }}>User Profile</RouterLink>

// With replace mode
<RouterLink to="/login" replace>Login</RouterLink>

// With custom active classes
<RouterLink 
  to="/products"
  activeClass="my-active-class"
  exactActiveClass="my-exact-active-class"
>
  Products
</RouterLink>

// With custom tag
<RouterLink to="/contact" tag="button">Contact Us</RouterLink>

// With custom rendering
<RouterLink to="/dashboard" custom>
  {({ href, navigate, isActive, isExactActive }) => (
    <a 
      href={href}
      onClick={navigate}
      class={isExactActive ? 'exact-active' : isActive ? 'active' : ''}
    >
      Dashboard
    </a>
  )}
</RouterLink>
```

### RouterView

Component that displays the component for the current route.

```javascript
import { RouterView } from '@kalxjs/router'

// Basic usage
<RouterView />

// With named views
<RouterView name="sidebar" />
<RouterView name="main" />

// With scoped slot for transitions
<RouterView>
  {({ Component, route }) => (
    <Transition name={route.meta.transition || 'fade'}>
      <Component />
    </Transition>
  )}
</RouterView>
```

## Route Record

A route record represents a route configuration.

```javascript
{
  // Required
  path: '/users/:id',
  
  // One of the following is required
  component: UserComponent,
  components: {
    default: UserComponent,
    sidebar: UserSidebar
  },
  redirect: '/user/profile',
  redirect: to => {
    // Return route location
    return { name: 'profile' }
  },
  
  // Optional
  name: 'user',
  alias: ['/u/:id', '/profile/:id'],
  meta: {
    requiresAuth: true,
    title: 'User Profile'
  },
  props: true, // Pass route.params as component props
  props: { default: true, sidebar: false },
  props: route => ({ id: Number(route.params.id) }),
  
  // Nested routes
  children: [
    {
      path: 'profile',
      component: UserProfile
    },
    {
      path: 'posts',
      component: UserPosts
    }
  ],
  
  // Route-specific navigation guards
  beforeEnter: (to, from, next) => {
    // ...
    next()
  },
  beforeEnter: [guardA, guardB]
}
```

## Location Format

A location can be specified in multiple formats:

```javascript
// String path
'/users/123'

// Object format
{
  path: '/users/123',
  query: { plan: 'premium' },
  hash: '#bio'
}

// Named route with params
{
  name: 'user',
  params: { id: '123' }
}

// With query and hash
{
  name: 'user',
  params: { id: '123' },
  query: { plan: 'premium' },
  hash: '#bio'
}

// With replace flag
{
  path: '/users/123',
  replace: true
}
```

## Navigation Guards

Navigation guards are hooks that can be used to control navigation flow.

### Global Guards

```javascript
// Before each navigation
router.beforeEach((to, from, next) => {
  // ...
  next() // Continue
  next(false) // Abort
  next('/login') // Redirect
  next({ name: 'login' }) // Redirect to named route
  next(new Error()) // Abort with error
})

// After async components are resolved
router.beforeResolve((to, from, next) => {
  // ...
  next()
})

// After navigation is complete
router.afterEach((to, from) => {
  // ...
})
```

### Per-Route Guards

```javascript
const routes = [
  {
    path: '/users/:id',
    component: UserDetails,
    beforeEnter: (to, from, next) => {
      // ...
      next()
    },
    // Multiple guards
    beforeEnter: [guardA, guardB]
  }
]
```

### Component Guards

```javascript
const UserDetails = {
  setup() {
    // ...
  },
  
  // Called before the component is created
  beforeRouteEnter(to, from, next) {
    // Cannot access 'this' here
    next(vm => {
      // Access component instance via vm
    })
  },
  
  // Called when route params change for the same component
  beforeRouteUpdate(to, from, next) {
    // Can access 'this'
    next()
  },
  
  // Called when navigating away from this component
  beforeRouteLeave(to, from, next) {
    // Can access 'this'
    next()
  }
}
```

## Meta Fields

Route meta fields can be used to attach custom data to routes.

```javascript
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,
      roles: ['admin'],
      title: 'Admin Dashboard',
      transition: 'fade'
    },
    children: [
      {
        path: 'settings',
        component: AdminSettings,
        // Child routes inherit parent meta and can override or extend it
        meta: {
          roles: ['super-admin'],
          title: 'Admin Settings'
        }
      }
    ]
  }
]

// Accessing meta fields
router.beforeEach((to, from, next) => {
  // Meta fields from all matched route records are merged
  const requiresAuth = to.meta.requiresAuth
  const roles = to.meta.roles
  
  // ...
})
```

## TypeScript Support

KalxJS Router provides enhanced TypeScript support.

### Typing Route Params

```typescript
// Define param types
interface UserParams {
  id: string
  tab?: 'profile' | 'settings'
}

// Use in route definition
const routes: RouteDefinition<UserParams>[] = [
  {
    path: '/users/:id/:tab?',
    name: 'user',
    component: UserComponent
  }
]
```

### Typing Meta Fields

```typescript
// Define meta types
interface RouteMeta {
  requiresAuth: boolean
  title: string
  roles?: string[]
}

// Use in route definition
const routes: RouteDefinition<any, RouteMeta>[] = [
  {
    path: '/admin',
    component: AdminComponent,
    meta: {
      requiresAuth: true,
      title: 'Admin Dashboard',
      roles: ['admin']
    }
  }
]
```

### Typing Both Params and Meta

```typescript
// Combined typing
const routes: RouteDefinition<UserParams, RouteMeta>[] = [
  {
    path: '/users/:id/:tab?',
    name: 'user',
    component: UserComponent,
    meta: {
      requiresAuth: true,
      title: 'User Profile'
    }
  }
]
```

### Type-Safe Access in Components

```typescript
// In component
const { params, meta } = useRouter<UserParams, RouteMeta>()

// TypeScript knows:
// - params.value.id is a string
// - params.value.tab is an optional 'profile' | 'settings'
// - meta.value.requiresAuth is a boolean
// - meta.value.title is a string
// - meta.value.roles is an optional string array
```