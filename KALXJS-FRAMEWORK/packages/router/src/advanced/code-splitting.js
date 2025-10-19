/**
 * KALXJS Advanced Router - Code Splitting
 * Automatic route-based code splitting and lazy loading
 *
 * @module @kalxjs/router/advanced/code-splitting
 */

/**
 * Create lazy-loaded component
 *
 * @param {Function} factory - Dynamic import function
 * @param {Object} options - Loading options
 * @returns {Object} Lazy component
 *
 * @example
 * ```js
 * const Home = lazyLoadComponent(() => import('./views/Home.klx'));
 * ```
 */
export function lazyLoadComponent(factory, options = {}) {
    const {
        loading = null,
        error = null,
        delay = 200,
        timeout = 30000,
        onError = null,
    } = options;

    return {
        name: 'LazyComponent',

        async setup() {
            const componentRef = ref(null);
            const loadingRef = ref(false);
            const errorRef = ref(null);

            let loadTimeout = null;
            let delayTimeout = null;

            // Start loading
            const startLoad = async () => {
                loadingRef.value = false;
                errorRef.value = null;

                // Show loading after delay
                delayTimeout = setTimeout(() => {
                    loadingRef.value = true;
                }, delay);

                // Set timeout
                if (timeout) {
                    loadTimeout = setTimeout(() => {
                        errorRef.value = new Error('Component load timeout');
                    }, timeout);
                }

                try {
                    const module = await factory();
                    componentRef.value = module.default || module;

                    // Clear loading state
                    clearTimeout(delayTimeout);
                    clearTimeout(loadTimeout);
                    loadingRef.value = false;
                } catch (err) {
                    errorRef.value = err;
                    loadingRef.value = false;

                    if (onError) {
                        onError(err);
                    }
                }
            };

            // Start loading immediately
            startLoad();

            return {
                component: componentRef,
                loading: loadingRef,
                error: errorRef,
            };
        },

        render() {
            const { component, loading: isLoading, error: hasError } = this;

            if (hasError && error) {
                return h(error, { error: hasError });
            }

            if (isLoading && loading) {
                return h(loading);
            }

            if (component) {
                return h(component, this.$attrs);
            }

            return null;
        },
    };
}

/**
 * Create route with lazy-loaded component
 *
 * @param {string} path - Route path
 * @param {Function} factory - Component import function
 * @param {Object} options - Route and loading options
 * @returns {Object} Route configuration
 *
 * @example
 * ```js
 * const route = lazyLoadRoute('/home', () => import('./views/Home.klx'), {
 *   name: 'home',
 *   meta: { title: 'Home' }
 * });
 * ```
 */
export function lazyLoadRoute(path, factory, options = {}) {
    const {
        name,
        meta = {},
        beforeEnter,
        children,
        ...loadOptions
    } = options;

    return {
        path,
        name,
        meta,
        beforeEnter,
        children,
        component: lazyLoadComponent(factory, loadOptions),
    };
}

/**
 * Prefetch route component
 * Load component in background for faster navigation
 *
 * @param {Function} factory - Component import function
 * @returns {Promise}
 */
export function prefetchRoute(factory) {
    return factory().catch(() => {
        // Silently fail prefetch
    });
}

/**
 * Create prefetch link directive
 * Automatically prefetches route when link is hovered/visible
 *
 * @param {Object} router - Router instance
 * @returns {Object} Directive definition
 */
export function createPrefetchDirective(router) {
    const prefetched = new Set();

    return {
        name: 'prefetch',

        mounted(el, binding) {
            const { value, modifiers } = binding;

            // Get route to prefetch
            const to = typeof value === 'string' ? { path: value } : value;
            const route = router.resolve(to);

            if (!route || !route.matched[0]) {
                return;
            }

            const component = route.matched[0].component;

            // Check if component is lazy
            if (!component || !component.setup) {
                return;
            }

            // Create prefetch key
            const key = route.path;

            if (prefetched.has(key)) {
                return;
            }

            // Prefetch strategy
            if (modifiers.immediate) {
                // Prefetch immediately
                prefetchComponent(component);
                prefetched.add(key);
            } else if (modifiers.visible) {
                // Prefetch when visible
                observeVisibility(el, () => {
                    if (!prefetched.has(key)) {
                        prefetchComponent(component);
                        prefetched.add(key);
                    }
                });
            } else {
                // Default: prefetch on hover
                const handler = () => {
                    if (!prefetched.has(key)) {
                        prefetchComponent(component);
                        prefetched.add(key);
                    }
                };

                el.addEventListener('mouseenter', handler, { once: true });
                el.addEventListener('focus', handler, { once: true });
            }
        },
    };
}

/**
 * Prefetch component
 * @private
 */
function prefetchComponent(component) {
    if (component && component.setup) {
        // Trigger component setup to start loading
        try {
            component.setup();
        } catch (e) {
            // Ignore errors during prefetch
        }
    }
}

/**
 * Observe element visibility
 * @private
 */
function observeVisibility(el, callback) {
    if (!window.IntersectionObserver) {
        // Fallback: prefetch immediately
        callback();
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback();
                    observer.disconnect();
                }
            });
        },
        { threshold: 0.1 }
    );

    observer.observe(el);
}

/**
 * Batch prefetch multiple routes
 *
 * @param {Array} routes - Array of route factories
 * @param {Object} options - Prefetch options
 */
export async function batchPrefetch(routes, options = {}) {
    const { concurrency = 3, delay = 100 } = options;

    const queue = [...routes];
    const inProgress = [];

    while (queue.length > 0 || inProgress.length > 0) {
        // Start new prefetches up to concurrency limit
        while (inProgress.length < concurrency && queue.length > 0) {
            const factory = queue.shift();
            const promise = prefetchRoute(factory);
            inProgress.push(promise);

            promise.finally(() => {
                const index = inProgress.indexOf(promise);
                if (index > -1) {
                    inProgress.splice(index, 1);
                }
            });

            // Add delay between requests
            if (delay > 0 && queue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        // Wait for at least one to complete
        if (inProgress.length > 0) {
            await Promise.race(inProgress);
        }
    }
}

/**
 * Auto-prefetch related routes
 * Based on current route, prefetch likely next routes
 *
 * @param {Object} router - Router instance
 * @param {Object} options - Configuration
 */
export function autoPrefetchRoutes(router, options = {}) {
    const {
        maxPrefetch = 5,
        delay = 2000,
        patterns = [],
    } = options;

    router.afterEach((to) => {
        setTimeout(() => {
            const currentPath = to.path;
            const relatedRoutes = [];

            // Find related routes based on patterns
            router.getRoutes().forEach(route => {
                if (relatedRoutes.length >= maxPrefetch) return;

                // Skip current route
                if (route.path === currentPath) return;

                // Check if route matches patterns
                const isRelated = patterns.some(pattern => {
                    if (typeof pattern === 'function') {
                        return pattern(currentPath, route.path);
                    }
                    return route.path.startsWith(pattern);
                });

                if (isRelated && route.component) {
                    relatedRoutes.push(() => Promise.resolve(route.component));
                }
            });

            // Prefetch related routes
            if (relatedRoutes.length > 0) {
                batchPrefetch(relatedRoutes, { concurrency: 2 });
            }
        }, delay);
    });
}