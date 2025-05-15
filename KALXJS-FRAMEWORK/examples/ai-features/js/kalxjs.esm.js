// packages/core/src/reactivity/reactive.js

// Current active effect
let activeEffect = null;

/**
 * Creates a reactive object
 * @param {Object} target - Object to make reactive
 * @returns {Proxy} Reactive object
 */
function reactive$1(target) {
    const handlers = {
        get(target, key, receiver) {
            const result = Reflect.get(target, key, receiver);
            track(target, key);
            return result;
        },
        set(target, key, value, receiver) {
            const oldValue = target[key];
            const result = Reflect.set(target, key, value, receiver);
            if (oldValue !== value) {
                trigger(target, key);
            }
            return result;
        }
    };

    return new Proxy(target, handlers);
}

/**
 * Creates a reactive reference
 * @param {any} value - Initial value
 * @returns {Object} Reactive reference
 */
function ref$1(value) {
    const r = {
        _value: value,
        get value() {
            track(r, 'value');
            return this._value;
        },
        set value(newValue) {
            if (this._value !== newValue) {
                this._value = newValue;
                trigger(r, 'value');
            }
        }
    };
    return r;
}

/**
 * Creates a computed property
 * @param {Function} getter - Getter function
 * @returns {Object} Computed property
 */
function computed$1(getter) {
    let value;
    let dirty = true;

    const runner = effect(getter, {
        lazy: true,
        scheduler: () => {
            if (!dirty) {
                dirty = true;
                trigger(computedRef, 'value');
            }
        }
    });

    const computedRef = {
        get value() {
            if (dirty) {
                value = runner();
                dirty = false;
            }
            track(computedRef, 'value');
            return value;
        }
    };

    return computedRef;
}

/**
 * Creates a reactive effect
 * @param {Function} fn - Effect function
 * @param {Object} options - Effect options
 * @returns {Function} Effect runner
 */
function effect(fn, options = {}) {
    const effect = createReactiveEffect(fn, options);

    if (!options.lazy) {
        effect();
    }

    return effect;
}

// Internal helpers
const targetMap = new WeakMap();

function track(target, key) {
    // Only track if we have an active effect and a valid target
    if (activeEffect && target) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = new Set()));
        }
        dep.add(activeEffect);
    }
}

function trigger(target, key) {
    // Check if target is valid
    if (!target) return;

    const depsMap = targetMap.get(target);
    if (!depsMap) return;

    const effects = depsMap.get(key);
    if (effects) {
        // Create a new set to avoid infinite loops if an effect triggers itself
        const effectsToRun = new Set(effects);
        effectsToRun.forEach(effect => {
            if (effect.scheduler) {
                effect.scheduler();
            } else {
                effect();
            }
        });
    }
}

function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        if (!effect.active) return fn();
        if (!effectStack.includes(effect)) {
            cleanup(effect);
            try {
                effectStack.push(effect);
                activeEffect = effect;
                return fn();
            } finally {
                effectStack.pop();
                // Set activeEffect to the previous effect in the stack or null if empty
                activeEffect = effectStack.length > 0 ? effectStack[effectStack.length - 1] : null;
            }
        }
    };

    effect.active = true;
    effect.deps = [];
    effect.options = options;
    return effect;
}

const effectStack = [];

function cleanup(effect) {
    const { deps } = effect;
    if (deps.length) {
        for (let i = 0; i < deps.length; i++) {
            deps[i].delete(effect);
        }
        deps.length = 0;
    }
}

// @kalxjs/core - Virtual DOM diffing algorithm

/**
 * Patches a DOM node to match a new virtual DOM node
 * @param {HTMLElement} domNode - DOM node to patch
 * @param {Object} oldVNode - Old virtual DOM node
 * @param {Object} newVNode - New virtual DOM node
 * @returns {HTMLElement} Updated DOM node
 */
function patch(domNode, oldVNode, newVNode) {
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

// packages/core/src/vdom/vdom.js

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
function h$1(tag, props = {}, children = []) {
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
function createElement(vnode) {
    // Handle primitive values (string, number, etc.)
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return document.createTextNode(vnode);
    }

    // Handle null or undefined
    if (!vnode) {
        return document.createComment('empty node');
    }

    // Handle case where vnode might not be a proper virtual node object
    if (!vnode.tag) {
        console.warn('Invalid vnode:', vnode);
        return document.createComment('invalid node');
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
    const children = Array.isArray(vnode.children) ? vnode.children : (vnode.children ? [vnode.children] : []);
    children.forEach(child => {
        if (child !== null && child !== undefined) {
            element.appendChild(createElement(child));
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
function updateElement(element, oldVNode, newVNode) {
    // Use the new diffing algorithm
    return patch(element, oldVNode, newVNode);
}

// @kalxjs/core - Composition API

/**
 * Creates a reactive object that can be used in the setup function
 * @param {Object} target - Object to make reactive
 * @returns {Proxy} Reactive object
 */
function useReactive(target) {
    return reactive$1(target);
}

/**
 * Creates a reactive reference that can be used in the setup function
 * @param {any} value - Initial value
 * @returns {Object} Reactive reference
 */
function useRef(value) {
    return ref$1(value);
}

/**
 * Creates a computed property that can be used in the setup function
 * @param {Function} getter - Getter function
 * @returns {Object} Computed property
 */
function useComputed(getter) {
    return computed$1(getter);
}

/**
 * Watches for changes in a reactive source and runs a callback
 * @param {Object|Function} source - Reactive object or getter function
 * @param {Function} callback - Callback function
 * @param {Object} options - Watch options
 * @returns {Function} Function to stop watching
 */
function watch$1(source, callback, options = {}) {
    const { immediate = false } = options;

    // Handle ref or reactive objects
    const getter = typeof source === 'function'
        ? source
        : () => {
            // Handle ref
            if (source && 'value' in source) {
                return source.value;
            }
            // Handle reactive object
            return source;
        };

    let oldValue;

    const runner = effect(() => getter(), {
        lazy: true,
        scheduler: () => {
            const newValue = runner();
            callback(newValue, oldValue);
            oldValue = newValue;
        }
    });

    if (immediate) {
        oldValue = runner();
        callback(oldValue, undefined);
    } else {
        oldValue = runner();
    }

    return () => {
        // Cleanup effect
        runner.active = false;
    };
}

/**
 * Runs a callback once when the component is mounted
 * @param {Function} callback - Callback function
 */
function onMounted$1(callback) {
    getCurrentInstance$1().mounted.push(callback);
}

/**
 * Runs a callback before the component is unmounted
 * @param {Function} callback - Callback function
 */
function onUnmounted$1(callback) {
    getCurrentInstance$1().unmounted.push(callback);
}

/**
 * Runs a callback before the component is updated
 * @param {Function} callback - Callback function
 */
function onBeforeUpdate(callback) {
    getCurrentInstance$1().beforeUpdate.push(callback);
}

/**
 * Runs a callback after the component is updated
 * @param {Function} callback - Callback function
 */
function onUpdated(callback) {
    getCurrentInstance$1().updated.push(callback);
}

// Current component instance
let currentInstance = null;

/**
 * Sets the current component instance
 * @param {Object} instance - Component instance
 */
function setCurrentInstance(instance) {
    currentInstance = instance;
}

/**
 * Gets the current component instance
 * @returns {Object} Current component instance
 */
function getCurrentInstance$1() {
    if (!currentInstance) {
        throw new Error('getCurrentInstance() can only be used inside setup()');
    }
    return currentInstance;
}

// @kalxjs/core - Component setup function

/**
 * Processes the setup function of a component
 * @param {Object} instance - Component instance
 * @param {Object} options - Component options
 * @returns {Object} Setup result
 */
function processSetup(instance, options) {
    if (!options.setup) {
        return {};
    }

    // Initialize lifecycle hooks arrays
    instance.mounted = [];
    instance.unmounted = [];
    instance.beforeUpdate = [];
    instance.updated = [];

    // Set current instance for composition API
    setCurrentInstance(instance);

    try {
        // Call setup with props and context
        const setupContext = createSetupContext(instance);
        const setupResult = options.setup.call(instance, instance.props || {}, setupContext);

        // Handle different return types
        if (typeof setupResult === 'function') {
            // If setup returns a function, use it as the render function
            instance.render = setupResult;
            return {};
        } else if (setupResult && typeof setupResult === 'object') {
            // If setup returns an object, merge it with the instance
            return setupResult;
        }

        return {};
    } finally {
        // Reset current instance
        setCurrentInstance(null);
    }
}

/**
 * Creates the context object for the setup function
 * @param {Object} instance - Component instance
 * @returns {Object} Setup context
 */
function createSetupContext(instance) {
    return {
        attrs: instance.attrs || {},
        slots: instance.slots || {},
        emit: (event, ...args) => {
            const handler = instance.props[`on${event[0].toUpperCase() + event.slice(1)}`];
            if (handler) {
                handler(...args);
            }
        },
        expose: (exposed) => {
            instance.exposed = exposed;
        }
    };
}

/**
 * Helper function to create DOM elements from virtual DOM
 */
function createDOMElement$1(vnode) {
    // Handle primitive values (string, number, etc.)
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return document.createTextNode(vnode);
    }

    // Handle null or undefined
    if (!vnode) {
        return document.createComment('empty node');
    }

    // Handle case where vnode might not be a proper virtual node object
    if (!vnode.tag) {
        console.warn('Invalid vnode:', vnode);
        return document.createComment('invalid node');
    }

    const element = document.createElement(vnode.tag);

    // Set attributes
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
        if (child !== null && child !== undefined) {
            element.appendChild(createDOMElement$1(child));
        }
    });

    return element;
}

function createComponent(options) {
    const instance = {};

    // Set options
    instance.$options = options;

    // Initialize props
    instance.props = options.props || {};

    // Call beforeCreate lifecycle hook
    if (options.beforeCreate) {
        options.beforeCreate.call(instance);
    }

    // Process setup function if it exists
    const setupResult = processSetup(instance, options);

    // Merge setup result with instance
    for (const key in setupResult) {
        instance[key] = setupResult[key];
    }

    // Initialize data
    if (options.data) {
        // Create data object
        instance.$data = options.data.call(instance);

        // Setup getters/setters for data properties
        for (const key in instance.$data) {
            // Skip if property already defined by setup
            if (key in setupResult) continue;

            Object.defineProperty(instance, key, {
                get() {
                    return instance.$data[key];
                },
                set(newValue) {
                    // Skip if value hasn't changed
                    if (instance.$data[key] === newValue) return;

                    // Store the new value
                    instance.$data[key] = newValue;

                    // Update component
                    if (instance.$el) {
                        // Call beforeUpdate hooks
                        if (options.beforeUpdate) {
                            options.beforeUpdate.call(instance);
                        }

                        // Call composition API beforeUpdate hooks
                        instance.beforeUpdate.forEach(hook => hook());

                        // Get new virtual DOM tree
                        const newVdom = instance.render();
                        const parentNode = instance.$el.parentNode;

                        // Update the DOM if parent exists
                        if (parentNode) {
                            // Update the contents of the element rather than replacing it
                            if (instance._vnode) {
                                // Clear the element first
                                while (instance.$el.firstChild) {
                                    instance.$el.removeChild(instance.$el.firstChild);
                                }
                                // Create and append the new DOM
                                const newElement = createDOMElement$1(newVdom);
                                instance.$el.appendChild(newElement);
                                instance._vnode = newVdom;
                            }
                        }

                        // Call updated hooks
                        if (options.updated) {
                            options.updated.call(instance);
                        }

                        // Call composition API updated hooks
                        instance.updated.forEach(hook => hook());
                    }
                }
            });
        }
    }

    // Initialize methods
    if (options.methods) {
        for (const key in options.methods) {
            // Skip if property already defined by setup
            if (key in setupResult) continue;

            instance[key] = options.methods[key].bind(instance);
        }
    }

    // Initialize computed properties
    if (options.computed) {
        for (const key in options.computed) {
            // Skip if property already defined by setup
            if (key in setupResult) continue;

            Object.defineProperty(instance, key, {
                get: options.computed[key].bind(instance)
            });
        }
    }

    // Store initial render result for future updates
    instance._vnode = null;

    // Add render method (if not already defined by setup)
    if (!instance.render) {
        instance.render = function () {
            return options.render ? options.render.call(instance) : null;
        };
    }

    // Mount method
    instance.$mount = function (el) {
        if (typeof el === 'string') {
            el = document.querySelector(el);
        }

        if (!el) {
            console.warn('Invalid mounting element');
            return this;
        }

        // Store reference to the mounting element
        this.$el = el;

        // Call lifecycle hook
        if (options.beforeMount) {
            options.beforeMount.call(instance);
        }

        // Render the component
        const vnode = this.render();
        this._vnode = vnode;

        // Clear the element before mounting
        el.innerHTML = '';

        // Create real DOM from virtual DOM and append to element
        const dom = createDOMElement$1(vnode);
        el.appendChild(dom);

        // Call mounted hooks
        if (options.mounted) {
            options.mounted.call(instance);
        }

        // Call composition API mounted hooks
        if (instance.mounted && Array.isArray(instance.mounted)) {
            instance.mounted.forEach(hook => hook());
        }

        return this;
    };

    // Add update functionality
    instance.$update = function () {
        if (!this.$el) {
            console.warn('Cannot update: component not mounted');
            return;
        }

        // Call beforeUpdate lifecycle hooks
        if (options.beforeUpdate) {
            options.beforeUpdate.call(instance);
        }

        // Call composition API beforeUpdate hooks
        if (instance.beforeUpdate && Array.isArray(instance.beforeUpdate)) {
            instance.beforeUpdate.forEach(hook => hook());
        }

        // Re-render and update the DOM
        const newVdom = this.render();

        if (this.$el) {
            // Clear the element first then append the new content
            while (this.$el.firstChild) {
                this.$el.removeChild(this.$el.firstChild);
            }

            // Create and append the new DOM
            const newElement = createDOMElement$1(newVdom);
            this.$el.appendChild(newElement);
            this._vnode = newVdom;
        }

        // Call updated lifecycle hooks
        if (options.updated) {
            options.updated.call(instance);
        }

        // Call composition API updated hooks
        if (instance.updated && Array.isArray(instance.updated)) {
            instance.updated.forEach(hook => hook());
        }
    };

    // Add unmount functionality
    instance.$unmount = function () {
        if (!this.$el) {
            return;
        }

        // Call beforeUnmount hook
        if (options.beforeUnmount) {
            options.beforeUnmount.call(instance);
        }

        // Remove element from DOM
        if (this.$el.parentNode) {
            this.$el.parentNode.removeChild(this.$el);
        }

        // Call unmounted hooks
        if (options.unmounted) {
            options.unmounted.call(instance);
        }

        // Call composition API unmounted hooks
        if (instance.unmounted && Array.isArray(instance.unmounted)) {
            instance.unmounted.forEach(hook => hook());
        }
    };

    // Call created lifecycle hook
    if (options.created) {
        options.created.call(instance);
    }

    return instance;
}

function defineComponent(options) {
    return function (props) {
        const instance = createComponent({
            ...options,
            props: props || {}
        });

        // Make props accessible directly
        for (const key in props) {
            if (key !== 'children') {
                Object.defineProperty(instance, key, {
                    get() { return props[key]; }
                });
            }
        }

        return instance.render();
    };
}

/**
 * Creates a new application instance
 * @param {Object|Function} component - Root component
 * @returns {Object} Application instance
 */
function createApp$1(component) {
    const app = {
        _component: typeof component === 'function' ? component() : component,
        _context: {},
        _plugins: new Set(),

        use(plugin, options = {}) {
            if (!this._plugins.has(plugin)) {
                if (plugin && typeof plugin.install === 'function') {
                    plugin.install(this, options);
                } else if (typeof plugin === 'function') {
                    plugin(this, options);
                }
                this._plugins.add(plugin);
            }
            return this;
        },

        provide(key, value) {
            this._context[key] = value;
            return this;
        },

        mount(selector) {
            const container = typeof selector === 'string'
                ? document.querySelector(selector)
                : selector;

            if (!container) {
                console.warn(`Target container ${selector} not found. Mounting failed.`);
                return;
            }

            // Clear container
            container.innerHTML = '';

            const instance = createComponent(this._component);

            // Inject app context and plugins
            instance.$app = this;
            instance.$options._context = this._context;

            // Mount the component
            instance.$mount(container);

            return instance;
        }
    };

    return app;
}

// @kalxjs/core - Lifecycle hooks for Composition API

/**
 * Runs a callback when the component is created
 * @param {Function} callback - Callback function
 */
function onCreated(callback) {
    const instance = getCurrentInstance$1();
    if (!instance.created) {
        instance.created = [];
    }
    instance.created.push(callback);
}

/**
 * Runs a callback before the component is mounted
 * @param {Function} callback - Callback function
 */
function onBeforeMount(callback) {
    const instance = getCurrentInstance$1();
    if (!instance.beforeMount) {
        instance.beforeMount = [];
    }
    instance.beforeMount.push(callback);
}

/**
 * Runs a callback before the component is unmounted
 * @param {Function} callback - Callback function
 */
function onBeforeUnmount(callback) {
    const instance = getCurrentInstance$1();
    if (!instance.beforeUnmount) {
        instance.beforeUnmount = [];
    }
    instance.beforeUnmount.push(callback);
}

/**
 * Runs a callback when an error occurs in the component
 * @param {Function} callback - Callback function
 */
function onErrorCaptured(callback) {
    const instance = getCurrentInstance$1();
    if (!instance.errorCaptured) {
        instance.errorCaptured = [];
    }
    instance.errorCaptured.push(callback);
}

// @kalxjs/core - Utility functions for Composition API

/**
 * Creates a reactive reference with a getter and setter
 * @param {any} initialValue - Initial value
 * @param {Function} getter - Custom getter function
 * @param {Function} setter - Custom setter function
 * @returns {Object} Reactive reference
 */
function customRef(factory) {
    const track = () => { };
    const trigger = () => { };

    const { get, set } = factory(track, trigger);

    return Object.defineProperty({}, 'value', {
        get,
        set
    });
}

/**
 * Creates a readonly reference
 * @param {Object} source - Source reference
 * @returns {Object} Readonly reference
 */
function readonly(source) {
    // Handle ref
    if (source && typeof source === 'object' && 'value' in source) {
        return Object.defineProperty({}, 'value', {
            get: () => source.value,
            set: () => {
                console.warn('Cannot set a readonly ref');
            }
        });
    }

    // Handle reactive object
    const handler = {
        get(target, key, receiver) {
            const result = Reflect.get(target, key, receiver);
            return result;
        },
        set() {
            console.warn('Cannot set a readonly reactive object');
            return true;
        },
        deleteProperty() {
            console.warn('Cannot delete from a readonly reactive object');
            return true;
        }
    };

    return new Proxy(source, handler);
}

/**
 * Creates a computed reference that can be both read and written
 * @param {Object} options - Options with get and set functions
 * @returns {Object} Computed reference
 */
function writableComputed(options) {
    const { get, set } = options;

    const computedRef = {
        get value() {
            return get();
        },
        set value(newValue) {
            set(newValue);
        }
    };

    return computedRef;
}

/**
 * Creates a reactive reference that is synchronized with localStorage
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {Object} Reactive reference
 */
function useLocalStorage(key, defaultValue) {
    // Get initial value from localStorage or use default
    const initialValue = (() => {
        if (typeof window === 'undefined') return defaultValue;

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    })();

    // Create a ref with the initial value
    const valueRef = ref$1(initialValue);

    // Watch for changes and update localStorage
    if (typeof window !== 'undefined') {
        effect(() => {
            try {
                window.localStorage.setItem(key, JSON.stringify(valueRef.value));
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        });
    }

    return valueRef;
}

/**
 * Creates a debounced version of a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function useDebounce(fn, delay) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

/**
 * Creates a throttled version of a function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
function useThrottle(fn, limit) {
    let inThrottle;

    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Creates a reactive reference that tracks mouse position
 * @returns {Object} Reactive mouse position
 */
function useMouse() {
    const position = reactive$1({
        x: 0,
        y: 0
    });

    const update = (event) => {
        position.x = event.clientX;
        position.y = event.clientY;
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('mousemove', update);

        // Clean up event listener when component is unmounted
        const instance = getCurrentInstance$1();
        if (instance) {
            if (!instance.unmounted) {
                instance.unmounted = [];
            }

            instance.unmounted.push(() => {
                window.removeEventListener('mousemove', update);
            });
        }
    }

    return position;
}

// @kalxjs/core - Plugin system

/**
 * Creates a plugin for KalxJS
 * @param {Object} options - Plugin options
 * @returns {Object} Plugin object
 */
function createPlugin(options) {
    const { name, install, version = '1.0.0' } = options;

    if (!name) {
        console.warn('Plugin name is required');
    }

    if (typeof install !== 'function') {
        console.warn('Plugin install method is required');
    }

    return {
        name,
        version,
        install
    };
}

/**
 * Plugin manager for KalxJS
 */
class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.app = null;
    }

    /**
     * Sets the application instance
     * @param {Object} app - Application instance
     */
    setApp(app) {
        this.app = app;
    }

    /**
     * Installs a plugin
     * @param {Object} plugin - Plugin object
     * @param {Object} options - Plugin options
     * @returns {PluginManager} Plugin manager instance for chaining
     */
    use(plugin, options = {}) {
        if (!plugin) {
            console.warn('Plugin is required');
            return this;
        }

        const { name } = plugin;

        // Skip if plugin is already installed
        if (name && this.plugins.has(name)) {
            console.warn(`Plugin "${name}" is already installed`);
            return this;
        }

        // Install the plugin
        if (typeof plugin.install === 'function') {
            plugin.install(this.app, options);
        } else if (typeof plugin === 'function') {
            plugin(this.app, options);
        } else {
            console.warn('Invalid plugin format');
            return this;
        }

        // Store the plugin
        if (name) {
            this.plugins.set(name, plugin);
        }

        return this;
    }

    /**
     * Checks if a plugin is installed
     * @param {string} name - Plugin name
     * @returns {boolean} Whether the plugin is installed
     */
    has(name) {
        return this.plugins.has(name);
    }

    /**
     * Gets a plugin by name
     * @param {string} name - Plugin name
     * @returns {Object} Plugin object
     */
    get(name) {
        return this.plugins.get(name);
    }

    /**
     * Uninstalls a plugin
     * @param {string} name - Plugin name
     * @returns {boolean} Whether the plugin was uninstalled
     */
    uninstall(name) {
        const plugin = this.plugins.get(name);

        if (!plugin) {
            console.warn(`Plugin "${name}" is not installed`);
            return false;
        }

        // Call uninstall method if it exists
        if (typeof plugin.uninstall === 'function') {
            plugin.uninstall(this.app);
        }

        // Remove the plugin
        return this.plugins.delete(name);
    }
}

// @kalxjs/core - Built-in state management

/**
 * Creates a store with state, getters, actions, and mutations
 * @param {Object} options - Store options
 * @returns {Object} Store instance
 */
function createStore(options = {}) {
    const {
        state = {},
        getters = {},
        actions = {},
        mutations = {},
        plugins = []
    } = options;

    // Create reactive state
    const storeState = reactive$1(typeof state === 'function' ? state() : state);

    // Store for computed getters
    const computedGetters = {};

    // Create store instance
    const store = {
        // State access via $state
        $state: storeState,

        // Direct state access (for convenience)
        get state() {
            return this.$state;
        },

        // Reset state to initial values
        $reset() {
            const initialState = typeof state === 'function' ? state() : state;
            Object.keys(initialState).forEach(key => {
                this.$state[key] = initialState[key];
            });
        },

        // Patch state (partial update)
        $patch(partialState) {
            if (typeof partialState === 'function') {
                partialState(this.$state);
            } else {
                Object.keys(partialState).forEach(key => {
                    this.$state[key] = partialState[key];
                });
            }
        },

        // Subscribe to state changes
        $subscribe(callback) {
            const unsubscribe = effect(() => {
                // This will track all state properties
                const stateSnapshot = JSON.parse(JSON.stringify(this.$state));
                callback(stateSnapshot);
            });

            return unsubscribe;
        },

        // Dispatch an action
        dispatch(type, payload) {
            if (!actions[type]) {
                console.warn(`[KalxJS Store] Action "${type}" does not exist`);
                return Promise.resolve();
            }

            try {
                const context = {
                    state: this.$state,
                    getters: this.getters,
                    dispatch: this.dispatch.bind(this),
                    commit: this.commit.bind(this)
                };

                return Promise.resolve(actions[type](context, payload));
            } catch (error) {
                return Promise.reject(error);
            }
        },

        // Commit a mutation
        commit(type, payload) {
            if (!mutations[type]) {
                console.warn(`[KalxJS Store] Mutation "${type}" does not exist`);
                return;
            }

            mutations[type](this.$state, payload);
        }
    };

    // Setup getters
    store.getters = {};
    Object.keys(getters).forEach(key => {
        // Create computed property for each getter
        computedGetters[key] = computed$1(() => {
            return getters[key](store.state, store.getters);
        });

        // Define getter on the store
        Object.defineProperty(store.getters, key, {
            get: () => computedGetters[key].value,
            enumerable: true
        });

        // Also define getter directly on the store for convenience
        Object.defineProperty(store, key, {
            get: () => store.getters[key],
            enumerable: true
        });
    });

    // Setup actions
    Object.keys(actions).forEach(key => {
        store[key] = (payload) => store.dispatch(key, payload);
    });

    // Setup mutations
    Object.keys(mutations).forEach(key => {
        store[`commit${key.charAt(0).toUpperCase() + key.slice(1)}`] = (payload) => {
            store.commit(key, payload);
        };
    });

    // Apply plugins
    plugins.forEach(plugin => plugin(store));

    return store;
}

/**
 * Creates a store module that can be used with createStore
 * @param {Object} options - Module options
 * @returns {Object} Module definition
 */
function createModule(options = {}) {
    const {
        namespaced = false,
        state = {},
        getters = {},
        actions = {},
        mutations = {},
        modules = {}
    } = options;

    return {
        namespaced,
        state,
        getters,
        actions,
        mutations,
        modules
    };
}

/**
 * Creates a plugin for the store
 * @param {Function} plugin - Plugin function
 * @returns {Function} Plugin function
 */
function createStorePlugin(plugin) {
    return plugin;
}

/**
 * Creates a persisted state plugin
 * @param {Object} options - Plugin options
 * @returns {Function} Plugin function
 */
function createPersistedState(options = {}) {
    const {
        key = 'kalxjs-store',
        paths = null,
        storage = localStorage,
        serialize = JSON.stringify,
        deserialize = JSON.parse
    } = options;

    return (store) => {
        // Load persisted state
        try {
            const persistedString = storage.getItem(key);
            if (persistedString) {
                const persistedState = deserialize(persistedString);

                if (persistedState) {
                    store.$patch(persistedState);
                }
            }
        } catch (err) {
            console.error('[KalxJS Store] Error loading persisted state:', err);
        }

        // Subscribe to changes
        store.$subscribe((state) => {
            try {
                // Filter state if paths are specified
                let stateToPersist = state;
                if (paths) {
                    stateToPersist = {};
                    paths.forEach(path => {
                        const pathParts = path.split('.');
                        let value = state;

                        for (const part of pathParts) {
                            value = value[part];
                            if (value === undefined) break;
                        }

                        if (value !== undefined) {
                            // Set nested value
                            let target = stateToPersist;
                            for (let i = 0; i < pathParts.length - 1; i++) {
                                const part = pathParts[i];
                                if (!target[part]) target[part] = {};
                                target = target[part];
                            }
                            target[pathParts[pathParts.length - 1]] = value;
                        }
                    });
                }

                // Persist state
                storage.setItem(key, serialize(stateToPersist));
            } catch (err) {
                console.error('[KalxJS Store] Error persisting state:', err);
            }
        });
    };
}

/**
 * Creates a store with composition API
 * @param {Object} options - Store options
 * @returns {Object} Composable store
 */
function defineStore(id, options) {
    // Allow both object-style and setup-style stores
    const useStore = () => {
        // For setup function style
        if (typeof options === 'function') {
            const setupStore = {};

            // Call setup function
            const setupResult = options();

            // Process setup result
            Object.keys(setupResult).forEach(key => {
                const result = setupResult[key];

                // Handle refs, computed, etc.
                if (result && typeof result === 'object' && 'value' in result) {
                    // For refs and computed
                    Object.defineProperty(setupStore, key, {
                        get: () => result.value,
                        set: (value) => { result.value = value; },
                        enumerable: true
                    });
                } else {
                    // For methods and other values
                    setupStore[key] = result;
                }
            });

            // Add $reset method if state is defined
            if (setupResult.$state) {
                setupStore.$reset = () => {
                    const initialState = setupResult.$state;
                    Object.keys(initialState).forEach(key => {
                        initialState[key].value = initialState[key]._initialValue;
                    });
                };
            }

            return setupStore;
        }

        // For options-style store
        const store = createStore({
            ...options,
            id
        });

        return store;
    };

    useStore.$id = id;

    return useStore;
}

// @kalxjs/core - Automatic API integration

/**
 * Default fetch implementation
 * @private
 */
const defaultFetch = async (url, options = {}) => {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }

    return response.text();
};

/**
 * Creates an API client with automatic reactive state
 * @param {Object} options - API client options
 * @returns {Object} API client
 */
function createApi(options = {}) {
    const {
        baseUrl = '',
        headers = {},
        fetchImplementation = defaultFetch,
        onRequest = null,
        onResponse = null,
        onError = null
    } = options;

    // Create reactive state for the API client
    const state = reactive$1({
        loading: false,
        error: null,
        data: null,
        status: null
    });

    // Create a cache for requests
    const cache = new Map();

    /**
     * Makes an API request
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise} Request promise
     */
    const request = async (url, options = {}) => {
        const {
            method = 'GET',
            body = null,
            params = null,
            headers: requestHeaders = {},
            cache: useCache = false,
            cacheTime = 60000, // 1 minute
            retry = 0,
            retryDelay = 1000,
            transform = null
        } = options;

        // Build full URL
        let fullUrl = `${baseUrl}${url}`;

        // Add query parameters
        if (params) {
            const queryParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    queryParams.append(key, params[key]);
                }
            });

            const queryString = queryParams.toString();
            if (queryString) {
                fullUrl += `?${queryString}`;
            }
        }

        // Create request options
        const fetchOptions = {
            method,
            headers: {
                ...headers,
                ...requestHeaders
            }
        };

        // Add body if present
        if (body) {
            if (body instanceof FormData) {
                fetchOptions.body = body;
            } else if (typeof body === 'object') {
                fetchOptions.body = JSON.stringify(body);
                fetchOptions.headers['Content-Type'] = 'application/json';
            } else {
                fetchOptions.body = body;
            }
        }

        // Check cache
        const cacheKey = `${method}:${fullUrl}:${JSON.stringify(fetchOptions.body || '')}`;
        if (useCache && method === 'GET') {
            const cachedResponse = cache.get(cacheKey);
            if (cachedResponse && Date.now() - cachedResponse.timestamp < cacheTime) {
                return cachedResponse.data;
            }
        }

        // Call onRequest hook
        if (onRequest) {
            const modifiedOptions = onRequest(fullUrl, fetchOptions);
            if (modifiedOptions) {
                fullUrl = modifiedOptions.url || fullUrl;
                Object.assign(fetchOptions, modifiedOptions.options || {});
            }
        }

        // Update state
        state.loading = true;
        state.error = null;

        // Make the request
        let response;
        let error;
        let retries = 0;

        while (retries <= retry) {
            try {
                response = await fetchImplementation(fullUrl, fetchOptions);
                break;
            } catch (err) {
                error = err;

                if (retries === retry) {
                    break;
                }

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retries++;
            }
        }

        // Handle error
        if (error) {
            state.loading = false;
            state.error = error;
            state.status = 'error';

            // Call onError hook
            if (onError) {
                onError(error, { url: fullUrl, options: fetchOptions });
            }

            throw error;
        }

        // Transform response if needed
        if (transform) {
            response = transform(response);
        }

        // Update state
        state.loading = false;
        state.data = response;
        state.status = 'success';

        // Call onResponse hook
        if (onResponse) {
            response = onResponse(response, { url: fullUrl, options: fetchOptions }) || response;
        }

        // Cache the response
        if (useCache && method === 'GET') {
            cache.set(cacheKey, {
                data: response,
                timestamp: Date.now()
            });
        }

        return response;
    };

    /**
     * Clears the cache
     * @param {string} url - Optional URL to clear from cache
     */
    const clearCache = (url = null) => {
        if (url) {
            // Clear specific URL from cache
            const urlPattern = `${baseUrl}${url}`;

            for (const key of cache.keys()) {
                if (key.includes(urlPattern)) {
                    cache.delete(key);
                }
            }
        } else {
            // Clear entire cache
            cache.clear();
        }
    };

    // Create convenience methods for common HTTP methods
    const get = (url, options = {}) => request(url, { ...options, method: 'GET' });
    const post = (url, data, options = {}) => request(url, { ...options, method: 'POST', body: data });
    const put = (url, data, options = {}) => request(url, { ...options, method: 'PUT', body: data });
    const patch = (url, data, options = {}) => request(url, { ...options, method: 'PATCH', body: data });
    const del = (url, options = {}) => request(url, { ...options, method: 'DELETE' });

    return {
        state,
        request,
        get,
        post,
        put,
        patch,
        delete: del,
        clearCache
    };
}

