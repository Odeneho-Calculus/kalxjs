// packages/router/src/index.js
/**
 * kalxjs Router - A routing system for single-page applications
 */

import { ref, computed } from '@kalxjs/core';
import { createElement } from '@kalxjs/core';

/**
 * Create a web history object for HTML5 history mode
 * @param {string} base - Base URL
 * @returns {Object} History object
 */
export function createWebHistory(base = '') {
    let currentLocation = typeof window !== 'undefined' ? window.location.pathname : '/';
    let currentState = typeof window !== 'undefined' ? window.history.state : null;

    const updateLocationState = () => {
        if (typeof window === 'undefined') {
            return;
        }
        currentLocation = window.location.pathname;
        currentState = window.history.state;
    };

    const handleHistoryFailure = (url, replace) => {
        if (!isFileProtocol()) {
            return false;
        }
        console.warn('KalxJS router history mode requires serving over HTTP(S). Falling back to hash navigation in file:// environments.');
        navigateWithHash(url, replace);
        updateLocationState();
        return true;
    };

    // Safely attempt to use history API, gracefully handling sandboxed contexts (Playwright, etc.)
    const safeHistoryCall = (method, url, replace = false) => {
        try {
            window.history[method](null, '', url);
            return true;
        } catch (error) {
            // In Playwright/sandboxed contexts, pushState/replaceState may throw SecurityError even with HTTP protocol
            // This is safe to ignore - just update our internal state
            if (error.name === 'SecurityError' && (method === 'pushState' || method === 'replaceState')) {
                console.debug('History API SecurityError in sandboxed context - updating internal state only');
                // Update internal tracking even though the browser history wasn't updated
                currentLocation = new URL(url, window.location.origin).pathname;
                return false; // Signal that browser history wasn't actually updated
            }
            throw error;
        }
    };

    return {
        type: 'history',
        base,
        get location() {
            return currentLocation;
        },
        get state() {
            return currentState;
        },
        push: (url, replace = false) => {
            if (typeof window === 'undefined') {
                return;
            }
            const method = replace ? 'replaceState' : 'pushState';
            try {
                const success = safeHistoryCall(method, url, replace);
                // Only update location state from window if the History API call succeeded
                // If it failed (sandboxed context), keep the manually updated currentLocation
                if (success) {
                    updateLocationState();
                }
            } catch (error) {
                if (!handleHistoryFailure(url, replace)) {
                    throw error;
                }
            }
        },
        replace: (url) => {
            if (typeof window === 'undefined') {
                return;
            }
            try {
                const success = safeHistoryCall('replaceState', url, true);
                // Only update location state from window if the History API call succeeded
                // If it failed (sandboxed context), keep the manually updated currentLocation
                if (success) {
                    updateLocationState();
                }
            } catch (error) {
                if (!handleHistoryFailure(url, true)) {
                    throw error;
                }
            }
        },
        listen: (callback) => {
            if (typeof window !== 'undefined') {
                const popstateListener = () => {
                    callback(window.location.pathname);
                };
                window.addEventListener('popstate', popstateListener);
                return () => {
                    window.removeEventListener('popstate', popstateListener);
                };
            }
            return () => { };
        }
    };
}

function isFileProtocol() {
    if (typeof window === 'undefined') {
        return false;
    }
    return window.location.protocol === 'file:';
}

function navigateWithHash(url, replace = false) {
    if (typeof window === 'undefined') {
        return;
    }
    const normalized = url.startsWith('#') ? url.slice(1) : url;
    if (replace) {
        const href = window.location.href;
        const index = href.indexOf('#');
        const baseHref = index >= 0 ? href.slice(0, index) : href;
        window.location.replace(baseHref + '#' + normalized);
    } else {
        window.location.hash = normalized;
    }
}

/**
 * Create a hash history object for hash mode
 * @param {string} base - Base URL
 * @returns {Object} History object
 */
export function createWebHashHistory(base = '') {
    return {
        type: 'hash',
        base,
        location: typeof window !== 'undefined' ? window.location.hash.slice(1) || '/' : '/',
        state: null,
        push: (url, replace = false) => {
            if (typeof window !== 'undefined') {
                if (replace) {
                    const href = window.location.href;
                    const i = href.indexOf('#');
                    window.location.replace(href.slice(0, i >= 0 ? i : 0) + '#' + url);
                } else {
                    window.location.hash = url;
                }
            }
        },
        replace: (url) => {
            if (typeof window !== 'undefined') {
                const href = window.location.href;
                const i = href.indexOf('#');
                window.location.replace(href.slice(0, i >= 0 ? i : 0) + '#' + url);
            }
        },
        listen: (callback) => {
            if (typeof window !== 'undefined') {
                const hashchangeListener = () => {
                    callback(window.location.hash.slice(1) || '/');
                };
                window.addEventListener('hashchange', hashchangeListener);
                return () => {
                    window.removeEventListener('hashchange', hashchangeListener);
                };
            }
            return () => { };
        }
    };
}

/**
 * Create a memory history object for testing and SSR
 * @param {string} initialPath - Initial path
 * @returns {Object} History object
 */
export function createMemoryHistory(initialPath = '/') {
    let currentLocation = initialPath;
    const listeners = [];

    return {
        type: 'memory',
        base: '',
        location: currentLocation,
        state: null,
        push: (url, replace = false) => {
            currentLocation = url;
            listeners.forEach(callback => callback(currentLocation));
        },
        replace: (url) => {
            currentLocation = url;
            listeners.forEach(callback => callback(currentLocation));
        },
        listen: (callback) => {
            listeners.push(callback);
            return () => {
                const index = listeners.indexOf(callback);
                if (index !== -1) {
                    listeners.splice(index, 1);
                }
            };
        }
    };
}

/**
 * Create a new router instance
 * @param {Object} options - Router options
 * @returns {Object} Router instance
 */
