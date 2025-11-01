/**
 * Preload Hook Management
 * Handles route-level data preloading before component mount
 *
 * @module composables/preloadHooks
 */

/**
 * Create preload hook management system
 * Allows registering and executing data preload hooks per route
 *
 * @param {Object} config - Configuration object
 * @param {Object} config.transition - Transition state object
 *
 * @returns {Object} Preload management object with register and execute functions
 */
export function createPreloadManager({ transition }) {
    const preloadHooks = new Map();

    /**
     * Register a preload handler for a specific route
     *
     * @param {string} routeName - Route name to attach preload hook to
     * @param {Function} hook - Async function that returns preloaded data
     *   Hook receives: (params, route) => Promise<data>
     *
     * Example:
     * ```javascript
     * router.registerPreload('userProfile', async (params) => {
     *   const userData = await fetchUser(params.id);
     *   return { user: userData };
     * });
     * ```
     */
    const registerPreload = (routeName, hook) => {
        if (typeof hook !== 'function') {
            console.warn(`Preload hook for route "${routeName}" must be a function`);
            return;
        }
        preloadHooks.set(routeName, hook);
    };

    /**
     * Execute preload hook for a route if registered
     *
     * @param {Object} route - Route object to preload
     * @returns {Promise<*>} Preloaded data or null if no hook registered
     */
    const executePreload = async (route) => {
        const hook = preloadHooks.get(route.name);
        if (!hook || typeof hook !== 'function') {
            return null;
        }

        transition.isPending = true;
        transition.reason = 'preload';

        try {
            const preloadedData = await hook(route.params, route);
            transition.isPending = false;
            return preloadedData;
        } catch (err) {
            transition.error = err;
            transition.isPending = false;
            console.error('Error in route preload:', err);
            throw err;
        }
    };

    /**
     * Get all registered preload hooks
     *
     * @returns {Map} Map of route names to preload hook functions
     */
    const getHooks = () => preloadHooks;

    /**
     * Remove preload hook for a route
     *
     * @param {string} routeName - Route name to unregister
     */
    const unregisterPreload = (routeName) => {
        preloadHooks.delete(routeName);
    };

    /**
     * Clear all preload hooks
     */
    const clearPreloads = () => {
        preloadHooks.clear();
    };

    return {
        registerPreload,
        executePreload,
        getHooks,
        unregisterPreload,
        clearPreloads
    };
}