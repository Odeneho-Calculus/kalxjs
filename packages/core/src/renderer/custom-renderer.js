// packages/core/src/renderer/custom-renderer.js

/**
 * Custom Renderer for KalxJS
 * 
 * This renderer provides a template-based rendering system that bypasses
 * the virtual DOM implementation while still leveraging KalxJS's state
 * management and routing capabilities.
 */

/**
 * Creates a new custom renderer instance
 * @param {Object} router - KalxJS router instance
 * @param {Object} store - KalxJS store instance
 * @returns {Object} Custom renderer instance
 */
export function createCustomRenderer(router, store) {
  return new CustomRenderer(router, store);
}

/**
 * Custom Renderer class to manage the rendering lifecycle
 */
class CustomRenderer {
  /**
   * Creates a new CustomRenderer instance
   * @param {Object} router - KalxJS router instance
   * @param {Object} store - KalxJS store instance
   */
  constructor(router, store) {
    this.router = router;
    this.store = store;
    this.routerView = null;
    this.currentRoute = null;
    this.templates = new Map();
    this.componentInstances = new Map();
    this.eventListeners = new Map();
  }

  /**
   * Initializes the renderer
   * @param {string|HTMLElement} routerViewSelector - Selector or element for the router view
   */
  init(routerViewSelector) {
    // Get router view element
    this.routerView = typeof routerViewSelector === 'string'
      ? document.querySelector(routerViewSelector)
      : routerViewSelector;

    if (!this.routerView) {
      console.error(`Router view element "${routerViewSelector}" not found`);
      return;
    }

    // Set up router listeners if router is available
    if (this.router) {
      this.setupRouterListeners();

      // Set up navigation
      this.setupNavigation();
    } else {
      console.warn('Router not provided to custom renderer, using default welcome page');
    }

    // Initial render
    this.renderCurrentRoute();

    console.log('Custom renderer initialized');
  }

  /**
   * Sets up router event listeners
   */
  setupRouterListeners() {
    if (!this.router) {
      console.warn('Router not provided to custom renderer');
      return;
    }

    // Listen for route changes
    if (typeof this.router.onChange === 'function') {
      this.router.onChange((route) => {
        console.log('Route changed:', route);
        this.currentRoute = route;
        this.renderCurrentRoute();
        this.updateNavigation();
      });
    } else if (typeof this.router.beforeEach === 'function' && typeof this.router.afterEach === 'function') {
      // Alternative router API
      this.router.beforeEach((to, from, next) => {
        console.log('Route changing from', from, 'to', to);
        next();
      });

      this.router.afterEach((to, from) => {
        console.log('Route changed to:', to);
        this.currentRoute = to;
        this.renderCurrentRoute();
        this.updateNavigation();
      });
    }

    // Try to get the initial route
    if (!this.currentRoute) {
      if (this.router.currentRoute) {
        this.currentRoute = this.router.currentRoute;
      } else if (typeof this.router.getRoute === 'function') {
        this.currentRoute = this.router.getRoute();
      }
    }
  }

  /**
   * Sets up navigation elements
   */
  setupNavigation() {
    // Find all navigation links
    const navLinks = document.querySelectorAll('[data-route]');

    navLinks.forEach(link => {
      const route = link.getAttribute('data-route');

      // Remove existing click listener if any
      const existingListener = this.eventListeners.get(link);
      if (existingListener) {
        link.removeEventListener('click', existingListener);
      }

      // Add click listener
      const clickHandler = (e) => {
        e.preventDefault();
        if (this.router) {
          this.router.push(route);
        }
      };

      link.addEventListener('click', clickHandler);
      this.eventListeners.set(link, clickHandler);
    });
  }

