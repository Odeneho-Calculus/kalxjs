// @kalxjs/core - Virtual DOM diffing algorithm

/**
 * Patches a DOM node to match a new virtual DOM node
 * @param {HTMLElement} domNode - DOM node to patch
 * @param {Object} oldVNode - Old virtual DOM node
 * @param {Object} newVNode - New virtual DOM node
 * @returns {HTMLElement} Updated DOM node
 */
export function patch(domNode, oldVNode, newVNode) {
    // If the old vnode is the same as the new vnode, do nothing
    if (oldVNode === newVNode) {
        return domNode;
    }

    // If the new vnode is null or undefined, remove the node
    if (!newVNode) {
        domNode.parentNode.removeChild(domNode);
        return null;
    }

    // If the old vnode is null or undefined, create a new node
    if (!oldVNode) {
        const newNode = createDOMNode(newVNode);
        domNode.parentNode.appendChild(newNode);
        return newNode;
    }

    // If the nodes are of different types, replace the node
    if (nodeTypesAreDifferent(oldVNode, newVNode)) {
        const newNode = createDOMNode(newVNode);
        domNode.parentNode.replaceChild(newNode, domNode);
        return newNode;
    }

    // If the nodes are of the same type, update the node
    return updateDOMNode(domNode, oldVNode, newVNode);
}

/**
 * Checks if two nodes are of different types
 * @private
 * @param {Object} oldVNode - Old virtual DOM node
 * @param {Object} newVNode - New virtual DOM node
 * @returns {boolean} Whether the nodes are of different types
 */
function nodeTypesAreDifferent(oldVNode, newVNode) {
    // Handle primitive values
    if (typeof oldVNode !== 'object' || typeof newVNode !== 'object') {
        return typeof oldVNode !== typeof newVNode;
    }

    // Handle component nodes
    if (oldVNode.isComponent || newVNode.isComponent) {
        return oldVNode.tag !== newVNode.tag;
    }

    // Handle regular nodes
    return oldVNode.tag !== newVNode.tag;
}

/**
 * Creates a DOM node from a virtual DOM node
 * @private
 * @param {Object} vnode - Virtual DOM node
 * @returns {HTMLElement} DOM node
 */
function createDOMNode(vnode) {
    // Handle primitive values
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return document.createTextNode(vnode);
    }

    // Handle null or undefined
    if (!vnode) {
        return document.createComment('empty node');
    }

    // Handle component nodes
    if (vnode.isComponent) {
        // This would be handled by the component system
        return document.createComment('component node');
    }

    // Handle regular nodes
    const element = document.createElement(vnode.tag);

    // Set attributes
    updateAttributes(element, {}, vnode.props || {});

    // Create and append children
    (vnode.children || []).forEach(child => {
        if (child !== null && child !== undefined) {
            element.appendChild(createDOMNode(child));
        }
    });

    return element;
}

/**
 * Updates a DOM node to match a new virtual DOM node
 * @private
 * @param {HTMLElement} domNode - DOM node to update
 * @param {Object} oldVNode - Old virtual DOM node
 * @param {Object} newVNode - New virtual DOM node
 * @returns {HTMLElement} Updated DOM node
 */
function updateDOMNode(domNode, oldVNode, newVNode) {
    // Handle text nodes
    if (typeof oldVNode === 'string' || typeof newVNode === 'string' ||
        typeof oldVNode === 'number' || typeof newVNode === 'number') {
        if (oldVNode !== newVNode) {
            const newNode = document.createTextNode(newVNode);
            domNode.parentNode.replaceChild(newNode, domNode);
            return newNode;
        }
        return domNode;
    }

    // Update attributes
    updateAttributes(domNode, oldVNode.props || {}, newVNode.props || {});

    // Update children
    updateChildren(domNode, oldVNode.children || [], newVNode.children || []);

    return domNode;
}

/**
 * Updates the attributes of a DOM node
 * @private
 * @param {HTMLElement} domNode - DOM node to update
 * @param {Object} oldAttrs - Old attributes
 * @param {Object} newAttrs - New attributes
 */
