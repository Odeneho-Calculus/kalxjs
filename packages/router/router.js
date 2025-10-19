/**
 * KalxJS Router - Core Router Implementation with Enhanced Reactivity
 */
import { ref, reactive, watch, provide } from '@kalxjs/core';

/**
 * Creates a router instance
 * @param {Object} options - Router options
 * @param {Array} options.routes - Array of route definitions
 * @param {Function} options.history - History implementation (hash or HTML5)
 * @returns {Object} Router instance
 */
export function createRouter(options) {
    console.log('Creating KalxJS router with enhanced reactivity');
    const { routes, history } = options;

    // Create a flat map of routes for easier lookup
    const routeMap = {};
    const flattenRoutes = (routes, parentPath = '') => {
        routes.forEach(route => {
            const fullPath = parentPath + (route.path.startsWith('/') ? route.path : `/${route.path}`);
            routeMap[fullPath] = {
                ...route,
                fullPath
            };

            if (route.children) {
                flattenRoutes(route.children, fullPath);
            }
        });
    };

    flattenRoutes(routes);
    console.log('Route map created:', Object.keys(routeMap));

    // Enhanced match route function with component resolution
    const _matchRoute = (path) => {
        console.log('Matching route for path:', path);

        // Remove query string for matching
        const pathWithoutQuery = path.split('?')[0];

        // Direct match
        if (routeMap[pathWithoutQuery]) {
            console.log('Direct route match found:', routeMap[pathWithoutQuery].name || pathWithoutQuery);
            const route = routeMap[pathWithoutQuery];
            return {
                ...route,
                path: pathWithoutQuery,
                matched: [route],
                component: route.component
            };
        }

        // Check for dynamic routes
        for (const routePath in routeMap) {
            const route = routeMap[routePath];

            // Skip catch-all routes for now
            if (routePath.includes('*') || routePath.includes(':pathMatch')) {
                continue;
            }

            // Convert route path to regex pattern
            const pattern = routePath
                .replace(/:\w+/g, '([^/]+)')
                .replace(/\//g, '\\/');

            const regex = new RegExp(`^${pattern}$`);
            const match = pathWithoutQuery.match(regex);

            if (match) {
                // Extract params
                const params = {};
                const paramNames = routePath.match(/:\w+/g) || [];

                paramNames.forEach((param, index) => {
                    const paramName = param.slice(1); // Remove the colon
                    params[paramName] = match[index + 1];
                });

                console.log('Dynamic route match found:', route.name || routePath);
                return {
                    ...route,
                    path: pathWithoutQuery,
                    params,
                    matched: [route],
                    component: route.component
                };
            }
        }

        // Check for catch-all routes
        for (const routePath in routeMap) {
            const route = routeMap[routePath];

            if (routePath.includes('*') || routePath.includes(':pathMatch')) {
                console.log('Using catch-all route:', route.name || routePath);
                return {
                    ...route,
                    path: pathWithoutQuery,
                    matched: [route],
                    component: route.component
                };
            }
        }

        // No match found, create a basic 404 route
        console.warn('No matching route found, using default 404');
        return {
            path: pathWithoutQuery,
            name: 'not-found',
            matched: [],
            params: {},
            query: {},
            meta: { title: '404 Not Found' }
        };
    };

    // Parse query string
    const parseQuery = (queryString) => {
        if (!queryString) return {};
        const query = {};
        const pairs = queryString.slice(1).split('&');

        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                query[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });

        return query;
    };

    // Initialize the current route with the correct component
    const initialPath = history ? history.getCurrentPath() : '/';
    const initialMatchedRoute = _matchRoute(initialPath);

    // Create a reactive reference to the current route
    const currentRoute = reactive({
        path: initialPath,
        name: initialMatchedRoute ? initialMatchedRoute.name || '' : '',
        matched: initialMatchedRoute ? initialMatchedRoute.matched || [] : [],
        params: initialMatchedRoute ? initialMatchedRoute.params || {} : {},
        query: {},
        meta: initialMatchedRoute ? initialMatchedRoute.meta || {} : {},
        component: initialMatchedRoute ? initialMatchedRoute.component : null
    });

    console.log('Initial route state:', currentRoute.path);

    // Navigation guards
    const beforeEachHooks = [];
    const afterEachHooks = [];

    // Update current route
    const updateCurrentRoute = (path) => {
        console.log('Updating current route to:', path);
        const [pathPart, queryString] = path.split('?');
        const matchedRoute = _matchRoute(pathPart);

        if (!matchedRoute) {
            console.error(`No matching route found for ${path}`);
            return false;
        }

        const query = parseQuery(queryString ? `?${queryString}` : '');

        // Update the current route
        Object.assign(currentRoute, {
            path: pathPart,
            name: matchedRoute.name || '',
            params: matchedRoute.params || {},
            query,
            meta: matchedRoute.meta || {},
            matched: matchedRoute.matched || [],
            component: matchedRoute.component
        });

        console.log('Route updated:', currentRoute.path, 'Component:',
            currentRoute.component ? (currentRoute.component.name || 'Anonymous') : 'None');

        // Dispatch a custom event for components that might not be using the reactive system
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('kalroute', {
                detail: { route: { ...currentRoute } }
            });
            window.dispatchEvent(event);
        }

        return true;
    };

    // Navigate to a route
    const push = (to) => {
        console.log('Router push called with:', to);
        const targetPath = typeof to === 'string' ? to : to.path;

        // Run before hooks
        const next = (path) => {
            const finalPath = path || targetPath;
            history.push(finalPath);

            // Force a route update
            setTimeout(() => {
                console.log('Forcing route update after push');
                forceUpdate();

                // Run after hooks
                afterEachHooks.forEach(hook => hook(currentRoute));
            }, 0);
        };

        if (beforeEachHooks.length) {
            const from = { ...currentRoute };
            const toRoute = {
                path: targetPath,
                name: typeof to === 'object' ? to.name : '',
                params: typeof to === 'object' ? to.params || {} : {},
                query: typeof to === 'object' ? to.query || {} : {},
                meta: {}
            };

            // Find the route meta
            const matchedRoute = _matchRoute(targetPath.split('?')[0]);
            if (matchedRoute) {
                toRoute.meta = matchedRoute.meta || {};
            }

            // Chain the hooks
            let index = 0;
            const runHooks = () => {
                if (index >= beforeEachHooks.length) {
                    next();
                    return;
                }

                const hook = beforeEachHooks[index++];
                hook(toRoute, from, (path) => {
                    if (path === false) {
                        // Navigation cancelled
                        return;
                    } else if (path && typeof path === 'string') {
                        // Redirect
                        next(path);
                    } else {
                        runHooks();
                    }
                });
            };

            runHooks();
        } else {
            next();
        }
    };

    // Replace current route
    const replace = (to) => {
        console.log('Router replace called with:', to);
        const targetPath = typeof to === 'string' ? to : to.path;
        history.replace(targetPath);

        // Force a route update
        setTimeout(() => {
            console.log('Forcing route update after replace');
            forceUpdate();
        }, 0);
    };

    // Go back/forward in history
    const go = (delta) => {
        history.go(delta);
    };

    // Add a method to force a route update
    const forceUpdate = () => {
        console.log('Forcing router update');

        // Get the current path from the window location
        const path = history ? history.getCurrentPath() : '/';
        console.log('Current path from history:', path);

        // Update the route
        updateCurrentRoute(path);
    };

    // Initialize the router
    const init = (options = {}) => {
        console.log('Initializing router with options:', options);

        // Set up history listener
        if (history && history.listen) {
            history.listen((path) => {
                console.log('History change detected:', path);
                updateCurrentRoute(path);
            });
        }

        // Initial route
        const initialPath = history ? history.getCurrentPath() : '/';
        console.log('Initial path:', initialPath);
        updateCurrentRoute(initialPath);

        // Handle redirects
        if (currentRoute.matched[0] && currentRoute.matched[0].redirect) {
            const redirect = currentRoute.matched[0].redirect;
            const redirectPath = typeof redirect === 'function'
                ? redirect(currentRoute)
                : redirect;

            console.log('Handling redirect to:', redirectPath);
            push(redirectPath);
        }

        // Set up hash change listener for better reactivity
        if (typeof window !== 'undefined' && options.handleLinks !== false) {
            console.log('Setting up hashchange listener');
            window.addEventListener('hashchange', () => {
                console.log('Hash changed, updating route');
                forceUpdate();
            });
        }

        // Force an initial update
        setTimeout(() => {
            console.log('Forcing initial route update');
            forceUpdate();
        }, 0);
    };

    // Register navigation guards
    const beforeEach = (hook) => {
        beforeEachHooks.push(hook);
        return () => {
            const index = beforeEachHooks.indexOf(hook);
            if (index > -1) {
                beforeEachHooks.splice(index, 1);
            }
        };
    };

    const afterEach = (hook) => {
        afterEachHooks.push(hook);
        return () => {
            const index = afterEachHooks.indexOf(hook);
            if (index > -1) {
                afterEachHooks.splice(index, 1);
            }
        };
    };

    // Set up a watcher to log route changes
    watch(() => currentRoute.path, (newPath, oldPath) => {
        console.log('Route path changed:', {
            from: oldPath,
            to: newPath
        });

        // Update component when path changes
        const matchedRoute = _matchRoute(newPath);
        if (matchedRoute) {
            Object.assign(currentRoute, {
                matched: matchedRoute.matched || [],
                params: matchedRoute.params || {},
                query: currentRoute.query || {},
                meta: matchedRoute.meta || {},
                component: matchedRoute.component
            });
        }
    });

    // Create the router instance
    const router = {
        currentRoute,
        push,
        replace,
        go,
        back: () => go(-1),
        forward: () => go(1),
        beforeEach,
        afterEach,
        getRoutes: () => routes,
        hasRoute: (name) => Object.values(routeMap).some(route => route.name === name),
        getRouteMap: () => routeMap,
        isReady: () => Promise.resolve(),
        forceUpdate,
        _matchRoute,
        init,

        // Installation function for the plugin system
        install(app) {
            console.log('Installing router plugin');

            // Provide the router to all components
            app.provide('router', router);

            // Add global properties
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};
            app.config.globalProperties.$router = router;
            app.config.globalProperties.$route = currentRoute;

            // Add a manual navigation function to window for debugging
            if (typeof window !== 'undefined') {
                window.navigateTo = (path) => {
                    console.log('Manual navigation to:', path);
                    router.push(path);
                };
            }

            console.log('Router installed successfully');
        }
    };

    // Initialize
    init();

    return router;
}