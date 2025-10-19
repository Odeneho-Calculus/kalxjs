/**
 * KALXJS Transition API
 * React 19-inspired transitions for non-blocking UI updates
 *
 * Features:
 * - startTransition for marking non-urgent updates
 * - useTransition hook for tracking transition state
 * - useDeferredValue for deferring expensive computations
 * - Automatic priority downgrade for transitions
 *
 * @module @kalxjs/core/scheduler/transition
 */

import { scheduleCallback, Priority } from './scheduler.js';
import { ref, effect } from '../reactivity/index.js';

// Global transition state
let isTransitioning = false;
let currentTransitionCallbacks = new Set();

/**
 * Mark updates as non-urgent transitions
 * Allows the UI to remain responsive during expensive updates
 *
 * @param {Function} callback - Function containing state updates
 * @param {Object} options - Optional configuration
 * @returns {void}
 *
 * @example
 * ```js
 * import { startTransition } from '@kalxjs/core';
 *
 * startTransition(() => {
 *   // These updates won't block urgent updates
 *   setSearchResults(expensiveFilter(query));
 * });
 * ```
 */
export function startTransition(callback, options = {}) {
    const previousIsTransitioning = isTransitioning;
    const previousCallbacks = currentTransitionCallbacks;

    isTransitioning = true;
    currentTransitionCallbacks = new Set();

    try {
        // Schedule with lower priority
        scheduleCallback(() => {
            try {
                callback();
            } finally {
                // Notify completion callbacks
                currentTransitionCallbacks.forEach(cb => cb());
            }
        }, Priority.LOW, options);
    } finally {
        isTransitioning = previousIsTransitioning;
        currentTransitionCallbacks = previousCallbacks;
    }
}

/**
 * Check if currently in a transition
 * @returns {boolean}
 */
export function isInTransition() {
    return isTransitioning;
}

/**
 * Register a callback to run when transition completes
 * @param {Function} callback
 */
export function onTransitionComplete(callback) {
    if (isTransitioning && currentTransitionCallbacks) {
        currentTransitionCallbacks.add(callback);
    }
}

/**
 * Composition API hook for transitions
 * Returns [isPending, startTransition]
 *
 * @returns {Array} [isPending ref, startTransition function]
 *
 * @example
 * ```js
 * import { useTransition } from '@kalxjs/core';
 *
 * export default {
 *   setup() {
 *     const [isPending, startTransition] = useTransition();
 *
 *     function handleSearch(query) {
 *       startTransition(() => {
 *         searchResults.value = expensiveSearch(query);
 *       });
 *     }
 *
 *     return { isPending, handleSearch };
 *   }
 * }
 * ```
 */
export function useTransition() {
    const isPending = ref(false);

    const start = (callback, options = {}) => {
        isPending.value = true;

        startTransition(() => {
            try {
                callback();
            } finally {
                isPending.value = false;
            }
        }, options);
    };

    return [isPending, start];
}

/**
 * Defer a value update to keep UI responsive
 * Returns a deferred version of the value that lags behind
 *
 * @param {Ref|any} value - Value to defer
 * @param {Object} options - Optional configuration
 * @returns {Ref} Deferred value ref
 *
 * @example
 * ```js
 * import { useDeferredValue, ref } from '@kalxjs/core';
 *
 * export default {
 *   setup() {
 *     const query = ref('');
 *     const deferredQuery = useDeferredValue(query);
 *
 *     // deferredQuery updates with lower priority
 *     // keeping input responsive
 *
 *     return { query, deferredQuery };
 *   }
 * }
 * ```
 */
export function useDeferredValue(value, options = {}) {
    const { timeout = 100 } = options;
    const deferredValue = ref(typeof value === 'object' && value.value !== undefined ? value.value : value);
    let timeoutId = null;

    // Watch for changes and defer them
    effect(() => {
        const currentValue = typeof value === 'object' && value.value !== undefined ? value.value : value;

        // Clear previous timeout
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        // If already the same, no need to update
        if (deferredValue.value === currentValue) {
            return;
        }

        // Schedule deferred update
        timeoutId = setTimeout(() => {
            startTransition(() => {
                deferredValue.value = currentValue;
            });
        }, timeout);
    });

    return deferredValue;
}

/**
 * Create a throttled version of a value
 * Updates at most once per throttle period
 *
 * @param {Ref|any} value - Value to throttle
 * @param {number} throttleMs - Throttle period in milliseconds
 * @returns {Ref} Throttled value ref
 */
export function useThrottledValue(value, throttleMs = 100) {
    const throttledValue = ref(typeof value === 'object' && value.value !== undefined ? value.value : value);
    let lastUpdate = 0;
    let pendingUpdate = null;

    effect(() => {
        const currentValue = typeof value === 'object' && value.value !== undefined ? value.value : value;
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdate;

        if (timeSinceLastUpdate >= throttleMs) {
            // Enough time passed - update immediately
            throttledValue.value = currentValue;
            lastUpdate = now;

            if (pendingUpdate !== null) {
                clearTimeout(pendingUpdate);
                pendingUpdate = null;
            }
        } else {
            // Schedule update for later
            if (pendingUpdate !== null) {
                clearTimeout(pendingUpdate);
            }

            pendingUpdate = setTimeout(() => {
                startTransition(() => {
                    throttledValue.value = currentValue;
                    lastUpdate = Date.now();
                    pendingUpdate = null;
                });
            }, throttleMs - timeSinceLastUpdate);
        }
    });

    return throttledValue;
}

/**
 * Batch multiple transitions together
 * Useful for coordinating multiple transition effects
 *
 * @param {Function} callback - Function containing multiple startTransition calls
 */
export function batchTransitions(callback) {
    const previousIsTransitioning = isTransitioning;
    isTransitioning = true;

    try {
        callback();
    } finally {
        isTransitioning = previousIsTransitioning;
    }
}