function updateAttributes(domNode, oldAttrs, newAttrs) {
    // Remove old attributes
    for (const key in oldAttrs) {
        if (!(key in newAttrs)) {
            if (key.startsWith('on')) {
                const eventName = key.slice(2).toLowerCase();
                domNode.removeEventListener(eventName, oldAttrs[key]);
            } else {
                domNode.removeAttribute(key);
            }
        }
    }

    // Set new attributes
    for (const key in newAttrs) {
        if (oldAttrs[key] !== newAttrs[key]) {
            if (key.startsWith('on')) {
                const eventName = key.slice(2).toLowerCase();
                if (oldAttrs[key]) {
                    domNode.removeEventListener(eventName, oldAttrs[key]);
                }
                domNode.addEventListener(eventName, newAttrs[key]);
            } else if (key === 'style' && typeof newAttrs[key] === 'object') {
                // Handle style objects
                const styleObj = newAttrs[key];
                for (const styleKey in styleObj) {
                    domNode.style[styleKey] = styleObj[styleKey];
                }
            } else if (key === 'class' || key === 'className') {
                // Handle class names
                domNode.className = newAttrs[key];
            } else if (key === 'dangerouslySetInnerHTML') {
                // Handle innerHTML
                domNode.innerHTML = newAttrs[key].__html;
            } else {
                // Handle regular attributes
                domNode.setAttribute(key, newAttrs[key]);
            }
        }
    }
}

/**
 * Updates the children of a DOM node
 * @private
 * @param {HTMLElement} domNode - DOM node to update
 * @param {Array} oldChildren - Old children
 * @param {Array} newChildren - New children
 */
function updateChildren(domNode, oldChildren, newChildren) {
    // Optimize for common cases
    if (oldChildren.length === 0) {
        // If there were no old children, append all new children
        newChildren.forEach(child => {
            domNode.appendChild(createDOMNode(child));
        });
        return;
    }

    if (newChildren.length === 0) {
        // If there are no new children, remove all old children
        domNode.innerHTML = '';
        return;
    }

    // Use key-based reconciliation if keys are present
    const oldKeyedChildren = {};
    const newKeyedChildren = {};
    let hasKeys = false;

    // Check if keys are present
    for (let i = 0; i < oldChildren.length; i++) {
        const child = oldChildren[i];
        if (child && child.props && child.props.key != null) {
            hasKeys = true;
            oldKeyedChildren[child.props.key] = { vnode: child, index: i };
        }
    }

    for (let i = 0; i < newChildren.length; i++) {
        const child = newChildren[i];
        if (child && child.props && child.props.key != null) {
            hasKeys = true;
            newKeyedChildren[child.props.key] = { vnode: child, index: i };
        }
    }

    if (hasKeys) {
        // Use key-based reconciliation
        const domChildren = Array.from(domNode.childNodes);
        const keysToRemove = Object.keys(oldKeyedChildren).filter(key => !(key in newKeyedChildren));

        // Remove nodes that are no longer needed
        keysToRemove.forEach(key => {
            const { index } = oldKeyedChildren[key];
            if (domChildren[index]) {
                domNode.removeChild(domChildren[index]);
            }
        });

        // Update or insert nodes
        let lastIndex = 0;

        Object.keys(newKeyedChildren).forEach(key => {
            const { vnode: newChild, index: newIndex } = newKeyedChildren[key];
            const oldChild = oldKeyedChildren[key];

            if (oldChild) {
                // Update existing node
                const oldIndex = oldChild.index;
                const oldVNode = oldChild.vnode;

                patch(domChildren[oldIndex], oldVNode, newChild);

                // Move node if needed
                if (oldIndex < lastIndex) {
                    const node = domChildren[oldIndex];
                    domNode.insertBefore(node, domChildren[lastIndex]);
                }

                lastIndex = Math.max(oldIndex, lastIndex);
            } else {
                // Insert new node
                const newNode = createDOMNode(newChild);

                if (newIndex < domChildren.length) {
                    domNode.insertBefore(newNode, domChildren[newIndex]);
                } else {
                    domNode.appendChild(newNode);
                }
            }
        });
    } else {
        // Use simple reconciliation
        const maxLength = Math.max(oldChildren.length, newChildren.length);

        for (let i = 0; i < maxLength; i++) {
            const oldChild = oldChildren[i];
            const newChild = newChildren[i];
            const domChild = domNode.childNodes[i];

            if (!oldChild && newChild) {
                // Insert new node
                domNode.appendChild(createDOMNode(newChild));
            } else if (oldChild && !newChild) {
                // Remove old node
                domNode.removeChild(domChild);
            } else if (oldChild && newChild) {
                // Update existing node
                patch(domChild, oldChild, newChild);
            }
        }
    }
}