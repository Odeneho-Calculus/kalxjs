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
            console.warn('Invalid mounting element');
            return this;
        }

        // Store reference to the mounting element
        this.$el = el;

        // Call lifecycle hook
        if (options.beforeMount) {
            options.beforeMount.call(instance);
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
            const dom = createDOMElement(vnode);
            if (dom) {
                el.appendChild(dom);
                console.log('DOM element created and appended:', dom);
            } else {
                console.warn('Failed to create DOM element from vnode:', vnode);
            }
        } else {
            console.warn('Component render returned null or undefined');
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
    return function (props) {
        const instance = createComponent({
            ...options,
            props: props || {}
        });

        // Make props accessible directly
        for (const key in props) {
            if (key !== 'children') {
                Object.defineProperty(instance, key, {
                    get() { return props[key]; }
                });
            }
        }

        return instance.render();
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
                console.warn(`Target container ${selector} not found. Mounting failed.`);
                return;
            }

            // Clear container
            container.innerHTML = '';
            
            // Try to use the custom renderer if available and enabled
            try {
                if (this._useCustomRenderer) {
                    // Import the renderer dynamically to avoid circular dependencies
                    import('../renderer').then(({ createRenderer }) => {
                        this._renderer = createRenderer({
                            router: this._router,
                            store: this._store,
                            useCustomRenderer: true
                        });
                        
                        if (this._renderer && this._renderer.init) {
                            // Initialize the renderer with the container
                            this._renderer.init(container);
                            console.log('Using custom renderer');
                        } else {
                            // Fall back to the default rendering if custom renderer fails
                            this._mountWithDefaultRenderer(container);
                        }
                    }).catch(error => {
                        console.error('Error loading custom renderer:', error);
                        this._mountWithDefaultRenderer(container);
                    });
                } else {
                    // Use the default rendering
                    this._mountWithDefaultRenderer(container);
                }
            } catch (error) {
                console.error('Error during mount:', error);
                // Fall back to the default rendering
                this._mountWithDefaultRenderer(container);
            }
            
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
            
            const instance = createComponent(this._component);

            // Inject app context and plugins
            instance.$app = this;
            instance.$options._context = this._context;

            // Mount the component
            instance.$mount(container);
            
            return instance;
        }
    };

    return app;
}

export { createComponent, defineComponent };