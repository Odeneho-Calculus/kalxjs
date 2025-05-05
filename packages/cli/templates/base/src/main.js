import './polyfills';
import './styles.css';
import { createApp } from '@kalxjs/core';
import App from './App';

// Create the app instance
const app = createApp(App);

// More robust mounting strategy
function mountApp() {
    const rootElement = document.getElementById('app');

    if (!rootElement) {
        console.warn('Root element #app not found, creating it');
        const root = document.createElement('div');
        root.id = 'app';
        document.body.appendChild(root);
    }

    app.mount('#app');
}

// Handle mounting based on document state
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApp);
} else {
    mountApp();
}
