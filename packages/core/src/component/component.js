import { h, createElement, updateElement } from '../vdom/vdom';
import { reactive, effect } from '../reactivity/reactive';
import { processSetup } from './setup';
import { createDefaultAppComponent } from './default-app';

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
        // Create data object and make it reactive
        instance.$data = reactive(options.data.call(instance));

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
                        if (instance.beforeUpdate && Array.isArray(instance.beforeUpdate)) {
                            instance.beforeUpdate.forEach(hook => hook());
                        }

                        // Get new virtual DOM tree
                        const newVdom = instance.render();
                        const parentNode = instance.$el.parentNode;

                        // Update the DOM if parent exists
                        if (parentNode) {
                            // Update the contents of the element rather than replacing it
                            if (instance._vnode) {
                                console.log('Updating component with new vdom:', newVdom);
                                // Use the updateElement function from vdom to properly update the DOM
                                updateElement(instance.$el, instance._vnode, newVdom);
                                instance._vnode = newVdom;
                            } else {
                                // First render, create and append the new DOM
                                console.log('First render with vdom:', newVdom);
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
                        if (instance.updated && Array.isArray(instance.updated)) {
                            instance.updated.forEach(hook => hook());
                        }
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
            console.log('Component render called for', options.name || 'unnamed component');

            if (!options.render) {
                console.warn('No render method defined for component, creating default render');

                // Create a default render function that shows a more helpful message
                // instead of just showing an error
                return h('div', {
                    style: 'padding: 20px; border: 2px solid orange; border-radius: 4px; background-color: #fffaf0; color: #c05621;'
                }, [
                    h('h2', {}, ['Component Ready']),
                    h('p', {}, ['This component is working but needs a template or render function.']),
                    h('div', { style: 'margin-top: 15px; font-size: 14px;' }, [
                        h('p', {}, ['To fix this, add a <template> section to your .klx file or define a render function.'])
                    ])
                ]);
            }

            try {
                const result = options.render.call(instance);
                console.log('Render result:', result);
                return result;
            } catch (error) {
                console.error('Error in render method:', error);
                return h('div', {
                    style: 'color: red; border: 1px solid red; padding: 10px; margin: 10px 0;'
                }, [
                    h('h4', {}, ['Render Error']),
                    h('p', {}, [error.message]),
                    h('pre', { style: 'font-size: 12px; overflow: auto; max-height: 200px;' }, [error.stack])
                ]);
            }
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
        console.log('Mounting component to element:', el);

        try {
            // Clear the element before mounting
            el.innerHTML = '';

            // Render the component
            const vnode = this.render();

            // Log the render process for debugging
            console.log('Component render result:', vnode);

            // Store the vnode for future updates
            this._vnode = vnode;

            // Create real DOM from virtual DOM and append to element
            if (vnode) {
                // Ensure the vnode has a tag property
                if (typeof vnode === 'object' && !vnode.tag) {
                    console.warn('Render returned a vnode without a tag property, adding div tag');
                    vnode.tag = 'div';
                }

                // Use createElement from vdom/vdom.js to ensure consistent behavior
                const dom = createElement(vnode);

                if (dom) {
                    el.appendChild(dom);
                    console.log('DOM element created and appended:', dom);
                } else {
                    throw new Error('Failed to create DOM element from vnode');
                }
            } else {
                throw new Error('Component render returned null or undefined');
            }
        } catch (error) {
            console.error('Error during component mounting:', error);
            // Add a visible error message to help with debugging
            el.innerHTML = `
                <div style="color: red; border: 1px solid red; padding: 10px; margin: 10px 0;">
                    <h3>Component Rendering Error</h3>
                    <p>${error.message}</p>
                    <pre style="font-size: 12px; overflow: auto; max-height: 200px; background: #f5f5f5; padding: 5px;">${error.stack}</pre>
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
        console.log('Component update with new vdom:', newVdom);

        if (this.$el) {
            try {
                // Clear the element first
                this.$el.innerHTML = '';

                // Create a new DOM element from the virtual DOM
                const newElement = createElement(newVdom);

                // Append the new element to the container
                this.$el.appendChild(newElement);

                // Store the new vnode for future updates
                this._vnode = newVdom;

                console.log('DOM updated successfully');
            } catch (error) {
                console.error('Error during component update:', error);
                // Add a visible error message to help with debugging
                this.$el.innerHTML = `
                    <div style="color: red; border: 1px solid red; padding: 10px; margin: 10px 0;">
                        <h3>Component Update Error</h3>
                        <p>${error.message}</p>
                        <pre style="font-size: 12px; overflow: auto; max-height: 200px; background: #f5f5f5; padding: 5px;">${error.stack}</pre>
                    </div>
                `;
            }
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

    // Store the original options for reference
    const componentOptions = { ...options };

    // Return the component factory function
    const componentFactory = function (props) {
        try {
            console.log(`Creating component ${componentOptions.name} with props:`, props);

            // Create a new component instance with the provided props
            const instance = createComponent({
                ...componentOptions,
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

            return instance;
        } catch (error) {
            console.error(`Error creating component ${componentOptions.name}:`, error);
            throw error;
        }
    };

    // Add the original options to the factory function for reference
    componentFactory.options = componentOptions;

    return componentFactory;
}

function createApp(component) {
    // Create a new application instance
    const app = {
        // Store the root component
        _component: component,

        // Store plugins
        _plugins: [],

        // Store global properties
        _context: {
            provides: {},
            components: {},
            directives: {}
        },

        // Store router
        _router: null,

        // Store store
        _store: null,

        // Use a plugin
        use(plugin, options) {
            if (typeof plugin === 'function') {
                plugin(this, options);
            } else if (typeof plugin === 'object' && typeof plugin.install === 'function') {
                plugin.install(this, options);
            } else {
                console.warn('Invalid plugin. Plugin must be a function or an object with an install method.');
            }

            // Store the plugin
            this._plugins.push(plugin);

            return this;
        },

        // Register a component
        component(name, component) {
            if (!component) {
                return this._context.components[name];
            }

            this._context.components[name] = component;
            return this;
        },

        // Register a directive
        directive(name, directive) {
            if (!directive) {
                return this._context.directives[name];
            }

            this._context.directives[name] = directive;
            return this;
        },

        // Provide a value to all components
        provide(key, value) {
            this._context.provides[key] = value;
            return this;
        },

        // Mount the application
        mount(selector) {
            // Find the container element
            const container = typeof selector === 'string'
                ? document.querySelector(selector)
                : selector;

            if (!container) {
                console.error(`Failed to mount app: target container ${selector} not found.`);
                return this;
            }

            console.log('Mounting application to:', selector);
            console.log('Found container:', container);

            // Create a promise to handle async mounting
            const mountPromise = new Promise((resolve, reject) => {
                try {
                    // Check if we have a custom renderer
                    if (this._renderer) {
                        console.log('Using custom renderer');
                        // Use the custom renderer to mount the application
                        this._renderer.mount(this._component, container, this);
                        console.log('Application successfully mounted with custom renderer');
                        resolve(this);
                    } else {
                        console.log('Using default renderer');
                        // Use the default renderer
                        const instance = this._mountWithDefaultRenderer(container);
                        console.log('Application successfully mounted with default renderer');
                        resolve(instance);
                    }
                } catch (error) {
                    console.error('Error mounting application:', error);
                    reject(error);
                }
            });

            // Return the app instance for chaining
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
                // Handle both component definition objects and component factory functions
                let componentOptions = this._component;

                console.log('Component type:', typeof componentOptions);

                // Handle string components first to avoid trying to access properties on them
                if (typeof componentOptions === 'string') {
                    // We'll handle string components separately below
                    console.log('String component path:', componentOptions);
                }
                // Handle function components
                else if (typeof componentOptions === 'function') {
                    // If it's a factory function (like from defineComponent), we need to handle it specially
                    if (componentOptions.options) {
                        // This is a component factory from defineComponent
                        console.log('Using component factory with options:', componentOptions.options.name);
                        componentOptions = componentOptions.options;
                    } else {
                        // This is a regular function component
                        console.log('Using function component');
                        componentOptions = {
                            name: componentOptions.name || 'FunctionComponent',
                            render: () => componentOptions({})
                        };
                    }
                }

                console.log('Creating component with options:', componentOptions);

                // Handle string components differently - they need special treatment
                let instance;
                try {
                    if (typeof componentOptions === 'string') {
                        console.log('String component detected:', componentOptions);

                        // Special handling for App.klx
                        if (componentOptions === '/src/App.klx') {
                            console.log('Special handling for App.klx');

                            // Create a default App component using our imported function
                            const defaultAppComponent = createDefaultAppComponent();

                            // Replace the instance with the default App component
                            instance = createComponent(defaultAppComponent);
                            instance.$app = this;

                            if (this._context) {
                                instance._appContext = this._context;
                            }
                        } else {
                            // For string components, we'll create a wrapper component
                            // that will be replaced by the actual component once loaded
                            const wrapperComponent = {
                                name: 'ComponentLoader',
                                _isWrapper: true,
                                _sourcePath: componentOptions,
                                render() {
                                    return h('div', { class: 'component-loading' },
                                        [`Loading component from: ${componentOptions}`]);
                                }
                            };

                            // Create the component without trying to set _context on the string
                            instance = createComponent(wrapperComponent);

                            // Set app reference
                            instance.$app = this;

                            // Store the context in the instance instead of the options
                            if (this._context) {
                                instance._appContext = this._context;
                            }
                        }
                    } else {
                        // Normal component object
                        instance = createComponent(componentOptions);

                        // Inject app context and plugins
                        instance.$app = this;

                        // Set _context on the component options
                        if (instance.$options && typeof instance.$options === 'object' && this._context) {
                            instance.$options._context = this._context;
                        }
                    }
                } catch (error) {
                    console.error('Error creating component:', error);

                    // Create a fallback error component
                    const errorComponent = {
                        name: 'ErrorComponent',
                        render() {
                            return h('div', { class: 'component-error', style: 'color: red; padding: 20px; border: 1px solid red;' },
                                [
                                    h('h3', null, 'Error Creating Component'),
                                    h('p', null, error.message),
                                    h('pre', { style: 'background: #f5f5f5; padding: 10px; overflow: auto;' }, error.stack)
                                ]
                            );
                        }
                    };

                    instance = createComponent(errorComponent);
                    instance.$app = this;
                }

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

                return instance;
            } catch (error) {
                console.error('Error in default renderer:', error);
                container.innerHTML = `
                    <div style="color: red; border: 1px solid red; padding: 20px; margin: 20px 0;">
                        <h2>Application Error</h2>
                        <p>${error.message}</p>
                        <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error.stack}</pre>
                    </div>
                `;
                throw error;
            }
        }
    };

    return app;
}

export { createComponent, defineComponent, createApp };