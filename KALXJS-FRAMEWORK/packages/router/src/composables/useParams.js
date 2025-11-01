/**
 * useParams Composable Hook
 * Shorthand hook for accessing route parameters only
 *
 * @module composables/useParams
 */

import { computed } from '@kalxjs/core';

/**
 * Shorthand hook for accessing route parameters
 * Simpler than useRoute() if you only need params
 *
 * Usage:
 * ```javascript
 * const params = useParams();
 *
 * // Watch for changes
 * watch(() => params.value.id, (newId) => {
 *   loadUser(newId);
 * });
 * ```
 *
 * @param {Object} config - Configuration object
 * @param {Object} config.reactiveRoute - Reactive route state from createReactiveRoute()
 *
 * @returns {Object} Computed ref to route params
 */
export function useParams({ reactiveRoute }) {
    return computed(() => reactiveRoute.data.value.params);
}