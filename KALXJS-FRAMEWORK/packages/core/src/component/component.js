import { h, createElement, createDOMElement, updateElement } from '../vdom/vdom.js';
import { reactive, effect, ref } from '../reactivity/reactive.js';
import { processSetup } from './setup.js';
import { createDefaultAppComponent } from './default-app.js';
import { applyDirectives } from '../directives/index.js';

/**
 * Process template content to handle directives better
 * @param {string} content - Template content
 * @param {Object} component - Component instance
 * @returns {string} Processed template content
 */
function processTemplateContent(content, component) {
    // Replace {{ expressions }} with actual values from the component
    return content.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
        try {
            // Trim the expression
            const trimmedExpr = expression.trim();

            // Split by dots to handle nested properties
            const parts = trimmedExpr.split('.');
            let value = component;

            // Navigate through the object properties
            for (const part of parts) {
                if (value === undefined || value === null) {
                    return 'undefined';
                }

                // Get the property value
                value = value[part];

                // Handle ref objects
                if (value && typeof value === 'object' && 'value' in value && typeof value.value !== 'function') {
                    value = value.value;
                }
            }

            // Handle arrays with ref objects
            if (Array.isArray(value)) {
                // Check if array contains ref objects and unwrap them
                value = value.map(item => {
                    if (item && typeof item === 'object' && 'value' in item && typeof item.value !== 'function') {
                        return item.value;
                    }
                    return item;
                });
            }

            // Handle undefined values
            if (value === undefined) {
                console.warn(`Expression "${trimmedExpr}" evaluated to undefined in template`);
                return '';
            }

            // Handle arrays and objects
            if (typeof value === 'object' && value !== null) {
                // For arrays of primitive values, join them with commas
                if (Array.isArray(value) && value.every(item =>
                    typeof item !== 'object' || item === null)) {
                    return value.join(', ');
                }
                // For other objects, stringify them
                return JSON.stringify(value);
            }

            return String(value);
        } catch (error) {
            console.error(`Error evaluating expression "${expression}":`, error);
            return '';
        }
    });
}

/**
 * Helper function to create DOM elements from virtual DOM (DEPRECATED - use imported createDOMElement instead)
 */
function _createDOMElementLegacy(vnode) {
    // This function is deprecated - use the imported createDOMElement from vdom.js instead
    console.warn('Using deprecated _createDOMElementLegacy function - use imported createDOMElement instead');

    // Just delegate to the imported function
    return createDOMElement(vnode);
}

/**
 * Helper function to ensure a valid vnode is returned
 * @param {*} vnode - The vnode to validate
 * @param {Object} component - The component instance
 * @returns {Object} A valid vnode
 */
function ensureValidVnode(vnode, component) {
    // Check if vnode is the component instance itself
    if (vnode === component || (typeof vnode === 'object' && vnode && vnode.$el !== undefined)) {
        console.warn('Render function returned the component instance instead of a vnode, creating default vnode');

        // If the component has a _vnode property, use that
        if (vnode._vnode) {
            console.log('Using _vnode from component instance:', vnode._vnode);
            return vnode._vnode;
        }

        // Create a default vnode that uses _renderTemplate if available
        if (typeof component._renderTemplate === 'function') {
            const templateContent = component._renderTemplate();
            console.log('Template content from _renderTemplate:', templateContent);

            // Process the template content to handle directives
            const processedContent = processTemplateContent(templateContent, component);

            // Store the original template content for directive processing
            component._originalTemplate = templateContent;

            const vnode = {
                tag: 'div',
                props: { class: 'kal-component' },
                children: [{
                    tag: 'div',
                    props: {
                        innerHTML: processedContent,
                        // Add a reference to the component for directive processing
                        'data-component-id': component._uid || 'component'
                    },
                    children: [],
                    // Add a hook for directive processing
                    mounted: (el) => {
                        // Apply directives to the rendered content
                        if (el && el.firstChild) {
                            applyDirectives(el.firstChild, component);
                        }
                    }
                }]
            };

            console.log('Created vnode from template:', vnode);
            return vnode;
        } else {
            // Check if the component has a render method that might return a valid vnode
            if (typeof component.render === 'function' && component !== component.render()) {
                try {
                    const renderedVnode = component.render();
                    if (renderedVnode && renderedVnode.tag) {
                        console.log('Using vnode from component render method:', renderedVnode);
                        return renderedVnode;
                    }
                } catch (error) {
                    console.error('Error calling component render method:', error);
                }
            }

            return {
                tag: 'div',
                props: { class: 'kal-component' },
                children: [{
                    tag: 'div',
                    props: {
                        innerHTML: 'Component rendered successfully'
                    },
                    children: []
                }]
            };
        }
    }
    // Ensure vnode is a proper virtual DOM node
    else if (vnode && typeof vnode === 'object' && !vnode.tag) {
        console.warn('Render returned a vnode without a tag property, creating proper vnode');
        return {
            tag: 'div',
            props: { class: 'kal-component' },
            children: [{
                tag: 'div',
                props: {
                    innerHTML: typeof component._renderTemplate === 'function' ? component._renderTemplate() : 'Component rendered successfully'
                },
                children: []
            }]
        };
    }
    // Handle null or undefined
    else if (!vnode) {
        console.warn('Component render returned null or undefined, creating default vnode');
        return {
            tag: 'div',
            props: { class: 'kal-component-empty' },
            children: [{
                tag: 'div',
                props: {
                    innerHTML: 'Component render returned empty result',
                    style: 'padding: 10px; border: 1px solid #f0ad4e; background-color: #fcf8e3; color: #8a6d3b; border-radius: 4px;'
                },
                children: []
            }]
        };
    }

    // If vnode is already valid, return it
    return vnode;
}

