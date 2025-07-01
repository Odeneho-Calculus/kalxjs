// packages/core/src/vdom/vdom.js

// Import the new diffing algorithm
import { patch } from './diff.js';

/**
 * Creates a DOM element from a virtual node
 * @param {Object} vnode - Virtual DOM node
 * @returns {HTMLElement} The created DOM element
 */
export function createDOMElement(vnode) {
    // Handle text elements
    if (vnode.tag === 'TEXT_ELEMENT') {
        return document.createTextNode(vnode.props.nodeValue);
    }

    // Create the DOM element
    const element = document.createElement(vnode.tag);

    // Set properties
    if (vnode.props) {
        // Special handling for innerHTML
        if ('innerHTML' in vnode.props) {
            element.innerHTML = vnode.props.innerHTML;
        }

        Object.keys(vnode.props).forEach(key => {
            if (key === 'innerHTML') {
                // Already handled above
                return;
            }

            const value = vnode.props[key];

            // Skip null or undefined props
            if (value === null || value === undefined) {
                return;
            }

            // Handle event listeners
            if (key.startsWith('on') && typeof value === 'function') {
                const eventName = key.slice(2).toLowerCase();
                element.addEventListener(eventName, value);
            }
            // Handle style objects
            else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            }
            // Handle className
            else if (key === 'className' || key === 'class') {
                element.className = value;
            }
            // Handle special properties that should be set directly
            else if (key === 'id' || key === 'value' || key === 'checked' || key === 'disabled') {
                element[key] = value;
            }
            // Handle regular attributes
            else {
                element.setAttribute(key, value);
            }
        });
    }

    // Create and append children only if innerHTML is not set
    if (vnode.children && !(vnode.props && 'innerHTML' in vnode.props)) {
        vnode.children.forEach(child => {
            if (child) {
                const childElement = createDOMElement(child);
                element.appendChild(childElement);
            }
        });
    }

    return element;
}

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
 * Creates a virtual DOM node (JSX compatible)
 * @param {string|function} tag - HTML tag name or component function
 * @param {Object} props - Node properties
 * @param {...any} children - Child nodes
 * @returns {Object} Virtual DOM node
 */
export function h(tag, props, ...children) {
    // Handle null or undefined tag
    if (!tag) {
        console.warn('Invalid tag provided to h function');
        return null;
    }

    // Handle case where props is null or children are passed as second argument
    if (props === null || props === undefined) {
        props = {};
    }

    // Flatten children array and process each child
    const processedChildren = [];

    // Flatten the children array (could be nested due to the rest parameter)
    const flatChildren = flattenArray(children);

    flatChildren.forEach(child => {
        if (child === null || child === undefined) {
            // Skip null or undefined children
            return;
        }

        if (typeof child === 'string' || typeof child === 'number') {
            // Convert primitive values to text nodes
            processedChildren.push({
                tag: 'TEXT_ELEMENT',
                props: { nodeValue: String(child) },
                children: []
            });
        } else {
            // Add object children directly
            processedChildren.push(child);
        }
    });

    // If tag is a component function, call it with props
    if (typeof tag === 'function') {
        // Call the component function with props
        const result = tag(props);

        // If the result is already a vnode, return it
        if (result && result.tag) {
            return result;
        }

        // Otherwise, create a div with the result as content
        return {
            tag: 'div',
            props: {},
            children: typeof result === 'string' || typeof result === 'number'
                ? [{ tag: 'TEXT_ELEMENT', props: { nodeValue: String(result) }, children: [] }]
                : [result]
        };
    }

    // Return the virtual node
    return {
        tag,
        props: props || {},
        children: processedChildren
    };
}

/**
 * Creates a virtual DOM node
 * @param {string} tag - HTML tag name
 * @param {Object} props - Node properties
 * @param {Array} children - Child nodes
 * @returns {Object} Virtual DOM node
 */
