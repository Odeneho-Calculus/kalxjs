/**
 * Suspense Context - Manage suspense boundaries and async tracking
 */

let currentSuspenseBoundary = null;
const suspenseStack = [];

/**
 * Creates a suspense boundary context
 * @returns {Object} Suspense boundary
 */
export function createSuspenseBoundary() {
    const pendingPromises = new Set();
    const callbacks = {
        onResolve: [],
        onPending: [],
        onError: []
    };

    return {
        pendingPromises,
        callbacks,
        isPending: () => pendingPromises.size > 0
    };
}

/**
 * Sets the current suspense boundary
 * @param {Object} boundary - Suspense boundary
 */
export function pushSuspenseBoundary(boundary) {
    suspenseStack.push(currentSuspenseBoundary);
    currentSuspenseBoundary = boundary;
}

/**
 * Restores previous suspense boundary
 */
export function popSuspenseBoundary() {
    currentSuspenseBoundary = suspenseStack.pop();
}

/**
 * Gets current suspense boundary
 * @returns {Object|null} Current boundary
 */
export function getCurrentSuspenseBoundary() {
    return currentSuspenseBoundary;
}

/**
 * Registers a promise with the current suspense boundary
 * @param {Promise} promise - Promise to track
 * @returns {Promise} Tracked promise
 */
export function trackPromise(promise) {
    if (!currentSuspenseBoundary) {
        return promise;
    }

    const boundary = currentSuspenseBoundary;
    boundary.pendingPromises.add(promise);

    // Notify pending callbacks
    boundary.callbacks.onPending.forEach(cb => cb());

    const cleanup = () => {
        boundary.pendingPromises.delete(promise);

        if (boundary.pendingPromises.size === 0) {
            boundary.callbacks.onResolve.forEach(cb => cb());
        }
    };

    return promise
        .then((result) => {
            cleanup();
            return result;
        })
        .catch((error) => {
            cleanup();
            boundary.callbacks.onError.forEach(cb => cb(error));
            throw error;
        });
}

/**
 * Registers a callback for suspense events
 * @param {string} event - Event name (resolve, pending, error)
 * @param {Function} callback - Callback function
 */
export function onSuspenseEvent(event, callback) {
    if (!currentSuspenseBoundary) {
        return;
    }

    if (currentSuspenseBoundary.callbacks[event]) {
        currentSuspenseBoundary.callbacks[event].push(callback);
    }
}