export function createRouter(options = {}) {
    const routes = options.routes || [];
    const base = options.base || '';
    const scrollBehavior = options.scrollBehavior;
    const caseSensitive = options.caseSensitive || false;
    const trailingSlash = options.trailingSlash || false;
    const parseQuery = options.parseQuery;
    const stringifyQuery = options.stringifyQuery;

    // ISSUE 2 FIX: Support memory mode explicitly
    let history = options.history;
    if (!history) {
        if (options.mode === 'memory') {
            history = createMemoryHistory(options.initialPath || '/');
        } else {
            history = createWebHashHistory(base);
        }
    }

    // Derive mode from history object type or options.mode
    let mode = options.mode || history.type || 'hash';

    if (typeof window !== 'undefined' && window.location.protocol === 'file:' && mode === 'history') {
        console.warn('KalxJS router history mode requires an HTTP(S) origin. Switching to hash mode because the app is running from file://.');
        history = createWebHashHistory(base);
        mode = 'hash';
    }

    // Option to force history mode (useful for testing and SPA deployments with proper server config)
    // Like React and Vue, we don't pre-test History API - we just use it and handle errors during navigation
    const forceHistoryMode = options.forceHistoryMode === true;

    if (forceHistoryMode && mode !== 'history') {
        console.log('Force history mode enabled - using createWebHistory()');
        history = createWebHistory(base);
        mode = 'history';
    }

    // Normalize routes to ensure meta is always present
    const normalizedRoutes = routes.map(route => ({
        ...route,
        meta: route.meta || {}  // Ensure meta is always an object, never null
    }));

    // Map of route paths to route objects for quick lookup
    const routeMap = normalizedRoutes.reduce((map, route) => {
        console.log('Registering route:', route.path);
        map[route.path] = route;
        return map;
    }, {});

    // Log all registered routes
    console.log('Registered routes:', Object.keys(routeMap));

    // Current route - MAKE IT REACTIVE so KalxJS can properly track changes
    const currentRouteRef = ref({
        path: '/',
        name: null,
        params: {},
        query: {},
        matched: [],
        meta: {}
    });

    // Expose both the ref and a getter for backward compatibility
    let currentRoute = currentRouteRef.value;

    // Previous route for navigation guards
    let previousRoute = null;

    // Route change listeners
    const listeners = [];

    // Route change callback for reactive updates
    const routeChangeCallbacks = [];

    // Navigation guards
    const beforeEachGuards = [];
    const beforeResolveGuards = [];
    const afterEachGuards = [];

    // Route-specific guards cache
    const routeGuardsCache = new Map();

    // Pending navigation promise
    let pendingNavigation = null;

    // Navigation depth counter to prevent infinite redirects
    let navigationRedirectCount = 0;
    const MAX_REDIRECT_COUNT = 10;

    // Router initialization state
    let isReady = false;

    // Create the router object with direct references to all properties
    const router = {
        // Router properties
        routes: normalizedRoutes, // Direct reference to the normalized routes array with meta
        mode,
        base,
        get currentRoute() {
            // Return the ref value, but ensure we're accessing it properly for KalxJS reactivity
            return currentRouteRef.value;
        },
        history,
        get isReady() {
            return isReady;
        },

        /**
         * Install the router on a KalxJS application
         * @param {Object} app - KalxJS application instance
         */
        install(app) {
            console.log('Router install method called');

            // Make router available to all components
            app._router = this;

            // ISSUE 3 FIX: Attach router to app instance for dependency injection
            app.router = this;

            // Make router available globally for debugging
            if (typeof window !== 'undefined') {
                window.__KAL_ROUTER__ = this;
                // ISSUE 4 FIX: Expose useRouter globally
                window.__KAL_ROUTER_INSTANCE__ = this;
            }

            // Initialize router with enhanced options
            this.init({
                handleLinks: true,
                app: app
            });

            // Add a hook to ensure router is initialized after app is mounted
            const originalMount = app.mount;
            app.mount = (selector) => {
                const result = originalMount(selector);
                console.log('App mounted, ensuring router is initialized');

                // Force an initial route match after mounting
                setTimeout(() => {
                    console.log('Triggering initial route match');
                    this._onRouteChange();
                }, 0);

                return result;
            };
        },

        /**
         * Initialize the router
         * @param {Object} options - Initialization options
         */
        init(options = {}) {
            console.log('Router init called with options:', options);

            // Store initialization options
            this._initOptions = options;

            // Set up history mode listeners
            if (mode === 'hash') {
                console.log('Setting up hash mode listeners');

                // Ensure hash exists
                if (typeof window !== 'undefined' && !window.location.hash) {
                    console.log('No hash found, setting initial hash to /');
                    window.location.hash = '/';
                }

                window.addEventListener('hashchange', () => {
                    console.log('Hash changed, updating route');
                    this._onRouteChange();
                });
            } else {
                console.log('Setting up history mode listeners');
                window.addEventListener('popstate', () => {
                    console.log('History state changed, updating route');
                    this._onRouteChange();
                });
            }

            // Initial route matching
            console.log('Performing initial route matching');
            this._onRouteChange();

            // Mark router as ready
            isReady = true;
            console.log('Router is now ready');

            return this;
        },

        /**
         * Add a global before each navigation guard
         * @param {Function} guard - Guard function that receives to, from, and next
         * @returns {Function} Unregister function
         */
        beforeEach(guard) {
            beforeEachGuards.push(guard);
            return () => {
                const index = beforeEachGuards.indexOf(guard);
                if (index !== -1) beforeEachGuards.splice(index, 1);
            };
        },

        /**
         * Add a global before resolve navigation guard
         * @param {Function} guard - Guard function that receives to, from, and next
         * @returns {Function} Unregister function
         */
        beforeResolve(guard) {
            beforeResolveGuards.push(guard);
            return () => {
                const index = beforeResolveGuards.indexOf(guard);
                if (index !== -1) beforeResolveGuards.splice(index, 1);
            };
        },

        /**
         * Add a global after each hook
         * @param {Function} hook - Hook function that receives to and from
         * @returns {Function} Unregister function
         */
        afterEach(hook) {
            afterEachGuards.push(hook);
            return () => {
                const index = afterEachGuards.indexOf(hook);
                if (index !== -1) afterEachGuards.splice(index, 1);
            };
        },

        /**
         * Register a callback to be called when the route changes
         * @param {Function} callback - Callback function that receives the new route
         * @returns {Function} Unregister function
         */
        onChange(callback) {
            if (typeof callback !== 'function') {
                console.error('Router.onChange: callback must be a function');
                return () => { };
            }

            routeChangeCallbacks.push(callback);

            // Call the callback immediately with the current route
            callback(this.currentRoute);

            return () => {
                const index = routeChangeCallbacks.indexOf(callback);
                if (index !== -1) routeChangeCallbacks.splice(index, 1);
            };
        },

        /**
         * Navigate to a specific route
         * @param {string|Object} location - Route path or location object
         * @returns {Promise} Promise that resolves when navigation is complete
         */
        push(location) {
            console.log('Router.push called with location:', location);

            // Save current scroll position before navigation
            if (typeof window !== 'undefined') {
                this._savedPosition = { x: window.scrollX, y: window.scrollY };
            }

            const result = this._navigate(location, 'push');

            // Force a route change event after a short delay to ensure the DOM has updated
            setTimeout(() => {
                console.log('Forcing route change after push');
                this._onRouteChange();

                // Also dispatch a custom event for components to listen to
                if (typeof window !== 'undefined' && window.dispatchEvent) {
                    const event = new CustomEvent('kalroute', {
                        detail: { route: { ...this.currentRoute } }
                    });
                    window.dispatchEvent(event);
                }

                // Reset scroll to top after navigation (unless scrollBehavior is defined)
                if (!scrollBehavior && typeof window !== 'undefined') {
                    window.scrollTo(0, 0);
                }
            }, 50);

            return result;
        },

        /**
         * Replace current route without adding to history
         * @param {string|Object} location - Route path or location object
         * @returns {Promise} Promise that resolves when navigation is complete
         */
        replace(location) {
            console.log('Router.replace called with location:', location);

            // Save current scroll position before navigation
            if (typeof window !== 'undefined') {
                this._savedPosition = { x: window.scrollX, y: window.scrollY };
            }

            const result = this._navigate(location, 'replace');

            // Force a route change event after a short delay to ensure the DOM has updated
            setTimeout(() => {
                console.log('Forcing route change after replace');
                this._onRouteChange();

                // Also dispatch a custom event for components to listen to
                if (typeof window !== 'undefined' && window.dispatchEvent) {
                    const event = new CustomEvent('kalroute', {
                        detail: { route: { ...this.currentRoute } }
                    });
                    window.dispatchEvent(event);
                }

                // Reset scroll to top after navigation (unless scrollBehavior is defined)
                if (!scrollBehavior && typeof window !== 'undefined') {
                    window.scrollTo(0, 0);
                }
            }, 50);

            return result;
        },

        /**
         * Internal navigation method that handles guards and promises
         * @param {string|Object} location - Route path or location object
         * @param {string} navigationMethod - 'push' or 'replace'
         * @returns {Promise} Promise that resolves when navigation is complete
         * @private
         */
        _navigate(location, navigationMethod = 'push') {
            // Reset redirect counter for new navigation
            navigationRedirectCount = 0;

            // Parse the location
            const targetLocation = this._normalizeLocation(location);
            const path = targetLocation.path;
            const query = targetLocation.query || {};
            const params = targetLocation.params || {};

            // If we already have a pending navigation, abort it
            if (pendingNavigation) {
                console.warn('Navigation aborted: A new navigation started before the previous one completed');
            }

            // Create a promise for this navigation
            pendingNavigation = new Promise((resolve, reject) => {
                // Match the target route
                const targetRoute = this._matchRoute(path);

                // If no route matched, reject
                if (!targetRoute.matched.length) {
                    reject(new Error(`No route matched for path: ${path}`));
                    pendingNavigation = null;
                    return;
                }

                // Merge route params with provided params
                targetRoute.params = { ...targetRoute.params, ...params };

                // Merge route query with provided query
                targetRoute.query = { ...targetRoute.query, ...query };

                // Add meta data from matched routes
                targetRoute.meta = targetRoute.matched.reduce((meta, route) => {
                    return { ...meta, ...(route.meta || {}) };
                }, {});

                // Store the previous route
                previousRoute = { ...this.currentRoute };

                // UPDATE: Set currentRoute BEFORE running guards so afterEach hooks have access to the new route
                // This is critical for components that read window.router.currentRoute in afterEach handlers
                currentRouteRef.value = targetRoute;
                currentRoute = currentRouteRef.value;

                // Run navigation guards
                this._runGuards(targetRoute, previousRoute)
                    .then(guardResult => {
                        // Check if navigation was redirected
                        if (typeof guardResult === 'string' || (guardResult && guardResult.path)) {
                            // Handle redirect
                            navigationRedirectCount++;

                            if (navigationRedirectCount > MAX_REDIRECT_COUNT) {
                                reject(new Error('Too many redirects'));
                                pendingNavigation = null;
                                return;
                            }

                            // Redirect using replace to avoid history entries
                            this.replace(guardResult).then(resolve).catch(reject);
                            return;
                        }

                        // If guard returned false, abort navigation
                        if (guardResult === false) {
                            reject(new Error('Navigation aborted by guard'));
                            pendingNavigation = null;
                            return;
                        }

                        // Perform the actual navigation with proper error handling
                        try {
                            // Stringify query parameters for inclusion in URL
                            const queryString = this._stringifyQuery(query);

                            if (navigationMethod === 'replace') {
                                if (mode === 'hash') {
                                    const href = window.location.href;
                                    const i = href.indexOf('#');
                                    window.location.replace(href.slice(0, i >= 0 ? i : 0) + '#' + path + queryString);
                                } else {
                                    try {
                                        // Properly construct URL: avoid double slashes by normalizing base
                                        // Include query string in the URL
                                        const url = (base === '/' ? '' : base.replace(/\/$/, '')) + path + queryString;
                                        window.history.replaceState({ path, query }, '', url);
                                    } catch (historyError) {
                                        // In Playwright/sandboxed contexts, replaceState might also throw
                                        // but the router can continue working
                                        if (historyError.name === 'SecurityError') {
                                            console.debug('History API replaceState blocked in sandboxed context - router will continue');
                                        } else {
                                            throw historyError;
                                        }
                                    }
                                    this._onRouteChange();
                                }
                            } else {
                                if (mode === 'hash') {
                                    window.location.hash = path + queryString;
                                } else {
                                    try {
                                        // Properly construct URL: avoid double slashes by normalizing base
                                        // Include query string in the URL
                                        const url = (base === '/' ? '' : base.replace(/\/$/, '')) + path + queryString;
                                        window.history.pushState({ path, query }, '', url);
                                    } catch (historyError) {
                                        // In Playwright/sandboxed contexts, pushState throws SecurityError
                                        // but the router can still work internally - just log it
                                        if (historyError.name === 'SecurityError') {
                                            console.debug('History API pushState blocked in sandboxed context - router will continue in History mode');
                                        } else {
                                            throw historyError;
                                        }
                                    }
                                    this._onRouteChange();
                                }
                            }
                        } catch (error) {
                            // For unexpected errors, reject the promise with the error
                            reject(error);
                            pendingNavigation = null;
                            return;
                        }

                        // Apply scroll behavior if defined
                        if (scrollBehavior && typeof scrollBehavior === 'function') {
                            Promise.resolve().then(() => {
                                scrollBehavior(targetRoute, previousRoute, this._savedPosition);
                            });
                        }

                        // Resolve the navigation promise
                        resolve(targetRoute);
                        pendingNavigation = null;
                    })
                    .catch(err => {
                        reject(err);
                        pendingNavigation = null;
                    });
            });

            return pendingNavigation;
        },

        /**
         * Normalize location object or string
         * @param {string|Object} location - Route path or location object
         * @returns {Object} Normalized location object
         * @private
         */
        _normalizeLocation(location) {
            if (typeof location === 'string') {
                // Ensure empty strings are converted to root path
                return { path: location || '/' };
            }

            return {
                path: location.path || '/',
                query: location.query || {},
                params: location.params || {},
                hash: location.hash || '',
                replace: location.replace
            };
        },

        /**
         * Go back in history
         * @param {number} n - Number of steps to go back
         * @returns {Promise} Promise that resolves when navigation is complete
         */
        go(n) {
            this._savedPosition = { x: window.scrollX, y: window.scrollY };
            window.history.go(n);

            // Return a promise that resolves after the popstate event has been processed
            // and the router has had time to update the currentRoute
            return new Promise((resolve) => {
                // Store the current route path to detect when it changes
                const previousPath = this.currentRoute?.path;

                // Check if route has changed every 10ms, up to 1 second
                let attempts = 0;
                const maxAttempts = 100;
                const checkInterval = setInterval(() => {
                    attempts++;

                    // Check if the route has changed or if we've waited long enough
                    const routeChanged = this.currentRoute?.path !== previousPath;
                    if (routeChanged || attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        // Give a bit more time for DOM updates
                        setTimeout(() => {
                            resolve();
                        }, 50);
                    }
                }, 10);
            });
        },

        /**
         * Go back one step in history
         * @returns {Promise} Promise that resolves when navigation is complete
         */
        back() {
            return this.go(-1);
        },

        /**
         * Go forward one step in history
         * @returns {Promise} Promise that resolves when navigation is complete
         */
        forward() {
            return this.go(1);
        },

        /**
         * Run all navigation guards
         * @param {Object} to - Target route
         * @param {Object} from - Current route
         * @returns {Promise} Promise that resolves when all guards have run
         * @private
         */
        _runGuards(to, from) {
            // Create a queue of guard runners
            const guardQueue = [
                // Run beforeEach guards
                ...beforeEachGuards.map(guard => () => this._runGuard(guard, to, from)),

                // Run beforeEnter guards from route
                ...this._getRouteGuards(to).map(guard => () => this._runGuard(guard, to, from)),

                // Run beforeResolve guards
                ...beforeResolveGuards.map(guard => () => this._runGuard(guard, to, from))
            ];

            // Run guards sequentially
            return guardQueue.reduce(
                (promise, runGuard) => promise.then(() => runGuard()),
                Promise.resolve()
            ).then(() => {
                // Run afterEach hooks (these don't affect navigation)
                Promise.resolve().then(() => {
                    // First, find all router view containers and render the components
                    if (typeof document !== 'undefined') {
                        const routerViewContainers = document.querySelectorAll('[data-router-view="true"]');
                        routerViewContainers.forEach(container => {
                            if (container._componentRef && typeof container._componentRef === 'function') {
                                try {
                                    // Get the component function
                                    const Component = container._componentRef;

                                    // Create props for the component
                                    const props = {
                                        route: to,
                                        key: to.path
                                    };

                                    // Call the component function with the props
                                    let result = Component(props);

                                    // Handle case where result.tag is a component definition (object with setup function)
                                    if (result && typeof result === 'object') {
                                        if (result.tag && typeof result.tag === 'object' && typeof result.tag.setup === 'function') {
                                            console.log('RouterView: Component returned a nested component definition, unwrapping it');

                                            // Try to call the setup function to get the actual component
                                            try {
                                                const setupResult = result.tag.setup(props);

                                                // Handle different types of setup results
                                                if (setupResult) {
                                                    if (typeof setupResult === 'object') {
                                                        // Replace the entire result with the setup result
                                                        result = setupResult;

                                                        // Ensure the result has a valid tag
                                                        if (!result.tag || typeof result.tag !== 'string') {
                                                            console.warn('RouterView: Nested component setup returned object without valid tag, setting to div');
                                                            result.tag = 'div';
                                                        }
                                                    } else if (typeof setupResult === 'function') {
                                                        // Setup returned a function (render function)
                                                        console.log('RouterView: Nested component setup returned a function, trying to call it');
                                                        try {
                                                            const renderResult = setupResult();
                                                            if (renderResult && typeof renderResult === 'object') {
                                                                result = renderResult;
                                                                if (!result.tag || typeof result.tag !== 'string') {
                                                                    result.tag = 'div';
                                                                }
                                                            } else {
                                                                console.error('RouterView: Nested component render function did not return a valid vnode');
                                                                result = {
                                                                    tag: 'div',
                                                                    props: { class: 'kal-router-view-error' },
                                                                    children: ['Render function did not return a valid view']
                                                                };
                                                            }
                                                        } catch (renderError) {
                                                            console.error('RouterView: Error calling nested component render function', renderError);
                                                            result = {
                                                                tag: 'div',
                                                                props: { class: 'kal-router-view-error' },
                                                                children: [`Error in render function: ${renderError.message}`]
                                                            };
                                                        }
                                                    } else {
                                                        // Setup returned a primitive value
                                                        console.warn('RouterView: Nested component setup returned a primitive value:', setupResult);
                                                        result = {
                                                            tag: 'div',
                                                            props: { class: 'kal-router-view-primitive' },
                                                            children: [String(setupResult)]
                                                        };
                                                    }
                                                } else {
                                                    // Setup returned null or undefined
                                                    console.error('RouterView: Nested component setup did not return a valid value');
                                                    result = {
                                                        tag: 'div',
                                                        props: { class: 'kal-router-view-error' },
                                                        children: ['Component setup did not return a valid view']
                                                    };
                                                }
                                            } catch (setupError) {
                                                console.error('RouterView: Error calling nested component setup function', setupError);
                                                result = {
                                                    tag: 'div',
                                                    props: { class: 'kal-router-view-error' },
                                                    children: [`Error in component setup: ${setupError.message}`]
                                                };
                                            }
                                        }
                                        // Final check to ensure tag is a string
                                        else if (!result.tag || typeof result.tag !== 'string') {
                                            console.warn('RouterView: Component returned object without valid tag, setting to div');
                                            result.tag = 'div';
                                        }
                                    }

                                    // If the result is valid, render it
                                    if (result && typeof result === 'object' && result.tag) {
                                        // Clear the container
                                        container.innerHTML = '';

                                        // Create the DOM element
                                        const element = createElement(result);

                                        // Append it to the container
                                        container.appendChild(element);
                                    } else {
                                        console.error('RouterView: Component function did not return a valid vnode', result);
                                        container.innerHTML = '<div class="kal-router-view-error">Component did not return a valid view</div>';
                                    }
                                } catch (error) {
                                    console.error('RouterView: Error rendering component', error);
                                    container.innerHTML = `<div class="kal-router-view-error">Error rendering component: ${error.message}</div>`;
                                }
                            }
                        });
                    }

                    // Then run the user-defined afterEach guards
                    afterEachGuards.forEach(guard => {
                        try {
                            guard(to, from);
                        } catch (err) {
                            console.error('Error in afterEach guard:', err);
                        }
                    });
                });

                // Return true to continue navigation
                return true;
            });
        },

        /**
         * Run a single navigation guard
         * @param {Function} guard - Guard function
         * @param {Object} to - Target route
         * @param {Object} from - Current route
         * @returns {Promise} Promise that resolves with the guard result
         * @private
         */
        _runGuard(guard, to, from) {
            return new Promise(resolve => {
                // Create the next function that guards call
                const next = (result) => {
                    resolve(result);
                };

                // Call the guard with to, from, next
                const guardReturn = guard(to, from, next);

                // If guard returns a Promise, wait for it
                if (guardReturn instanceof Promise) {
                    guardReturn.then(next).catch(err => {
                        console.error('Error in navigation guard:', err);
                        next(false);
                    });
                } else if (typeof guardReturn !== 'undefined') {
                    // If guard returns a value directly (not using next), use that
                    next(guardReturn);
                }
                // Otherwise wait for next() to be called
            });
        },

        /**
         * Get guards for a specific route
         * @param {Object} route - Route object
         * @returns {Array} Array of guard functions
         * @private
         */
        _getRouteGuards(route) {
            // Check cache first
            if (routeGuardsCache.has(route.path)) {
                return routeGuardsCache.get(route.path);
            }

            const guards = [];

            // Collect beforeEnter guards from all matched routes
            for (const matchedRoute of route.matched) {
                if (matchedRoute.beforeEnter) {
                    if (Array.isArray(matchedRoute.beforeEnter)) {
                        guards.push(...matchedRoute.beforeEnter);
                    } else {
                        guards.push(matchedRoute.beforeEnter);
                    }
                }
            }

            // Cache the guards
            routeGuardsCache.set(route.path, guards);

            return guards;
        },

        /**
         * Initialize the router
         * @param {Object} options - Additional initialization options
         * @returns {Object} Router instance
         */
        init(options = {}) {
            // Store initialization options
            this._initOptions = options;

            // Set up history state handling
            this._historyState = {
                current: null,
                handling: false,
                position: 0
            };

            // Set up event listeners based on mode
            if (mode === 'hash') {
                // Ensure hash exists
                if (!window.location.hash) {
                    window.location.hash = '/';
                }

                // Listen for hash changes
                window.addEventListener('hashchange', (event) => {
                    // Skip if we're handling a programmatic navigation
                    if (this._historyState.handling) {
                        this._historyState.handling = false;
                        return;
                    }

                    // Track navigation direction
                    const oldURL = new URL(event.oldURL);
                    const newURL = new URL(event.newURL);

                    // Store old hash for potential restoration
                    this._historyState.current = oldURL.hash.slice(1);

                    // Handle the route change
                    this._onRouteChange().catch(error => {
                        console.error('Error during hashchange navigation:', error);
                    });
                });
            } else {
                // History mode

                // Check if server supports history mode
                if (typeof window.history.pushState !== 'function') {
                    console.warn('History API is not supported by this browser. Falling back to hash mode.');
                    mode = 'hash';
                    return this.init(options);
                }

                // Listen for popstate events
                window.addEventListener('popstate', (event) => {
                    // Skip if we're handling a programmatic navigation
                    if (this._historyState.handling) {
                        this._historyState.handling = false;
                        return;
                    }

                    // Track navigation direction
                    const direction = event.state?.position > this._historyState.position ? 'forward' : 'back';
                    this._historyState.position = event.state?.position || 0;

                    // Handle the route change
                    this._onRouteChange().catch(error => {
                        console.error(`Error during ${direction} navigation:`, error);
                    });
                });

                // Handle initial state with proper error handling for SecurityError
                try {
                    if (!window.history.state) {
                        window.history.replaceState(
                            { position: this._historyState.position },
                            '',
                            window.location.href
                        );
                    } else if (window.history.state.position) {
                        this._historyState.position = window.history.state.position;
                    }
                } catch (error) {
                    // Handle SecurityError: The operation is insecure
                    // This can happen in certain browser contexts (sandboxed, cross-origin, etc.)
                    // Note: SecurityError is not constructable, so we check error.name instead
                    if (error.name === 'SecurityError' || error.message.includes('insecure')) {
                        console.warn('History API is blocked by security policy. Routing will continue without state management:', error.message);
                    } else {
                        console.error('Error initializing history state:', error);
                    }
                    // Continue without setting initial state - routing will still work
                }
            }

            // Handle click events on links for better control
            if (options.handleLinks !== false) {
                document.addEventListener('click', (event) => {
                    // Only handle left clicks without modifier keys
                    if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
                        return;
                    }

                    // Find closest anchor element
                    let target = event.target;
                    while (target && target.tagName !== 'A') {
                        target = target.parentNode;
                    }

                    // Skip if no anchor found or has target attribute
                    if (!target || target.target || target.hasAttribute('download') || target.getAttribute('rel') === 'external') {
                        return;
                    }

                    // Get the href
                    const href = target.getAttribute('href');

                    // Skip if no href or it's a mail/phone link
                    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) {
                        return;
                    }

                    // Handle relative URLs
                    try {
                        const url = new URL(href, window.location.origin);

                        // Skip if different origin
                        if (url.origin !== window.location.origin) {
                            return;
                        }

                        // Get the path
                        let path = url.pathname + url.search + url.hash;

                        // Remove base path if present, but ensure we don't end up with an empty string
                        if (base && base !== '/' && path.startsWith(base)) {
                            path = path.slice(base.length);
                        }

                        // Ensure path is never empty; default to '/' if needed
                        if (!path) {
                            path = '/';
                        }

                        // Handle the navigation
                        event.preventDefault();
                        this.push(path);
                    } catch (error) {
                        console.warn('Error handling link click:', error);
                    }
                });
            }

            // Initial route resolution
            this._onRouteChange().catch(error => {
                console.error('Error during initial navigation:', error);
            });

            // Mark router as ready
            isReady = true;
            console.log('Router is now ready');

            // Mark as initialized
            this._initialized = true;

            return this;
        },

        /**
         * Handle route changes
         * @private
         */
        _onRouteChange() {
            console.log('_onRouteChange called');

            // Get the current path based on mode
            let path;
            if (mode === 'hash') {
                path = window.location.hash.slice(1) || '/';
                // Additional safety check: ensure path is never empty
                // This prevents the catchall route from being matched unintentionally
                if (!path || path.trim() === '') {
                    path = '/';
                }
                // Normalize path to always start with / for consistent matching
                if (path && !path.startsWith('/')) {
                    path = '/' + path;
                }
                console.log('Current hash path:', path);
            } else {
                path = window.location.pathname.slice(base.length) || '/';
                // Additional safety check: ensure path is never empty
                // This prevents the catchall route from being matched unintentionally
                if (!path || path.trim() === '') {
                    path = '/';
                }
                console.log('Current history path:', path);
            }

            // Match the route
            console.log('Matching route for path:', path);
            const matchedRoute = this._matchRoute(path);
            console.log('Matched route result:', matchedRoute);

            // Update current route - create a new object to ensure reactivity
            // Update the reactive ref, not the plain object
            currentRouteRef.value = { ...matchedRoute };
            currentRoute = currentRouteRef.value;
            console.log('Updated currentRoute:', currentRoute);

            // Force a re-render of all router-view components
            if (typeof document !== 'undefined') {
                // Find all router view containers
                const routerViewContainers = document.querySelectorAll('.kal-router-view-container');
                console.log('Found', routerViewContainers.length, 'router view containers to update');

                // Trigger updates on each container
                routerViewContainers.forEach(container => {
                    if (container._update && typeof container._update === 'function') {
                        console.log('Triggering update on router view container');
                        container._update();
                    }
                });
            }

            // Notify listeners
            console.log('Notifying', listeners.length, 'listeners');
            listeners.forEach(listener => {
                try {
                    listener({ ...matchedRoute });
                } catch (err) {
                    console.error('Error in route change listener:', err);
                }
            });

            // Notify route change callbacks
            console.log('Notifying', routeChangeCallbacks.length, 'route change callbacks');
            routeChangeCallbacks.forEach(callback => {
                try {
                    callback({ ...matchedRoute });
                } catch (err) {
                    console.error('Error in route change callback:', err);
                }
            });

            // Trigger a global event for components to listen to
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                const event = new CustomEvent('kalroute', {
                    detail: { route: { ...matchedRoute } }
                });
                window.dispatchEvent(event);
            }

            return Promise.resolve(matchedRoute);
        },

        /**
         * Match a path against defined routes
         * @param {string} path - Path to match
         * @returns {Object} Matched route info
         */
        _matchRoute(path) {
            // Ensure path is never empty or undefined
            if (!path || path.trim() === '') {
                path = '/';
            }

            // Normalize path to always start with / for consistent matching
            if (path && !path.startsWith('/')) {
                path = '/' + path;
            }

            console.log('_matchRoute called with path:', path);
            console.log('Available routes:', this.routes.map(r => r.path));

            // Extract query string and hash
            const queryIndex = path.indexOf('?');
            const hashIndex = path.indexOf('#');

            let cleanPath = path;
            let queryString = '';
            let hash = '';

            // Extract query and hash considering their order
            if (queryIndex !== -1 && (hashIndex === -1 || queryIndex < hashIndex)) {
                queryString = path.slice(queryIndex, hashIndex === -1 ? undefined : hashIndex);
                if (hashIndex !== -1) {
                    hash = path.slice(hashIndex);
                }
                cleanPath = path.slice(0, queryIndex);
            } else if (hashIndex !== -1) {
                hash = path.slice(hashIndex);
                cleanPath = path.slice(0, hashIndex);
            }

            // Handle trailing slash based on configuration
            if (!trailingSlash && cleanPath.length > 1 && cleanPath.endsWith('/')) {
                cleanPath = cleanPath.slice(0, -1);
            } else if (trailingSlash && !cleanPath.endsWith('/') && cleanPath !== '/') {
                cleanPath = cleanPath + '/';
            }

            // First check for exact match
            if (routeMap[cleanPath]) {
                const matchedRoute = routeMap[cleanPath];
                return {
                    path: cleanPath,
                    fullPath: path,
                    name: matchedRoute.name || null,
                    matched: [matchedRoute],
                    params: {},
                    query: this._parseQuery(queryString),
                    hash: hash,
                    meta: matchedRoute.meta || {}
                };
            }

            // Check nested routes first (most specific to least specific)
            console.log('Sorting routes for matching, routes count:', this.routes.length);
            const sortedRoutes = [...this.routes].sort((a, b) => {
                // Sort catch-all/pathMatch routes LAST
                const aIsPathMatch = a.path.includes(':pathMatch(') || a.path === '/:pathMatch(.*)*';
                const bIsPathMatch = b.path.includes(':pathMatch(') || b.path === '/:pathMatch(.*)*';

                if (aIsPathMatch && !bIsPathMatch) return 1;
                if (!aIsPathMatch && bIsPathMatch) return -1;
                if (aIsPathMatch && bIsPathMatch) return 0; // Both are pathMatch, keep order

                // Sort by path segments count (more segments first)
                const aSegments = a.path.split('/').filter(Boolean).length;
                const bSegments = b.path.split('/').filter(Boolean).length;

                if (aSegments !== bSegments) {
                    return bSegments - aSegments;
                }

                // If same number of segments, prioritize exact matches over dynamic
                const aExact = !a.path.includes(':');
                const bExact = !b.path.includes(':');

                if (aExact !== bExact) {
                    return aExact ? -1 : 1; // Exact matches first
                }

                // If same number of segments, prioritize dynamic routes less
                const aDynamic = a.path.includes(':');
                const bDynamic = b.path.includes(':');

                if (aDynamic !== bDynamic) {
                    return aDynamic ? 1 : -1;
                }

                // If both dynamic, prioritize the one with fewer dynamic segments
                if (aDynamic) {
                    const aDynamicCount = a.path.split(':').length - 1;
                    const bDynamicCount = b.path.split(':').length - 1;
                    return aDynamicCount - bDynamicCount;
                }

                // Otherwise, prioritize by path length (longer paths first)
                return b.path.length - a.path.length;
            });

            // Check dynamic routes
            for (const route of sortedRoutes) {
                const match = this._matchDynamicRoute(route, cleanPath);
                if (match) {
                    // Handle nested routes
                    const matched = [route];

                    // If this route has children, check if any match
                    if (route.children) {
                        // Get the remaining path after the parent route
                        let remainingPath = cleanPath;
                        if (route.path !== '/' && cleanPath.startsWith(route.path)) {
                            remainingPath = cleanPath.slice(route.path.length) || '/';
                        }

                        // Match against children
                        for (const child of route.children) {
                            // Create full child path
                            const fullChildPath = route.path === '/'
                                ? child.path
                                : `${route.path}${child.path.startsWith('/') ? child.path : '/' + child.path}`;

                            // Check if child path matches
                            const childMatch = this._matchDynamicRoute({ ...child, path: fullChildPath }, cleanPath);
                            if (childMatch) {
                                matched.push(child);
                                // Merge params
                                Object.assign(match.params, childMatch.params);
                                break;
                            }
                        }
                    }

                    // Collect meta data from all matched routes
                    const meta = matched.reduce((result, route) => {
                        return { ...result, ...(route.meta || {}) };
                    }, {});

                    return {
                        path: cleanPath,
                        fullPath: path,
                        name: matched[0].name || null,
                        matched,
                        params: match.params,
                        query: this._parseQuery(queryString),
                        hash: hash,
                        meta
                    };
                }
            }

            // Check for wildcard routes (including Vue Router style catch-all)
            console.log('Checking for wildcard routes in', this.routes.length, 'routes');
            for (const route of this.routes) {
                console.log('Checking if route is wildcard:', route.path);
                if (route.path === '*' ||
                    route.path === '/*' ||
                    route.path === '/:pathMatch(.*)*' ||
                    route.path.includes(':pathMatch(')) {

                    console.log('Found wildcard route:', route);
                    return {
                        path: cleanPath,
                        fullPath: path,
                        name: route.name || null,
                        matched: [route],
                        params: { pathMatch: cleanPath },
                        query: this._parseQuery(queryString),
                        hash: hash,
                        meta: route.meta || {}
                    };
                }
            }

            // No match found
            console.log('No route matched for path:', cleanPath);

            // Try to find the closest match for debugging
            const closestMatch = this.routes.map(route => {
                return {
                    path: route.path,
                    similarity: this._calculatePathSimilarity(route.path, cleanPath)
                };
            }).sort((a, b) => b.similarity - a.similarity)[0];

            console.log('Closest route match was:', closestMatch);

            return {
                path: cleanPath,
                fullPath: path,
                name: null,
                matched: [],
                params: {},
                query: this._parseQuery(queryString),
                hash: hash,
                meta: {}
            };
        },

        /**
         * Calculate similarity between two paths (for debugging)
         * @param {string} routePath - Route path
         * @param {string} actualPath - Actual path
         * @returns {number} Similarity score (0-1)
         * @private
         */
        _calculatePathSimilarity(routePath, actualPath) {
            // Simple implementation - can be improved
            const routeParts = routePath.split('/').filter(Boolean);
            const pathParts = actualPath.split('/').filter(Boolean);

            // If one is empty and the other isn't, they're not similar
            if ((routeParts.length === 0 && pathParts.length > 0) ||
                (pathParts.length === 0 && routeParts.length > 0)) {
                return routePath === '/' && actualPath === '/' ? 1 : 0;
            }

            // Count matching segments
            let matchCount = 0;
            const maxLength = Math.max(routeParts.length, pathParts.length);

            for (let i = 0; i < Math.min(routeParts.length, pathParts.length); i++) {
                const routePart = routeParts[i];
                const pathPart = pathParts[i];

                // Exact match
                if (routePart === pathPart) {
                    matchCount++;
                }
                // Parameter match
                else if (routePart.startsWith(':')) {
                    matchCount += 0.8; // Not a perfect match, but close
                }
                // Wildcard match
                else if (routePart === '*' || routePart.includes('*')) {
                    matchCount += 0.5; // Wildcard is a weaker match
                }
            }

            return matchCount / maxLength;
        },

        /**
         * Match a path against a dynamic route
         * @param {Object} route - Route definition
         * @param {string} path - Path to match
         * @returns {Object|null} Match result
         */
        _matchDynamicRoute(route, path) {
            // If route has a custom regex pattern, use that
            if (route.pathRegex) {
                const match = path.match(route.pathRegex);
                if (!match) return null;

                // Extract named capture groups as params
                const params = {};
                if (route.paramNames && route.paramNames.length > 0) {
                    route.paramNames.forEach((name, index) => {
                        params[name] = match[index + 1] || '';
                    });
                }

                return { params };
            }

            // Handle exact static routes quickly
            if (!route.path.includes(':') && !route.path.includes('*')) {
                return route.path === path ? { params: {} } : null;
            }

            // Handle root path
            if (route.path === '/' && path === '/') {
                return { params: {} };
            }

            // Split the paths into segments
            const routeParts = route.path.split('/').filter(Boolean);
            const pathParts = path.split('/').filter(Boolean);

            // Special case for root path with segments
            if (path === '/' && routeParts.length > 0) return null;

            // Handle pathMatch pattern (Vue Router style catch-all)
            if (route.path.includes(':pathMatch(')) {
                console.log('Matched pathMatch pattern route:', route.path, 'for path:', path);
                return { params: { pathMatch: path } };
            }

            // Handle catch-all routes
            if (route.path.endsWith('*') || route.path.includes('/*')) {
                const starIndex = routeParts.findIndex(part => part === '*' || part.endsWith('*'));

                // If star is the last segment, match everything after
                if (starIndex === routeParts.length - 1) {
                    // Check if the parts before the star match
                    for (let i = 0; i < starIndex; i++) {
                        const routePart = routeParts[i];
                        const pathPart = pathParts[i];

                        if (!pathPart) return null;

                        if (routePart.startsWith(':')) {
                            // It's a param, capture it
                            continue;
                        } else if (routePart !== pathPart) {
                            // Static part doesn't match
                            return null;
                        }
                    }

                    // All parts before the star match, capture the rest as pathMatch
                    const params = {};

                    // Capture named parameters before the star
                    for (let i = 0; i < starIndex; i++) {
                        const routePart = routeParts[i];
                        if (routePart.startsWith(':')) {
                            const paramName = routePart.slice(1);
                            params[paramName] = pathParts[i];
                        }
                    }

                    // Capture the rest as pathMatch
                    params.pathMatch = pathParts.slice(starIndex).join('/');

                    return { params };
                }
            }

            // For regular dynamic routes, check if the number of segments matches
            // unless we have optional parameters
            const hasOptionalParams = route.path.includes('?');

            if (!hasOptionalParams && routeParts.length !== pathParts.length) {
                return null;
            }

            const params = {};

            // Match each segment
            for (let i = 0; i < routeParts.length; i++) {
                const routePart = routeParts[i];
                const pathPart = pathParts[i];

                // Handle optional parameters (e.g., :id?)
                if (routePart.endsWith('?')) {
                    if (!pathPart) {
                        // Optional parameter is missing, which is fine
                        continue;
                    }

                    // Extract parameter name without the ? and :
                    const paramName = routePart.slice(1, -1);
                    params[paramName] = pathPart;
                    continue;
                }

                // If we've run out of path parts but still have route parts
                if (!pathPart) {
                    return null;
                }

                // Check for dynamic segment
                if (routePart.startsWith(':')) {
                    // Extract parameter name
                    const paramName = routePart.slice(1);

                    // Check if parameter has a custom regex pattern
                    const regexMatch = paramName.match(/^([^(]+)\\((.+)\\)$/);

                    if (regexMatch) {
                        // We have a custom regex for this parameter
                        const [, name, pattern] = regexMatch;
                        const regex = new RegExp(`^${pattern}$`);

                        if (!regex.test(pathPart)) {
                            // Path part doesn't match the regex pattern
                            return null;
                        }

                        params[name] = pathPart;
                    } else {
                        // Regular parameter
                        params[paramName] = pathPart;
                    }
                } else if (routePart !== pathPart) {
                    // Static segments must match exactly
                    return null;
                }
            }

            // If we have more path parts than route parts, it's not a match
            // unless the last route part is a catch-all
            if (pathParts.length > routeParts.length) {
                const lastRoutePart = routeParts[routeParts.length - 1];
                if (lastRoutePart === '*' || lastRoutePart.endsWith('*')) {
                    // Capture the rest as pathMatch
                    params.pathMatch = pathParts.slice(routeParts.length - 1).join('/');
                } else {
                    return null;
                }
            }

            return { params };
        },

        /**
         * Extract query parameters from a path or query string
         * @param {string} path - URL path or query string
         * @returns {Object} Query parameters
         */
        _parseQuery(path) {
            // If custom query parser is provided, use it
            if (parseQuery && typeof parseQuery === 'function') {
                return parseQuery(path);
            }

            // Handle empty or undefined input
            if (!path) return {};

            // If path doesn't contain a question mark, check if it's already a query string
            let queryString;
            if (path.startsWith('?')) {
                queryString = path.slice(1);
            } else {
                const queryIndex = path.indexOf('?');
                if (queryIndex === -1) return {};
                queryString = path.slice(queryIndex + 1);
            }

            // Handle empty query string
            if (!queryString) return {};

            const query = {};

            // Split by & and process each pair
            queryString.split('&').forEach(pair => {
                if (!pair) return;

                const equalsIndex = pair.indexOf('=');
                let key, value;

                if (equalsIndex === -1) {
                    // No equals sign, treat as boolean flag
                    key = decodeURIComponent(pair);
                    value = true;
                } else {
                    key = decodeURIComponent(pair.slice(0, equalsIndex));
                    value = pair.slice(equalsIndex + 1);

                    // Handle empty value
                    if (value === '') {
                        value = null;
                    } else {
                        value = decodeURIComponent(value);

                        // Try to parse numbers and booleans
                        if (value === 'true') {
                            value = true;
                        } else if (value === 'false') {
                            value = false;
                        } else if (value === 'null') {
                            value = null;
                        } else if (!isNaN(Number(value)) && value.trim() !== '') {
                            // Only convert to number if it's not an empty string
                            value = Number(value);
                        }
                    }
                }

                // Handle array parameters (e.g., ids[]=1&ids[]=2)
                if (key.endsWith('[]')) {
                    const arrayKey = key.slice(0, -2);
                    if (!query[arrayKey]) {
                        query[arrayKey] = [];
                    }
                    query[arrayKey].push(value);
                } else {
                    // Handle duplicate keys as arrays
                    if (key in query) {
                        if (!Array.isArray(query[key])) {
                            query[key] = [query[key]];
                        }
                        query[key].push(value);
                    } else {
                        query[key] = value;
                    }
                }
            });

            return query;
        },

        /**
         * Stringify query parameters to a query string
         * @param {Object} query - Query parameters
         * @returns {string} Query string
         */
        _stringifyQuery(query) {
            // If custom query stringifier is provided, use it
            if (stringifyQuery && typeof stringifyQuery === 'function') {
                return stringifyQuery(query);
            }

            if (!query || Object.keys(query).length === 0) {
                return '';
            }

            const parts = [];

            for (const key in query) {
                const value = query[key];

                if (value === undefined || value === null) {
                    // Skip null and undefined values
                    continue;
                }

                if (Array.isArray(value)) {
                    // Handle arrays
                    value.forEach(item => {
                        if (item !== undefined && item !== null) {
                            const encodedValue = typeof item === 'string'
                                ? encodeURIComponent(item)
                                : encodeURIComponent(String(item));
                            parts.push(`${encodeURIComponent(key)}[]=${encodedValue}`);
                        }
                    });
                } else if (typeof value === 'object') {
                    // Skip objects (can't be properly serialized)
                    console.warn(`Cannot stringify query parameter "${key}" with value`, value);
                } else if (value === true) {
                    // Boolean true is serialized as just the key
                    parts.push(encodeURIComponent(key));
                } else if (value === false) {
                    // Boolean false is serialized as key=false
                    parts.push(`${encodeURIComponent(key)}=false`);
                } else {
                    // Other values
                    const encodedValue = typeof value === 'string'
                        ? encodeURIComponent(value)
                        : encodeURIComponent(String(value));
                    parts.push(`${encodeURIComponent(key)}=${encodedValue}`);
                }
            }

            return parts.length ? `?${parts.join('&')}` : '';
        },

        /**
         * Handle route changes
         * @returns {Promise} Promise that resolves when route change is complete
         */
        _onRouteChange() {
            // Save current scroll position for potential scroll restoration
            this._savedPosition = {
                x: window.scrollX,
                y: window.scrollY
            };

            let path;
            let query = '';
            let hash = '';

            if (this.mode === 'hash') {
                const hashValue = window.location.hash.slice(1);

                // Extract hash fragment from the hash value if present
                const fragmentIndex = hashValue.indexOf('#');
                if (fragmentIndex !== -1) {
                    hash = hashValue.slice(fragmentIndex);
                    path = hashValue.slice(0, fragmentIndex);
                } else {
                    path = hashValue;
                }

                // Extract query string if present
                const queryIndex = path.indexOf('?');
                if (queryIndex !== -1) {
                    query = path.slice(queryIndex);
                    path = path.slice(0, queryIndex);
                }
            } else {
                const base = this.base || '';
                path = window.location.pathname.slice(base.length);
                query = window.location.search;
                hash = window.location.hash;
            }

            // Ensure path starts with /
            if (!path.startsWith('/')) {
                path = '/' + path;
            }

            // Construct full path
            const fullPath = path + query + hash;

            // Match the route
            const route = this._matchRoute(fullPath);

            // Store previous route for navigation guards
            previousRoute = { ...this.currentRoute };

            // Check if the route has actually changed
            const hasChanged =
                !this.currentRoute ||
                this.currentRoute.path !== route.path ||
                JSON.stringify(this.currentRoute.params) !== JSON.stringify(route.params) ||
                JSON.stringify(this.currentRoute.query) !== JSON.stringify(route.query);

            if (!hasChanged) {
                // If only the hash changed, just update the hash and scroll
                if (this.currentRoute.hash !== route.hash) {
                    this.currentRoute.hash = route.hash;

                    // Scroll to hash element if present
                    if (route.hash && route.hash.length > 1) {
                        try {
                            // Properly escape the hash selector - remove # and escape special characters
                            const selector = route.hash.startsWith('#') ? route.hash.slice(1) : route.hash;
                            // Only try to scroll if the selector is a valid ID (no slashes or other invalid characters)
                            if (/^[a-zA-Z0-9_-]+$/.test(selector)) {
                                const element = document.querySelector('#' + selector);
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth' });
                                }
                            }
                        } catch (error) {
                            console.warn('Failed to scroll to hash element:', error);
                        }
                    }
                }

                return Promise.resolve(this.currentRoute);
            }

            // Run navigation guards
            return this._runGuards(route, previousRoute)
                .then(guardResult => {
                    // Check if navigation was redirected
                    if (typeof guardResult === 'string' || (guardResult && guardResult.path)) {
                        // Handle redirect
                        return this.replace(guardResult);
                    }

                    // If guard returned false, abort navigation
                    if (guardResult === false) {
                        // Revert to previous URL
                        if (this.mode === 'hash') {
                            window.location.hash = previousRoute.fullPath || previousRoute.path;
                        } else {
                            window.history.replaceState(
                                { path: previousRoute.path },
                                '',
                                base + (previousRoute.fullPath || previousRoute.path)
                            );
                        }

                        return Promise.reject(new Error('Navigation aborted by guard'));
                    }

                    // Update current route - use reactive ref
                    currentRouteRef.value = route;
                    currentRoute = currentRouteRef.value;

                    // Log route change for debugging
                    console.log(
                        'Route changed to:', path,
                        'Matched component:', route.matched[0]?.component?.name || 'Unknown',
                        'Params:', route.params,
                        'Query:', route.query
                    );

                    // Apply scroll behavior if defined
                    if (scrollBehavior && typeof scrollBehavior === 'function') {
                        Promise.resolve().then(() => {
                            scrollBehavior(route, previousRoute, this._savedPosition);
                        });
                    } else if (route.hash && route.hash.length > 1) {
                        // Default hash scrolling behavior
                        try {
                            // Properly escape the hash selector - remove # and escape special characters
                            const selector = route.hash.startsWith('#') ? route.hash.slice(1) : route.hash;
                            // Only try to scroll if the selector is a valid ID (no slashes or other invalid characters)
                            if (/^[a-zA-Z0-9_-]+$/.test(selector)) {
                                const element = document.querySelector('#' + selector);
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth' });
                                }
                            }
                        } catch (error) {
                            console.warn('Failed to scroll to hash element:', error);
                        }
                    } else if (this._savedPosition) {
                        // Restore saved position for back/forward navigation
                        window.scrollTo(this._savedPosition.x, this._savedPosition.y);
                    } else {
                        // Scroll to top for new navigation
                        window.scrollTo(0, 0);
                    }

                    // Notify listeners
                    listeners.forEach(callback => {
                        try {
                            callback(route);
                        } catch (error) {
                            console.error('Error in route change listener:', error);
                        }
                    });

                    // Notify route change callbacks (from onChange method)
                    routeChangeCallbacks.forEach(callback => {
                        try {
                            callback(route);
                        } catch (error) {
                            console.error('Error in route change callback:', error);
                        }
                    });

                    return route;
                })
                .catch(error => {
                    console.error('Error during route change:', error);
                    return Promise.reject(error);
                });
        },

        /**
         * Install the router into an application
         * @param {Object} app - Application instance
         */
        install(app) {
            // Inject router into components
            app._context.$router = this;

            // Register router globally for easier access by useRouter()
            if (typeof window !== 'undefined') {
                window.__KAL_ROUTER__ = this;
            }

            // Initialize router
            this.init();
        }
    };

    return router;
}