/**
 * Creates a composable API endpoint
 * @param {string} url - Endpoint URL
 * @param {Object} options - Endpoint options
 * @returns {Function} Composable endpoint
 */
function useApi(url, options = {}) {
    const {
        method = 'GET',
        immediate = false,
        initialData = null,
        transform = null,
        onSuccess = null,
        onError = null,
        ...requestOptions
    } = options;

    // Create reactive state
    const data = ref$1(initialData);
    const loading = ref$1(false);
    const error = ref$1(null);
    const status = ref$1(null);

    // Create the request function
    const execute = async (payload = null, overrideOptions = {}) => {
        loading.value = true;
        error.value = null;
        status.value = 'loading';

        try {
            // Determine which API method to use
            const api = window.$kalxjs && window.$kalxjs.api;

            if (!api) {
                throw new Error('KalxJS API client not found. Make sure to use the API plugin.');
            }

            // Prepare request options
            const finalOptions = {
                ...requestOptions,
                ...overrideOptions
            };

            // Make the request
            let response;

            switch (method.toUpperCase()) {
                case 'GET':
                    response = await api.get(url, finalOptions);
                    break;
                case 'POST':
                    response = await api.post(url, payload, finalOptions);
                    break;
                case 'PUT':
                    response = await api.put(url, payload, finalOptions);
                    break;
                case 'PATCH':
                    response = await api.patch(url, payload, finalOptions);
                    break;
                case 'DELETE':
                    response = await api.delete(url, finalOptions);
                    break;
                default:
                    response = await api.request(url, {
                        ...finalOptions,
                        method,
                        body: payload
                    });
            }

            // Transform response if needed
            if (transform) {
                response = transform(response);
            }

            // Update state
            data.value = response;
            status.value = 'success';

            // Call onSuccess hook
            if (onSuccess) {
                onSuccess(response);
            }

            return response;
        } catch (err) {
            // Update error state
            error.value = err;
            status.value = 'error';

            // Call onError hook
            if (onError) {
                onError(err);
            }

            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Execute immediately if requested
    if (immediate) {
        execute();
    }

    return {
        data,
        loading,
        error,
        status,
        execute
    };
}

/**
 * Creates an API plugin for KalxJS
 * @param {Object} options - API plugin options
 * @returns {Object} API plugin
 */
function createApiPlugin(options = {}) {
    return {
        name: 'api',
        install(app) {
            // Create API client
            const api = createApi(options);

            // Add API client to the app
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};
            app.config.globalProperties.$api = api;

            // Add API client to the window for useApi
            if (typeof window !== 'undefined') {
                window.$kalxjs = window.$kalxjs || {};
                window.$kalxjs.api = api;
            }

            // Add useApi to the app
            app.useApi = useApi;
        }
    };
}

// @kalxjs/core - Performance optimizations

/**
 * Memoizes a function to cache its results
 * @param {Function} fn - Function to memoize
 * @param {Function} keyFn - Function to generate cache key
 * @returns {Function} Memoized function
 */
function memoize(fn, keyFn = JSON.stringify) {
    const cache = new Map();

    return function (...args) {
        const key = keyFn(args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn.apply(this, args);
        cache.set(key, result);

        return result;
    };
}

/**
 * Creates a component that only re-renders when its props change
 * @param {Object} component - Component definition
 * @returns {Object} Memoized component
 */
function memo(component) {
    // Add a custom shouldUpdate function
    const originalSetup = component.setup;

    component.setup = function (props, context) {
        // Store previous props
        let prevProps = JSON.stringify(props);

        // Add shouldUpdate method
        context.shouldUpdate = (newProps) => {
            const newPropsStr = JSON.stringify(newProps);
            const shouldUpdate = prevProps !== newPropsStr;

            // Update previous props
            prevProps = newPropsStr;

            return shouldUpdate;
        };

        // Call original setup
        return originalSetup.call(this, props, context);
    };

    return component;
}

/**
 * Creates a lazy-loaded component
 * @param {Function} factory - Factory function that returns a component
 * @returns {Object} Lazy-loaded component
 */
function lazy(factory) {
    let component = null;
    let loading = false;
    let error = null;

    // Create a placeholder component
    return {
        name: 'LazyComponent',
        setup(props, context) {
            // Load the component if not already loaded
            if (!component && !loading) {
                loading = true;

                factory()
                    .then(comp => {
                        component = comp;
                        loading = false;
                    })
                    .catch(err => {
                        error = err;
                        loading = false;
                        console.error('Failed to load lazy component:', err);
                    });
            }

            return () => {
                if (component) {
                    // Render the loaded component
                    return h(component, props, context.slots);
                } else if (error) {
                    // Render error state
                    return h('div', { class: 'lazy-error' }, [
                        'Failed to load component: ' + error.message
                    ]);
                } else {
                    // Render loading state
                    return h('div', { class: 'lazy-loading' }, [
                        'Loading...'
                    ]);
                }
            };
        }
    };
}

/**
 * Creates a component that only renders when visible in the viewport
 * @param {Object} component - Component definition
 * @param {Object} options - Options for the intersection observer
 * @returns {Object} Deferred component
 */
function deferRender(component, options = {}) {
    const {
        root = null,
        rootMargin = '0px',
        threshold = 0,
        once = true
    } = options;

    return {
        name: 'DeferredComponent',
        setup(props, context) {
            const visible = ref(false);
            const containerRef = ref(null);

            onMounted(() => {
                if (!containerRef.value) return;

                const observer = new IntersectionObserver(
                    (entries) => {
                        const entry = entries[0];

                        if (entry.isIntersecting) {
                            visible.value = true;

                            if (once) {
                                observer.disconnect();
                            }
                        } else if (!once) {
                            visible.value = false;
                        }
                    },
                    { root, rootMargin, threshold }
                );

                observer.observe(containerRef.value);

                onUnmounted(() => {
                    observer.disconnect();
                });
            });

            return () => {
                return h('div', { ref: containerRef }, [
                    visible.value
                        ? h(component, props, context.slots)
                        : h('div', { class: 'deferred-placeholder', style: 'min-height: 20px;' })
                ]);
            };
        }
    };
}

/**
 * Creates a virtualized list component
 * @param {Object} options - Virtualized list options
 * @returns {Object} Virtualized list component
 */
function createVirtualList(options = {}) {
    const {
        itemHeight = 50,
        overscan = 5,
        getKey = (item, index) => index
    } = options;

    return {
        name: 'VirtualList',
        props: {
            items: {
                type: Array,
                required: true
            },
            renderItem: {
                type: Function,
                required: true
            }
        },
        setup(props) {
            const containerRef = ref(null);
            const scrollTop = ref(0);
            const containerHeight = ref(0);

            // Calculate visible items
            const visibleItems = computed(() => {
                if (!props.items.length) return [];

                props.items.length * itemHeight;
                const startIndex = Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan);
                const endIndex = Math.min(
                    props.items.length - 1,
                    Math.ceil((scrollTop.value + containerHeight.value) / itemHeight) + overscan
                );

                const items = [];

                for (let i = startIndex; i <= endIndex; i++) {
                    items.push({
                        index: i,
                        item: props.items[i],
                        style: {
                            position: 'absolute',
                            top: `${i * itemHeight}px`,
                            height: `${itemHeight}px`,
                            left: 0,
                            right: 0
                        }
                    });
                }

                return items;
            });

            // Handle scroll events
            const handleScroll = () => {
                if (containerRef.value) {
                    scrollTop.value = containerRef.value.scrollTop;
                }
            };

            // Update container height on resize
            const updateContainerHeight = () => {
                if (containerRef.value) {
                    containerHeight.value = containerRef.value.clientHeight;
                }
            };

            onMounted(() => {
                updateContainerHeight();

                if (containerRef.value) {
                    containerRef.value.addEventListener('scroll', handleScroll);

                    const resizeObserver = new ResizeObserver(updateContainerHeight);
                    resizeObserver.observe(containerRef.value);

                    onUnmounted(() => {
                        containerRef.value.removeEventListener('scroll', handleScroll);
                        resizeObserver.disconnect();
                    });
                }
            });

            return () => {
                const totalHeight = props.items.length * itemHeight;

                return h('div', {
                    ref: containerRef,
                    style: {
                        height: '100%',
                        overflow: 'auto',
                        position: 'relative'
                    }
                }, [
                    h('div', {
                        style: {
                            height: `${totalHeight}px`,
                            position: 'relative'
                        }
                    },
                        visibleItems.value.map(({ index, item, style }) => {
                            return h('div', {
                                key: getKey(item, index),
                                style
                            }, [props.renderItem(item, index)]);
                        }))
                ]);
            };
        }
    };
}

/**
 * Creates a performance plugin for KalxJS
 * @returns {Object} Performance plugin
 */
function createPerformancePlugin() {
    return {
        name: 'performance',
        install(app) {
            // Add performance utilities to the app
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};

            app.config.globalProperties.$perf = {
                memoize,
                memo,
                lazy,
                deferRender,
                createVirtualList
            };

            // Add performance utilities to the app
            app.memoize = memoize;
            app.memo = memo;
            app.lazy = lazy;
            app.deferRender = deferRender;
            app.createVirtualList = createVirtualList;
        }
    };
}

