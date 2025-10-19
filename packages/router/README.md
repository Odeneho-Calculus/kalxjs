# KalxJS Router

The official router for KalxJS applications.

## Installation

```bash
npm install @kalxjs/router
```

## Basic Usage

### Create a Router

```javascript
// router/index.js
import { createRouter, createWebHashHistory } from '@kalxjs/router';
import Home from '../pages/Home.js';
import About from '../pages/About.js';
import NotFound from '../pages/NotFound.js';

// Define routes
const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      title: 'Home'
    }
  },
  {
    path: '/about',
    name: 'about',
    component: About,
    meta: {
      title: 'About'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound
  }
];

// Create router instance
const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
```

### Use the Router in Your App

```javascript
// main.js
import { createApp } from '@kalxjs/core';
import App from './App.js';
import router from './router';

const app = createApp(App);
app.use(router);
app.mount('#app');
```

### Use Router Components

```javascript
// App.js
import { h, inject } from '@kalxjs/core';
import { RouterLink, RouterView } from '@kalxjs/router';

export default {
  setup() {
    // Get the router instance
    const router = inject('router');

    return () => h('div', { class: 'app-container' }, [
      h('header', {}, [
        h('h1', {}, 'My App'),
        h('nav', {}, [
          h(RouterLink, {
            to: '/',
            activeClass: 'active'
          }, () => 'Home'),

          h(RouterLink, {
            to: '/about',
            activeClass: 'active'
          }, () => 'About')
        ])
      ]),
      h('main', {}, [
        // Render the router view component
        h(RouterView)
      ])
    ]);
  }
};
```

## Navigation Guards

```javascript
// Global navigation guard
router.beforeEach((to, from, next) => {
  // Update document title
  document.title = to.meta.title ? `${to.meta.title} - My App` : 'My App';
  
  // Check authentication
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});

// Global after hook
router.afterEach((to) => {
  // Analytics tracking
  trackPageView(to.path);
});
```

## Nested Routes

```javascript
const routes = [
  {
    path: '/user',
    component: UserLayout,
    children: [
      {
        path: 'profile',
        component: UserProfile
      },
      {
        path: 'settings',
        component: UserSettings
      }
    ]
  }
];
```

## Dynamic Routes

```javascript
const routes = [
  {
    path: '/user/:id',
    component: UserDetails
  }
];

// Access route params
const UserDetails = {
  setup() {
    const router = inject('router');
    const userId = computed(() => router.currentRoute.params.id);
    
    return () => h('div', {}, `User ID: ${userId.value}`);
  }
};
```

## Programmatic Navigation

```javascript
// In a component
const router = inject('router');

// Navigate to a new route
router.push('/about');

// Navigate with options
router.push({
  path: '/user',
  query: { name: 'john' }
});

// Navigate by name
router.push({
  name: 'user',
  params: { id: '123' }
});

// Replace current route
router.replace('/home');

// Go back
router.back();

// Go forward
router.forward();

// Go to specific history position
router.go(-2);
```

## History Modes

### Hash Mode (Default)

```javascript
import { createWebHashHistory } from '@kalxjs/router';

const router = createRouter({
  history: createWebHashHistory(),
  routes
});
```

### HTML5 Mode

```javascript
import { createWebHistory } from '@kalxjs/router';

const router = createRouter({
  history: createWebHistory(),
  routes
});
```

With base URL:

```javascript
import { createWebHistory } from '@kalxjs/router';

const router = createRouter({
  history: createWebHistory('/app/'),
  routes
});
```

## API Reference

### Router Instance

- `router.currentRoute`: Reactive reference to the current route
- `router.push(to)`: Navigate to a new route
- `router.replace(to)`: Replace current route
- `router.go(delta)`: Go forward or backward in history
- `router.back()`: Go back in history
- `router.forward()`: Go forward in history
- `router.beforeEach(guard)`: Add a global before navigation guard
- `router.afterEach(hook)`: Add a global after navigation hook
- `router.getRoutes()`: Get all route records
- `router.hasRoute(name)`: Check if a route with the given name exists
- `router.isReady()`: Returns a Promise that resolves when the router has completed initial navigation

### Route Object

- `route.path`: Current path
- `route.name`: Route name if provided
- `route.params`: Object containing route parameters
- `route.query`: Object containing query parameters
- `route.meta`: Route metadata
- `route.matched`: Array of matched route records

## License

MIT