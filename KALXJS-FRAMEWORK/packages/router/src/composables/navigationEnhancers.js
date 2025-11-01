/**
 * Navigation Enhancement Functions
 * Enhance base router navigation methods with reactivity and transition tracking
 *
 * @module composables/navigationEnhancers
 */

/**
 * Create enhanced navigation functions with transition tracking
 *
 * @param {Object} config - Configuration object
 * @param {Object} config.baseRouter - Base router instance
 * @param {Object} config.reactiveRoute - Reactive route state
 * @param {Object} config.transition - Transition state
 * @param {Function} config.executePreload - Preload hook executor
 * @param {Function} config.notifyRouteSubscribers - Route subscriber notifier
 *
 * @returns {Object} Object with enhanced navigation methods
 */
export function createNavigationEnhancers({
    baseRouter,
    reactiveRoute,
    transition,
    executePreload,
    notifyRouteSubscribers
}) {
    /**
     * Enhanced push with transition tracking and preloading
     *
     * @param {string|Object} location - Route location or path string
     * @returns {Promise} Navigation promise
     */
    const enhancedPush = async (location) => {
        transition.isLoading = true;
        transition.reason = 'navigation';
        transition.error = null;
        transition.from = { ...reactiveRoute.data.value };
        transition.startTime = Date.now();

        try {
            // Execute base push
            const result = await baseRouter.push(location);

            // Update reactive route
            reactiveRoute.update(baseRouter.currentRoute);

            // Try to execute preload hook for new route
            const preloadedData = await executePreload(baseRouter.currentRoute);

            // Store preloaded data in route state if available
            if (preloadedData) {
                reactiveRoute.setState({
                    ...baseRouter.currentRoute.state,
                    _preloadedData: preloadedData
                });
            }

            transition.isLoading = false;
            transition.reason = null;
            notifyRouteSubscribers();

            return result;
        } catch (err) {
            transition.isLoading = false;
            transition.error = err;
            transition.reason = null;
            console.error('Navigation error:', err);
            throw err;
        }
    };

    /**
     * Enhanced replace with transition tracking
     *
     * @param {string|Object} location - Route location or path string
     * @returns {Promise} Navigation promise
     */
    const enhancedReplace = async (location) => {
        transition.isLoading = true;
        transition.reason = 'navigation';
        transition.error = null;
        transition.startTime = Date.now();

        try {
            const result = await baseRouter.replace(location);
            reactiveRoute.update(baseRouter.currentRoute);

            const preloadedData = await executePreload(baseRouter.currentRoute);
            if (preloadedData) {
                reactiveRoute.setState({
                    ...baseRouter.currentRoute.state,
                    _preloadedData: preloadedData
                });
            }

            transition.isLoading = false;
            transition.reason = null;
            notifyRouteSubscribers();

            return result;
        } catch (err) {
            transition.isLoading = false;
            transition.error = err;
            transition.reason = null;
            throw err;
        }
    };

    /**
     * Enhanced go with transition tracking
     *
     * @param {number} delta - Steps to go in history
     * @returns {Promise} Navigation promise
     */
    const enhancedGo = async (delta) => {
        transition.isLoading = true;
        transition.reason = 'navigation';
        transition.error = null;

        try {
            baseRouter.go(delta);
            // Wait for popstate event to settle
            await new Promise(resolve => setTimeout(resolve, 50));

            reactiveRoute.update(baseRouter.currentRoute);
            transition.isLoading = false;
            transition.reason = null;
            notifyRouteSubscribers();
        } catch (err) {
            transition.isLoading = false;
            transition.error = err;
            transition.reason = null;
            throw err;
        }
    };

    /**
     * Enhanced back
     *
     * @returns {Promise} Navigation promise
     */
    const enhancedBack = () => enhancedGo(-1);

    /**
     * Enhanced forward
     *
     * @returns {Promise} Navigation promise
     */
    const enhancedForward = () => enhancedGo(1);

    return {
        enhancedPush,
        enhancedReplace,
        enhancedGo,
        enhancedBack,
        enhancedForward
    };
}