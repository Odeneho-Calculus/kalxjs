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
 * @param {string|function} tag - HTML tag name or component function
 * @param {Object} props - Node properties
 * @param {...any} children - Child nodes
 */
export function h(tag, props = {}, ...children) {
    // Handle null or undefined tag
    if (!tag) {
        console.warn('Invalid tag provided to h function');
        return null;
    }

    // Process all children
    const processedChildren = [];

    // Flatten arrays in children
    const flattenedChildren = [];
    children.forEach(child => {
        if (Array.isArray(child)) {
            flattenedChildren.push(...child);
        } else {
            flattenedChildren.push(child);
        }
    });

    // Process each child
    flattenedChildren.forEach(child => {
        if (typeof child === 'string' || typeof child === 'number') {
            processedChildren.push({
                tag: 'TEXT_ELEMENT',
                props: { nodeValue: String(child) },
                children: []
            });
        } else if (child) {
            processedChildren.push(child);
        }
    });

    // If tag is a component function, execute it to get the actual vnode
    if (typeof tag === 'function') {
        // Call the component function with props
        const result = tag(props || {});

        // If result is a string or number, wrap it in a proper vnode
        if (typeof result === 'string' || typeof result === 'number') {
            return {
                tag: 'div',
                props: {},
                children: [{
                    tag: 'TEXT_ELEMENT',
                    props: { nodeValue: String(result) },
                    children: []
                }]
            };
        }

        return result;
    }

    return {
        tag,
        props: props || {},
        children: processedChildren
    };
}

/**
 * Creates a virtual DOM node (alias for h function with different argument handling)
 * @param {string|function} tag - HTML tag name or component function
 * @param {Object} props - Node properties
 * @param {...any} children - Child nodes
 */
export function createElement(tag, props = {}, ...children) {
    // Handle null or undefined tag
    if (!tag) {
        console.warn('Invalid tag provided to createElement function');
        return null;
    }

    // Flatten and process children
    const processedChildren = [];

    // Handle the case where children is an array with a single array element
    const childrenArray = children.length === 1 && Array.isArray(children[0])
        ? children[0]
        : children;

    // Process each child
    childrenArray.forEach(child => {
        if (typeof child === 'string' || typeof child === 'number') {
            processedChildren.push({
                tag: 'TEXT_ELEMENT',
                props: { nodeValue: String(child) },
                children: []
            });
        } else if (child) {
            processedChildren.push(child);
        }
    });

    // If tag is a component function, execute it to get the actual vnode
    if (typeof tag === 'function') {
        // Call the component function with props
        const result = tag(props || {});

        // If result is a string or number, wrap it in a proper vnode
        if (typeof result === 'string' || typeof result === 'number') {
            return {
                tag: 'div',
                props: {},
                children: [{
                    tag: 'TEXT_ELEMENT',
                    props: { nodeValue: String(result) },
                    children: []
                }]
            };
        }

        return result;
    }

    return {
        tag,
        props: props || {},
        children: processedChildren
    };
}

/**
 * Creates a real DOM element from a virtual node
 * @param {Object} vnode - Virtual DOM node
 * @returns {HTMLElement} Real DOM element
 */
