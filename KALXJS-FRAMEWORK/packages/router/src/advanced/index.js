/**
 * KALXJS Advanced Router Features
 * Complete routing system with all advanced features
 *
 * @module @kalxjs/router/advanced
 */

// Nested Routes
export {
    processNestedRoutes,
    matchNestedRoute,
    getRouteHierarchy,
    createNestedRouterView,
    resolveLayoutRoutes,
} from './nested-routes.js';

// Navigation Guards
export {
    NavigationGuardManager,
    GuardType,
    GuardPatterns,
} from './navigation-guards.js';

// Route Meta
export {
    processRouteMeta,
    applyRouteMeta,
    requiresAuth,
    hasRequiredRoles,
    getBreadcrumbs,
    mergeRouteMeta,
    createMetaHelpers,
} from './route-meta.js';

// Code Splitting
export {
    lazyLoadComponent,
    lazyLoadRoute,
    prefetchRoute,
    createPrefetchDirective,
    batchPrefetch,
    autoPrefetchRoutes,
} from './code-splitting.js';

// Scroll Behavior
export {
    getSavedPosition,
    savePosition,
    getCurrentPosition,
    scrollToPosition,
    scrollToElement,
    handleScrollBehavior,
    applyScrollBehavior,
    setupScrollBehavior,
    ScrollBehaviorPresets,
} from './scroll-behavior.js';