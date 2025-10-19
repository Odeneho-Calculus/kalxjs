/**
 * Async Testing Utilities
 * Utilities for testing async operations
 *
 * @module @kalxjs/testing/async-utilities
 */

/**
 * Wait for condition to be true
 */
export async function waitFor(callback, options = {}) {
    const {
        timeout = 1000,
        interval = 50,
        onTimeout,
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        try {
            const result = await callback();

            if (result) {
                return result;
            }
        } catch (error) {
            // Continue waiting
        }

        await new Promise(resolve => setTimeout(resolve, interval));
    }

    if (onTimeout) {
        onTimeout();
    }

    throw new Error(`Timeout after ${timeout}ms waiting for condition`);
}

/**
 * Wait for element to appear
 */
export async function waitForElement(selector, options = {}) {
    const { container = document, ...waitOptions } = options;

    return waitFor(
        () => {
            const element = container.querySelector(selector);
            if (!element) {
                throw new Error(`Element not found: ${selector}`);
            }
            return element;
        },
        waitOptions
    );
}

/**
 * Wait for element to disappear
 */
export async function waitForElementToBeRemoved(selector, options = {}) {
    const { container = document, ...waitOptions } = options;

    return waitFor(
        () => {
            const element = container.querySelector(selector);
            if (element) {
                throw new Error(`Element still present: ${selector}`);
            }
            return true;
        },
        waitOptions
    );
}

/**
 * Wait for DOM update
 */
export async function waitForDOMUpdate(callback) {
    await new Promise(resolve => {
        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        } else {
            setTimeout(resolve, 16);
        }
    });

    if (callback) {
        return callback();
    }
}

/**
 * Wait for next tick (microtask)
 */
export function nextTick() {
    return new Promise(resolve => {
        if (typeof queueMicrotask !== 'undefined') {
            queueMicrotask(resolve);
        } else {
            Promise.resolve().then(resolve);
        }
    });
}

/**
 * Flush all pending promises
 */
export async function flushPromises() {
    return new Promise(resolve => {
        if (typeof setImmediate !== 'undefined') {
            setImmediate(resolve);
        } else {
            setTimeout(resolve, 0);
        }
    });
}

/**
 * Act utility for React-like behavior
 */
export async function act(callback) {
    let result;

    // Execute callback
    if (callback) {
        result = await callback();
    }

    // Flush microtasks
    await nextTick();

    // Flush timers
    await flushPromises();

    // Wait for DOM updates
    await waitForDOMUpdate();

    return result;
}

/**
 * Retry callback until it succeeds
 */
export async function retry(callback, options = {}) {
    const {
        retries = 3,
        delay = 100,
        onRetry,
    } = options;

    let lastError;

    for (let i = 0; i <= retries; i++) {
        try {
            return await callback();
        } catch (error) {
            lastError = error;

            if (i < retries) {
                if (onRetry) {
                    onRetry(error, i + 1);
                }

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

/**
 * Wait for async operation with timeout
 */
export async function withTimeout(promise, timeout = 5000) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
        ),
    ]);
}

/**
 * Defer promise resolution
 */
export function createDeferred() {
    let resolve, reject;

    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return {
        promise,
        resolve,
        reject,
    };
}

/**
 * Wait for multiple conditions
 */
export async function waitForAll(callbacks, options = {}) {
    const results = await Promise.all(
        callbacks.map(callback => waitFor(callback, options))
    );

    return results;
}

/**
 * Wait for any condition
 */
export async function waitForAny(callbacks, options = {}) {
    return Promise.race(
        callbacks.map(callback => waitFor(callback, options))
    );
}

/**
 * Poll for condition
 */
export async function poll(callback, options = {}) {
    const {
        interval = 100,
        timeout = 5000,
        stopOnSuccess = true,
    } = options;

    const startTime = Date.now();
    const results = [];

    while (Date.now() - startTime < timeout) {
        const result = await callback();
        results.push(result);

        if (stopOnSuccess && result) {
            break;
        }

        await new Promise(resolve => setTimeout(resolve, interval));
    }

    return results;
}

/**
 * Debounce async function for testing
 */
export function createAsyncDebounce(fn, delay) {
    let timeoutId;
    let pendingPromise = null;

    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        if (!pendingPromise) {
            pendingPromise = createDeferred();
        }

        timeoutId = setTimeout(async () => {
            try {
                const result = await fn(...args);
                pendingPromise.resolve(result);
            } catch (error) {
                pendingPromise.reject(error);
            } finally {
                pendingPromise = null;
            }
        }, delay);

        return pendingPromise.promise;
    };
}

/**
 * Throttle async function for testing
 */
export function createAsyncThrottle(fn, delay) {
    let isThrottled = false;
    let pendingArgs = null;

    return async (...args) => {
        if (isThrottled) {
            pendingArgs = args;
            return;
        }

        isThrottled = true;

        const result = await fn(...args);

        setTimeout(() => {
            isThrottled = false;

            if (pendingArgs) {
                const args = pendingArgs;
                pendingArgs = null;
                fn(...args);
            }
        }, delay);

        return result;
    };
}

/**
 * Wait for loading state
 */
export async function waitForLoadingComplete(getLoadingState, options = {}) {
    return waitFor(
        () => {
            const isLoading = getLoadingState();
            if (isLoading) {
                throw new Error('Still loading');
            }
            return true;
        },
        options
    );
}

/**
 * Wait for error state
 */
export async function waitForError(getErrorState, options = {}) {
    return waitFor(
        () => {
            const error = getErrorState();
            if (!error) {
                throw new Error('No error occurred');
            }
            return error;
        },
        options
    );
}