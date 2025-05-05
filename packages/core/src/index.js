// Core functionality imports
import { reactive, ref, computed, effect } from './reactivity/reactive';
import { h, createElement, updateElement } from './vdom/vdom';
import { createComponent, defineComponent, createApp } from './component/component';

/**
 * Main entry point for kalxjs framework
 */
function createAppInstance(options) {
    const app = createApp(options);

    // Add plugin support
    app.use = function (plugin, options = {}) {
        if (!plugin) return this;

        if (typeof plugin.install === 'function') {
            plugin.install(this, options);
        } else if (typeof plugin === 'function') {
            plugin(this, options);
        }
        return this;
    };

    return app;
}

const kalxjs = {
    // Reactivity system
    reactive,
    ref,
    computed,
    effect,

    // Virtual DOM
    h,
    createElement,

    // Component system
    createComponent,
    defineComponent,

    // Version
    version: '0.1.0',

    /**
     * Creates a new kalxjs application
     * @param {Object} options - Application options
     * @returns {Object} Application instance
     */
    createApp(options) {
        return createApp(options);
    }
};

export default kalxjs;

// Export individual APIs
export {
    // Reactivity
    reactive,
    ref,
    computed,
    effect,

    // Virtual DOM
    h,
    createElement,
    updateElement,

    // Component
    createComponent,
    defineComponent,
    createAppInstance as createApp
};

// Additional exports
export * from './component';
export * from './vdom';
export * from './lifecycle';
export * from './reactivity';
