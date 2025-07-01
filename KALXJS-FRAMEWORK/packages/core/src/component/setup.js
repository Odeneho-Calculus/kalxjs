// @kalxjs/core - Component setup function

import { setCurrentInstance } from '../composition';
import { ref } from '../reactivity/reactive';

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

        // Make ref available in the global scope for this execution context
        const globalRef = window.ref;
        window.ref = ref;

        // Props are already made accessible on the instance in createComponent
        console.log('Setup function props:', instance.props);

        let setupResult;
        try {
            setupResult = options.setup.call(instance, instance.props || {}, setupContext);
        } catch (error) {
            console.error('Error in setup function:', error);
            // If the error is about ref not being defined, try again with ref explicitly passed
            if (error.message.includes('ref is not defined')) {
                console.log('Retrying setup with explicit ref parameter');
                // Create a wrapper function that explicitly passes ref
                const setupWithRef = new Function('instance', 'props', 'context', 'ref', `
                    return (${options.setup.toString()}).call(instance, props, context);
                `);
                setupResult = setupWithRef(instance, instance.props || {}, setupContext, ref);
            } else {
                throw error;
            }
        } finally {
            // Restore the original ref (or undefined)
            window.ref = globalRef;
        }

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
        },
        ref: ref  // Make ref function available to the component
    };
}