// @kalxjs/core - AI-powered components

/**
 * AI Model types supported by KalxJS
 */
const AI_MODEL_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    AUDIO: 'audio',
    VIDEO: 'video',
    MULTIMODAL: 'multimodal'
};

/**
 * Default AI providers configuration
 */
const DEFAULT_PROVIDERS = {
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        models: {
            [AI_MODEL_TYPES.TEXT]: ['gpt-3.5-turbo', 'gpt-4'],
            [AI_MODEL_TYPES.IMAGE]: ['dall-e-3'],
            [AI_MODEL_TYPES.AUDIO]: ['whisper-1'],
            [AI_MODEL_TYPES.MULTIMODAL]: ['gpt-4-vision']
        }
    },
    anthropic: {
        baseUrl: 'https://api.anthropic.com/v1',
        models: {
            [AI_MODEL_TYPES.TEXT]: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
        }
    },
    huggingface: {
        baseUrl: 'https://api-inference.huggingface.co/models',
        models: {
            [AI_MODEL_TYPES.TEXT]: ['mistralai/Mistral-7B-Instruct-v0.2'],
            [AI_MODEL_TYPES.IMAGE]: ['stabilityai/stable-diffusion-xl-base-1.0'],
            [AI_MODEL_TYPES.AUDIO]: ['openai/whisper-large-v3']
        }
    },
    local: {
        baseUrl: 'http://localhost:11434/api',
        models: {
            [AI_MODEL_TYPES.TEXT]: ['llama3', 'mistral']
        }
    }
};

/**
 * Creates an AI manager for KalxJS
 * @param {Object} options - AI manager options
 * @returns {Object} AI manager
 */
function createAIManager(options = {}) {
    const {
        providers = DEFAULT_PROVIDERS,
        defaultProvider = 'openai',
        apiKeys = {},
        cache = true,
        cacheSize = 100,
        debug = false
    } = options;

    // Cache for AI responses
    const responseCache = new Map();

    // Active AI sessions
    const activeSessions = new Map();

    /**
     * Logs debug information if debug mode is enabled
     * @param {string} message - Debug message
     * @param {any} data - Additional data to log
     */
    const logDebug = (message, data) => {
        if (debug) {
            console.log(`[KalxJS AI] ${message}`, data);
        }
    };

    /**
     * Generates a cache key for a request
     * @param {Object} params - Request parameters
     * @returns {string} Cache key
     */
    const generateCacheKey = (params) => {
        return JSON.stringify({
            provider: params.provider,
            model: params.model,
            prompt: params.prompt,
            options: params.options
        });
    };

    /**
     * Gets a response from the cache
     * @param {Object} params - Request parameters
     * @returns {any} Cached response or null
     */
    const getCachedResponse = (params) => {
        if (!cache) return null;

        const cacheKey = generateCacheKey(params);
        return responseCache.get(cacheKey) || null;
    };

    /**
     * Caches a response
     * @param {Object} params - Request parameters
     * @param {any} response - Response to cache
     */
    const cacheResponse = (params, response) => {
        if (!cache) return;

        const cacheKey = generateCacheKey(params);

        // Implement LRU cache behavior
        if (responseCache.size >= cacheSize) {
            const firstKey = responseCache.keys().next().value;
            responseCache.delete(firstKey);
        }

        responseCache.set(cacheKey, response);
    };

    /**
     * Gets the API key for a provider
     * @param {string} provider - Provider name
     * @returns {string} API key
     */
    const getApiKey = (provider) => {
        return apiKeys[provider] || '';
    };

    /**
     * Gets the base URL for a provider
     * @param {string} provider - Provider name
     * @returns {string} Base URL
     */
    const getBaseUrl = (provider) => {
        return providers[provider]?.baseUrl || '';
    };

    /**
     * Gets available models for a provider and type
     * @param {string} provider - Provider name
     * @param {string} type - Model type
     * @returns {Array} Available models
     */
    const getAvailableModels = (provider, type) => {
        return providers[provider]?.models[type] || [];
    };

    /**
     * Generates text using an AI model
     * @param {Object} params - Generation parameters
     * @returns {Promise} Generation promise
     */
    const generateText = async (params) => {
        const {
            prompt,
            provider = defaultProvider,
            model = providers[provider]?.models[AI_MODEL_TYPES.TEXT][0],
            options = {},
            stream = false,
            onProgress = null
        } = params;

        // Check cache first
        const cachedResponse = getCachedResponse({
            provider,
            model,
            prompt,
            options
        });

        if (cachedResponse && !stream) {
            logDebug('Using cached response', { provider, model, prompt });
            return cachedResponse;
        }

        // Prepare request based on provider
        let requestUrl, requestBody, requestHeaders;

        switch (provider) {
            case 'openai':
                requestUrl = `${getBaseUrl(provider)}/chat/completions`;
                requestBody = {
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    stream,
                    ...options
                };
                requestHeaders = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getApiKey(provider)}`
                };
                break;

            case 'anthropic':
                requestUrl = `${getBaseUrl(provider)}/messages`;
                requestBody = {
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    stream,
                    ...options
                };
                requestHeaders = {
                    'Content-Type': 'application/json',
                    'x-api-key': getApiKey(provider),
                    'anthropic-version': '2023-06-01'
                };
                break;

            case 'huggingface':
                requestUrl = `${getBaseUrl(provider)}/${model}`;
                requestBody = {
                    inputs: prompt,
                    ...options
                };
                requestHeaders = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getApiKey(provider)}`
                };
                break;

            case 'local':
                requestUrl = `${getBaseUrl(provider)}/generate`;
                requestBody = {
                    model,
                    prompt,
                    stream,
                    ...options
                };
                requestHeaders = {
                    'Content-Type': 'application/json'
                };
                break;

            default:
                throw new Error(`Unsupported AI provider: ${provider}`);
        }

        logDebug('Generating text', { provider, model, prompt });

        // Handle streaming responses
        if (stream && onProgress) {
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullResponse = '';

            // Create a session ID for this stream
            const sessionId = Date.now().toString();
            activeSessions.set(sessionId, { reader, controller: new AbortController() });

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });

                    // Process the buffer based on provider format
                    let chunks;

                    switch (provider) {
                        case 'openai':
                            chunks = buffer.split('data: ').filter(chunk => chunk.trim() !== '' && chunk !== '[DONE]');
                            buffer = chunks.pop() || '';

                            for (const chunk of chunks) {
                                try {
                                    const data = JSON.parse(chunk);
                                    const content = data.choices[0]?.delta?.content || '';
                                    fullResponse += content;
                                    onProgress(content, fullResponse);
                                } catch (e) {
                                    // Ignore parsing errors in chunks
                                }
                            }
                            break;

                        case 'anthropic':
                            chunks = buffer.split('\n\n').filter(chunk => chunk.trim() !== '');
                            buffer = chunks.pop() || '';

                            for (const chunk of chunks) {
                                if (chunk.startsWith('event: content_block_delta')) {
                                    try {
                                        const dataLine = chunk.split('\n').find(line => line.startsWith('data: '));
                                        if (dataLine) {
                                            const data = JSON.parse(dataLine.slice(6));
                                            const content = data.delta?.text || '';
                                            fullResponse += content;
                                            onProgress(content, fullResponse);
                                        }
                                    } catch (e) {
                                        // Ignore parsing errors in chunks
                                    }
                                }
                            }
                            break;

                        case 'local':
                            chunks = buffer.split('\n').filter(chunk => chunk.trim() !== '');
                            buffer = chunks.pop() || '';

                            for (const chunk of chunks) {
                                try {
                                    const data = JSON.parse(chunk);
                                    const content = data.response || '';
                                    fullResponse += content;
                                    onProgress(content, fullResponse);
                                } catch (e) {
                                    // Ignore parsing errors in chunks
                                }
                            }
                            break;

                        default:
                            // For providers without streaming support
                            fullResponse = buffer;
                            onProgress(buffer, buffer);
                            buffer = '';
                    }
                }

                // Cache the full response
                cacheResponse({
                    provider,
                    model,
                    prompt,
                    options
                }, fullResponse);

                return fullResponse;
            } finally {
                activeSessions.delete(sessionId);
            }
        } else {
            // Non-streaming request
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Extract text based on provider
            let result;

            switch (provider) {
                case 'openai':
                    result = data.choices[0]?.message?.content || '';
                    break;

                case 'anthropic':
                    result = data.content[0]?.text || '';
                    break;

                case 'huggingface':
                    result = data[0]?.generated_text || data.generated_text || '';
                    break;

                case 'local':
                    result = data.response || '';
                    break;

                default:
                    result = JSON.stringify(data);
            }

            // Cache the response
            cacheResponse({
                provider,
                model,
                prompt,
                options
            }, result);

            return result;
        }
    };

    /**
     * Generates an image using an AI model
     * @param {Object} params - Generation parameters
     * @returns {Promise} Generation promise
     */
    const generateImage = async (params) => {
        const {
            prompt,
            provider = defaultProvider,
            model = providers[provider]?.models[AI_MODEL_TYPES.IMAGE][0],
            options = {}
        } = params;

        // Check cache first
        const cachedResponse = getCachedResponse({
            provider,
            model,
            prompt,
            options
        });

        if (cachedResponse) {
            logDebug('Using cached response', { provider, model, prompt });
            return cachedResponse;
        }

        // Prepare request based on provider
        let requestUrl, requestBody, requestHeaders;

        switch (provider) {
            case 'openai':
                requestUrl = `${getBaseUrl(provider)}/images/generations`;
                requestBody = {
                    model,
                    prompt,
                    n: options.n || 1,
                    size: options.size || '1024x1024',
                    ...options
                };
                requestHeaders = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getApiKey(provider)}`
                };
                break;

            case 'huggingface':
                requestUrl = `${getBaseUrl(provider)}/${model}`;
                requestBody = {
                    inputs: prompt,
                    ...options
                };
                requestHeaders = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getApiKey(provider)}`
                };
                break;

            default:
                throw new Error(`Unsupported AI provider for image generation: ${provider}`);
        }

        logDebug('Generating image', { provider, model, prompt });

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Extract image URL based on provider
        let result;

        switch (provider) {
            case 'openai':
                result = data.data[0]?.url || '';
                break;

            case 'huggingface':
                // For Hugging Face, we get base64 image data
                result = `data:image/jpeg;base64,${data.output}`;
                break;

            default:
                result = '';
        }

        // Cache the response
        cacheResponse({
            provider,
            model,
            prompt,
            options
        }, result);

        return result;
    };

    /**
     * Transcribes audio using an AI model
     * @param {Object} params - Transcription parameters
     * @returns {Promise} Transcription promise
     */
    const transcribeAudio = async (params) => {
        const {
            audioData,
            provider = defaultProvider,
            model = providers[provider]?.models[AI_MODEL_TYPES.AUDIO][0],
            options = {}
        } = params;

        // Audio data can't be cached effectively by content

        // Prepare request based on provider
        let requestUrl, requestBody, requestHeaders;

        switch (provider) {
            case 'openai':
                requestUrl = `${getBaseUrl(provider)}/audio/transcriptions`;

                // Create form data
                const formData = new FormData();
                formData.append('model', model);

                // Handle different audio data formats
                if (audioData instanceof Blob) {
                    formData.append('file', audioData, 'audio.webm');
                } else if (audioData instanceof File) {
                    formData.append('file', audioData);
                } else if (typeof audioData === 'string' && audioData.startsWith('data:')) {
                    // Handle base64 data URL
                    const blob = await fetch(audioData).then(r => r.blob());
                    formData.append('file', blob, 'audio.webm');
                } else {
                    throw new Error('Unsupported audio data format');
                }

                // Add additional options
                Object.entries(options).forEach(([key, value]) => {
                    formData.append(key, value);
                });

                requestBody = formData;
                requestHeaders = {
                    'Authorization': `Bearer ${getApiKey(provider)}`
                };
                break;

            case 'huggingface':
                requestUrl = `${getBaseUrl(provider)}/${model}`;

                // Convert audio to appropriate format
                let audioBlob;
                if (audioData instanceof Blob || audioData instanceof File) {
                    audioBlob = audioData;
                } else if (typeof audioData === 'string' && audioData.startsWith('data:')) {
                    audioBlob = await fetch(audioData).then(r => r.blob());
                } else {
                    throw new Error('Unsupported audio data format');
                }

                requestBody = audioBlob;
                requestHeaders = {
                    'Authorization': `Bearer ${getApiKey(provider)}`
                };
                break;

            default:
                throw new Error(`Unsupported AI provider for audio transcription: ${provider}`);
        }

        logDebug('Transcribing audio', { provider, model });

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: requestHeaders,
            body: requestBody
        });

        if (!response.ok) {
            throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Extract transcription based on provider
        let result;

        switch (provider) {
            case 'openai':
                result = data.text || '';
                break;

            case 'huggingface':
                result = data.text || data.output || '';
                break;

            default:
                result = '';
        }

        return result;
    };

    /**
     * Cancels an active AI session
     * @param {string} sessionId - Session ID to cancel
     */
    const cancelSession = (sessionId) => {
        const session = activeSessions.get(sessionId);

        if (session) {
            if (session.controller) {
                session.controller.abort();
            }

            if (session.reader) {
                try {
                    session.reader.cancel();
                } catch (e) {
                    // Ignore errors when canceling
                }
            }

            activeSessions.delete(sessionId);
            logDebug('Cancelled AI session', { sessionId });
        }
    };

    /**
     * Clears the response cache
     */
    const clearCache = () => {
        responseCache.clear();
        logDebug('Cleared AI response cache');
    };

    return {
        generateText,
        generateImage,
        transcribeAudio,
        cancelSession,
        clearCache,
        getAvailableModels,
        getApiKey,
        setApiKey: (provider, key) => {
            apiKeys[provider] = key;
        }
    };
}

/**
 * Creates a composable for using AI in components
 * @param {Object} options - AI options
 * @returns {Object} AI composable
 */
