// packages/router/src/index.js
/**
 * kalxjs Router - A routing system for single-page applications
 */

import { ref, computed } from '@kalxjs/core';

/**
 * Create a web history object for HTML5 history mode
 * @param {string} base - Base URL
 * @returns {Object} History object
 */
export function createWebHistory(base = '') {
    return {
        type: 'history',
        base,
        location: typeof window !== 'undefined' ? window.location.pathname : '/',
        state: typeof window !== 'undefined' ? window.history.state : null,
        push: (url, replace = false) => {
            if (typeof window !== 'undefined') {
                const method = replace ? 'replaceState' : 'pushState';
                window.history[method](null, '', url);
            }
        },
        replace: (url) => {
            if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', url);
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
    let mode = options.mode || 'hash'; // Changed from const to let to allow reassignment
    const base = options.base || '';
    const scrollBehavior = options.scrollBehavior;
    const caseSensitive = options.caseSensitive || false;
    const trailingSlash = options.trailingSlash || false;
    const parseQuery = options.parseQuery;
    const stringifyQuery = options.stringifyQuery;

    // Map of route paths to route objects for quick lookup
    const routeMap = routes.reduce((map, route) => {
        map[route.path] = route;
        return map;
    }, {});

    // Current route
    let currentRoute = {
        path: '/',
        params: {},
        query: {},
        matched: [],
        meta: {}
    };

    // Previous route for navigation guards
    let previousRoute = null;

    // Route change listeners
    const listeners = [];

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

    const router = {
        // Router properties
        routes,
        mode,
        base,
        currentRoute,

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
         * Navigate to a specific route
         * @param {string|Object} location - Route path or location object
         * @returns {Promise} Promise that resolves when navigation is complete
         */
        push(location) {
            return this._navigate(location, 'push');
        },

        /**
         * Replace current route without adding to history
         * @param {string|Object} location - Route path or location object
         * @returns {Promise} Promise that resolves when navigation is complete
         */
        replace(location) {
            return this._navigate(location, 'replace');
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

                        // Perform the actual navigation
                        if (navigationMethod === 'replace') {
                            if (mode === 'hash') {
                                const href = window.location.href;
                                const i = href.indexOf('#');
                                window.location.replace(href.slice(0, i >= 0 ? i : 0) + '#' + path);
                            } else {
                                window.history.replaceState({ path }, '', base + path);
                                this._onRouteChange();
                            }
                        } else {
                            if (mode === 'hash') {
                                window.location.hash = path;
                            } else {
                                window.history.pushState({ path }, '', base + path);
                                this._onRouteChange();
                            }
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
                return { path: location };
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
            return Promise.resolve();
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

                // Handle initial state
                if (!window.history.state) {
                    window.history.replaceState(
                        { position: this._historyState.position },
                        '',
                        window.location.href
                    );
                } else if (window.history.state.position) {
                    this._historyState.position = window.history.state.position;
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

                        // Remove base path if present
                        if (base && path.startsWith(base)) {
                            path = path.slice(base.length);
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

            // Mark as initialized
            this._initialized = true;

            return this;
        },

        /**
         * Add a route change listener
         * @param {Function} callback - Listener function
         * @returns {Function} Function to remove the listener
         */
        onChange(callback) {
            listeners.push(callback);

            return () => {
                const index = listeners.indexOf(callback);
                if (index !== -1) {
                    listeners.splice(index, 1);
                }
            };
        },

        /**
         * Match a path against defined routes
         * @param {string} path - Path to match
         * @returns {Object} Matched route info
         */
        _matchRoute(path) {
            // Extract query string and hash
            const queryIndex = path.indexOf('?');
            const hashIndex = path.indexOf('#');

            let cleanPath = path;
            let queryString = '';
            let hash = '';

            // Extract hash if present
            if (hashIndex !== -1) {
                hash = path.slice(hashIndex);
                cleanPath = path.slice(0, hashIndex);
            }

            // Extract query if present
            if (queryIndex !== -1) {
                queryString = cleanPath.slice(queryIndex);
                cleanPath = cleanPath.slice(0, queryIndex);
            }

            // Handle trailing slash based on configuration
            if (!trailingSlash && cleanPath.length > 1 && cleanPath.endsWith('/')) {
                cleanPath = cleanPath.slice(0, -1);
            } else if (trailingSlash && !cleanPath.endsWith('/') && cleanPath !== '/') {
                cleanPath = cleanPath + '/';
            }

            // First check for exact match
            if (routeMap[cleanPath]) {
                return {
                    path: cleanPath,
                    fullPath: path,
                    matched: [routeMap[cleanPath]],
                    params: {},
                    query: this._parseQuery(queryString),
                    hash: hash,
                    meta: routeMap[cleanPath].meta || {}
                };
            }

            // Check nested routes first (most specific to least specific)
            const sortedRoutes = [...routes].sort((a, b) => {
                // Sort by path segments count (more segments first)
                const aSegments = a.path.split('/').filter(Boolean).length;
                const bSegments = b.path.split('/').filter(Boolean).length;

                if (aSegments !== bSegments) {
                    return bSegments - aSegments;
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
                        matched,
                        params: match.params,
                        query: this._parseQuery(queryString),
                        hash: hash,
                        meta
                    };
                }
            }

            // Check for wildcard routes
            const wildcardRoute = routes.find(route => route.path === '*' || route.path === '/*');
            if (wildcardRoute) {
                return {
                    path: cleanPath,
                    fullPath: path,
                    matched: [wildcardRoute],
                    params: { pathMatch: cleanPath },
                    query: this._parseQuery(queryString),
                    hash: hash,
                    meta: wildcardRoute.meta || {}
                };
            }

            // No match found
            return {
                path: cleanPath,
                fullPath: path,
                matched: [],
                params: {},
                query: this._parseQuery(queryString),
                hash: hash,
                meta: {}
            };
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
                            const element = document.querySelector(route.hash);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
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

                    // Update current route
                    this.currentRoute = route;

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
                            const element = document.querySelector(route.hash);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
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
        // Option 1: Check the global KalxJS app instance
        if (window.__KAL_APP__ && window.__KAL_APP__._context && window.__KAL_APP__._context.$router) {
            router = window.__KAL_APP__._context.$router;
        }
        // Option 2: Check for a globally registered router instance
        else if (window.__KAL_ROUTER__) {
            router = window.__KAL_ROUTER__;
        }
        // Option 3: Check for router in current component context (if available)
        else if (window.__KAL_CURRENT_INSTANCE__ && window.__KAL_CURRENT_INSTANCE__.$router) {
            router = window.__KAL_CURRENT_INSTANCE__.$router;
        }
    }

    // If no router is found, provide a fallback implementation
    if (!router) {
        // Only show warning in development mode or if explicitly enabled
        if (process.env.NODE_ENV !== 'production' || window.__KAL_DEBUG__) {
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
        // Create a new object to ensure reactivity triggers
        route.value = { ...newRoute };
    });

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
            href = window.location.origin + base + location.path;
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

    if (!router || !route.value) {
        console.warn('RouterView: No active router found');
        return {
            tag: 'div',
            props: { class: 'kal-router-view' },
            children: ['No router found']
        };
    }

    // Get the matched route component
    const matchedRoute = route.value.matched[0];

    if (!matchedRoute || !matchedRoute.component) {
        return {
            tag: 'div',
            props: { class: 'kal-router-view' },
            children: ['No matching route found']
        };
    }

    // Render the matched component
    const Component = matchedRoute.component;

    // If Component is a function, call it with props
    if (typeof Component === 'function') {
        try {
            return Component(props);
        } catch (error) {
            console.error('Error rendering route component:', error);
            return {
                tag: 'div',
                props: { class: 'kal-router-view-error' },
                children: [`Error rendering component: ${error.message}`]
            };
        }
    }

    // If Component is an object with a render method, use it
    if (Component && typeof Component === 'object' && Component.render) {
        try {
            return Component.render(props);
        } catch (error) {
            console.error('Error rendering route component:', error);
            return {
                tag: 'div',
                props: { class: 'kal-router-view-error' },
                children: [`Error rendering component: ${error.message}`]
            };
        }
    }

    // Otherwise, create a wrapper for the component
    return {
        tag: 'div',
        props: { class: 'kal-router-view' },
        children: [Component]
    };
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
    const { router, isActive, isExactActive, resolve } = useRouter();

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
    const { href, route } = resolve(to);

    // Check if the link is active
    const isRouteActive = isActive(to);
    const isRouteExactActive = isExactActive(to);

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
}
