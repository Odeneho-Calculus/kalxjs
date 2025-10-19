/**
 * KALXJS Dynamic Component Implementation
 * Enables dynamic component rendering with <component :is="">
 * Similar to Vue 3's dynamic component system
 *
 * @module @kalxjs/core/component/dynamic
 */

import { getCurrentInstance } from '../../composition.js';
import { isString, isObject } from '../../utils.js';
import { h } from '../../vdom/index.js';

/**
 * Dynamic Component
 * Dynamically renders a component based on the 'is' prop
 *
 * @example
 * ```js
 * import { DynamicComponent } from '@kalxjs/core';
 *
 * const app = {
 *   template: `
 *     <DynamicComponent :is="currentComponent" :prop1="value" />
 *   `,
 *   data() {
 *     return { currentComponent: 'ComponentA' };
 *   }
 * };
 * ```
 */
export const DynamicComponent = {
    name: 'DynamicComponent',

    props: {
        // The component to render (string name or component object)
        is: {
            type: [String, Object, Function],
            required: true
        }
    },

    setup(props, { attrs, slots }) {
        const instance = getCurrentInstance();

        return () => {
            const { is, ...restProps } = props;

            if (!is) {
                console.warn('[KALXJS] DynamicComponent: "is" prop is required');
                return null;
            }

            // Resolve the component
            let component = is;

            // If it's a string, try to resolve from registered components
            if (isString(is)) {
                const components = instance?.components || {};
                component = components[is];

                if (!component) {
                    console.warn(`[KALXJS] DynamicComponent: Component "${is}" not found`);
                    return null;
                }
            }

            // Create vnode for the dynamic component
            return h(component, {
                ...attrs,
                ...restProps
            }, slots);
        };
    }
};

/**
 * Helper to create a dynamic component
 *
 * @param {string|object|function} component - Component to render
 * @param {object} props - Props to pass to the component
 * @param {object} slots - Slots to pass to the component
 * @returns {VNode}
 *
 * @example
 * ```js
 * const vnode = resolveDynamicComponent('MyComponent', { prop: 'value' });
 * ```
 */
export function resolveDynamicComponent(component, props = {}, slots = {}) {
    if (!component) {
        return null;
    }

    // If it's already a component object, return it
    if (isObject(component) && (component.render || component.setup || component.template)) {
        return h(component, props, slots);
    }

    // If it's a function, it might be a functional component
    if (typeof component === 'function') {
        return h(component, props, slots);
    }

    console.warn('[KALXJS] resolveDynamicComponent: Invalid component type', component);
    return null;
}

/**
 * Component helper for checking if a value is a valid component
 *
 * @param {*} value - Value to check
 * @returns {boolean}
 */
export function isComponent(value) {
    if (!value) return false;

    // Check if it's a component object
    if (isObject(value)) {
        return !!(value.render || value.setup || value.template || value.name);
    }

    // Check if it's a functional component
    if (typeof value === 'function') {
        return true;
    }

    return false;
}

/**
 * Async component loader
 * Loads components dynamically with loading/error states
 *
 * @param {function} loader - Async function that returns a component
 * @param {object} options - Loading options
 * @returns {object} - Component definition
 *
 * @example
 * ```js
 * const AsyncComp = defineAsyncComponent(() => import('./MyComponent.js'));
 *
 * // With options
 * const AsyncComp = defineAsyncComponent({
 *   loader: () => import('./MyComponent.js'),
 *   loadingComponent: LoadingSpinner,
 *   errorComponent: ErrorDisplay,
 *   delay: 200,
 *   timeout: 3000
 * });
 * ```
 */
export function defineAsyncComponent(source) {
    // If source is a function, wrap it in options
    if (typeof source === 'function') {
        source = { loader: source };
    }

    const {
        loader,
        loadingComponent,
        errorComponent,
        delay = 200,
        timeout = Infinity,
        suspensible = true,
        onError
    } = source;

    let resolvedComp = null;
    let loadingTimer = null;
    let timeoutTimer = null;

    const load = () => {
        return loader()
            .then(comp => {
                // Handle ES modules default export
                resolvedComp = comp.default || comp;
                return resolvedComp;
            })
            .catch(err => {
                if (onError) {
                    return new Promise((resolve, reject) => {
                        const retry = () => resolve(load());
                        const fail = () => reject(err);
                        onError(err, retry, fail);
                    });
                }
                throw err;
            });
    };

    return {
        name: 'AsyncComponent',

        setup() {
            const loaded = { value: false };
            const error = { value: null };
            const loading = { value: false };

            // Start loading
            const loadPromise = load()
                .then(() => {
                    loaded.value = true;
                    loading.value = false;
                })
                .catch(err => {
                    error.value = err;
                    loading.value = false;
                });

            // Set loading state after delay
            if (delay > 0) {
                loadingTimer = setTimeout(() => {
                    if (!loaded.value && !error.value) {
                        loading.value = true;
                    }
                }, delay);
            } else {
                loading.value = true;
            }

            // Set timeout
            if (timeout !== Infinity) {
                timeoutTimer = setTimeout(() => {
                    if (!loaded.value && !error.value) {
                        error.value = new Error(`Async component timed out after ${timeout}ms`);
                        loading.value = false;
                    }
                }, timeout);
            }

            return () => {
                // Clear timers on unmount
                if (loadingTimer) clearTimeout(loadingTimer);
                if (timeoutTimer) clearTimeout(timeoutTimer);

                // Show error component
                if (error.value && errorComponent) {
                    return createVNode(errorComponent, { error: error.value });
                }

                // Show loading component
                if (loading.value && loadingComponent) {
                    return createVNode(loadingComponent);
                }

                // Show resolved component
                if (resolvedComp) {
                    return createVNode(resolvedComp);
                }

                return null;
            };
        }
    };
}

export default DynamicComponent;