/**
 * Phase 7: Lazy Route Loading with Hooks
 * Provides automatic code splitting with loading/error state tracking
 *
 * Features:
 * - Lazy component loading
 * - Automatic loading state management
 * - Error boundary support
 * - Progress tracking during load
 */

import { ref, defineComponent } from '@kalxjs/core';

/**
 * Create a lazy-loaded route component with automatic state tracking
 * @param {Function} importFn - Dynamic import function
 * @param {Object} options
 * @param {Object} options.loadingComponent - Component to show while loading
 * @param {Object} options.errorComponent - Component to show on error
 * @param {number} options.delay - Delay before showing loading component (ms)
 * @param {number} options.timeout - Timeout before showing error (ms)
 * @returns {Object} Lazy component with loading state
 */
export function lazyRoute(importFn, options = {}) {
    const {
        loadingComponent = null,
        errorComponent = null,
        delay = 200,
        timeout = 10000
    } = options;

    const isLoading = ref(false);
    const error = ref(null);
    const component = ref(null);
    let loadingTimer = null;
    let timeoutTimer = null;

    /**
     * Load the component
     */
    async function loadComponent() {
        isLoading.value = true;
        error.value = null;

        try {
            // Create delay timer
            await new Promise((resolve) => {
                loadingTimer = setTimeout(resolve, delay);
            });

            // Create timeout
            const timeoutPromise = new Promise((_, reject) => {
                timeoutTimer = setTimeout(() => {
                    reject(new Error(`Component lazy load timeout (${timeout}ms)`));
                }, timeout);
            });

            // Race between import and timeout
            const imported = await Promise.race([
                importFn(),
                timeoutPromise
            ]);

            clearTimeout(timeoutTimer);
            component.value = imported.default || imported;
            isLoading.value = false;

        } catch (err) {
            clearTimeout(timeoutTimer);
            error.value = err;
            isLoading.value = false;
            throw err;
        }
    }

    /**
     * Create wrapper component that handles loading/error states
     */
    const WrappedComponent = defineComponent({
        async setup(props, context) {
            // Load component on mount
            if (!component.value && !error.value) {
                try {
                    await loadComponent();
                } catch (err) {
                    console.error('Lazy route load error:', err);
                }
            }

            return () => {
                // Show error component if failed
                if (error.value && errorComponent) {
                    return errorComponent;
                }

                // Show loading component if still loading
                if (isLoading.value && loadingComponent) {
                    return loadingComponent;
                }

                // Show actual component when ready
                if (component.value) {
                    const Comp = component.value;
                    return Comp.setup
                        ? Comp.setup(props, context)
                        : Comp;
                }

                // Fallback
                return null;
            };
        }
    });

    // Expose state for external tracking
    WrappedComponent._lazyState = {
        isLoading,
        error,
        component
    };

    return WrappedComponent;
}

/**
 * Register lazy loading state in router
 * @param {Object} router - Router instance
 * @param {Object} lazyRoutes - Map of route names to lazy state
 */
export function registerLazyLoadingState(router, lazyRoutes = {}) {
    const lazyStates = new Map();

    /**
     * Track lazy component state
     * @param {string} routeName
     * @param {Object} state - Lazy state object
     */
    function registerLazyState(routeName, state) {
        lazyStates.set(routeName, state);
    }

    /**
     * Get lazy state for route
     * @param {string} routeName
     * @returns {Object|null}
     */
    function getLazyState(routeName) {
        return lazyStates.get(routeName) || null;
    }

    /**
     * Check if any lazy routes are loading
     * @returns {boolean}
     */
    function isAnyLazyLoading() {
        for (const state of lazyStates.values()) {
            if (state.isLoading?.value) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get all errors from lazy routes
     * @returns {Array<Error>}
     */
    function getLazyErrors() {
        const errors = [];
        for (const state of lazyStates.values()) {
            if (state.error?.value) {
                errors.push(state.error.value);
            }
        }
        return errors;
    }

    // Initialize with provided lazy routes
    Object.entries(lazyRoutes).forEach(([name, state]) => {
        registerLazyState(name, state);
    });

    return {
        registerLazyState,
        getLazyState,
        isAnyLazyLoading,
        getLazyErrors,
        lazyStates
    };
}

/**
 * Create a composable for accessing lazy loading state
 * @param {Object} config
 * @param {Map} config.lazyStates - Lazy states map
 * @returns {Function} useLazyRoute composable
 */
export function createUseLazyRoute(config = {}) {
    const { lazyStates = new Map() } = config;

    return function useLazyRoute(routeName) {
        const state = lazyStates.get(routeName);

        if (!state) {
            console.warn(`Lazy route state not found for: ${routeName}`);
            return {
                isLoading: ref(false),
                error: ref(null),
                component: ref(null)
            };
        }

        return {
            isLoading: state.isLoading,
            error: state.error,
            component: state.component,

            /**
             * Reload the lazy component
             */
            async reload() {
                state.isLoading.value = true;
                state.error.value = null;
                try {
                    // Re-import component
                    await state.load?.();
                } catch (err) {
                    state.error.value = err;
                }
            }
        };
    };
}

export default lazyRoute;