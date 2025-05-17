import { createApp } from '@kalxjs/core';
import App from './App.klx';
${config.features.router ? "import { createRouter } from './router';" : ''}
${config.features.state ? "import { createStore } from './store';" : ''}
${config.features.plugins ? "import { registerPlugins } from './plugins';" : ''}
${config.features.scss ? "// Import global styles\nimport './styles/main.scss';" : ''}

// Create the app instance
const app = createApp(App);

// Register global error handler
if (app.config) {
  app.config.errorHandler = (err, instance, info) => {
    console.error('Application Error:', err);
    console.log('Error occurred in component:', instance);
    console.log('Error info:', info);
    
    // You could also send errors to a monitoring service here
  };
} else {
  // Fallback error handling if app.config is not available
  app._errorHandler = (err, instance, info) => {
    console.error('Application Error:', err);
    console.log('Error occurred in component:', instance);
    console.log('Error info:', info);
  };
  
  // Create config object if it doesn't exist
  app.config = {
    errorHandler: app._errorHandler
  };
}

// Also catch unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled Error:', event.error);
});

${config.features.router ? `
// Initialize router
const router = createRouter();
if (typeof app.use === 'function') {
  app.use(router);
} else {
  // Fallback if app.use is not available
  console.log('Router plugin initialized, but app.use is not available');
  app._router = router;
}

// Expose router globally for direct access
window.router = router;
` : ''}

${config.features.state ? `
// Initialize store
const store = createStore();
if (typeof app.use === 'function') {
  app.use(store);
} else {
  // Fallback if app.use is not available
  console.log('Store plugin initialized, but app.use is not available');
  app._store = store;
  
  // Make store available globally for components
  window.$store = store;
}
` : ''}

${config.features.plugins ? `
// Register plugins
try {
  registerPlugins(app);
} catch (error) {
  console.warn('Failed to register plugins:', error.message);
}
` : ''}

// Function to mount the app when the DOM is fully loaded
function mountApp() {
  // Mount the app to the DOM
  app.mount('#app');
}

// Wait for the DOM and stylesheets to be fully loaded before mounting
if (document.readyState === 'complete') {
  // If already loaded, mount immediately
  mountApp();
} else {
  // Otherwise, wait for the load event
  window.addEventListener('load', mountApp);
}

console.log('KalxJS application successfully mounted');

// Add fallback rendering in case the main mounting fails
setTimeout(() => {
  const appElement = document.getElementById('app');
  if (appElement && (appElement.innerHTML.includes('<!--empty node-->') || appElement.innerHTML.trim() === '')) {
    console.log('Fallback rendering activated');
    appElement.innerHTML = \`
      <div style="max-width: 800px; margin: 0 auto; padding: 2rem; text-align: center;">
        <h1 style="color: #42b883;">Welcome to KalxJS</h1>
        <p>This is a simple counter example:</p>
        <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem;">
          <button id="decrement-btn" style="background-color: #42b883; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; font-size: 1.2rem; cursor: pointer;">-</button>
          <span id="counter-value" style="font-size: 2rem; font-weight: bold;">0</span>
          <button id="increment-btn" style="background-color: #42b883; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; font-size: 1.2rem; cursor: pointer;">+</button>
        </div>
      </div>
    \`;
    
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
