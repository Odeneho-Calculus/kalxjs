import { createRouter as createKalRouter } from '@kalxjs/router';
import Home from '../pages/Home.js';
import About from '../pages/About.js';
import NotFound from '../pages/NotFound.js';
import { h, createApp } from '@kalxjs/core';

// Export version for compatibility checks
export const version = '1.0.0';

export function createRouter() {
  // Create router with hash mode for better compatibility
  const router = createKalRouter({
    history: 'hash', // Use hash history for better compatibility
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
        path: '/:pathMatch(.*)*',
        component: NotFound,
        name: 'not-found'
      }
    ]
  });

  // Add navigation guards
  router.beforeEach((to, from, next) => {
    console.log(`Router navigation started: ${from.path} -> ${to.path}`);
    next(); // Always proceed with navigation
  });

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
    let routerViewContainer = document.getElementById('router-view');
    if (!routerViewContainer) {
      console.error('Router view container not found');
      // Create the container if it doesn't exist
      const mainElement = document.querySelector('.app-main');
      if (mainElement) {
        const newContainer = document.createElement('div');
        newContainer.id = 'router-view';
        mainElement.appendChild(newContainer);
        routerViewContainer = newContainer;
      } else {
        return;
      }
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
