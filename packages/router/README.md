# kalxjs Router

Official router for kalxjs framework, providing powerful routing capabilities for single-page applications.

## Features

- **Hash Mode & History Mode**: Support for different routing strategies
- **Dynamic Route Matching**: Route parameters and patterns
- **Nested Routes**: Create complex route hierarchies
- **Route Guards**: Control access to routes
- **Route Meta Fields**: Attach metadata to routes
- **Programmatic Navigation**: Navigate between routes programmatically

## Installation

```bash
npm install @kalxjs/router
```

## Basic Usage

```javascript
import kalxjs from '@kalxjs/core';
import { createRouter, RouterView, RouterLink } from '@kalxjs/router';

// Define your components
const Home = kalxjs.defineComponent({
  render(h) {
    return h('div', {}, 'Home Page');
  }
});

const About = kalxjs.defineComponent({
  render(h) {
    return h('div', {}, 'About Page');
  }
});

// Create the router
const router = createRouter({
  mode: 'hash', // 'hash' or 'history'
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
});

// Create the app with router integration
const app = kalxjs.createApp({
  render(h) {
    return h('div', {}, [
      h('nav', {}, [
        h(RouterLink, { to: '/' }, 'Home'),
        ' | ',
        h(RouterLink, { to: '/about' }, 'About')
      ]),
      h(RouterView)
    ]);
  }
});

// Use the router
app.use(router);
app.mount('#app');
```

## API Documentation

### Router Creation

- `createRouter(options)`: Create a new router instance
  - `options.routes`: Array of route definitions
  - `options.mode`: 'hash' or 'history'
  - `options.base`: Base URL for history mode

### Route Navigation

- `router.push(location)`: Navigate to a new route
- `router.replace(location)`: Replace current route
- `router.go(n)`: Navigate through history

### Components

- `RouterView`: Component to display the matched route component
- `RouterLink`: Component for navigation between routes

### Route Guards

```javascript
// Global guards
router.beforeEach((to, from, next) => {
  // Check authentication or other conditions
  if (isAuthenticated || to.path === '/login') {
    next(); // Allow navigation
  } else {
    next('/login'); // Redirect
  }
});

// Route-specific guards in route definition
const routes = [
  {
    path: '/admin',
    component: Admin,
    beforeEnter: (to, from, next) => {
      if (isAdmin) {
        next();
      } else {
        next('/forbidden');
      }
    }
  }
];
```

## License

MIT