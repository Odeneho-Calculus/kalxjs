/**
 * Internal utility functions for @kalxjs/core
 * Simple type checking utilities
 */

/**
 * Check if value is a string
 * @param {*} value - Value to check
 * @returns {boolean}
 */
export function isString(value) {
    return typeof value === 'string';
}

/**
 * Check if value is an object (excluding null and arrays)
 * @param {*} value - Value to check
 * @returns {boolean}
 */
export function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Check if value is a function
 * @param {*} value - Value to check
 * @returns {boolean}
 */
export function isFunction(value) {
    return typeof value === 'function';
}

/**
 * Check if value is an array
 * @param {*} value - Value to check
 * @returns {boolean}
 */
export function isArray(value) {
    return Array.isArray(value);
}

/**
 * Check if value is undefined
 * @param {*} value - Value to check
 * @returns {boolean}
 */
export function isUndefined(value) {
    return typeof value === 'undefined';
}

/**
 * Check if value is null
 * @param {*} value - Value to check
 * @returns {boolean}
 */
export function isNull(value) {
    return value === null;
}

/**
 * Check if value is a promise
 * @param {*} value - Value to check
 * @returns {boolean}
 */
export function isPromise(value) {
    return value instanceof Promise || (value && typeof value.then === 'function');
}

/**
 * Execute callback on next tick (after DOM updates)
 * @param {Function} callback - Callback to execute
 * @returns {Promise} Promise that resolves on next tick
 */
export function nextTick(callback) {
    const p = Promise.resolve();
    return callback ? p.then(callback) : p;
}