  /**
   * Updates navigation elements based on current route
   */
  updateNavigation() {
    if (!this.currentRoute) return;

    const navLinks = document.querySelectorAll('[data-route]');

    navLinks.forEach(link => {
      const route = link.getAttribute('data-route');

      if (route === this.currentRoute.path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Renders the current route
   */
  renderCurrentRoute() {
    if (!this.routerView) return;

    // Clear current content
    this.routerView.innerHTML = '';

    // If no router or current route, render the default welcome component
    if (!this.currentRoute) {
      console.log('No current route, rendering default welcome component');
      this.renderNamedComponent('welcome');
      return;
    }

    const path = this.currentRoute.path;
    const component = this.currentRoute.component;

    console.log(`Rendering route: ${path}, component: ${component}`);

    // Render the component
    if (typeof component === 'string') {
      // Component is a string identifier
      this.renderNamedComponent(component);
    } else if (typeof component === 'function') {
      // Component is a function
      this.renderFunctionComponent(component);
    } else if (component && typeof component === 'object') {
      // Component is an object
      this.renderObjectComponent(component);
    } else {
      console.warn(`Unknown component type for route ${path}:`, component);
      this.renderNotFound();
    }
  }

  /**
   * Renders a component by name
   * @param {string} name - Component name
   */
  renderNamedComponent(name) {
    const templateId = `${name}-template`;
    const template = document.getElementById(templateId);

    if (!template) {
      console.warn(`Template not found for component: ${name}`);

      // Try to load the template from a file
      this.loadTemplateFromFile(name)
        .then(content => {
          // Set up component
          this.setupComponent(name, content);

          // Append to router view
          this.routerView.appendChild(content);
        })
        .catch(error => {
          console.error(`Failed to load template for ${name}:`, error);

          // If this is the welcome component, use a default template
          if (name === 'welcome') {
            this.renderDefaultWelcome();
          } else if (name === 'counter') {
            this.renderDefaultCounter();
          } else {
            this.renderNotFound();
          }
        });

      return;
    }

    // Clone the template content
    const content = template.content.cloneNode(true);

    // Set up component
    this.setupComponent(name, content);

    // Append to router view
    this.routerView.appendChild(content);
  }

  /**
   * Loads a template from a file
   * @param {string} name - Template name
   * @returns {Promise<DocumentFragment>} Template content
   */
  async loadTemplateFromFile(name) {
    try {
      // Try to load the template from the templates directory
      const response = await fetch(`/src/templates/${name}.html`);

      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();

      // Create a template element
      const template = document.createElement('template');
      template.innerHTML = html.trim();

      // Store the template for future use
      this.templates.set(name, template);

      // Return a clone of the content
      return template.content.cloneNode(true);
    } catch (error) {
      console.error(`Error loading template ${name}:`, error);
      throw error;
    }
  }

  /**
   * Renders a function component
   * @param {Function} component - Component function
   */
  renderFunctionComponent(component) {
    try {
      // Create a container for the component
      const container = document.createElement('div');
      container.className = 'component-container';

      // Create component instance
      const instance = component();

      // Store the instance
      const id = `func-${Date.now()}`;
      this.componentInstances.set(id, instance);

      // Set up the component
      if (instance.$mount) {
        // If it's a KalxJS component, mount it to the container
        instance.$mount(container);
      } else {
        // Otherwise, render it directly
        container.innerHTML = instance;
      }

      // Append to router view
      this.routerView.appendChild(container);
    } catch (error) {
      console.error('Error rendering function component:', error);
      this.renderError(error);
    }
  }

  /**
   * Renders an object component
   * @param {Object} component - Component object
   */
  renderObjectComponent(component) {
    try {
      // Create a container for the component
      const container = document.createElement('div');
      container.className = 'component-container';

      // Store the component
      const id = `obj-${Date.now()}`;
      this.componentInstances.set(id, component);

      // Set up the component
      if (component.render) {
        const result = component.render();
        if (typeof result === 'string') {
          container.innerHTML = result;
        } else {
          // Assume it's a DOM node
          container.appendChild(result);
        }
      } else if (component.template) {
        container.innerHTML = component.template;
      } else {
        console.warn('Component has no render method or template');
        container.innerHTML = '<div>Component Error: No render method or template</div>';
      }

      // Append to router view
      this.routerView.appendChild(container);
    } catch (error) {
      console.error('Error rendering object component:', error);
      this.renderError(error);
    }
  }

  /**
   * Sets up a component
   * @param {string} name - Component name
   * @param {DocumentFragment} content - Component content
   */
  setupComponent(name, content) {
    // Set up based on component type
    switch (name) {
      case 'home':
        this.setupHomeComponent(content);
        break;
      case 'welcome':
        this.setupWelcomeComponent(content);
        break;
      case 'counter':
        this.setupCounterComponent(content);
        break;
      case 'todos':
        this.setupTodosComponent(content);
        break;
      case 'about':
        this.setupAboutComponent(content);
        break;
      default:
        console.log(`No specific setup for component: ${name}`);
    }
  }

  /**
   * Sets up the home component
   * @param {DocumentFragment} content - Component content
   */
  setupHomeComponent(content) {
    // Example: Set up welcome message
    const welcomeEl = content.querySelector('.welcome-message');
    if (welcomeEl && this.store && this.store.state && this.store.state.user) {
      welcomeEl.textContent = `Welcome, ${this.store.state.user.name || 'Guest'}!`;
    }
  }

  /**
   * Sets up the welcome component
   * @param {DocumentFragment} content - Component content
   */
  setupWelcomeComponent(content) {
    if (!this.store) {
      console.warn('Store not available for welcome component');
      return;
    }

    // Set up user name if available
    const userNameEl = content.querySelector('.user-name');
    if (userNameEl && this.store.state.user) {
      userNameEl.textContent = this.store.state.user.name || 'Developer';
    }

    // Set up counter in the welcome page
    const counterValue = content.querySelector('#counter-value');
    const doubleCount = content.querySelector('#double-count');

    if (counterValue) {
      counterValue.textContent = this.store.state.count || 0;
    }

    if (doubleCount) {
      // Handle both function and value getters
      const doubled = typeof this.store.getters?.doubleCount === 'function'
        ? this.store.getters.doubleCount()
        : this.store.getters?.doubleCount;

      doubleCount.textContent = doubled !== undefined ? doubled : ((this.store.state.count || 0) * 2);
    }

    // Set up event listeners
    const incrementBtn = content.querySelector('#increment-button');
    if (incrementBtn) {
      const listener = () => {
        this.store.commit('increment');
        this.updateWelcomeCounter();
      };

      incrementBtn.addEventListener('click', listener);
      this.eventListeners.set(incrementBtn, listener);
    }

    const decrementBtn = content.querySelector('#decrement-button');
    if (decrementBtn) {
      const listener = () => {
        this.store.commit('decrement');
        this.updateWelcomeCounter();
      };

      decrementBtn.addEventListener('click', listener);
      this.eventListeners.set(decrementBtn, listener);
    }

    // Set up store subscription
    if (this.store.watch) {
      this.store.watch(state => state.count, () => {
        this.updateWelcomeCounter();
      });
    } else if (this.store.subscribe) {
      // Alternative subscription method
      const unsubscribe = this.store.subscribe(() => {
        this.updateWelcomeCounter();
      });

      // Store the unsubscribe function
      this.eventListeners.set('welcome-store-subscription', unsubscribe);
    }
  }

  /**
   * Updates the welcome counter
   */
  updateWelcomeCounter() {
    const counterValue = document.querySelector('#counter-value');
    const doubleCount = document.querySelector('#double-count');

    if (counterValue) {
      counterValue.textContent = this.store.state.count;

      // Add animation class if available
      if (counterValue.classList.contains('counter-value')) {
        counterValue.classList.add('updated');
        setTimeout(() => {
          counterValue.classList.remove('updated');
        }, 300);
      }
    }

    if (doubleCount) {
      // Handle both function and value getters
      const doubled = typeof this.store.getters?.doubleCount === 'function'
        ? this.store.getters.doubleCount()
        : this.store.getters?.doubleCount;

      doubleCount.textContent = doubled !== undefined ? doubled : (this.store.state.count * 2);
    }
  }

  /**
   * Sets up the counter component
   * @param {DocumentFragment} content - Component content
   */
  setupCounterComponent(content) {
    if (!this.store) {
      console.warn('Store not available for counter component');
      return;
    }

    // Set up initial values
    const counterValue = content.querySelector('#counter-value');
    const doubleCount = content.querySelector('#double-count');

    if (counterValue) {
      counterValue.textContent = this.store.state.count || 0;
    }

    if (doubleCount) {
      // Handle both function and value getters
      const doubled = typeof this.store.getters?.doubleCount === 'function'
        ? this.store.getters.doubleCount()
        : this.store.getters?.doubleCount;

      doubleCount.textContent = doubled !== undefined ? doubled : ((this.store.state.count || 0) * 2);
    }

    // Set up event listeners
    const incrementBtn = content.querySelector('#increment-button');
    if (incrementBtn) {
      incrementBtn.addEventListener('click', () => {
        this.store.commit('increment');
        this.updateCounter();
      });
    }

    const decrementBtn = content.querySelector('#decrement-button');
    if (decrementBtn) {
      decrementBtn.addEventListener('click', () => {
        this.store.commit('decrement');
        this.updateCounter();
      });
    }

    // Set up store subscription
    if (this.store.watch) {
      this.store.watch(state => state.count, () => {
        this.updateCounter();
      });
    }
  }

  /**
   * Updates the counter component
   */
  updateCounter() {
    const counterValue = document.querySelector('#counter-value');
    const doubleCount = document.querySelector('#double-count');
    const isEven = document.querySelector('#is-even');

    if (counterValue) {
      counterValue.textContent = this.store.state.count;

      // Add animation class
      counterValue.classList.add('updated');

      // Remove animation class after animation completes
      setTimeout(() => {
        counterValue.classList.remove('updated');
      }, 300);
    }

    if (doubleCount) {
      // Handle both function and value getters
      const doubled = typeof this.store.getters?.doubleCount === 'function'
        ? this.store.getters.doubleCount()
        : this.store.getters?.doubleCount;

      doubleCount.textContent = doubled !== undefined ? doubled : (this.store.state.count * 2);
    }

    if (isEven) {
      isEven.textContent = this.store.state.count % 2 === 0 ? 'Yes' : 'No';
    }
  }

  /**
   * Sets up the todos component
   * @param {DocumentFragment} content - Component content
   */
  setupTodosComponent(content) {
    if (!this.store) {
      console.warn('Store not available for todos component');
      return;
    }

    // Render initial todos
    this.renderTodos();

    // Set up form submission
    const todoForm = content.querySelector('#todo-form');
    if (todoForm) {
      todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = todoForm.querySelector('input');
        if (input && input.value.trim()) {
          this.store.commit('addTodo', { text: input.value.trim() });
          input.value = '';
          this.renderTodos();
        }
      });
    }

    // Set up store subscription
    if (this.store.watch) {
      this.store.watch(state => state.todos, () => {
        this.renderTodos();
      });
    }
  }

  /**
   * Renders the todos list
   */
  renderTodos() {
    const todoList = document.querySelector('#todo-list');
    if (!todoList || !this.store || !this.store.state || !this.store.state.todos) return;

    // Clear current todos
    todoList.innerHTML = '';

    // Render todos
    this.store.state.todos.forEach(todo => {
      const li = document.createElement('li');
      li.className = todo.completed ? 'completed' : '';

      // Create checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = todo.completed;
      checkbox.addEventListener('change', () => {
        this.store.commit('toggleTodo', todo.id);
      });

      // Create text
      const span = document.createElement('span');
      span.textContent = todo.text;

      // Create delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
        this.store.commit('removeTodo', todo.id);
      });

      // Append elements
      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      todoList.appendChild(li);
    });

    // Update completed count
    const completedCount = document.querySelector('#completed-count');
    if (completedCount) {
      const completed = this.store.state.todos.filter(todo => todo.completed).length;
      completedCount.textContent = completed;
    }
  }

