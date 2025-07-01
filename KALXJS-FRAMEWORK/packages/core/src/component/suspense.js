// @kalxjs/core - Advanced Suspense and Error Boundaries
// Inspired by React 19's enhanced Suspense features

import { signal, derived, createEffect } from '../reactivity/signals.js';
import { h } from '../vdom/vdom.js';
import { ConcurrentAPI } from '../renderer/concurrent.js';

/**
 * Enhanced Suspense component for handling async operations
 */
export class KalxSuspense {
    constructor(options = {}) {
        this.fallback = options.fallback || this.defaultFallback();
        this.timeout = options.timeout || 10000;
        this.onTimeout = options.onTimeout || this.defaultTimeoutHandler;
        this.onError = options.onError || this.defaultErrorHandler;
        this.retryCount = options.retryCount || 3;

        // Internal state
        this.pendingPromises = new Set();
        this.isLoading = signal(false);
        this.error = signal(null);
        this.timeoutId = null;
        this.currentRetry = 0;
    }

    /**
     * Default fallback component
     */
    defaultFallback() {
        return {
            name: 'SuspenseFallback',
            render() {
                return h('div', {
                    class: 'kalx-suspense-fallback',
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        color: '#666'
                    }
                }, [
                    h('div', { class: 'kalx-spinner' }, ['Loading...']),
                    h('div', { style: { marginLeft: '10px' } }, ['Please wait'])
                ]);
            }
        };
    }

    /**
     * Default timeout handler
     */
    defaultTimeoutHandler = (promise) => {
        console.warn('Suspense timeout reached for promise:', promise);
        this.error(new Error('Request timeout'));
    }

    /**
     * Default error handler
     */
    defaultErrorHandler = (error, retry) => {
        console.error('Suspense error:', error);

        if (this.currentRetry < this.retryCount) {
            console.log(`Retrying... (${this.currentRetry + 1}/${this.retryCount})`);
            setTimeout(() => {
                this.currentRetry++;
                retry();
            }, 1000 * Math.pow(2, this.currentRetry)); // Exponential backoff
        }
    }

    /**
     * Wraps a component with suspense functionality
     * @param {Object} component - Component to wrap
     * @returns {Object} Wrapped component
     */
    wrap(component) {
        const suspenseInstance = this;

        return {
            name: `Suspense(${component.name || 'Anonymous'})`,

            setup(props, context) {
                // Track async operations
                const trackPromise = (promise) => {
                    if (!promise || typeof promise.then !== 'function') {
                        return promise;
                    }

                    suspenseInstance.pendingPromises.add(promise);
                    suspenseInstance.isLoading(true);
                    suspenseInstance.error(null);

                    // Set timeout
                    if (suspenseInstance.timeout > 0) {
                        suspenseInstance.timeoutId = setTimeout(() => {
                            if (suspenseInstance.pendingPromises.has(promise)) {
                                suspenseInstance.onTimeout(promise);
                            }
                        }, suspenseInstance.timeout);
                    }

                    return promise
                        .then(result => {
                            suspenseInstance.pendingPromises.delete(promise);

                            if (suspenseInstance.pendingPromises.size === 0) {
                                suspenseInstance.isLoading(false);
                                suspenseInstance.currentRetry = 0;
                            }

                            if (suspenseInstance.timeoutId) {
                                clearTimeout(suspenseInstance.timeoutId);
                                suspenseInstance.timeoutId = null;
                            }

                            return result;
                        })
                        .catch(error => {
                            suspenseInstance.pendingPromises.delete(promise);

                            if (suspenseInstance.pendingPromises.size === 0) {
                                suspenseInstance.isLoading(false);
                            }

                            if (suspenseInstance.timeoutId) {
                                clearTimeout(suspenseInstance.timeoutId);
                                suspenseInstance.timeoutId = null;
                            }

                            // Handle retry logic
                            const retry = () => {
                                suspenseInstance.error(null);
                                return trackPromise(promise);
                            };

                            suspenseInstance.onError(error, retry);
                            throw error;
                        });
                };

                // Wrap the original setup
                let setupResult;
                if (component.setup) {
                    try {
                        setupResult = component.setup(props, context);

                        // If setup returns a promise, track it
                        if (setupResult && typeof setupResult.then === 'function') {
                            setupResult = trackPromise(setupResult);
                        }

                        // If setup returns an object with promises, track them
                        if (setupResult && typeof setupResult === 'object') {
                            Object.keys(setupResult).forEach(key => {
                                const value = setupResult[key];
                                if (value && typeof value.then === 'function') {
                                    setupResult[key] = trackPromise(value);
                                }
                            });
                        }
                    } catch (error) {
                        suspenseInstance.error(error);
                    }
                }

                return {
                    ...setupResult,
                    $suspense: {
                        isLoading: suspenseInstance.isLoading,
                        error: suspenseInstance.error,
                        trackPromise
                    }
                };
            },

            render() {
                // Show error state
                if (suspenseInstance.error()) {
                    return h('div', {
                        class: 'kalx-suspense-error',
                        style: {
                            padding: '20px',
                            border: '1px solid #ff6b6b',
                            borderRadius: '4px',
                            backgroundColor: '#ffe0e0',
                            color: '#d63031'
                        }
                    }, [
                        h('h3', {}, ['Something went wrong']),
                        h('p', {}, [suspenseInstance.error().message]),
                        suspenseInstance.currentRetry < suspenseInstance.retryCount
                            ? h('button', {
                                onClick: () => {
                                    suspenseInstance.currentRetry++;
                                    suspenseInstance.error(null);
                                    // Trigger re-render
                                    ConcurrentAPI.scheduleImmediate(this);
                                }
                            }, ['Retry'])
                            : null
                    ]);
                }

                // Show loading state
                if (suspenseInstance.isLoading()) {
                    return typeof suspenseInstance.fallback === 'function'
                        ? suspenseInstance.fallback()
                        : suspenseInstance.fallback.render
                        ? suspenseInstance.fallback.render()
                        : suspenseInstance.fallback;
                }

                // Render the actual component
                try {
                    return component.render ? component.render.call(this) : null;
                } catch (error) {
                    suspenseInstance.error(error);
                    return null;
                }
            }
        };
    }

    /**
     * Creates a suspense boundary
     * @param {Object} options - Suspense options
     * @returns {Function} Suspense component factory
     */
    static create(options = {}) {
        return (children) => {
            const suspense = new KalxSuspense(options);

            return {
                name: 'SuspenseBoundary',
                setup() {
                    return {
                        suspense,
                        children: Array.isArray(children) ? children : [children]
                    };
                },
                render() {
                    return h('div', { class: 'kalx-suspense-boundary' },
                        this.children.map(child =>
                            typeof child === 'function'
                                ? suspense.wrap(child())
                                : suspense.wrap(child)
                        )
                    );
                }
            };
        };
    }
}

