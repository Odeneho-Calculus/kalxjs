/**
 * useQuery Composable Hook
 * Hook for accessing and updating query parameters
 *
 * @module composables/useQuery
 */

import { computed } from '@kalxjs/core';

/**
 * Hook for accessing and updating query parameters
 * Provides query object and helper methods for manipulation
 *
 * Usage:
 * ```javascript
 * const { query, update, remove, clear } = useQuery();
 *
 * // Access reactive query params
 * console.log(query.value.page);
 *
 * // Update query params
 * await update({ page: 2, sort: 'name' });
 *
 * // Remove specific params
 * await remove('page');
 * await remove(['page', 'filter']);
 *
 * // Clear all
 * await clear();
 * ```
 *
 * @param {Object} config - Configuration object
 * @param {Object} config.reactiveRoute - Reactive route state from createReactiveRoute()
 * @param {Function} config.updateQuery - Update query helper function
 * @param {Function} config.removeQueryParam - Remove query helper function
 * @param {Function} config.clearQuery - Clear query helper function
 *
 * @returns {Object} Query composable with query ref and helper methods
 */
export function useQuery({
    reactiveRoute,
    updateQuery,
    removeQueryParam,
    clearQuery
}) {
    return {
        /**
         * Reactive query parameters object
         * Updated automatically when URL search string changes
         */
        query: computed(() => reactiveRoute.data.value.query),

        /**
         * Update query parameters while preserving others
         * @param {Object} newQuery - Query parameters to merge
         * @param {Object} options - Additional options
         * @param {boolean} options.replace - Use replaceState instead of pushState
         * @returns {Promise} Navigation promise
         */
        update: updateQuery,

        /**
         * Remove specific query parameter(s)
         * @param {string|string[]} keys - Parameter key(s) to remove
         * @returns {Promise} Navigation promise
         */
        remove: removeQueryParam,

        /**
         * Clear all query parameters
         * @returns {Promise} Navigation promise
         */
        clear: clearQuery
    };
}