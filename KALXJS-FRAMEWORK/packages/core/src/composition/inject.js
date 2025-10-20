import { getCurrentInstance } from './instance.js';

// Symbol for internal provide/inject
const PROVIDE_KEY = Symbol('provide');

/**
 * Provide a value that can be injected by descendant components
 * @param {string|symbol} key - The key to provide the value under
 * @param {*} value - The value to provide
 */
export function provide(key, value) {
    const instance = getCurrentInstance();
    if (!instance) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('provide() can only be used inside a setup function.');
        }
        return;
    }

    // Initialize provides map if it doesn't exist
    if (!instance[PROVIDE_KEY]) {
        instance[PROVIDE_KEY] = {};
    }

    instance[PROVIDE_KEY][key] = value;
}

/**
 * Inject a value provided by an ancestor component
 * @param {string|symbol} key - The key to inject
 * @param {*} defaultValue - Default value if key is not found
 * @param {boolean} treatDefaultAsFactory - Whether to treat defaultValue as a factory function
 * @returns {*} The injected value or default value
 */
export function inject(key, defaultValue, treatDefaultAsFactory = false) {
    const instance = getCurrentInstance();
    if (!instance) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('inject() can only be used inside a setup function.');
        }
        return defaultValue;
    }

    // Walk up the component tree to find the provided value
    let current = instance.parent;
    while (current) {
        if (current[PROVIDE_KEY] && key in current[PROVIDE_KEY]) {
            return current[PROVIDE_KEY][key];
        }
        current = current.parent;
    }

    // Check if the app instance has the provided value
    if (instance.appContext && instance.appContext.provides && key in instance.appContext.provides) {
        return instance.appContext.provides[key];
    }

    // Return default value
    if (arguments.length > 1) {
        return treatDefaultAsFactory && typeof defaultValue === 'function'
            ? defaultValue()
            : defaultValue;
    } else if (process.env.NODE_ENV !== 'production') {
        console.warn(`Injection "${String(key)}" not found.`);
    }
}

/**
 * Check if a key has been provided
 * @param {string|symbol} key - The key to check
 * @returns {boolean} Whether the key has been provided
 */
export function hasInjectionContext() {
    return !!getCurrentInstance();
}

/**
 * Application-level provide
 * This is used by app.provide()
 * @param {Object} app - The app instance
 * @param {string|symbol} key - The key to provide
 * @param {*} value - The value to provide
 */
export function appProvide(app, key, value) {
    if (!app.provides) {
        app.provides = {};
    }
    app.provides[key] = value;
}

/**
 * Internal function to check if a value is provided at any level
 * @param {string|symbol} key - The key to check
 * @returns {boolean} Whether the key is provided
 */
export function hasInjection(key) {
    const instance = getCurrentInstance();
    if (!instance) {
        return false;
    }

    // Check current component tree
    let current = instance.parent;
    while (current) {
        if (current[PROVIDE_KEY] && key in current[PROVIDE_KEY]) {
            return true;
        }
        current = current.parent;
    }

    // Check app-level provides
    if (instance.appContext && instance.appContext.provides && key in instance.appContext.provides) {
        return true;
    }

    return false;
}