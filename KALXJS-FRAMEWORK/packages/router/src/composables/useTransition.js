/**
 * useTransition Composable Hook
 * Hook for accessing and monitoring navigation transition state
 *
 * @module composables/useTransition
 */

import { computed } from '@kalxjs/core';

/**
 * Hook for accessing transition/loading state during navigation
 * Useful for showing loading spinners, progress bars, etc.
 *
 * Usage:
 * ```javascript
 * const transition = useTransition();
 *
 * // Show loading spinner
 * if (transition.value.isLoading) {
 *   showSpinner();
 * }
 *
 * // Show error
 * if (transition.value.error) {
 *   showError(transition.value.error.message);
 * }
 *
 * // Track progress
 * updateProgressBar(transition.value.percent);
 * ```
 *
 * @param {Object} config - Configuration object
 * @param {Object} config.transition - Transition state from createTransitionState()
 *
 * @returns {Object} Computed ref to transition state
 */
export function useTransition({ transition }) {
    return computed(() => ({
        /**
         * Is navigation currently in progress
         * @type {boolean}
         */
        isLoading: transition.isLoading,

        /**
         * Is data preload pending
         * @type {boolean}
         */
        isPending: transition.isPending,

        /**
         * Navigation error if occurred
         * @type {Error|null}
         */
        error: transition.error,

        /**
         * Previous route before navigation
         * @type {Object|null}
         */
        from: transition.from,

        /**
         * Target route for navigation
         * @type {Object|null}
         */
        to: transition.to,

        /**
         * Navigation progress percentage (0-100)
         * @type {number}
         */
        percent: transition.percent,

        /**
         * Reason for transition: 'navigation' | 'preload' | null
         * @type {string|null}
         */
        reason: transition.reason
    }));
}