  /**
   * Sets up the about component
   * @param {DocumentFragment} content - Component content
   */
  setupAboutComponent(content) {
    // Example: Set up version info
    const versionEl = content.querySelector('.version-info');
    if (versionEl) {
      versionEl.textContent = `KalxJS v${this.getFrameworkVersion()}`;
    }
  }

  /**
   * Gets the framework version
   * @returns {string} Framework version
   */
  getFrameworkVersion() {
    // Try to get version from global object
    if (window.kalxjs && window.kalxjs.version) {
      return window.kalxjs.version;
    }

    return '2.0.0'; // Default version
  }

  /**
   * Renders a default welcome component
   */
  renderDefaultWelcome() {
    // Create a container
    const container = document.createElement('div');
    container.className = 'welcome-container';

    // Add content
    container.innerHTML = `
      <div class="welcome-header">
        <h1>Welcome to <span class="brand-name">KalxJS</span></h1>
      </div>
      
      <div class="welcome-content">
        <p class="welcome-message">
          Congratulations! You've successfully created a new KalxJS project.
        </p>
        
        <div class="feature-grid">
          <div class="feature-card">
            <h3>📝 Template-Based Rendering</h3>
            <p>Use HTML templates directly with no virtual DOM overhead</p>
          </div>
          
          <div class="feature-card">
            <h3>⚡ Reactive State</h3>
            <p>Powerful state management with automatic DOM updates</p>
          </div>
          
          <div class="feature-card">
            <h3>🧩 Component System</h3>
            <p>Create reusable components with clean APIs</p>
          </div>
          
          <div class="feature-card">
            <h3>🔄 Routing</h3>
            <p>Seamless navigation between different views</p>
          </div>
        </div>
        
        <div class="counter-demo">
          <h2>Try the Counter Demo</h2>
          <div class="counter-value" id="counter-value">0</div>
          <div class="counter-buttons">
            <button id="decrement-button" class="counter-button">-</button>
            <button id="increment-button" class="counter-button">+</button>
          </div>
          <div class="counter-info">
            Double value: <span id="double-count">0</span>
          </div>
        </div>
      </div>
      
      <style>
        .welcome-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: Arial, sans-serif;
        }
        
        .welcome-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .brand-name {
          color: #42b883;
          font-weight: bold;
        }
        
        .welcome-content {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .welcome-message {
          font-size: 1.2rem;
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .feature-card {
          background-color: white;
          padding: 1.5rem;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .feature-card h3 {
          color: #42b883;
          margin-top: 0;
        }
        
        .counter-demo {
          background-color: white;
          padding: 2rem;
          border-radius: 8px;
          text-align: center;
          margin-top: 2rem;
        }
        
        .counter-value {
          font-size: 4rem;
          font-weight: bold;
          color: #42b883;
          margin: 1rem 0;
        }
        
        .counter-buttons {
          margin: 1rem 0;
        }
        
        .counter-button {
          background-color: #42b883;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1.5rem;
          width: 50px;
          height: 50px;
          margin: 0 0.5rem;
          cursor: pointer;
        }
        
        .counter-info {
          margin-top: 1rem;
          color: #666;
        }
      </style>
    `;

    // Append to router view
    this.routerView.appendChild(container);

    // Set up the component
    this.setupWelcomeComponent(container);
  }

