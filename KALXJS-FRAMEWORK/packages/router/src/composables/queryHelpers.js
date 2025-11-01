/**
 * Query Parameter Helper Functions
 * Utility functions for query parameter manipulation
 *
 * @module composables/queryHelpers
 */

/**
 * Create query parameter helper functions
 * These help manage query parameters during navigation
 *
 * @param {Object} config - Configuration object
 * @param {Object} config.reactiveRoute - Reactive route state
 * @param {Function} config.enhancedPush - Enhanced push navigation
 *
 * @returns {Object} Object with query helper functions
 */
export function createQueryHelpers({ reactiveRoute, enhancedPush }) {
    /**
     * Update query parameters while preserving others
     *
     * @param {Object} newQuery - Query parameters to merge
     * @param {Object} options - Additional options
     * @param {boolean} options.replace - Use replaceState instead of pushState
     * @returns {Promise} Navigation promise
     *
     * Example:
     * ```javascript
     * await updateQuery({ page: 2, filter: 'active' });
     * await updateQuery({ sort: 'date' }, { replace: true });
     * ```
     */
    const updateQuery = (newQuery, options = {}) => {
        const { replace = false } = options;
        const currentQuery = { ...reactiveRoute.data.value.query };
        const mergedQuery = { ...currentQuery, ...newQuery };

        // Build new path with updated query
        let path = reactiveRoute.data.value.path;
        const queryStr = new URLSearchParams(mergedQuery).toString();
        if (queryStr) {
            path += '?' + queryStr;
        }

        return enhancedPush({
            path,
            state: reactiveRoute.data.value.state
        });
    };

    /**
     * Remove specific query parameter(s)
     *
     * @param {string|string[]} keys - Parameter key(s) to remove
     * @returns {Promise} Navigation promise
     *
     * Example:
     * ```javascript
     * await removeQueryParam('page');
     * await removeQueryParam(['page', 'filter']);
     * ```
     */
    const removeQueryParam = (keys) => {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        const currentQuery = { ...reactiveRoute.data.value.query };

        keysArray.forEach(key => {
            delete currentQuery[key];
        });

        let path = reactiveRoute.data.value.path;
        const queryStr = new URLSearchParams(currentQuery).toString();
        if (queryStr) {
            path += '?' + queryStr;
        }

        return enhancedPush({
            path,
            state: reactiveRoute.data.value.state
        });
    };

    /**
     * Clear all query parameters
     *
     * @returns {Promise} Navigation promise
     *
     * Example:
     * ```javascript
     * await clearQuery();
     * ```
     */
    const clearQuery = () => {
        return enhancedPush({
            path: reactiveRoute.data.value.path,
            state: reactiveRoute.data.value.state
        });
    };

    return {
        updateQuery,
        removeQueryParam,
        clearQuery
    };
}