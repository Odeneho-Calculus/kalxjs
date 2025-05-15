// packages/core/src/lifecycle/index.js

/**
 * Lifecycle hooks system for kalxjs components
 * This module provides the lifecycle hook functionality to components
 */

/**
 * Available lifecycle hooks in a kalxjs component
 */
export const LifecycleHooks = {
    BEFORE_CREATE: 'beforeCreate',
    CREATED: 'created',
    BEFORE_MOUNT: 'beforeMount',
    MOUNTED: 'mounted',
    BEFORE_UPDATE: 'beforeUpdate',
    UPDATED: 'updated',
    BEFORE_UNMOUNT: 'beforeUnmount',
    UNMOUNTED: 'unmounted'
};

/**
 * Register lifecycle hooks for a component
 * @param {Object} component - Component instance
 * @param {Object} options - Component options containing lifecycle hooks
 */
export function registerLifecycleHooks(component, options) {
    for (const hook in LifecycleHooks) {
        const hookName = LifecycleHooks[hook];
        if (options[hookName]) {
            component[hookName] = options[hookName].bind(component);
        } else {
            component[hookName] = () => { };
        }
    }
}

/**
 * Calls a lifecycle hook on a component
 * @param {Object} component - Component instance
 * @param {string} hook - Hook name
 * @param {Array} args - Arguments to pass to the hook
 */
export function callHook(component, hook, args = []) {
    // Handle both component options style and direct method style
    const handler = component.$options?.[hook] || component[hook];

    if (handler) {
        try {
            return handler.call(component, ...(args || []));
        } catch (error) {
            console.error(`Error in lifecycle hook "${hook}":`, error);
        }
    }
}

/**
 * Creates a mixin to extend component lifecycle hooks
 * @param {Object} hooks - Object containing lifecycle hooks
 * @returns {Object} Mixin object
 */
export function createLifecycleMixin(hooks) {
    const mixin = {};

    for (const hook in hooks) {
        if (Object.values(LifecycleHooks).includes(hook)) {
            const originalHook = mixin[hook];
            const mixinHook = hooks[hook];

            mixin[hook] = function (...args) {
                // Call original hook if exists
                if (originalHook) {
                    originalHook.apply(this, args);
                }

                // Call mixin hook
                return mixinHook.apply(this, args);
            };
        }
    }

    return mixin;
}

/**
 * Applies mixins to a component definition
 * @param {Object} componentOptions - Component options
 * @param {Array|Object} mixins - Mixins to apply
 * @returns {Object} Enhanced component options
 */
export function applyMixins(componentOptions, mixins) {
    if (!mixins) return componentOptions;

    // Convert single mixin to array
    if (!Array.isArray(mixins)) {
        mixins = [mixins];
    }

    const result = { ...componentOptions };

    // Apply each mixin
    mixins.forEach(mixin => {
        // Merge lifecycle hooks
        for (const hook in LifecycleHooks) {
            const hookName = LifecycleHooks[hook];

            if (mixin[hookName]) {
                const existing = result[hookName];

                if (existing) {
                    // Create function that calls both hooks
                    result[hookName] = function (...args) {
                        mixin[hookName].apply(this, args);
                        existing.apply(this, args);
                    };
                } else {
                    result[hookName] = mixin[hookName];
                }
            }
        }

        // Merge methods
        if (mixin.methods) {
            result.methods = result.methods || {};
            Object.assign(result.methods, mixin.methods);
        }

        // Merge computed properties
        if (mixin.computed) {
            result.computed = result.computed || {};
            Object.assign(result.computed, mixin.computed);
        }
    });

    return result;
}