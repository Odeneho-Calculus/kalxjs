import { createRouter as createKalRouter, createWebHistory } from '@kalxjs/router';
import Home from '../pages/Home.js';
import About from '../pages/About.js';
import Features from '../pages/Features.js';
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
    base: '/',
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
        path: '/features',
        component: Features,
        name: 'features'
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

  // RouterView component handles rendering, so we just log for debugging
  router.afterEach((to, from) => {
    console.log(`Router navigation complete: ${from.path} -> ${to.path}`);
  });

  // Get the current path from the URL and match it immediately
  // This ensures router.currentRoute has matched routes before RouterView renders
  const getCurrentPath = () => {
    if (typeof window === 'undefined') return '/';

    if (router.mode === 'hash') {
      const hashValue = window.location.hash.slice(1);
      const fragmentIndex = hashValue.indexOf('#');
      if (fragmentIndex !== -1) {
        return hashValue.slice(0, fragmentIndex).split('?')[0];
      }
      return hashValue.split('?')[0] || '/';
    } else {
      const base = router.base || '';
      return window.location.pathname.slice(base.length) || '/';
    }
  };

  // Manually match and set the current route immediately
  const currentPath = getCurrentPath();
  console.log('Router creation: Current path is', currentPath);

  // Match the path and update currentRoute
  if (router._matchRoute && typeof router._matchRoute === 'function') {
    router.currentRoute = router._matchRoute(currentPath);
    console.log('Router creation: Initial currentRoute.matched:', router.currentRoute.matched?.length || 0);
  }

  return router;
}
