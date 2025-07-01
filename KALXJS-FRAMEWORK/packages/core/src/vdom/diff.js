// @kalxjs/core - Virtual DOM diffing algorithm

/**
 * Patches a DOM node to match a new virtual DOM node
 * @param {HTMLElement} domNode - DOM node to patch
 * @param {Object} oldVNode - Old virtual DOM node
 * @param {Object} newVNode - New virtual DOM node
 * @returns {HTMLElement} Updated DOM node
 */
export function patch(domNode, oldVNode, newVNode) {
    // Check if domNode is valid
    if (!domNode) {
        console.warn('Cannot patch: domNode is undefined or null');
        return createDOMNode(newVNode); // Return a new node but don't attach it
    }

    // Check if domNode has a parent
    if (!domNode.parentNode) {
        console.warn('Cannot patch: domNode has no parent');
        return createDOMNode(newVNode); // Return a new node but don't attach it
    }

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
        // Create a fallback element instead of a comment node
        const fallbackElement = document.createElement('div');
        fallbackElement.className = 'kalxjs-fallback-element';
        fallbackElement.innerHTML = `
            <div style="padding: 10px; border: 1px solid #f0ad4e; background-color: #fcf8e3; color: #8a6d3b; border-radius: 4px;">
                <h4 style="margin-top: 0;">KalxJS Rendering Notice</h4>
                <p>The framework attempted to render a component but received empty content.</p>
                <p>This is a fallback element to ensure something is displayed.</p>
            </div>
        `;
        return fallbackElement;
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
    // Check if domNode is valid
    if (!domNode) {
        console.warn('Cannot update DOM node: domNode is undefined or null');
        return createDOMNode(newVNode);
    }

    // Check if domNode has a parent
    if (!domNode.parentNode) {
        console.warn('Cannot update DOM node: domNode has no parent');
        return createDOMNode(newVNode);
    }

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
 * Updates the attributes of a DOM node with optimized attribute handling
 * @private
 * @param {HTMLElement} domNode - DOM node to update
 * @param {Object} oldAttrs - Old attributes
 * @param {Object} newAttrs - New attributes
 */
function updateAttributes(domNode, oldAttrs, newAttrs) {
    // Special attribute sets for optimized handling
    const directProps = new Set(['id', 'value', 'checked', 'disabled', 'selected', 'textContent']);
    const booleanProps = new Set(['checked', 'disabled', 'selected', 'hidden', 'readonly', 'required', 'open', 'multiple']);

    // Cache event handlers to avoid unnecessary re-renders
    if (!domNode._kalxEvents) {
        domNode._kalxEvents = new Map();
    }

    // Remove old attributes that are no longer present
    for (const key in oldAttrs) {
        if (!(key in newAttrs)) {
            if (key.startsWith('on')) {
                // Handle event listeners
                const eventName = key.slice(2).toLowerCase();
                const handler = domNode._kalxEvents.get(eventName);
                if (handler) {
                    domNode.removeEventListener(eventName, handler);
                    domNode._kalxEvents.delete(eventName);
                }
            } else if (directProps.has(key)) {
                // Reset direct properties
                domNode[key] = '';
            } else if (booleanProps.has(key)) {
                // Reset boolean properties
                domNode[key] = false;
            } else if (key === 'style') {
                // Reset style
                domNode.style = '';
            } else if (key === 'class' || key === 'className') {
                // Reset class
                domNode.className = '';
            } else {
                // Remove regular attributes
                domNode.removeAttribute(key);
            }
        }
    }

    // Set new attributes or update changed ones
    for (const key in newAttrs) {
        const newValue = newAttrs[key];
        const oldValue = oldAttrs[key];

        // Skip if values are identical
        if (newValue === oldValue) continue;

        // Skip null or undefined values
        if (newValue === null || newValue === undefined) {
            if (oldValue !== null && oldValue !== undefined) {
                // Remove the attribute if it was previously set
                if (directProps.has(key)) {
                    domNode[key] = '';
                } else if (booleanProps.has(key)) {
                    domNode[key] = false;
                } else {
                    domNode.removeAttribute(key);
                }
            }
            continue;
        }

        // Handle different attribute types
        if (key.startsWith('on')) {
            // Optimized event handling
            const eventName = key.slice(2).toLowerCase();
            const oldHandler = domNode._kalxEvents.get(eventName);

            if (oldHandler) {
                domNode.removeEventListener(eventName, oldHandler);
            }

            domNode.addEventListener(eventName, newValue);
            domNode._kalxEvents.set(eventName, newValue);
        } else if (key === 'style') {
            if (typeof newValue === 'string') {
                // Handle style string
                domNode.style = newValue;
            } else if (typeof newValue === 'object') {
                // Handle style object with optimized updates
                const styleObj = newValue;
                const oldStyleObj = typeof oldValue === 'object' ? oldValue : {};

                // Remove old styles
                for (const styleKey in oldStyleObj) {
                    if (!(styleKey in styleObj)) {
                        domNode.style[styleKey] = '';
                    }
                }

                // Set new styles
                for (const styleKey in styleObj) {
                    if (oldStyleObj[styleKey] !== styleObj[styleKey]) {
                        domNode.style[styleKey] = styleObj[styleKey];
                    }
                }
            }
        } else if (key === 'class' || key === 'className') {
            // Handle class names
            domNode.className = newValue;
        } else if (key === 'dangerouslySetInnerHTML') {
            // Handle innerHTML with safety check
            if (newValue && newValue.__html !== undefined) {
                domNode.innerHTML = newValue.__html;
            }
        } else if (directProps.has(key)) {
            // Set direct properties
            domNode[key] = newValue;
        } else if (booleanProps.has(key)) {
            // Handle boolean attributes
            if (newValue === true || newValue === 'true' || newValue === '') {
                domNode[key] = true;
                domNode.setAttribute(key, '');
            } else {
                domNode[key] = false;
                domNode.removeAttribute(key);
            }
        } else {
            // Handle regular attributes
            domNode.setAttribute(key, newValue);
        }
    }
}

/**
 * Updates the children of a DOM node using an optimized algorithm
 * @private
 * @param {HTMLElement} domNode - DOM node to update
 * @param {Array} oldChildren - Old children
 * @param {Array} newChildren - New children
 */
function updateChildren(domNode, oldChildren, newChildren) {
    // Check if domNode is valid
    if (!domNode) {
        console.warn('Cannot update children: domNode is undefined or null');
        return;
    }

    // Fast path for common cases
    if (oldChildren.length === 0) {
        // If there were no old children, use DocumentFragment for batch append
        const fragment = document.createDocumentFragment();
        newChildren.forEach(child => {
            fragment.appendChild(createDOMNode(child));
        });
        domNode.appendChild(fragment);
        return;
    }

    if (newChildren.length === 0) {
        // If there are no new children, use faster textContent clearing
        domNode.textContent = '';
        return;
    }

    // Check if we can use key-based reconciliation
    const oldKeyedChildren = new Map();
    const newKeyedChildren = new Map();
    let hasKeys = false;

    // Collect keys from old children (using Map for better performance)
    for (let i = 0; i < oldChildren.length; i++) {
        const child = oldChildren[i];
        if (child && child.props && child.props.key != null) {
            hasKeys = true;
            oldKeyedChildren.set(child.props.key, { vnode: child, index: i, domNode: domNode.childNodes[i] });
        }
    }

    // Collect keys from new children
    for (let i = 0; i < newChildren.length; i++) {
        const child = newChildren[i];
        if (child && child.props && child.props.key != null) {
            hasKeys = true;
            newKeyedChildren.set(child.props.key, { vnode: child, index: i });
        }
    }

    if (hasKeys) {
        // Use optimized key-based reconciliation
        const domChildrenArray = Array.from(domNode.childNodes);
        const fragment = document.createDocumentFragment();
        const nodesToMove = new Map(); // Track nodes that need to be moved

        // Step 1: Mark nodes for removal and collect nodes to reuse
        oldKeyedChildren.forEach((oldChild, key) => {
            if (!newKeyedChildren.has(key)) {
                // Node is no longer needed, mark for removal
                if (oldChild.domNode) {
                    domNode.removeChild(oldChild.domNode);
                }
            } else {
                // Node will be reused, store it
                nodesToMove.set(key, oldChild.domNode);
            }
        });

        // Step 2: Create a new array to hold the final order of nodes
        const newDomNodes = new Array(newChildren.length);

        // Step 3: Process new children in order
        newKeyedChildren.forEach((newChild, key) => {
            const existingNode = nodesToMove.get(key);

            if (existingNode) {
                // Update existing node
                const oldVNode = oldKeyedChildren.get(key).vnode;
                patch(existingNode, oldVNode, newChild.vnode);
                newDomNodes[newChild.index] = existingNode;
                nodesToMove.delete(key); // Mark as processed
            } else {
                // Create new node
                newDomNodes[newChild.index] = createDOMNode(newChild.vnode);
            }
        });

        // Step 4: Append all nodes in the correct order
        newDomNodes.forEach(node => {
            if (node) {
                fragment.appendChild(node);
            }
        });

        // Step 5: Replace all children at once (more efficient)
        domNode.textContent = '';
        domNode.appendChild(fragment);
    } else {
        // Use optimized simple reconciliation with minimal DOM operations
        const domChildrenArray = Array.from(domNode.childNodes);
        let shouldReplaceAll = false;

        // Check if we can do a simple update or need to replace all
        if (oldChildren.length !== newChildren.length) {
            shouldReplaceAll = true;
        } else {
            // Check if the structure is similar enough for in-place updates
            for (let i = 0; i < oldChildren.length; i++) {
                if (!oldChildren[i] || !newChildren[i] ||
                    (oldChildren[i].tag !== newChildren[i].tag)) {
                    shouldReplaceAll = true;
                    break;
                }
            }
        }

        if (shouldReplaceAll) {
            // Structure is too different, replace all children
            const fragment = document.createDocumentFragment();
            newChildren.forEach(child => {
                fragment.appendChild(createDOMNode(child));
            });

            domNode.textContent = '';
            domNode.appendChild(fragment);
        } else {
            // Structure is similar, update in place
            for (let i = 0; i < newChildren.length; i++) {
                const oldChild = oldChildren[i];
                const newChild = newChildren[i];
                const domChild = domChildrenArray[i];

                if (domChild) {
                    patch(domChild, oldChild, newChild);
                } else {
                    domNode.appendChild(createDOMNode(newChild));
                }
            }
        }
    }
}