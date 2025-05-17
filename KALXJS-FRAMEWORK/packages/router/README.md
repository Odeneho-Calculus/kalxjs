# kalxjs Router

Next-generation routing for kalxjs applications with advanced features that surpass Vue Router, including TypeScript support, view transitions, and code splitting.

## Version 2.0.25

This latest version includes significant improvements to the router's core functionality, with enhanced route matching, better error handling, and improved scroll behavior for hash navigation.

## Features

- **Advanced Navigation Guards**: More powerful than Vue Router with promise-based navigation
- **Nested Routes**: Full support for nested route hierarchies
- **Dynamic Route Matching**: Enhanced pattern matching with regex support and optional parameters
- **Route Meta Fields**: Attach custom data to routes for advanced use cases
- **Programmatic Navigation**: Promise-based navigation with comprehensive error handling
- **Navigation Guards**: Global, per-route, and component guards with async support
- **Route Aliases**: Multiple paths for the same route
- **Named Routes**: Reference routes by name for more maintainable code
- **Named Views**: Multiple named views for complex layouts
- **Scroll Behavior**: Customizable scroll position restoration
- **Lazy Loading**: Automatic code splitting for optimized loading
- **TypeScript Support**: Full type safety for routes and navigation
- **History Modes**: HTML5 history, hash mode, and memory mode for testing
- **Query Parameter Handling**: Advanced query parsing and stringifying
- **Transitions API**: Smooth page transitions with built-in animation support
- **Composition API**: Enhanced `useRouter()` with more features than Vue Router

## Installation

```bash
npm install @kalxjs/router
```

## Modern Usage

```javascript
import { 
  createRouter, 
  createWebHistory, 
  createWebHashHistory, 
  createMemoryHistory 
} from '@kalxjs/router'

// Define routes with advanced features
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('./pages/Home.js'),
    meta: { 
      title: 'Home Page',
      requiresAuth: false,
      transition: 'fade'
    }
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('./pages/Users.js'),
    // Nested routes
    children: [
      {
        // Will match /users/:id
        path: ':id',
        name: 'user-profile',
        component: () => import('./pages/UserProfile.js'),
        // Route-specific navigation guard
        beforeEnter: (to, from, next) => {
          // Validate user ID
          if (/^\d+$/.test(to.params.id)) {
            next()
          } else {
            next('/users')
          }
        },
        // Pass route params as component props
        props: true,
        // Multiple aliases for the same route
        alias: ['/profile/:id', '/u/:id']
      },
      {
        // Optional parameter with custom regex pattern
        path: ':id/posts/:postId(\\d+)?',
        name: 'user-posts',
        component: () => import('./pages/UserPosts.js')
      }
    ]
  },
  {
    // Advanced pattern matching with regex
    path: '/products/:category([a-z]+)/:id(\\d+)',
    name: 'product',
    component: () => import('./pages/Product.js')
  },
  {
    // Catch-all route for 404 page
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('./pages/NotFound.js')
  }
]

// Create router with advanced options
const router = createRouter({
  // Choose mode (hash is default)
  mode: 'history', // 'hash', 'history', or 'memory'
  
  // Base URL (optional)
  base: '/app/',
  
  routes,
  
  // Case sensitivity and trailing slash handling
  caseSensitive: false,
  trailingSlash: false,
  
  // Custom scroll behavior
  scrollBehavior(to, from, savedPosition) {
    // Return to saved position for back/forward navigation
    if (savedPosition) {
      return savedPosition
    }
    
    // Scroll to anchor if hash is present
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }
    
    // Otherwise scroll to top
    return { top: 0 }
  },
  
  // Custom query parsing and stringifying
  parseQuery(queryString) {
    // Custom query parser
    const query = {}
    // ... custom parsing logic
    return query
  },
  
  stringifyQuery(query) {
    // Custom query stringifier
    // ... custom stringifying logic
    return '?customParam=value'
  }
})
```

## Composition API

The router package includes an enhanced `useRouter()` composition function that provides more features than Vue Router:

