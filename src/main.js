import { createApp } from '@kalxjs/core';
import App from './App';
import './styles.css';

// Create the app instance
const app = createApp(App);

// Mount the app
const rootElement = document.getElementById('app');
if (rootElement) {
  app.mount('#app');
  console.log('Application successfully mounted');
} else {
  console.error('Root element #app not found');
  const root = document.createElement('div');
  root.id = 'app';
  document.body.appendChild(root);
  app.mount('#app');
  console.log('Created root element and mounted application');
}