/**
 * Composition API hook for accessing the router instance
 * @returns {Object} Router instance and reactive route state
 */
export function useRouter() {
    // Try to find the router instance in various possible locations
    let router;

    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
        // Option 1: Check the newly exposed router instance (ISSUE 4 FIX)
        if (window.__KAL_ROUTER_INSTANCE__) {
            router = window.__KAL_ROUTER_INSTANCE__;
        }
        // Option 2: Check for global router (window.router exposed in main.js)
        else if (window.router) {
            router = window.router;
        }
        // Option 3: Check the global KalxJS app instance
        else if (window.__KAL_APP__ && window.__KAL_APP__._context && window.__KAL_APP__._context.$router) {
            router = window.__KAL_APP__._context.$router;
        }
        // Option 4: Check for a globally registered router instance
        else if (window.__KAL_ROUTER__) {
            router = window.__KAL_ROUTER__;
        }
        // Option 5: Check for router in current component context (if available)
        else if (window.__KAL_CURRENT_INSTANCE__ && window.__KAL_CURRENT_INSTANCE__.$router) {
            router = window.__KAL_CURRENT_INSTANCE__.$router;
        }
    }

    // If no router is found, provide a fallback implementation
    if (!router) {
        // Only show warning in development mode or if explicitly enabled
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production' || (typeof window !== 'undefined' && window.__KAL_DEBUG__)) {
            console.warn('useRouter() was called with no active router on the page. Make sure to call app.use(router) before mounting your application.');
        }

        // Create reactive refs for the fallback implementation
        const route = ref({
            path: '/',
            fullPath: '/',
            params: {},
            query: {},
            hash: '',
            matched: [],
            meta: {}
        });

        const params = computed(() => ({}));
        const query = computed(() => ({}));
        const path = computed(() => '/');
        const hash = computed(() => '');
        const fullPath = computed(() => '/');
        const meta = computed(() => ({}));
        const name = computed(() => null);
        const matched = computed(() => []);
        const isActive = () => false;
        const isExactActive = () => false;

        // Return a minimal implementation to prevent errors
        return {
            // Router instance (null)
            router: null,

            // Route state
            route,
            params,
            query,
            path,
            hash,
            fullPath,
            meta,
            name,
            matched,

            // Navigation methods (no-ops with warnings)
            push: (location) => {
                console.warn(`Router not available. Cannot navigate to ${location}`);
                return Promise.reject(new Error('Router not available'));
            },
            replace: (location) => {
                console.warn(`Router not available. Cannot replace with ${location}`);
                return Promise.reject(new Error('Router not available'));
            },
            go: (n) => {
                console.warn(`Router not available. Cannot go ${n} steps`);
                return Promise.reject(new Error('Router not available'));
            },
            back: () => {
                console.warn('Router not available. Cannot go back');
                return Promise.reject(new Error('Router not available'));
            },
            forward: () => {
                console.warn('Router not available. Cannot go forward');
                return Promise.reject(new Error('Router not available'));
            },

            // Route matching helpers
            isActive,
            isExactActive,

            // Route construction helpers
            resolve: () => ({ href: '/' }),

            // Navigation guards
            beforeEach: () => () => { },
            beforeResolve: () => () => { },
            afterEach: () => () => { }
        };
    }

    // Create reactive references to route properties
    const route = ref(router.currentRoute);

    // Update the reactive route when navigation occurs
    router.onChange((newRoute) => {
        console.log('useRouter: Route changed to', newRoute.path);
        console.log('useRouter: New route matched array:', newRoute.matched);
        // Create a new object to ensure reactivity triggers
        route.value = { ...newRoute };
    });

    // Also set the initial route value
    console.log('useRouter: Setting initial route value', router.currentRoute);
    route.value = { ...router.currentRoute };

    // Computed properties for commonly used route values
    const params = computed(() => route.value.params || {});
    const query = computed(() => route.value.query || {});
    const path = computed(() => route.value.path || '/');
    const hash = computed(() => route.value.hash || '');
    const fullPath = computed(() => route.value.fullPath || route.value.path || '/');
    const meta = computed(() => route.value.meta || {});
    const matched = computed(() => route.value.matched || []);

    // Get route name (if available)
    const name = computed(() => {
        const firstMatch = route.value.matched && route.value.matched[0];
        return firstMatch ? firstMatch.name || null : null;
    });

    /**
     * Check if a route is active
     * @param {string|Object} routeLocation - Route to check
     * @param {boolean} exact - Whether to check for exact match
     * @returns {boolean} Whether the route is active
     */
    const isRouteActive = (routeLocation, exact = false) => {
        // Normalize the route location
        const location = typeof routeLocation === 'string'
            ? { path: routeLocation }
            : routeLocation;

        // Get the current path
        const currentPath = route.value.path;

        // Check by name if provided
        if (location.name && name.value) {
            return location.name === name.value;
        }

        // Check by path
        if (location.path) {
            if (exact) {
                return location.path === currentPath;
            } else {
                return currentPath.startsWith(location.path);
            }
        }

        return false;
    };

    /**
     * Check if a route is active (non-exact match)
     * @param {string|Object} routeLocation - Route to check
     * @returns {boolean} Whether the route is active
     */
    const isActive = (routeLocation) => isRouteActive(routeLocation, false);

    /**
     * Check if a route is exactly active
     * @param {string|Object} routeLocation - Route to check
     * @returns {boolean} Whether the route is exactly active
     */
    const isExactActive = (routeLocation) => isRouteActive(routeLocation, true);

    /**
     * Resolve a route location to a URL
     * @param {string|Object} routeLocation - Route to resolve
     * @returns {Object} Resolved route with href
     */
    const resolve = (routeLocation) => {
        // Normalize the route location
        const location = typeof routeLocation === 'string'
            ? { path: routeLocation }
            : routeLocation;

        // Get the base URL
        const base = router.base || '';

        // Construct the URL based on mode
        let href;

        if (router.mode === 'hash') {
            href = window.location.origin + window.location.pathname + '#' + location.path;
        } else {
            // Normalize base and path to avoid double slashes
            let normalizedBase = base;
            let normalizedPath = location.path;
            
            // Remove trailing slash from base if path starts with /
            if (normalizedBase.endsWith('/') && normalizedPath.startsWith('/')) {
                normalizedBase = normalizedBase.slice(0, -1);
            }
            
            href = window.location.origin + normalizedBase + normalizedPath;
        }

        // Add query string if present
        if (location.query && Object.keys(location.query).length > 0) {
            const queryString = router._stringifyQuery(location.query);
            href += queryString;
        }

        // Add hash if present
        if (location.hash) {
            href += location.hash.startsWith('#') ? location.hash : '#' + location.hash;
        }

        return {
            href,
            location,
            route: router._matchRoute(location.path)
        };
    };

    return {
        // Expose the router instance
        router,

        // Navigation methods
        push: (location) => router.push(location),
        replace: (location) => router.replace(location),
        go: (n) => router.go(n),
        back: () => router.back(),
        forward: () => router.forward(),

        // Route state
        route,
        params,
        query,
        path,
        hash,
        fullPath,
        meta,
        name,
        matched,

        // Route matching helpers
        isActive,
        isExactActive,

        // Route construction helpers
        resolve,

        // Navigation guards
        beforeEach: (guard) => router.beforeEach(guard),
        beforeResolve: (guard) => router.beforeResolve(guard),
        afterEach: (hook) => router.afterEach(hook)
    };
}