```javascript
import { useRouter } from '@kalxjs/router';

export default {
  setup() {
    // Access router instance and route information with more features than Vue Router
    const { 
      router,       // Router instance
      route,        // Reactive reference to current route
      params,       // Computed property for route parameters
      query,        // Computed property for query parameters
      path,         // Computed property for current path
      hash,         // Computed property for URL hash
      fullPath,     // Computed property for full URL path
      meta,         // Computed property for route meta data
      name,         // Computed property for route name
      matched,      // Computed property for matched route records
      
      // Navigation methods (all return promises)
      push,         // Navigate to a new location
      replace,      // Replace current location
      go,           // Go forward or backward in history
      back,         // Go back one step in history
      forward,      // Go forward one step in history
      
      // Route matching helpers
      isActive,     // Check if a route is active (non-exact)
      isExactActive,// Check if a route is exactly active
      
      // Route construction helpers
      resolve,      // Resolve a route location to a URL
      
      // Navigation guards
      beforeEach,   // Add a global before each guard
      beforeResolve,// Add a global before resolve guard
      afterEach     // Add a global after each hook
    } = useRouter();
    
    // Promise-based navigation
    const goToProfile = async () => {
      try {
        // Wait for navigation to complete
        const route = await push('/profile');
        console.log('Navigation successful:', route.path);
      } catch (error) {
        console.error('Navigation failed:', error);
      }
    };
    
    // Check if a route is active
    const isProfileActive = isActive('/profile');
    const isExactlyOnProfile = isExactActive('/profile');
    
    // Resolve a route to get its URL
    const { href } = resolve({ 
      name: 'user-profile', 
      params: { id: 123 },
      query: { tab: 'settings' }
    });
    
    // Add navigation guards
    const unregisterGuard = beforeEach((to, from, next) => {
      // Check authentication
      if (to.meta.requiresAuth && !isAuthenticated()) {
        // Redirect to login with return URL
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        });
      } else {
        // Continue navigation
        next();
      }
    });
    
    // Access route parameters (reactive)
    console.log(params.value.id); // Access dynamic route parameter
    
    // Access route meta data (reactive)
    console.log(meta.value.title); // Access route meta title
    
    return {
      // Expose to template
      params,
      meta,
      isProfileActive,
      goToProfile,
      
      // Clean up when component unmounts
      onUnmounted() {
        unregisterGuard(); // Remove navigation guard
      }
    };
  }
}
```

### Available Properties and Methods

The enhanced `useRouter()` function returns:

#### Router State
- `router`: The router instance
- `route`: Reactive reference to the current route
- `params`: Computed property for route parameters
- `query`: Computed property for query parameters
- `path`: Computed property for the current path
- `hash`: Computed property for the URL hash fragment
- `fullPath`: Computed property for the full URL path
- `meta`: Computed property for route meta data
- `name`: Computed property for the route name
- `matched`: Computed property for matched route records

#### Navigation Methods
- `push(location)`: Navigate to a new location (returns Promise)
- `replace(location)`: Replace current location (returns Promise)
- `go(n)`: Go forward or backward in history (returns Promise)
- `back()`: Go back one step in history (returns Promise)
- `forward()`: Go forward one step in history (returns Promise)

#### Route Matching Helpers
- `isActive(route)`: Check if a route is active (non-exact match)
- `isExactActive(route)`: Check if a route is exactly active

#### Route Construction Helpers
- `resolve(location)`: Resolve a route location to a URL

#### Navigation Guards
- `beforeEach(guard)`: Add a global before each guard
- `beforeResolve(guard)`: Add a global before resolve guard
- `afterEach(hook)`: Add a global after each hook

## History Modes

KalxJS Router supports three different history modes:

### Hash Mode (Default)

```javascript
const router = createRouter({
  mode: 'hash',
  // other options...
})
```

- Uses URL hash for routing (`example.com/#/about`)
- Works without server configuration
- Compatible with all browsers
- Doesn't require server-side support

### HTML5 History Mode

```javascript
const router = createRouter({
  mode: 'history',
  base: '/app/', // optional base path
  // other options...
})
```

- Uses the HTML5 History API
- Creates clean URLs (`example.com/about`)
- Requires server-side configuration to handle direct URL access
- Falls back to hash mode if History API is not supported

### Memory Mode

```javascript
const router = createRouter({
  mode: 'memory',
  // other options...
})
```

- Keeps history in memory
- Useful for testing and server-side rendering
- No URL changes in the browser

