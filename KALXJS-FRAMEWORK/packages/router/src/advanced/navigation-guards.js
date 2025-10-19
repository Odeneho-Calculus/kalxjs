/**
 * KALXJS Advanced Router - Navigation Guards
 * Comprehensive navigation guard system (global, per-route, in-component)
 *
 * @module @kalxjs/router/advanced/navigation-guards
 */

/**
 * Navigation guard types
 */
export const GuardType = {
    GLOBAL_BEFORE: 'global-before',
    GLOBAL_AFTER: 'global-after',
    GLOBAL_RESOLVE: 'global-resolve',
    ROUTE_BEFORE: 'route-before',
    COMPONENT_BEFORE: 'component-before',
    COMPONENT_LEAVE: 'component-leave',
};

/**
 * Navigation guard manager
 */
export class NavigationGuardManager {
    constructor() {
        this.guards = {
            [GuardType.GLOBAL_BEFORE]: [],
            [GuardType.GLOBAL_AFTER]: [],
            [GuardType.GLOBAL_RESOLVE]: [],
        };
    }

    /**
     * Register global before guard
     * Runs before every navigation
     *
     * @param {Function} guard - Guard function (to, from, next)
     * @returns {Function} Unregister function
     */
    beforeEach(guard) {
        this.guards[GuardType.GLOBAL_BEFORE].push(guard);

        return () => {
            const index = this.guards[GuardType.GLOBAL_BEFORE].indexOf(guard);
            if (index > -1) {
                this.guards[GuardType.GLOBAL_BEFORE].splice(index, 1);
            }
        };
    }

    /**
     * Register global after guard
     * Runs after every navigation (cannot affect navigation)
     *
     * @param {Function} guard - Guard function (to, from)
     * @returns {Function} Unregister function
     */
    afterEach(guard) {
        this.guards[GuardType.GLOBAL_AFTER].push(guard);

        return () => {
            const index = this.guards[GuardType.GLOBAL_AFTER].indexOf(guard);
            if (index > -1) {
                this.guards[GuardType.GLOBAL_AFTER].splice(index, 1);
            }
        };
    }

    /**
     * Register global resolve guard
     * Runs after all in-component guards and async route components are resolved
     *
     * @param {Function} guard - Guard function (to, from, next)
     * @returns {Function} Unregister function
     */
    beforeResolve(guard) {
        this.guards[GuardType.GLOBAL_RESOLVE].push(guard);

        return () => {
            const index = this.guards[GuardType.GLOBAL_RESOLVE].indexOf(guard);
            if (index > -1) {
                this.guards[GuardType.GLOBAL_RESOLVE].splice(index, 1);
            }
        };
    }

    /**
     * Execute navigation guards
     *
     * @param {string} type - Guard type
     * @param {Object} to - Target route
     * @param {Object} from - Current route
     * @returns {Promise<any>} Guard result
     */
    async executeGuards(type, to, from) {
        const guards = this.guards[type] || [];

        for (const guard of guards) {
            const result = await this.executeGuard(guard, to, from);

            // Handle guard result
            if (result === false) {
                // Cancel navigation
                return false;
            } else if (result && typeof result === 'object') {
                // Redirect to different route
                return result;
            }
            // Continue to next guard
        }

        return true;
    }

    /**
     * Execute single guard
     * @private
     */
    executeGuard(guard, to, from) {
        return new Promise((resolve) => {
            const next = (result) => {
                resolve(result);
            };

            // Call guard with next callback
            const guardResult = guard(to, from, next);

            // If guard returns a promise, wait for it
            if (guardResult && typeof guardResult.then === 'function') {
                guardResult.then(resolve).catch(() => resolve(false));
            } else if (guardResult !== undefined) {
                resolve(guardResult);
            }
            // Otherwise wait for next() to be called
        });
    }

    /**
     * Extract route guards from route configuration
     *
     * @param {Object} route - Route object
     * @returns {Object} Route guards
     */
    extractRouteGuards(route) {
        return {
            beforeEnter: route.beforeEnter || [],
        };
    }

    /**
     * Extract component guards
     *
     * @param {Object} component - Component instance
     * @returns {Object} Component guards
     */
    extractComponentGuards(component) {
        if (!component) {
            return {};
        }

        return {
            beforeRouteEnter: component.beforeRouteEnter,
            beforeRouteUpdate: component.beforeRouteUpdate,
            beforeRouteLeave: component.beforeRouteLeave,
        };
    }

