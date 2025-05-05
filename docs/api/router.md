<!-- kalxjs/docs/api/router.md -->
# Router API

The kalxjs router enables building single-page applications with dynamic navigation.

## createRouter()

Creates a new router instance.

```javascript
import { createRouter } from 'kalxjs/router';

const router = createRouter({
  mode: 'history', // or 'hash'
  base: '/app/',   // base URL path
  routes: [
    {
      path: '/',
      component: Home
    },
    {
      path: '/about',
      component: About
    },
    {
      path: '/users/:id',
      component: UserProfile
    },
    {
      path: '*',
      component: NotFound
    }
  ]
});

// Initialize the router
router.init();
```

### Arguments

- `{Object} options` - Router configuration options

### Options

- `mode` - Router mode ('hash' or 'history')
- `base` - Base URL for all routes (used in history mode)
- `routes` - Array of route definitions

### Returns

- `{Object}` - Router instance

## Router Instance Methods

### router.push()

Navigate to a specific route and add an entry to the browser history.

```javascript
// Navigate to a path
router.push('/about');

// Navigate with object
router.push({
  path: '/users/123',
  query: { tab: 'profile' }
});
```

### router.replace()

Navigate to a route without adding an entry to the history.

```javascript
router.replace('/about');
```

### router.go()

Navigate through history.

```javascript
// Go back one step
router.go(-1);

// Go forward one step
router.go(1);
```

### router.init()

Initialize the router and start listening for navigation events.

```javascript
router.init();
```

### router.onChange()

Register a callback function to be called when the route changes.

```javascript
const unsubscribe = router.onChange((route) => {
  console.log('Route changed:', route.path);
});

// Later, to stop listening
unsubscribe();
```

## Route Objects

Each route can have the following properties:

```javascript
{
  path: '/users/:id',          // Route path (supports params with :param syntax)
  component: UserComponent,    // Component to render for this route
  name: 'user-profile',        // Optional route name for programmatic navigation
  props: true,                 // Automatically pass route params as component props
  meta: { requiresAuth: true } // Custom metadata for the route
}
```

## Components

### RouterView

A component that displays the component matching the current route.

```javascript
import { RouterView } from 'kalxjs/router';

// In your template/render function
h(RouterView);
```

### RouterLink

A component that renders a link that triggers navigation when clicked.

```javascript
import { RouterLink } from 'kalxjs/router';

// In your template/render function
h(RouterLink, { to: '/about' }, 'About Us');

// With additional properties
h(RouterLink, { 
  to: '/users/123',
  class: 'nav-link',
  activeClass: 'active'
}, 'User Profile');
```