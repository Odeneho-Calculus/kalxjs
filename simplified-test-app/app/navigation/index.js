import { createRouter as createKalRouter, createWebHistory, useRouter as kalUseRouter } from '@kalxjs/router';
import Home from '../pages/Home.js';
import About from '../pages/About.js';
import Product from '../pages/Product.js';
import UserProfile from '../pages/UserProfile.js';
import Search from '../pages/Search.js';
import CategoryItem from '../pages/CategoryItem.js';
import Phase5ProgrammaticNav from '../pages/Phase5ProgrammaticNav.js';
import Phase6RouterComponents from '../pages/Phase6RouterComponents.js';
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
    forceHistoryMode: true, // Force history mode for SPA routing with proper Vite SPA config
    routes: [
      {
        path: '/',
        component: Home,
        name: 'home',
        meta: { title: 'Home', description: 'Home page' }
      },
      {
        path: '/about',
        component: About,
        name: 'about',
        meta: { title: 'About', description: 'About page' }
      },
      {
        path: '/product/:id',
        component: Product,
        name: 'product',
        meta: { title: 'Product', description: 'Product detail page' }
      },
      {
        path: '/user/:username',
        component: UserProfile,
        name: 'user-profile',
        meta: { title: 'User Profile', description: 'User profile page' }
      },
      {
        path: '/search',
        component: Search,
        name: 'search',
        meta: { title: 'Search', description: 'Search page' }
      },
      {
        path: '/category/:categoryId/item/:itemId',
        component: CategoryItem,
        name: 'category-item',
        meta: { title: 'Category Item', description: 'Category item detail page' }
      },
      {
        path: '/phase5',
        component: Phase5ProgrammaticNav,
        name: 'phase5',
        meta: { title: 'Phase 5: Navigation Methods', description: 'Phase 5 Programmatic Navigation Testing' }
      },
      {
        path: '/phase6',
        component: Phase6RouterComponents,
        name: 'phase6',
        meta: { title: 'Phase 6: Router Components', description: 'Phase 6 RouterLink & RouterView Testing' }
      },
      {
        path: '/:pathMatch(.*)*',
        component: NotFound,
        name: 'not-found',
        meta: { title: '404 Not Found', description: 'Page not found' }
      }
    ]
  });

  // Add onError method to the router
  router.onError = function (callback) {
    router.errorHandler = callback;
    return router;
  };

  // Store the currently mounted app instance for proper cleanup
  let currentMountedInstance = null;

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

    // Update page title and meta tags based on route metadata
    if (matchedRoute.meta) {
      // Update page title
      if (matchedRoute.meta.title) {
        document.title = matchedRoute.meta.title + ' - simplified-test-app';
        console.log('Page title updated to:', document.title);
      }

      // Update or create meta description tag
      if (matchedRoute.meta.description) {
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', matchedRoute.meta.description);
        console.log('Meta description updated:', matchedRoute.meta.description);
      }
    }

    // Get the router view container
    const routerViewContainer = document.getElementById('router-view');
    if (!routerViewContainer) {
      console.error('Router view container not found');
      return;
    }

    // Unmount the previous component instance if it exists
    if (currentMountedInstance && typeof currentMountedInstance.$unmount === 'function') {
      console.log('Unmounting previous component instance');
      try {
        currentMountedInstance.$unmount();
      } catch (error) {
        console.warn('Error unmounting previous component:', error);
      }
    }

    // Clear the container completely to ensure no orphaned DOM elements remain
    routerViewContainer.innerHTML = '';

    // Render the component
    try {
      console.log('Rendering component:', component.name || 'Unnamed Component');

      // Create a new app instance with the component
      const app = createApp(component);

      // Mount it to the container
      app.mount(routerViewContainer);

      // Store the mounted instance for next navigation cleanup
      // The app object mounts a component, and we need to track it for cleanup
      currentMountedInstance = routerViewContainer.firstChild?.__kalxjs_instance || 
                               routerViewContainer.__kalxjs_instance;

      // If we can't find the instance through the DOM, we'll store it from the container's internal reference
      if (!currentMountedInstance && routerViewContainer.children.length > 0) {
        // Store a reference to force cleanup on next navigation
        currentMountedInstance = {
          $el: routerViewContainer.children[0],
          $unmount: function() {
            // Ensure complete cleanup
            while (routerViewContainer.children.length > 0) {
              routerViewContainer.removeChild(routerViewContainer.children[0]);
            }
          }
        };
      }

      console.log('Component rendered successfully');
    } catch (error) {
      console.error('Error rendering component:', error);
      routerViewContainer.innerHTML = `<div class="error">Error rendering view: ${error.message}</div>`;
      currentMountedInstance = null;
    }
  });

  return router;
}

// Re-export useRouter composable (ISSUE 4 FIX)
export const useRouter = kalUseRouter;
