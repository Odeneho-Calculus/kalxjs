/**
 * Untrack - Break reactivity tracking temporarily
 */

import { getCurrentListener } from './signal.js';

let currentListener = null;

/**
 * Runs a function without tracking signal dependencies
 * @param {Function} fn - Function to run untracked
 * @returns {*} Result of the function
 */
export function untrack(fn) {
    const prevListener = getCurrentListener();
    currentListener = null;

    try {
        return fn();
    } finally {
        currentListener = prevListener;
    }
}

/**
 * Creates a signal that doesn't track dependencies
 * @param {*} initialValue - Initial value
 * @returns {Function} Untracked signal
 */
export function createUntrackedSignal(initialValue) {
    let value = initialValue;

    const read = () => value;
    read.set = (newValue) => {
        value = typeof newValue === 'function' ? newValue(value) : newValue;
    };

    return read;
}