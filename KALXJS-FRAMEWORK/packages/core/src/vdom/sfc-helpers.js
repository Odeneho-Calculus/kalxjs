// SFC Helper functions for the KalxJS core library
// These functions are used by the SFC compiler to generate code

import { h, createElement } from './vdom.js';

/**
 * Opens a block for rendering
 * This is a simplified implementation that just returns the current element
 */
export function openBlock() {
    console.log('[kalxjs] openBlock called');
    return null;
}

/**
 * Creates a block with the given tag, props, and children
 * This is a simplified implementation that just calls h()
 * @param {string|function} tag - HTML tag name or component function
 * @param {Object} props - Node properties
 * @param {Array} children - Child nodes
 * @returns {Object} Virtual DOM node
 */
export function createBlock(tag, props, children) {
    console.log('[kalxjs] createBlock called with tag:', tag);
    return h(tag, props, children);
}

/**
 * Converts a value to a display string
 * @param {any} val - Value to convert
 * @returns {string} String representation of the value
 */
export function toDisplayString(val) {
    console.log('[kalxjs] toDisplayString called with value:', val);
    return val == null ? '' : String(val);
}

/**
 * Creates a virtual DOM node
 * This is a simplified implementation that just calls h()
 * @param {string|function} tag - HTML tag name or component function
 * @param {Object} props - Node properties
 * @param {Array} children - Child nodes
 * @returns {Object} Virtual DOM node
 */
export function createVNode(tag, props, children) {
    console.log('[kalxjs] createVNode called with tag:', tag);
    return h(tag, props, children);
}