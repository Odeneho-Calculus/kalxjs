// packages/core/src/renderer/index.js

import { createCustomRenderer } from './custom-renderer.js';

/**
 * Creates a new renderer
 * @param {Object} options - Renderer options
 * @param {Object} options.router - KalxJS router instance
 * @param {Object} options.store - KalxJS store instance
 * @param {boolean} options.useCustomRenderer - Whether to use the custom renderer
 * @returns {Object} Renderer instance
 */
export function createRenderer(options = {}) {
    const { router, store, useCustomRenderer = true } = options;

    if (useCustomRenderer) {
        return createCustomRenderer(router, store);
    } else {
        // Use the default virtual DOM renderer
        // This is just a placeholder for backward compatibility
        console.warn('Using default virtual DOM renderer. Consider switching to the custom renderer for better performance.');
        return {
            init: () => {
                console.warn('Default renderer does not have an init method. Rendering will be handled by the component system.');
            }
        };
    }
}

export { createCustomRenderer };