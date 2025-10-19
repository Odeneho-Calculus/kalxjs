/**
 * KALXJS Advanced Router - Route Meta Fields
 * Support for route metadata and meta-based routing features
 *
 * @module @kalxjs/router/advanced/route-meta
 */

/**
 * Process route meta fields
 *
 * @param {Object} route - Route object
 * @returns {Object} Processed meta
 */
export function processRouteMeta(route) {
    const meta = route.meta || {};

    return {
        // Navigation
        title: meta.title,
        breadcrumb: meta.breadcrumb || meta.title,
        icon: meta.icon,

        // Security
        requiresAuth: meta.requiresAuth || false,
        roles: meta.roles || [],
        permissions: meta.permissions || [],

        // SEO
        description: meta.description,
        keywords: meta.keywords,
        ogImage: meta.ogImage,

        // Behavior
        keepAlive: meta.keepAlive || false,
        transition: meta.transition,
        scrollBehavior: meta.scrollBehavior,

        // Layout
        layout: meta.layout,
        hideNavigation: meta.hideNavigation || false,
        fullScreen: meta.fullScreen || false,

        // Misc
        analytics: meta.analytics,
        ...meta,
    };
}

/**
 * Apply route meta to document
 * Updates page title, meta tags, etc.
 *
 * @param {Object} route - Current route
 */
export function applyRouteMeta(route) {
    const meta = processRouteMeta(route);

    // Update document title
    if (meta.title) {
        document.title = meta.title;
    }

    // Update meta tags
    updateMetaTag('description', meta.description);
    updateMetaTag('keywords', meta.keywords);

    // Update Open Graph tags
    if (meta.ogImage) {
        updateMetaTag('og:image', meta.ogImage, 'property');
    }
    if (meta.title) {
        updateMetaTag('og:title', meta.title, 'property');
    }
    if (meta.description) {
        updateMetaTag('og:description', meta.description, 'property');
    }
}

/**
 * Update or create meta tag
 * @private
 */
function updateMetaTag(name, content, attribute = 'name') {
    if (!content) return;

    let element = document.querySelector(`meta[${attribute}="${name}"]`);

    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
    }

    element.setAttribute('content', content);
}

/**
 * Check if route requires authentication
 *
 * @param {Object} route - Route to check
 * @returns {boolean}
 */
export function requiresAuth(route) {
    if (route.meta && route.meta.requiresAuth) {
        return true;
    }

    // Check matched routes (for nested routes)
    if (route.matched) {
        return route.matched.some(r => r.meta && r.meta.requiresAuth);
    }

    return false;
}

/**
 * Check if user has required roles for route
 *
 * @param {Object} route - Route to check
 * @param {Array|Function} userRoles - User's roles or function to get roles
 * @returns {boolean}
 */
export function hasRequiredRoles(route, userRoles) {
    const roles = typeof userRoles === 'function' ? userRoles() : userRoles;

    const requiredRoles = route.meta?.roles || [];

    if (requiredRoles.length === 0) {
        return true;
    }

    if (!roles || roles.length === 0) {
        return false;
    }

    return requiredRoles.some(role => roles.includes(role));
}

/**
 * Get route meta for breadcrumbs
 *
 * @param {Object} route - Current route
 * @returns {Array} Breadcrumb items
 */
export function getBreadcrumbs(route) {
    const breadcrumbs = [];

    if (route.matched) {
        route.matched.forEach((match, index) => {
            const meta = processRouteMeta(match);

            if (meta.breadcrumb !== false) {
                breadcrumbs.push({
                    text: meta.breadcrumb || match.name || 'Unnamed',
                    to: match.path,
                    icon: meta.icon,
                    isLast: index === route.matched.length - 1,
                });
            }
        });
    }

    return breadcrumbs;
}

/**
 * Merge meta from multiple routes (for nested routes)
 *
 * @param {Array} routes - Array of matched routes
 * @returns {Object} Merged meta
 */
export function mergeRouteMeta(routes) {
    const merged = {};

    routes.forEach(route => {
        const meta = processRouteMeta(route);
        Object.assign(merged, meta);
    });

    return merged;
}

/**
 * Route meta helpers for components
 */
export function createMetaHelpers(router) {
    return {
        /**
         * Get current route meta
         */
        getMeta() {
            return processRouteMeta(router.currentRoute.value);
        },

        /**
         * Check if current route requires auth
         */
        requiresAuth() {
            return requiresAuth(router.currentRoute.value);
        },

        /**
         * Get breadcrumbs for current route
         */
        getBreadcrumbs() {
            return getBreadcrumbs(router.currentRoute.value);
        },

        /**
         * Check if user has roles for current route
         */
        hasRequiredRoles(userRoles) {
            return hasRequiredRoles(router.currentRoute.value, userRoles);
        },
    };
}