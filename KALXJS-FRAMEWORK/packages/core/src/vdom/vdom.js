// packages/core/src/vdom/vdom.js

// Import the new diffing algorithm
import { patch } from './diff.js';

/**
 * Creates a DOM element with the given tag
 * @param {string} tag - HTML tag name
 * @returns {HTMLElement} The created DOM element
 */
export function createDOMElement(tag) {
    return document.createElement(tag);
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
 * Creates a virtual DOM node
 * @param {string|function} tag - HTML tag name or component function
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

    // If tag is a component function, mark it as a component
    if (typeof tag === 'function') {
        return {
            tag: 'component-placeholder', // Use a placeholder tag for the vnode
            props: props || {},
            children: flattenArray(childArray),
            component: tag, // Store the component function
            isComponent: true // Mark as a component
        };
    }

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

        // Instead of returning a comment node, create a fallback element
        const fallbackElement = document.createElement('div');
        fallbackElement.className = 'kalxjs-fallback-element';
        fallbackElement.innerHTML = `
            <div style="padding: 10px; border: 1px solid #f0ad4e; background-color: #fcf8e3; color: #8a6d3b; border-radius: 4px;">
                <h4 style="margin-top: 0;">KalxJS Rendering Notice</h4>
                <p>The framework attempted to render a component but received empty content.</p>
                <p>This is a fallback element to ensure something is displayed.</p>
            </div>
        `;

        // Add a debug property to help with troubleshooting
        fallbackElement._debug = {
            error: 'Null or undefined vnode',
            timestamp: new Date().toISOString()
        };

        return fallbackElement;
    }

    // Handle case where vnode might be a component
    if (vnode.isComponent && vnode.component) {
        try {
            console.log('Rendering component:', vnode.component.name || 'anonymous');

            // Check if this is a component factory from defineComponent
            if (vnode.component.options) {
                console.log('Detected component factory with options:', vnode.component.options.name);
            }

            // Call the component function with the props
            const result = vnode.component(vnode.props);

            if (!result) {
                throw new Error('Component function returned null or undefined');
            }

            console.log('Component function result:', result);

            // If the result is a component instance with a render method, call it
            if (result.render && typeof result.render === 'function') {
                const renderResult = result.render();
                console.log('Component render result:', renderResult);
                return createElement(renderResult);
            }

            // If the result doesn't have a tag property, add one
            if (typeof result === 'object' && !result.tag) {
                console.warn('Component returned object without tag property, adding div tag');
                result.tag = 'div';
            }

            return createElement(result);
        } catch (error) {
            console.error('Error rendering component:', error);
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

    // Handle case where vnode might be a function (legacy support)
    if (typeof vnode === 'function') {
        console.warn('Function passed directly to createElement. This is deprecated, use h(Component, props, children) instead.');
        try {
            // Call the function with empty props
            const result = vnode({});
            return createElement(result);
        } catch (error) {
            console.error('Error rendering function component:', error);
            const errorElement = document.createElement('div');
            errorElement.style.color = 'red';
            errorElement.innerHTML = `<p>Error: ${error.message}</p>`;
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
        element = createDOMElement(vnode.tag);
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