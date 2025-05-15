// packages/utils/src/array.js

/**
 * Returns a new array with unique values
 * 
 * @param {Array} array The array to process
 * @returns {Array} The new array with unique values
 */
export function unique(array) {
    return [...new Set(array)];
}

/**
 * Flattens an array up to the specified depth
 * 
 * @param {Array} array The array to flatten
 * @param {number} depth The maximum recursion depth
 * @returns {Array} The new flattened array
 */
export function flatten(array, depth = 1) {
    return depth > 0
        ? array.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatten(val, depth - 1) : val), [])
        : array.slice();
}

/**
 * Groups array items by key
 * 
 * @param {Array} array The array to process
 * @param {string|Function} key The key to group by
 * @returns {Object} The grouped object
 */
export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = typeof key === 'function' ? key(item) : item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
}

/**
 * Chunks an array into groups of the specified size
 * 
 * @param {Array} array The array to process
 * @param {number} size The length of each chunk
 * @returns {Array} The new array of chunks
 */
export function chunk(array, size = 1) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

/**
 * Returns the intersection of arrays
 * 
 * @param {...Array} arrays The arrays to inspect
 * @returns {Array} The array of intersecting values
 */
export function intersection(...arrays) {
    if (arrays.length === 0) return [];
    if (arrays.length === 1) return arrays[0];

    return arrays.reduce((acc, array) => {
        return acc.filter(value => array.includes(value));
    });
}

/**
 * Returns the difference of arrays
 * 
 * @param {Array} array The array to inspect
 * @param {...Array} values The arrays to exclude
 * @returns {Array} The array of filtered values
 */
export function difference(array, ...values) {
    const excludes = new Set(flatten(values));
    return array.filter(value => !excludes.has(value));
}

/**
 * Shuffles an array using the Fisher-Yates algorithm
 * 
 * @param {Array} array The array to shuffle
 * @returns {Array} The new shuffled array
 */
export function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}