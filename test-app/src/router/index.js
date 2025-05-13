import { createRouter, useRouter } from '@kalxjs/router';
import { h } from '@kalxjs/core';

// Import views - using lazy loading for better performance
const Home = () => import('../views/Home.klx');
const About = () => import('../views/About.klx');
const User = () => import('../views/User.klx');
const NotFound = () => import('../views/NotFound.klx');

// Create router instance
const router = createRouter({
  // Use hash-based routing mode
  mode: 'hash',

  // Define routes with advanced matching capabilities
  routes: [
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
      path: '/user/:id(\d+)', // Only match numeric IDs
      name: 'user',
      component: User,
      props: true, // Pass route params as component props
      meta: {
        title: 'User Profile'
      }
    },
    {
      // Catch-all route for 404 page with named parameter
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
      meta: {
        title: 'Page Not Found'
      }
    }
  ],

  // Custom scroll behavior
  scrollBehavior(to, from, savedPosition) {
    // Return to saved position for back/forward navigation
    if (savedPosition) {
      return savedPosition;
    }

    // Scroll to anchor if hash is present
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      };
    }

    // Otherwise scroll to top
    return { top: 0 };
  }
});

// Set page title based on route meta
// We'll handle this in the main.js file instead

export default router;

// Export the useRouter function for easy access in components
export { useRouter } from '@kalxjs/router';