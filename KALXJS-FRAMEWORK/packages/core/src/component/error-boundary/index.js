/**
 * Error Boundary - Export all error handling functionality
 */

export { ErrorBoundary } from './error-boundary.js';
export {
    registerErrorHandler,
    handleError,
    getErrorHistory,
    clearErrorHistory,
    configureErrorHandling,
    errorConfig
} from './error-handler.js';

/**
 * Composition API hook for error handling
 * @returns {Object} Error handling utilities
 */
import { ref } from '../../reactivity/reactive.js';
import { onErrorCaptured } from '../../composition.js';

export function useErrorHandler() {
    const error = ref(null);
    const hasError = ref(false);

    const captureError = (err, instance, info) => {
        error.value = err;
        hasError.value = true;
        return false; // Prevent propagation
    };

    const clearError = () => {
        error.value = null;
        hasError.value = false;
    };

    const retry = (fn) => {
        clearError();
        try {
            return fn();
        } catch (err) {
            captureError(err);
        }
    };

    onErrorCaptured(captureError);

    return {
        error,
        hasError,
        clearError,
        retry
    };
}

/**
 * Higher-order component for adding error boundary
 * @param {Object} Component - Component to wrap
 * @param {Object} errorBoundaryProps - Error boundary props
 * @returns {Object} Wrapped component
 */
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
    return {
        name: `ErrorBoundary(${Component.name || 'Anonymous'})`,
        setup(props, context) {
            return () => {
                return h(ErrorBoundary, errorBoundaryProps, {
                    default: () => h(Component, props, context)
                });
            };
        }
    };
}