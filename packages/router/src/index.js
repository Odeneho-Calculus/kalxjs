// packages/router/src/index.js
/**
 * kalxjs Router - A routing system for single-page applications
 */

import { ref, computed } from '@kalxjs/core';

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
            params: {},
            query: {},
            matched: []
        });

        const params = computed(() => ({}));
        const query = computed(() => ({}));
        const path = computed(() => '/');

        // Return a minimal implementation to prevent errors
        return {
            // Route state
            route,
            params,
            query,
            path,

            // Navigation methods (no-ops with warnings)
            push: (location) => console.warn(`Router not available. Cannot navigate to ${location}`),
            replace: (location) => console.warn(`Router not available. Cannot replace with ${location}`),
            go: (n) => console.warn(`Router not available. Cannot go ${n} steps`),
            back: () => console.warn('Router not available. Cannot go back'),
            forward: () => console.warn('Router not available. Cannot go forward')
        };
    }

    // Create reactive references to route properties
    const route = ref(router.currentRoute);

    // Update the reactive route when navigation occurs
    router.onChange((newRoute) => {
        route.value = newRoute;
    });

    // Computed properties for commonly used route values
    const params = computed(() => route.value.params || {});
    const query = computed(() => route.value.query || {});
    const path = computed(() => route.value.path || '/');

    return {
        // Expose the router instance
        router,

        // Navigation methods
        push: (location) => router.push(location),
        replace: (location) => router.replace(location),
        go: (n) => router.go(n),
        back: () => router.go(-1),
        forward: () => router.go(1),

        // Route state
        route,
        params,
        query,
        path
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
        return Component(props);
    }

    // Otherwise, create a new component instance
    return {
        tag: 'div',
        props: { class: 'kal-router-view' },
        children: [Component]
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
