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

    // Set up router listeners
    this.setupRouterListeners();
    
    // Set up navigation
    this.setupNavigation();
    
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
    this.router.onChange((route) => {
      console.log('Route changed:', route);
      this.currentRoute = route;
      this.renderCurrentRoute();
      this.updateNavigation();
    });
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
    
    if (!this.currentRoute) {
      console.warn('No current route to render');
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
      this.renderNotFound();
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
    
    if (counterValue) {
      counterValue.textContent = this.store.state.count;
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
      element.removeEventListener('click', listener);
    });
    
    // Clear maps
    this.eventListeners.clear();
    this.componentInstances.clear();
    this.templates.clear();
    
    // Clear router view
    if (this.routerView) {
      this.routerView.innerHTML = '';
    }
  }
}