  /**
   * Renders a default counter component
   */
  renderDefaultCounter() {
    // Create a container
    const container = document.createElement('div');
    container.className = 'counter-page';

    // Add content
    container.innerHTML = `
      <h1>Counter Example</h1>
      
      <div class="counter-container">
        <div class="counter-display">
          <div class="counter-value" id="counter-value">0</div>
          <div class="counter-label">Current Count</div>
        </div>
        
        <div class="counter-controls">
          <button id="decrement-button" class="counter-button decrement">-</button>
          <button id="reset-button" class="counter-button reset">Reset</button>
          <button id="increment-button" class="counter-button increment">+</button>
        </div>
        
        <div class="counter-stats">
          <div class="stat-item">
            <div class="stat-label">Double Count:</div>
            <div class="stat-value" id="double-count">0</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-label">Is Even:</div>
            <div class="stat-value" id="is-even">Yes</div>
          </div>
        </div>
      </div>
      
      <div class="counter-actions">
        <a href="#/" class="nav-link">Back to Home</a>
      </div>
      
      <style>
        .counter-page {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
          font-family: Arial, sans-serif;
          text-align: center;
        }
        
        .counter-container {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .counter-display {
          margin-bottom: 2rem;
        }
        
        .counter-value {
          font-size: 6rem;
          font-weight: bold;
          color: #42b883;
        }
        
        .counter-label {
          color: #666;
          margin-top: 0.5rem;
        }
        
        .counter-controls {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .counter-button {
          width: 60px;
          height: 60px;
          font-size: 1.5rem;
          font-weight: bold;
          border: none;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .counter-button.increment {
          background-color: #42b883;
          color: white;
        }
        
        .counter-button.decrement {
          background-color: #e74c3c;
          color: white;
        }
        
        .counter-button.reset {
          background-color: #7f8c8d;
          color: white;
          font-size: 0.9rem;
        }
        
        .counter-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #eee;
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-label {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 0.5rem;
        }
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #35495e;
        }
        
        .counter-actions {
          margin-top: 2rem;
        }
        
        .nav-link {
          display: inline-block;
          padding: 0.5rem 1rem;
          background-color: #f8f8fa;
          color: #42b883;
          text-decoration: none;
          border-radius: 4px;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .counter-value.updated {
          animation: pulse 0.3s ease;
        }
      </style>
    `;

    // Append to router view
    this.routerView.appendChild(container);

    // Set up the component
    this.setupCounterComponent(container);
  }

