import { h, createElement, updateElement } from '../vdom/vdom';
import { reactive, effect } from '../reactivity/reactive';

/**
 * Helper function to create DOM elements from virtual DOM
 */
function createDOMElement(vnode) {
    if (typeof vnode === 'string') {
        return document.createTextNode(vnode);
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
        element.appendChild(createDOMElement(child));
    });

    return element;
}

function createComponent(options) {
    const instance = {};

    // Set options
    instance.$options = options;

    // Call beforeCreate lifecycle hook
    if (options.beforeCreate) {
        options.beforeCreate.call(instance);
    }

    // Initialize data
    if (options.data) {
        // Create data object
        instance.$data = options.data.call(instance);

        // Setup getters/setters for data properties
        for (const key in instance.$data) {
            Object.defineProperty(instance, key, {
                get() {
                    return instance.$data[key];
                },
                set(newValue) {
                    // Skip if value hasn't changed
                    if (instance.$data[key] === newValue) return;

                    console.log(`Setting ${key} to`, newValue); // Debug

                    // Store the new value
                    instance.$data[key] = newValue;

                    // Update component
                    if (instance.$el) {
                        console.log('Triggering update from setter'); // Debug

                        // Call beforeUpdate hook
                        if (options.beforeUpdate) {
                            options.beforeUpdate.call(instance);
                        }

                        // Get new virtual DOM tree
                        const newVdom = instance.render();
                        const parentNode = instance.$el.parentNode;

                        // Update the DOM if parent exists
                        if (parentNode) {
                            console.log('Updating DOM with new value', newVdom); // Debug

                            // Update the contents of the element rather than replacing it
                            // This is the main fix for the integration tests
                            if (instance._vnode) {
                                // Clear the element first
                                while (instance.$el.firstChild) {
                                    instance.$el.removeChild(instance.$el.firstChild);
                                }
                                // Create and append the new DOM
                                const newElement = createDOMElement(newVdom);
                                instance.$el.appendChild(newElement);
                                instance._vnode = newVdom;
                            }
                        }

                        // Call updated hook
                        if (options.updated) {
                            options.updated.call(instance);
                        }
                    }
                }
            });
        }
    }

    // Initialize methods
    if (options.methods) {
        for (const key in options.methods) {
            instance[key] = options.methods[key].bind(instance);
        }
    }

    // Initialize computed properties
    if (options.computed) {
        for (const key in options.computed) {
            Object.defineProperty(instance, key, {
                get: options.computed[key].bind(instance)
            });
        }
    }

    // Store initial render result for future updates
    instance._vnode = null;

    // Add render method
    instance.render = function () {
        return options.render ? options.render.call(instance) : null;
    };

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
        this._vnode = vnode;

        // Clear the element before mounting
        el.innerHTML = '';

        // Create real DOM from virtual DOM and append to element
        const dom = createDOMElement(vnode);
        el.appendChild(dom);

        // Call mounted hook
        if (options.mounted) {
            options.mounted.call(instance);
        }

        return this;
    };

    // Add update functionality
    instance.$update = function () {
        if (!this.$el) {
            console.warn('Cannot update: component not mounted');
            return;
        }

        console.log('$update called'); // Debug

        // Call beforeUpdate lifecycle hook
        if (options.beforeUpdate) {
            options.beforeUpdate.call(instance);
        }

        // Re-render and update the DOM
        const newVdom = this.render();

        if (this.$el) {
            console.log('Updating in $update'); // Debug

            // Clear the element first then append the new content
            // This is the fix for the manual $update method
            while (this.$el.firstChild) {
                this.$el.removeChild(this.$el.firstChild);
            }

            // Create and append the new DOM
            const newElement = createDOMElement(newVdom);
            this.$el.appendChild(newElement);
            this._vnode = newVdom;
        }

        // Call updated lifecycle hook
        if (options.updated) {
            options.updated.call(instance);
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

        use(plugin, options = {}) {
            if (!this._plugins.has(plugin)) {
                if (plugin && typeof plugin.install === 'function') {
                    plugin.install(this, options);
                } else if (typeof plugin === 'function') {
                    plugin(this, options);
                }
                this._plugins.add(plugin);
            }
            return this;
        },

        provide(key, value) {
            this._context[key] = value;
            return this;
        },

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