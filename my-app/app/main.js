import { createApp, version as coreVersion } from '@kalxjs/core';
import App from './core/App.js';
import { createRouter, version as routerVersion } from './navigation';
import { createStore, version as stateVersion } from './state';
import { registerPlugins } from './extensions';
// Import global styles
import './styles/main.scss';
// Import application configuration
import appConfig from '../config/app.config.js';
import { version as utilsVersion } from '@kalxjs/utils';
import { version as devtoolsVersion } from '@kalxjs/devtools';

// Check package versions compatibility
console.log('🚀 KALXJS Framework - Starting application');
console.log('📦 Package versions:');
console.log('  • Core:', coreVersion);
console.log('  • Router:', routerVersion);
console.log('  • State:', stateVersion);
console.log('  • Utils:', utilsVersion);
console.log('  • DevTools:', devtoolsVersion);

// Version compatibility check
const checkVersionCompatibility = () => {
  const versions = {
    core: coreVersion,
    router: routerVersion,
    state: stateVersion,
    utils: utilsVersion,
    devtools: devtoolsVersion
  };

  // Extract major versions
  const majorVersions = Object.entries(versions).map(([pkg, ver]) => {
    const major = parseInt(ver.split('.')[0]);
    return { package: pkg, major };
  });

  // Check if all major versions are the same
  const firstMajor = majorVersions[0].major;
  const compatible = majorVersions.every(v => v.major === firstMajor);

  if (!compatible) {
    console.warn('⚠️ Warning: Package version mismatch detected. This may cause compatibility issues.');
    console.warn('   Consider updating all packages to compatible versions.');
  } else {
    console.log('✅ All package versions are compatible');
  }

  return compatible;
};

// Run compatibility check
checkVersionCompatibility();

// Create the app instance with configuration
const app = createApp(App, {
  debug: appConfig.env.development.debug,
  appName: appConfig.name,
  version: appConfig.version
});

// Register global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Application Error:', err);
  console.log('Error occurred in component:', instance);
  console.log('Error info:', info);

  // You could also send errors to a monitoring service here
};

// Also catch unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled Error:', event.error);
});


// Initialize router
const router = createRouter();
app.use(router);

// Expose router globally for direct access
window.router = router;



// Initialize store
const store = createStore();
app.use(store);



// Register plugins
registerPlugins(app);


// Enable development tools in development mode
if (appConfig.env.development.debug) {
  const { setupDevTools } = require('@kalxjs/devtools');
  setupDevTools(app, {
    logLifecycleEvents: true,
    performanceMonitoring: true
  });
}

// Function to mount the app when the DOM is fully loaded
function mountApp() {
  // Mount the app to the DOM
  app.mount('#app');
  console.log('🎉 KALXJS application successfully mounted');
}

// Wait for the DOM and stylesheets to be fully loaded before mounting
if (document.readyState === 'complete') {
  // If already loaded, mount immediately
  mountApp();
} else {
  // Otherwise, wait for the load event
  window.addEventListener('load', mountApp);
}

// Application is now running

// Add fallback rendering in case the main mounting fails
setTimeout(() => {
  const appElement = document.getElementById('app');
  if (appElement && (appElement.innerHTML.includes('<!--empty node-->') || appElement.innerHTML.trim() === '')) {
    console.log('Fallback rendering activated');
    appElement.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding: 2rem; text-align: center;">
        <h1 style="color: #42b883;">Welcome to KalxJS</h1>
        <p>This is a simple counter example:</p>
        <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem;">
          <button id="decrement-btn" style="background-color: #42b883; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; font-size: 1.2rem; cursor: pointer;">-</button>
          <span id="counter-value" style="font-size: 2rem; font-weight: bold;">0</span>
          <button id="increment-btn" style="background-color: #42b883; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; font-size: 1.2rem; cursor: pointer;">+</button>
        </div>
      </div>
    `;

    // Add minimal interactivity
    const counterValue = document.getElementById('counter-value');
    const decrementBtn = document.getElementById('decrement-btn');
    const incrementBtn = document.getElementById('increment-btn');

    let count = 0;

    decrementBtn.addEventListener('click', () => {
      count--;
      counterValue.textContent = count;
    });

    incrementBtn.addEventListener('click', () => {
      count++;
      counterValue.textContent = count;
    });
  }
}, 1000);