You can also use the dedicated history creation functions:

```javascript
import { createWebHistory, createWebHashHistory, createMemoryHistory } from '@kalxjs/router'

// These functions are available but the preferred approach is using the 'mode' option
const historyMode = createWebHistory('/base/')
const hashMode = createWebHashHistory()
const memoryMode = createMemoryHistory('/initial-path')
```

## Advanced Features

### Navigation Guards

KalxJS Router provides a more powerful navigation guard system than Vue Router:

```javascript
import { createRouter } from '@kalxjs/router'

const router = createRouter({
  routes: [
    {
      path: '/admin',
      component: AdminPanel,
      // Route-specific guard
      beforeEnter: [
        // Multiple guards in sequence
        checkAdminRole,
        checkPermissions
      ],
      meta: { requiresAuth: true }
    }
  ]
})

// Global navigation guards
router.beforeEach(async (to, from, next) => {
  // Start loading indicator
  showLoadingIndicator()
  
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    // Async authentication check
    const isAuthenticated = await checkAuthStatus()
    
    if (!isAuthenticated) {
      // Redirect to login with return URL
      return { 
        path: '/login', 
        query: { redirect: to.fullPath } 
      }
    }
  }
  
  // Continue navigation
  next()
})

// Global resolve guards (after async components are resolved)
router.beforeResolve(async (to, from, next) => {
  // Check for required data
  if (to.meta.fetchData) {
    try {
      // Pre-fetch data before navigation completes
      await fetchRouteData(to)
      next()
    } catch (error) {
      next(error) // Abort navigation with error
    }
  } else {
    next()
  }
})

// Global after hooks (don't affect navigation)
router.afterEach((to, from) => {
  // Hide loading indicator
  hideLoadingIndicator()
  
  // Update page title
  document.title = to.meta.title || 'KalxJS App'
  
  // Analytics tracking
  trackPageView(to.fullPath)
})
```

### Advanced Route Matching

KalxJS Router supports more powerful route matching patterns than Vue Router:

```javascript
const routes = [
  // Optional parameters
  { path: '/users/:id?' },
  
  // Custom regex patterns
  { path: '/products/:id(\\d+)' }, // Only match numeric IDs
  
  // Multiple parameters with patterns
  { path: '/articles/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug' },
  
  // Optional segments
  { path: '/search/:query/:page(\\d+)?' },
  
  // Catch-all routes with named parameter
  { path: '/:pathMatch(.*)*', name: 'not-found' },
  
  // Catch-all routes that match segments
  { path: '/:pathMatch(.*)' },
  
  // Multiple aliases
  { 
    path: '/main', 
    alias: ['/home', '/index', '/start'] 
  }
]
```

### Dynamic Routing

KalxJS Router supports dynamic route registration and manipulation:

```javascript
// Add routes dynamically
router.addRoute({
  path: '/dynamic',
  name: 'dynamic-route',
  component: DynamicComponent
})

// Add nested routes
router.addRoute('parent-route', {
  path: 'child',
  name: 'child-route',
  component: ChildComponent
})

// Remove routes
router.removeRoute('route-name')

// Check if route exists
const hasRoute = router.hasRoute('route-name')

// Get route by name
const route = router.getRoutes().find(route => route.name === 'route-name')
```

### RouterView and RouterLink Components

KalxJS Router provides two essential components for building navigation interfaces:

#### RouterView

The `RouterView` component renders the component matched by the current route:

```javascript
import { RouterView } from '@kalxjs/router'

// In your component
export default {
  render() {
    return {
      tag: 'div',
      props: { class: 'app' },
      children: [
        {
          tag: 'header',
          children: ['My App']
        },
        // This will render the matched route component
        RouterView()
      ]
    }
  }
}
```

#### RouterLink

The `RouterLink` component creates navigation links with automatic active class handling:

```javascript
import { RouterLink } from '@kalxjs/router'

// In your component
export default {
  render() {
    return {
      tag: 'nav',
      children: [
        RouterLink({ 
          to: '/', 
          activeClass: 'active',
          exactActiveClass: 'exact-active',
          children: ['Home']
        }),
        RouterLink({ 
          to: '/about',
          children: ['About']
        }),
        // With replace mode (doesn't add to history)
        RouterLink({ 
          to: '/contact',
          replace: true,
          children: ['Contact']
        }),
        // With custom rendering
        RouterLink({
          to: '/profile',
          custom: true,
          tag: 'button',
          children: ['Profile']
        })
      ]
    }
  }
}
```

