// packages/core/src/vdom/vdom.js

// Import the new diffing algorithm
import { patch } from './diff';

/**
 * Flattens an array (polyfill for Array.prototype.flat)
 * @private
 * @param {Array} arr - Array to flatten
 * @param {number} depth - Maximum recursion depth
 * @returns {Array} Flattened array
 */
function flattenArray(arr, depth = 1) {
    // Ensure arr is always an array
    if (!Array.isArray(arr)) {
        return arr ? [arr] : [];
    }

    const result = [];

    arr.forEach(item => {
        if (Array.isArray(item) && depth > 0) {
            result.push(...flattenArray(item, depth - 1));
        } else {
            result.push(item);
        }
    });

    return result;
}

/**
 * Creates a virtual DOM node
 * @param {string} tag - HTML tag name
 * @param {Object} props - Node properties
 * @param {Array} children - Child nodes
 */
export function h(tag, props = {}, children = []) {
    // Handle null or undefined tag
    if (!tag) {
        console.warn('Invalid tag provided to h function');
        return null;
    }

    // Ensure children is always an array
    const childArray = Array.isArray(children) ? children : (children ? [children] : []);

    return {
        tag,
        props: props || {},
        children: flattenArray(childArray)
    };
}

/**
 * Creates a real DOM element from a virtual node
 * @param {Object} vnode - Virtual DOM node
 * @returns {HTMLElement} Real DOM element
 */
export function createElement(vnode) {
    // Handle primitive values (string, number, etc.)
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return document.createTextNode(String(vnode));
    }

    // Handle null or undefined
    if (!vnode) {
        console.error('Attempted to create element from null/undefined vnode');
        const comment = document.createComment('empty node');
        // Add a debug property to help with troubleshooting
        comment._debug = {
            error: 'Null or undefined vnode',
            timestamp: new Date().toISOString()
        };
        return comment;
    }

    // Handle case where vnode might be a function (component)
    if (typeof vnode === 'function') {
        try {
            console.log('Rendering component function:', vnode.name || 'anonymous');

            // Check if this is a component factory from defineComponent
            if (vnode.options) {
                console.log('Detected component factory with options:', vnode.options.name);
            }

            // Call the function with empty props if none provided
            const result = vnode({});

            if (!result) {
                throw new Error('Component function returned null or undefined');
            }

            console.log('Component function result:', result);

            // If the result doesn't have a tag property, add one
            if (typeof result === 'object' && !result.tag) {
                console.warn('Component returned object without tag property, adding div tag');
                result.tag = 'div';
            }

            return createElement(result);
        } catch (error) {
            console.error('Error rendering component function:', error);
            const errorElement = document.createElement('div');
            errorElement.style.color = 'red';
            errorElement.style.border = '1px solid red';
            errorElement.style.padding = '10px';
            errorElement.style.margin = '10px 0';
            errorElement.innerHTML = `
                <h4>Component Error</h4>
                <p>${error.message}</p>
                <pre style="font-size: 12px; overflow: auto; max-height: 200px; background: #f5f5f5; padding: 5px;">${error.stack}</pre>
            `;
            return errorElement;
        }
    }

    // Handle case where vnode might not be a proper virtual node object
    if (!vnode.tag) {
        console.error('Invalid vnode (missing tag):', vnode);

        // Debug information
        console.log('vnode type:', typeof vnode);
        console.log('vnode keys:', Object.keys(vnode || {}));

        // Create a more informative error element
        const errorElement = document.createElement('div');
        errorElement.style.color = 'red';
        errorElement.style.border = '1px solid red';
        errorElement.style.padding = '10px';
        errorElement.style.margin = '10px 0';

        try {
            errorElement.innerHTML = `
                <h4>Invalid Virtual DOM Node</h4>
                <p>A virtual DOM node is missing the required 'tag' property</p>
                <pre style="font-size: 12px; overflow: auto; max-height: 200px; background: #f5f5f5; padding: 5px;">
${JSON.stringify(vnode, null, 2)}
                </pre>
            `;
        } catch (e) {
            errorElement.textContent = `Invalid vnode: Cannot stringify for display`;
        }

        return errorElement;
    }

    // Create the DOM element
    let element;
    try {
        element = document.createElement(vnode.tag);
    } catch (error) {
        console.error(`Error creating element with tag "${vnode.tag}":`, error);
        const errorElement = document.createElement('div');
        errorElement.style.color = 'red';
        errorElement.style.padding = '5px';
        errorElement.textContent = `Invalid tag: ${vnode.tag}`;
        return errorElement;
    }

    // Set properties
    try {
        for (const [key, value] of Object.entries(vnode.props || {})) {
            if (value === undefined || value === null) {
                continue; // Skip null/undefined props
            }

            if (key.startsWith('on')) {
                // Handle both camelCase (onClick) and lowercase (onclick) event handlers
                const eventName = key.slice(2).toLowerCase();
                if (typeof value === 'function') {
                    element.addEventListener(eventName, value);
                } else {
                    console.warn(`Event handler for ${eventName} is not a function:`, value);
                }
            } else if (key === 'style' && typeof value === 'object') {
                // Handle style objects
                Object.assign(element.style, value);
            } else if (key === 'class' || key === 'className') {
                // Handle class names
                element.className = value;
            } else if (key === 'dangerouslySetInnerHTML') {
                // Handle innerHTML
                if (value && value.__html !== undefined) {
                    element.innerHTML = value.__html;
                }
            } else {
                // Handle regular attributes
                element.setAttribute(key, value);
            }
        }
    } catch (error) {
        console.error('Error setting properties:', error);
        // Continue despite property errors
    }

    // Create and append children
    const children = Array.isArray(vnode.children) ? vnode.children : (vnode.children ? [vnode.children] : []);
    children.forEach(child => {
        if (child !== null && child !== undefined) {
            try {
                const childElement = createElement(child);
                if (childElement) {
                    element.appendChild(childElement);
                }
            } catch (error) {
                console.error('Error creating child element:', error);
                const errorComment = document.createComment(`Error creating child: ${error.message}`);
                element.appendChild(errorComment);
            }
        }
    });

    return element;
}