export function createElement(tag, props = {}, children = []) {
    // Create the base virtual node
    const vnode = {
        tag,
        props: props || {},
        children: []
    };

    // Process children
    if (children) {
        // Ensure children is an array
        const childArray = Array.isArray(children) ? children : [children];

        // Process each child
        childArray.forEach(child => {
            if (child === null || child === undefined) {
                // Skip null or undefined children
                return;
            }

            if (typeof child === 'string' || typeof child === 'number') {
                // Convert primitive values to text nodes
                vnode.children.push({
                    tag: 'TEXT_ELEMENT',
                    props: { nodeValue: String(child) },
                    children: []
                });
            } else {
                // Add object children directly
                vnode.children.push(child);
            }
        });
    }

    return vnode;
}

// This section is no longer needed as we've refactored the component handling in the h function

// This section is no longer needed as we've refactored the DOM element creation in the createDOMElement function

/**
 * Updates an existing DOM element to match a new virtual DOM node
 * @param {HTMLElement} parent - Parent DOM element
 * @param {Object} oldVNode - Previous virtual DOM node
 * @param {Object} newVNode - New virtual DOM node
 * @param {number} index - Index of the child in the parent
 * @returns {HTMLElement} Updated DOM element
 */
export function updateElement(parent, oldVNode, newVNode, index = 0) {
    // Handle case where newVNode is null (element should be removed)
    if (!newVNode) {
        if (parent.childNodes[index]) {
            parent.removeChild(parent.childNodes[index]);
        }
        return null;
    }

    // Handle case where oldVNode is null (new element should be created)
    if (!oldVNode) {
        const newElement = createDOMElement(newVNode);
        parent.appendChild(newElement);
        return newElement;
    }

    // Handle case where nodes are different types
    if (oldVNode.tag !== newVNode.tag) {
        const newElement = createDOMElement(newVNode);
        if (parent.childNodes[index]) {
            parent.replaceChild(newElement, parent.childNodes[index]);
        } else {
            parent.appendChild(newElement);
        }
        return newElement;
    }

    // Update the existing element's properties
    const element = parent.childNodes[index];

    // Update properties
    if (element && newVNode.props) {
        Object.keys(newVNode.props).forEach(key => {
            // Skip children property
            if (key === 'children') return;

            // Update the property
            if (key === 'className' || key === 'class') {
                element.className = newVNode.props[key];
            } else if (key === 'style' && typeof newVNode.props[key] === 'object') {
                Object.assign(element.style, newVNode.props[key]);
            } else if (key.startsWith('on') && typeof newVNode.props[key] === 'function') {
                const eventName = key.slice(2).toLowerCase();
                // Remove old event listener if it exists
                if (oldVNode.props && oldVNode.props[key]) {
                    element.removeEventListener(eventName, oldVNode.props[key]);
                }
                element.addEventListener(eventName, newVNode.props[key]);
            } else {
                element[key] = newVNode.props[key];
            }
        });
    }

    // Update children
    if (newVNode.children) {
        const newLength = newVNode.children.length;
        const oldLength = oldVNode.children ? oldVNode.children.length : 0;

        // Update existing children
        for (let i = 0; i < Math.max(newLength, oldLength); i++) {
            updateElement(
                element,
                i < oldLength ? oldVNode.children[i] : null,
                i < newLength ? newVNode.children[i] : null,
                i
            );
        }
    }

    return element;
}

/**
 * Updates the properties of a DOM element
 * @param {HTMLElement} element - DOM element to update
 * @param {Object} oldProps - Previous properties
 * @param {Object} newProps - New properties
 */
export function updateProps(element, oldProps, newProps) {
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
 * @param {HTMLElement} parentElement - Parent DOM element
 * @param {Object} oldChild - Previous virtual DOM node
 * @param {Object} newChild - New virtual DOM node
 * @param {number} index - Child index
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

/**
 * Updates all children of a DOM element
 * @param {HTMLElement} parentElement - Parent DOM element
 * @param {Array} oldChildren - Previous virtual DOM nodes
 * @param {Array} newChildren - New virtual DOM nodes
 */
export function updateChildren(parentElement, oldChildren, newChildren) {
    const maxLength = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < maxLength; i++) {
        updateChild(
            parentElement,
            oldChildren[i],
            newChildren[i],
            i
        );
    }
}