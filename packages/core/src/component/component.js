import { h, createElement, updateElement } from '../vdom/vdom';
import { reactive, effect } from '../reactivity/reactive';
import { processSetup } from './setup';

/**
 * Helper function to create DOM elements from virtual DOM
 */
function createDOMElement(vnode) {
    // Handle primitive values (string, number, etc.)
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return document.createTextNode(vnode);
    }

    // Handle null or undefined
    if (!vnode) {
        return document.createComment('empty node');
    }

    // Handle case where vnode might not be a proper virtual node object
    if (!vnode.tag) {
        console.warn('Invalid vnode:', vnode);
        return document.createComment('invalid node');
    }

    const element = document.createElement(vnode.tag);

    // Set attributes
    for (const [key, value] of Object.entries(vnode.props || {})) {
        if (key.startsWith('on')) {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else {
            element.setAttribute(key, value);
        }
    }

    // Create and append children
    (vnode.children || []).forEach(child => {
        if (child !== null && child !== undefined) {
            element.appendChild(createDOMElement(child));
        }
    });

    return element;
}

function createComponent(options) {
    const instance = {};

    // Set options
    instance.$options = options;

    // Initialize props
    instance.props = options.props || {};

    // Call beforeCreate lifecycle hook
    if (options.beforeCreate) {
        options.beforeCreate.call(instance);
    }

    // Process setup function if it exists
    const setupResult = processSetup(instance, options);

    // Merge setup result with instance
    for (const key in setupResult) {
        instance[key] = setupResult[key];
    }

    // Initialize data
    if (options.data) {
        // Create data object
        instance.$data = options.data.call(instance);

        // Setup getters/setters for data properties
        for (const key in instance.$data) {
            // Skip if property already defined by setup
            if (key in setupResult) continue;

            Object.defineProperty(instance, key, {
                get() {
                    return instance.$data[key];
                },
                set(newValue) {
                    // Skip if value hasn't changed
                    if (instance.$data[key] === newValue) return;

                    // Store the new value
                    instance.$data[key] = newValue;

                    // Update component
                    if (instance.$el) {
                        // Call beforeUpdate hooks
                        if (options.beforeUpdate) {
                            options.beforeUpdate.call(instance);
                        }

                        // Call composition API beforeUpdate hooks
                        instance.beforeUpdate.forEach(hook => hook());

                        // Get new virtual DOM tree
                        const newVdom = instance.render();
                        const parentNode = instance.$el.parentNode;

                        // Update the DOM if parent exists
                        if (parentNode) {
                            // Update the contents of the element rather than replacing it
                            if (instance._vnode) {
                                // Use the updateElement function from vdom to properly update the DOM
                                updateElement(instance.$el, instance._vnode, newVdom);
                                instance._vnode = newVdom;
                            } else {
                                // First render, create and append the new DOM
                                const newElement = createDOMElement(newVdom);
                                instance.$el.appendChild(newElement);
                                instance._vnode = newVdom;
                            }
                        }

                        // Call updated hooks
                        if (options.updated) {
                            options.updated.call(instance);
                        }

                        // Call composition API updated hooks
                        instance.updated.forEach(hook => hook());
                    }
                }
            });
        }
    }

    // Initialize methods
    if (options.methods) {
        for (const key in options.methods) {
            // Skip if property already defined by setup
            if (key in setupResult) continue;

            instance[key] = options.methods[key].bind(instance);
        }
    }

    // Initialize computed properties
    if (options.computed) {
        for (const key in options.computed) {
            // Skip if property already defined by setup
            if (key in setupResult) continue;

            Object.defineProperty(instance, key, {
                get: options.computed[key].bind(instance)
            });
        }
    }

    // Store initial render result for future updates
    instance._vnode = null;

    // Add render method (if not already defined by setup)
    if (!instance.render) {
        instance.render = function () {
            return options.render ? options.render.call(instance) : null;
        };
    }

    // Mount method
    instance.$mount = function (el) {
        if (typeof el === 'string') {
            el = document.querySelector(el);
        }

        if (!el) {
            console.error('Invalid mounting element. Make sure the element exists in the DOM.');
            return this;
        }

        // Store reference to the mounting element
        this.$el = el;

        // Call lifecycle hook
        if (options.beforeMount) {
            options.beforeMount.call(instance);
        }

        // Call composition API beforeMount hooks
        if (instance.beforeMount && Array.isArray(instance.beforeMount)) {
            instance.beforeMount.forEach(hook => hook());
        }

        // Render the component
        const vnode = this.render();

        // Log the render process for debugging
        console.log('Component render called:', vnode);

        // Store the vnode for future updates
        this._vnode = vnode;

        // Clear the element before mounting
        el.innerHTML = '';

        // Create real DOM from virtual DOM and append to element
        if (vnode) {
            try {
                // Use createElement from vdom/vdom.js to ensure consistent behavior
                const dom = createElement(vnode);

                if (dom) {
                    el.appendChild(dom);
                    console.log('DOM element created and appended:', dom);
                } else {
                    throw new Error('Failed to create DOM element from vnode');
                }
            } catch (error) {
                console.error('Error during component mounting:', error);
                // Add a visible error message to help with debugging
                el.innerHTML = `
                    <div style="color: red; border: 1px solid red; padding: 10px; margin: 10px 0;">
                        <h3>Component Rendering Error</h3>
                        <p>${error.message}</p>
                        <pre>${error.stack}</pre>
                    </div>
                `;
            }
        } else {
            console.error('Component render returned null or undefined. Check your render function.');
            // Add a visible error message
            el.innerHTML = `
                <div style="color: red; border: 1px solid red; padding: 10px; margin: 10px 0;">
                    <h3>Component Rendering Error</h3>
                    <p>Render function returned null or undefined</p>
                </div>
            `;
        }

        // Call mounted hooks
        if (options.mounted) {
            options.mounted.call(instance);
        }

        // Call composition API mounted hooks
        if (instance.mounted && Array.isArray(instance.mounted)) {
            instance.mounted.forEach(hook => hook());
        }

        return this;
    };

    // Add update functionality
    instance.$update = function () {
        if (!this.$el) {
            console.warn('Cannot update: component not mounted');
            return;
        }

        // Call beforeUpdate lifecycle hooks
        if (options.beforeUpdate) {
            options.beforeUpdate.call(instance);
        }

        // Call composition API beforeUpdate hooks
        if (instance.beforeUpdate && Array.isArray(instance.beforeUpdate)) {
            instance.beforeUpdate.forEach(hook => hook());
        }

        // Re-render and update the DOM
        const newVdom = this.render();

        if (this.$el) {
            // Use the updateElement function from vdom to properly update the DOM
            if (this._vnode) {
                updateElement(this.$el, this._vnode, newVdom);
            } else {
                // First render, create and append the new DOM
                const newElement = createDOMElement(newVdom);
                this.$el.appendChild(newElement);
            }
            this._vnode = newVdom;
        }

        // Call updated lifecycle hooks
        if (options.updated) {
            options.updated.call(instance);
        }

        // Call composition API updated hooks
        if (instance.updated && Array.isArray(instance.updated)) {
            instance.updated.forEach(hook => hook());
        }
    };

    // Add unmount functionality
    instance.$unmount = function () {
        if (!this.$el) {
            return;
        }

        // Call beforeUnmount hook
        if (options.beforeUnmount) {
            options.beforeUnmount.call(instance);
        }

        // Remove element from DOM
        if (this.$el.parentNode) {
            this.$el.parentNode.removeChild(this.$el);
        }

        // Call unmounted hooks
        if (options.unmounted) {
            options.unmounted.call(instance);
        }

        // Call composition API unmounted hooks
        if (instance.unmounted && Array.isArray(instance.unmounted)) {
            instance.unmounted.forEach(hook => hook());
        }
    };

    // Call created lifecycle hook
    if (options.created) {
        options.created.call(instance);
    }

    return instance;
}