function useAI(options = {}) {
    const instance = getCurrentInstance();

    if (!instance) {
        console.warn('[KalxJS AI] useAI() must be called within setup()');
        return null;
    }

    const aiManager = instance.appContext.config.globalProperties.$ai ||
        window.$kalxjs?.ai ||
        createAIManager(options);

    const loading = ref(false);
    const error = ref(null);
    const result = ref(null);

    /**
     * Generates text using an AI model
     * @param {Object} params - Generation parameters
     * @returns {Promise} Generation promise
     */
    const generateText = async (params) => {
        loading.value = true;
        error.value = null;

        try {
            result.value = await aiManager.generateText(params);
            return result.value;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Generates an image using an AI model
     * @param {Object} params - Generation parameters
     * @returns {Promise} Generation promise
     */
    const generateImage = async (params) => {
        loading.value = true;
        error.value = null;

        try {
            result.value = await aiManager.generateImage(params);
            return result.value;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Transcribes audio using an AI model
     * @param {Object} params - Transcription parameters
     * @returns {Promise} Transcription promise
     */
    const transcribeAudio = async (params) => {
        loading.value = true;
        error.value = null;

        try {
            result.value = await aiManager.transcribeAudio(params);
            return result.value;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    return {
        loading,
        error,
        result,
        generateText,
        generateImage,
        transcribeAudio,
        getAvailableModels: aiManager.getAvailableModels
    };
}

/**
 * Creates an AI plugin for KalxJS
 * @param {Object} options - AI plugin options
 * @returns {Object} AI plugin
 */
function createAIPlugin(options = {}) {
    return {
        name: 'ai',
        install(app) {
            // Create AI manager
            const aiManager = createAIManager(options);

            // Add AI manager to the app
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};
            app.config.globalProperties.$ai = aiManager;

            // Add AI manager to the window for useAI
            if (typeof window !== 'undefined') {
                window.$kalxjs = window.$kalxjs || {};
                window.$kalxjs.ai = aiManager;
            }

            // Add useAI to the app
            app.useAI = useAI;

            // Register AI components
            app.component('AITextGenerator', {
                props: {
                    provider: {
                        type: String,
                        default: options.defaultProvider || 'openai'
                    },
                    model: String,
                    prompt: String,
                    options: {
                        type: Object,
                        default: () => ({})
                    },
                    stream: {
                        type: Boolean,
                        default: false
                    },
                    autoGenerate: {
                        type: Boolean,
                        default: false
                    }
                },
                setup(props, { slots, emit }) {
                    const ai = useAI();
                    const generatedText = ref('');
                    const isGenerating = ref(false);
                    const error = ref(null);

                    const generate = async () => {
                        if (isGenerating.value || !props.prompt) return;

                        isGenerating.value = true;
                        error.value = null;
                        generatedText.value = '';

                        try {
                            if (props.stream) {
                                await ai.generateText({
                                    prompt: props.prompt,
                                    provider: props.provider,
                                    model: props.model,
                                    options: props.options,
                                    stream: true,
                                    onProgress: (chunk, fullText) => {
                                        generatedText.value = fullText;
                                        emit('progress', chunk, fullText);
                                    }
                                });
                            } else {
                                const result = await ai.generateText({
                                    prompt: props.prompt,
                                    provider: props.provider,
                                    model: props.model,
                                    options: props.options
                                });

                                generatedText.value = result;
                            }

                            emit('complete', generatedText.value);
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        } finally {
                            isGenerating.value = false;
                        }
                    };

                    // Auto-generate if enabled
                    watch(() => props.prompt, (newPrompt) => {
                        if (props.autoGenerate && newPrompt) {
                            generate();
                        }
                    }, { immediate: props.autoGenerate });

                    return () => {
                        // Default slot with state
                        if (slots.default) {
                            return slots.default({
                                text: generatedText.value,
                                loading: isGenerating.value,
                                error: error.value,
                                generate
                            });
                        }

                        // Default rendering
                        return h('div', { class: 'ai-text-generator' }, [
                            error.value ? h('div', { class: 'ai-error' }, [error.value]) : null,
                            isGenerating.value ? h('div', { class: 'ai-loading' }, ['Generating...']) : null,
                            generatedText.value ? h('div', { class: 'ai-result' }, [generatedText.value]) : null,
                            h('button', {
                                class: 'ai-generate-button',
                                onClick: generate,
                                disabled: isGenerating.value || !props.prompt
                            }, ['Generate'])
                        ]);
                    };
                }
            });

            app.component('AIImageGenerator', {
                props: {
                    provider: {
                        type: String,
                        default: options.defaultProvider || 'openai'
                    },
                    model: String,
                    prompt: String,
                    options: {
                        type: Object,
                        default: () => ({})
                    },
                    autoGenerate: {
                        type: Boolean,
                        default: false
                    }
                },
                setup(props, { slots, emit }) {
                    const ai = useAI();
                    const imageUrl = ref('');
                    const isGenerating = ref(false);
                    const error = ref(null);

                    const generate = async () => {
                        if (isGenerating.value || !props.prompt) return;

                        isGenerating.value = true;
                        error.value = null;

                        try {
                            const result = await ai.generateImage({
                                prompt: props.prompt,
                                provider: props.provider,
                                model: props.model,
                                options: props.options
                            });

                            imageUrl.value = result;
                            emit('complete', result);
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        } finally {
                            isGenerating.value = false;
                        }
                    };

                    // Auto-generate if enabled
                    watch(() => props.prompt, (newPrompt) => {
                        if (props.autoGenerate && newPrompt) {
                            generate();
                        }
                    }, { immediate: props.autoGenerate });

                    return () => {
                        // Default slot with state
                        if (slots.default) {
                            return slots.default({
                                imageUrl: imageUrl.value,
                                loading: isGenerating.value,
                                error: error.value,
                                generate
                            });
                        }

                        // Default rendering
                        return h('div', { class: 'ai-image-generator' }, [
                            error.value ? h('div', { class: 'ai-error' }, [error.value]) : null,
                            isGenerating.value ? h('div', { class: 'ai-loading' }, ['Generating...']) : null,
                            imageUrl.value ? h('img', { class: 'ai-result', src: imageUrl.value, alt: props.prompt }) : null,
                            h('button', {
                                class: 'ai-generate-button',
                                onClick: generate,
                                disabled: isGenerating.value || !props.prompt
                            }, ['Generate Image'])
                        ]);
                    };
                }
            });
        }
    };
}

// @kalxjs/core - Native mobile bridge

/**
 * Native platform types
 */
const NATIVE_PLATFORMS = {
    IOS: 'ios',
    ANDROID: 'android',
    WEB: 'web'
};

/**
 * Native feature capabilities
 */
const NATIVE_FEATURES = {
    CAMERA: 'camera',
    LOCATION: 'location',
    NOTIFICATIONS: 'notifications',
    STORAGE: 'storage',
    BIOMETRICS: 'biometrics',
    CONTACTS: 'contacts',
    CALENDAR: 'calendar',
    ACCELEROMETER: 'accelerometer',
    GYROSCOPE: 'gyroscope',
    BLUETOOTH: 'bluetooth',
    NFC: 'nfc',
    HAPTICS: 'haptics',
    SHARE: 'share',
    NETWORK: 'network',
    BATTERY: 'battery',
    DEVICE_INFO: 'deviceInfo',
    APP_INFO: 'appInfo',
    FILE_SYSTEM: 'fileSystem',
    MEDIA: 'media',
    SPEECH: 'speech',
    BARCODE: 'barcode',
    AR: 'ar',
    HEALTH_KIT: 'healthKit',
    GOOGLE_FIT: 'googleFit'
};

/**
 * Detects the current native platform
 * @returns {string} Platform type
 */
function detectPlatform() {
    if (typeof window === 'undefined') {
        return NATIVE_PLATFORMS.WEB;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
        return NATIVE_PLATFORMS.IOS;
    } else if (/android/.test(userAgent)) {
        return NATIVE_PLATFORMS.ANDROID;
    }

    return NATIVE_PLATFORMS.WEB;
}

/**
 * Creates a native bridge for KalxJS
 * @param {Object} options - Native bridge options
 * @returns {Object} Native bridge
 */
function createNativeBridge(options = {}) {
    const {
        debug = false,
        mockMode = false,
        mockImplementations = {},
        customBridge = null
    } = options;

    // Detect platform
    const platform = options.platform || detectPlatform();

    // Available features
    const availableFeatures = new Set();

    // Native bridge implementations
    const nativeBridgeImpl = customBridge || {};

    // Mock implementations for testing
    const mockImpl = {
        ...mockImplementations
    };

    /**
     * Logs debug information if debug mode is enabled
     * @param {string} message - Debug message
     * @param {any} data - Additional data to log
     */
    const logDebug = (message, data) => {
        if (debug) {
            console.log(`[KalxJS Native] ${message}`, data);
        }
    };

    /**
     * Checks if a feature is available
     * @param {string} feature - Feature to check
     * @returns {boolean} Whether the feature is available
     */
    const isFeatureAvailable = (feature) => {
        return availableFeatures.has(feature);
    };

    /**
     * Calls a native method
     * @param {string} feature - Feature to use
     * @param {string} method - Method to call
     * @param {any} params - Method parameters
     * @returns {Promise} Method promise
     */
    const callNative = async (feature, method, params = {}) => {
        if (!isFeatureAvailable(feature)) {
            throw new Error(`Native feature not available: ${feature}`);
        }

        logDebug(`Calling native method: ${feature}.${method}`, params);

        // Use mock implementation in mock mode
        if (mockMode && mockImpl[feature] && mockImpl[feature][method]) {
            logDebug(`Using mock implementation for ${feature}.${method}`);
            return mockImpl[feature][method](params);
        }

        // Use custom bridge implementation
        if (nativeBridgeImpl[feature] && nativeBridgeImpl[feature][method]) {
            return nativeBridgeImpl[feature][method](params);
        }

        // Use platform-specific implementation
        switch (platform) {
            case NATIVE_PLATFORMS.IOS:
                return callIOS(feature, method, params);

            case NATIVE_PLATFORMS.ANDROID:
                return callAndroid(feature, method, params);

            default:
                throw new Error(`Unsupported platform for native feature: ${platform}`);
        }
    };

    /**
     * Calls an iOS native method
     * @param {string} feature - Feature to use
     * @param {string} method - Method to call
     * @param {any} params - Method parameters
     * @returns {Promise} Method promise
     */
    const callIOS = async (feature, method, params) => {
        // Check if webkit message handlers are available
        if (window.webkit && window.webkit.messageHandlers) {
            const handler = window.webkit.messageHandlers[feature];

            if (handler && typeof handler.postMessage === 'function') {
                return new Promise((resolve, reject) => {
                    // Create a unique callback ID
                    const callbackId = `${feature}_${method}_${Date.now()}`;

                    // Register callback
                    window[`${callbackId}_success`] = (result) => {
                        resolve(result);
                        delete window[`${callbackId}_success`];
                        delete window[`${callbackId}_error`];
                    };

                    window[`${callbackId}_error`] = (error) => {
                        reject(new Error(error));
                        delete window[`${callbackId}_success`];
                        delete window[`${callbackId}_error`];
                    };

                    // Call native method
                    handler.postMessage({
                        method,
                        params,
                        callbackId
                    });
                });
            }
        }

        throw new Error(`iOS native method not available: ${feature}.${method}`);
    };

    /**
     * Calls an Android native method
     * @param {string} feature - Feature to use
     * @param {string} method - Method to call
     * @param {any} params - Method parameters
     * @returns {Promise} Method promise
     */
    const callAndroid = async (feature, method, params) => {
        // Check if Android interface is available
        if (window.KalxJSNative) {
            const androidInterface = window.KalxJSNative[feature];

            if (androidInterface && typeof androidInterface[method] === 'function') {
                return new Promise((resolve, reject) => {
                    try {
                        // Android interface methods are synchronous
                        const result = androidInterface[method](JSON.stringify(params));
                        resolve(JSON.parse(result));
                    } catch (error) {
                        reject(new Error(error.toString()));
                    }
                });
            }
        }

        throw new Error(`Android native method not available: ${feature}.${method}`);
    };

    /**
     * Initializes the native bridge
     * @returns {Promise} Initialization promise
     */
    const initialize = async () => {
        logDebug('Initializing native bridge', { platform });

        // In mock mode, all features are available
        if (mockMode) {
            Object.keys(NATIVE_FEATURES).forEach(key => {
                availableFeatures.add(NATIVE_FEATURES[key]);
            });

            logDebug('Mock mode enabled, all features available');
            return;
        }

        // Check available features
        try {
            switch (platform) {
                case NATIVE_PLATFORMS.IOS:
                    if (window.webkit && window.webkit.messageHandlers) {
                        for (const feature of Object.values(NATIVE_FEATURES)) {
                            if (window.webkit.messageHandlers[feature]) {
                                availableFeatures.add(feature);
                            }
                        }
                    }
                    break;

                case NATIVE_PLATFORMS.ANDROID:
                    if (window.KalxJSNative) {
                        for (const feature of Object.values(NATIVE_FEATURES)) {
                            if (window.KalxJSNative[feature]) {
                                availableFeatures.add(feature);
                            }
                        }
                    }
                    break;
            }

            logDebug('Available native features', Array.from(availableFeatures));
        } catch (error) {
            logDebug('Error initializing native bridge', error);
        }
    };

    // Initialize the bridge
    initialize();

    // Create feature-specific APIs
    const camera = {
        takePicture: async (options = {}) => {
            return callNative(NATIVE_FEATURES.CAMERA, 'takePicture', options);
        },

        startVideoRecording: async (options = {}) => {
            return callNative(NATIVE_FEATURES.CAMERA, 'startVideoRecording', options);
        },

        stopVideoRecording: async () => {
            return callNative(NATIVE_FEATURES.CAMERA, 'stopVideoRecording');
        },

        getPhotos: async (options = {}) => {
            return callNative(NATIVE_FEATURES.CAMERA, 'getPhotos', options);
        }
    };

    const location = {
        getCurrentPosition: async (options = {}) => {
            return callNative(NATIVE_FEATURES.LOCATION, 'getCurrentPosition', options);
        },

        watchPosition: async (options = {}) => {
            return callNative(NATIVE_FEATURES.LOCATION, 'watchPosition', options);
        },

        clearWatch: async (watchId) => {
            return callNative(NATIVE_FEATURES.LOCATION, 'clearWatch', { watchId });
        },

        getAddressFromCoordinates: async (coords) => {
            return callNative(NATIVE_FEATURES.LOCATION, 'getAddressFromCoordinates', coords);
        }
    };

    const notifications = {
        requestPermission: async () => {
            return callNative(NATIVE_FEATURES.NOTIFICATIONS, 'requestPermission');
        },

        scheduleLocalNotification: async (notification) => {
            return callNative(NATIVE_FEATURES.NOTIFICATIONS, 'scheduleLocalNotification', notification);
        },

        cancelLocalNotification: async (id) => {
            return callNative(NATIVE_FEATURES.NOTIFICATIONS, 'cancelLocalNotification', { id });
        },

        cancelAllLocalNotifications: async () => {
            return callNative(NATIVE_FEATURES.NOTIFICATIONS, 'cancelAllLocalNotifications');
        },

        getScheduledLocalNotifications: async () => {
            return callNative(NATIVE_FEATURES.NOTIFICATIONS, 'getScheduledLocalNotifications');
        },

        registerForPushNotifications: async () => {
            return callNative(NATIVE_FEATURES.NOTIFICATIONS, 'registerForPushNotifications');
        }
    };

    const storage = {
        setItem: async (key, value) => {
            return callNative(NATIVE_FEATURES.STORAGE, 'setItem', { key, value });
        },

        getItem: async (key) => {
            return callNative(NATIVE_FEATURES.STORAGE, 'getItem', { key });
        },

        removeItem: async (key) => {
            return callNative(NATIVE_FEATURES.STORAGE, 'removeItem', { key });
        },

        clear: async () => {
            return callNative(NATIVE_FEATURES.STORAGE, 'clear');
        },

        getAllKeys: async () => {
            return callNative(NATIVE_FEATURES.STORAGE, 'getAllKeys');
        }
    };

    const biometrics = {
        isFaceIDAvailable: async () => {
            return callNative(NATIVE_FEATURES.BIOMETRICS, 'isFaceIDAvailable');
        },

        isTouchIDAvailable: async () => {
            return callNative(NATIVE_FEATURES.BIOMETRICS, 'isTouchIDAvailable');
        },

        authenticate: async (options = {}) => {
            return callNative(NATIVE_FEATURES.BIOMETRICS, 'authenticate', options);
        }
    };

    const share = {
        shareText: async (text, options = {}) => {
            return callNative(NATIVE_FEATURES.SHARE, 'shareText', { text, ...options });
        },

        shareImage: async (imageUrl, options = {}) => {
            return callNative(NATIVE_FEATURES.SHARE, 'shareImage', { imageUrl, ...options });
        },

        shareUrl: async (url, options = {}) => {
            return callNative(NATIVE_FEATURES.SHARE, 'shareUrl', { url, ...options });
        },

        shareFiles: async (files, options = {}) => {
            return callNative(NATIVE_FEATURES.SHARE, 'shareFiles', { files, ...options });
        }
    };

    const deviceInfo = {
        getDeviceInfo: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getDeviceInfo');
        },

        getUniqueId: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getUniqueId');
        },

        getBatteryLevel: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getBatteryLevel');
        },

        isEmulator: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'isEmulator');
        },

        getIPAddress: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getIPAddress');
        },

        getMACAddress: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getMACAddress');
        },

        getCarrier: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getCarrier');
        },

        getTotalMemory: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getTotalMemory');
        },

        getUsedMemory: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getUsedMemory');
        },

        getTotalDiskCapacity: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getTotalDiskCapacity');
        },

        getFreeDiskStorage: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getFreeDiskStorage');
        }
    };

    const haptics = {
        vibrate: async (pattern = []) => {
            return callNative(NATIVE_FEATURES.HAPTICS, 'vibrate', { pattern });
        },

        impact: async (style = 'medium') => {
            return callNative(NATIVE_FEATURES.HAPTICS, 'impact', { style });
        },

        notification: async (type = 'success') => {
            return callNative(NATIVE_FEATURES.HAPTICS, 'notification', { type });
        },

        selection: async () => {
            return callNative(NATIVE_FEATURES.HAPTICS, 'selection');
        }
    };

    return {
        platform,
        isFeatureAvailable,
        callNative,
        initialize,

        // Feature-specific APIs
        camera,
        location,
        notifications,
        storage,
        biometrics,
        share,
        deviceInfo,
        haptics
    };
}

/**
 * Creates a composable for using native features in components
 * @param {string} feature - Native feature to use
 * @param {Object} options - Options for the feature
 * @returns {Object} Native feature composable
 */