export function createDOMElement(vnode) {
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

    // Handle ref objects (from reactivity system)
    if (vnode && typeof vnode === 'object' && '_value' in vnode && 'value' in vnode) {
        console.warn('Attempted to render a ref object directly. Unwrapping value:', vnode.value);
        return createDOMElement(vnode.value);
    }

    // Handle TEXT_ELEMENT specially
    if (vnode.tag === 'TEXT_ELEMENT') {
        return document.createTextNode(vnode.props.nodeValue);
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
                return createDOMElement(renderResult);
            }

            // If the result doesn't have a tag property, add one
            if (typeof result === 'object' && !result.tag) {
                console.warn('Component returned object without tag property, adding div tag');
                result.tag = 'div';
            }

            return createDOMElement(result);
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
            return createDOMElement(result);
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

                // Also set as direct property for test compatibility
                // This is important for tests that check element.id, etc.
                element[key] = value;
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
                const childElement = createDOMElement(child);
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
 * @param {HTMLElement} parent - Parent element containing the DOM element to update
 * @param {Object} oldVNode - Previous virtual DOM node
 * @param {Object} newVNode - New virtual DOM node
 * @param {number} index - Index of the child in the parent
 * @returns {HTMLElement} Updated DOM element
 */
export function updateElement(parent, oldVNode, newVNode, index = 0) {
    // Handle new node (no old node)
    if (oldVNode === null || oldVNode === undefined) {
        if (newVNode) {
            parent.appendChild(createDOMElement(newVNode));
        }
        return;
    }

    // Handle removed node (no new node)
    if (newVNode === null || newVNode === undefined) {
        parent.removeChild(parent.childNodes[index]);
        return;
    }

    // Handle ref objects (from reactivity system)
    if (newVNode && typeof newVNode === 'object' && '_value' in newVNode && 'value' in newVNode) {
        console.warn('Attempted to update with a ref object. Unwrapping value:', newVNode.value);
        return updateElement(parent, oldVNode, newVNode.value, index);
    }

    // Handle text node updates
    if (typeof oldVNode === 'string' || typeof newVNode === 'string' ||
        typeof oldVNode === 'number' || typeof newVNode === 'number') {
        if (oldVNode !== newVNode) {
            parent.replaceChild(
                createDOMElement(newVNode),
                parent.childNodes[index]
            );
        }
        return;
    }

    // Handle different node types
    if (oldVNode.tag !== newVNode.tag) {
        parent.replaceChild(
            createDOMElement(newVNode),
            parent.childNodes[index]
        );
        return;
    }

    // Update properties
    updateProps(parent.childNodes[index], oldVNode.props || {}, newVNode.props || {});

    // Update children
    const oldChildren = Array.isArray(oldVNode.children) ? oldVNode.children : [];
    const newChildren = Array.isArray(newVNode.children) ? newVNode.children : [];
    const maxLength = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < maxLength; i++) {
        updateElement(
            parent.childNodes[index],
            i < oldChildren.length ? oldChildren[i] : null,
            i < newChildren.length ? newChildren[i] : null,
            i
        );
    }
}

/**
 * Updates the properties of a DOM element
 * @param {HTMLElement} element - DOM element to update
 * @param {Object} oldProps - Previous properties
 * @param {Object} newProps - New properties
 */
function updateProps(element, oldProps, newProps) {
    // Remove old properties
    for (const [key, value] of Object.entries(oldProps)) {
        if (!(key in newProps)) {
            if (key.startsWith('on')) {
                // Remove event listener
                const eventName = key.slice(2).toLowerCase();
                element.removeEventListener(eventName, value);
            } else if (key === 'style') {
                // Clear styles
                element.style = '';
            } else if (key === 'class' || key === 'className') {
                // Clear class
                element.className = '';
            } else {
                // Remove attribute
                element.removeAttribute(key);
            }
        }
    }

    // Set new properties
    for (const [key, value] of Object.entries(newProps)) {
        if (oldProps[key] !== value) {
            if (key.startsWith('on')) {
                // Update event listener
                const eventName = key.slice(2).toLowerCase();
                if (oldProps[key]) {
                    element.removeEventListener(eventName, oldProps[key]);
                }
                element.addEventListener(eventName, value);
            } else if (key === 'style' && typeof value === 'object') {
                // Update styles
                Object.assign(element.style, value);
            } else if (key === 'class' || key === 'className') {
                // Update class
                element.className = value;
            } else if (key === 'dangerouslySetInnerHTML') {
                // Update innerHTML
                if (value && value.__html !== undefined) {
                    element.innerHTML = value.__html;
                }
            } else {
                // Update attribute
                element.setAttribute(key, value);
                // Also update property
                element[key] = value;
            }
        }
    }
}

/**
 * Applies the patch to update the DOM
 * @param {HTMLElement} parent - Parent element containing the DOM element to update
 * @param {Object} oldVNode - Previous virtual DOM node
 * @param {Object} newVNode - New virtual DOM node
 * @returns {HTMLElement} Updated DOM element
 */
export function applyPatch(parent, oldVNode, newVNode) {
    return patch(parent, oldVNode, newVNode);
}