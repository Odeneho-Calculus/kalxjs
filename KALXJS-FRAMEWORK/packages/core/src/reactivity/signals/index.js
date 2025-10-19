/**
 * Signals - Fine-grained reactivity system
 * Export all signal-related functionality
 */

export { signal, computed, effect, getCurrentListener } from './signal.js';
export { batch, queueEffect, isBatchingUpdates } from './batch.js';
export { untrack, createUntrackedSignal } from './untrack.js';
export { memo, signalWithEquals } from './memo.js';

/**
 * Utility: Create a resource signal for async data
 * @param {Function} fetcher - Async function to fetch data
 * @param {*} initialValue - Initial value
 * @returns {Object} Resource with data signal and loading/error states
 */
export function createResource(fetcher, initialValue) {
    const data = signal(initialValue);
    const loading = signal(false);
    const error = signal(null);

    const load = async (...args) => {
        loading.set(true);
        error.set(null);

        try {
            const result = await fetcher(...args);
            data.set(result);
            return result;
        } catch (err) {
            error.set(err);
            throw err;
        } finally {
            loading.set(false);
        }
    };

    const refetch = () => load();

    return {
        data,
        loading,
        error,
        load,
        refetch
    };
}

/**
 * Utility: Create a writable store
 * @param {*} initialValue - Initial value
 * @returns {Object} Store with get/set/update/subscribe
 */
export function createStore(initialValue) {
    const sig = signal(initialValue);

    return {
        get: () => sig(),
        set: (value) => sig.set(value),
        update: (fn) => sig.update(fn),
        subscribe: (callback) => {
            effect(() => callback(sig()));
        }
    };
}