// @kalxjs/core - Directives System
// This file provides the directives system for KalxJS, similar to Vue but with enhancements

/**
 * Directives Registry - Stores all built-in and custom directives
 */
class DirectivesRegistry {
    constructor() {
        this.directives = new Map();
        this.registerBuiltInDirectives();
    }

    /**
     * Register a directive
     * @param {string} name - Directive name without the k- prefix
     * @param {Object} definition - Directive definition object
     */
    register(name, definition) {
        this.directives.set(name, definition);
        console.log(`Registered directive: k-${name}`);
    }

    /**
     * Get a directive by name
     * @param {string} name - Directive name without the k- prefix
     * @returns {Object|null} Directive definition or null if not found
     */
    get(name) {
        return this.directives.get(name) || null;
    }

    /**
     * Check if a directive exists
     * @param {string} name - Directive name without the k- prefix
     * @returns {boolean} True if the directive exists
     */
    has(name) {
        return this.directives.has(name);
    }

    /**
     * Register all built-in directives
     * @private
     */
    registerBuiltInDirectives() {
        // Register all directives
        this.registerBindDirective();
        this.registerModelDirective();
        this.registerOnDirective();
        this.registerSlotDirective();
        this.registerPreDirective();
        this.registerOnceDirective();
        this.registerMemoDirective();
        this.registerCloakDirective();

        // k-text directive
        this.register('text', {
            name: 'text',
            description: 'Update the element\'s text content',
            expects: 'string',
            process: (el, value, context) => {
                el.textContent = value !== undefined ? String(value) : '';
            }
        });

        // k-html directive
        this.register('html', {
            name: 'html',
            description: 'Update the element\'s innerHTML',
            expects: 'string',
            process: (el, value, context) => {
                el.innerHTML = value !== undefined ? String(value) : '';
            },
            security: 'Dynamically rendering arbitrary HTML can be dangerous. Only use on trusted content.'
        });

        // k-show directive
        this.register('show', {
            name: 'show',
            description: 'Toggle the element\'s visibility based on expression value',
            expects: 'any',
            process: (el, value, context) => {
                el.style.display = value ? '' : 'none';
            }
        });

        // k-if directive (handled during template compilation)
        this.register('if', {
            name: 'if',
            description: 'Conditionally render an element based on expression value',
            expects: 'any',
            // This is primarily handled during template compilation
            process: (el, value, context) => {
                // Runtime fallback - hide element if condition is false
                if (!value) {
                    el.style.display = 'none';
                    el.setAttribute('k-if-active', 'false');
                } else {
                    el.style.display = '';
                    el.setAttribute('k-if-active', 'true');
                }
            }
        });

        // k-else directive (handled during template compilation)
        this.register('else', {
            name: 'else',
            description: 'Denote the "else block" for k-if',
            expects: null,
            // This is primarily handled during template compilation
            process: (el, value, context) => {
                const previousEl = el.previousElementSibling;
                if (!previousEl || !previousEl.hasAttribute('k-if-active')) {
                    console.warn('k-else used without preceding k-if element');
                    return;
                }

                const ifActive = previousEl.getAttribute('k-if-active') === 'true';
                el.style.display = ifActive ? 'none' : '';
            }
        });

        // k-else-if directive (handled during template compilation)
        this.register('else-if', {
            name: 'else-if',
            description: 'Denote the "else if block" for k-if',
            expects: 'any',
            // This is primarily handled during template compilation
            process: (el, value, context) => {
                const previousEl = el.previousElementSibling;
                if (!previousEl ||
                    (!previousEl.hasAttribute('k-if-active') &&
                        !previousEl.hasAttribute('k-else-if-active'))) {
                    console.warn('k-else-if used without preceding k-if or k-else-if element');
                    return;
                }

                const previousActive = previousEl.getAttribute('k-if-active') === 'true' ||
                    previousEl.getAttribute('k-else-if-active') === 'true';

                if (previousActive) {
                    el.style.display = 'none';
                    el.setAttribute('k-else-if-active', 'false');
                } else {
                    const condition = Boolean(value);
                    el.style.display = condition ? '' : 'none';
                    el.setAttribute('k-else-if-active', condition ? 'true' : 'false');
                }
            }
        });

        // k-for directive (handled during template compilation)
        this.register('for', {
            name: 'for',
            description: 'Render the element multiple times based on source data with advanced features',
            expects: 'Array | Object | number | string | Iterable | Promise',
            // This is primarily handled during template compilation
            process: (el, value, context, expression) => {
                // Runtime implementation for dynamic lists
                if (!el.hasAttribute('k-for-template')) {
                    // Store the original template
                    el.setAttribute('k-for-template', el.outerHTML);
                }

                // Parse the expression with enhanced support for different syntaxes
                // Supports: item in items, (item, index) in items, item of items, key, value in object
                const forMatch = expression.match(/^\s*(?:\(?\s*(\w+)(?:\s*,\s*(\w+))?\s*\)?)?\s+(in|of)\s+(\w+(?:\.\w+)*)\s*$/);
                if (!forMatch) {
                    // Try object iteration syntax: (key, value) in object
                    const objectMatch = expression.match(/^\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s+in\s+(\w+(?:\.\w+)*)\s*$/);
                    if (objectMatch) {
                        return this.processObjectForDirective(el, value, context, expression, objectMatch);
                    }

                    // Try range syntax: i in 1..10
                    const rangeMatch = expression.match(/^\s*(\w+)\s+in\s+(\d+)\.\.(\d+)(?:\.\.(\d+))?\s*$/);
                    if (rangeMatch) {
                        return this.processRangeForDirective(el, context, rangeMatch);
                    }

                    // Add a placeholder element with error info
                    el.style.display = 'none';
                    const errorEl = document.createElement('div');
                    errorEl.className = 'k-for-error';
                    errorEl.textContent = `Invalid k-for expression: ${expression}`;
                    errorEl.style.color = 'red';
                    errorEl.style.fontSize = '12px';
                    errorEl.style.padding = '5px';
                    errorEl.style.margin = '5px 0';
                    errorEl.style.border = '1px solid red';
                    errorEl.style.borderRadius = '3px';
                    errorEl.style.backgroundColor = 'rgba(255,0,0,0.1)';
                    el.parentNode?.insertBefore(errorEl, el.nextSibling);
                    return;
                }

                const [_, itemName, indexName, iterationType, listName] = forMatch;

                // Handle Promise values (async data)
                if (value instanceof Promise) {
                    // Show loading state
                    el.style.display = 'none';
                    const loadingEl = document.createElement('div');
                    loadingEl.className = 'k-for-loading';
                    loadingEl.textContent = `Loading ${listName}...`;
                    loadingEl.style.padding = '10px';
                    loadingEl.style.textAlign = 'center';
                    loadingEl.style.color = '#666';
                    el.parentNode?.insertBefore(loadingEl, el);

                    // Process the promise
                    value.then(resolvedValue => {
                        // Remove loading element
                        loadingEl.remove();

                        // Process with resolved value
                        this.get('for').process(el, resolvedValue, context, expression);
                    }).catch(error => {
                        // Show error state
                        loadingEl.className = 'k-for-error';
                        loadingEl.textContent = `Error loading ${listName}: ${error.message}`;
                        loadingEl.style.color = 'red';
                    });

                    return;
                }

                // Handle reactive arrays (ref objects)
                let list = value;

                // Handle undefined or null values silently
                if (list === undefined || list === null) {
                    list = [];
                }

                // Handle ref objects
                if (list && typeof list === 'object' && 'value' in list) {
                    if (Array.isArray(list.value)) {
                        list = list.value;
                    } else if (list.value === undefined || list.value === null) {
                        list = [];
                    } else {
                        // Try to convert to array if possible
                        try {
                            list = Array.from(list.value);
                        } catch (e) {
                            list = [];
                        }
                    }
                }

                // Handle various iterable types
                if (!Array.isArray(list)) {
                    // Handle number (create range)
                    if (typeof list === 'number') {
                        list = Array.from({ length: list }, (_, i) => i);
                    }
                    // Handle string (iterate characters)
                    else if (typeof list === 'string') {
                        list = list.split('');
                    }
                    // Handle Map
                    else if (list instanceof Map) {
                        list = Array.from(list.entries());
                    }
                    // Handle Set
                    else if (list instanceof Set) {
                        list = Array.from(list);
                    }
                    // Handle other iterables
                    else if (list && typeof list[Symbol.iterator] === 'function') {
                        try {
                            list = Array.from(list);
                        } catch (e) {
                            list = [];
                        }
                    }
                    // Handle plain objects (convert to [key, value] pairs)
                    else if (list && typeof list === 'object') {
                        list = Object.entries(list);
                    }
                    // Fallback to empty array
                    else {
                        list = [];
                    }
                }

                // Get the parent node
                const parent = el.parentNode;
                if (!parent) {
                    return;
                }

                // Generate a unique ID for this k-for instance if not already present
                if (!el.hasAttribute('k-for-id')) {
                    el.setAttribute('k-for-id', `kfor-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
                }
                const forId = el.getAttribute('k-for-id');

                // Clear previous items (marked with this specific k-for-id)
                const previousItems = parent.querySelectorAll(`[k-for-parent="${forId}"]`);
                previousItems.forEach(item => parent.removeChild(item));

                // Don't process the template element itself
                el.style.display = 'none';

                // Handle empty lists with a placeholder if needed
                if (list.length === 0) {
                    // Check if there's an empty template
                    const emptySlot = el.querySelector('[k-for-empty]') || el.nextElementSibling?.hasAttribute('k-for-empty')
                        ? el.nextElementSibling : null;

                    if (emptySlot) {
                        // Clone the empty slot template
                        const emptyTemplate = emptySlot.cloneNode(true);
                        emptyTemplate.style.display = '';
                        emptyTemplate.setAttribute('k-for-parent', forId);
                        emptyTemplate.setAttribute('k-for-empty-instance', 'true');
                        parent.insertBefore(emptyTemplate, el);
                    }

                    return;
                }

                // Create fragment for better performance
                const fragment = document.createDocumentFragment();

                // Create new items
                list.forEach((item, index) => {
                    const template = el.getAttribute('k-for-template');
                    if (!template) {
                        return;
                    }

                    const newEl = document.createElement('div');
                    newEl.innerHTML = template;
                    const itemEl = newEl.firstElementChild;

                    if (!itemEl) {
                        return;
                    }

                    // Mark as a k-for item with parent ID for better cleanup
                    itemEl.setAttribute('k-for-parent', forId);
                    itemEl.setAttribute('k-for-item', itemName);
                    itemEl.setAttribute('k-for-index', index.toString());

                    // Create a new context with the item
                    const itemContext = { ...context };

                    // Handle different iteration types
                    if (iterationType === 'of' && Array.isArray(item) && item.length === 2) {
                        // Object entries format [key, value]
                        itemContext[itemName] = item[1]; // value
                        if (indexName) {
                            itemContext[indexName] = item[0]; // key
                        } else {
                            itemContext['key'] = item[0]; // Provide key if no index name
                        }
                    } else {
                        // Regular array iteration
                        itemContext[itemName] = item;
                        if (indexName) {
                            itemContext[indexName] = index;
                        }
                    }

                    // Add special properties
                    itemContext.$index = index;
                    itemContext.$first = index === 0;
                    itemContext.$last = index === list.length - 1;
                    itemContext.$even = index % 2 === 0;
                    itemContext.$odd = index % 2 === 1;

                    // Process the element with the item context
                    this.processElement(itemEl, itemContext);

                    // Add to fragment
                    fragment.appendChild(itemEl);
                });

                // Insert all items at once for better performance
                parent.insertBefore(fragment, el);
            }
        });

    }

    /**
     * Process object iteration for k-for directive
     * @param {HTMLElement} el - The element to process
     * @param {Object} value - The object to iterate
     * @param {Object} context - The component context
     * @param {string} expression - The original expression
     * @param {Array} match - The regex match result
     * @private
     */
    processObjectForDirective(el, value, context, expression, match) {
        const [_, keyName, valueName, objectName] = match;

        // Get the object
        let obj = value;

        // Handle undefined or null
        if (obj === undefined || obj === null) {
            obj = {};
        }

        // Handle ref objects
        if (obj && typeof obj === 'object' && 'value' in obj) {
            obj = obj.value;
        }

        // Ensure it's an object
        if (typeof obj !== 'object') {
            obj = {};
        }

        // Convert to entries
        const entries = Object.entries(obj);

        // Get the parent node
        const parent = el.parentNode;
        if (!parent) return;

        // Generate a unique ID for this k-for instance
        const forId = `kfor-obj-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        el.setAttribute('k-for-id', forId);

        // Clear previous items
        const previousItems = parent.querySelectorAll(`[k-for-parent="${forId}"]`);
        previousItems.forEach(item => parent.removeChild(item));

        // Hide template
        el.style.display = 'none';

        // Create fragment
        const fragment = document.createDocumentFragment();

        // Process entries
        entries.forEach(([key, value], index) => {
            const template = el.getAttribute('k-for-template') || el.outerHTML;
            const newEl = document.createElement('div');
            newEl.innerHTML = template;
            const itemEl = newEl.firstElementChild;

            if (!itemEl) return;

            // Mark as k-for item
            itemEl.setAttribute('k-for-parent', forId);
            itemEl.setAttribute('k-for-key', key);
            itemEl.setAttribute('k-for-index', index.toString());

            // Create context
            const itemContext = { ...context };
            itemContext[keyName] = key;
            itemContext[valueName] = value;
            itemContext.$index = index;
            itemContext.$first = index === 0;
            itemContext.$last = index === entries.length - 1;

            // Process element
            this.processElement(itemEl, itemContext);

            // Add to fragment
            fragment.appendChild(itemEl);
        });

        // Insert all at once
        parent.insertBefore(fragment, el);
    }

    /**
     * Process range iteration for k-for directive
     * @param {HTMLElement} el - The element to process
     * @param {Object} context - The component context
     * @param {Array} match - The regex match result
     * @private
     */
    processRangeForDirective(el, context, match) {
        const [_, varName, startStr, endStr, stepStr] = match;

        // Parse range values
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        const step = stepStr ? parseInt(stepStr, 10) : 1;

        // Validate range
        if (isNaN(start) || isNaN(end) || isNaN(step) || step === 0) {
            console.error(`Invalid range in k-for: ${start}..${end}${stepStr ? `..${step}` : ''}`);
            return;
        }

        // Create range array
        const range = [];
        if (step > 0) {
            for (let i = start; i <= end; i += step) {
                range.push(i);
            }
        } else {
            for (let i = start; i >= end; i += step) {
                range.push(i);
            }
        }

        // Process as regular k-for with the range array
        this.get('for').process(el, range, context, `${varName} in range`);
    }

    /**
     * Register the bind directive
     * This method is called from registerBuiltInDirectives
     * @private
     */
    registerBindDirective() {
        // k-bind directive (shorthand: :)
        this.register('bind', {
            name: 'bind',
            description: 'Dynamically bind attributes or component props',
            expects: 'any',
            process: (el, value, context, expression, arg) => {
                if (arg) {
                    // Handle specific attribute binding
                    if (arg === 'class') {
                        // Special handling for class binding
                        if (typeof value === 'object' && !Array.isArray(value)) {
                            // Object syntax: :class="{ active: isActive }"
                            const classNames = Object.entries(value)
                                .filter(([_, condition]) => Boolean(condition))
                                .map(([className]) => className)
                                .join(' ');

                            el.className = el.className
                                .split(' ')
                                .filter(cls => !Object.keys(value).includes(cls))
                                .concat(classNames)
                                .filter(Boolean)
                                .join(' ');
                        } else if (Array.isArray(value)) {
                            // Array syntax: :class="[classA, classB]"
                            const classNames = value.filter(Boolean).join(' ');
                            el.className = classNames;
                        } else {
                            // String syntax: :class="className"
                            el.className = value;
                        }
                    } else if (arg === 'style') {
                        // Special handling for style binding
                        if (typeof value === 'object' && !Array.isArray(value)) {
                            // Object syntax: :style="{ color: activeColor }"
                            Object.entries(value).forEach(([prop, val]) => {
                                if (val) {
                                    // Convert camelCase to kebab-case
                                    const kebabProp = prop.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
                                    el.style[prop] = val;
                                }
                            });
                        } else if (typeof value === 'string') {
                            // String syntax: :style="styleString"
                            el.setAttribute('style', value);
                        }
                    } else {
                        // Regular attribute binding
                        if (value === null || value === undefined) {
                            el.removeAttribute(arg);
                        } else {
                            el.setAttribute(arg, value);
                        }
                    }
                } else if (typeof value === 'object' && value !== null) {
                    // Object syntax without argument: k-bind="{ id: 'my-id', class: 'my-class' }"
                    Object.entries(value).forEach(([key, val]) => {
                        if (val !== null && val !== undefined) {
                            el.setAttribute(key, val);
                        } else {
                            el.removeAttribute(key);
                        }
                    });
                }
            }
        });
    }

    /**
     * Register the model directive
     * This method is called from registerBuiltInDirectives
     * @private
     */
    registerModelDirective() {
        // k-model directive (two-way binding)
        this.register('model', {
            name: 'model',
            description: 'Create two-way data binding on form inputs',
            expects: 'any',
            process: (el, value, context, expression) => {
                // Set initial value
                if (el.tagName === 'INPUT') {
                    const type = el.type.toLowerCase();
                    if (type === 'checkbox') {
                        el.checked = Boolean(value);
                    } else if (type === 'radio') {
                        el.checked = el.value === String(value);
                    } else {
                        el.value = value !== undefined ? String(value) : '';
                    }
                } else if (el.tagName === 'TEXTAREA') {
                    el.value = value !== undefined ? String(value) : '';
                } else if (el.tagName === 'SELECT') {
                    el.value = value !== undefined ? String(value) : '';
                }

                // Add event listeners for two-way binding
                if (!el.hasAttribute('k-model-bound')) {
                    el.setAttribute('k-model-bound', 'true');

                    const updateValue = (event) => {
                        const newValue = el.tagName === 'INPUT' && el.type === 'checkbox'
                            ? el.checked
                            : el.value;

                        // Update the context with the new value
                        // This requires a reference to the reactive property
                        const parts = expression.split('.');
                        let target = context;

                        // Navigate to the parent object
                        for (let i = 0; i < parts.length - 1; i++) {
                            target = target[parts[i]];
                            if (!target) return;
                        }

                        // Update the property
                        const prop = parts[parts.length - 1];
                        if (target[prop] !== undefined) {
                            if (typeof target[prop] === 'object' && target[prop].value !== undefined) {
                                // Handle ref objects
                                target[prop].value = newValue;
                            } else {
                                target[prop] = newValue;
                            }
                        }
                    };

                    // Add appropriate event listener based on element type
                    if (el.tagName === 'INPUT') {
                        const type = el.type.toLowerCase();
                        if (type === 'checkbox' || type === 'radio') {
                            el.addEventListener('change', updateValue);
                        } else {
                            el.addEventListener('input', updateValue);
                        }
                    } else if (el.tagName === 'TEXTAREA') {
                        el.addEventListener('input', updateValue);
                    } else if (el.tagName === 'SELECT') {
                        el.addEventListener('change', updateValue);
                    }
                }
            }
        });
    }

    /**
     * Register the on directive
     * This method is called from registerBuiltInDirectives
     * @private
     */
    registerOnDirective() {
        // k-on directive (shorthand: @)
        this.register('on', {
            name: 'on',
            description: 'Attach event listeners to elements',
            expects: 'Function | Inline Statement',
            process: (el, value, context, expression, arg) => {
                if (!arg) {
                    console.warn('k-on directive requires an event name argument');
                    return;
                }

                // Prevent duplicate event listeners
                const eventKey = `k-on-${arg}`;
                if (el[eventKey]) {
                    el.removeEventListener(arg, el[eventKey]);
                }

                // Create event handler
                const handler = (event) => {
                    if (typeof value === 'function') {
                        // If value is a function, call it with the event
                        value.call(context, event);
                    } else if (typeof expression === 'string') {
                        // If it's an inline expression, evaluate it
                        try {
                            // Create a function that has access to the context and event
                            const fn = new Function('$event', 'ctx', `with(ctx) { ${expression} }`);
                            fn(event, context);
                        } catch (error) {
                            console.error(`Error executing k-on expression: ${expression}`, error);
                        }
                    }
                };

                // Store the handler and add event listener
                el[eventKey] = handler;
                el.addEventListener(arg, handler);
            }
        });
    }

    /**
     * Register the slot directive
     * This method is called from registerBuiltInDirectives
     * @private
     */
    registerSlotDirective() {
        // k-slot directive
        this.register('slot', {
            name: 'slot',
            description: 'Define named slots or scoped slots',
            expects: 'any',
            // This is primarily handled during component initialization
            process: (el, value, context, expression, arg) => {
                // Mark the element as a slot
                el.setAttribute('k-slot', arg || 'default');

                // For scoped slots, store the slot props
                if (value) {
                    el.setAttribute('k-slot-props', JSON.stringify(value));
                }
            }
        });
    }

    /**
     * Register the pre directive
     * This method is called from registerBuiltInDirectives
     * @private
     */
    registerPreDirective() {
        // k-pre directive
        this.register('pre', {
            name: 'pre',
            description: 'Skip compilation for this element and all its children',
            expects: null,
            process: (el, value, context) => {
                // This directive is primarily handled during compilation
                // At runtime, we just mark the element
                el.setAttribute('k-pre', 'true');
            }
        });
    }

    /**
     * Register the once directive
     * This method is called from registerBuiltInDirectives
     * @private
     */
    registerOnceDirective() {
        // k-once directive
        this.register('once', {
            name: 'once',
            description: 'Render the element only once and skip future updates',
            expects: null,
            process: (el, value, context) => {
                // Mark the element as rendered once
                el.setAttribute('k-once', 'true');
            }
        });
    }

    /**
     * Register the memo directive
     * This method is called from registerBuiltInDirectives
     * @private
     */
    registerMemoDirective() {
        // k-memo directive
        this.register('memo', {
            name: 'memo',
            description: 'Memoize a part of the template with invalidation conditions',
            expects: 'Array',
            process: (el, value, context) => {
                if (!Array.isArray(value)) {
                    console.warn('k-memo directive expects an array of dependencies');
                    return;
                }

                // Store current dependency values for comparison
                if (!el.hasAttribute('k-memo-deps')) {
                    el.setAttribute('k-memo-deps', JSON.stringify(value));
                } else {
                    // Compare with previous values
                    try {
                        const prevDeps = JSON.parse(el.getAttribute('k-memo-deps'));
                        const shouldUpdate = !value || value.length !== prevDeps.length ||
                            value.some((val, i) => val !== prevDeps[i]);

                        if (shouldUpdate) {
                            // Update the stored dependencies
                            el.setAttribute('k-memo-deps', JSON.stringify(value));
                        } else {
                            // Skip updates for this element
                            el.setAttribute('k-memo-skip', 'true');
                        }
                    } catch (e) {
                        console.error('Error processing k-memo directive', e);
                        el.setAttribute('k-memo-deps', JSON.stringify(value));
                    }
                }
            }
        });
    }

    /**
     * Register the cloak directive
     * This method is called from registerBuiltInDirectives
     * @private
     */
    registerCloakDirective() {
        // k-cloak directive
        this.register('cloak', {
            name: 'cloak',
            description: 'Hide uncompiled template until ready',
            expects: null,
            process: (el, value, context) => {
                // Remove the directive when the element is processed
                el.removeAttribute('k-cloak');
            }
        });
    }

    registerBuiltInDirectives() {
        // Register all directives
        this.registerBindDirective();
        this.registerModelDirective();
        this.registerOnDirective();
        this.registerSlotDirective();
        this.registerPreDirective();
        this.registerOnceDirective();
        this.registerMemoDirective();
        this.registerCloakDirective();

        // k-text directive
        this.register('text', {
            name: 'text',
            description: 'Update the element\'s text content',
            expects: 'string',
            process: (el, value, context) => {
                el.textContent = value !== undefined ? String(value) : '';
            }
        });

        // k-html directive
        this.register('html', {
            name: 'html',
            description: 'Update the element\'s innerHTML',
            expects: 'string',
            process: (el, value, context) => {
                el.innerHTML = value !== undefined ? String(value) : '';
            },
            security: 'Dynamically rendering arbitrary HTML can be dangerous. Only use on trusted content.'
        });

        // k-show directive
        this.register('show', {
            name: 'show',
            description: 'Toggle the element\'s visibility based on expression value',
            expects: 'any',
            process: (el, value, context) => {
                el.style.display = value ? '' : 'none';
            }
        });

        // k-if directive (handled during template compilation)
        this.register('if', {
            name: 'if',
            description: 'Conditionally render an element based on expression value',
            expects: 'any',
            // This is primarily handled during template compilation
            process: (el, value, context) => {
                // Runtime fallback - hide element if condition is false
                if (!value) {
                    el.style.display = 'none';
                    el.setAttribute('k-if-active', 'false');
                } else {
                    el.style.display = '';
                    el.setAttribute('k-if-active', 'true');
                }
            }
        });

        // k-else directive (handled during template compilation)
        this.register('else', {
            name: 'else',
            description: 'Denote the "else block" for k-if',
            expects: null,
            // This is primarily handled during template compilation
            process: (el, value, context) => {
                const previousEl = el.previousElementSibling;
                if (!previousEl || !previousEl.hasAttribute('k-if-active')) {
                    console.warn('k-else used without preceding k-if element');
                    return;
                }

                const ifActive = previousEl.getAttribute('k-if-active') === 'true';
                el.style.display = ifActive ? 'none' : '';
            }
        });

        // k-else-if directive (handled during template compilation)
        this.register('else-if', {
            name: 'else-if',
            description: 'Denote the "else if block" for k-if',
            expects: 'any',
            // This is primarily handled during template compilation
            process: (el, value, context) => {
                const previousEl = el.previousElementSibling;
                if (!previousEl ||
                    (!previousEl.hasAttribute('k-if-active') &&
                        !previousEl.hasAttribute('k-else-if-active'))) {
                    console.warn('k-else-if used without preceding k-if or k-else-if element');
                    return;
                }

                const previousActive = previousEl.getAttribute('k-if-active') === 'true' ||
                    previousEl.getAttribute('k-else-if-active') === 'true';

                if (previousActive) {
                    el.style.display = 'none';
                    el.setAttribute('k-else-if-active', 'false');
                } else {
                    const condition = Boolean(value);
                    el.style.display = condition ? '' : 'none';
                    el.setAttribute('k-else-if-active', condition ? 'true' : 'false');
                }
            }
        });

        // k-for directive (handled during template compilation)
        this.register('for', {
            name: 'for',
            description: 'Render the element multiple times based on source data with advanced features',
            expects: 'Array | Object | number | string | Iterable | Promise',
            // This is primarily handled during template compilation
            process: (el, value, context, expression) => {
                // Runtime implementation for dynamic lists
                if (!el.hasAttribute('k-for-template')) {
                    // Store the original template
                    el.setAttribute('k-for-template', el.outerHTML);
                }

                // Parse the expression with enhanced support for different syntaxes
                // Supports: item in items, (item, index) in items, item of items, key, value in object
                const forMatch = expression.match(/^\s*(?:\(?\s*(\w+)(?:\s*,\s*(\w+))?\s*\)?)?\s+(in|of)\s+(\w+(?:\.\w+)*)\s*$/);
                if (!forMatch) {
                    // Try object iteration syntax: (key, value) in object
                    const objectMatch = expression.match(/^\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s+in\s+(\w+(?:\.\w+)*)\s*$/);
                    if (objectMatch) {
                        return this.processObjectForDirective(el, value, context, expression, objectMatch);
                    }

                    // Try range syntax: i in 1..10
                    const rangeMatch = expression.match(/^\s*(\w+)\s+in\s+(\d+)\.\.(\d+)(?:\.\.(\d+))?\s*$/);
                    if (rangeMatch) {
                        return this.processRangeForDirective(el, context, rangeMatch);
                    }

                    // Add a placeholder element with error info
                    el.style.display = 'none';
                    const errorEl = document.createElement('div');
                    errorEl.className = 'k-for-error';
                    errorEl.textContent = `Invalid k-for expression: ${expression}`;
                    errorEl.style.color = 'red';
                    errorEl.style.fontSize = '12px';
                    errorEl.style.padding = '5px';
                    errorEl.style.margin = '5px 0';
                    errorEl.style.border = '1px solid red';
                    errorEl.style.borderRadius = '3px';
                    errorEl.style.backgroundColor = 'rgba(255,0,0,0.1)';
                    el.parentNode?.insertBefore(errorEl, el.nextSibling);
                    return;
                }

                const [_, itemName, indexName, iterationType, listName] = forMatch;

                // Handle Promise values (async data)
                if (value instanceof Promise) {
                    // Show loading state
                    el.style.display = 'none';
                    const loadingEl = document.createElement('div');
                    loadingEl.className = 'k-for-loading';
                    loadingEl.textContent = `Loading ${listName}...`;
                    loadingEl.style.padding = '10px';
                    loadingEl.style.textAlign = 'center';
                    loadingEl.style.color = '#666';
                    el.parentNode?.insertBefore(loadingEl, el);

                    // Process the promise
                    value.then(resolvedValue => {
                        // Remove loading element
                        loadingEl.remove();

                        // Process with resolved value
                        this.get('for').process(el, resolvedValue, context, expression);
                    }).catch(error => {
                        // Show error state
                        loadingEl.className = 'k-for-error';
                        loadingEl.textContent = `Error loading ${listName}: ${error.message}`;
                        loadingEl.style.color = 'red';
                    });

                    return;
                }

                // Handle reactive arrays (ref objects)
                let list = value;

                // Handle undefined or null values silently
                if (list === undefined || list === null) {
                    list = [];
                }

                // Handle ref objects
                if (list && typeof list === 'object' && 'value' in list) {
                    if (Array.isArray(list.value)) {
                        list = list.value;
                    } else if (list.value === undefined || list.value === null) {
                        list = [];
                    } else {
                        // Try to convert to array if possible
                        try {
                            list = Array.from(list.value);
                        } catch (e) {
                            list = [];
                        }
                    }
                }

                // Handle various iterable types
                if (!Array.isArray(list)) {
                    // Handle number (create range)
                    if (typeof list === 'number') {
                        list = Array.from({ length: list }, (_, i) => i);
                    }
                    // Handle string (iterate characters)
                    else if (typeof list === 'string') {
                        list = list.split('');
                    }
                    // Handle Map
                    else if (list instanceof Map) {
                        list = Array.from(list.entries());
                    }
                    // Handle Set
                    else if (list instanceof Set) {
                        list = Array.from(list);
                    }
                    // Handle other iterables
                    else if (list && typeof list[Symbol.iterator] === 'function') {
                        try {
                            list = Array.from(list);
                        } catch (e) {
                            list = [];
                        }
                    }
                    // Handle plain objects (convert to [key, value] pairs)
                    else if (list && typeof list === 'object') {
                        list = Object.entries(list);
                    }
                    // Fallback to empty array
                    else {
                        list = [];
                    }
                }

                // Get the parent node
                const parent = el.parentNode;
                if (!parent) {
                    return;
                }

                // Generate a unique ID for this k-for instance if not already present
                if (!el.hasAttribute('k-for-id')) {
                    el.setAttribute('k-for-id', `kfor-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
                }
                const forId = el.getAttribute('k-for-id');

                // Clear previous items (marked with this specific k-for-id)
                const previousItems = parent.querySelectorAll(`[k-for-parent="${forId}"]`);
                previousItems.forEach(item => parent.removeChild(item));

                // Don't process the template element itself
                el.style.display = 'none';

                // Handle empty lists with a placeholder if needed
                if (list.length === 0) {
                    // Check if there's an empty template
                    const emptySlot = el.querySelector('[k-for-empty]') || el.nextElementSibling?.hasAttribute('k-for-empty')
                        ? el.nextElementSibling : null;

                    if (emptySlot) {
                        // Clone the empty slot template
                        const emptyTemplate = emptySlot.cloneNode(true);
                        emptyTemplate.style.display = '';
                        emptyTemplate.setAttribute('k-for-parent', forId);
                        emptyTemplate.setAttribute('k-for-empty-instance', 'true');
                        parent.insertBefore(emptyTemplate, el);
                    }

                    return;
                }

                // Create fragment for better performance
                const fragment = document.createDocumentFragment();

                // Create new items
                list.forEach((item, index) => {
                    const template = el.getAttribute('k-for-template');
                    if (!template) {
                        return;
                    }

                    const newEl = document.createElement('div');
                    newEl.innerHTML = template;
                    const itemEl = newEl.firstElementChild;

                    if (!itemEl) {
                        return;
                    }

                    // Mark as a k-for item with parent ID for better cleanup
                    itemEl.setAttribute('k-for-parent', forId);
                    itemEl.setAttribute('k-for-item', itemName);
                    itemEl.setAttribute('k-for-index', index.toString());

                    // Create a new context with the item
                    const itemContext = { ...context };

                    // Handle different iteration types
                    if (iterationType === 'of' && Array.isArray(item) && item.length === 2) {
                        // Object entries format [key, value]
                        itemContext[itemName] = item[1]; // value
                        if (indexName) {
                            itemContext[indexName] = item[0]; // key
                        } else {
                            itemContext['key'] = item[0]; // Provide key if no index name
                        }
                    } else {
                        // Regular array iteration
                        itemContext[itemName] = item;
                        if (indexName) {
                            itemContext[indexName] = index;
                        }
                    }

                    // Add special properties
                    itemContext.$index = index;
                    itemContext.$first = index === 0;
                    itemContext.$last = index === list.length - 1;
                    itemContext.$even = index % 2 === 0;
                    itemContext.$odd = index % 2 === 1;

                    // Process the element with the item context
                    this.processElement(itemEl, itemContext);

                    // Add to fragment
                    fragment.appendChild(itemEl);
                });

                // Insert all items at once for better performance
                parent.insertBefore(fragment, el);
            }
        });

        console.log('Built-in directives registered');
    }
    /**
     * Process an element with all directives
     * @param {HTMLElement} el - The element to process
     * @param {Object} context - The component context
     */
    processElement(el, context) {
        if (!el || !el.attributes) return;

        // Get all attributes that might be directives
        const attributes = Array.from(el.attributes);
        const directiveAttrs = attributes.filter(attr =>
            attr.name.startsWith('k-') || attr.name.startsWith(':') || attr.name.startsWith('@')
        );

        // Process k-if, k-else-if, k-else first
        const conditionalDirectives = directiveAttrs.filter(attr =>
            ['k-if', 'k-else-if', 'k-else'].includes(attr.name)
        );

        if (conditionalDirectives.length > 0) {
            this.processConditionalDirectives(el, conditionalDirectives, context);

            // If element is not visible due to conditional, skip other directives
            if (el.style.display === 'none') return;
        }

        // Process k-for next
        const forDirective = directiveAttrs.find(attr => attr.name === 'k-for');
        if (forDirective) {
            this.processForDirective(el, forDirective, context);
            return; // k-for handles its own children
        }

        // Process other directives
        for (const attr of directiveAttrs) {
            if (['k-if', 'k-else-if', 'k-else', 'k-for'].includes(attr.name)) {
                continue; // Already processed
            }

            this.processDirective(el, attr, context);
        }

        // Process template expressions in this element
        this.processTemplateExpressions(el, context);

        // Process child elements recursively
        Array.from(el.children).forEach(child => {
            this.processElement(child, context);
        });
    }

    /**
     * Process conditional directives (k-if, k-else-if, k-else)
     * @param {HTMLElement} el - The element to process
     * @param {Array} directives - The conditional directive attributes
     * @param {Object} context - The component context
     */
    processConditionalDirectives(el, directives, context) {
        // Only one conditional directive should be present
        const directive = directives[0];
        const name = directive.name.replace('k-', '');
        const directiveObj = this.get(name);

        if (!directiveObj) {
            console.warn(`Unknown directive: ${directive.name}`);
            return;
        }

        if (name === 'if') {
            const expression = directive.value;
            const value = this.evaluateExpression(expression, context);
            directiveObj.process(el, value, context, expression);
        } else if (name === 'else-if') {
            const expression = directive.value;
            const value = this.evaluateExpression(expression, context);
            directiveObj.process(el, value, context, expression);
        } else if (name === 'else') {
            directiveObj.process(el, null, context);
        }
    }

    /**
     * Process k-for directive
     * @param {HTMLElement} el - The element to process
     * @param {Attr} directive - The k-for directive attribute
     * @param {Object} context - The component context
     */
    processForDirective(el, directive, context) {
        if (!directive || !directive.value) {
            console.error('Invalid k-for directive: directive or value is missing');
            return;
        }

        const expression = directive.value;
        const forMatch = expression.match(/^\s*(\w+)(?:\s*,\s*(\w+))?\s+in\s+(\w+(?:\.\w+)*)\s*$/);

        if (!forMatch) {
            console.error(`Invalid k-for expression: ${expression}`);
            // Add a debug comment to the element
            el.setAttribute('k-for-error', `Invalid expression: ${expression}`);
            return;
        }

        const [_, itemName, indexName, listName] = forMatch;

        try {
            // Evaluate the list expression
            const list = this.evaluateExpression(listName, context);

            // Log for debugging
            if (list === undefined || list === null) {
                console.warn(`k-for list "${listName}" evaluated to ${list === undefined ? 'undefined' : 'null'}`);
                el.setAttribute('k-for-debug', `List "${listName}" is ${list === undefined ? 'undefined' : 'null'}`);
            } else if (!Array.isArray(list)) {
                console.warn(`k-for list "${listName}" is not an array, got:`, typeof list);
                el.setAttribute('k-for-debug', `List "${listName}" is not an array (${typeof list})`);
            } else if (list.length === 0) {
                console.log(`k-for list "${listName}" is empty array`);
                el.setAttribute('k-for-debug', `List "${listName}" is empty array`);
            } else {
                console.log(`k-for list "${listName}" has ${list.length} items`);
                el.setAttribute('k-for-debug', `List has ${list.length} items`);
            }

            // Get the directive object
            const directiveObj = this.get('for');
            if (directiveObj) {
                directiveObj.process(el, list, context, expression);
            } else {
                console.error('k-for directive not found in registry');
                el.setAttribute('k-for-error', 'Directive not found in registry');
            }
        } catch (error) {
            console.error(`Error processing k-for directive: ${expression}`, error);
            el.setAttribute('k-for-error', `Error: ${error.message}`);
        }
    }

    /**
     * Process a single directive
     * @param {HTMLElement} el - The element to process
     * @param {Attr} attr - The directive attribute
     * @param {Object} context - The component context
     */
    processDirective(el, attr, context) {
        let name, arg, modifiers, expression;

        // Parse directive name, argument, and modifiers
        if (attr.name.startsWith('k-')) {
            // Full syntax: k-directive:arg.modifier
            const parts = attr.name.slice(2).split(':');
            name = parts[0];

            if (parts[1]) {
                const argParts = parts[1].split('.');
                arg = argParts[0];
                modifiers = argParts.slice(1);
            }
        } else if (attr.name.startsWith(':')) {
            // Shorthand for k-bind: :arg
            name = 'bind';
            arg = attr.name.slice(1);
        } else if (attr.name.startsWith('@')) {
            // Shorthand for k-on: @event
            name = 'on';
            arg = attr.name.slice(1);
        } else {
            return; // Not a directive
        }

        expression = attr.value;

        // Get the directive object
        const directiveObj = this.get(name);
        if (!directiveObj) {
            console.warn(`Unknown directive: k-${name}`);
            return;
        }

        // Evaluate the expression
        let value;
        if (expression) {
            value = this.evaluateExpression(expression, context);

            // Handle ref objects (reactive properties)
            if (value && typeof value === 'object' && 'value' in value && typeof value.value !== 'function') {
                value = value.value;
                console.log(`Directive ${name}: Unwrapped ref value for "${expression}":`, value);
            }
        }

        // Apply modifiers if any
        if (modifiers && modifiers.length > 0) {
            value = this.applyModifiers(value, modifiers, name);
        }

        // Process the directive
        directiveObj.process(el, value, context, expression, arg);
    }

    /**
     * Evaluate an expression in the given context with advanced error recovery
     * @param {string} expression - The expression to evaluate
     * @param {Object} context - The context object
     * @returns {*} The evaluated result or intelligent fallback
     */
    evaluateExpression(expression, context) {
        // Handle empty expressions gracefully
        if (!expression) {
            // Use empty string as fallback instead of undefined
            return '';
        }

        // Handle missing context with intelligent recovery
        if (!context) {
            // Create an empty context instead of failing
            context = {};
        }

        try {
            // Handle simple property access with intelligent path resolution
            if (/^[\w.]+$/.test(expression)) {
                return this.getNestedProperty(context, expression);
            }

            // Handle array access patterns like items[0].name
            if (/^[\w.]+\[\d+\](\.[\w.]+)?$/.test(expression)) {
                try {
                    // Extract the array, index, and potential nested property
                    const match = expression.match(/^([\w.]+)\[(\d+)\](\.(.+))?$/);
                    if (match) {
                        const [_, arrayPath, indexStr, __, nestedPath] = match;
                        const array = this.getNestedProperty(context, arrayPath);
                        const index = parseInt(indexStr, 10);

                        // Handle missing or non-array values
                        if (!Array.isArray(array)) {
                            return nestedPath ? '' : undefined;
                        }

                        // Handle out-of-bounds index
                        if (index < 0 || index >= array.length) {
                            return nestedPath ? '' : undefined;
                        }

                        // Get the item at the specified index
                        const item = array[index];

                        // Return the item or navigate to the nested property
                        if (!nestedPath) return item;
                        return this.getNestedProperty(item, nestedPath.substring(1)); // Remove leading dot
                    }
                } catch (arrayError) {
                    // Silently recover from array access errors
                }
            }

            // Handle ternary expressions specially for better performance and safety
            if (expression.includes('?') && expression.includes(':')) {
                try {
                    const [condition, thenElse] = expression.split('?', 2);
                    const [thenExpr, elseExpr] = thenElse.split(':', 2);

                    if (condition && thenExpr && elseExpr) {
                        const conditionResult = this.evaluateExpression(condition.trim(), context);
                        return conditionResult
                            ? this.evaluateExpression(thenExpr.trim(), context)
                            : this.evaluateExpression(elseExpr.trim(), context);
                    }
                } catch (ternaryError) {
                    // Silently recover from ternary expression errors
                }
            }

            // For more complex expressions, use Function constructor with enhanced safety
            try {
                // Create a safe wrapper function that won't throw on undefined properties
                const fn = new Function('ctx', `
                    try {
                        with(ctx) { 
                            return ${expression}; 
                        }
                    } catch(e) {
                        // Silently recover from evaluation errors
                        return undefined;
                    }
                `);

                return fn(context);
            } catch (fnError) {
                // Try to recover with a simplified expression
                return this.recoverFromExpressionError(expression, context);
            }
        } catch (error) {
            // Try to recover with a simplified expression
            return this.recoverFromExpressionError(expression, context);
        }
    }

    /**
     * Attempt to recover from expression evaluation errors
     * @param {string} expression - The original expression that failed
     * @param {Object} context - The context object
     * @returns {*} A fallback value based on expression analysis
     */
    recoverFromExpressionError(expression, context) {
        // Try to extract variable names from the expression
        const variableMatches = expression.match(/\b([a-zA-Z_$][\w$]*)\b/g);

        if (variableMatches) {
            // Check if any of the variables exist in the context
            for (const varName of variableMatches) {
                if (varName in context) {
                    const value = context[varName];

                    // Return the variable value if it exists
                    if (value !== undefined) {
                        return value;
                    }
                }
            }
        }

        // Provide intelligent fallbacks based on expression patterns
        if (/\b(count|length|size|index)\b/i.test(expression)) return 0;
        if (/\b(is|has|can|should)[A-Z]/i.test(expression)) return false;
        if (/\[\]|\barray\b|\blist\b|\bitems\b|\bcollection\b/i.test(expression)) return [];
        if (/\b(name|title|label|text|message)\b/i.test(expression)) return '';

        // Default fallback
        return undefined;
    }

    /**
     * Get a nested property from an object using dot notation with advanced fallback handling
     * @param {Object} obj - The object to get the property from
     * @param {string} path - The property path (e.g., 'user.name')
     * @returns {*} The property value or intelligent fallback
     */
    getNestedProperty(obj, path) {
        // Store original path for debugging
        const originalPath = path;

        // Handle empty paths
        if (!path) return obj;

        // Handle null/undefined objects with intelligent fallbacks
        if (!obj) {
            // In development, log a debug message but not in production
            if (process.env.NODE_ENV !== 'production') {
                console.debug(`KalxJS: Property "${path}" accessed on null/undefined object - using fallback`);
            }

            // Return appropriate fallback based on path hints
            if (/items?$|list$|array$|collection$/.test(path)) return [];
            if (/count$|length$|size$|index$/.test(path)) return 0;
            if (/is[A-Z]|has[A-Z]|can[A-Z]|should[A-Z]/.test(path)) return false;
            if (/name$|title$|label$|text$|description$|message$/.test(path)) return '';

            return undefined;
        }

        const parts = path.split('.');
        let result = obj;
        let partialPath = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            partialPath += (i > 0 ? '.' : '') + part;

            if (result === null || result === undefined) {
                // Try to find similar properties for better developer experience
                if (process.env.NODE_ENV !== 'production' && obj) {
                    const similarProps = this.findSimilarProperties(obj, partialPath);
                    if (similarProps.length > 0) {
                        console.debug(`KalxJS: Property "${partialPath}" not found. Did you mean: ${similarProps.join(', ')}?`);
                    }
                }

                // Return intelligent fallbacks based on path hints
                if (/items?$|list$|array$|collection$/.test(originalPath)) return [];
                if (/count$|length$|size$|index$/.test(originalPath)) return 0;
                if (/is[A-Z]|has[A-Z]|can[A-Z]|should[A-Z]/.test(originalPath)) return false;
                if (/name$|title$|label$|text$|description$|message$/.test(originalPath)) return '';

                return undefined;
            }

            // Handle non-existent properties with intelligent fallbacks
            if (!(part in result)) {
                // Try to find similar properties for better developer experience
                if (process.env.NODE_ENV !== 'production') {
                    const availableProps = Object.keys(result);
                    const similarProps = availableProps.filter(p =>
                        this.calculateSimilarity(part, p) > 0.7 ||
                        p.toLowerCase().includes(part.toLowerCase())
                    );

                    if (similarProps.length > 0) {
                        console.debug(`KalxJS: Property "${part}" not found in "${partialPath.replace(new RegExp(part + '$'), '')}". Did you mean: ${similarProps.join(', ')}?`);
                    }
                }

                // Return intelligent fallbacks based on path hints
                if (/items?$|list$|array$|collection$/.test(originalPath)) return [];
                if (/count$|length$|size$|index$/.test(originalPath)) return 0;
                if (/is[A-Z]|has[A-Z]|can[A-Z]|should[A-Z]/.test(originalPath)) return false;
                if (/name$|title$|label$|text$|description$|message$/.test(originalPath)) return '';

                return undefined;
            }

            result = result[part];

            // Handle ref objects (reactive properties)
            if (result && typeof result === 'object' && 'value' in result && typeof result.value !== 'function') {
                result = result.value;
            }
        }

        // Handle arrays and objects that might be reactive
        if (result && typeof result === 'object') {
            // If it's an array-like object with a value property that is an array
            if ('value' in result && Array.isArray(result.value)) {
                return result.value;
            }

            // If it's a ref object with a value property
            if ('value' in result && result.value !== undefined) {
                return result.value;
            }

            // If it's an array, check if it contains ref objects and unwrap them
            if (Array.isArray(result)) {
                return result.map(item => {
                    if (item && typeof item === 'object' && 'value' in item && typeof item.value !== 'function') {
                        return item.value;
                    }
                    return item;
                });
            }
        }

        return result;
    }

    /**
     * Process template expressions in an element
     * @param {HTMLElement} el - The element to process
     * @param {Object} context - The component context
     */
    processTemplateExpressions(el, context) {
        if (!el || !el.innerHTML) return;

        // Process text nodes for expressions
        const processTextNodes = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (text.includes('{{') && text.includes('}}')) {
                    node.textContent = text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
                        try {
                            // Evaluate the expression in the context
                            let value = this.evaluateExpression(expression.trim(), context);

                            // Handle ref objects (reactive properties)
                            if (value && typeof value === 'object' && 'value' in value && typeof value.value !== 'function') {
                                value = value.value;
                                console.log(`Unwrapped ref value for "${expression}":`, value);
                            }

                            // Handle undefined values
                            if (value === undefined) {
                                console.warn(`Expression "${expression}" evaluated to undefined`);
                                return '';
                            }

                            // Handle arrays and objects
                            if (typeof value === 'object' && value !== null) {
                                // For arrays of primitive values, join them with commas
                                if (Array.isArray(value) && value.every(item =>
                                    typeof item !== 'object' || item === null)) {
                                    return value.join(', ');
                                }
                                // For other objects, stringify them
                                return JSON.stringify(value);
                            }

                            return String(value);
                        } catch (error) {
                            console.error(`Error evaluating expression "${expression}":`, error);
                            return '';
                        }
                    });
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Process child nodes recursively
                Array.from(node.childNodes).forEach(processTextNodes);
            }
        };

        // Process all child nodes
        Array.from(el.childNodes).forEach(processTextNodes);
    }

    /**
     * Calculate string similarity using Levenshtein distance
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {number} Similarity score between 0 and 1
     */
    calculateSimilarity(a, b) {
        if (!a || !b) return 0;

        // Convert to lowercase for case-insensitive comparison
        a = a.toLowerCase();
        b = b.toLowerCase();

        // Calculate Levenshtein distance
        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let i = 0; i <= a.length; i++) {
            matrix[0][i] = i;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                const cost = a[j - 1] === b[i - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost  // substitution
                );
            }
        }

        // Calculate similarity score (0 to 1)
        const maxLength = Math.max(a.length, b.length);
        return maxLength === 0 ? 1 : 1 - matrix[b.length][a.length] / maxLength;
    }

    /**
     * Find similar properties in an object based on a path
     * @param {Object} obj - The object to search in
     * @param {string} path - The property path to find similar properties for
     * @returns {Array} Array of similar property paths
     */
    findSimilarProperties(obj, path) {
        if (!obj || !path) return [];

        const parts = path.split('.');
        const lastPart = parts[parts.length - 1];
        let current = obj;

        // Navigate to the parent object
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current || typeof current !== 'object') return [];
            current = current[parts[i]];
        }

        if (!current || typeof current !== 'object') return [];

        // Find similar properties in the current object
        return Object.keys(current).filter(prop =>
            this.calculateSimilarity(lastPart, prop) > 0.7 ||
            prop.toLowerCase().includes(lastPart.toLowerCase()) ||
            lastPart.toLowerCase().includes(prop.toLowerCase())
        );
    }

    /**
     * Apply modifiers to a value
     * @param {*} value - The value to modify
     * @param {Array} modifiers - Array of modifier names
     * @param {string} directiveName - The directive name
     * @returns {*} The modified value
     */
    applyModifiers(value, modifiers, directiveName) {
        let result = value;

        // Apply modifiers based on directive type
        if (directiveName === 'model' || directiveName === 'bind') {
            // Apply .number modifier
            if (modifiers.includes('number')) {
                result = parseFloat(result);
                if (isNaN(result)) {
                    result = value;
                }
            }

            // Apply .trim modifier
            if (modifiers.includes('trim') && typeof result === 'string') {
                result = result.trim();
            }
        }

        // Event modifiers are handled in the event handler

        return result;
    }
}

// Create and export the directives registry
const directivesRegistry = new DirectivesRegistry();

export { directivesRegistry };

/**
 * Apply directives to an element
 * @param {HTMLElement} el - The element to process
 * @param {Object} context - The component context
 */
export function applyDirectives(el, context) {
    directivesRegistry.processElement(el, context);
}

/**
 * Register a custom directive
 * @param {string} name - Directive name without the k- prefix
 * @param {Object} definition - Directive definition object
 */
export function registerDirective(name, definition) {
    directivesRegistry.register(name, definition);
}

/**
 * Get a directive by name
 * @param {string} name - Directive name without the k- prefix
 * @returns {Object|null} Directive definition or null if not found
 */
export function getDirective(name) {
    return directivesRegistry.get(name);
}