/**
 * Error Boundary component for catching and handling errors
 */
export class ErrorBoundary {
    constructor(options = {}) {
        this.fallback = options.fallback || this.defaultErrorFallback;
        this.onError = options.onError || this.defaultErrorHandler;
        this.resetOnPropsChange = options.resetOnPropsChange !== false;
        this.resetKeys = options.resetKeys || [];

        // Internal state
        this.hasError = signal(false);
        this.error = signal(null);
        this.errorInfo = signal(null);
        this.errorId = signal(0);
    }

    /**
     * Default error fallback component
     */
    defaultErrorFallback = (error, errorInfo, retry) => {
        return {
            name: 'ErrorFallback',
            render() {
                return h('div', {
                    class: 'kalx-error-boundary',
                    style: {
                        padding: '20px',
                        border: '2px solid #ff6b6b',
                        borderRadius: '8px',
                        backgroundColor: '#fff5f5',
                        margin: '20px 0'
                    }
                }, [
                    h('h2', {
                        style: { color: '#d63031', marginTop: 0 }
                    }, ['Something went wrong']),

                    h('details', {
                        style: { marginBottom: '15px' }
                    }, [
                        h('summary', {
                            style: { cursor: 'pointer', fontWeight: 'bold' }
                        }, ['Error Details']),
                        h('pre', {
                            style: {
                                backgroundColor: '#f8f9fa',
                                padding: '10px',
                                borderRadius: '4px',
                                overflow: 'auto',
                                fontSize: '12px'
                            }
                        }, [error.stack || error.message])
                    ]),

                    h('button', {
                        onClick: retry,
                        style: {
                            backgroundColor: '#0984e3',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }
                    }, ['Try Again'])
                ]);
            }
        };
    }

    /**
     * Default error handler
     */
    defaultErrorHandler = (error, errorInfo) => {
        console.error('Error caught by ErrorBoundary:', error);
        console.error('Error info:', errorInfo);

        // Report to error tracking service
        if (typeof window !== 'undefined' && window.reportError) {
            window.reportError(error);
        }
    }