    /**
     * Run complete navigation guard pipeline
     *
     * @param {Object} to - Target route
     * @param {Object} from - Current route
     * @param {Object} options - Additional options
     * @returns {Promise<boolean|Object>} Navigation result
     */
    async runGuardPipeline(to, from, options = {}) {
        const {
            routeGuards = [],
            componentGuards = {},
            leavingComponent = null,
        } = options;

        try {
            // 1. Run beforeRouteLeave guards in leaving component
            if (leavingComponent && componentGuards.beforeRouteLeave) {
                const result = await this.executeGuard(
                    componentGuards.beforeRouteLeave,
                    to,
                    from
                );
                if (result === false || (result && typeof result === 'object')) {
                    return result;
                }
            }

            // 2. Run global beforeEach guards
            const globalBeforeResult = await this.executeGuards(
                GuardType.GLOBAL_BEFORE,
                to,
                from
            );
            if (globalBeforeResult !== true) {
                return globalBeforeResult;
            }

            // 3. Run route beforeEnter guards
            for (const guard of routeGuards) {
                const result = await this.executeGuard(guard, to, from);
                if (result === false || (result && typeof result === 'object')) {
                    return result;
                }
            }

            // 4. Run beforeRouteEnter in entering component
            if (componentGuards.beforeRouteEnter) {
                const result = await this.executeGuard(
                    componentGuards.beforeRouteEnter,
                    to,
                    from
                );
                if (result === false || (result && typeof result === 'object')) {
                    return result;
                }
            }

            // 5. Run global beforeResolve guards
            const globalResolveResult = await this.executeGuards(
                GuardType.GLOBAL_RESOLVE,
                to,
                from
            );
            if (globalResolveResult !== true) {
                return globalResolveResult;
            }

            // All guards passed
            return true;
        } catch (error) {
            console.error('Navigation guard error:', error);
            return false;
        }
    }

    /**
     * Run afterEach guards
     * These cannot affect navigation
     *
     * @param {Object} to - Target route
     * @param {Object} from - Current route
     */
    async runAfterGuards(to, from) {
        const guards = this.guards[GuardType.GLOBAL_AFTER] || [];

        for (const guard of guards) {
            try {
                await guard(to, from);
            } catch (error) {
                console.error('After guard error:', error);
            }
        }
    }
}

/**
 * Common guard patterns
 */
export const GuardPatterns = {
    /**
     * Authentication guard
     * Redirects to login if not authenticated
     */
    requireAuth(options = {}) {
        const {
            isAuthenticated = () => false,
            loginRoute = '/login',
            redirectParam = 'redirect',
        } = options;

        return (to, from, next) => {
            if (isAuthenticated()) {
                next();
            } else {
                next({
                    path: loginRoute,
                    query: { [redirectParam]: to.fullPath },
                });
            }
        };
    },

    /**
     * Permission guard
     * Checks if user has required permissions
     */
    requirePermission(options = {}) {
        const {
            hasPermission = () => false,
            permission = null,
            fallbackRoute = '/',
        } = options;

        return (to, from, next) => {
            const requiredPermission = permission || to.meta?.permission;

            if (!requiredPermission || hasPermission(requiredPermission)) {
                next();
            } else {
                next(fallbackRoute);
            }
        };
    },

    /**
     * Role guard
     * Checks if user has required role
     */
    requireRole(options = {}) {
        const {
            hasRole = () => false,
            roles = [],
            fallbackRoute = '/',
        } = options;

        return (to, from, next) => {
            const requiredRoles = roles.length > 0 ? roles : to.meta?.roles || [];

            if (requiredRoles.length === 0) {
                next();
                return;
            }

            const hasRequiredRole = requiredRoles.some(role => hasRole(role));

            if (hasRequiredRole) {
                next();
            } else {
                next(fallbackRoute);
            }
        };
    },

    /**
     * Dirty form guard
     * Warns before leaving with unsaved changes
     */
    confirmLeave(options = {}) {
        const {
            isDirty = () => false,
            message = 'You have unsaved changes. Are you sure you want to leave?',
        } = options;

        return (to, from, next) => {
            if (isDirty()) {
                if (window.confirm(message)) {
                    next();
                } else {
                    next(false);
                }
            } else {
                next();
            }
        };
    },

    /**
     * Data prefetch guard
     * Load data before entering route
     */
    prefetchData(options = {}) {
        const {
            fetch = async () => { },
            onError = () => { },
        } = options;

        return async (to, from, next) => {
            try {
                await fetch(to, from);
                next();
            } catch (error) {
                onError(error, to, from);
                next(false);
            }
        };
    },
};