function defineComponent(options) {
    // Validate options
    if (!options) {
        console.error('defineComponent called with null or undefined options');
        throw new Error('Component options cannot be null or undefined');
    }

    // Ensure options is an object
    if (typeof options !== 'object') {
        console.error('defineComponent called with invalid options type:', typeof options);
        throw new Error(`Component options must be an object, got ${typeof options}`);
    }

    // Add a name if not provided
    if (!options.name) {
        options.name = 'AnonymousComponent';
        console.warn('Component defined without a name. Consider adding a name for better debugging.');
    }

    // Return the component factory function
    return function (props) {
        try {
            // Create a new component instance with the provided props
            const instance = createComponent({
                ...options,
                props: props || {}
            });

            // Make props accessible directly on the instance
            for (const key in props) {
                if (key !== 'children' && !(key in instance)) {
                    Object.defineProperty(instance, key, {
                        get() { return props[key]; },
                        configurable: true
                    });
                }
            }

            // Check if render method exists
            if (!instance.render) {
                console.error(`Component ${options.name} has no render method`);
                throw new Error(`Component ${options.name} has no render method`);
            }

            // Call the render method to get the virtual DOM
            const vnode = instance.render();

            // Add component reference to the vnode for future updates
            if (vnode && typeof vnode === 'object') {
                vnode._component = instance;
            }

            return vnode;
        } catch (error) {
            console.error(`Error in component ${options.name}:`, error);

            // Return an error vnode instead of throwing
            return {
                tag: 'div',
                props: {
                    style: 'color: red; border: 1px solid red; padding: 10px; margin: 10px 0;'
                },
                children: [
                    {
                        tag: 'h4',
                        props: {},
                        children: [`Error in component ${options.name}`]
                    },
                    {
                        tag: 'p',
                        props: {},
                        children: [error.message]
                    },
                    {
                        tag: 'pre',
                        props: {
                            style: 'font-size: 12px; overflow: auto; max-height: 200px;'
                        },
                        children: [error.stack]
                    }
                ]
            };
        }
    };
}

