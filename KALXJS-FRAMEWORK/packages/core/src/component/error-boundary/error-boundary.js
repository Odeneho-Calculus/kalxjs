/**
 * Error Boundary - Catch and handle component errors
 * Prevents entire app from crashing due to component errors
 */

import { ref, reactive } from '../../reactivity/reactive.js';
import { h } from '../../vdom/vdom.js';
import { onErrorCaptured, getCurrentInstance } from '../../composition.js';

/**
 * Error Boundary component
 * @param {Object} props - Component props
 * @param {Object} context - Component context
 * @returns {VNode} Virtual node
 */
export function ErrorBoundary(props, context) {
    const {
        fallback,
        onError,
        onReset,
        resetKeys = [],
        isolate = false
    } = props;

    const { slots } = context;

    const error = ref(null);
    const errorInfo = reactive({
        componentStack: '',
        timestamp: null,
        count: 0
    });

    /**
     * Resets error state
     */
    const reset = () => {
        error.value = null;
        errorInfo.componentStack = '';
        errorInfo.timestamp = null;
        errorInfo.count = 0;

        if (onReset) {
            onReset();
        }
    };

    /**
     * Handles captured errors
     */
    const handleError = (err, instance, info) => {
        error.value = err;
        errorInfo.componentStack = info || '';
        errorInfo.timestamp = new Date();
        errorInfo.count++;

        // Log error in development
        if (process.env.NODE_ENV === 'development') {
            console.error('[KALXJS Error Boundary] Caught error:', err);
            console.error('Component stack:', info);
        }

        // Call error callback
        if (onError) {
            onError(err, { ...errorInfo });
        }

        // Return false to prevent error from propagating
        return !isolate;
    };

    // Register error handler
    onErrorCaptured(handleError);

    // Watch for reset key changes
    if (resetKeys.length > 0) {
        // TODO: Implement reset key watching
        // This would reset the error boundary when specific props change
    }

    // Render logic
    if (error.value) {
        // Render fallback UI
        if (fallback) {
            if (typeof fallback === 'function') {
                return fallback({
                    error: error.value,
                    errorInfo: { ...errorInfo },
                    reset
                });
            }
            return fallback;
        }

        if (slots.fallback) {
            return slots.fallback({
                error: error.value,
                errorInfo: { ...errorInfo },
                reset
            });
        }

        // Default error UI
        return h('div', {
            class: 'kalxjs-error-boundary',
            style: {
                padding: '20px',
                margin: '20px',
                border: '2px solid #ff4444',
                borderRadius: '8px',
                backgroundColor: '#fff5f5'
            }
        }, [
            h('h2', { style: { color: '#ff4444', marginTop: 0 } }, '⚠️ Something went wrong'),
            h('details', { style: { marginTop: '10px' } }, [
                h('summary', { style: { cursor: 'pointer', fontWeight: 'bold' } }, 'Error details'),
                h('pre', {
                    style: {
                        marginTop: '10px',
                        padding: '10px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontSize: '12px'
                    }
                }, error.value.toString())
            ]),
            h('button', {
                onClick: reset,
                style: {
                    marginTop: '15px',
                    padding: '8px 16px',
                    backgroundColor: '#4444ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }
            }, 'Try Again')
        ]);
    }

    // Render children
    return slots.default ? slots.default() : null;
}

// Mark as internal component
ErrorBoundary.__isErrorBoundary = true;