    /**
     * Wraps a component with error boundary
     * @param {Object} component - Component to wrap
     * @returns {Object} Wrapped component
     */
    wrap(component) {
        const errorBoundary = this;

        return {
            name: `ErrorBoundary(${component.name || 'Anonymous'})`,

            setup(props, context) {
                // Reset error state when props change
                if (errorBoundary.resetOnPropsChange) {
                    createEffect(() => {
                        const propsString = JSON.stringify(props);
                        if (errorBoundary.hasError()) {
                            errorBoundary.reset();
                        }
                    });
                }

                // Reset error state when reset keys change
                if (errorBoundary.resetKeys.length > 0) {
                    createEffect(() => {
                        const resetValues = errorBoundary.resetKeys.map(key => props[key]);
                        if (errorBoundary.hasError()) {
                            errorBoundary.reset();
                        }
                    });
                }

                // Wrap the original setup with error handling
                let setupResult;
                try {
                    if (component.setup) {
                        setupResult = component.setup(props, context);
                    }
                } catch (error) {
                    errorBoundary.catchError(error, { phase: 'setup', component: component.name });
                }

                return {
                    ...setupResult,
                    $errorBoundary: {
                        hasError: errorBoundary.hasError,
                        error: errorBoundary.error,
                        reset: () => errorBoundary.reset()
                    }
                };
            },

            render() {
                // Show error fallback if there's an error
                if (errorBoundary.hasError()) {
                    const retry = () => errorBoundary.reset();

                    if (typeof errorBoundary.fallback === 'function') {
                        return errorBoundary.fallback(
                            errorBoundary.error(),
                            errorBoundary.errorInfo(),
                            retry
                        );
                    } else {
                        return errorBoundary.fallback.render
                            ? errorBoundary.fallback.render()
                            : errorBoundary.fallback;
                    }
                }

                // Render the actual component with error handling
                try {
                    return component.render ? component.render.call(this) : null;
                } catch (error) {
                    errorBoundary.catchError(error, { phase: 'render', component: component.name });
                    return null;
                }
            }
        };
    }

    /**
     * Catches and handles an error
     * @param {Error} error - The error that occurred
     * @param {Object} errorInfo - Additional error information
     */
    catchError(error, errorInfo = {}) {
        this.hasError(true);
        this.error(error);
        this.errorInfo(errorInfo);
        this.errorId(this.errorId() + 1);

        // Call the error handler
        this.onError(error, errorInfo);
    }

    /**
     * Resets the error boundary state
     */
    reset() {
        this.hasError(false);
        this.error(null);
        this.errorInfo(null);
    }

    /**
     * Creates an error boundary
     * @param {Object} options - Error boundary options
     * @returns {Function} Error boundary component factory
     */
    static create(options = {}) {
        return (children) => {
            const errorBoundary = new ErrorBoundary(options);

            return {
                name: 'ErrorBoundaryWrapper',
                setup() {
                    return {
                        errorBoundary,
                        children: Array.isArray(children) ? children : [children]
                    };
                },
                render() {
                    return h('div', { class: 'kalx-error-boundary-wrapper' },
                        this.children.map(child =>
                            typeof child === 'function'
                                ? errorBoundary.wrap(child())
                                : errorBoundary.wrap(child)
                        )
                    );
                }
            };
        };
    }
}

/**
 * Higher-order component that combines Suspense and Error Boundary
 * @param {Object} options - Combined options
 * @returns {Function} HOC function
 */
export function withAsyncBoundary(options = {}) {
    const {
        suspense: suspenseOptions = {},
        errorBoundary: errorBoundaryOptions = {},
        ...commonOptions
    } = options;

    return (component) => {
        const suspense = new KalxSuspense({ ...suspenseOptions, ...commonOptions });
        const errorBoundary = new ErrorBoundary({ ...errorBoundaryOptions, ...commonOptions });

        // First wrap with error boundary, then with suspense
        const errorWrapped = errorBoundary.wrap(component);
        return suspense.wrap(errorWrapped);
    };
}

/**
 * Utility functions for async operations
 */
export const AsyncUtils = {
    /**
     * Creates a resource that can be suspended
     * @param {Function} fetcher - Function that returns a promise
     * @param {any} initialValue - Initial value
     * @returns {Function} Resource accessor
     */
    createResource(fetcher, initialValue = null) {
        const data = signal(initialValue);
        const loading = signal(false);
        const error = signal(null);

        const load = async (...args) => {
            loading(true);
            error(null);

            try {
                const result = await fetcher(...args);
                data(result);
                return result;
            } catch (err) {
                error(err);
                throw err;
            } finally {
                loading(false);
            }
        };

        const resource = () => {
            if (error()) throw error();
            return data();
        };

        resource.load = load;
        resource.loading = loading;
        resource.error = error;
        resource.data = data;

        return resource;
    },

    /**
     * Creates a lazy component that loads on demand
     * @param {Function} loader - Function that returns a promise resolving to a component
     * @returns {Object} Lazy component
     */
    lazy(loader) {
        let componentPromise = null;
        let component = null;

        return {
            name: 'LazyComponent',
            setup(props, context) {
                if (!componentPromise) {
                    componentPromise = loader().then(comp => {
                        component = comp.default || comp;
                        return component;
                    });
                }

                // This will be caught by Suspense
                if (!component) {
                    throw componentPromise;
                }

                return component.setup ? component.setup(props, context) : {};
            },
            render() {
                if (!component) return null;
                return component.render ? component.render.call(this) : null;
            }
        };
    }
};

// Export convenience functions
export const createSuspense = KalxSuspense.create;
export const createErrorBoundary = ErrorBoundary.create;