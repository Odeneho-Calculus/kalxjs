/**
 * Phase 9: Middleware/Interceptor Pattern
 * Request/response-like pattern for routes with stack-based execution
 *
 * Features:
 * - Middleware stack execution (like Express)
 * - Before/after navigation hooks
 * - Error handling middleware
 * - Conditional middleware execution
 */

/**
 * Create middleware system for router
 * @param {Object} config
 * @param {Object} config.router - Router instance
 * @returns {Object} Middleware management API
 */
export function createMiddlewareSystem(config = {}) {
    const { router } = config;

    // Middleware stacks
    const beforeMiddleware = [];
    const afterMiddleware = [];
    const errorMiddleware = [];

    /**
     * Use middleware during navigation
     * Middleware is called with (to, from, next) signature
     * Call next() to proceed to next middleware/navigation
     *
     * @param {Function} middleware - Middleware function
     * @param {Object} options
     * @param {string} options.phase - 'before', 'after', or 'error'
     * @param {number} options.priority - Higher runs first (default: 0)
     */
    function use(middleware, options = {}) {
        const { phase = 'before', priority = 0 } = options;

        if (typeof middleware !== 'function') {
            throw new TypeError('Middleware must be a function');
        }

        middleware._priority = priority;
        middleware._phase = phase;

        switch (phase) {
            case 'before':
                beforeMiddleware.push(middleware);
                // Sort by priority (higher first)
                beforeMiddleware.sort((a, b) => (b._priority || 0) - (a._priority || 0));
                break;

            case 'after':
                afterMiddleware.push(middleware);
                afterMiddleware.sort((a, b) => (b._priority || 0) - (a._priority || 0));
                break;

            case 'error':
                errorMiddleware.push(middleware);
                errorMiddleware.sort((a, b) => (b._priority || 0) - (a._priority || 0));
                break;

            default:
                throw new Error(`Unknown middleware phase: ${phase}`);
        }

        // Return unregister function
        return () => {
            const list = phase === 'before'
                ? beforeMiddleware
                : phase === 'after'
                    ? afterMiddleware
                    : errorMiddleware;

            const idx = list.indexOf(middleware);
            if (idx > -1) {
                list.splice(idx, 1);
            }
        };
    }

    /**
     * Register before-navigation middleware
     * @param {Function} middleware
     * @param {Object} options
     */
    function before(middleware, options = {}) {
        return use(middleware, { ...options, phase: 'before' });
    }

    /**
     * Register after-navigation middleware
     * @param {Function} middleware
     * @param {Object} options
     */
    function after(middleware, options = {}) {
        return use(middleware, { ...options, phase: 'after' });
    }

    /**
     * Register error handling middleware
     * @param {Function} middleware
     * @param {Object} options
     */
    function onError(middleware, options = {}) {
        return use(middleware, { ...options, phase: 'error' });
    }

    /**
     * Execute middleware chain
     * @param {Array<Function>} middlewares
     * @param {Object} to - Target route
     * @param {Object} from - Source route
     * @param {Function} finalHandler - Final handler after all middleware
     * @returns {Promise}
     */
    async function executeMiddlewareChain(middlewares, to, from, finalHandler) {
        let index = 0;

        const next = async () => {
            if (index < middlewares.length) {
                const middleware = middlewares[index++];
                await middleware(to, from, next);
            } else if (finalHandler) {
                await finalHandler();
            }
        };

        await next();
    }

    /**
     * Execute error middleware chain
     * @param {Error} error
     * @param {Object} to - Target route
     * @param {Object} from - Source route
     * @returns {Promise<boolean>} True if error was handled
     */
    async function executeErrorMiddleware(error, to, from) {
        let handled = false;

        for (const middleware of errorMiddleware) {
            try {
                await middleware(error, to, from, () => {
                    handled = true;
                });
            } catch (err) {
                console.error('Error in error middleware:', err);
            }
        }

        return handled;
    }

    /**
     * Clear all middleware
     * @param {string|null} phase - Specific phase or null for all
     */
    function clear(phase = null) {
        if (!phase) {
            beforeMiddleware.length = 0;
            afterMiddleware.length = 0;
            errorMiddleware.length = 0;
        } else if (phase === 'before') {
            beforeMiddleware.length = 0;
        } else if (phase === 'after') {
            afterMiddleware.length = 0;
        } else if (phase === 'error') {
            errorMiddleware.length = 0;
        }
    }

    return {
        use,
        before,
        after,
        onError,
        executeMiddlewareChain,
        executeErrorMiddleware,
        clear,
        beforeMiddleware,
        afterMiddleware,
        errorMiddleware
    };
}

