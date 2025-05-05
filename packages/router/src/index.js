// packages/router/src/index.js
/**
 * kalxjs Router - A routing system for single-page applications
 */

/**
 * Create a new router instance
 * @param {Object} options - Router options
 * @returns {Object} Router instance
 */
export function createRouter(options = {}) {
    const routes = options.routes || [];
    const mode = options.mode || 'hash';
    const base = options.base || '';

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
        matched: []
    };

    // Route change listeners
    const listeners = [];

    const router = {
        // Router properties
        routes,
        mode,
        base,
        currentRoute,

        /**
         * Navigate to a specific route
         * @param {string|Object} location - Route path or location object
         */
        push(location) {
            const path = typeof location === 'string' ? location : location.path;

            if (mode === 'hash') {
                window.location.hash = path;
            } else {
                window.history.pushState(null, '', base + path);
                this._onRouteChange();
            }
        },

        /**
         * Replace current route without adding to history
         * @param {string|Object} location - Route path or location object
         */
        replace(location) {
            const path = typeof location === 'string' ? location : location.path;

            if (mode === 'hash') {
                const href = window.location.href;
                const i = href.indexOf('#');
                window.location.replace(href.slice(0, i >= 0 ? i : 0) + '#' + path);
            } else {
                window.history.replaceState(null, '', base + path);
                this._onRouteChange();
            }
        },

        /**
         * Go back in history
         * @param {number} n - Number of steps to go back
         */
        go(n) {
            window.history.go(n);
        },

        /**
         * Initialize the router
         */
        init() {
            if (mode === 'hash') {
                // Ensure hash exists
                if (!window.location.hash) {
                    window.location.hash = '/';
                }

                // Listen for hash changes
                window.addEventListener('hashchange', () => {
                    this._onRouteChange();
                });
            } else {
                // History mode
                window.addEventListener('popstate', () => {
                    this._onRouteChange();
                });
            }

            // Initial route resolution
            this._onRouteChange();

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
            // First check for exact match
            if (routeMap[path]) {
                return {
                    path,
                    matched: [routeMap[path]],
                    params: {},
                    query: this._parseQuery(path)
                };
            }

            // Check dynamic routes
            for (const route of routes) {
                const match = this._matchDynamicRoute(route, path);
                if (match) {
                    return {
                        path,
                        matched: [route],
                        params: match.params,
                        query: this._parseQuery(path)
                    };
                }
            }

            // Check for wildcard routes
            const wildcardRoute = routes.find(route => route.path === '*');
            if (wildcardRoute) {
                return {
                    path,
                    matched: [wildcardRoute],
                    params: {},
                    query: this._parseQuery(path)
                };
            }

            // No match found
            return {
                path,
                matched: [],
                params: {},
                query: this._parseQuery(path)
            };
        },

        /**
         * Match a path against a dynamic route
         * @param {Object} route - Route definition
         * @param {string} path - Path to match
         * @returns {Object|null} Match result
         */
        _matchDynamicRoute(route, path) {
            if (!route.path.includes(':')) return null;

            const routeParts = route.path.split('/');
            const pathParts = path.split('/');

            if (routeParts.length !== pathParts.length) return null;

            const params = {};

            for (let i = 0; i < routeParts.length; i++) {
                const routePart = routeParts[i];
                const pathPart = pathParts[i];

                // Check for dynamic segment
                if (routePart.startsWith(':')) {
                    const paramName = routePart.slice(1);
                    params[paramName] = pathPart;
                } else if (routePart !== pathPart) {
                    // Static segments must match exactly
                    return null;
                }
            }

            return { params };
        },

        /**
         * Extract query parameters from a path
         * @param {string} path - URL path
         * @returns {Object} Query parameters
         */
        _parseQuery(path) {
            const queryIndex = path.indexOf('?');
            if (queryIndex === -1) return {};

            const queryString = path.slice(queryIndex + 1);
            const query = {};

            queryString.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                if (key) {
                    query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
                }
            });

            return query;
        },

        /**
         * Handle route changes
         */
        _onRouteChange() {
            let path;

            if (this.mode === 'hash') {
                path = window.location.hash.slice(1);
            } else {
                const base = this.base || '';
                path = window.location.pathname.slice(base.length);
            }

            // Ensure path starts with /
            if (!path.startsWith('/')) {
                path = '/' + path;
            }

            const route = this._matchRoute(path);
            this.currentRoute = route;

            // Notify listeners
            listeners.forEach(callback => callback(route));
        },

        /**
         * Install the router into an application
         * @param {Object} app - Application instance
         */
        install(app) {
            // Inject router into components
            app._context.$router = this;

            // Initialize router
            this.init();
        }
    };

    return router;
}

// Create a Router View component that renders the matched route component
export function RouterView(props = {}) {
    // This is a placeholder - the actual implementation would depend on integration with the core component system
    return {
        tag: 'div',
        props: { class: 'kal-router-view' },
        children: []
    };
}

// Create a Router Link component for navigation
export function RouterLink(props = {}) {
    return {
        tag: 'a',
        props: {
            href: props.to,
            onClick: (e) => {
                e.preventDefault();
                // Would call router.push(props.to) in actual implementation
            },
            ...props
        },
        children: props.children || []
    };
}