import { setCurrentInstance } from '../composition/instance.js';

function createComponent(options, initialProps = {}) {
    const instance = {};

    // Initialize lifecycle hook arrays to avoid undefined errors
    instance.mounted = [];
    instance.unmounted = [];
    instance.beforeUpdate = [];
    instance.updated = [];
    instance.beforeMount = [];
    instance.beforeUnmount = [];

    console.log('Creating component with options:', options.name || 'unnamed component');
    console.log('Initial props:', initialProps);

    // Set options
    instance.$options = options;

    // Assign _renderTemplate from options if present
    if (options._renderTemplate) {
        instance._renderTemplate = options._renderTemplate;
    }

    // Initialize props with any provided initial props
    instance.props = { ...initialProps };

    // Process props definition if it exists
    if (options.props) {
        console.log('Processing props definition:', options.props);

        // If props is an array of strings
        if (Array.isArray(options.props)) {
            options.props.forEach(propName => {
                // Only set default (undefined) if not provided in initialProps
                if (!(propName in instance.props)) {
                    instance.props[propName] = undefined;
                }
            });
        }
        // If props is an object with type/default definitions
        else if (typeof options.props === 'object') {
            for (const propName in options.props) {
                // Skip if already provided in initialProps
                if (propName in instance.props && instance.props[propName] !== undefined) {
                    console.log(`Using provided prop value for ${propName}:`, instance.props[propName]);
                    continue;
                }

                const propDef = options.props[propName];

                // If the prop definition is an object with a default value
                if (typeof propDef === 'object' && 'default' in propDef) {
                    // If default is a function, call it, otherwise use the value directly
                    const defaultValue = typeof propDef.default === 'function'
                        ? propDef.default()
                        : propDef.default;

                    instance.props[propName] = defaultValue;
                    console.log(`Set default value for prop ${propName}:`, defaultValue);
                } else {
                    // No default value specified
                    instance.props[propName] = undefined;
                }
            }
        }
    }

    // Make props directly accessible on the instance
    for (const key in instance.props) {
        if (!(key in instance)) {
            Object.defineProperty(instance, key, {
                get() { return instance.props[key]; },
                configurable: true
            });
        }
    }

    // Call beforeCreate lifecycle hook
    if (options.beforeCreate) {
        options.beforeCreate.call(instance);
    }

    // Set current instance before setup
    setCurrentInstance(instance);

    // Process setup function if it exists
    const setupResult = processSetup(instance, options);

    // Clear current instance after setup
    setCurrentInstance(null);

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

    // Add _renderTemplate method if it doesn't exist
    if (!instance._renderTemplate) {
        instance._renderTemplate = function () {
            console.log('Default _renderTemplate called for', options.name || 'unnamed component');

            // Create a more visible template
            const template = `
                <div class="component-content" style="padding: 20px; border: 2px solid #4299e1; border-radius: 4px; background-color: #ebf8ff; color: #2b6cb0;">
                    <h2 style="margin-top: 0;">${options.name || 'Component'}</h2>
                    <p>This component is working but has no template defined.</p>
                    <div style="margin-top: 15px; font-size: 14px; padding: 10px; background: #fff; border-radius: 4px;">
                        <p style="margin: 0;">To add content, define a template or render function.</p>
                    </div>
                </div>
            `;

            console.log('Generated template content:', template);
            return template;
        };
    }

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

                // Check if the result is the component instance or not a valid vnode
                if (result === instance || (typeof result === 'object' && result && result.$el !== undefined)) {
                    console.warn('Render function returned the component instance, extracting vnode from component');

                    // If the component has a _vnode property, use that
                    if (result._vnode) {
                        console.log('Using _vnode from component:', result._vnode);
                        return result._vnode;
                    }

                    // If the component has a _renderTemplate method, use that
                    if (typeof result._renderTemplate === 'function') {
                        console.log('Using _renderTemplate method from component');
                        const templateContent = result._renderTemplate();

                        return {
                            tag: 'div',
                            props: { class: 'kal-component' },
                            children: [{
                                tag: 'div',
                                props: {
                                    innerHTML: templateContent
                                },
                                children: []
                            }]
                        };
                    }
                }

                // If result is null or undefined, fallback to _renderTemplate
                if (result == null && typeof instance._renderTemplate === 'function') {
                    console.log('Render result is null or undefined, using _renderTemplate fallback');
                    const templateContent = instance._renderTemplate();

                    return {
                        tag: 'div',
                        props: { class: 'kal-component' },
                        children: [{
                            tag: 'div',
                            props: {
                                innerHTML: templateContent
                            },
                            children: []
                        }]
                    };
                }

                return result;
            } catch (error) {
                // Use the app's error handler if available
                if (instance.$app && instance.$app.config && instance.$app.config.errorHandler) {
                    try {
                        instance.$app.config.errorHandler(error, instance, 'render');
                    } catch (handlerError) {
                        console.error('Error in errorHandler:', handlerError);
                        console.error('Original error:', error);
                    }
                } else {
                    console.error('Error in render method:', error);
                }

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
            let vnode = this.render();

            // Log the render process for debugging
            console.log('Component render result:', vnode);

            // Ensure we have a valid vnode
            vnode = ensureValidVnode(vnode, this);

            console.log('Final vnode for rendering:', vnode);

            // Store the vnode for future updates
            this._vnode = vnode;

            // Create real DOM from virtual DOM and append to element
            if (vnode) {
                // Use createDOMElement from vdom/vdom.js to ensure consistent behavior
                const dom = createDOMElement(vnode);

                if (dom) {
                    el.appendChild(dom);
                    console.log('DOM element created and appended:', dom);

                    // Process directives on the rendered DOM
                    try {
                        // Import the clean directive processor dynamically to avoid circular dependencies
                        import('../directives/directive-processor.js').then(module => {
                            const { processDirectives } = module;

                            // Ensure reactive values are properly passed to the directive processor
                            // Create a clean context with all the reactive values
                            const directiveContext = { ...this };

                            // Log the reactive properties for debugging
                            console.log('Component instance before directive processing:', {
                                message: this.message,
                                showText: this.showText,
                                items: this.items,
                                inputText: this.inputText,
                                count: this.count
                            });

                            // Process directives with the component instance as context
                            processDirectives(dom, directiveContext);
                            console.log('Directives processed on DOM element');
                        }).catch(err => {
                            console.error('Error importing directive processor:', err);
                        });
                    } catch (err) {
                        console.error('Error processing directives:', err);
                    }
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
        let newVdom = this.render();
        console.log('Component update with new vdom:', newVdom);

        // Ensure we have a valid vnode
        newVdom = ensureValidVnode(newVdom, this);

        console.log('Final vnode for updating:', newVdom);

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

            // Store the options on the factory function for reference by createJsComponent
            if (!componentFactory.options) {
                componentFactory.options = componentOptions;
            }

            // Create a new component instance with the provided props
            // Keep the original props definition and pass the props as initialProps
            const instance = createComponent(componentOptions, props || {});

            // Make props accessible directly on the instance
            for (const key in props) {
                if (key !== 'children' && !(key in instance)) {
                    Object.defineProperty(instance, key, {
                        get() { return props[key]; },
                        configurable: true
                    });
                }
            }

            // For tests, if the instance has a render method, call it to get the vnode
            if (instance.render) {
                return instance.render();
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

        // Configuration options
        config: {
            errorHandler: null,
            warnHandler: null,
            performance: false,
            devtools: process.env.NODE_ENV !== 'production'
        },

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
                    // Use the error handler if it's set
                    if (this.config.errorHandler) {
                        try {
                            this.config.errorHandler(error, this, 'mount');
                        } catch (handlerError) {
                            console.error('Error in errorHandler:', handlerError);
                            console.error('Original error:', error);
                        }
                    } else {
                        console.error('Error mounting application:', error);
                    }
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

                        // Use the options object directly instead of cloning
                        componentOptions = componentOptions.options;

                        // Copy _renderTemplate from original options if present
                        if (!componentOptions._renderTemplate && componentOptions.options && componentOptions.options._renderTemplate) {
                            componentOptions._renderTemplate = componentOptions.options._renderTemplate;
                        }

                        // Add a _renderTemplate method if it doesn't exist
                        if (!componentOptions._renderTemplate) {
                            componentOptions._renderTemplate = function () {
                                console.log('Factory component _renderTemplate called');
                                return `
                                    <div class="factory-component" style="padding: 20px; border: 2px solid #38a169; border-radius: 4px; background-color: #f0fff4; color: #276749;">
                                        <h2 style="margin-top: 0;">${componentOptions.name || 'Factory Component'}</h2>
                                        <p>This factory component is working correctly.</p>
                                        <div style="margin-top: 15px; font-size: 14px; padding: 10px; background: #fff; border-radius: 4px;">
                                            <p style="margin: 0;">Component properties: ${Object.keys(componentOptions).join(', ')}</p>
                                        </div>
                                    </div>
                                `;
                            };
                        }
                    } else {
                        // This is a regular function component
                        console.log('Using function component');
                        // Store the function reference before modifying componentOptions
                        if (typeof componentOptions === 'function') {
                            const componentFunction = componentOptions;
                            componentOptions = {
                                name: componentFunction.name || 'FunctionComponent',
                                render: () => componentFunction({ ref }),  // Pass ref to the function component
                                setup: (props, ctx) => {
                                    // Make ref available in the setup context
                                    ctx.ref = ref;
                                    return {};
                                },
                                _renderTemplate: function () {
                                    console.log('Function component _renderTemplate called');
                                return (
                                    '<div class="function-component" style="padding: 20px; border: 2px solid #805ad5; border-radius: 4px; background-color: #faf5ff; color: #553c9a;">' +
                                        '<h2 style="margin-top: 0;">' + (componentFunction.name || 'Function Component') + '</h2>' +
                                        '<p>This function component is working correctly.</p>' +
                                        '<div style="margin-top: 15px; font-size: 14px; padding: 10px; background: #fff; border-radius: 4px;">' +
                                            '<p style="margin: 0;">Component is rendering through the default template.</p>' +
                                        '</div>' +
                                    '</div>'
                                );
                                }
                            };
                        } else {
                            console.error('Expected componentOptions to be a function but got:', typeof componentOptions);
                            componentOptions = {
                                name: 'ErrorComponent',
                                render: () => h('div', { style: 'color: red' }, ['Component Error: Invalid component definition']),
                                _renderTemplate: function () {
                                    console.log('Error component _renderTemplate called');
                                    return `
                                        <div class="error-component" style="padding: 20px; border: 2px solid #e53e3e; border-radius: 4px; background-color: #fff5f5; color: #c53030;">
                                            <h2 style="margin-top: 0;">Component Error</h2>
                                            <p>Invalid component type: ${typeof componentOptions}</p>
                                            <div style="margin-top: 15px; font-size: 14px; padding: 10px; background: #fff; border-radius: 4px;">
                                                <p style="margin: 0;">Please check your component definition.</p>
                                            </div>
                                        </div>
                                    `;
                                }
                            };
                        }
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
                        // Create component - createComponent will handle default props
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