/**
 * Common middleware factories
 */
export const middlewares = {
    /**
     * Auth middleware - check if user is authenticated
     * @param {Function} isAuthenticated - Function that returns boolean
     * @param {string} redirectPath - Where to redirect if not auth'd
     * @returns {Function} Middleware
     */
    auth(isAuthenticated, redirectPath = '/login') {
        return async (to, from, next) => {
            if (!isAuthenticated()) {
                console.log(`Redirecting to ${redirectPath} - not authenticated`);
                // Redirect logic would go here
                return;
            }
            await next();
        };
    },

    /**
     * Analytics middleware - track page views
     * @param {Function} trackFn - Analytics tracking function
     * @returns {Function} Middleware
     */
    analytics(trackFn) {
        return async (to, from, next) => {
            await next();
            // Track after navigation completes
            trackFn({
                page: to.name || to.path,
                referrer: from.path,
                timestamp: Date.now()
            });
        };
    },

    /**
     * Prefetch middleware - prefetch resources for next route
     * @param {Function} prefetchFn - Prefetch function
     * @returns {Function} Middleware
     */
    prefetch(prefetchFn) {
        return async (to, from, next) => {
            // Prefetch resources for target route
            if (to.meta?.prefetch) {
                await prefetchFn(to);
            }
            await next();
        };
    },

    /**
     * Progress middleware - show progress bar during navigation
     * @param {Object} progress - Progress bar instance
     * @returns {Function} Middleware
     */
    progress(progress) {
        return async (to, from, next) => {
            // Start progress
            if (progress.start) {
                progress.start();
            }

            try {
                await next();
            } finally {
                // Complete progress
                if (progress.finish) {
                    progress.finish();
                }
            }
        };
    },

    /**
     * Logging middleware
     * @returns {Function} Middleware
     */
    logger() {
        return async (to, from, next) => {
            console.log(`Navigating from ${from?.path} to ${to?.path}`);
            const start = Date.now();
            await next();
            console.log(`Navigation completed in ${Date.now() - start}ms`);
        };
    },

    /**
     * Conditional middleware - only execute if condition is true
     * @param {Function} condition - Condition function
     * @param {Function} middleware - Middleware to execute
     * @returns {Function} Middleware
     */
    conditional(condition, middleware) {
        return async (to, from, next) => {
            if (await condition(to, from)) {
                await middleware(to, from, next);
            } else {
                await next();
            }
        };
    }
};

/**
 * Integrate middleware system into router
 * @param {Object} router - Router instance
 * @returns {Object} Middleware system with integrated router
 */
export function integrateMiddleware(router) {
    const middleware = createMiddlewareSystem({ router });

    // Hook into router guards to execute middleware
    router.beforeEach?.(async (to, from, next) => {
        try {
            await middleware.executeMiddlewareChain(
                middleware.beforeMiddleware,
                to,
                from,
                () => next()
            );
        } catch (error) {
            const handled = await middleware.executeErrorMiddleware(error, to, from);
            if (!handled) {
                throw error;
            }
        }
    });

    router.afterEach?.((to, from) => {
        middleware.executeMiddlewareChain(
            middleware.afterMiddleware,
            to,
            from,
            null
        );
    });

    return middleware;
}

export default createMiddlewareSystem;