/**
 * Updates an existing DOM element to match a new virtual DOM node
 * @param {HTMLElement} element - DOM element to update
 * @param {Object} oldVNode - Previous virtual DOM node
 * @param {Object} newVNode - New virtual DOM node
 * @returns {HTMLElement} Updated DOM element
 */
export function updateElement(element, oldVNode, newVNode) {
    // Use the new diffing algorithm
    return patch(element, oldVNode, newVNode);
}

/**
 * Updates the properties of a DOM element
 * @private
 */
function updateProps(element, oldProps, newProps) {
    // Remove old properties
    for (const [key, value] of Object.entries(oldProps)) {
        if (!(key in newProps)) {
            if (key.startsWith('on')) {
                const eventName = key.slice(2).toLowerCase();
                element.removeEventListener(eventName, value);
            } else {
                element.removeAttribute(key);
            }
        }
    }

    // Set new properties
    for (const [key, value] of Object.entries(newProps)) {
        if (oldProps[key] !== value) {
            if (key.startsWith('on')) {
                const eventName = key.slice(2).toLowerCase();
                if (oldProps[key]) {
                    element.removeEventListener(eventName, oldProps[key]);
                }
                element.addEventListener(eventName, value);
            } else {
                element.setAttribute(key, value);
            }
        }
    }
}

/**
 * Updates a child element
 * @private
 */
function updateChild(parentElement, oldChild, newChild, index) {
    const childElement = parentElement.childNodes[index];

    // Remove extra children
    if (!newChild) {
        parentElement.removeChild(childElement);
        return;
    }

    // Add missing children
    if (!oldChild) {
        const newElement = createElement(newChild);
        parentElement.appendChild(newElement);
        return;
    }

    // Update existing children
    updateElement(childElement, oldChild, newChild);
}