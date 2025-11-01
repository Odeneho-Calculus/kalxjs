import { createApp } from '@kalxjs/core';
import App from './core/App.js';
import { createRouter, useRouter } from './navigation';
import { createStore } from './state';
import { registerPlugins } from './extensions';
// Import global styles
import './styles/main.scss';
// Import application configuration
import appConfig from '../config/app.config.js';
// Import version utilities
import { initVersionCheck } from './utils/version-helper';

// Function to dynamically get package versions at runtime
async function getPackageVersions() {
  const versions = {};

  // Helper function to safely fetch a package version
  async function getVersion(packageName) {
    try {
      // Try to dynamically import the package to get its version
      try {
        const module = await import(/* @vite-ignore */ packageName);
        if (module.version) {
          return module.version;
        }
      } catch (importErr) {
        console.debug(`Could not import ${packageName} directly: `, importErr);
      }

      // If direct import fails, try to fetch from package.json
      try {
        // This works in development environments where node_modules is accessible
        const response = await fetch(`/node_modules/${packageName}/package.json`);
        if (response.ok) {
          const packageInfo = await response.json();
          return packageInfo.version;
        }
      } catch (fetchErr) {
        console.debug(`Could not fetch package.json for ${packageName}: `, fetchErr);
      }

      // If all else fails, try to get from window.__KALXJS_VERSIONS__ if available
      if (window.__KALXJS_VERSIONS__ && window.__KALXJS_VERSIONS__[packageName]) {
        return window.__KALXJS_VERSIONS__[packageName];
      }

      // Last resort: use a fallback version based on the package
      const fallbacks = {
        '@kalxjs/core': '2.2.22',
        '@kalxjs/router': '2.0.32',
        '@kalxjs/state': '1.2.59',
        '@kalxjs/utils': '1.0.8',
        '@kalxjs/devtools': '1.2.32'
      };

      return fallbacks[packageName] || '1.0.0';
    } catch (err) {
      console.warn(`Error getting version for ${packageName}: `, err);
      return '1.0.0';
    }
  }

  // Get versions for all packages
  versions['@kalxjs/core'] = await getVersion('@kalxjs/core');
  versions['@kalxjs/router'] = await getVersion('@kalxjs/router');
  versions['@kalxjs/state'] = await getVersion('@kalxjs/state');
  versions['@kalxjs/utils'] = await getVersion('@kalxjs/utils');
  versions['@kalxjs/devtools'] = await getVersion('@kalxjs/devtools');

  return versions;
}

// Initialize with fallback versions first
let coreVersion = '2.2.22';
let routerVersion = '2.0.32';
let stateVersion = '1.2.59';
let utilsVersion = '1.0.8';
let devtoolsVersion = '1.2.32';

// Then update with actual versions when available
getPackageVersions().then(versions => {
  coreVersion = versions['@kalxjs/core'];
  routerVersion = versions['@kalxjs/router'];
  stateVersion = versions['@kalxjs/state'];
  utilsVersion = versions['@kalxjs/utils'];
  devtoolsVersion = versions['@kalxjs/devtools'];

  // Log the actual versions once they're loaded
  console.log('📦 Updated package versions:');
  console.log('  • Core:', coreVersion);
  console.log('  • Router:', routerVersion);
  console.log('  • State:', stateVersion);
  console.log('  • Utils:', utilsVersion);
  console.log('  • DevTools:', devtoolsVersion);

  // Version checking is now handled by initVersionCheck in the main application
});

// Global error handling function
function handleError(err, source = 'Application') {
  console.error(`[${source} Error]`, err);

  // Display error in UI if possible
  const appElement = document.getElementById('app');
  if (appElement) {
    // Keep the loading spinner if it exists
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }

    // Create error container if it doesn't exist
    let errorContainer = document.querySelector('.error-container');
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.className = 'error-container';
      appElement.appendChild(errorContainer);
    }

    errorContainer.innerHTML = `
      <h2>${source} Error</h2>
      <p>${err.message || 'An unknown error occurred'}</p>
      <button onclick="location.reload()">Reload Application</button>
    `;
  }

  // You could also send errors to a monitoring service here
}

// Set up global error handlers
window.addEventListener('error', (event) => {
  handleError(event.error || new Error(event.message), 'Unhandled');
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  handleError(event.reason || new Error('Promise rejection'), 'Unhandled Promise');
  event.preventDefault();
});

