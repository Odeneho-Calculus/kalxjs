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
        console.log('Route changed in custom renderer:', route);
        this.currentRoute = route;

        // Force a complete re-render of the route view
        if (this.routerView) {
          // Clear the router view first
          this.routerView.innerHTML = '';

          // Then render the new route component
          this.renderCurrentRoute();

          // Update navigation active states
          this.updateNavigation();

          console.log('Router view updated for path:', route.path);
        } else {
          console.warn('Router view element not found when trying to update route');
        }
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

        // Force a complete re-render
        if (this.routerView) {
          this.routerView.innerHTML = '';
          this.renderCurrentRoute();
          this.updateNavigation();
        }
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

    // Set up popstate event listener for history mode
    if (this.router.mode === 'history') {
      window.addEventListener('popstate', () => {
        console.log('Popstate event detected');
        this.router._onRouteChange();
      });
    }

    // Set up hashchange event listener for hash mode
    if (this.router.mode === 'hash') {
      window.addEventListener('hashchange', () => {
        console.log('Hashchange event detected');
        this.router._onRouteChange();
      });
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
    if (!this.routerView) {
      console.error('Router view element not found');
      return;
    }

    // Clear current content
    this.routerView.innerHTML = '';

    // If no router or current route, render the default welcome component
    if (!this.currentRoute) {
      console.log('No current route, rendering default welcome component');
      this.renderNamedComponent('welcome');
      return;
    }

    const path = this.currentRoute.path;

    // Get the matched component from the route
    const matchedRoute = this.currentRoute.matched && this.currentRoute.matched.length > 0
      ? this.currentRoute.matched[0]
      : null;

    if (!matchedRoute) {
      console.warn(`No matched route found for path: ${path}`);
      this.renderNotFound();
      return;
    }

    const component = matchedRoute.component;

    console.log(`Rendering route: ${path}, component:`, component);

    // Render the component based on its type
    if (typeof component === 'string') {
      // Component is a string identifier
      this.renderNamedComponent(component);
    } else if (typeof component === 'function') {
      // Component is a function (functional component)
      try {
        this.renderFunctionComponent(component);
      } catch (error) {
        console.error(`Error rendering function component for route ${path}:`, error);
        this.renderError(error);
      }
    } else if (component && typeof component === 'object') {
      // Component is an object (options API component)
      try {
        this.renderObjectComponent(component);
      } catch (error) {
        console.error(`Error rendering object component for route ${path}:`, error);
        this.renderError(error);
      }
    } else {
      console.warn(`Unknown component type for route ${path}:`, component);
      this.renderNotFound();
    }

    console.log(`Route ${path} rendered successfully`);
  }

  /**
   * Renders an error message
   * @param {Error} error - The error that occurred
   */
  renderError(error) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'kal-router-error';
    errorContainer.style.color = 'red';
    errorContainer.style.padding = '20px';
    errorContainer.style.border = '1px solid red';
    errorContainer.style.margin = '10px 0';

    const errorTitle = document.createElement('h3');
    errorTitle.textContent = 'Rendering Error';

    const errorMessage = document.createElement('p');
    errorMessage.textContent = error.message;

    const errorStack = document.createElement('pre');
    errorStack.textContent = error.stack;
    errorStack.style.fontSize = '12px';
    errorStack.style.overflow = 'auto';
    errorStack.style.maxHeight = '200px';
    errorStack.style.backgroundColor = '#f5f5f5';
    errorStack.style.padding = '10px';

    errorContainer.appendChild(errorTitle);
    errorContainer.appendChild(errorMessage);
    errorContainer.appendChild(errorStack);

    this.routerView.appendChild(errorContainer);
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
      // First try to load the .klx component
      try {
        const klxResponse = await fetch(`/src/components/${name}.klx`);

        if (klxResponse.ok) {
          const klxSource = await klxResponse.text();
          return this.processKlxComponent(klxSource, name);
        }
      } catch (klxError) {
        console.warn(`Could not load .klx component: ${klxError.message}`);
      }

      // If .klx fails, try to load from views directory
      try {
        const viewResponse = await fetch(`/src/views/${name}.klx`);

        if (viewResponse.ok) {
          const viewSource = await viewResponse.text();
          return this.processKlxComponent(viewSource, name);
        }
      } catch (viewError) {
        console.warn(`Could not load view component: ${viewError.message}`);
      }

      // If .klx fails, try to load the HTML template
      const htmlResponse = await fetch(`/src/templates/${name}.html`);

      if (!htmlResponse.ok) {
        throw new Error(`Failed to load template: ${htmlResponse.status} ${htmlResponse.statusText}`);
      }

      const html = await htmlResponse.text();

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
   * Parses a .klx file into its sections
   * @param {string} source - KLX component source
   * @param {string} name - Component name (optional)
   * @returns {Object} Parsed sections
   */
  parseKlx(source, name = '') {
    const result = {
      template: null,
      script: null,
      style: null,
      vueStyleComponent: false
    };

    // Find template section
    const templateMatch = /<template>([\s\S]*?)<\/template>/i.exec(source);
    if (templateMatch) {
      // Process template interpolation
      let template = templateMatch[1].trim();

      // Process v-for directives (simplified implementation)
      template = this.processVForDirectives(template);

      // Process template interpolation {{ expression }}
      template = template.replace(/{{(.*?)}}/g, (match, expression) => {
        return `<span data-bind="${expression.trim()}"></span>`;
      });

      result.template = template;
    } else {
      console.warn(`No <template> section found in .klx component${name ? ` ${name}` : ''}`);
    }

    // Find script section
    const scriptMatch = /<script>([\s\S]*?)<\/script>/i.exec(source);
    if (scriptMatch) {
      const scriptContent = scriptMatch[1].trim();

      // Options API
      if (scriptContent.includes('data()') ||
        scriptContent.includes('methods:') ||
        scriptContent.includes('computed:')) {
        result.vueStyleComponent = true;
        result.script = `{
        ${scriptContent
            .replace(/export\s+default\s+/, '')
            .replace(/defineComponent\(/, '')
            .replace(/\)\s*;?\s*$/, '')
          }
      }`;
      } else {
        // Regular script content
        result.script = scriptContent
          .replace(/export\s+default\s+/, '')
          .replace(/defineComponent\(/, '')
          .replace(/\)\s*;?\s*$/, '');
      }
    }

    // Find style section
    const styleMatch = /<style(\s+scoped)?>([\s\S]*?)<\/style>/i.exec(source);
    if (styleMatch) {
      const scoped = !!styleMatch[1];
      let styleContent = styleMatch[2].trim();

      // Handle scoped styles
      if (scoped && name) {
        const scopeId = `data-klx-${name}`;
        styleContent = styleContent.replace(/([^{]*){/g, (match, selector) => {
          return `${selector}[${scopeId}] {`;
        });
      }

      result.style = styleContent;
    }

    return result;
  }

  /**
   * Special processor for the welcome component
   * @param {string} source - KLX component source
   * @returns {DocumentFragment} Processed component content
   */
  processWelcomeComponent(source) {
    console.log('Using special welcome component processor');

    try {
      // Extract template
      const templateMatch = /<template>([\s\S]*?)<\/template>/i.exec(source);
      let templateContent = '';

      if (templateMatch) {
        templateContent = templateMatch[1].trim();
      } else {
        templateContent = `
          <div class="welcome-component">
            <h2>Welcome to KalxJS</h2>
            <p>This is a default welcome component.</p>
          </div>
        `;
      }

      // Extract style
      const styleMatch = /<style>([\s\S]*?)<\/style>/i.exec(source);
      if (styleMatch) {
        const styleContent = styleMatch[1].trim();
        const styleId = `style-welcome-${Date.now()}`;
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = styleContent;
        document.head.appendChild(styleElement);
      }

      // Extract script content
      const scriptMatch = /<script>([\s\S]*?)<\/script>/i.exec(source);
      let welcomeComponent;

      if (scriptMatch) {
        const scriptContent = scriptMatch[1].trim();

        // Options API
        if (scriptContent.includes('data()') && scriptContent.includes('methods')) {
          console.log('Detected Options API in welcome component');

          // Create a component that adapts the Options API to our setup function
          welcomeComponent = {
            name: 'WelcomeComponent',
            setup() {
              // Create reactive state
              const count = { value: 0 };
              const doubleCount = { value: 0 };
              const isEven = { value: 'Yes' };

              // Methods
              function increment() {
                count.value++;
                updateComputed();
                updateUI();
              }

              function decrement() {
                count.value--;
                updateComputed();
                updateUI();
              }

              function reset() {
                count.value = 0;
                updateComputed();
                updateUI();
              }

              // Update computed values
              function updateComputed() {
                doubleCount.value = count.value * 2;
                isEven.value = count.value % 2 === 0 ? 'Yes' : 'No';
              }

              // Update UI elements
              function updateUI() {
                const counterValue = document.getElementById('counter-value');
                const doubleCountEl = document.getElementById('double-count');
                const isEvenEl = document.getElementById('is-even');

                if (counterValue) counterValue.textContent = count.value;
                if (doubleCountEl) doubleCountEl.textContent = doubleCount.value;
                if (isEvenEl) isEvenEl.textContent = isEven.value;

                // Add animation class
                if (counterValue) {
                  counterValue.classList.add('updated');
                  setTimeout(() => {
                    counterValue.classList.remove('updated');
                  }, 300);
                }
              }

              // Setup event listeners when mounted
              setTimeout(() => {
                const incrementBtn = document.getElementById('increment-button');
                const decrementBtn = document.getElementById('decrement-button');
                const resetBtn = document.getElementById('reset-button');

                if (incrementBtn) incrementBtn.addEventListener('click', increment);
                if (decrementBtn) decrementBtn.addEventListener('click', decrement);
                if (resetBtn) resetBtn.addEventListener('click', reset);

                // Initial UI update
                updateUI();

                // Set up feature grid if needed
                const featureGrid = document.querySelector('.feature-grid');
                if (featureGrid) {
                  // We'll keep the existing feature grid from the template
                  console.log('Feature grid found in template');
                }
              }, 0);

              return {
                count: count.value,
                welcomeMessage: "Congratulations! You've successfully created a new KalxJS project with .klx components!",
                features: [
                  { icon: '📝', title: 'Template-Based Rendering', description: 'Use HTML templates directly with no virtual DOM overhead' },
                  { icon: '⚡', title: 'Reactive State', description: 'Powerful state management with automatic DOM updates' },
                  { icon: '🧩', title: 'Component System', description: 'Create reusable components with clean APIs' },
                  { icon: '🔄', title: 'Routing', description: 'Seamless navigation between different views' }
                ],
                doubleCount: doubleCount.value,
                isEven: isEven.value
              };
            }
          };
        } else {
          // Try to use the script as is
          try {
            // Look for export default
            const exportMatch = /export\s+default\s+(\{[\s\S]*\})/i.exec(scriptContent);
            if (exportMatch) {
              const componentDef = exportMatch[1];
              welcomeComponent = new Function('return ' + componentDef)();
              welcomeComponent.name = welcomeComponent.name || 'WelcomeComponent';
            } else {
              // Fallback to default component
              welcomeComponent = {
                name: 'WelcomeComponent',
                setup() {
                  return {
                    count: 0,
                    welcomeMessage: "Welcome to KalxJS!",
                    features: [
                      { icon: '📝', title: 'Template-Based Rendering', description: 'Use HTML templates directly' },
                      { icon: '⚡', title: 'Reactive State', description: 'Powerful state management' }
                    ]
                  };
                }
              };
            }
          } catch (scriptError) {
            console.warn('Error evaluating welcome component script:', scriptError);
            // Fallback to default component
            welcomeComponent = {
              name: 'WelcomeComponent',
              setup() {
                return {
                  count: 0,
                  welcomeMessage: "Welcome to KalxJS!",
                  features: [
                    { icon: '📝', title: 'Template-Based Rendering', description: 'Use HTML templates directly' },
                    { icon: '⚡', title: 'Reactive State', description: 'Powerful state management' }
                  ]
                };
              }
            };
          }
        }
      } else {
        // No script section, use default component
        welcomeComponent = {
          name: 'WelcomeComponent',
          setup() {
            return {
              count: 0,
              welcomeMessage: "Welcome to KalxJS!",
              features: [
                { icon: '📝', title: 'Template-Based Rendering', description: 'Use HTML templates directly' },
                { icon: '⚡', title: 'Reactive State', description: 'Powerful state management' }
              ]
            };
          }
        };
      }

      // Store the component
      this.componentInstances.set('welcome', welcomeComponent);

      // Create a template element
      const template = document.createElement('template');
      template.innerHTML = templateContent;

      // Store the template
      this.templates.set('welcome', template);

      // Return the template content
      return template.content.cloneNode(true);
    } catch (error) {
      console.error('Error processing welcome component:', error);

      // Create a fallback template
      const errorTemplate = document.createElement('template');
      errorTemplate.innerHTML = `
        <div class="welcome-error" style="color: red; padding: 20px; border: 1px solid red;">
          <h3>Error Processing Welcome Component</h3>
          <p>${error.message}</p>
        </div>
      `;

      return errorTemplate.content.cloneNode(true);
    }
  }

  /**
   * Parses a .klx file into its sections
   * @param {string} source - KLX component source
   * @param {string} name - Component name (optional)
   * @returns {Object} Parsed sections
   */
  parseKlx(source, name = '') {
    const result = {
      template: null,
      script: null,
      style: null
    };

    // Find template section
    const templateMatch = /<template>([\s\S]*?)<\/template>/i.exec(source);
    if (templateMatch) {
      // Process template interpolation
      let template = templateMatch[1].trim();

      // Process v-for directives (simplified implementation)
      template = this.processVForDirectives(template);

      // Process template interpolation {{ expression }}
      template = template.replace(/{{(.*?)}}/g, (match, expression) => {
        return `<span data-bind="${expression.trim()}"></span>`;
      });

      result.template = template;
    } else {
      console.warn(`No <template> section found in .klx component${name ? ` ${name}` : ''}`);
    }

    // Find script section
    const scriptMatch = /<script>([\s\S]*?)<\/script>/i.exec(source);
    if (scriptMatch) {
      // Extract the component definition
      const scriptContent = scriptMatch[1].trim();

      // Store the raw script content for later processing
      // This allows us to handle the script more flexibly in processKlxComponent
      result.rawScript = scriptContent;

      // Options API
      if (scriptContent.includes('data()') &&
        (scriptContent.includes('methods') || scriptContent.includes('computed'))) {
        console.log(`Detected Options API in ${name} component`);

        // simplified setup function
        result.script = `{
          name: '${name || 'VueStyleComponent'}',
          setup() {
            // This is a placeholder that will be replaced with actual component processing
            return {};
          }
        }`;

        // Store the original component for later processing
        result.vueStyleComponent = true;
      } else {
        // Try to extract the component definition
        try {
          // Look for defineComponent call
          if (scriptContent.includes('defineComponent')) {
            const defineComponentMatch = /defineComponent\s*\(\s*(\{[\s\S]*?\})\s*\)/i.exec(scriptContent);
            if (defineComponentMatch) {
              result.script = defineComponentMatch[1];
            } else {
              // If we can't extract the options directly, create a simple object
              result.script = `{
                name: '${name || 'DefaultComponent'}',
                setup() { return {}; }
              }`;
            }
          }
          // Special handling for welcome component
          else if (name === 'welcome' && scriptContent.includes('export default defineComponent')) {
            console.log('Processing welcome component with special handling');

            // For welcome.klx, create a hardcoded component definition that matches the expected structure
            result.script = `{
              name: 'WelcomeComponent',
              setup() {
                return {
                  count: 0,
                  welcomeMessage: 'Welcome to KalxJS!',
                  features: [
                    { icon: '📝', title: 'Template-Based Rendering', description: 'Use HTML templates directly' },
                    { icon: '⚡', title: 'Reactive State', description: 'Powerful state management' },
                    { icon: '🧩', title: 'Component System', description: 'Create reusable components' },
                    { icon: '🔄', title: 'Routing', description: 'Seamless navigation' }
                  ],
                  doubleCount: 0,
                  isEven: 'Yes'
                };
              }
            }`;
          }
          // Look for export default with defineComponent (for other components)
          else if (scriptContent.includes('export default defineComponent')) {
            const exportDefineMatch = /export\s+default\s+defineComponent\s*\(\s*(\{[\s\S]*?\})\s*\)/i.exec(scriptContent);
            if (exportDefineMatch) {
              result.script = exportDefineMatch[1];
            } else {
              result.script = `{
                name: '${name || 'DefaultComponent'}',
                setup() { return {}; }
              }`;
            }
          }
          // Look for export default with object literal
          else if (scriptContent.includes('export default {')) {
            const exportObjectMatch = /export\s+default\s+(\{[\s\S]*?\})/i.exec(scriptContent);
            if (exportObjectMatch) {
              result.script = exportObjectMatch[1];
            } else {
              result.script = `{
                name: '${name || 'DefaultComponent'}',
                setup() { return {}; }
              }`;
            }
          }
          // Look for export default with variable
          else if (scriptContent.includes('export default')) {
            const exportVarMatch = /export\s+default\s+(\w+)/i.exec(scriptContent);
            if (exportVarMatch) {
              const varName = exportVarMatch[1];
              const varDefMatch = new RegExp(`const\\s+${varName}\\s*=\\s*(\\{[\\s\\S]*?\\})`, 'i').exec(scriptContent);
              if (varDefMatch) {
                result.script = varDefMatch[1];
              } else {
                result.script = `{
                  name: '${name || 'DefaultComponent'}',
                  setup() { return {}; }
                }`;
              }
            } else {
              result.script = `{
                name: '${name || 'DefaultComponent'}',
                setup() { return {}; }
              }`;
            }
          }
          // Other component definition
          else {
            result.script = `{
              name: '${name || 'DefaultComponent'}',
              setup() { return {}; }
            }`;
          }
        } catch (error) {
          console.warn(`Error parsing script for ${name}:`, error.message);
          result.script = `{
            name: '${name || 'ErrorComponent'}',
            setup() { 
              return { error: '${error.message.replace(/'/g, "\\'")}' }; 
            }
          }`;
        }
      }
    } else {
      console.warn(`No <script> section found in .klx component${name ? ` ${name}` : ''}`);
      // Create a default script if none is found
      result.script = `{
        name: '${name || 'DefaultComponent'}',
        setup() { return {}; }
      }`;
    }

    // Find style section
    const styleMatch = /<style(\s+scoped)?>([\s\S]*?)<\/style>/i.exec(source);
    if (styleMatch) {
      const scoped = !!styleMatch[1];
      let styleContent = styleMatch[2].trim();

      // Handle scoped styles
      if (scoped && name) {
        const scopeId = `data-klx-${name}`;
        styleContent = styleContent.replace(/([^{]*){/g, (match, selector) => {
          return `${selector}[${scopeId}] {`;
        });
      }

      result.style = styleContent;
    }

    return result;
  }

  /**
   * Processes v-for directives in a template
   * @param {string} template - Template HTML
   * @returns {string} Processed template
   */
  processVForDirectives(template) {
    // This is a simplified implementation
    // In a real implementation, we would use a proper HTML parser

    // Match elements with v-for directive
    const vForRegex = /<([a-z0-9-]+)([^>]*?)v-for="([^"]*?)"([^>]*?)>([\s\S]*?)<\/\1>/gi;

    return template.replace(vForRegex, (match, tag, attrs1, vForExpr, attrs2, content) => {
      // Extract the v-for expression parts: "item in items"
      const [itemName, arrayName] = vForExpr.split(' in ').map(s => s.trim());

      // Replace with a data-for attribute for runtime processing
      return `<div data-for="${arrayName}" data-for-item="${itemName}" data-for-template="${encodeURIComponent(
        `<${tag}${attrs1}${attrs2}>${content}</${tag}>`
      )}"></div>`;
    });
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

      // Create component instance with route params as props
      const props = this.currentRoute ? {
        params: this.currentRoute.params || {},
        query: this.currentRoute.query || {},
        path: this.currentRoute.path || '/'
      } : {};

      console.log('Rendering function component with props:', props);

      // Call the component function with props
      const instance = component(props);

      // Store the instance
      const id = `func-${Date.now()}`;
      this.componentInstances.set(id, instance);

      // Handle different return types from the component function
      if (instance && typeof instance === 'object') {
        if (instance.$mount) {
          // If it's a KalxJS component instance with $mount method
          console.log('Mounting component instance with $mount');
          instance.$mount(container);
        } else if (instance.tag) {
          // If it's a virtual DOM node
          console.log('Rendering virtual DOM node:', instance);

          // Import the createElement function if not already available
          if (typeof createElement !== 'function') {
            // Use a simple implementation if the actual one is not available
            const createElement = (vnode) => {
              if (typeof vnode === 'string') {
                return document.createTextNode(vnode);
              }

              if (!vnode || !vnode.tag) {
                return document.createComment('empty or invalid node');
              }

              const el = document.createElement(vnode.tag);

              // Set attributes/props
              for (const [key, value] of Object.entries(vnode.props || {})) {
                if (key.startsWith('on') && typeof value === 'function') {
                  // Event handler
                  const eventName = key.slice(2).toLowerCase();
                  el.addEventListener(eventName, value);
                } else {
                  // Regular attribute
                  el.setAttribute(key, value);
                }
              }

              // Create children
              (vnode.children || []).forEach(child => {
                if (child != null) {
                  el.appendChild(createElement(child));
                }
              });

              return el;
            };

            // Create DOM element from virtual DOM
            const domElement = createElement(instance);
            container.appendChild(domElement);
          } else {
            // Use the imported createElement function
            const domElement = createElement(instance);
            container.appendChild(domElement);
          }
        } else if (instance.render && typeof instance.render === 'function') {
          // If it has a render method, call it and handle the result
          console.log('Component has render method, calling it');
          const renderResult = instance.render();

          if (typeof renderResult === 'string') {
            container.innerHTML = renderResult;
          } else if (renderResult && renderResult.tag) {
            // It's a virtual DOM node, render it
            const domElement = createElement(renderResult);
            container.appendChild(domElement);
          } else {
            console.warn('Render method returned invalid result:', renderResult);
            container.innerHTML = 'Invalid render result';
          }
        } else {
          // Unknown object type
          console.warn('Unknown component instance type:', instance);
          container.innerHTML = JSON.stringify(instance, null, 2);
        }
      } else if (typeof instance === 'string') {
        // If it's a string, render it directly
        container.innerHTML = instance;
      } else if (instance === null || instance === undefined) {
        // Handle null/undefined return
        console.warn('Component function returned null or undefined');
        container.innerHTML = '<div class="empty-component">Empty component</div>';
      } else {
        // Handle other return types
        console.warn('Unexpected component return type:', typeof instance);
        container.innerHTML = String(instance);
      }

      // Append to router view
      this.routerView.appendChild(container);

      console.log('Function component rendered successfully');
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

      // Get route params to pass as props
      const props = this.currentRoute ? {
        params: this.currentRoute.params || {},
        query: this.currentRoute.query || {},
        path: this.currentRoute.path || '/'
      } : {};

      console.log('Rendering object component with props:', props);

      // Check if it's a KalxJS component definition
      if (component.setup && typeof component.setup === 'function') {
        console.log('Component has setup method, creating instance');

        // Create a component instance using the component definition
        const instance = {
          ...component,
          props: props
        };

        // Call setup with props
        const setupResult = component.setup(props);

        // Handle setup result
        if (typeof setupResult === 'function') {
          // Setup returned a render function
          console.log('Setup returned a render function');
          const renderResult = setupResult();

          // Import createElement if needed
          if (typeof createElement !== 'function') {
            // Simple implementation
            const createElement = (vnode) => {
              if (typeof vnode === 'string') {
                return document.createTextNode(vnode);
              }

              if (!vnode || !vnode.tag) {
                return document.createComment('empty or invalid node');
              }

              const el = document.createElement(vnode.tag);

              // Set attributes/props
              for (const [key, value] of Object.entries(vnode.props || {})) {
                if (key.startsWith('on') && typeof value === 'function') {
                  // Event handler
                  const eventName = key.slice(2).toLowerCase();
                  el.addEventListener(eventName, value);
                } else {
                  // Regular attribute
                  el.setAttribute(key, value);
                }
              }

              // Create children
              (vnode.children || []).forEach(child => {
                if (child != null) {
                  el.appendChild(createElement(child));
                }
              });

              return el;
            };

            if (renderResult && renderResult.tag) {
              const domElement = createElement(renderResult);
              container.appendChild(domElement);
            } else {
              console.warn('Render function returned invalid result:', renderResult);
              container.innerHTML = 'Invalid render result';
            }
          } else {
            // Use imported createElement
            const domElement = createElement(renderResult);
            container.appendChild(domElement);
          }
        } else if (setupResult && typeof setupResult === 'object') {
          // Setup returned an object with state/methods
          console.log('Setup returned an object with state/methods');

          // Merge setup result with instance
          Object.assign(instance, setupResult);

          // If instance has a render method, use it
          if (instance.render && typeof instance.render === 'function') {
            const renderResult = instance.render();

            if (typeof renderResult === 'string') {
              container.innerHTML = renderResult;
            } else if (renderResult && renderResult.tag) {
              // It's a virtual DOM node
              const domElement = createElement(renderResult);
              container.appendChild(domElement);
            } else {
              console.warn('Render method returned invalid result:', renderResult);
              container.innerHTML = 'Invalid render result';
            }
          } else if (instance.template) {
            container.innerHTML = instance.template;
          } else {
            console.warn('Component instance has no render method or template');
            container.innerHTML = '<div>Component Error: No render method or template</div>';
          }
        } else {
          console.warn('Setup returned unexpected result:', setupResult);
          container.innerHTML = 'Invalid setup result';
        }
      } else if (component.render && typeof component.render === 'function') {
        // Component has a render method
        console.log('Component has render method');
        const result = component.render(props);

        if (typeof result === 'string') {
          container.innerHTML = result;
        } else if (result && result.tag) {
          // It's a virtual DOM node
          const domElement = createElement(result);
          container.appendChild(domElement);
        } else if (result instanceof Node) {
          // It's a DOM node
          container.appendChild(result);
        } else {
          console.warn('Render method returned unexpected result:', result);
          container.innerHTML = 'Invalid render result';
        }
      } else if (component.template) {
        // Component has a template
        console.log('Component has template');
        container.innerHTML = component.template;
      } else if (component.name) {
        // Component only has a name, try to render by name
        console.log('Component only has name, trying to render by name:', component.name);
        container.innerHTML = `<div class="${component.name}-component">${component.name} Component</div>`;
      } else {
        console.warn('Component has no render method, template, or name');
        container.innerHTML = '<div>Component Error: No render method or template</div>';
      }

      // Append to router view
      this.routerView.appendChild(container);

      console.log('Object component rendered successfully');
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
    // Check if we have a component instance for this name
    const componentInstance = this.componentInstances.get(name);

    if (componentInstance) {
      // Set up the component using its instance
      this.setupComponentInstance(componentInstance, content);
      return;
    }

    // Otherwise, set up based on component type
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
   * Sets up a component using its instance
   * @param {Object} component - Component instance
   * @param {DocumentFragment} content - Component content
   */
  setupComponentInstance(component, content) {
    // Initialize component data
    let data = {};
    if (component.data && typeof component.data === 'function') {
      data = component.data();

      // Store the data on the component
      component._data = data;
    }

    // Initialize computed properties
    let computed = {};
    if (component.computed) {
      for (const [key, fn] of Object.entries(component.computed)) {
        Object.defineProperty(component, key, {
          get: typeof fn === 'function' ? fn.bind(component) : () => fn,
          configurable: true
        });

        // Initialize computed value
        computed[key] = component[key];
      }
    }

    // Process v-for directives
    const forElements = content.querySelectorAll('[data-for]');
    forElements.forEach(element => {
      const arrayName = element.getAttribute('data-for');
      const itemName = element.getAttribute('data-for-item');
      const templateStr = decodeURIComponent(element.getAttribute('data-for-template'));

      // Get the array from data
      const array = this.getNestedValue(data, arrayName);

      if (Array.isArray(array)) {
        // Create a document fragment to hold the generated elements
        const fragment = document.createDocumentFragment();

        // Generate elements for each item in the array
        array.forEach((item, index) => {
          // Create a template element to parse the template string
          const template = document.createElement('template');
          template.innerHTML = templateStr;

          // Clone the template content
          const itemContent = template.content.cloneNode(true);

          // Replace item interpolation in the content
          this.processItemInterpolation(itemContent, itemName, item, index);

          // Add to the fragment
          fragment.appendChild(itemContent);
        });

        // Replace the v-for element with the generated elements
        element.parentNode.replaceChild(fragment, element);
      }
    });

    // Set up data bindings
    const bindingElements = content.querySelectorAll('[data-bind]');
    bindingElements.forEach(element => {
      const binding = element.getAttribute('data-bind');

      // Try to get the value from data, computed, or component methods
      let value;

      if (binding.includes('.')) {
        // Handle nested properties
        value = this.getNestedValue(data, binding);
      } else if (data[binding] !== undefined) {
        value = data[binding];
      } else if (component[binding] !== undefined) {
        value = component[binding];
      }

      if (value !== undefined) {
        element.textContent = value;
      }
    });

    // Set up event handlers
    if (component.methods) {
      for (const [methodName, method] of Object.entries(component.methods)) {
        // Find elements with this method as an event handler
        const eventElements = content.querySelectorAll(`[data-event-${methodName}]`);
        eventElements.forEach(element => {
          const eventType = element.getAttribute(`data-event-${methodName}`);
          const boundMethod = method.bind(component);

          element.addEventListener(eventType, boundMethod);
          this.eventListeners.set(element, boundMethod);
        });
      }
    }

    // Call mounted hook if available
    if (component.mounted && typeof component.mounted === 'function') {
      // Delay the mounted call to ensure the DOM is ready
      setTimeout(() => {
        component.mounted.call(component);
      }, 0);
    }
  }

  /**
   * Gets a nested value from an object using a dot-notation path
   * @param {Object} obj - Object to get value from
   * @param {string} path - Dot-notation path
   * @returns {*} Value at the path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((value, key) => {
      return value && value[key] !== undefined ? value[key] : undefined;
    }, obj);
  }

  /**
   * Processes item interpolation in v-for templates
   * @param {DocumentFragment} content - Content to process
   * @param {string} itemName - Name of the item variable
   * @param {*} item - Current item
   * @param {number} index - Current index
   */
  processItemInterpolation(content, itemName, item, index) {
    // Process text nodes
    const walker = document.createTreeWalker(
      content,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let currentNode;

    while ((currentNode = walker.nextNode())) {
      textNodes.push(currentNode);
    }

    textNodes.forEach(node => {
      // Replace {{ item.property }} with the actual value
      node.textContent = node.textContent.replace(
        new RegExp(`{{\\s*${itemName}\\.(.*?)\\s*}}`, 'g'),
        (match, property) => {
          return item[property] !== undefined ? item[property] : '';
        }
      );

      // Replace {{ index }} with the current index
      node.textContent = node.textContent.replace(
        /{{\\s*index\\s*}}/g,
        index
      );
    });

    // Process attributes
    const elements = content.querySelectorAll('*');
    elements.forEach(element => {
      Array.from(element.attributes).forEach(attr => {
        if (attr.value.includes(`{{${itemName}.`)) {
          // Replace {{ item.property }} with the actual value
          attr.value = attr.value.replace(
            new RegExp(`{{\\s*${itemName}\\.(.*?)\\s*}}`, 'g'),
            (match, property) => {
              return item[property] !== undefined ? item[property] : '';
            }
          );
        }
      });
    });
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