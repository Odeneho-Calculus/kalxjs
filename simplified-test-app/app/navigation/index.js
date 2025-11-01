import { createRouter as createKalRouter, createWebHistory } from '@kalxjs/router';
import Home from '../pages/Home.js';
import About from '../pages/About.js';
import Product from '../pages/Product.js';
import UserProfile from '../pages/UserProfile.js';
import Search from '../pages/Search.js';
import CategoryItem from '../pages/CategoryItem.js';
import NotFound from '../pages/NotFound.js';
import { h, createApp } from '@kalxjs/core';

// Define version for compatibility checks
const version = '2.0.32';

// Helper function to handle route errors
function handleRouteError(err, route) {
  console.error(`Error loading route ${route.path}:`, err);
  const routerView = document.getElementById('router-view');
  if (routerView) {
    routerView.innerHTML = `
      <div class="error-container">
        <h2>Navigation Error</h2>
        <p>Failed to load route: ${route.path}</p>
        <p>Error: ${err.message || 'Unknown error'}</p>
        <button onclick="window.router.push('/')">Go to Home</button>
      </div>
    `;
  }
}

export function createRouter() {
  const router = createKalRouter({
    history: createWebHistory(),
    base: '/', // Base URL for all routes
    routes: [
      {
        path: '/',
        component: Home,
        name: 'home'
      },
      {
        path: '/about',
        component: About,
        name: 'about'
      },
      {
        path: '/product/:id',
        component: Product,
        name: 'product'
      },
      {
        path: '/user/:username',
        component: UserProfile,
        name: 'user-profile'
      },
      {
        path: '/search',
        component: Search,
        name: 'search'
      },
      {
        path: '/category/:categoryId/item/:itemId',
        component: CategoryItem,
        name: 'category-item'
      },
      {
        path: '/:pathMatch(.*)*',
        component: NotFound,
        name: 'not-found'
      }
    ]
  });

  // Add onError method to the router
  router.onError = function (callback) {
    router.errorHandler = callback;
    return router;
  };

  // Custom rendering logic for router views
  router.afterEach((to, from) => {
    console.log(`Router navigation complete: ${from.path} -> ${to.path}`);

    // Get the matched component
    const matchedRoute = to.matched[0];
    if (!matchedRoute) {
      console.error('No matching route found');
      return;
    }

    const component = matchedRoute.component;
    if (!component) {
      console.error('No component defined for route');
      return;
    }

    // Get the router view container
    const routerViewContainer = document.getElementById('router-view');
    if (!routerViewContainer) {
      console.error('Router view container not found');
      return;
    }

    // Clear the container
    routerViewContainer.innerHTML = '';

    // Render the component
    try {
      console.log('Rendering component:', component.name || 'Unnamed Component');

      // Create a new app instance with the component
      const app = createApp(component);

      // Mount it to the container
      app.mount(routerViewContainer);

      console.log('Component rendered successfully');
    } catch (error) {
      console.error('Error rendering component:', error);
      routerViewContainer.innerHTML = `<div class="error">Error rendering view: ${error.message}</div>`;
    }
  });

  return router;
}
