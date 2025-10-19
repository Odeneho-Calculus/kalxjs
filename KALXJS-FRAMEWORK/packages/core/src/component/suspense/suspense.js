/**
 * Suspense Component - Handle async component loading
 * Displays fallback UI while waiting for async operations
 */

import { ref, computed } from '../../reactivity/reactive.js';
import { h } from '../../vdom/vdom.js';
import { getCurrentInstance } from '../../composition.js';

/**
 * Suspense component for handling async boundaries
 * @param {Object} props - Component props
 * @param {Object} context - Component context
 * @returns {VNode} Virtual node
 */
export function Suspense(props, context) {
    const { fallback, timeout = 0, onResolve, onFallback, onError } = props;
    const { slots } = context;

    const isLoading = ref(false);
    const hasError = ref(false);
    const errorObj = ref(null);
    const pendingPromises = new Set();

    let timeoutId = null;

    /**
     * Register a pending promise
     */
    const registerPromise = (promise) => {
        pendingPromises.add(promise);
        isLoading.value = true;

        if (timeout > 0 && !timeoutId) {
            timeoutId = setTimeout(() => {
                if (isLoading.value && onFallback) {
                    onFallback();
                }
            }, timeout);
        }

        return promise
            .then((result) => {
                pendingPromises.delete(promise);
                checkComplete();
                return result;
            })
            .catch((error) => {
                pendingPromises.delete(promise);
                handleError(error);
                throw error;
            });
    };

    /**
     * Check if all promises are complete
     */
    const checkComplete = () => {
        if (pendingPromises.size === 0) {
            isLoading.value = false;
            hasError.value = false;

            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            if (onResolve) {
                onResolve();
            }
        }
    };

    /**
     * Handle errors in async operations
     */
    const handleError = (error) => {
        hasError.value = true;
        errorObj.value = error;
        isLoading.value = false;

        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }

        if (onError) {
            onError(error);
        }
    };

    /**
     * Retry failed operations
     */
    const retry = () => {
        hasError.value = false;
        errorObj.value = null;
        // Component will re-render and retry
    };

    // Render logic
    const renderContent = computed(() => {
        if (hasError.value) {
            // Render error UI if provided
            if (slots.error) {
                return slots.error({ error: errorObj.value, retry });
            }
            // Default error display
            return h('div', { class: 'suspense-error' }, [
                h('p', {}, 'Error loading content'),
                h('button', { onClick: retry }, 'Retry')
            ]);
        }

        if (isLoading.value) {
            // Render fallback UI
            if (fallback) {
                return typeof fallback === 'function' ? fallback() : fallback;
            }
            if (slots.fallback) {
                return slots.fallback();
            }
            // Default fallback
            return h('div', { class: 'suspense-loading' }, 'Loading...');
        }

        // Render main content
        return slots.default ? slots.default({ registerPromise }) : null;
    });

    return renderContent.value;
}

// Mark as internal component
Suspense.__isSuspense = true;