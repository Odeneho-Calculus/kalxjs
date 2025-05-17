import { createApp } from '@kalxjs/core';
import { createCustomRenderer } from '@kalxjs/core/renderer';
import App from './App.js';
import './styles/main.scss';
import './styles/welcome.scss';
import './styles/counter.scss';
import router from './router';
import store from './store';

// Import the renderer initialization function
import { initRenderer } from './renderer';

// Import template loader
import { loadAllTemplates } from './utils/template-loader';

// First load all templates, then initialize the renderer
loadAllTemplates().then(() => {
    // Initialize with custom renderer (default approach)
    if (router && store) {
        // Initialize the custom renderer with our extended functionality
        initRenderer(router, store, '#app').then(renderer => {
            // Make renderer available globally for debugging
            window.renderer = renderer;
            window.router = router;
            window.store = store;

            console.log('KalxJS initialized with custom renderer');
        }).catch(error => {
            console.error('Error initializing custom renderer:', error);
            fallbackToTraditionalRendering();
        });
    } else {
        // Fallback to traditional app mounting if router or store is missing
        fallbackToTraditionalRendering();
    }
}).catch(error => {
    console.error('Error loading templates:', error);
    fallbackToTraditionalRendering();
});

/**
 * Fallback to traditional app mounting
 */
function fallbackToTraditionalRendering() {
    console.log('Falling back to traditional app mounting');

    // Create the app instance
    const app = createApp(App);

    // Register available plugins
    if (router) {
        app.use(router);
    }

    if (store) {
        app.use(store);
    }

    // Enable custom renderer if available
    app.useCustomRenderer(true);

    // Mount the app
    app.mount('#app');
}

// Log welcome message
console.log('%c Welcome to KalxJS! ', 'background: #42b883; color: white; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
console.log('%c Using Custom Renderer v2.1.0 ', 'background: #35495e; color: white; font-size: 12px; padding: 2px 6px; border-radius: 4px;');