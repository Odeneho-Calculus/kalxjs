# KalxJS Custom Renderer Example

This example demonstrates the use of the KalxJS Custom Renderer, which provides a template-based rendering system that bypasses the virtual DOM implementation while still leveraging KalxJS's state management and routing capabilities.

## Overview

The Custom Renderer works by:

1. Using HTML templates directly from your project
2. Binding data from your store to the DOM
3. Setting up event listeners for user interactions
4. Updating the DOM when state changes

## Running the Example

1. Clone the KalxJS repository:
   ```bash
   git clone https://github.com/Odeneho-Calculus/kalxjs.git
   ```

2. Navigate to the example directory:
   ```bash
   cd kalxjs/examples/custom-renderer-example
   ```

3. Open the `index.html` file in your browser.

## Example Structure

- `index.html`: Main HTML file with templates
- `custom-app.js`: JavaScript file that initializes the custom renderer

## Key Features Demonstrated

- Template-based rendering
- Integration with router and store
- Direct DOM manipulation
- Event handling
- State updates

## How It Works

1. The example defines HTML templates in the `index.html` file:
   ```html
   <template id="counter-template">
     <div class="counter-container">
       <h2>Counter Example</h2>
       <div class="counter-value" id="counter-value">0</div>
       <div class="counter-info">
         Double: <span id="double-count">0</span>
       </div>
       <div>
         <button id="decrement-button">-</button>
         <button id="increment-button">+</button>
       </div>
     </div>
   </template>
   ```

2. The `custom-app.js` file initializes the store, router, and custom renderer:
   ```js
   // Create the store
   const store = createStore({
     state: {
       count: 0
     },
     mutations: {
       increment(state) {
         state.count++;
       },
       decrement(state) {
         state.count--;
       }
     }
   });

   // Create the router
   const router = createRouter({
     mode: 'hash',
     routes: [
       { path: '/', component: 'home' },
       { path: '/counter', component: 'counter' }
     ]
   });

   // Create and initialize the custom renderer
   const renderer = createCustomRenderer(router, store);
   renderer.init('#router-view');
   ```

3. The custom renderer handles:
   - Rendering the appropriate template based on the current route
   - Setting up event listeners for buttons
   - Updating the DOM when the state changes

## Learn More

For more information about the Custom Renderer, check out:

- [Custom Renderer Guide](../../docs/guides/custom-renderer.md)
- [Custom Renderer API Reference](../../docs/api/renderer.md)