function useNative(feature, options = {}) {
    const instance = getCurrentInstance();

    if (!instance) {
        console.warn('[KalxJS Native] useNative() must be called within setup()');
        return null;
    }

    const nativeBridge = instance.appContext.config.globalProperties.$native ||
        window.$kalxjs?.native;

    if (!nativeBridge) {
        console.warn('[KalxJS Native] Native bridge not found. Make sure to use the Native plugin.');
        return null;
    }

    if (!nativeBridge.isFeatureAvailable(feature)) {
        console.warn(`[KalxJS Native] Native feature not available: ${feature}`);
        return null;
    }

    // Create reactive state
    const isAvailable = ref(nativeBridge.isFeatureAvailable(feature));
    const error = ref(null);

    // Return feature-specific API
    switch (feature) {
        case NATIVE_FEATURES.CAMERA:
            return {
                isAvailable,
                error,
                takePicture: async (opts = {}) => {
                    try {
                        return await nativeBridge.camera.takePicture({ ...options, ...opts });
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                },
                startVideoRecording: async (opts = {}) => {
                    try {
                        return await nativeBridge.camera.startVideoRecording({ ...options, ...opts });
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                },
                stopVideoRecording: async () => {
                    try {
                        return await nativeBridge.camera.stopVideoRecording();
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                },
                getPhotos: async (opts = {}) => {
                    try {
                        return await nativeBridge.camera.getPhotos({ ...options, ...opts });
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                }
            };

        case NATIVE_FEATURES.LOCATION:
            return {
                isAvailable,
                error,
                getCurrentPosition: async (opts = {}) => {
                    try {
                        return await nativeBridge.location.getCurrentPosition({ ...options, ...opts });
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                },
                watchPosition: async (opts = {}) => {
                    try {
                        return await nativeBridge.location.watchPosition({ ...options, ...opts });
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                },
                clearWatch: async (watchId) => {
                    try {
                        return await nativeBridge.location.clearWatch(watchId);
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                },
                getAddressFromCoordinates: async (coords) => {
                    try {
                        return await nativeBridge.location.getAddressFromCoordinates(coords);
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                }
            };

        // Add other features as needed

        default:
            // Generic API for any feature
            return {
                isAvailable,
                error,
                callMethod: async (method, params = {}) => {
                    try {
                        return await nativeBridge.callNative(feature, method, params);
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                }
            };
    }
}

/**
 * Creates a native plugin for KalxJS
 * @param {Object} options - Native plugin options
 * @returns {Object} Native plugin
 */
function createNativePlugin(options = {}) {
    return {
        name: 'native',
        install(app) {
            // Create native bridge
            const nativeBridge = createNativeBridge(options);

            // Add native bridge to the app
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};
            app.config.globalProperties.$native = nativeBridge;

            // Add native bridge to the window for useNative
            if (typeof window !== 'undefined') {
                window.$kalxjs = window.$kalxjs || {};
                window.$kalxjs.native = nativeBridge;
            }

            // Add useNative to the app
            app.useNative = useNative;

            // Register native components
            app.component('NativeCamera', {
                props: {
                    mode: {
                        type: String,
                        default: 'photo', // 'photo', 'video'
                        validator: value => ['photo', 'video'].includes(value)
                    },
                    quality: {
                        type: Number,
                        default: 0.8,
                        validator: value => value >= 0 && value <= 1
                    },
                    maxWidth: Number,
                    maxHeight: Number,
                    includeBase64: {
                        type: Boolean,
                        default: false
                    }
                },
                setup(props, { slots, emit }) {
                    const camera = useNative(NATIVE_FEATURES.CAMERA);
                    const imageUrl = ref('');
                    const videoUrl = ref('');
                    const isCapturing = ref(false);
                    const isRecording = ref(false);
                    const error = ref(null);

                    const takePicture = async () => {
                        if (!camera || isCapturing.value) return;

                        isCapturing.value = true;
                        error.value = null;

                        try {
                            const result = await camera.takePicture({
                                quality: props.quality,
                                maxWidth: props.maxWidth,
                                maxHeight: props.maxHeight,
                                includeBase64: props.includeBase64
                            });

                            imageUrl.value = result.uri;
                            emit('capture', result);
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        } finally {
                            isCapturing.value = false;
                        }
                    };

                    const startRecording = async () => {
                        if (!camera || isRecording.value) return;

                        isRecording.value = true;
                        error.value = null;

                        try {
                            await camera.startVideoRecording({
                                quality: props.quality,
                                maxDuration: props.maxDuration
                            });

                            emit('recording-start');
                        } catch (err) {
                            isRecording.value = false;
                            error.value = err.message;
                            emit('error', err);
                        }
                    };

                    const stopRecording = async () => {
                        if (!camera || !isRecording.value) return;

                        try {
                            const result = await camera.stopVideoRecording();

                            videoUrl.value = result.uri;
                            emit('recording-stop', result);
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        } finally {
                            isRecording.value = false;
                        }
                    };

                    return () => {
                        // Default slot with state
                        if (slots.default) {
                            return slots.default({
                                imageUrl: imageUrl.value,
                                videoUrl: videoUrl.value,
                                isCapturing: isCapturing.value,
                                isRecording: isRecording.value,
                                error: error.value,
                                takePicture,
                                startRecording,
                                stopRecording
                            });
                        }

                        // Default rendering
                        return h('div', { class: 'native-camera' }, [
                            error.value ? h('div', { class: 'native-error' }, [error.value]) : null,
                            props.mode === 'photo' ? [
                                h('button', {
                                    class: 'native-camera-button',
                                    onClick: takePicture,
                                    disabled: isCapturing.value
                                }, [isCapturing.value ? 'Capturing...' : 'Take Photo']),
                                imageUrl.value ? h('img', { class: 'native-camera-preview', src: imageUrl.value }) : null
                            ] : [
                                h('button', {
                                    class: 'native-camera-button',
                                    onClick: isRecording.value ? stopRecording : startRecording,
                                    disabled: isCapturing.value
                                }, [isRecording.value ? 'Stop Recording' : 'Start Recording']),
                                videoUrl.value ? h('video', {
                                    class: 'native-camera-preview',
                                    src: videoUrl.value,
                                    controls: true
                                }) : null
                            ]
                        ]);
                    };
                }
            });

            app.component('NativeLocation', {
                props: {
                    watch: {
                        type: Boolean,
                        default: false
                    },
                    highAccuracy: {
                        type: Boolean,
                        default: false
                    },
                    timeout: {
                        type: Number,
                        default: 10000
                    },
                    maximumAge: {
                        type: Number,
                        default: 0
                    }
                },
                setup(props, { slots, emit }) {
                    const location = useNative(NATIVE_FEATURES.LOCATION);
                    const position = ref(null);
                    const address = ref(null);
                    const isLoading = ref(false);
                    const error = ref(null);
                    let watchId = null;

                    const getPosition = async () => {
                        if (!location) return;

                        isLoading.value = true;
                        error.value = null;

                        try {
                            const result = await location.getCurrentPosition({
                                highAccuracy: props.highAccuracy,
                                timeout: props.timeout,
                                maximumAge: props.maximumAge
                            });

                            position.value = result;
                            emit('position', result);
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        } finally {
                            isLoading.value = false;
                        }
                    };

                    const getAddress = async () => {
                        if (!location || !position.value) return;

                        isLoading.value = true;
                        error.value = null;

                        try {
                            const result = await location.getAddressFromCoordinates({
                                latitude: position.value.coords.latitude,
                                longitude: position.value.coords.longitude
                            });

                            address.value = result;
                            emit('address', result);
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        } finally {
                            isLoading.value = false;
                        }
                    };

                    const startWatching = async () => {
                        if (!location) return;

                        try {
                            watchId = await location.watchPosition({
                                highAccuracy: props.highAccuracy,
                                timeout: props.timeout,
                                maximumAge: props.maximumAge,
                                onUpdate: (result) => {
                                    position.value = result;
                                    emit('position', result);
                                },
                                onError: (err) => {
                                    error.value = err.message;
                                    emit('error', err);
                                }
                            });
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        }
                    };

                    const stopWatching = async () => {
                        if (!location || !watchId) return;

                        try {
                            await location.clearWatch(watchId);
                            watchId = null;
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        }
                    };

                    // Start watching if enabled
                    onMounted(() => {
                        if (props.watch) {
                            startWatching();
                        } else {
                            getPosition();
                        }
                    });

                    // Clean up on unmount
                    onUnmounted(() => {
                        if (watchId) {
                            stopWatching();
                        }
                    });

                    return () => {
                        // Default slot with state
                        if (slots.default) {
                            return slots.default({
                                position: position.value,
                                address: address.value,
                                isLoading: isLoading.value,
                                error: error.value,
                                getPosition,
                                getAddress,
                                startWatching,
                                stopWatching
                            });
                        }

                        // Default rendering
                        return h('div', { class: 'native-location' }, [
                            error.value ? h('div', { class: 'native-error' }, [error.value]) : null,
                            isLoading.value ? h('div', { class: 'native-loading' }, ['Loading location...']) : null,
                            position.value ? h('div', { class: 'native-location-position' }, [
                                h('p', {}, [`Latitude: ${position.value.coords.latitude}`]),
                                h('p', {}, [`Longitude: ${position.value.coords.longitude}`]),
                                h('p', {}, [`Accuracy: ${position.value.coords.accuracy} meters`])
                            ]) : null,
                            address.value ? h('div', { class: 'native-location-address' }, [
                                h('p', {}, [address.value.formattedAddress])
                            ]) : null,
                            h('div', { class: 'native-location-actions' }, [
                                h('button', {
                                    class: 'native-location-button',
                                    onClick: getPosition,
                                    disabled: isLoading.value
                                }, ['Get Position']),
                                position.value ? h('button', {
                                    class: 'native-location-button',
                                    onClick: getAddress,
                                    disabled: isLoading.value
                                }, ['Get Address']) : null,
                                props.watch ? h('button', {
                                    class: 'native-location-button',
                                    onClick: watchId ? stopWatching : startWatching,
                                    disabled: isLoading.value
                                }, [watchId ? 'Stop Watching' : 'Start Watching']) : null
                            ])
                        ]);
                    };
                }
            });
        }
    };
}

// @kalxjs/core - Built-in testing framework

/**
 * Test suite types
 */
const TEST_TYPES = {
    UNIT: 'unit',
    COMPONENT: 'component',
    E2E: 'e2e',
    INTEGRATION: 'integration',
    PERFORMANCE: 'performance'
};

/**
 * Creates a test suite
 * @param {string} name - Test suite name
 * @param {Function} fn - Test suite function
 * @returns {Object} Test suite
 */
function describe(name, fn) {
    const suite = {
        name,
        tests: [],
        beforeEach: null,
        afterEach: null,
        beforeAll: null,
        afterAll: null
    };

    const context = {
        test: (testName, testFn) => {
            suite.tests.push({
                name: testName,
                fn: testFn,
                skip: false,
                only: false
            });

            return context;
        },

        it: (testName, testFn) => context.test(testName, testFn),

        beforeEach: (fn) => {
            suite.beforeEach = fn;
            return context;
        },

        afterEach: (fn) => {
            suite.afterEach = fn;
            return context;
        },

        beforeAll: (fn) => {
            suite.beforeAll = fn;
            return context;
        },

        afterAll: (fn) => {
            suite.afterAll = fn;
            return context;
        },

        skip: (testName, testFn) => {
            suite.tests.push({
                name: testName,
                fn: testFn,
                skip: true,
                only: false
            });

            return context;
        },

        only: (testName, testFn) => {
            suite.tests.push({
                name: testName,
                fn: testFn,
                skip: false,
                only: true
            });

            return context;
        }
    };

    // Aliases
    context.it.skip = context.skip;
    context.it.only = context.only;

    // Execute the suite function
    fn(context);

    return suite;
}

/**
 * Creates a test
 * @param {string} name - Test name
 * @param {Function} fn - Test function
 * @returns {Object} Test
 */
function test(name, fn) {
    return {
        name,
        fn,
        skip: false,
        only: false
    };
}

/**
 * Alias for test
 */
const it = test;

/**
 * Creates a skipped test
 * @param {string} name - Test name
 * @param {Function} fn - Test function
 * @returns {Object} Test
 */
function skip(name, fn) {
    return {
        name,
        fn,
        skip: true,
        only: false
    };
}

/**
 * Creates a test that will be run exclusively
 * @param {string} name - Test name
 * @param {Function} fn - Test function
 * @returns {Object} Test
 */
function only(name, fn) {
    return {
        name,
        fn,
        skip: false,
        only: true
    };
}

// Add skip and only to test and it
test.skip = skip;
test.only = only;
it.skip = skip;
it.only = only;

/**
 * Creates a test runner
 * @param {Object} options - Test runner options
 * @returns {Object} Test runner
 */
function createTestRunner(options = {}) {
    const {
        reporter = 'console',
        timeout = 5000,
        bail = false,
        grep = null,
        verbose = false
    } = options;

    // Test suites
    const suites = [];

    // Test results
    const results = {
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0,
        duration: 0,
        suites: []
    };

    /**
     * Adds a test suite
     * @param {Object} suite - Test suite
     */
    const addSuite = (suite) => {
        suites.push(suite);
    };

    /**
     * Runs all test suites
     * @returns {Promise} Test results
     */
    const runAll = async () => {
        const startTime = Date.now();

        // Check if any tests are marked as "only"
        const hasOnly = suites.some(suite =>
            suite.tests.some(test => test.only)
        );

        // Run each suite
        for (const suite of suites) {
            const suiteResult = {
                name: suite.name,
                passed: 0,
                failed: 0,
                skipped: 0,
                total: suite.tests.length,
                duration: 0,
                tests: []
            };

            // Run beforeAll hook
            if (suite.beforeAll) {
                try {
                    await suite.beforeAll();
                } catch (error) {
                    console.error(`Error in beforeAll hook for suite "${suite.name}":`, error);

                    // Mark all tests as failed
                    for (const test of suite.tests) {
                        suiteResult.tests.push({
                            name: test.name,
                            status: 'failed',
                            error: new Error(`beforeAll hook failed: ${error.message}`),
                            duration: 0
                        });

                        suiteResult.failed++;
                    }

                    results.suites.push(suiteResult);
                    continue;
                }
            }

            // Run each test
            for (const test of suite.tests) {
                // Skip tests if not matching grep pattern
                if (grep && !test.name.match(grep)) {
                    suiteResult.tests.push({
                        name: test.name,
                        status: 'skipped',
                        duration: 0
                    });

                    suiteResult.skipped++;
                    continue;
                }

                // Skip tests if marked as skip or if other tests are marked as only
                if (test.skip || (hasOnly && !test.only)) {
                    suiteResult.tests.push({
                        name: test.name,
                        status: 'skipped',
                        duration: 0
                    });

                    suiteResult.skipped++;
                    continue;
                }

                // Run the test
                const testResult = {
                    name: test.name,
                    status: 'passed',
                    duration: 0
                };

                const testStartTime = Date.now();

                try {
                    // Run beforeEach hook
                    if (suite.beforeEach) {
                        await suite.beforeEach();
                    }

                    // Run the test with timeout
                    await Promise.race([
                        test.fn(),
                        new Promise((_, reject) => {
                            setTimeout(() => {
                                reject(new Error(`Test timed out after ${timeout}ms`));
                            }, timeout);
                        })
                    ]);

                    // Run afterEach hook
                    if (suite.afterEach) {
                        await suite.afterEach();
                    }

                    testResult.status = 'passed';
                    suiteResult.passed++;
                } catch (error) {
                    testResult.status = 'failed';
                    testResult.error = error;
                    suiteResult.failed++;

                    // Bail if configured
                    if (bail) {
                        break;
                    }
                }

                testResult.duration = Date.now() - testStartTime;
                suiteResult.tests.push(testResult);
            }

            // Run afterAll hook
            if (suite.afterAll) {
                try {
                    await suite.afterAll();
                } catch (error) {
                    console.error(`Error in afterAll hook for suite "${suite.name}":`, error);
                }
            }

            suiteResult.duration = Date.now() - startTime;
            results.suites.push(suiteResult);
        }

        // Update overall results
        results.passed = results.suites.reduce((sum, suite) => sum + suite.passed, 0);
        results.failed = results.suites.reduce((sum, suite) => sum + suite.failed, 0);
        results.skipped = results.suites.reduce((sum, suite) => sum + suite.skipped, 0);
        results.total = results.passed + results.failed + results.skipped;
        results.duration = Date.now() - startTime;

        // Report results
        reportResults(results);

        return results;
    };

    /**
     * Reports test results
     * @param {Object} results - Test results
     */
    const reportResults = (results) => {
        switch (reporter) {
            case 'console':
                reportToConsole(results);
                break;

            case 'json':
                reportToJSON(results);
                break;

            default:
                if (typeof reporter === 'function') {
                    reporter(results);
                } else {
                    reportToConsole(results);
                }
        }
    };

    /**
     * Reports test results to the console
     * @param {Object} results - Test results
     */
    const reportToConsole = (results) => {
        console.log('\n=== Test Results ===');
        console.log(`Total: ${results.total}, Passed: ${results.passed}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
        console.log(`Duration: ${results.duration}ms`);

        if (verbose || results.failed > 0) {
            console.log('\n=== Test Details ===');

            for (const suite of results.suites) {
                console.log(`\nSuite: ${suite.name}`);
                console.log(`  Passed: ${suite.passed}, Failed: ${suite.failed}, Skipped: ${suite.skipped}`);

                for (const test of suite.tests) {
                    const icon = test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '-';
                    console.log(`  ${icon} ${test.name} (${test.duration}ms)`);

                    if (test.status === 'failed' && test.error) {
                        console.error(`    Error: ${test.error.message}`);
                        if (test.error.stack) {
                            console.error(`    Stack: ${test.error.stack.split('\n').slice(1).join('\n      ')}`);
                        }
                    }
                }
            }
        }

        console.log('\n=== End of Test Results ===\n');
    };

    /**
     * Reports test results as JSON
     * @param {Object} results - Test results
     */
    const reportToJSON = (results) => {
        console.log(JSON.stringify(results, null, 2));
    };

    return {
        describe: (name, fn) => {
            const suite = describe(name, fn);
            addSuite(suite);
            return suite;
        },

        test,
        it,
        skip,
        only,

        run: runAll
    };
}

/**
 * Creates a component test utility
 * @param {Object} options - Component test options
 * @returns {Object} Component test utility
 */
function createComponentTest(options = {}) {
    const {
        plugins = [],
        global = {},
        mocks = {}
    } = options;

    /**
     * Mounts a component for testing
     * @param {Object} component - Component to mount
     * @param {Object} options - Mount options
     * @returns {Object} Mounted component
     */
    const mount = (component, options = {}) => {
        const {
            props = {},
            slots = {},
            attrs = {},
            listeners = {},
            provide = {},
            shallow = false
        } = options;

        // Create a test app
        const app = createApp({
            render() {
                return h(component, {
                    ...props,
                    ...attrs,
                    ...Object.entries(listeners).reduce((acc, [event, handler]) => {
                        acc[`on${event.charAt(0).toUpperCase() + event.slice(1)}`] = handler;
                        return acc;
                    }, {})
                }, slots);
            }
        });

        // Apply plugins
        plugins.forEach(plugin => {
            if (Array.isArray(plugin)) {
                app.use(plugin[0], plugin[1]);
            } else {
                app.use(plugin);
            }
        });

        // Apply global mocks
        Object.entries(global).forEach(([key, value]) => {
            app.config.globalProperties[key] = value;
        });

        // Apply provide values
        Object.entries(provide).forEach(([key, value]) => {
            app.provide(key, value);
        });

        // Create a container
        const container = document.createElement('div');
        document.body.appendChild(container);

        // Mount the app
        app.mount(container);

        // Create wrapper with testing utilities
        const wrapper = {
            app,
            container,
            component,

            // Find elements
            find: (selector) => container.querySelector(selector),
            findAll: (selector) => container.querySelectorAll(selector),

            // Get text content
            text: () => container.textContent,

            // Get HTML content
            html: () => container.innerHTML,

            // Check if element exists
            exists: (selector) => !!container.querySelector(selector),

            // Trigger events
            trigger: async (selector, event, options = {}) => {
                const element = typeof selector === 'string' ? container.querySelector(selector) : selector;

                if (!element) {
                    throw new Error(`Element not found: ${selector}`);
                }

                const eventObj = new Event(event, {
                    bubbles: true,
                    cancelable: true,
                    ...options
                });

                element.dispatchEvent(eventObj);

                // Wait for the next tick
                await nextTick();

                return wrapper;
            },

            // Set input value
            setValue: async (selector, value) => {
                const element = typeof selector === 'string' ? container.querySelector(selector) : selector;

                if (!element) {
                    throw new Error(`Element not found: ${selector}`);
                }

                if (element.tagName === 'SELECT') {
                    element.value = value;
                    await wrapper.trigger(element, 'change');
                } else if (element.tagName === 'INPUT') {
                    if (element.type === 'checkbox') {
                        element.checked = value;
                        await wrapper.trigger(element, 'change');
                    } else if (element.type === 'radio') {
                        element.checked = value;
                        await wrapper.trigger(element, 'change');
                    } else {
                        element.value = value;
                        await wrapper.trigger(element, 'input');
                    }
                } else if (element.tagName === 'TEXTAREA') {
                    element.value = value;
                    await wrapper.trigger(element, 'input');
                }

                return wrapper;
            },

            // Unmount the component
            unmount: () => {
                app.unmount();
                container.remove();
            }
        };

        return wrapper;
    };

    /**
     * Shallowly mounts a component for testing
     * @param {Object} component - Component to mount
     * @param {Object} options - Mount options
     * @returns {Object} Mounted component
     */
    const shallowMount = (component, options = {}) => {
        return mount(component, { ...options, shallow: true });
    };

    return {
        mount,
        shallowMount
    };
}

/**
 * Creates assertions for testing
 * @returns {Object} Assertions
 */
function createAssertions() {
    /**
     * Asserts that a condition is true
     * @param {boolean} condition - Condition to check
     * @param {string} message - Error message
     */
    const assert = (condition, message = 'Assertion failed') => {
        if (!condition) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that two values are equal
     * @param {any} actual - Actual value
     * @param {any} expected - Expected value
     * @param {string} message - Error message
     */
    const assertEqual = (actual, expected, message = 'Values are not equal') => {
        if (actual !== expected) {
            throw new Error(`${message}: ${actual} !== ${expected}`);
        }
    };

    /**
     * Asserts that two values are not equal
     * @param {any} actual - Actual value
     * @param {any} expected - Expected value
     * @param {string} message - Error message
     */
    const assertNotEqual = (actual, expected, message = 'Values are equal') => {
        if (actual === expected) {
            throw new Error(`${message}: ${actual} === ${expected}`);
        }
    };

    /**
     * Asserts that a value is truthy
     * @param {any} value - Value to check
     * @param {string} message - Error message
     */
    const assertTruthy = (value, message = 'Value is not truthy') => {
        if (!value) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that a value is falsy
     * @param {any} value - Value to check
     * @param {string} message - Error message
     */
    const assertFalsy = (value, message = 'Value is not falsy') => {
        if (value) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that a value is null
     * @param {any} value - Value to check
     * @param {string} message - Error message
     */
    const assertNull = (value, message = 'Value is not null') => {
        if (value !== null) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that a value is not null
     * @param {any} value - Value to check
     * @param {string} message - Error message
     */
    const assertNotNull = (value, message = 'Value is null') => {
        if (value === null) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that a value is undefined
     * @param {any} value - Value to check
     * @param {string} message - Error message
     */
    const assertUndefined = (value, message = 'Value is not undefined') => {
        if (value !== undefined) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that a value is not undefined
     * @param {any} value - Value to check
     * @param {string} message - Error message
     */
    const assertDefined = (value, message = 'Value is undefined') => {
        if (value === undefined) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that a value is an instance of a class
     * @param {any} value - Value to check
     * @param {Function} constructor - Constructor to check against
     * @param {string} message - Error message
     */
    const assertInstanceOf = (value, constructor, message = 'Value is not an instance of the expected constructor') => {
        if (!(value instanceof constructor)) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that a function throws an error
     * @param {Function} fn - Function to check
     * @param {RegExp|string|Function} expected - Expected error
     * @param {string} message - Error message
     */
    const assertThrows = (fn, expected, message = 'Function did not throw an error') => {
        try {
            fn();
            throw new Error(message);
        } catch (error) {
            if (expected instanceof RegExp) {
                if (!expected.test(error.message)) {
                    throw new Error(`${message}: ${error.message} does not match ${expected}`);
                }
            } else if (typeof expected === 'function') {
                if (!(error instanceof expected)) {
                    throw new Error(`${message}: ${error.constructor.name} is not an instance of ${expected.name}`);
                }
            } else if (typeof expected === 'string') {
                if (error.message !== expected) {
                    throw new Error(`${message}: ${error.message} !== ${expected}`);
                }
            }
        }
    };

    /**
     * Asserts that a function does not throw an error
     * @param {Function} fn - Function to check
     * @param {string} message - Error message
     */
    const assertDoesNotThrow = (fn, message = 'Function threw an error') => {
        try {
            fn();
        } catch (error) {
            throw new Error(`${message}: ${error.message}`);
        }
    };

    /**
     * Asserts that a value is close to another value
     * @param {number} actual - Actual value
     * @param {number} expected - Expected value
     * @param {number} delta - Maximum difference
     * @param {string} message - Error message
     */
    const assertCloseTo = (actual, expected, delta = 0.001, message = 'Values are not close') => {
        if (Math.abs(actual - expected) > delta) {
            throw new Error(`${message}: ${actual} is not close to ${expected} (delta: ${delta})`);
        }
    };

    return {
        assert,
        assertEqual,
        assertNotEqual,
        assertTruthy,
        assertFalsy,
        assertNull,
        assertNotNull,
        assertUndefined,
        assertDefined,
        assertInstanceOf,
        assertThrows,
        assertDoesNotThrow,
        assertCloseTo
    };
}

/**
 * Creates a testing plugin for KalxJS
 * @param {Object} options - Testing plugin options
 * @returns {Object} Testing plugin
 */
function createTestingPlugin(options = {}) {
    return {
        name: 'testing',
        install(app) {
            // Create test runner
            const testRunner = createTestRunner(options);

            // Create component test utility
            const componentTest = createComponentTest({
                plugins: options.plugins || []
            });

            // Create assertions
            const assertions = createAssertions();

            // Add testing utilities to the app
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};
            app.config.globalProperties.$testing = {
                testRunner,
                componentTest,
                assertions
            };

            // Add testing utilities to the window
            if (typeof window !== 'undefined') {
                window.$kalxjs = window.$kalxjs || {};
                window.$kalxjs.testing = {
                    testRunner,
                    componentTest,
                    assertions
                };
            }
        }
    };
}

// @kalxjs/core - Server-side rendering with hydration

/**
 * Creates a server renderer for KalxJS
 * @param {Object} options - Server renderer options
 * @returns {Object} Server renderer
 */
function createServerRenderer(options = {}) {
    const {
        template = '<!DOCTYPE html><html><head></head><body><!--kalxjs-ssr-outlet--></body></html>',
        inject = true,
        clientManifest = null,
        runInNewContext = false,
        basedir = process.cwd(),
        cache = new Map(),
        maxCacheSize = 1000,
        directives = {},
        serializer = JSON.stringify,
        deserializer = JSON.parse
    } = options;

    // Find the outlet placeholder in the template
    const outlet = '<!--kalxjs-ssr-outlet-->';
    const outletIndex = template.indexOf(outlet);

    if (outletIndex < 0) {
        throw new Error('Invalid SSR template: missing outlet placeholder <!--kalxjs-ssr-outlet-->');
    }

    // Split the template into head and tail
    const head = template.slice(0, outletIndex);
    const tail = template.slice(outletIndex + outlet.length);

    /**
     * Renders a component to HTML
     * @param {Object} app - KalxJS app
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderToString = async (app, context = {}) => {
        // Check cache first
        const cacheKey = getCacheKey(app, context);

        if (cacheKey && cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }

        // Create a new context for rendering
        const renderContext = {
            ...context,
            _styles: new Set(),
            _scripts: new Set(),
            _links: new Set(),
            _metas: new Set(),
            _hydrationState: {},
            _teleports: {},
            _ssrContext: true
        };

        try {
            // Render the app to a string
            const appHtml = await renderComponentToString(app, renderContext);

            // Generate the full HTML
            let html = head + appHtml + tail;

            // Inject styles, scripts, links, and metas
            if (inject) {
                html = injectResources(html, renderContext);
            }

            // Inject hydration state
            html = injectHydrationState(html, renderContext);

            // Cache the result
            if (cacheKey) {
                // Implement LRU cache behavior
                if (cache.size >= maxCacheSize) {
                    const firstKey = cache.keys().next().value;
                    cache.delete(firstKey);
                }

                cache.set(cacheKey, html);
            }

            return html;
        } catch (error) {
            console.error('Error rendering to string:', error);
            throw error;
        }
    };

    /**
     * Renders a component to a stream
     * @param {Object} app - KalxJS app
     * @param {Object} context - Render context
     * @returns {ReadableStream} Rendered stream
     */
    const renderToStream = (app, context = {}) => {
        // Create a new context for rendering
        const renderContext = {
            ...context,
            _styles: new Set(),
            _scripts: new Set(),
            _links: new Set(),
            _metas: new Set(),
            _hydrationState: {},
            _teleports: {},
            _ssrContext: true
        };

        // Create a readable stream
        const { Readable } = require('stream');
        const stream = new Readable({
            read() { }
        });

        // Write the head
        stream.push(head);

        // Render the app to a stream
        const appStream = renderComponentToStream(app, renderContext);

        appStream.on('data', (chunk) => {
            stream.push(chunk);
        });

        appStream.on('end', () => {
            // Inject styles, scripts, links, and metas
            let tailHtml = tail;

            if (inject) {
                tailHtml = injectResources(tailHtml, renderContext);
            }

            // Inject hydration state
            tailHtml = injectHydrationState(tailHtml, renderContext);

            // Write the tail
            stream.push(tailHtml);
            stream.push(null);
        });

        appStream.on('error', (error) => {
            console.error('Error rendering to stream:', error);
            stream.emit('error', error);
        });

        return stream;
    };

    /**
     * Renders a component to a string
     * @param {Object} component - Component to render
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderComponentToString = async (component, context) => {
        // Create a virtual DOM tree
        const vnode = createVNode(component, context);

        // Render the virtual DOM tree to a string
        return renderVNodeToString(vnode, context);
    };

    /**
     * Renders a component to a stream
     * @param {Object} component - Component to render
     * @param {Object} context - Render context
     * @returns {ReadableStream} Rendered stream
     */
    const renderComponentToStream = (component, context) => {
        // Create a virtual DOM tree
        const vnode = createVNode(component, context);

        // Render the virtual DOM tree to a stream
        return renderVNodeToStream(vnode, context);
    };

    /**
     * Creates a virtual DOM node
     * @param {Object} component - Component to render
     * @param {Object} context - Render context
     * @returns {Object} Virtual DOM node
     */
    const createVNode = (component, context) => {
        // If component is an app instance, get the root component
        if (component.$options && component.$options._component) {
            return h(component.$options._component, context);
        }

        // If component is a component definition, create a vnode
        return h(component, context);
    };

    /**
     * Renders a virtual DOM node to a string
     * @param {Object} vnode - Virtual DOM node
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderVNodeToString = async (vnode, context) => {
        // If vnode is null or undefined, return empty string
        if (!vnode) {
            return '';
        }

        // If vnode is a string, return it
        if (typeof vnode === 'string') {
            return escapeHtml(vnode);
        }

        // If vnode is a number, return it as a string
        if (typeof vnode === 'number') {
            return String(vnode);
        }

        // If vnode is a component, render it
        if (vnode.type && typeof vnode.type === 'object') {
            return renderComponentVNodeToString(vnode, context);
        }

        // If vnode is an element, render it
        if (vnode.type && typeof vnode.type === 'string') {
            return renderElementVNodeToString(vnode, context);
        }

        // If vnode is a fragment, render its children
        if (vnode.type === Symbol.for('fragment')) {
            return renderFragmentVNodeToString(vnode, context);
        }

        // If vnode is a teleport, render it
        if (vnode.type === Symbol.for('teleport')) {
            return renderTeleportVNodeToString(vnode, context);
        }

        // If vnode is a suspense, render it
        if (vnode.type === Symbol.for('suspense')) {
            return renderSuspenseVNodeToString(vnode, context);
        }

        // If vnode is a function, call it and render the result
        if (typeof vnode.type === 'function') {
            const result = vnode.type(vnode.props || {});
            return renderVNodeToString(result, context);
        }

        // If vnode is an array, render each item
        if (Array.isArray(vnode)) {
            let html = '';

            for (const child of vnode) {
                html += await renderVNodeToString(child, context);
            }

            return html;
        }

        // If vnode is an object with a render function, call it and render the result
        if (vnode.render) {
            const result = vnode.render();
            return renderVNodeToString(result, context);
        }

        // If vnode is an object with a template function, call it and render the result
        if (vnode.template) {
            const result = vnode.template();
            return renderVNodeToString(result, context);
        }

        // If vnode is an object with a toString method, call it
        if (vnode.toString && vnode.toString !== Object.prototype.toString) {
            return escapeHtml(vnode.toString());
        }

        // If vnode is an object, render it as JSON
        return escapeHtml(JSON.stringify(vnode));
    };

    /**
     * Renders a virtual DOM node to a stream
     * @param {Object} vnode - Virtual DOM node
     * @param {Object} context - Render context
     * @returns {ReadableStream} Rendered stream
     */
    const renderVNodeToStream = (vnode, context) => {
        // Create a readable stream
        const { Readable } = require('stream');
        const stream = new Readable({
            read() { }
        });

        // Render the vnode to a string
        renderVNodeToString(vnode, context)
            .then((html) => {
                stream.push(html);
                stream.push(null);
            })
            .catch((error) => {
                stream.emit('error', error);
            });

        return stream;
    };

    /**
     * Renders a component virtual DOM node to a string
     * @param {Object} vnode - Virtual DOM node
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderComponentVNodeToString = async (vnode, context) => {
        const component = vnode.type;
        const props = vnode.props || {};

        // Create a new component instance
        const instance = createComponentInstance(component, props, context);

        // Set up the component
        setupComponent(instance);

        // Add the component state to the hydration state
        if (instance.state) {
            context._hydrationState[instance._uid] = serializeState(instance.state);
        }

        // Render the component
        const result = instance.render ? instance.render() : null;

        // Render the result
        return renderVNodeToString(result, context);
    };

    /**
     * Renders an element virtual DOM node to a string
     * @param {Object} vnode - Virtual DOM node
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderElementVNodeToString = async (vnode, context) => {
        const { type, props = {}, children = [] } = vnode;

        // Special handling for style and script tags
        if (type === 'style' && props.children) {
            context._styles.add(props.children);
            return '';
        }

        if (type === 'script' && props.src) {
            context._scripts.add(props.src);
            return '';
        }

        if (type === 'link' && props.rel === 'stylesheet' && props.href) {
            context._links.add(props.href);
            return '';
        }

        if (type === 'meta' && props.name && props.content) {
            context._metas.add({ name: props.name, content: props.content });
            return '';
        }

        // Start tag
        let html = `<${type}`;

        // Add attributes
        for (const [key, value] of Object.entries(props)) {
            // Skip children and event handlers
            if (key === 'children' || key.startsWith('on')) {
                continue;
            }

            // Handle boolean attributes
            if (value === true) {
                html += ` ${key}`;
                continue;
            }

            // Skip false boolean attributes
            if (value === false) {
                continue;
            }

            // Handle directives
            if (key.startsWith('v-') && directives[key]) {
                const directiveHtml = directives[key](value, vnode, context);
                if (directiveHtml) {
                    html += directiveHtml;
                }
                continue;
            }

            // Handle regular attributes
            html += ` ${key}="${escapeHtml(String(value))}"`;
        }

        // Self-closing tags
        const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

        if (selfClosingTags.includes(type)) {
            return `${html} />`;
        }

        // Close the start tag
        html += '>';

        // Add children
        if (children) {
            if (Array.isArray(children)) {
                for (const child of children) {
                    html += await renderVNodeToString(child, context);
                }
            } else {
                html += await renderVNodeToString(children, context);
            }
        }

        // End tag
        html += `</${type}>`;

        return html;
    };

    /**
     * Renders a fragment virtual DOM node to a string
     * @param {Object} vnode - Virtual DOM node
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderFragmentVNodeToString = async (vnode, context) => {
        const { children = [] } = vnode;

        let html = '';

        if (Array.isArray(children)) {
            for (const child of children) {
                html += await renderVNodeToString(child, context);
            }
        } else {
            html += await renderVNodeToString(children, context);
        }

        return html;
    };

    /**
     * Renders a teleport virtual DOM node to a string
     * @param {Object} vnode - Virtual DOM node
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderTeleportVNodeToString = async (vnode, context) => {
        const { props = {}, children = [] } = vnode;
        const { to } = props;

        if (!to) {
            return '';
        }

        // Render the children
        let html = '';

        if (Array.isArray(children)) {
            for (const child of children) {
                html += await renderVNodeToString(child, context);
            }
        } else {
            html += await renderVNodeToString(children, context);
        }

        // Store the teleport content
        context._teleports[to] = html;

        return '';
    };

    /**
     * Renders a suspense virtual DOM node to a string
     * @param {Object} vnode - Virtual DOM node
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderSuspenseVNodeToString = async (vnode, context) => {
        const { props = {}, children = [] } = vnode;
        const { fallback } = props;

        try {
            // Try to render the children
            let html = '';

            if (Array.isArray(children)) {
                for (const child of children) {
                    html += await renderVNodeToString(child, context);
                }
            } else {
                html += await renderVNodeToString(children, context);
            }

            return html;
        } catch (error) {
            // If an error occurs, render the fallback
            return renderVNodeToString(fallback, context);
        }
    };

    /**
     * Creates a component instance
     * @param {Object} component - Component definition
     * @param {Object} props - Component props
     * @param {Object} context - Render context
     * @returns {Object} Component instance
     */
    const createComponentInstance = (component, props, context) => {
        // Create a unique ID for the component
        const uid = generateUid();

        // Create the instance
        const instance = {
            _uid: uid,
            _component: component,
            _props: props,
            _context: context,
            _isMounted: false,
            _isUnmounted: false,
            _isSetup: false,
            state: null,
            props: { ...props },
            attrs: { ...props },
            slots: {},
            refs: {},
            emit: () => { },
            render: null
        };

        return instance;
    };

    /**
     * Sets up a component instance
     * @param {Object} instance - Component instance
     */
    const setupComponent = (instance) => {
        const { _component: component, props } = instance;

        // Skip if already set up
        if (instance._isSetup) {
            return;
        }

        // Mark as set up
        instance._isSetup = true;

        // Call setup function if available
        if (component.setup) {
            const setupResult = component.setup(props, {
                attrs: instance.attrs,
                slots: instance.slots,
                emit: instance.emit,
                expose: () => { }
            });

            // If setup returns a render function, use it
            if (typeof setupResult === 'function') {
                instance.render = setupResult;
            } else if (setupResult && typeof setupResult === 'object') {
                // If setup returns an object, use it as the instance state
                instance.state = setupResult;
            }
        }

        // Use render function from component if available
        if (!instance.render && component.render) {
            instance.render = () => component.render.call(instance);
        }

        // Use template function from component if available
        if (!instance.render && component.template) {
            instance.render = () => component.template.call(instance);
        }
    };

    /**
     * Generates a unique ID
     * @returns {string} Unique ID
     */
    const generateUid = () => {
        return Math.random().toString(36).substring(2, 15);
    };

    /**
     * Escapes HTML special characters
     * @param {string} html - HTML string
     * @returns {string} Escaped HTML
     */
    const escapeHtml = (html) => {
        return String(html)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    /**
     * Injects resources into HTML
     * @param {string} html - HTML string
     * @param {Object} context - Render context
     * @returns {string} HTML with injected resources
     */
    const injectResources = (html, context) => {
        const { _styles, _scripts, _links, _metas } = context;

        // Inject styles
        if (_styles.size > 0) {
            const styleHtml = Array.from(_styles)
                .map(style => `<style>${style}</style>`)
                .join('');

            html = html.replace('</head>', `${styleHtml}</head>`);
        }

        // Inject links
        if (_links.size > 0) {
            const linkHtml = Array.from(_links)
                .map(href => `<link rel="stylesheet" href="${href}">`)
                .join('');

            html = html.replace('</head>', `${linkHtml}</head>`);
        }

        // Inject metas
        if (_metas.size > 0) {
            const metaHtml = Array.from(_metas)
                .map(meta => `<meta name="${meta.name}" content="${meta.content}">`)
                .join('');

            html = html.replace('</head>', `${metaHtml}</head>`);
        }

        // Inject scripts
        if (_scripts.size > 0) {
            const scriptHtml = Array.from(_scripts)
                .map(src => `<script src="${src}"></script>`)
                .join('');

            html = html.replace('</body>', `${scriptHtml}</body>`);
        }

        // Inject teleports
        for (const [to, content] of Object.entries(context._teleports)) {
            const teleportTarget = `<div id="${to}"></div>`;
            const teleportReplacement = `<div id="${to}">${content}</div>`;

            html = html.replace(teleportTarget, teleportReplacement);
        }

        return html;
    };

    /**
     * Injects hydration state into HTML
     * @param {string} html - HTML string
     * @param {Object} context - Render context
     * @returns {string} HTML with injected hydration state
     */
    const injectHydrationState = (html, context) => {
        const { _hydrationState } = context;

        if (Object.keys(_hydrationState).length > 0) {
            const stateJson = serializer(_hydrationState);
            const stateScript = `<script>window.__KALXJS_INITIAL_STATE__ = ${stateJson};</script>`;

            html = html.replace('</body>', `${stateScript}</body>`);
        }

        return html;
    };

    /**
     * Serializes component state
     * @param {Object} state - Component state
     * @returns {Object} Serialized state
     */
    const serializeState = (state) => {
        const serialized = {};

        for (const [key, value] of Object.entries(state)) {
            // Handle ref objects
            if (value && typeof value === 'object' && 'value' in value) {
                serialized[key] = value.value;
            } else {
                serialized[key] = value;
            }
        }

        return serialized;
    };

    /**
     * Gets a cache key for a render
     * @param {Object} app - KalxJS app
     * @param {Object} context - Render context
     * @returns {string|null} Cache key
     */
    const getCacheKey = (app, context) => {
        if (!context.cacheable) {
            return null;
        }

        const { url, query, params } = context;

        return `${url || ''}:${JSON.stringify(query || {})}:${JSON.stringify(params || {})}`;
    };

    return {
        renderToString,
        renderToStream,
        renderComponentToString,
        renderComponentToStream,
        clearCache: () => cache.clear()
    };
}

/**
 * Creates a client hydration function
 * @param {Object} options - Hydration options
 * @returns {Function} Hydration function
 */
function createClientHydration(options = {}) {
    const {
        deserializer = JSON.parse
    } = options;

    /**
     * Hydrates a server-rendered app
     * @param {Object} app - KalxJS app
     * @param {string|Element} container - Container element or selector
     * @returns {Object} Hydrated app
     */
    return function hydrate(app, container) {
        // Get the container element
        const containerElement = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!containerElement) {
            throw new Error(`Container element not found: ${container}`);
        }

        // Get the initial state
        const initialState = window.__KALXJS_INITIAL_STATE__ || {};

        // Add hydration flag to the app
        app._hydrate = true;

        // Add initial state to the app
        app._initialState = deserializer(JSON.stringify(initialState));

        // Mount the app
        return app.mount(containerElement);
    };
}

/**
 * Creates an SSR plugin for KalxJS
 * @param {Object} options - SSR plugin options
 * @returns {Object} SSR plugin
 */
function createSSRPlugin(options = {}) {
    return {
        name: 'ssr',
        install(app) {
            // Create server renderer
            const serverRenderer = createServerRenderer(options);

            // Create client hydration
            const clientHydration = createClientHydration(options);

            // Add SSR utilities to the app
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};
            app.config.globalProperties.$ssr = {
                renderToString: serverRenderer.renderToString,
                renderToStream: serverRenderer.renderToStream,
                hydrate: clientHydration
            };

            // Add SSR flag to the app
            app._isSSR = typeof window === 'undefined';

            // Add hydrate method to the app
            app.hydrate = (container) => clientHydration(app, container);

            // Add SSR utilities to the window
            if (typeof window !== 'undefined') {
                window.$kalxjs = window.$kalxjs || {};
                window.$kalxjs.ssr = {
                    hydrate: clientHydration
                };
            }
        }
    };
}

// @kalxjs/core - Animation system

/**
 * Animation easing functions
 */
const EASING = {
    LINEAR: t => t,
    EASE_IN: t => t * t,
    EASE_OUT: t => t * (2 - t),
    EASE_IN_OUT: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    ELASTIC: t => t === 0 ? 0 : t === 1 ? 1 : (t < 0.5
        ? 0.5 * Math.sin(13 * Math.PI * t) * Math.pow(2, 10 * (2 * t - 1))
        : 0.5 * Math.sin(-13 * Math.PI * t) * Math.pow(2, -10 * (2 * t - 1)) + 1),
    BOUNCE: t => {
        const a = 7.5625;
        const b = 2.75;

        if (t < 1 / b) {
            return a * t * t;
        } else if (t < 2 / b) {
            return a * (t -= 1.5 / b) * t + 0.75;
        } else if (t < 2.5 / b) {
            return a * (t -= 2.25 / b) * t + 0.9375;
        } else {
            return a * (t -= 2.625 / b) * t + 0.984375;
        }
    }
};

/**
 * Animation directions
 */
const DIRECTION = {
    NORMAL: 'normal',
    REVERSE: 'reverse',
    ALTERNATE: 'alternate',
    ALTERNATE_REVERSE: 'alternate-reverse'
};

/**
 * Animation fill modes
 */
const FILL_MODE = {
    NONE: 'none',
    FORWARDS: 'forwards',
    BACKWARDS: 'backwards',
    BOTH: 'both'
};

/**
 * Creates an animation timeline
 * @param {Object} options - Timeline options
 * @returns {Object} Animation timeline
 */
function createTimeline(options = {}) {
    const {
        duration = 1000,
        delay = 0,
        easing = EASING.LINEAR,
        iterations = 1,
        direction = DIRECTION.NORMAL,
        fillMode = FILL_MODE.NONE,
        autoplay = false,
        onStart = null,
        onUpdate = null,
        onComplete = null
    } = options;

    // Timeline state
    const state = reactive({
        isPlaying: false,
        isPaused: false,
        isCompleted: false,
        currentTime: 0,
        progress: 0,
        iteration: 0
    });

    // Animation tracks
    const tracks = [];

    // Animation frame request ID
    let animationFrameId = null;

    // Start time
    let startTime = 0;

    // Pause time
    let pauseTime = 0;

    /**
     * Adds a track to the timeline
     * @param {Object} track - Animation track
     * @returns {Object} Animation timeline
     */
    const add = (track) => {
        tracks.push(track);
        return timeline;
    };

    /**
     * Starts the timeline
     * @returns {Object} Animation timeline
     */
    const play = () => {
        if (state.isPlaying && !state.isPaused) {
            return timeline;
        }

        if (state.isPaused) {
            // Resume from pause
            state.isPaused = false;
            startTime = performance.now() - pauseTime;
        } else {
            // Start from beginning
            state.isPlaying = true;
            state.isCompleted = false;
            state.currentTime = 0;
            state.progress = 0;
            state.iteration = 0;

            startTime = performance.now() + delay;

            // Call onStart callback
            if (onStart) {
                onStart();
            }
        }

        // Start animation loop
        animationFrameId = requestAnimationFrame(update);

        return timeline;
    };

    /**
     * Pauses the timeline
     * @returns {Object} Animation timeline
     */
    const pause = () => {
        if (!state.isPlaying || state.isPaused) {
            return timeline;
        }

        state.isPaused = true;
        pauseTime = state.currentTime;

        // Stop animation loop
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        return timeline;
    };

    /**
     * Stops the timeline
     * @param {boolean} goToEnd - Whether to go to the end of the animation
     * @returns {Object} Animation timeline
     */
    const stop = (goToEnd = false) => {
        if (!state.isPlaying) {
            return timeline;
        }

        state.isPlaying = false;
        state.isPaused = false;

        // Stop animation loop
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        if (goToEnd) {
            // Go to the end of the animation
            state.currentTime = duration;
            state.progress = 1;
            state.iteration = iterations;
            state.isCompleted = true;

            // Update tracks
            updateTracks(1);

            // Call onComplete callback
            if (onComplete) {
                onComplete();
            }
        } else {
            // Reset animation
            state.currentTime = 0;
            state.progress = 0;
            state.iteration = 0;
            state.isCompleted = false;

            // Update tracks
            updateTracks(0);
        }

        return timeline;
    };

    /**
     * Seeks to a specific time in the timeline
     * @param {number} time - Time to seek to
     * @returns {Object} Animation timeline
     */
    const seek = (time) => {
        time = Math.max(0, Math.min(time, duration));

        state.currentTime = time;
        state.progress = time / duration;

        // Update tracks
        updateTracks(state.progress);

        return timeline;
    };

    /**
     * Updates the timeline
     * @param {number} timestamp - Current timestamp
     */
    const update = (timestamp) => {
        if (!state.isPlaying || state.isPaused) {
            return;
        }

        // Calculate current time
        let currentTime = timestamp - startTime;

        // Handle delay
        if (currentTime < 0) {
            animationFrameId = requestAnimationFrame(update);
            return;
        }

        // Calculate progress
        let progress = currentTime / duration;
        let iteration = Math.floor(progress);

        // Handle iterations
        if (iterations !== Infinity) {
            if (iteration >= iterations) {
                // Animation completed
                progress = 1;
                iteration = iterations - 1;
                state.isCompleted = true;
                state.isPlaying = false;
            } else {
                // Animation still running
                progress = progress % 1;
            }
        } else {
            // Infinite animation
            progress = progress % 1;
        }

        // Handle direction
        let effectiveProgress = progress;

        switch (direction) {
            case DIRECTION.REVERSE:
                effectiveProgress = 1 - progress;
                break;

            case DIRECTION.ALTERNATE:
                if (iteration % 2 === 1) {
                    effectiveProgress = 1 - progress;
                }
                break;

            case DIRECTION.ALTERNATE_REVERSE:
                if (iteration % 2 === 0) {
                    effectiveProgress = 1 - progress;
                }
                break;
        }

        // Apply easing
        effectiveProgress = easing(effectiveProgress);

        // Update state
        state.currentTime = currentTime;
        state.progress = effectiveProgress;
        state.iteration = iteration;

        // Update tracks
        updateTracks(effectiveProgress);

        // Call onUpdate callback
        if (onUpdate) {
            onUpdate(effectiveProgress, currentTime);
        }

        // Continue animation loop or complete
        if (state.isCompleted) {
            // Call onComplete callback
            if (onComplete) {
                onComplete();
            }
        } else {
            animationFrameId = requestAnimationFrame(update);
        }
    };

    /**
     * Updates all tracks
     * @param {number} progress - Current progress
     */
    const updateTracks = (progress) => {
        for (const track of tracks) {
            track.update(progress);
        }
    };

    // Create timeline object
    const timeline = {
        state,
        add,
        play,
        pause,
        stop,
        seek
    };

    // Start automatically if autoplay is enabled
    if (autoplay) {
        play();
    }

    return timeline;
}

/**
 * Creates an animation track
 * @param {Object} target - Target object
 * @param {string} property - Property to animate
 * @param {Array} keyframes - Animation keyframes
 * @param {Object} options - Track options
 * @returns {Object} Animation track
 */
function createTrack(target, property, keyframes, options = {}) {
    const {
        easing = EASING.LINEAR,
        interpolate = defaultInterpolate
    } = options;

    // Sort keyframes by time
    keyframes.sort((a, b) => a.time - b.time);

    // Ensure keyframes span from 0 to 1
    if (keyframes[0].time !== 0) {
        keyframes.unshift({ time: 0, value: keyframes[0].value });
    }

    if (keyframes[keyframes.length - 1].time !== 1) {
        keyframes.push({ time: 1, value: keyframes[keyframes.length - 1].value });
    }

    /**
     * Updates the track
     * @param {number} progress - Current progress
     */
    const update = (progress) => {
        // Find the keyframes that bracket the current progress
        let startFrame = keyframes[0];
        let endFrame = keyframes[keyframes.length - 1];

        for (let i = 0; i < keyframes.length - 1; i++) {
            if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
                startFrame = keyframes[i];
                endFrame = keyframes[i + 1];
                break;
            }
        }

        // Calculate local progress between the two keyframes
        const localProgress = (progress - startFrame.time) / (endFrame.time - startFrame.time);

        // Apply easing to local progress
        const easedProgress = easing(localProgress);

        // Interpolate between the two keyframe values
        const value = interpolate(startFrame.value, endFrame.value, easedProgress);

        // Update the target property
        if (typeof target === 'function') {
            target(value);
        } else if (typeof property === 'function') {
            property(target, value);
        } else if (target && property) {
            if (property.includes('.')) {
                // Handle nested properties
                const parts = property.split('.');
                let current = target;

                for (let i = 0; i < parts.length - 1; i++) {
                    current = current[parts[i]];

                    if (!current) {
                        return;
                    }
                }

                current[parts[parts.length - 1]] = value;
            } else {
                // Handle direct properties
                target[property] = value;
            }
        }
    };

    return {
        update
    };
}

/**
 * Default interpolation function
 * @param {any} start - Start value
 * @param {any} end - End value
 * @param {number} progress - Current progress
 * @returns {any} Interpolated value
 */
function defaultInterpolate(start, end, progress) {
    // Handle numbers
    if (typeof start === 'number' && typeof end === 'number') {
        return start + (end - start) * progress;
    }

    // Handle colors
    if (isColor(start) && isColor(end)) {
        return interpolateColor(start, end, progress);
    }

    // Handle arrays
    if (Array.isArray(start) && Array.isArray(end)) {
        return interpolateArray(start, end, progress);
    }

    // Handle objects
    if (isObject(start) && isObject(end)) {
        return interpolateObject(start, end, progress);
    }

    // Handle strings
    if (typeof start === 'string' && typeof end === 'string') {
        // Check if strings are numbers
        const startNum = parseFloat(start);
        const endNum = parseFloat(end);

        if (!isNaN(startNum) && !isNaN(endNum)) {
            const result = startNum + (endNum - startNum) * progress;

            // Preserve original format
            if (start.endsWith('px')) {
                return `${result}px`;
            } else if (start.endsWith('%')) {
                return `${result}%`;
            } else if (start.endsWith('em')) {
                return `${result}em`;
            } else if (start.endsWith('rem')) {
                return `${result}rem`;
            } else if (start.endsWith('vw')) {
                return `${result}vw`;
            } else if (start.endsWith('vh')) {
                return `${result}vh`;
            } else if (start.endsWith('deg')) {
                return `${result}deg`;
            } else if (start.endsWith('rad')) {
                return `${result}rad`;
            } else if (start.endsWith('turn')) {
                return `${result}turn`;
            } else if (start.endsWith('s')) {
                return `${result}s`;
            } else if (start.endsWith('ms')) {
                return `${result}ms`;
            }

            return result.toString();
        }

        // For non-numeric strings, just return the end value at the end
        return progress < 1 ? start : end;
    }

    // For other types, just return the end value at the end
    return progress < 1 ? start : end;
}

/**
 * Checks if a value is a color
 * @param {any} value - Value to check
 * @returns {boolean} Whether the value is a color
 */
function isColor(value) {
    if (typeof value !== 'string') {
        return false;
    }

    // Check for hex color
    if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
        return true;
    }

    // Check for rgb/rgba color
    if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(value) ||
        /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i.test(value)) {
        return true;
    }

    // Check for hsl/hsla color
    if (/^hsl\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*\)$/i.test(value) ||
        /^hsla\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*,\s*[\d.]+\s*\)$/i.test(value)) {
        return true;
    }

    // Check for named color
    const namedColors = [
        'transparent', 'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure',
        'beige', 'bisque', 'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown',
        'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue',
        'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod',
        'darkgray', 'darkgreen', 'darkkhaki', 'darkmagenta', 'darkolivegreen',
        'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
        'darkslateblue', 'darkslategray', 'darkturquoise', 'darkviolet', 'deeppink',
        'deepskyblue', 'dimgray', 'dodgerblue', 'firebrick', 'floralwhite',
        'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
        'gray', 'green', 'greenyellow', 'honeydew', 'hotpink', 'indianred', 'indigo',
        'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon',
        'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray',
        'lightgreen', 'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue',
        'lightslategray', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen',
        'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid',
        'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen',
        'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose',
        'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
        'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise',
        'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum',
        'powderblue', 'purple', 'rebeccapurple', 'red', 'rosybrown', 'royalblue',
        'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna',
        'silver', 'skyblue', 'slateblue', 'slategray', 'snow', 'springgreen',
        'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet',
        'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen'
    ];

    return namedColors.includes(value.toLowerCase());
}

/**
 * Interpolates between two colors
 * @param {string} start - Start color
 * @param {string} end - End color
 * @param {number} progress - Current progress
 * @returns {string} Interpolated color
 */
function interpolateColor(start, end, progress) {
    // Convert colors to RGB
    const startRGB = parseColor(start);
    const endRGB = parseColor(end);

    // Interpolate RGB values
    const r = Math.round(startRGB.r + (endRGB.r - startRGB.r) * progress);
    const g = Math.round(startRGB.g + (endRGB.g - startRGB.g) * progress);
    const b = Math.round(startRGB.b + (endRGB.b - startRGB.b) * progress);
    const a = startRGB.a + (endRGB.a - startRGB.a) * progress;

    // Return color in the same format as the end color
    if (end.startsWith('#')) {
        return rgbToHex(r, g, b);
    } else if (end.startsWith('rgba')) {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    } else if (end.startsWith('rgb')) {
        return `rgb(${r}, ${g}, ${b})`;
    } else if (end.startsWith('hsla')) {
        const hsla = rgbToHsl(r, g, b, a);
        return `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${hsla.a})`;
    } else if (end.startsWith('hsl')) {
        const hsl = rgbToHsl(r, g, b);
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }

    return rgbToHex(r, g, b);
}

/**
 * Parses a color string to RGB values
 * @param {string} color - Color string
 * @returns {Object} RGB values
 */
function parseColor(color) {
    // Handle hex color
    if (color.startsWith('#')) {
        return hexToRgb(color);
    }

    // Handle rgb/rgba color
    if (color.startsWith('rgb')) {
        const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/i);

        if (match) {
            return {
                r: parseInt(match[1], 10),
                g: parseInt(match[2], 10),
                b: parseInt(match[3], 10),
                a: match[4] ? parseFloat(match[4]) : 1
            };
        }
    }

    // Handle hsl/hsla color
    if (color.startsWith('hsl')) {
        const match = color.match(/hsla?\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/i);

        if (match) {
            return hslToRgb(
                parseInt(match[1], 10),
                parseFloat(match[2]),
                parseFloat(match[3]),
                match[4] ? parseFloat(match[4]) : 1
            );
        }
    }

    // Handle named color
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;

    return {
        r: data[0],
        g: data[1],
        b: data[2],
        a: data[3] / 255
    };
}

/**
 * Converts hex color to RGB
 * @param {string} hex - Hex color
 * @returns {Object} RGB values
 */
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: 1
    } : { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Converts RGB to hex color
 * @param {number} r - Red component
 * @param {number} g - Green component
 * @param {number} b - Blue component
 * @returns {string} Hex color
 */
function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Converts HSL to RGB
 * @param {number} h - Hue
 * @param {number} s - Saturation
 * @param {number} l - Lightness
 * @param {number} a - Alpha
 * @returns {Object} RGB values
 */
function hslToRgb(h, s, l, a = 1) {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
        a
    };
}

/**
 * Converts RGB to HSL
 * @param {number} r - Red component
 * @param {number} g - Green component
 * @param {number} b - Blue component
 * @param {number} a - Alpha
 * @returns {Object} HSL values
 */
function rgbToHsl(r, g, b, a = 1) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
        a
    };
}

/**
 * Interpolates between two arrays
 * @param {Array} start - Start array
 * @param {Array} end - End array
 * @param {number} progress - Current progress
 * @returns {Array} Interpolated array
 */
function interpolateArray(start, end, progress) {
    const result = [];
    const length = Math.max(start.length, end.length);

    for (let i = 0; i < length; i++) {
        const startValue = i < start.length ? start[i] : start[start.length - 1];
        const endValue = i < end.length ? end[i] : end[end.length - 1];

        result.push(defaultInterpolate(startValue, endValue, progress));
    }

    return result;
}

/**
 * Checks if a value is an object
 * @param {any} value - Value to check
 * @returns {boolean} Whether the value is an object
 */
function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Interpolates between two objects
 * @param {Object} start - Start object
 * @param {Object} end - End object
 * @param {number} progress - Current progress
 * @returns {Object} Interpolated object
 */
function interpolateObject(start, end, progress) {
    const result = {};

    // Interpolate properties from start object
    for (const key in start) {
        if (key in end) {
            result[key] = defaultInterpolate(start[key], end[key], progress);
        } else {
            result[key] = start[key];
        }
    }

    // Add properties from end object that are not in start object
    for (const key in end) {
        if (!(key in start)) {
            result[key] = end[key];
        }
    }

    return result;
}

/**
 * Creates a spring animation
 * @param {Object} options - Spring options
 * @returns {Object} Spring animation
 */
function createSpring(options = {}) {
    const {
        stiffness = 100,
        damping = 10,
        mass = 1,
        initialVelocity = 0,
        precision = 0.01,
        onUpdate = null,
        onComplete = null
    } = options;

    // Spring state
    const state = reactive({
        value: 0,
        target: 0,
        velocity: initialVelocity,
        isAnimating: false
    });

    // Animation frame request ID
    let animationFrameId = null;

    // Last time
    let lastTime = 0;

    /**
     * Sets the target value
     * @param {number} target - Target value
     * @returns {Object} Spring animation
     */
    const setTarget = (target) => {
        state.target = target;

        if (!state.isAnimating) {
            state.isAnimating = true;
            lastTime = performance.now();
            animationFrameId = requestAnimationFrame(update);
        }

        return spring;
    };

    /**
     * Sets the current value
     * @param {number} value - Current value
     * @returns {Object} Spring animation
     */
    const setValue = (value) => {
        state.value = value;

        // Call onUpdate callback
        if (onUpdate) {
            onUpdate(state.value);
        }

        return spring;
    };

    /**
     * Updates the spring
     * @param {number} timestamp - Current timestamp
     */
    const update = (timestamp) => {
        if (!state.isAnimating) {
            return;
        }

        // Calculate delta time
        const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        // Calculate spring force
        const springForce = stiffness * (state.target - state.value);
        const dampingForce = damping * state.velocity;
        const force = (springForce - dampingForce) / mass;

        // Update velocity and position
        state.velocity += force * deltaTime;
        state.value += state.velocity * deltaTime;

        // Call onUpdate callback
        if (onUpdate) {
            onUpdate(state.value);
        }

        // Check if animation is complete
        if (Math.abs(state.velocity) < precision && Math.abs(state.target - state.value) < precision) {
            state.value = state.target;
            state.velocity = 0;
            state.isAnimating = false;

            // Call onUpdate callback one last time
            if (onUpdate) {
                onUpdate(state.value);
            }

            // Call onComplete callback
            if (onComplete) {
                onComplete();
            }

            return;
        }

        // Continue animation loop
        animationFrameId = requestAnimationFrame(update);
    };

    /**
     * Stops the spring animation
     * @returns {Object} Spring animation
     */
    const stop = () => {
        if (state.isAnimating) {
            state.isAnimating = false;

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        return spring;
    };

    // Create spring object
    const spring = {
        state,
        setTarget,
        setValue,
        stop
    };

    return spring;
}

/**
 * Creates a physics-based animation
 * @param {Object} options - Physics options
 * @returns {Object} Physics animation
 */
function createPhysics(options = {}) {
    const {
        gravity = 9.8,
        friction = 0.1,
        bounce = 0.5,
        mass = 1,
        initialVelocity = { x: 0, y: 0 },
        initialPosition = { x: 0, y: 0 },
        bounds = { x: { min: -Infinity, max: Infinity }, y: { min: -Infinity, max: Infinity } },
        onUpdate = null,
        onCollision = null
    } = options;

    // Physics state
    const state = reactive({
        position: { ...initialPosition },
        velocity: { ...initialVelocity },
        isAnimating: false
    });

    // Animation frame request ID
    let animationFrameId = null;

    // Last time
    let lastTime = 0;

    /**
     * Starts the physics animation
     * @returns {Object} Physics animation
     */
    const start = () => {
        if (!state.isAnimating) {
            state.isAnimating = true;
            lastTime = performance.now();
            animationFrameId = requestAnimationFrame(update);
        }

        return physics;
    };

    /**
     * Stops the physics animation
     * @returns {Object} Physics animation
     */
    const stop = () => {
        if (state.isAnimating) {
            state.isAnimating = false;

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        return physics;
    };

    /**
     * Applies a force to the object
     * @param {Object} force - Force vector
     * @returns {Object} Physics animation
     */
    const applyForce = (force) => {
        state.velocity.x += force.x / mass;
        state.velocity.y += force.y / mass;

        return physics;
    };

    /**
     * Sets the position of the object
     * @param {Object} position - Position vector
     * @returns {Object} Physics animation
     */
    const setPosition = (position) => {
        state.position = { ...position };

        // Call onUpdate callback
        if (onUpdate) {
            onUpdate(state.position, state.velocity);
        }

        return physics;
    };

    /**
     * Sets the velocity of the object
     * @param {Object} velocity - Velocity vector
     * @returns {Object} Physics animation
     */
    const setVelocity = (velocity) => {
        state.velocity = { ...velocity };

        return physics;
    };

    /**
     * Updates the physics
     * @param {number} timestamp - Current timestamp
     */
    const update = (timestamp) => {
        if (!state.isAnimating) {
            return;
        }

        // Calculate delta time
        const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        // Apply gravity
        state.velocity.y += gravity * deltaTime;

        // Apply friction
        state.velocity.x *= (1 - friction * deltaTime);
        state.velocity.y *= (1 - friction * deltaTime);

        // Update position
        state.position.x += state.velocity.x * deltaTime;
        state.position.y += state.velocity.y * deltaTime;

        // Check bounds
        let collided = false;

        if (state.position.x < bounds.x.min) {
            state.position.x = bounds.x.min;
            state.velocity.x = -state.velocity.x * bounce;
            collided = true;
        } else if (state.position.x > bounds.x.max) {
            state.position.x = bounds.x.max;
            state.velocity.x = -state.velocity.x * bounce;
            collided = true;
        }

        if (state.position.y < bounds.y.min) {
            state.position.y = bounds.y.min;
            state.velocity.y = -state.velocity.y * bounce;
            collided = true;
        } else if (state.position.y > bounds.y.max) {
            state.position.y = bounds.y.max;
            state.velocity.y = -state.velocity.y * bounce;
            collided = true;
        }

        // Call onCollision callback
        if (collided && onCollision) {
            onCollision(state.position, state.velocity);
        }

        // Call onUpdate callback
        if (onUpdate) {
            onUpdate(state.position, state.velocity);
        }

        // Continue animation loop
        animationFrameId = requestAnimationFrame(update);
    };

    // Create physics object
    const physics = {
        state,
        start,
        stop,
        applyForce,
        setPosition,
        setVelocity
    };

    return physics;
}

/**
 * Creates an animation plugin for KalxJS
 * @returns {Object} Animation plugin
 */
function createAnimationPlugin() {
    return {
        name: 'animation',
        install(app) {
            // Add animation utilities to the app
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};
            app.config.globalProperties.$animation = {
                createTimeline,
                createTrack,
                createSpring,
                createPhysics,
                EASING,
                DIRECTION,
                FILL_MODE
            };

            // Add animation utilities to the window
            if (typeof window !== 'undefined') {
                window.$kalxjs = window.$kalxjs || {};
                window.$kalxjs.animation = {
                    createTimeline,
                    createTrack,
                    createSpring,
                    createPhysics,
                    EASING,
                    DIRECTION,
                    FILL_MODE
                };
            }

            // Register animation components
            app.component('Transition', {
                props: {
                    name: String,
                    appear: Boolean,
                    mode: String,
                    duration: [Number, Object],
                    easing: [String, Function],
                    onBeforeEnter: Function,
                    onEnter: Function,
                    onAfterEnter: Function,
                    onEnterCancelled: Function,
                    onBeforeLeave: Function,
                    onLeave: Function,
                    onAfterLeave: Function,
                    onLeaveCancelled: Function
                },
                setup(props, { slots }) {
                    // Implementation of transition component
                    return () => {
                        const children = slots.default ? slots.default() : [];
                        return children;
                    };
                }
            });

            app.component('TransitionGroup', {
                props: {
                    tag: {
                        type: String,
                        default: 'div'
                    },
                    moveClass: String,
                    name: String,
                    appear: Boolean,
                    duration: [Number, Object],
                    easing: [String, Function]
                },
                setup(props, { slots }) {
                    // Implementation of transition group component
                    return () => {
                        const children = slots.default ? slots.default() : [];
                        return h(props.tag, {}, children);
                    };
                }
            });

            app.component('AnimatedValue', {
                props: {
                    value: {
                        required: true
                    },
                    duration: {
                        type: Number,
                        default: 300
                    },
                    easing: {
                        type: [String, Function],
                        default: 'ease-in-out'
                    },
                    spring: {
                        type: Boolean,
                        default: false
                    },
                    stiffness: {
                        type: Number,
                        default: 100
                    },
                    damping: {
                        type: Number,
                        default: 10
                    },
                    precision: {
                        type: Number,
                        default: 0.01
                    }
                },
                setup(props, { slots }) {
                    const currentValue = ref(props.value);
                    let animation = null;

                    // Watch for value changes
                    watch(() => props.value, (newValue) => {
                        if (props.spring) {
                            // Use spring animation
                            if (!animation) {
                                animation = createSpring({
                                    stiffness: props.stiffness,
                                    damping: props.damping,
                                    precision: props.precision,
                                    onUpdate: (value) => {
                                        currentValue.value = value;
                                    }
                                });
                            }

                            animation.setTarget(newValue);
                        } else {
                            // Use timeline animation
                            if (animation) {
                                animation.stop();
                            }

                            const startValue = currentValue.value;

                            animation = createTimeline({
                                duration: props.duration,
                                easing: typeof props.easing === 'string' ? EASING[props.easing.toUpperCase()] || EASING.LINEAR : props.easing
                            });

                            animation.add(createTrack(
                                (value) => { currentValue.value = value; },
                                null,
                                [
                                    { time: 0, value: startValue },
                                    { time: 1, value: newValue }
                                ]
                            ));

                            animation.play();
                        }
                    }, { immediate: true });

                    // Clean up on unmount
                    onUnmounted(() => {
                        if (animation) {
                            animation.stop();
                        }
                    });

                    return () => {
                        // Default slot with current value
                        if (slots.default) {
                            return slots.default(currentValue.value);
                        }

                        // Default rendering
                        return h('span', {}, [currentValue.value.toString()]);
                    };
                }
            });
        }
    };
}

// Virtual DOM implementation

// Create text element
function createTextElement(text) {
    return {
        tag: 'TEXT_ELEMENT',
        props: { nodeValue: text },
        children: []
    };
}

// Create actual DOM from virtual DOM
function createDOMElement(vnode) {
    if (vnode.tag === 'TEXT_ELEMENT') {
        return document.createTextNode(vnode.props.nodeValue);
    }

    const element = document.createElement(vnode.tag);

    // Set properties
    for (const key in vnode.props) {
        if (key === 'children') continue;

        if (key.startsWith('on')) {
            // Handle events
            const eventType = key.toLowerCase().substring(2);
            element.addEventListener(eventType, vnode.props[key]);
        } else if (key === 'style' && typeof vnode.props[key] === 'object') {
            // Handle style object
            const styleObj = vnode.props[key];
            for (const styleKey in styleObj) {
                element.style[styleKey] = styleObj[styleKey];
            }
        } else {
            // Handle regular props
            element[key] = vnode.props[key];
        }
    }

    // Create and append children
    vnode.children.forEach(child => {
        element.appendChild(createDOMElement(child));
    });

    return element;
}

// packages/core/src/lifecycle/index.js

/**
 * Lifecycle hooks system for kalxjs components
 * This module provides the lifecycle hook functionality to components
 */

/**
 * Available lifecycle hooks in a kalxjs component
 */
const LifecycleHooks = {
    BEFORE_CREATE: 'beforeCreate',
    CREATED: 'created',
    BEFORE_MOUNT: 'beforeMount',
    MOUNTED: 'mounted',
    BEFORE_UPDATE: 'beforeUpdate',
    UPDATED: 'updated',
    BEFORE_UNMOUNT: 'beforeUnmount',
    UNMOUNTED: 'unmounted'
};

/**
 * Register lifecycle hooks for a component
 * @param {Object} component - Component instance
 * @param {Object} options - Component options containing lifecycle hooks
 */
function registerLifecycleHooks(component, options) {
    for (const hook in LifecycleHooks) {
        const hookName = LifecycleHooks[hook];
        if (options[hookName]) {
            component[hookName] = options[hookName].bind(component);
        } else {
            component[hookName] = () => { };
        }
    }
}

/**
 * Calls a lifecycle hook on a component
 * @param {Object} component - Component instance
 * @param {string} hook - Hook name
 * @param {Array} args - Arguments to pass to the hook
 */
function callHook(component, hook, args = []) {
    // Handle both component options style and direct method style
    const handler = component.$options?.[hook] || component[hook];

    if (handler) {
        try {
            return handler.call(component, ...(args || []));
        } catch (error) {
            console.error(`Error in lifecycle hook "${hook}":`, error);
        }
    }
}

/**
 * Creates a mixin to extend component lifecycle hooks
 * @param {Object} hooks - Object containing lifecycle hooks
 * @returns {Object} Mixin object
 */
function createLifecycleMixin(hooks) {
    const mixin = {};

    for (const hook in hooks) {
        if (Object.values(LifecycleHooks).includes(hook)) {
            const originalHook = mixin[hook];
            const mixinHook = hooks[hook];

            mixin[hook] = function (...args) {
                // Call original hook if exists
                if (originalHook) {
                    originalHook.apply(this, args);
                }

                // Call mixin hook
                return mixinHook.apply(this, args);
            };
        }
    }

    return mixin;
}

/**
 * Applies mixins to a component definition
 * @param {Object} componentOptions - Component options
 * @param {Array|Object} mixins - Mixins to apply
 * @returns {Object} Enhanced component options
 */
function applyMixins(componentOptions, mixins) {
    if (!mixins) return componentOptions;

    // Convert single mixin to array
    if (!Array.isArray(mixins)) {
        mixins = [mixins];
    }

    const result = { ...componentOptions };

    // Apply each mixin
    mixins.forEach(mixin => {
        // Merge lifecycle hooks
        for (const hook in LifecycleHooks) {
            const hookName = LifecycleHooks[hook];

            if (mixin[hookName]) {
                const existing = result[hookName];

                if (existing) {
                    // Create function that calls both hooks
                    result[hookName] = function (...args) {
                        mixin[hookName].apply(this, args);
                        existing.apply(this, args);
                    };
                } else {
                    result[hookName] = mixin[hookName];
                }
            }
        }

        // Merge methods
        if (mixin.methods) {
            result.methods = result.methods || {};
            Object.assign(result.methods, mixin.methods);
        }

        // Merge computed properties
        if (mixin.computed) {
            result.computed = result.computed || {};
            Object.assign(result.computed, mixin.computed);
        }
    });

    return result;
}

// Core functionality imports

/**
 * Main entry point for kalxjs framework
 */
function createAppInstance(options) {
    const app = createApp$1(options);

    // Add plugin support
    app.use = function (plugin, options = {}) {
        if (!plugin) return this;

        if (typeof plugin.install === 'function') {
            plugin.install(this, options);
        } else if (typeof plugin === 'function') {
            plugin(this, options);
        }
        return this;
    };

    return app;
}

const kalxjs = {
    // Reactivity system
    reactive: reactive$1,
    ref: ref$1,
    computed: computed$1,
    effect,

    // Virtual DOM
    h: h$1,
    createElement,

    // Component system
    createComponent,
    defineComponent,

    // Composition API
    useReactive,
    useRef,
    useComputed,
    watch: watch$1,
    onMounted: onMounted$1,
    onUnmounted: onUnmounted$1,
    onBeforeUpdate,
    onUpdated,
    getCurrentInstance: getCurrentInstance$1,

    // Additional lifecycle hooks
    onCreated,
    onBeforeMount,
    onBeforeUnmount,
    onErrorCaptured,

    // Utility functions
    customRef,
    readonly,
    writableComputed,
    useLocalStorage,
    useDebounce,
    useThrottle,
    useMouse,

    // Plugin system
    createPlugin,

    // State management
    createStore,
    createModule,
    createStorePlugin,
    createPersistedState,
    defineStore,

    // API integration
    createApi,
    useApi,
    createApiPlugin,

    // Performance optimizations
    memoize,
    memo,
    lazy,
    deferRender,
    createVirtualList,
    createPerformancePlugin,

    // AI capabilities
    createAIManager,
    useAI,
    createAIPlugin,
    AI_MODEL_TYPES,

    // Native bridge
    createNativeBridge,
    useNative,
    createNativePlugin,
    NATIVE_PLATFORMS,
    NATIVE_FEATURES,

    // Testing framework
    createTestRunner,
    createComponentTest,
    createAssertions,
    createTestingPlugin,
    describe,
    test,
    it,

    // Server-side rendering
    createServerRenderer,
    createClientHydration,
    createSSRPlugin,

    // Animation system
    createTimeline,
    createTrack,
    createSpring,
    createPhysics,
    createAnimationPlugin,
    EASING,
    DIRECTION,
    FILL_MODE,

    // Version
    version: '2.0.0',

    /**
     * Creates a new kalxjs application
     * @param {Object} options - Application options
     * @returns {Object} Application instance
     */
    createApp(options) {
        return createApp$1(options);
    }
};

export { AI_MODEL_TYPES, DIRECTION, EASING, FILL_MODE, LifecycleHooks, NATIVE_FEATURES, NATIVE_PLATFORMS, PluginManager, TEST_TYPES, applyMixins, callHook, computed$1 as computed, createAIManager, createAIPlugin, createAnimationPlugin, createApi, createApiPlugin, createAppInstance as createApp, createAssertions, createClientHydration, createComponent, createComponentTest, createDOMElement, createElement, createLifecycleMixin, createModule, createNativeBridge, createNativePlugin, createPerformancePlugin, createPersistedState, createPhysics, createPlugin, createSSRPlugin, createServerRenderer, createSpring, createStore, createStorePlugin, createTestRunner, createTestingPlugin, createTextElement, createTimeline, createTrack, createVirtualList, customRef, kalxjs as default, deferRender, defineComponent, defineStore, describe, effect, getCurrentInstance$1 as getCurrentInstance, h$1 as h, it, lazy, memo, memoize, onBeforeMount, onBeforeUnmount, onBeforeUpdate, onCreated, onErrorCaptured, onMounted$1 as onMounted, onUnmounted$1 as onUnmounted, onUpdated, only, reactive$1 as reactive, readonly, ref$1 as ref, registerLifecycleHooks, setCurrentInstance, skip, test, updateElement, useAI, useApi, useComputed, useDebounce, useLocalStorage, useMouse, useNative, useReactive, useRef, useThrottle, watch$1 as watch, writableComputed };
//# sourceMappingURL=kalxjs.esm.js.map