// Create a Router View component that renders the matched route component
export function RouterView(props = {}) {
    // Get the current router instance and route
    const { router, route } = useRouter();

    // Add a listener for route changes
    if (typeof window !== 'undefined') {
        window.addEventListener('kalroute', (event) => {
            console.log('RouterView received kalroute event:', event.detail);
            // Force re-render of the component
            if (typeof document !== 'undefined') {
                const routerViewContainers = document.querySelectorAll('.kal-router-view-container');
                routerViewContainers.forEach(container => {
                    if (container._update && typeof container._update === 'function') {
                        container._update();
                    }
                });
            }
        });
    }

    if (!router || !route.value) {
        console.warn('RouterView: No active router found');
        return {
            tag: 'div',
            props: { class: 'kal-router-view' },
            children: ['No router found']
        };
    }

    // Get the matched route component
    console.log('RouterView rendering with route:', route.value);

    // Check if we have a matched route
    if (!route.value.matched || route.value.matched.length === 0) {
        console.error('RouterView: No matched routes found');
        console.log('Current route value:', route.value);

        // Try to find a fallback route (wildcard route)
        const fallbackRoute = router.routes.find(r =>
            r.path === '*' ||
            r.path === '/*' ||
            r.path.includes(':pathMatch(')
        );

        if (fallbackRoute && fallbackRoute.component) {
            console.log('Found fallback route:', fallbackRoute);

            // Use the fallback component
            const FallbackComponent = fallbackRoute.component;

            // Check if the component has a setup function (object component)
            if (typeof FallbackComponent === 'object' && FallbackComponent.setup) {
                console.log('Fallback component has setup function');
                try {
                    // Call the setup function to get the render function
                    const renderFn = FallbackComponent.setup();

                    // If the setup function returns a render function, call it
                    if (typeof renderFn === 'function') {
                        console.log('Calling render function from setup');
                        return renderFn();
                    }
                } catch (err) {
                    console.error('Error calling setup function:', err);
                }
            }

            // Otherwise return the component directly
            console.log('Returning fallback component directly');

            // If it's a function component, call it
            if (typeof FallbackComponent === 'function') {
                console.log('Fallback component is a function, calling it');
                try {
                    const result = FallbackComponent();
                    console.log('Function component result:', result);
                    if (result && typeof result === 'object') {
                        return result;
                    }
                } catch (err) {
                    console.error('Error calling function component:', err);
                }
            }

            // If not a function or error calling it, return as tag
            return {
                tag: 'div',
                props: { class: 'kal-router-view-fallback' },
                children: [
                    {
                        tag: 'h2',
                        props: {},
                        children: ['404 Not Found']
                    },
                    {
                        tag: 'p',
                        props: {},
                        children: ['The page you are looking for does not exist.']
                    }
                ]
            };
        }

        // If no fallback route or error rendering it, show debug info
        return {
            tag: 'div',
            props: { class: 'kal-router-view-error' },
            children: [
                {
                    tag: 'h3',
                    props: {},
                    children: ['No matching route found']
                },
                {
                    tag: 'pre',
                    props: { style: 'background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;' },
                    children: [JSON.stringify(route.value, null, 2)]
                }
            ]
        };
    }

    const matchedRoute = route.value.matched[0];
    console.log('Matched route for RouterView:', matchedRoute);

    if (!matchedRoute.component) {
        console.error('RouterView: Matched route has no component defined');
        return {
            tag: 'div',
            props: { class: 'kal-router-view-error' },
            children: ['Matched route has no component defined']
        };
    }

    // Render the matched component as a vnode
    const Component = matchedRoute.component;
    console.log('Rendering component:', Component);

    // Handle component definition object (with setup function)
    if (Component && typeof Component === 'object' && typeof Component.setup === 'function') {
        console.log('Component has setup function, calling it');
        try {
            // Call the setup function to get the actual component
            const setupResult = Component.setup(props);
            console.log('Setup result type:', typeof setupResult);

            // Handle different types of setup results
            if (setupResult) {
                if (typeof setupResult === 'object') {
                    // Case 1: Setup returned an object (hopefully a vnode)
                    console.log('Setup returned an object');
                    if (!setupResult.tag) {
                        console.warn('RouterView: Component setup returned object without tag, creating a default vnode');
                        return {
                            tag: 'div',
                            props: { class: 'kal-router-view-default' },
                            children: ['Component returned data without a view']
                        };
                    } else if (typeof setupResult.tag !== 'string') {
                        console.warn('RouterView: Component setup returned object with invalid tag, setting to div');
                        setupResult.tag = 'div';
                    }
                    return setupResult;
                } else if (typeof setupResult === 'function') {
                    // Case 2: Setup returned a function (render function)
                    console.log('RouterView: Component setup returned a function, calling it');
                    try {
                        const renderResult = setupResult();
                        console.log('Render result:', renderResult);
                        if (renderResult && typeof renderResult === 'object') {
                            if (!renderResult.tag) {
                                console.warn('Render result has no tag, setting to div');
                                renderResult.tag = 'div';
                            } else if (typeof renderResult.tag !== 'string' && typeof renderResult.tag !== 'function') {
                                console.warn('Render result has invalid tag type:', typeof renderResult.tag);
                                renderResult.tag = 'div';
                            }
                            return renderResult;
                        } else {
                            console.error('Render function did not return a valid view');
                            return {
                                tag: 'div',
                                props: { class: 'kal-router-view-error' },
                                children: ['Render function did not return a valid view']
                            };
                        }
                    } catch (renderError) {
                        console.error('RouterView: Error calling render function:', renderError);
                        return {
                            tag: 'div',
                            props: { class: 'kal-router-view-error' },
                            children: [`Error in render function: ${renderError.message}`]
                        };
                    }
                } else {
                    // Case 3: Setup returned a primitive value
                    console.warn('RouterView: Component setup returned a primitive value:', setupResult);
                    return {
                        tag: 'div',
                        props: { class: 'kal-router-view-primitive' },
                        children: [String(setupResult)]
                    };
                }
            } else {
                // Case 4: Setup returned null or undefined
                console.error('RouterView: Component setup did not return a valid value', setupResult);
                return {
                    tag: 'div',
                    props: { class: 'kal-router-view-error' },
                    children: ['Component setup did not return a valid view']
                };
            }
        } catch (error) {
            console.error('RouterView: Error in component setup', error);
            return {
                tag: 'div',
                props: { class: 'kal-router-view-error' },
                children: [`Error in component setup: ${error.message}`]
            };
        }
    }

    // Check if Component is a function (functional component)
    if (typeof Component === 'function') {
        console.log('Component is a function, trying to call it directly');
        try {
            // Try to call the function directly first
            try {
                const result = Component(props);
                console.log('Function component result:', result);
                if (result && typeof result === 'object') {
                    return result;
                }
            } catch (directCallError) {
                console.warn('Error calling component function directly:', directCallError);
                // Fall back to the placeholder approach
            }

            // Create a placeholder element that will be replaced with the actual component
            const placeholder = {
                tag: 'div',
                props: {
                    class: 'kal-router-view-container',
                    'data-router-view': 'true',
                    'data-route-path': route.value.path,
                    ...props
                },
                children: [],
                // Store component reference for the renderer to use
                _componentRef: Component,
                // Add an update method that can be called to force re-rendering
                _update: function () {
                    console.log('Router view container update called');
                    // This will be replaced by the renderer with the actual update function
                }
            };

            // Add a hook for the renderer to know this is a router view component
            placeholder._isRouterView = true;
            console.log('Created placeholder for component:', placeholder);

            return placeholder;
        } catch (error) {
            console.error('RouterView: Error preparing component', error);
            return {
                tag: 'div',
                props: { class: 'kal-router-view-error' },
                children: [`Error preparing component: ${error.message}`]
            };
        }
    } else {
        console.error('RouterView: Component is not a valid component function', Component);

        // If Component is an object, try to render it directly
        if (typeof Component === 'object') {
            console.log('Trying to render object component directly');

            // If it has a render method, try to use it
            if (typeof Component.render === 'function') {
                try {
                    const result = Component.render();
                    if (result && typeof result === 'object') {
                        return result;
                    }
                } catch (err) {
                    console.error('Error calling render method:', err);
                }
            }

            // If it has a template property, try to render it
            if (Component.template) {
                return {
                    tag: 'div',
                    props: {
                        class: 'kal-router-view-template',
                        innerHTML: Component.template
                    },
                    children: []
                };
            }
        }

        // Final fallback
        return {
            tag: 'div',
            props: { class: 'kal-router-view-error' },
            children: [
                {
                    tag: 'h3',
                    props: {},
                    children: ['Invalid Route Component']
                },
                {
                    tag: 'p',
                    props: {},
                    children: [`Component type: ${typeof Component}`]
                }
            ]
        };
    }
}

