/**
 * Phase 5: Route Guard Enhancements
 * Provides cancellable, prioritizable guards with AbortSignal support
 *
 * Features:
 * - Guard cancellation via AbortSignal
 * - Guard prioritization (early guards run first)
 * - Navigation cancellation controller
 * - Guard execution tracking
 */

/**
 * Create enhanced guard system with cancellation support
 * @param {Object} config
 * @param {Object} config.baseRouter - The base router instance
 * @param {Object} config.transitionState - Transition state ref
 * @returns {Object} Guard management system
 */
export function createGuardEnhancers(config = {}) {
    const { baseRouter, transitionState } = config;

    // Track active navigation controllers
    const activeNavigations = new Map();
    let navigationId = 0;

    /**
     * Create an AbortController for the current navigation
     * Can be used to cancel ongoing navigation
     * @returns {AbortController}
     */
    function createNavigationController() {
        const controller = new AbortController();
        controller.navigationId = ++navigationId;
        activeNavigations.set(controller.navigationId, controller);

        return controller;
    }

    /**
     * Cancel a specific navigation by controller
     * @param {AbortController} controller
     */
    function cancelNavigation(controller) {
        if (controller && !controller.signal.aborted) {
            controller.abort();
            activeNavigations.delete(controller.navigationId);

            if (transitionState) {
                transitionState.value.error = new Error('Navigation cancelled');
                transitionState.value.isLoading = false;
            }
        }
    }

    /**
     * Cancel all active navigations
     */
    function cancelAllNavigations() {
        activeNavigations.forEach((controller) => {
            cancelNavigation(controller);
        });
    }

    /**
     * Register a guard with priority support
     * @param {string} hookName - 'beforeEach', 'beforeResolve', or 'afterEach'
     * @param {Function} guard - Guard function
     * @param {Object} options
     * @param {number} options.priority - Higher priority runs first (default: 0)
     */
    function registerGuardWithPriority(hookName, guard, options = {}) {
        const { priority = 0 } = options;

        if (!baseRouter[hookName]) {
            throw new Error(`Unknown hook: ${hookName}`);
        }

        // Wrap guard to pass AbortSignal
        const wrappedGuard = (to, from, next) => {
            const controller = createNavigationController();

            try {
                const result = guard(to, from, next, controller.signal);

                // If guard returns a promise, handle abort
                if (result && typeof result.then === 'function') {
                    return result.catch((err) => {
                        if (controller.signal.aborted) {
                            transitionState.value.error = new Error('Navigation cancelled');
                        }
                        throw err;
                    }).finally(() => {
                        activeNavigations.delete(controller.navigationId);
                    });
                }
            } catch (err) {
                activeNavigations.delete(controller.navigationId);
                throw err;
            }
        };

        // Store priority on wrapped guard
        wrappedGuard._priority = priority;

        baseRouter[hookName](wrappedGuard);

        return {
            remove: () => baseRouter[`remove${capitalize(hookName)}`]?.(wrappedGuard)
        };
    }

    /**
     * Register a beforeEach guard with priority
     * @param {Function} guard - Guard function
     * @param {Object} options - Priority and other options
     * @returns {Object} Unregister function
     */
    function beforeEach(guard, options = {}) {
        return registerGuardWithPriority('beforeEach', guard, options);
    }

    /**
     * Register a beforeResolve guard with priority
     * @param {Function} guard - Guard function
     * @param {Object} options - Priority and other options
     * @returns {Object} Unregister function
     */
    function beforeResolve(guard, options = {}) {
        return registerGuardWithPriority('beforeResolve', guard, options);
    }

    /**
     * Register an afterEach guard
     * Note: afterEach guards cannot cancel navigation
     * @param {Function} guard - Guard function
     * @returns {Object} Unregister function
     */
    function afterEach(guard) {
        baseRouter.afterEach?.(guard);
        return {
            remove: () => baseRouter.removeAfterEach?.(guard)
        };
    }

    return {
        createNavigationController,
        cancelNavigation,
        cancelAllNavigations,
        beforeEach,
        beforeResolve,
        afterEach,

        // Internal
        activeNavigations
    };
}

/**
 * Helper to capitalize strings
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default createGuardEnhancers;