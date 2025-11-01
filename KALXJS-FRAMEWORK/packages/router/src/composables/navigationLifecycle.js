/**
 * Phase 10: Route Navigation Lifecycle Hooks
 * Fine-grained component-level control over navigation lifecycle
 *
 * Features:
 * - onBeforeNavigate - called when user is about to navigate away
 * - onAfterNavigate - called after navigation completes
 * - onNavigateError - called on navigation error
 * - Automatic cleanup on component unmount
 */

/**
 * Create navigation lifecycle hook manager
 * @param {Object} config
 * @param {Object} config.router - Router instance
 * @returns {Object} Lifecycle management API
 */
export function createNavigationLifecycleManager(config = {}) {
    const { router } = config;

    // Store lifecycle hooks for each component
    const lifecycleHooks = new WeakMap();

    /**
     * Register lifecycle hooks for a component
     * @param {Object} component - Component instance
     * @returns {Object} Hook registration API
     */
    function registerComponentHooks(component) {
        let hooks = lifecycleHooks.get(component);

        if (!hooks) {
            hooks = {
                beforeNavigate: [],
                afterNavigate: [],
                navigationError: []
            };
            lifecycleHooks.set(component, hooks);
        }

        return hooks;
    }

    /**
     * Get hooks for a component
     * @param {Object} component - Component instance
     * @returns {Object|null}
     */
    function getComponentHooks(component) {
        return lifecycleHooks.get(component) || null;
    }

    /**
     * Clear hooks for a component
     * @param {Object} component - Component instance
     */
    function clearComponentHooks(component) {
        lifecycleHooks.delete(component);
    }

    /**
     * Execute all beforeNavigate hooks
     * @param {Object} to - Target route
     * @param {Object} from - Source route
     * @returns {Promise<boolean>} True if navigation should proceed
     */
    async function executeBeforeNavigateHooks(to, from) {
        for (const [component, hooks] of lifecycleHooks) {
            for (const hook of hooks.beforeNavigate) {
                try {
                    const result = await hook(to, from);
                    if (result === false) {
                        console.log('Navigation cancelled by beforeNavigate hook');
                        return false;
                    }
                } catch (error) {
                    console.error('Error in beforeNavigate hook:', error);
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Execute all afterNavigate hooks
     * @param {Object} to - Target route
     * @param {Object} from - Source route
     */
    async function executeAfterNavigateHooks(to, from) {
        for (const [component, hooks] of lifecycleHooks) {
            for (const hook of hooks.afterNavigate) {
                try {
                    await hook(to, from);
                } catch (error) {
                    console.error('Error in afterNavigate hook:', error);
                }
            }
        }
    }

    /**
     * Execute all navigationError hooks
     * @param {Error} error - Navigation error
     * @param {Object} to - Target route
     * @param {Object} from - Source route
     * @returns {Promise<boolean>} True if error was handled
     */
    async function executeNavigationErrorHooks(error, to, from) {
        let handled = false;

        for (const [component, hooks] of lifecycleHooks) {
            for (const hook of hooks.navigationError) {
                try {
                    const result = await hook(error, to, from);
                    if (result === true) {
                        handled = true;
                    }
                } catch (err) {
                    console.error('Error in navigationError hook:', err);
                }
            }
        }

        return handled;
    }

    return {
        registerComponentHooks,
        getComponentHooks,
        clearComponentHooks,
        executeBeforeNavigateHooks,
        executeAfterNavigateHooks,
        executeNavigationErrorHooks,
        lifecycleHooks
    };
}

/**
 * Create useNavigationLifecycle composable
 * @param {Object} config
 * @returns {Function} Hook function for use in components
 */
export function createUseNavigationLifecycle(config = {}) {
    const { lifecycleManager } = config;

    if (!lifecycleManager) {
        throw new Error('lifecycleManager is required');
    }

    /**
     * Use navigation lifecycle hooks in a component
     * @param {Object} component - Component instance
     * @returns {Object} Hook API
     */
    function useNavigationLifecycle(component) {
        const hooks = lifecycleManager.registerComponentHooks(component);

        return {
            /**
             * Hook called when user is about to navigate away
             * Return false to prevent navigation
             * @param {Function} callback
             */
            onBeforeNavigate(callback) {
                hooks.beforeNavigate.push(callback);

                // Return cleanup function
                return () => {
                    const idx = hooks.beforeNavigate.indexOf(callback);
                    if (idx > -1) {
                        hooks.beforeNavigate.splice(idx, 1);
                    }
                };
            },

            /**
             * Hook called after navigation completes
             * @param {Function} callback
             */
            onAfterNavigate(callback) {
                hooks.afterNavigate.push(callback);

                // Return cleanup function
                return () => {
                    const idx = hooks.afterNavigate.indexOf(callback);
                    if (idx > -1) {
                        hooks.afterNavigate.splice(idx, 1);
                    }
                };
            },

            /**
             * Hook called on navigation error
             * Return true to mark error as handled
             * @param {Function} callback
             */
            onNavigationError(callback) {
                hooks.navigationError.push(callback);

                // Return cleanup function
                return () => {
                    const idx = hooks.navigationError.indexOf(callback);
                    if (idx > -1) {
                        hooks.navigationError.splice(idx, 1);
                    }
                };
            },

            /**
             * Clear all hooks for this component
             */
            clear() {
                lifecycleManager.clearComponentHooks(component);
            }
        };
    }

    return useNavigationLifecycle;
}

/**
 * Integrate lifecycle hooks into router
 * @param {Object} router - Router instance
 * @returns {Object} Lifecycle manager with integrated router
 */
export function integrateNavigationLifecycle(router) {
    const lifecycleManager = createNavigationLifecycleManager({ router });

    // Hook into router guards
    router.beforeEach?.((to, from, next) => {
        lifecycleManager.executeBeforeNavigateHooks(to, from)
            .then((shouldProceed) => {
                if (shouldProceed) {
                    next();
                }
            })
            .catch((error) => {
                console.error('Error in beforeNavigate:', error);
            });
    });

    router.afterEach?.((to, from) => {
        lifecycleManager.executeAfterNavigateHooks(to, from);
    });

    // Handle errors
    if (router.onNavigationError) {
        router.onNavigationError((error, to, from) => {
            lifecycleManager.executeNavigationErrorHooks(error, to, from);
        });
    }

    return lifecycleManager;
}

/**
 * Example component usage:
 *
 * const component = defineComponent({
 *   setup(props, context) {
 *     const lifecycle = useNavigationLifecycle(component);
 *
 *     // Warn on unsaved changes
 *     lifecycle.onBeforeNavigate(async (to, from) => {
 *       if (hasUnsavedChanges) {
 *         return confirm('You have unsaved changes. Continue?');
 *       }
 *     });
 *
 *     // Track page views
 *     lifecycle.onAfterNavigate((to, from) => {
 *       analytics.track('page_view', { page: to.name });
 *     });
 *
 *     // Handle errors
 *     lifecycle.onNavigationError((error, to, from) => {
 *       console.error('Navigation failed:', error);
 *       return true; // Mark as handled
 *     });
 *
 *     // Cleanup on unmount
 *     onBeforeUnmount(() => {
 *       lifecycle.clear();
 *     });
 *
 *     return { /* template */ };
 *   }
 * });
 */

export default createNavigationLifecycleManager;