/**
 * Creates a new application instance
 * @param {Object|Function} component - Root component
 * @returns {Object} Application instance
 */
export function createApp(component) {
    const app = {
        _component: typeof component === 'function' ? component() : component,
        _context: {},
        _plugins: new Set(),
        _router: null,
        _store: null,
        _renderer: null,
        _useCustomRenderer: true,

        /**
         * Registers a plugin with the application
         * @param {Object|Function} plugin - Plugin to register
         * @param {Object} options - Plugin options
         * @returns {Object} Application instance
         */
        use(plugin, options = {}) {
            if (!this._plugins.has(plugin)) {
                if (plugin && typeof plugin.install === 'function') {
                    plugin.install(this, options);
                } else if (typeof plugin === 'function') {
                    plugin(this, options);
                }
                this._plugins.add(plugin);

                // Check if this is a router or store plugin
                if (plugin.name === 'router' && options.router) {
                    this._router = options.router;
                } else if (plugin.name === 'store' && options.store) {
                    this._store = options.store;
                }
            }
            return this;
        },

        /**
         * Provides a value to the application context
         * @param {string} key - Context key
         * @param {*} value - Context value
         * @returns {Object} Application instance
         */
        provide(key, value) {
            this._context[key] = value;
            return this;
        },

        /**
         * Sets whether to use the custom renderer
         * @param {boolean} value - Whether to use the custom renderer
         * @returns {Object} Application instance
         */
        useCustomRenderer(value = true) {
            this._useCustomRenderer = value;
            return this;
        },

        /**
         * Mounts the application to a DOM element
         * @param {string|HTMLElement} selector - Element or selector
         * @returns {Object} Component instance
         */
        mount(selector) {
            const container = typeof selector === 'string'
                ? document.querySelector(selector)
                : selector;

            if (!container) {
                console.error(`Target container ${selector} not found. Mounting failed.`);
                // Add a visible error message to the body
                const errorDiv = document.createElement('div');
                errorDiv.style.color = 'red';
                errorDiv.style.border = '1px solid red';
                errorDiv.style.padding = '10px';
                errorDiv.style.margin = '10px';
                errorDiv.innerHTML = `<h3>KalxJS Mount Error</h3><p>Target container "${selector}" not found.</p>`;
                document.body.appendChild(errorDiv);
                return this;
            }

            // Clear container
            container.innerHTML = '';

            // Add a loading indicator
            const loadingEl = document.createElement('div');
            loadingEl.className = 'kalxjs-loading';
            loadingEl.innerHTML = 'Loading KalxJS Application...';
            loadingEl.style.padding = '20px';
            loadingEl.style.textAlign = 'center';
            container.appendChild(loadingEl);

            // Create a promise to handle async mounting
            const mountPromise = new Promise((resolve, reject) => {
                try {
                    // First try the default renderer for simplicity and reliability
                    const instance = this._mountWithDefaultRenderer(container);

                    // If successful, resolve with the instance
                    if (instance) {
                        console.log('Application successfully mounted with default renderer');
                        resolve(instance);
                        return;
                    }

                    // If default renderer didn't work and custom renderer is enabled, try that
                    if (this._useCustomRenderer) {
                        // Import the renderer dynamically to avoid circular dependencies
                        import('../renderer').then(({ createRenderer, createCustomRenderer }) => {
                            try {
                                // First try to use the direct custom renderer for better performance
                                if (this._router && this._store) {
                                    this._renderer = createCustomRenderer(this._router, this._store);

                                    if (this._renderer && this._renderer.init) {
                                        // Initialize the renderer with the container
                                        this._renderer.init(container);
                                        console.log('Application successfully mounted with custom renderer');
                                        resolve(this);
                                        return;
                                    }
                                }

                                // Fall back to the renderer factory if direct initialization fails
                                this._renderer = createRenderer({
                                    router: this._router,
                                    store: this._store,
                                    useCustomRenderer: true
                                });

                                if (this._renderer && this._renderer.init) {
                                    // Initialize the renderer with the container
                                    this._renderer.init(container);
                                    console.log('Application successfully mounted with factory renderer');
                                    resolve(this);
                                } else {
                                    // If all else fails, try one more time with the default renderer
                                    const fallbackInstance = this._mountWithDefaultRenderer(container);
                                    if (fallbackInstance) {
                                        resolve(fallbackInstance);
                                    } else {
                                        reject(new Error('Failed to mount application with any renderer'));
                                    }
                                }
                            } catch (error) {
                                console.error('Error initializing custom renderer:', error);
                                // Try default renderer as a last resort
                                const fallbackInstance = this._mountWithDefaultRenderer(container);
                                if (fallbackInstance) {
                                    resolve(fallbackInstance);
                                } else {
                                    reject(error);
                                }
                            }
                        }).catch(error => {
                            console.error('Error loading custom renderer:', error);
                            // Try default renderer as a last resort
                            const fallbackInstance = this._mountWithDefaultRenderer(container);
                            if (fallbackInstance) {
                                resolve(fallbackInstance);
                            } else {
                                reject(error);
                            }
                        });
                    } else {
                        // If we get here, the default renderer failed and custom renderer is disabled
                        reject(new Error('Failed to mount application with default renderer'));
                    }
                } catch (error) {
                    console.error('Error during mount:', error);
                    reject(error);
                }
            });

            // Handle mount promise
            mountPromise.catch(error => {
                console.error('Fatal mounting error:', error);
                // Show error in the container
                container.innerHTML = `
                    <div style="color: red; border: 1px solid red; padding: 20px; margin: 20px 0;">
                        <h3>KalxJS Fatal Error</h3>
                        <p>Failed to mount application: ${error.message}</p>
                        <pre>${error.stack}</pre>
                    </div>
                `;
            });

            return this;
        },

        /**
         * Mounts the application using the default renderer
         * @private
         * @param {HTMLElement} container - Container element
         * @returns {Object} Component instance
         */
        _mountWithDefaultRenderer(container) {
            console.log('Using default renderer');

            try {
                // Remove loading indicator if it exists
                const loadingEl = container.querySelector('.kalxjs-loading');
                if (loadingEl) {
                    container.removeChild(loadingEl);
                }

                // Create a fresh component instance
                const instance = createComponent(this._component);

                // Inject app context and plugins
                instance.$app = this;
                instance.$options._context = this._context;

                // Explicitly inject store if available
                if (this._store) {
                    instance.store = this._store;

                    // Also add it to the instance prototype for inheritance
                    Object.defineProperty(instance, '$store', {
                        get: function () {
                            return this._store || this.$app._store;
                        }
                    });
                }

                // Explicitly inject router if available
                if (this._router) {
                    instance.router = this._router;

                    // Also add it to the instance prototype for inheritance
                    Object.defineProperty(instance, '$router', {
                        get: function () {
                            return this._router || this.$app._router;
                        }
                    });
                }

                // Mount the component
                instance.$mount(container);

                // Store the root instance for future reference
                this._rootInstance = instance;

                return instance;
            } catch (error) {
                console.error('Error in default renderer:', error);

                // Show error in the container
                container.innerHTML = `
                    <div style="color: red; border: 1px solid red; padding: 20px; margin: 20px 0;">
                        <h3>KalxJS Rendering Error</h3>
                        <p>${error.message}</p>
                        <pre>${error.stack}</pre>
                    </div>
                `;

                return null;
            }
        }
    };

    return app;
}

export { createComponent, defineComponent };