  /**
   * Renders a not found page
   */
  renderNotFound() {
    const notFoundTemplate = document.getElementById('not-found-template');

    if (notFoundTemplate) {
      // Use the template if available
      const content = notFoundTemplate.content.cloneNode(true);
      this.routerView.appendChild(content);
    } else {
      // Create a default not found message
      const container = document.createElement('div');
      container.className = 'not-found';
      container.innerHTML = `
        <h2>Page Not Found</h2>
        <p>The page you are looking for does not exist.</p>
        <a href="#/" data-route="/">Go Home</a>
      `;

      this.routerView.appendChild(container);

      // Set up the home link
      const homeLink = container.querySelector('[data-route]');
      if (homeLink && this.router) {
        homeLink.addEventListener('click', (e) => {
          e.preventDefault();
          this.router.push('/');
        });
      }
    }
  }

  /**
   * Renders an error message
   * @param {Error} error - Error object
   */
  renderError(error) {
    const container = document.createElement('div');
    container.className = 'error-container';
    container.innerHTML = `
      <h2>Error</h2>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    `;

    this.routerView.appendChild(container);
  }

  /**
   * Cleans up the renderer
   */
  cleanup() {
    // Remove event listeners
    this.eventListeners.forEach((listener, element) => {
      if (typeof element === 'string') {
        // Handle special cases like store subscriptions
        if (element.includes('subscription') && typeof listener === 'function') {
          // Call the unsubscribe function
          listener();
        }
      } else if (element instanceof Element) {
        // DOM element event listener
        element.removeEventListener('click', listener);
      }
    });

    // Clear maps
    this.eventListeners.clear();
    this.componentInstances.clear();
    this.templates.clear();

    // Clear router view
    if (this.routerView) {
      this.routerView.innerHTML = '';
    }

    console.log('Renderer cleaned up');
  }
}