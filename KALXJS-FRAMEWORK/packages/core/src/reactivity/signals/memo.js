/**
 * Memo - Memoized computed signal with caching
 */

import { signal, effect } from './signal.js';

/**
 * Creates a memoized computed signal
 * @param {Function} computation - Computation function
 * @param {Function} equals - Custom equality check (optional)
 * @returns {Function} Memoized signal accessor
 */
export function memo(computation, equals) {
    let cachedValue;
    let isInitialized = false;

    const equalsFn = equals || Object.is;
    const sig = signal(undefined);

    effect(() => {
        const newValue = computation();

        if (!isInitialized || !equalsFn(cachedValue, newValue)) {
            cachedValue = newValue;
            isInitialized = true;
            sig.set(newValue);
        }
    });

    return sig;
}

/**
 * Creates a signal with custom equality check
 * @param {*} initialValue - Initial value
 * @param {Function} equals - Custom equality function
 * @returns {Function} Signal with custom equality
 */
export function signalWithEquals(initialValue, equals) {
    const equalsFn = equals || Object.is;
    let value = initialValue;
    const subscribers = new Set();

    const read = () => {
        // Track dependency...
        return value;
    };

    const write = (nextValue) => {
        const newValue = typeof nextValue === 'function'
            ? nextValue(value)
            : nextValue;

        if (!equalsFn(value, newValue)) {
            value = newValue;
            subscribers.forEach(sub => sub.execute());
        }
    };

    read.set = write;
    return read;
}