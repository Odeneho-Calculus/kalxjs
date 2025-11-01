/**
 * Router Enhancement (Phase 1-3)
 * Main function to enhance a base router with reactive state and advanced features
 *
 * @module composables/routerEnhancer
 */

import { createReactiveRoute, createTransitionState } from './reactiveState.js';
import { useRoute } from './useRoute.js';
import { useParams } from './useParams.js';
import { useQuery } from './useQuery.js';
import { useTransition } from './useTransition.js';
import { createQueryHelpers } from './queryHelpers.js';
import { createNavigationEnhancers } from './navigationEnhancers.js';
import { createPreloadManager } from './preloadHooks.js';

/**
 * Enhance an existing router with reactive features (Phase 1-3)
 *
 * Features added:
 * - Phase 1: Reactive route state with automatic change tracking
 * - Phase 2: Transition state management (loading, pending, errors)
 * - Phase 3: Location state support for passing data between routes
 *
 * @param {Object} baseRouter - The base KALXJS router instance from createRouter()
 * @returns {Object} Enhanced router with reactive state and new composable hooks
 *
 * Example:
 * ```javascript
 * import { createRouter } from '@kalxjs/router';
 * import { enhanceRouter } from '@kalxjs/router/composables';
 *
 * const baseRouter = createRouter({ routes: [...] });
 * const router = enhanceRouter(baseRouter);
 *
 * // Now use reactive hooks
 * const { route, params, query } = router.useRoute();
 * ```
 */
export function enhanceRouter(baseRouter) {
    // Create reactive state objects
    const reactiveRoute = createReactiveRoute();
    const transition = createTransitionState();

    // Storage for route subscribers
    const routeSubscribers = new Set();

    // Initialize reactive route with current route
    reactiveRoute.update(baseRouter.currentRoute);

    // ========================================================================
    // Route Subscription System
    // ========================================================================

    /**
     * Subscribe to route changes with reactive tracking
     */
    const subscribeToRoute = (callback) => {
        routeSubscribers.add(callback);
        // Call immediately with current route
        callback(reactiveRoute.data.value);
        // Return unsubscribe function
        return () => {
            routeSubscribers.delete(callback);
        };
    };

    const notifyRouteSubscribers = () => {
        routeSubscribers.forEach(callback => {
            try {
                callback(reactiveRoute.data.value);
            } catch (err) {
                console.error('Error in route subscriber:', err);
            }
        });
    };

    // ========================================================================
    // Preload Manager
    // ========================================================================

    const preloadManager = createPreloadManager({ transition });

    // ========================================================================
    // Navigation Enhancers
    // ========================================================================

    const navigationEnhancers = createNavigationEnhancers({
        baseRouter,
        reactiveRoute,
        transition,
        executePreload: preloadManager.executePreload,
        notifyRouteSubscribers
    });

    // ========================================================================
    // Query Helpers
    // ========================================================================

    const queryHelpers = createQueryHelpers({
        reactiveRoute,
        enhancedPush: navigationEnhancers.enhancedPush
    });

    // ========================================================================
    // Composable Hook Factories
    // ========================================================================

    /**
     * Create useRoute composable for this router instance
     */
    const createUseRoute = () => {
        return useRoute({
            reactiveRoute,
            transition,
            ...navigationEnhancers,
            ...queryHelpers,
            subscribe: subscribeToRoute
        });
    };

    /**
     * Create useParams composable for this router instance
     */
    const createUseParams = () => {
        return useParams({ reactiveRoute });
    };

    /**
     * Create useQuery composable for this router instance
     */
    const createUseQuery = () => {
        return useQuery({
            reactiveRoute,
            ...queryHelpers
        });
    };

    /**
     * Create useTransition composable for this router instance
     */
    const createUseTransition = () => {
        return useTransition({ transition });
    };

    // ========================================================================
    // Enhanced Router Instance
    // ========================================================================

    const enhancedRouter = {
        // Expose all base router methods and properties
        ...baseRouter,

        // Override navigation methods with enhanced versions
        push: navigationEnhancers.enhancedPush,
        replace: navigationEnhancers.enhancedReplace,
        go: navigationEnhancers.enhancedGo,
        back: navigationEnhancers.enhancedBack,
        forward: navigationEnhancers.enhancedForward,

        // Expose reactive state (internal use)
        _reactiveRoute: reactiveRoute.data,
        _transition: transition,

        // Composable hook factories
        useRoute: createUseRoute,
        useParams: createUseParams,
        useQuery: createUseQuery,
        useTransition: createUseTransition,

        // Register preload hooks for routes
        registerPreload: preloadManager.registerPreload,
        unregisterPreload: preloadManager.unregisterPreload,
        getPreloadedData: () => reactiveRoute.data.value.state?._preloadedData,

        // Advanced: Manual route state update (internal)
        _updateRoute: (newRoute) => {
            reactiveRoute.update(newRoute);
            notifyRouteSubscribers();
        },

        _setTransitionState: (state) => {
            Object.assign(transition, state);
        },

        // Cleanup function for when router is destroyed
        _cleanup: () => {
            routeSubscribers.clear();
            preloadManager.clearPreloads();
        }
    };

    // ========================================================================
    // Setup Synchronization with Base Router
    // ========================================================================

    // Listen to base router changes and update reactive state
    if (typeof baseRouter.onChange === 'function') {
        const baseUnsubscribe = baseRouter.onChange((route) => {
            reactiveRoute.update(route);
            notifyRouteSubscribers();
        });

        // Store unsubscribe in cleanup
        const originalCleanup = enhancedRouter._cleanup;
        enhancedRouter._cleanup = () => {
            if (typeof baseUnsubscribe === 'function') {
                baseUnsubscribe();
            }
            originalCleanup();
        };
    }

    // Sync initial state
    reactiveRoute.update(baseRouter.currentRoute);

    return enhancedRouter;
}