/**
 * Create a Router Link component for navigation
 * @param {Object} props - Component props
 * @param {string|Object} props.to - Target route
 * @param {boolean} props.replace - Whether to replace current route
 * @param {string} props.activeClass - Class to apply when route is active
 * @param {string} props.exactActiveClass - Class to apply when route is exactly active
 * @param {boolean} props.custom - Whether to render as a custom element
 * @param {Array} props.children - Child elements
 * @returns {Object} Virtual DOM node
 */
export function RouterLink(props = {}) {
    // Get the router instance and helpers
    const { router, route, resolve } = useRouter();

    // Default props
    const {
        to = '/',
        replace = false,
        activeClass = 'router-link-active',
        exactActiveClass = 'router-link-exact-active',
        custom = false,
        ariaCurrentValue = 'page',
        ...restProps
    } = props;

    // Resolve the link target
    const resolved = resolve(to);
    // Extract just the path from the resolved href (remove origin)
    const href = resolved.href.replace(window.location.origin, '');

    // Normalize the target route location
    const targetLocation = typeof to === 'string' ? { path: to } : to;

    // Handle navigation
    const navigate = (e) => {
        // Don't handle if:
        // 1. Right-click
        // 2. Has modifier keys
        // 3. Using <a> tag with target="_blank"
        if (e.button !== undefined && e.button !== 0 ||
            e.ctrlKey || e.shiftKey || e.altKey || e.metaKey ||
            (props.target && props.target !== '_self')) {
            return;
        }

        // Prevent default anchor click behavior
        e.preventDefault();

        // Perform navigation
        if (router) {
            const navigationMethod = replace ? 'replace' : 'push';
            router[navigationMethod](to).catch(err => {
                console.error('Navigation error:', err);
            });
        } else {
            console.warn('RouterLink: No active router found');
        }
    };

    // Return a component factory function that re-evaluates on each render
    // This allows reactive updates when the route changes
    return () => {
        // Read the current route path directly - this creates a reactive dependency
        const currentPath = route.value ? route.value.path : '/';

        // Compute active states by directly checking against current path
        const targetPath = targetLocation.path;
        const isRouteExactActive = targetPath === currentPath;
        const isRouteActive = currentPath.startsWith(targetPath);

        // Compute classes based on active state
        const classes = {};
        if (isRouteExactActive) {
            classes[exactActiveClass] = true;
        }
        if (isRouteActive && !isRouteExactActive) {
            classes[activeClass] = true;
        }

        // Combine with any classes from props
        if (props.class) {
            if (typeof props.class === 'string') {
                props.class.split(' ').forEach(cls => {
                    if (cls) classes[cls] = true;
                });
            } else if (Array.isArray(props.class)) {
                props.class.forEach(cls => {
                    if (cls) classes[cls] = true;
                });
            } else if (typeof props.class === 'object') {
                Object.assign(classes, props.class);
            }
        }

        // Convert classes object to string
        const classString = Object.keys(classes)
            .filter(key => classes[key])
            .join(' ');

        // If custom rendering is requested, return a slot function
        if (custom) {
            return {
                tag: props.tag || 'span',
                props: {
                    ...restProps,
                    class: classString || undefined,
                    onClick: navigate
                },
                children: props.children || []
            };
        }

        // Default rendering as an anchor
        return {
            tag: 'a',
            props: {
                ...restProps,
                href,
                class: classString || undefined,
                onClick: navigate,
                'aria-current': isRouteExactActive ? ariaCurrentValue : null
            },
            children: props.children || []
        };
    };
}