### TypeScript Support

KalxJS Router provides enhanced TypeScript support:

```typescript
// Route params typing
interface UserParams {
  id: string
  tab?: 'profile' | 'settings'
}

// Route meta typing
interface RouteMeta {
  requiresAuth: boolean
  title: string
  roles?: string[]
}

// Typed route definition
const routes: RouteDefinition<UserParams, RouteMeta>[] = [
  {
    path: '/users/:id/:tab?',
    name: 'user',
    component: UserView,
    meta: {
      requiresAuth: true,
      title: 'User Profile',
      roles: ['admin', 'user']
    },
    // Type checking for params
    beforeEnter: (to) => {
      // TypeScript knows that to.params.id exists and is a string
      // TypeScript knows that to.params.tab is optional and can only be 'profile' or 'settings'
      // TypeScript knows that to.meta.requiresAuth is a boolean
      // TypeScript knows that to.meta.roles is an optional string array
    }
  }
]

// Type-safe route access in components
const { params, meta } = useRouter()
// TypeScript knows params.value.id is a string
// TypeScript knows params.value.tab is an optional 'profile' | 'settings'
// TypeScript knows meta.value.requiresAuth is a boolean
```

### Data Fetching Patterns

KalxJS Router supports advanced data fetching patterns:

```javascript
// 1. Fetch before navigation (in navigation guard)
router.beforeResolve(async (to, from, next) => {
  try {
    // Set loading state
    to.meta.isLoading = true
    
    // Fetch data for all matched route components
    await Promise.all(to.matched.map(async (record) => {
      if (record.component.fetchData) {
        const data = await record.component.fetchData(to.params)
        // Store data in route meta
        to.meta.data = { ...to.meta.data, ...data }
      }
    }))
    
    next()
  } catch (error) {
    next(error)
  } finally {
    to.meta.isLoading = false
  }
})

// 2. Component-based data fetching
const UserComponent = {
  setup() {
    const { route, router } = useRouter()
    const userData = ref(null)
    const isLoading = ref(true)
    const error = ref(null)
    
    // Fetch when route params change
    watch(() => route.value.params.id, async (newId) => {
      if (!newId) return
      
      try {
        isLoading.value = true
        userData.value = await fetchUserData(newId)
      } catch (err) {
        error.value = err
      } finally {
        isLoading.value = false
      }
    }, { immediate: true })
    
    return { userData, isLoading, error }
  }
}
```

## Scroll Behavior

KalxJS Router provides advanced scroll behavior control:

```javascript
const router = createRouter({
  // other options...
  
  // Custom scroll behavior
  scrollBehavior(to, from, savedPosition) {
    // Return to saved position for back/forward navigation
    if (savedPosition) {
      return savedPosition
    }
    
    // Scroll to anchor if hash is present
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        // Optional offset
        top: 20
      }
    }
    
    // Scroll to top with smooth behavior
    return { 
      top: 0,
      behavior: 'smooth'
    }
  }
})
```

In version 2.0.25, the scroll behavior for hash navigation has been significantly improved:

- Better handling of hash fragments in URLs
- Smoother scrolling to hash elements
- Improved position restoration for back/forward navigation
- Better error handling when target elements don't exist

## Error Handling

KalxJS Router provides comprehensive error handling for navigation:

```javascript
// All navigation methods return promises
router.push('/dashboard')
  .then(route => {
    console.log('Navigation successful:', route.path)
  })
  .catch(error => {
    console.error('Navigation failed:', error.message)
    
    // Handle different error types
    if (error.message.includes('Navigation aborted by guard')) {
      // Handle navigation guard rejection
    } else if (error.message.includes('No route matched')) {
      // Handle route not found
    } else {
      // Handle other errors
    }
  })

// Using async/await
async function navigate() {
  try {
    const route = await router.push('/dashboard')
    console.log('Navigation successful:', route.path)
  } catch (error) {
    console.error('Navigation failed:', error.message)
  }
}
```

## License

MIT