// Custom renderer initialization and setup

/**
 * Sets up the counter component
 * @param {DocumentFragment} content - Component content
 * @param {Object} store - Store instance
 */
export function setupCounterComponent(content, store) {
  if (!store) return;

  // Get elements
  const counterValue = content.querySelector('#counter-value');
  const doubleCount = content.querySelector('#double-count');
  const isEven = content.querySelector('#is-even');

  // Set up initial values
  if (counterValue) {
    counterValue.textContent = store.state.count;
  }

  if (doubleCount && store.getters && store.getters.doubleCount) {
    doubleCount.textContent = store.getters.doubleCount;
  }

  if (isEven) {
    isEven.textContent = store.state.count % 2 === 0 ? 'Yes' : 'No';
  }

  // Set up event listeners
  const incrementBtn = content.querySelector('#increment-button');
  if (incrementBtn) {
    incrementBtn.addEventListener('click', () => {
      store.commit('increment');
      updateCounter(store);
    });
  }

  const decrementBtn = content.querySelector('#decrement-button');
  if (decrementBtn) {
    decrementBtn.addEventListener('click', () => {
      store.commit('decrement');
      updateCounter(store);
    });
  }

  const resetBtn = content.querySelector('#reset-button');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      store.commit('setCount', 0);
      updateCounter(store);
    });
  }
}

/**
 * Updates the counter display
 * @param {Object} store - Store instance
 */
export function updateCounter(store) {
  // Get elements
  const counterValue = document.querySelector('#counter-value');
  const doubleCount = document.querySelector('#double-count');
  const isEven = document.querySelector('#is-even');

  // Update values
  if (counterValue) {
    counterValue.textContent = store.state.count;

    // Add animation class
    counterValue.classList.add('updated');

    // Remove animation class after animation completes
    setTimeout(() => {
      counterValue.classList.remove('updated');
    }, 300);
  }

  if (doubleCount && store.getters && store.getters.doubleCount) {
    doubleCount.textContent = store.getters.doubleCount;
  }

  if (isEven) {
    isEven.textContent = store.state.count % 2 === 0 ? 'Yes' : 'No';
  }
}

/**
 * Sets up the welcome component
 * @param {DocumentFragment} content - Component content
 * @param {Object} store - Store instance
 */
export function setupWelcomeComponent(content, store) {
  if (!store) return;

  // Set up counter in the welcome page
  const counterValue = content.querySelector('#counter-value');
  const doubleCount = content.querySelector('#double-count');

  // Set up initial values
  if (counterValue) {
    counterValue.textContent = store.state.count;
  }

  if (doubleCount && store.getters && store.getters.doubleCount) {
    doubleCount.textContent = store.getters.doubleCount;
  }

  // Set up event listeners
  const incrementBtn = content.querySelector('#increment-button');
  if (incrementBtn) {
    incrementBtn.addEventListener('click', () => {
      store.commit('increment');
      updateWelcomeCounter(store);
    });
  }

  const decrementBtn = content.querySelector('#decrement-button');
  if (decrementBtn) {
    decrementBtn.addEventListener('click', () => {
      store.commit('decrement');
      updateWelcomeCounter(store);
    });
  }
}

/**
 * Updates the welcome page counter
 * @param {Object} store - Store instance
 */
export function updateWelcomeCounter(store) {
  // Get elements
  const counterValue = document.querySelector('#counter-value');
  const doubleCount = document.querySelector('#double-count');

  // Update values
  if (counterValue) {
    counterValue.textContent = store.state.count;
  }

  if (doubleCount && store.getters && store.getters.doubleCount) {
    doubleCount.textContent = store.getters.doubleCount;
  }
}

/**
 * Extends the custom renderer with additional component setup
 * @param {Object} renderer - Custom renderer instance
 * @param {Object} store - Store instance
 */
export function extendRenderer(renderer, store) {
  // Store the original setupComponent method
  const originalSetupComponent = renderer.setupComponent;

  // Override the setupComponent method
  renderer.setupComponent = function(name, content) {
    // Call the original method first
    if (originalSetupComponent) {
      originalSetupComponent.call(this, name, content);
    }

    // Add custom component setup
    switch (name) {
      case 'welcome':
        setupWelcomeComponent(content, store);
        break;
      case 'counter':
        setupCounterComponent(content, store);
        break;
    }
  };

  return renderer;
}

/**
 * Initialize the custom renderer
 * @param {Object} router - Router instance
 * @param {Object} store - Store instance
 * @param {string} selector - Container selector
 * @returns {Promise<Object>} Extended renderer instance
 */
export function initRenderer(router, store, selector = '#app') {
  // Import the custom renderer dynamically
  return import('@kalxjs/core/renderer').then(({ createCustomRenderer }) => {
    // Create the custom renderer
    const renderer = createCustomRenderer(router, store);

    // Extend the renderer with custom functionality
    const extendedRenderer = extendRenderer(renderer, store);

    // Initialize the renderer with the container
    extendedRenderer.init(selector);

    return extendedRenderer;
  });
}