// packages/core/src/template/template-component.js

/**
 * Creates a template-based component
 * @param {Object} options - Component options
 * @returns {Object} Component instance
 */
export function createTemplateComponent(options = {}) {
    const component = {
        // Component options
        template: options.template || '',
        name: options.name || 'anonymous-component',
        props: options.props || {},
        data: options.data || (() => ({})),
        methods: options.methods || {},
        computed: options.computed || {},
        watch: options.watch || {},

        // Lifecycle hooks
        beforeCreate: options.beforeCreate,
        created: options.created,
        beforeMount: options.beforeMount,
        mounted: options.mounted,
        beforeUpdate: options.beforeUpdate,
        updated: options.updated,
        beforeUnmount: options.beforeUnmount,
        unmounted: options.unmounted,

        // Internal state
        _state: null,
        _el: null,
        _isMounted: false,
        _events: new Map(),

        /**
         * Initializes the component
         * @param {Object} props - Component props
         */
        init(props = {}) {
            // Call beforeCreate hook
            if (this.beforeCreate) {
                this.beforeCreate();
            }

            // Initialize props
            this._props = { ...props };

            // Initialize data
            this._state = this.data ? this.data() : {};

            // Initialize methods
            for (const key in this.methods) {
                this[key] = this.methods[key].bind(this);
            }

            // Initialize computed properties
            this._computed = {};
            for (const key in this.computed) {
                Object.defineProperty(this, key, {
                    get: () => {
                        // Cache computed value
                        if (!this._computed[key]) {
                            this._computed[key] = this.computed[key].call(this);
                        }
                        return this._computed[key];
                    },
                    enumerable: true
                });
            }

            // Call created hook
            if (this.created) {
                this.created();
            }

            return this;
        },

        /**
         * Mounts the component to an element
         * @param {string|HTMLElement} el - Element or selector
         */
        mount(el) {
            // Get the element
            this._el = typeof el === 'string' ? document.querySelector(el) : el;

            if (!this._el) {
                console.error(`Element not found: ${el}`);
                return this;
            }

            // Call beforeMount hook
            if (this.beforeMount) {
                this.beforeMount();
            }

            // Render the component
            this.render();

            // Set mounted flag
            this._isMounted = true;

            // Call mounted hook
            if (this.mounted) {
                this.mounted();
            }

            return this;
        },

        /**
         * Renders the component
         */
        render() {
            if (!this._el) return;

            // Process template
            let html = this.template;

            // Replace data bindings
            for (const key in this._state) {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                html = html.replace(regex, this._state[key]);
            }

            // Replace computed bindings
            for (const key in this.computed) {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                html = html.replace(regex, this[key]);
            }

            // Replace prop bindings
            for (const key in this._props) {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                html = html.replace(regex, this._props[key]);
            }

            // Set the HTML
            this._el.innerHTML = html;

            // Set up event listeners
            this._setupEventListeners();

            return this;
        },

        /**
         * Sets up event listeners
         * @private
         */
        _setupEventListeners() {
            if (!this._el) return;

            // Find elements with @event attributes
            const elements = this._el.querySelectorAll('[\\@click], [\\@input], [\\@change], [\\@submit]');

            elements.forEach(element => {
                // Process each element
                const attrs = element.attributes;

                for (let i = 0; i < attrs.length; i++) {
                    const attr = attrs[i];

                    if (attr.name.startsWith('@')) {
                        // Get event name and method
                        const eventName = attr.name.substring(1);
                        const methodName = attr.value;

                        // Check if method exists
                        if (this.methods && this.methods[methodName]) {
                            // Remove old listener if exists
                            const oldListener = this._events.get(`${element.id || ''}:${eventName}:${methodName}`);
                            if (oldListener) {
                                element.removeEventListener(eventName, oldListener);
                            }

                            // Add new listener
                            const listener = (event) => {
                                this.methods[methodName].call(this, event);
                            };

                            element.addEventListener(eventName, listener);

                            // Store listener for cleanup
                            this._events.set(`${element.id || ''}:${eventName}:${methodName}`, listener);
                        }
                    }
                }
            });
        },

        /**
         * Updates the component state
         * @param {Object} newState - New state
         */
        setState(newState) {
            // Call beforeUpdate hook
            if (this.beforeUpdate) {
                this.beforeUpdate();
            }

            // Update state
            Object.assign(this._state, newState);

            // Clear computed cache
            this._computed = {};

            // Re-render if mounted
            if (this._isMounted) {
                this.render();
            }

            // Call updated hook
            if (this.updated) {
                this.updated();
            }

            return this;
        },

        /**
         * Gets a state value
         * @param {string} key - State key
         * @returns {*} State value
         */
        getState(key) {
            return this._state[key];
        },

        /**
         * Unmounts the component
         */
        unmount() {
            if (!this._el || !this._isMounted) return;

            // Call beforeUnmount hook
            if (this.beforeUnmount) {
                this.beforeUnmount();
            }

            // Remove event listeners
            this._events.forEach((listener, key) => {
                const [id, eventName] = key.split(':');
                const element = id ? document.getElementById(id) : this._el;

                if (element) {
                    element.removeEventListener(eventName, listener);
                }
            });

            // Clear events map
            this._events.clear();

            // Clear element
            this._el.innerHTML = '';

            // Reset mounted flag
            this._isMounted = false;

            // Call unmounted hook
            if (this.unmounted) {
                this.unmounted();
            }

            return this;
        }
    };

    return component.init(options.props);
}

/**
 * Defines a template component
 * @param {Object} options - Component options
 * @returns {Function} Component factory function
 */
export function defineTemplateComponent(options = {}) {
    return function (props = {}) {
        return createTemplateComponent({
            ...options,
            props: { ...options.props, ...props }
        });
    };
}