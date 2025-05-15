// @kalxjs/core - Component setup function

import { setCurrentInstance } from '../composition';

/**
 * Processes the setup function of a component
 * @param {Object} instance - Component instance
 * @param {Object} options - Component options
 * @returns {Object} Setup result
 */
export function processSetup(instance, options) {
    if (!options.setup) {
        return {};
    }

    // Initialize lifecycle hooks arrays
    instance.mounted = [];
    instance.unmounted = [];
    instance.beforeUpdate = [];
    instance.updated = [];

    // Set current instance for composition API
    setCurrentInstance(instance);

    try {
        // Call setup with props and context
        const setupContext = createSetupContext(instance);
        const setupResult = options.setup.call(instance, instance.props || {}, setupContext);

        // Handle different return types
        if (typeof setupResult === 'function') {
            // If setup returns a function, use it as the render function
            instance.render = setupResult;
            return {};
        } else if (setupResult && typeof setupResult === 'object') {
            // If setup returns an object, merge it with the instance
            return setupResult;
        }

        return {};
    } finally {
        // Reset current instance
        setCurrentInstance(null);
    }
}

/**
 * Creates the context object for the setup function
 * @param {Object} instance - Component instance
 * @returns {Object} Setup context
 */
function createSetupContext(instance) {
    return {
        attrs: instance.attrs || {},
        slots: instance.slots || {},
        emit: (event, ...args) => {
            const handler = instance.props[`on${event[0].toUpperCase() + event.slice(1)}`];
            if (handler) {
                handler(...args);
            }
        },
        expose: (exposed) => {
            instance.exposed = exposed;
        }
    };
}