// Initialize application with error handling
try {
  // Check package versions compatibility
  console.log('🚀 KALXJS Framework - Starting application');
  console.log('📦 Package versions:');
  console.log('  • Core:', coreVersion);
  console.log('  • Router:', routerVersion);
  console.log('  • State:', stateVersion);
  console.log('  • Utils:', utilsVersion);
  console.log('  • DevTools:', devtoolsVersion);

  // Version compatibility check
  // Version compatibility check is now handled by the version-helper.js utility

  // Check package versions
  initVersionCheck().then(() => {
    console.log('✅ Version check complete');
  });

  const app = createApp(App, {
    debug: appConfig.env.development.debug,
    appName: appConfig.name,
    version: appConfig.version
  });

  // Expose app globally (TEST PHASE 1 FIX)
  window.app = app;

  // Register global error handler
  app.config.errorHandler = (err, instance, info) => {
    handleError(err, 'Component');
  };


  // Initialize router
  const router = createRouter();

  // Add error handling for router
  router.onError((err, to, from) => {
    console.error('Router Error:', err);
    console.log('Failed navigation from', from?.path || 'initial route', 'to', to.path);
    handleError(err, 'Router');
  });

  app.use(router);

  // Expose router globally for direct access
  window.router = router;

  // Attach router to app instance (ISSUE 3 FIX)
  app.router = router;

  // Expose useRouter composable globally (ISSUE 4 FIX)
  window.useRouter = useRouter;
  window.__KAL_ROUTER_INSTANCE__ = router;
  window.__KAL_APP__ = app;



  // Initialize store
  const store = createStore();
  app.use(store);



  // Register plugins
  try {
    registerPlugins(app);
  } catch (err) {
    console.warn('Plugin registration error:', err);
    // Continue without plugins
  }


  // Enable development tools in development mode
  if (appConfig.env.development.debug) {
    try {
      const { setupDevTools } = require('@kalxjs/devtools');
      setupDevTools(app, {
        logLifecycleEvents: true,
        performanceMonitoring: true
      });
    } catch (err) {
      console.warn('DevTools initialization error:', err);
      // Continue without devtools
    }
  }

  // Function to mount the app when the DOM is fully loaded
  function mountApp() {
    try {
      // Hide loading indicator
      const loadingElement = document.querySelector('.loading');
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }

      // Mount the app to the DOM
      app.mount('#app');
      console.log('🎉 KALXJS application successfully mounted');

      // Initialize router view if needed
      if (true && window.router) {
        const routerViewElement = document.getElementById('router-view');
        if (routerViewElement) {
          console.log('Router view container found');
          // Force initial navigation
          const currentPath = window.location.hash.slice(1) || '/';
          window.router.push(currentPath);
        }
      }
    } catch (err) {
      handleError(err, 'Mount');
    }
  }

  // Wait for the DOM and stylesheets to be fully loaded before mounting
  if (document.readyState === 'complete') {
    // If already loaded, mount immediately
    mountApp();
  } else {
    // Otherwise, wait for the load event
    window.addEventListener('load', mountApp);
  }

  // Add fallback rendering in case the main mounting fails
  setTimeout(() => {
    const appElement = document.getElementById('app');
    if (appElement &&
      (appElement.innerHTML.includes('<!--empty node-->') ||
        (appElement.innerHTML.trim() === '') ||
        (appElement.querySelector('.loading') && !appElement.querySelector('.loading').style.display === 'none'))) {
      console.log('Fallback rendering activated');

      // Hide loading indicator if it exists
      const loadingElement = document.querySelector('.loading');
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }

      // Create fallback UI
      const fallbackElement = document.createElement('div');
      fallbackElement.style.maxWidth = '800px';
      fallbackElement.style.margin = '0 auto';
      fallbackElement.style.padding = '2rem';
      fallbackElement.style.textAlign = 'center';

      fallbackElement.innerHTML = `
        <h1 style="color: #42b883;">Welcome to KalxJS</h1>
        <p>This is a simple counter example:</p>
        <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem;">
          <button id="decrement-btn" style="background-color: #42b883; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; font-size: 1.2rem; cursor: pointer;">-</button>
          <span id="counter-value" style="font-size: 2rem; font-weight: bold;">0</span>
          <button id="increment-btn" style="background-color: #42b883; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; font-size: 1.2rem; cursor: pointer;">+</button>
        </div>
        <p style="margin-top: 2rem; color: #666;">Note: The application is running in fallback mode. Some features may be limited.</p>
        <button id="reload-btn" style="margin-top: 1rem; background-color: #35495e; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; cursor: pointer;">Reload Application</button>
      `;

      appElement.appendChild(fallbackElement);

      // Add minimal interactivity
      const counterValue = document.getElementById('counter-value');
      const decrementBtn = document.getElementById('decrement-btn');
      const incrementBtn = document.getElementById('increment-btn');
      const reloadBtn = document.getElementById('reload-btn');

      let count = 0;

      decrementBtn.addEventListener('click', () => {
        count--;
        counterValue.textContent = count;
      });

      incrementBtn.addEventListener('click', () => {
        count++;
        counterValue.textContent = count;
      });

      reloadBtn.addEventListener('click', () => {
        location.reload();
      });
    }
  }, 2000);
} catch (err) {
  handleError(err, 'Initialization');
}
