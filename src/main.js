import { createApp, createElement, h } from '@kalxjs/core';
import App from './App.klx'; // Use .klx file
import './styles.css';
import './assets/dark-theme.css';

/**
 * Custom renderer function to directly render a vnode to the DOM
 * @param {Object} vnode - Virtual DOM node to render
 * @param {HTMLElement} container - Container element to render into
 */
function renderToDOM(vnode, container) {
  // Clear the container
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // Create a DOM element from the virtual node
  try {
    const element = createElement(vnode);
    if (element) {
      container.appendChild(element);
      console.log('Manual rendering successful');
    } else {
      throw new Error('createElement returned null or undefined');
    }
  } catch (error) {
    console.error('Error in manual rendering:', error);

    // Fallback to direct HTML if createElement fails
    container.innerHTML = `
      <div style="padding: 20px; border: 1px solid #d9534f; background-color: #f2dede; color: #a94442; border-radius: 4px; margin: 20px;">
        <h3>KalxJS Rendering Fallback</h3>
        <p>The application encountered an issue while rendering content.</p>
        <p>This is a fallback message to ensure you see something instead of a blank page.</p>
        <div style="margin-top: 15px; padding: 10px; background: #f8f8f8; border-radius: 4px;">
          <h4>Error Details:</h4>
          <pre style="overflow: auto; max-height: 200px;">${error.message}</pre>
        </div>
      </div>
    `;
  }
}

// Create the app instance
const app = createApp(App);

// Approach 1: Standard KalxJS mounting
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

// Approach 2: Force a manual render after a short delay
setTimeout(() => {
  const appElement = document.getElementById('app');
  if (appElement && (appElement.innerHTML.includes('<!--empty node-->') || appElement.innerHTML.trim() === '')) {
    console.log('Detected empty node, applying manual rendering');
    try {
      const vnode = app.render ? app.render() : App.render ? App.render() : null;
      if (vnode) {
        renderToDOM(vnode, appElement);
      } else {
        throw new Error('No render result available');
      }
    } catch (error) {
      console.error('Error in fallback rendering:', error);
    }
  }
}, 100);

// Approach 3: Create a simple component as a last resort
setTimeout(() => {
  const appElement = document.getElementById('app');
  if (appElement && (appElement.innerHTML.includes('<!--empty node-->') || appElement.innerHTML.trim() === '')) {
    console.log('Both standard and manual rendering failed, using emergency fallback');

    // Create a simple welcome component directly
    const welcomeVNode = h('div', { class: 'emergency-fallback' }, [
      h('h2', { style: 'color: #42b883;' }, ['Welcome to KalxJS']),
      h('p', {}, ['This is an emergency fallback rendering.']),
      h('p', {}, ['The application is running, but the main rendering pipeline encountered an issue.']),
      h('div', { style: 'margin-top: 20px;' }, [
        h('button', {
          style: 'padding: 8px 16px; background: #42b883; color: white; border: none; border-radius: 4px; cursor: pointer;',
          onClick: () => window.location.reload()
        }, ['Reload Application'])
      ])
    ]);

    try {
      renderToDOM(welcomeVNode, appElement);
    } catch (error) {
      console.error('Emergency fallback rendering failed:', error);

      // Last resort: direct HTML
      appElement.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h2 style="color: #42b883;">Welcome to KalxJS</h2>
          <p>This is a last-resort fallback rendering.</p>
          <p>The application is running, but all rendering methods encountered issues.</p>
          <button onclick="window.location.reload()" 
                  style="margin-top: 20px; padding: 8px 16px; background: #42b883; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Reload Application
          </button>
        </div>
      `;
    }
  }
}, 500);