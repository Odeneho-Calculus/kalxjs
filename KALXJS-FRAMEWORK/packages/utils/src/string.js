// packages/utils/src/string.js

/**
 * Capitalizes the first letter of a string
 * 
 * @param {string} str The string to capitalize
 * @returns {string} The capitalized string
 */
export function capitalize(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to camelCase
 * 
 * @param {string} str The string to convert
 * @returns {string} The camelCase string
 */
export function camelCase(str) {
    if (!str || typeof str !== 'string') return '';

    return str
        .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
        .replace(/^([A-Z])/, (m) => m.toLowerCase());
}

/**
 * Converts a string to kebab-case
 * 
 * @param {string} str The string to convert
 * @returns {string} The kebab-case string
 */
export function kebabCase(str) {
    if (!str || typeof str !== 'string') return '';

    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}

/**
 * Converts a string to snake_case
 * 
 * @param {string} str The string to convert
 * @returns {string} The snake_case string
 */
export function snakeCase(str) {
    if (!str || typeof str !== 'string') return '';

    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();
}

/**
 * Truncates a string if it's longer than the given maximum length
 * 
 * @param {string} str The string to truncate
 * @param {number} length The maximum string length
 * @param {string} omission The string to indicate text is omitted
 * @returns {string} The truncated string
 */
export function truncate(str, length = 30, omission = '...') {
    if (!str || typeof str !== 'string') return '';

    if (str.length <= length) return str;
    return str.slice(0, length - omission.length) + omission;
}

/**
 * Escapes HTML special characters in a string
 * 
 * @param {string} str The string to escape
 * @returns {string} The escaped string
 */
export function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';

    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };

    return str.replace(/[&<>"']/g, match => htmlEscapes[match]);
}

/**
 * Unescapes HTML special characters in a string
 * 
 * @param {string} str The string to unescape
 * @returns {string} The unescaped string
 */
export function unescapeHtml(str) {
    if (!str || typeof str !== 'string') return '';

    const htmlUnescapes = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'"
    };

    return str.replace(/&(?:amp|lt|gt|quot|#39);/g, match => htmlUnescapes[match]);
}

/**
 * Pads a string to the specified length
 * 
 * @param {string} str The string to pad
 * @param {number} length The padding length
 * @param {string} chars The string used as padding
 * @returns {string} The padded string
 */
export function pad(str, length = 0, chars = ' ') {
    if (!str || typeof str !== 'string') return '';

    const strLength = str.length;
    if (strLength >= length) return str;

    const padLength = Math.floor((length - strLength) / 2);
    return chars.repeat(padLength) + str + chars.repeat(padLength + (length - strLength) % 2);
}