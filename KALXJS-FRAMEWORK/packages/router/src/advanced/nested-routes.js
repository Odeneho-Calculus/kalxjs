/**
 * KALXJS Advanced Router - Nested Routes
 * Support for nested routes with layouts and view composition
 *
 * @module @kalxjs/router/advanced/nested-routes
 */

import { reactive, computed } from '@kalxjs/core';

/**
 * Process route configuration to support nesting
 *
 * @param {Array} routes - Route configuration array
 * @param {string} parentPath - Parent route path
 * @returns {Array} Processed routes with resolved paths
 */
export function processNestedRoutes(routes, parentPath = '') {
    const processed = [];

    for (const route of routes) {
        // Resolve full path
        const fullPath = resolvePath(parentPath, route.path);

        // Process route
        const processedRoute = {
            ...route,
            path: fullPath,
            _originalPath: route.path,
            _parentPath: parentPath,
        };

        // Process children recursively
        if (route.children && route.children.length > 0) {
            processedRoute.children = processNestedRoutes(route.children, fullPath);
        }

        processed.push(processedRoute);

        // Flatten children for matching
        if (processedRoute.children) {
            processed.push(...processedRoute.children);
        }
    }

    return processed;
}

/**
 * Resolve path segments
 * @private
 */
function resolvePath(parent, child) {
    // Absolute path
    if (child.startsWith('/')) {
        return child;
    }

    // No parent
    if (!parent) {
        return '/' + child;
    }

    // Join paths
    const segments = [
        ...parent.split('/').filter(Boolean),
        ...child.split('/').filter(Boolean),
    ];

    return '/' + segments.join('/');
}

/**
 * Match route with support for nested matching
 *
 * @param {string} path - Path to match
 * @param {Array} routes - Routes to match against
 * @returns {Object|null} Matched route with params and matched routes chain
 */
export function matchNestedRoute(path, routes) {
    const segments = path.split('/').filter(Boolean);

    for (const route of routes) {
        const match = matchRoute(route, segments);

        if (match) {
            return {
                route,
                params: match.params,
                matched: match.matched,
            };
        }
    }

    return null;
}

/**
 * Match a single route against path segments
 * @private
 */
function matchRoute(route, segments, parentMatched = []) {
    const routeSegments = route.path.split('/').filter(Boolean);

    // Check if route can match
    if (routeSegments.length > segments.length) {
        return null;
    }

    const params = {};
    const matched = [...parentMatched, route];

    // Match each segment
    for (let i = 0; i < routeSegments.length; i++) {
        const routeSegment = routeSegments[i];
        const pathSegment = segments[i];

        // Dynamic segment
        if (routeSegment.startsWith(':')) {
            const paramName = routeSegment.slice(1);
            params[paramName] = pathSegment;
            continue;
        }

        // Wildcard segment
        if (routeSegment === '*') {
            params.pathMatch = segments.slice(i).join('/');
            return { params, matched };
        }

        // Static segment - must match exactly
        if (routeSegment !== pathSegment) {
            return null;
        }
    }

    // Exact match
    if (routeSegments.length === segments.length) {
        return { params, matched };
    }

    // Check children for remaining segments
    if (route.children) {
        const remainingSegments = segments.slice(routeSegments.length);

        for (const child of route.children) {
            const childMatch = matchRoute(child, segments, matched);
            if (childMatch) {
                return childMatch;
            }
        }
    }

    return null;
}

/**
 * Get route hierarchy for breadcrumbs
 *
 * @param {Object} matchedRoute - Matched route result
 * @returns {Array} Array of route hierarchy with breadcrumb info
 */
export function getRouteHierarchy(matchedRoute) {
    if (!matchedRoute || !matchedRoute.matched) {
        return [];
    }

    return matchedRoute.matched.map(route => ({
        path: route.path,
        name: route.name,
        meta: route.meta,
        breadcrumb: route.meta?.breadcrumb || route.name,
    }));
}

/**
 * Create router view for nested routes
 *
 * @param {Object} router - Router instance
 * @param {number} depth - Nesting depth
 * @returns {Object} Router view component
 */
export function createNestedRouterView(router, depth = 0) {
    return {
        name: 'RouterView',

        setup() {
            const route = computed(() => router.currentRoute.value);
            const matched = computed(() => route.value.matched || []);

            const component = computed(() => {
                const matchedRoute = matched.value[depth];
                return matchedRoute ? matchedRoute.component : null;
            });

            return {
                component,
                route,
            };
        },

        render() {
            const { component, route } = this;

            if (!component) {
                return null;
            }

            // Render matched component with props
            return h(component, {
                ...route.params,
                route,
            });
        },
    };
}

/**
 * Resolve route configuration with layouts
 *
 * @param {Array} routes - Routes configuration
 * @returns {Array} Routes with layout components
 */
export function resolveLayoutRoutes(routes) {
    return routes.map(route => {
        if (route.layout) {
            // Wrap route component with layout
            const originalComponent = route.component;

            route.component = {
                name: `Layout_${route.name || 'Anonymous'}`,

                setup() {
                    return {};
                },

                render() {
                    return h(route.layout, {}, {
                        default: () => h(originalComponent),
                    });
                },
            };
        }

        // Process children
        if (route.children) {
            route.children = resolveLayoutRoutes(route.children);
        }

        return route;
    });
}