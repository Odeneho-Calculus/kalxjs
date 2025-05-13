import { createApp } from '@kalxjs/core';
import App from './App.klx';
import router from './router';
import store from './store';
import './styles/main.scss';

// Application configuration
const appConfig = {
  name: 'test-app',
  version: '1.0.0',
  debug: import.meta.env.DEV,
  apiUrl: import.meta.env.VITE_API_URL || 'https://api.example.com'
};

try {
  // Create application instance
  const app = createApp(App);

  // Register plugins
  app.use(router);
  app.use(store);

  // Add global properties to the app context
  app.provide('appConfig', appConfig);

  // Performance monitoring
  if (appConfig.debug) {
    const startTime = performance.now();

    // Mount the application
    app.mount('#app');

    const endTime = performance.now();
    console.log(`Application mounted in ${(endTime - startTime).toFixed(2)}ms`);
  } else {
    // Production mount
    app.mount('#app');
  }

  console.log(`${appConfig.name} v${appConfig.version} initialized successfully`);

  // Make app globally accessible for debugging
  window.$app = app;
} catch (error) {
  console.error('Error initializing app:', error);

  // Fallback rendering in case of error
  document.getElementById('app').innerHTML = `
    <div class="app" style="padding: 2rem; text-align: center;">
      <h1>Welcome to KalxJS</h1>
      <p>There was an error initializing the application.</p>
      <pre style="text-align: left; background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow: auto;">${error.message}</pre>
      <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background-color: #4299e1; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Reload Application
      </button>
    </div>
  `;
}