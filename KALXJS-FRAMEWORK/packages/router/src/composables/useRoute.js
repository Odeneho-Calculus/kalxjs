/**
 * useRoute Composable Hook
 * Main hook for accessing route state with full reactivity
 *
 * @module composables/useRoute
 */

import { computed } from '@kalxjs/core';

/**
 * Main composable hook for accessing route state
 * Returns reactive route object, helpers, and navigation methods
 *
 * Usage:
 * ```javascript
 * const { route, params, query, state, transition } = useRoute();
 *
 * // Access reactive properties
 * console.log(route.value.path);
 * console.log(params.value.id);
 *
 * // Use helpers
 * await router.updateQuery({ page: 2 });
 * await router.setState({ from: 'list' });
 * ```
 *
 * @param {Object} config - Configuration object
 * @param {Object} config.reactiveRoute - Reactive route state from createReactiveRoute()
 * @param {Object} config.transition - Transition state from createTransitionState()
 * @param {Function} config.enhancedPush - Enhanced push navigation function
 * @param {Function} config.enhancedReplace - Enhanced replace navigation function
 * @param {Function} config.enhancedGo - Enhanced go navigation function
 * @param {Function} config.enhancedBack - Enhanced back navigation function
 * @param {Function} config.enhancedForward - Enhanced forward navigation function
 * @param {Function} config.updateQuery - Query parameter update helper
 * @param {Function} config.removeQueryParam - Query parameter remove helper
 * @param {Function} config.clearQuery - Query parameter clear helper
 *
 * @returns {Object} Route composable object with reactive properties and methods
 */
export function useRoute({
    reactiveRoute,
    transition,
    enhancedPush,
    enhancedReplace,
    enhancedGo,
    enhancedBack,
    enhancedForward,
    updateQuery,
    removeQueryParam,
    clearQuery
}) {
    return {
        // ====================================================================
        // REACTIVE PROPERTIES
        // ====================================================================

        /**
         * Full reactive route object
         * Contains: path, fullPath, name, params, query, hash, matched, meta, state
         */
        route: computed(() => reactiveRoute.data.value),

        /**
         * Reactive route parameters extracted from URL
         * Example: route.params.id for /user/:id
         */
        params: computed(() => reactiveRoute.data.value.params),

        /**
         * Reactive query parameters from URL search string
         * Example: query.page for /search?page=2
         */
        query: computed(() => reactiveRoute.data.value.query),

        /**
         * Location state passed between routes (not in URL)
         * Example: route.state.from for tracking navigation origin
         */
        state: computed(() => reactiveRoute.data.value.state),

        /**
         * Current route path
         */
        path: computed(() => reactiveRoute.data.value.path),

        /**
         * Current route name
         */
        name: computed(() => reactiveRoute.data.value.name),

        /**
         * Route metadata (custom properties defined in route config)
         */
        meta: computed(() => reactiveRoute.data.value.meta),

        // ====================================================================
        // TRANSITION STATE PROPERTIES
        // ====================================================================

        /**
         * Transition/loading state during navigation
         * Includes: isLoading, isPending, error, from, to, percent, reason
         */
        transition: computed(() => ({
            isLoading: transition.isLoading,
            isPending: transition.isPending,
            error: transition.error,
            from: transition.from,
            to: transition.to,
            percent: transition.percent,
            reason: transition.reason
        })),

        // ====================================================================
        // NAVIGATION METHODS
        // ====================================================================

        /**
         * Navigate to a new route (push to history)
         * @param {string|Object} location - Route location or path string
         * @returns {Promise} Navigation promise
         */
        push: enhancedPush,

        /**
         * Replace current route in history
         * @param {string|Object} location - Route location or path string
         * @returns {Promise} Navigation promise
         */
        replace: enhancedReplace,

        /**
         * Navigate by delta in history stack
         * @param {number} delta - Steps to go (positive=forward, negative=back)
         * @returns {Promise} Navigation promise
         */
        go: enhancedGo,

        /**
         * Navigate back one step
         * @returns {Promise} Navigation promise
         */
        back: enhancedBack,

        /**
         * Navigate forward one step
         * @returns {Promise} Navigation promise
         */
        forward: enhancedForward,

        // ====================================================================
        // QUERY PARAMETER HELPERS
        // ====================================================================

        /**
         * Update query parameters while preserving others
         * @param {Object} newQuery - Query parameters to merge
         * @param {Object} options - Additional options
         * @param {boolean} options.replace - Use replaceState instead of pushState
         * @returns {Promise} Navigation promise
         *
         * Example:
         * ```javascript
         * await useRoute().updateQuery({ page: 2, filter: 'active' });
         * ```
         */
        updateQuery,

        /**
         * Remove specific query parameter(s)
         * @param {string|string[]} keys - Parameter key(s) to remove
         * @returns {Promise} Navigation promise
         *
         * Example:
         * ```javascript
         * await useRoute().removeQueryParam('page');
         * await useRoute().removeQueryParam(['page', 'filter']);
         * ```
         */
        removeQueryParam,

        /**
         * Clear all query parameters
         * @returns {Promise} Navigation promise
         */
        clearQuery,

        // ====================================================================
        // STATE MANAGEMENT METHODS
        // ====================================================================

        /**
         * Update location state (data passed between routes, not in URL)
         * @param {Object} newState - State object to merge
         *
         * Example:
         * ```javascript
         * useRoute().setState({ from: 'userList', scrollPos: 450 });
         * ```
         */
        setState: (newState) => reactiveRoute.setState(newState),

        /**
         * Get preloaded data from route state
         * Useful for accessing data loaded before route change
         * @returns {*} Preloaded data or undefined
         */
        getPreloadedData: () => reactiveRoute.data.value.state?._preloadedData,

        // ====================================================================
        // ADVANCED: Route Change Subscription
        // ====================================================================

        /**
         * Subscribe to route changes
         * @param {Function} callback - Called whenever route changes
         * @returns {Function} Unsubscribe function
         *
         * Example:
         * ```javascript
         * const unsubscribe = useRoute().subscribe((route) => {
         *   console.log('Route changed to:', route.path);
         * });
         * unsubscribe(); // Stop listening
         * ```
         */
        subscribe: null // Will be injected by router
    };
}