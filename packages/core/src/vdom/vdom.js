// packages/core/src/vdom/vdom.js

/**
 * Creates a virtual DOM node
 * @param {string} tag - HTML tag name
 * @param {Object} props - Node properties
 * @param {Array} children - Child nodes
 */
export function h(tag, props = {}, children = []) {
    return {
        tag,
        props,
        children: children.flat()
    };
}

/**
 * Creates a real DOM element from a virtual node
 * @param {Object} vnode - Virtual DOM node
 * @returns {HTMLElement} Real DOM element
 */
export function createElement(vnode) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return document.createTextNode(vnode);
    }

    const element = document.createElement(vnode.tag);

    // Set properties
    for (const [key, value] of Object.entries(vnode.props || {})) {
        if (key.startsWith('on')) {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else {
            element.setAttribute(key, value);
        }
    }

    // Create and append children
    (vnode.children || []).forEach(child => {
        element.appendChild(createElement(child));
    });

    return element;
}

/**
 * Updates an existing DOM element to match a new virtual DOM node
 * @param {HTMLElement} element - DOM element to update
 * @param {Object} oldVNode - Previous virtual DOM node
 * @param {Object} newVNode - New virtual DOM node
 */
export function updateElement(element, oldVNode, newVNode) {
    // Handle text nodes
    if (typeof oldVNode === 'string' || typeof newVNode === 'string') {
        if (oldVNode !== newVNode) {
            const newElement = createElement(newVNode);
            element.parentNode.replaceChild(newElement, element);
        }
        return;
    }

    // If tags are different, replace the entire element
    if (oldVNode.tag !== newVNode.tag) {
        const newElement = createElement(newVNode);
        element.parentNode.replaceChild(newElement, element);
        return;
    }

    // Update properties
    updateProps(element, oldVNode.props || {}, newVNode.props || {});

    // Update children
    const oldChildren = oldVNode.children || [];
    const newChildren = newVNode.children || [];
    const maxLength = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < maxLength; i++) {
        updateChild(
            element,
            oldChildren[i],
            newChildren[i],
            i
        );
    }
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