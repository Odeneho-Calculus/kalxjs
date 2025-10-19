/**
 * KALXJS Web Components Integration
 * Define KALXJS components as custom elements
 *
 * Features:
 * - Convert KALXJS components to Web Components
 * - Shadow DOM support with style encapsulation
 * - Reactive attributes and properties
 * - Lifecycle integration
 * - Framework interoperability
 *
 * @module @kalxjs/core/web-components
 */

import { createApp } from '../app.js';
import { reactive, effect } from '../reactivity/index.js';
import { h } from '../vdom/index.js';

/**
 * Convert KALXJS component to Custom Element
 *
 * @param {Object} component - KALXJS component definition
 * @param {Object} options - Configuration options
 * @returns {CustomElementConstructor}
 *
 * @example
 * ```js
 * import { defineCustomElement } from '@kalxjs/core';
 *
 * const MyButton = defineCustomElement({
 *   props: ['label', 'disabled'],
 *   emits: ['click'],
 *   template: `
 *     <button @click="$emit('click', $event)" :disabled="disabled">
 *       {{ label }}
 *     </button>
 *   `
 * });
 *
 * customElements.define('my-button', MyButton);
 * ```
 */
export function defineCustomElement(component, options = {}) {
    const {
        shadowRoot = true,
        shadowMode = 'open',
        styles = [],
    } = options;

    class KalxCustomElement extends HTMLElement {
        constructor() {
            super();

            this._props = {};
            this._app = null;
            this._mounted = false;
            this._root = null;

            // Setup shadow DOM if requested
            if (shadowRoot) {
                this._root = this.attachShadow({ mode: shadowMode });
            } else {
                this._root = this;
            }

            // Add styles
            if (shadowRoot && styles.length > 0) {
                this._injectStyles(styles);
            }
        }

        /**
         * Observed attributes (from component props)
         */
        static get observedAttributes() {
            const props = component.props || [];

            if (Array.isArray(props)) {
                return props.map(prop => this._toKebabCase(prop));
            } else if (typeof props === 'object') {
                return Object.keys(props).map(prop => this._toKebabCase(prop));
            }

            return [];
        }

        /**
         * Convert camelCase to kebab-case
         */
        static _toKebabCase(str) {
            return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        }

        /**
         * Convert kebab-case to camelCase
         */
        static _toCamelCase(str) {
            return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        }

        /**
         * Lifecycle: Element connected to DOM
         */
        connectedCallback() {
            if (!this._mounted) {
                this._mount();
            }
        }

        /**
         * Lifecycle: Element disconnected from DOM
         */
        disconnectedCallback() {
            this._unmount();
        }

        /**
         * Lifecycle: Attribute changed
         */
        attributeChangedCallback(name, oldValue, newValue) {
            if (oldValue === newValue) return;

            const propName = this.constructor._toCamelCase(name);
            const parsedValue = this._parseAttributeValue(newValue);

            if (this._props) {
                this._props[propName] = parsedValue;
            }
        }

        /**
         * Lifecycle: Element adopted to new document
         */
        adoptedCallback() {
            // Re-mount if needed
            if (this._mounted) {
                this._unmount();
                this._mount();
            }
        }

        /**
         * Mount the KALXJS component
         * @private
         */
        _mount() {
            // Create reactive props
            this._props = reactive(this._getInitialProps());

            // Create component instance with props
            const componentInstance = {
                ...component,
                props: Object.keys(this._props),
                setup: (props, ctx) => {
                    // Call original setup if exists
                    const setupResult = component.setup ? component.setup(props, ctx) : {};

                    // Handle emits
                    const emit = (event, ...args) => {
                        this.dispatchEvent(new CustomEvent(event, {
                            detail: args.length === 1 ? args[0] : args,
                            bubbles: true,
                            composed: true,
                        }));
                    };

                    return {
                        ...setupResult,
                        $emit: emit,
                    };
                },
            };

            // Create mount point
            const mountPoint = document.createElement('div');
            this._root.appendChild(mountPoint);

            // Create and mount app
            this._app = createApp(componentInstance, this._props);
            this._app.mount(mountPoint);

            this._mounted = true;
        }

        /**
         * Unmount the KALXJS component
         * @private
         */
        _unmount() {
            if (this._app) {
                this._app.unmount();
                this._app = null;
            }

            if (this._root) {
                this._root.innerHTML = '';
            }

            this._mounted = false;
        }

        /**
         * Get initial props from attributes
         * @private
         */
        _getInitialProps() {
            const props = {};
            const attrs = this.constructor.observedAttributes;

            attrs.forEach(attr => {
                const propName = this.constructor._toCamelCase(attr);
                const value = this.getAttribute(attr);
                props[propName] = this._parseAttributeValue(value);
            });

            return props;
        }

        /**
         * Parse attribute value to appropriate type
         * @private
         */
        _parseAttributeValue(value) {
            if (value === null || value === undefined) {
                return value;
            }

            // Try to parse as JSON for objects/arrays
            if (value.startsWith('{') || value.startsWith('[')) {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            }

            // Parse booleans
            if (value === 'true') return true;
            if (value === 'false') return false;

            // Parse numbers
            if (!isNaN(value) && value.trim() !== '') {
                return Number(value);
            }

            return value;
        }

        /**
         * Inject styles into shadow root
         * @private
         */
        _injectStyles(styles) {
            const styleEl = document.createElement('style');
            styleEl.textContent = styles.join('\n');
            this._root.appendChild(styleEl);
        }

        /**
         * Public API: Update props programmatically
         */
        updateProps(newProps) {
            if (this._props) {
                Object.assign(this._props, newProps);
            }
        }

        /**
         * Public API: Get current props
         */
        getProps() {
            return { ...this._props };
        }
    }

    return KalxCustomElement;
}

/**
 * Register a KALXJS component as a custom element
 *
 * @param {string} tagName - Custom element tag name
 * @param {Object} component - KALXJS component definition
 * @param {Object} options - Configuration options
 *
 * @example
 * ```js
 * import { registerCustomElement } from '@kalxjs/core';
 *
 * registerCustomElement('my-counter', {
 *   setup() {
 *     const count = ref(0);
 *     return { count };
 *   },
 *   template: '<button @click="count++">Count: {{ count }}</button>'
 * });
 *
 * // Use in HTML: <my-counter></my-counter>
 * ```
 */
export function registerCustomElement(tagName, component, options = {}) {
    const CustomElement = defineCustomElement(component, options);
    customElements.define(tagName, CustomElement);
    return CustomElement;
}

/**
 * Batch register multiple custom elements
 *
 * @param {Object} components - Map of tag names to components
 * @param {Object} options - Global options
 */
export function registerCustomElements(components, options = {}) {
    const registered = {};

    for (const [tagName, component] of Object.entries(components)) {
        registered[tagName] = registerCustomElement(tagName, component, options);
    }

    return registered;
}