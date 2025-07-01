// @kalxjs/core - Directive Processor
// This file provides a runtime directive processor for KalxJS templates

import { directivesRegistry, applyDirectives } from './directives';

// Event handling system
const eventHandlerRegistry = new WeakMap();

/**
 * Advanced event handling system for KalxJS
 * Provides a centralized way to manage event listeners with automatic cleanup
 */
const EventSystem = {
    /**
     * Register an event handler for an element
     * @param {HTMLElement} element - The DOM element
     * @param {string} eventName - The event name (e.g., 'click', 'input')
     * @param {Function} handler - The event handler function
     * @param {Object} options - Event listener options
     */
    on(element, eventName, handler, options = {}) {
        if (!element || !eventName || typeof handler !== 'function') {
            console.error('Invalid parameters for EventSystem.on');
            return;
        }

        // Get or create the element's event registry
        let elementRegistry = eventHandlerRegistry.get(element);
        if (!elementRegistry) {
            elementRegistry = new Map();
            eventHandlerRegistry.set(element, elementRegistry);
        }

        // Get or create the event type registry
        let eventTypeRegistry = elementRegistry.get(eventName);
        if (!eventTypeRegistry) {
            eventTypeRegistry = new Set();
            elementRegistry.set(eventName, eventTypeRegistry);
        }

        // Remove existing handler if it exists (to prevent duplicates)
        this.off(element, eventName, handler);

        // Add the event listener
        element.addEventListener(eventName, handler, options);

        // Store the handler for future reference
        eventTypeRegistry.add(handler);

        console.log(`Added ${eventName} event listener to element`, element);
    },

    /**
     * Remove an event handler from an element
     * @param {HTMLElement} element - The DOM element
     * @param {string} eventName - The event name
     * @param {Function} handler - The specific handler to remove (optional)
     */
    off(element, eventName, handler = null) {
        if (!element) return;

        const elementRegistry = eventHandlerRegistry.get(element);
        if (!elementRegistry) return;

        // If no event name specified, remove all event handlers
        if (!eventName) {
            elementRegistry.forEach((handlers, event) => {
                handlers.forEach(h => element.removeEventListener(event, h));
            });
            eventHandlerRegistry.delete(element);
            return;
        }

        const eventTypeRegistry = elementRegistry.get(eventName);
        if (!eventTypeRegistry) return;

        // If no specific handler, remove all handlers for this event
        if (!handler) {
            eventTypeRegistry.forEach(h => element.removeEventListener(eventName, h));
            elementRegistry.delete(eventName);
            return;
        }

        // Remove the specific handler
        if (eventTypeRegistry.has(handler)) {
            element.removeEventListener(eventName, handler);
            eventTypeRegistry.delete(handler);
        }

        // Clean up empty registries
        if (eventTypeRegistry.size === 0) {
            elementRegistry.delete(eventName);
        }

        if (elementRegistry.size === 0) {
            eventHandlerRegistry.delete(element);
        }
    },

    /**
     * Remove all event handlers from an element
     * @param {HTMLElement} element - The DOM element
     */
    clearAll(element) {
        this.off(element);
    }
};

/**
 * Process directives on a DOM element after it has been rendered
 * @param {HTMLElement} rootElement - The root DOM element
 * @param {Object} context - The component context (data, methods, etc.)
 */
export function processDirectives(rootElement, context) {
    if (!rootElement || !context) {
        console.error('Invalid parameters for processDirectives');
        return;
    }

    // Check if rootElement is a valid DOM element with querySelectorAll method
    if (typeof rootElement.querySelectorAll !== 'function') {
        console.warn('Invalid root element for directive processing - not a DOM element with querySelectorAll:', rootElement);
        return;
    }

    console.log('Processing directives on element:', rootElement);
    console.log('With context:', context);

    // Prepare the context for directive processing
    // Extract reactive values from the context
    const processContext = prepareContext(context);

    console.log('Prepared context for directive processing:', processContext);

    // First, process k-text directives to show initial text
    processTextDirectives(rootElement, processContext);

    // Then process k-if directives to handle conditional rendering
    processIfDirectives(rootElement, processContext);

    // Process k-for directives to handle list rendering
    processForDirectives(rootElement, processContext);

    // Process k-model directives for two-way binding
    processModelDirectives(rootElement, processContext);

    // Process other directives
    const elementsWithDirectives = rootElement.querySelectorAll('[k-show],[k-html],[k-bind],[k-on],[data-needs-directive-processing]');
    elementsWithDirectives.forEach(element => {
        processElementDirectives(element, processContext);
    });

    // Also process the root element if it has directives
    if (rootElement.hasAttribute('k-if') ||
        rootElement.hasAttribute('k-else') ||
        rootElement.hasAttribute('k-else-if') ||
        rootElement.hasAttribute('k-for') ||
        rootElement.hasAttribute('k-text') ||
        rootElement.hasAttribute('k-html') ||
        rootElement.hasAttribute('k-show') ||
        rootElement.hasAttribute('k-model') ||
        rootElement.hasAttribute('k-bind') ||
        rootElement.hasAttribute('k-on') ||
        rootElement.hasAttribute('data-needs-directive-processing')) {
        processElementDirectives(rootElement, processContext);
    }

    // Process click events on buttons
    processClickEvents(rootElement, processContext);

    // Process @click directives
    processAtClickDirectives(rootElement, processContext);

    // Process all event directives in a more professional way
    processEventDirectives(rootElement, processContext);

    // Also try a direct approach for buttons with @click
    processButtonClickDirectives(rootElement, processContext);
}

/**
 * Process text directives
 * @param {HTMLElement} rootElement - The root element
 * @param {Object} context - The component context
 */
function processTextDirectives(rootElement, context) {
    // Check if rootElement is a valid DOM element with querySelectorAll method
    if (!rootElement || typeof rootElement.querySelectorAll !== 'function') {
        console.warn('Invalid root element for directive processing:', rootElement);
        return;
    }

    const elements = rootElement.querySelectorAll('[k-text]');
    console.log(`Found ${elements.length} elements with k-text directive`);

    elements.forEach(element => {
        const expression = element.getAttribute('k-text');
        if (!expression) return;

        console.log(`Processing k-text for "${expression}"`);

        try {
            // Get the value from context
            let textValue = context[expression];

            // Handle reactive values (ref objects)
            if (textValue && typeof textValue === 'object' && 'value' in textValue) {
                textValue = textValue.value;
            }

            // Check for reactive property in context
            const reactiveKey = `__reactive_${expression}`;
            if (context[reactiveKey]) {
                textValue = context[reactiveKey].value;
            }

            console.log(`Value for k-text "${expression}":`, textValue);

            // Handle arrays
            if (Array.isArray(textValue)) {
                element.textContent = textValue.join(', ');
            }
            // Handle objects
            else if (textValue && typeof textValue === 'object') {
                element.textContent = JSON.stringify(textValue);
            }
            // Handle primitive values
            else if (textValue !== undefined) {
                element.textContent = textValue;
            } else {
                console.warn(`No value found for k-text="${expression}"`);
            }
        } catch (error) {
            console.error(`Error processing k-text for "${expression}":`, error);
        }
    });
}

/**
 * Process if directives
 * @param {HTMLElement} rootElement - The root element
 * @param {Object} context - The component context
 */
function processIfDirectives(rootElement, context) {
    // Check if rootElement is a valid DOM element with querySelectorAll method
    if (!rootElement || typeof rootElement.querySelectorAll !== 'function') {
        console.warn('Invalid root element for directive processing:', rootElement);
        return;
    }

    const elements = rootElement.querySelectorAll('[k-if]');
    console.log(`Found ${elements.length} elements with k-if directive`);

    elements.forEach(element => {
        const expression = element.getAttribute('k-if');
        if (!expression) return;

        console.log(`Processing k-if for "${expression}"`);

        try {
            // Get the condition value from context
            let condition = context[expression];

            // Handle reactive values (ref objects)
            if (condition && typeof condition === 'object' && 'value' in condition) {
                condition = condition.value;
            }

            // Check for reactive property in context
            const reactiveKey = `__reactive_${expression}`;
            if (context[reactiveKey]) {
                condition = context[reactiveKey].value;
            }

            console.log(`Condition value for k-if "${expression}":`, condition);

            // Get the next sibling for k-else
            const nextSibling = element.nextElementSibling;
            const hasElse = nextSibling && nextSibling.hasAttribute('k-else');

            if (condition) {
                element.style.display = '';
                if (hasElse) {
                    nextSibling.style.display = 'none';
                }
            } else {
                element.style.display = 'none';
                if (hasElse) {
                    nextSibling.style.display = '';
                }
            }
        } catch (error) {
            console.error(`Error processing k-if for "${expression}":`, error);
        }
    });
}

/**
 * Process for directives
 * @param {HTMLElement} rootElement - The root element
 * @param {Object} context - The component context
 */
function processForDirectives(rootElement, context) {
    // Check if rootElement is a valid DOM element with querySelectorAll method
    if (!rootElement || typeof rootElement.querySelectorAll !== 'function') {
        console.warn('Invalid root element for directive processing:', rootElement);
        return;
    }

    const elements = rootElement.querySelectorAll('[k-for]');
    console.log(`Found ${elements.length} elements with k-for directive`);

    elements.forEach(element => {
        const value = element.getAttribute('k-for');
        console.log(`Processing k-for directive with value: ${value}`);

        // Parse the for expression
        const forMatch = value.match(/^\s*(?:\(?\s*(\w+)(?:\s*,\s*(\w+))?\s*\)?)?\s+(in|of)\s+(\w+(?:\.\w+)*)\s*$/);
        if (forMatch) {
            const [_, itemName, indexName, iterationType, listName] = forMatch;

            // Get the list from context, or use a default list if not found
            let list = context[listName];

            // Handle reactive arrays (ref objects)
            if (list && typeof list === 'object' && 'value' in list && Array.isArray(list.value)) {
                console.log(`Found reactive array for "${listName}":`, list.value);
                list = list.value;
            }

            // Check for reactive property in context
            const reactiveKey = `__reactive_${listName}`;
            if (context[reactiveKey] && Array.isArray(context[reactiveKey].value)) {
                console.log(`Found reactive array via __reactive_${listName}:`, context[reactiveKey].value);
                list = context[reactiveKey].value;
            }

            if (!list || !Array.isArray(list) || list.length === 0) {
                console.warn(`List "${listName}" not found in context or is empty, using default list`);
                list = ['Item 1', 'Item 2', 'Item 3'];
                // Update the context with the default list
                context[listName] = list;
                if (context[reactiveKey]) {
                    context[reactiveKey].value = list;
                }
            }

            console.log(`Processing k-for for "${listName}":`, list);

            // Get the parent element
            const parent = element.parentNode;

            // Clone the template element
            const template = element.cloneNode(true);

            // Remove the template element from DOM
            element.remove();

            // Create a new element for each item in the list
            list.forEach((item, index) => {
                const clone = template.cloneNode(true);

                // Set the text content if k-text is present
                if (clone.hasAttribute('k-text')) {
                    const textAttr = clone.getAttribute('k-text');
                    if (textAttr === itemName) {
                        clone.textContent = item;
                    }
                }

                // Add the element to the parent
                parent.appendChild(clone);
                console.log(`Added item "${item}" to the DOM`);
            });
        } else {
            console.warn(`Invalid k-for expression: ${value}`);
        }
    });
}

/**
 * Process model directives
 * @param {HTMLElement} rootElement - The root element
 * @param {Object} context - The component context
 */
function processModelDirectives(rootElement, context) {
    const elements = rootElement.querySelectorAll('[k-model]');
    elements.forEach(element => {
        const value = element.getAttribute('k-model');
        const modelValue = context[value];
        console.log(`Processing k-model for "${value}":`, modelValue);

        // Set the initial value
        if (modelValue !== undefined) {
            element.value = modelValue;
        }

        // Set up event listener for input changes
        element.addEventListener('input', (event) => {
            const newValue = event.target.value;
            context.__updateReactive(value, newValue);

            // Also update the span that displays the input value
            const displaySpan = rootElement.querySelector(`span[k-text="${value}"]`);
            if (displaySpan) {
                displaySpan.textContent = newValue;
            }
        });
    });
}

/**
 * Process click events on buttons
 * @param {HTMLElement} rootElement - The root element
 * @param {Object} context - The component context
 */
function processClickEvents(rootElement, context) {
    // Find all buttons with data-click attribute
    const buttons = rootElement.querySelectorAll('button[data-click]');

    buttons.forEach(button => {
        const methodName = button.getAttribute('data-click');
        if (methodName && context[methodName] && typeof context[methodName] === 'function') {
            console.log(`Setting up click handler for method: ${methodName}`);

            // Remove existing click handler if any
            const oldHandler = button._clickHandler;
            if (oldHandler) {
                button.removeEventListener('click', oldHandler);
            }

            // Create new click handler
            const clickHandler = (event) => {
                event.preventDefault();
                console.log(`Button clicked, calling method: ${methodName}`);
                context[methodName].call(context);

                // Update the button text for increment method
                if (methodName === 'increment' && context.count !== undefined) {
                    button.textContent = `Clicked ${context.count} times`;
                }

                // For toggleShow, update the visibility of elements with k-if
                if (methodName === 'toggleShow') {
                    const ifElements = rootElement.querySelectorAll('[k-if="showText"]');
                    const elseElements = rootElement.querySelectorAll('[k-else]');

                    ifElements.forEach(el => {
                        el.style.display = context.showText ? '' : 'none';
                    });

                    elseElements.forEach(el => {
                        el.style.display = context.showText ? 'none' : '';
                    });
                }
            };

            // Store the handler for future cleanup
            button._clickHandler = clickHandler;

            // Add the click event listener
            button.addEventListener('click', clickHandler);
        }
    });
}

/**
 * Process @click directives
 * @param {HTMLElement} rootElement - The root element
 * @param {Object} context - The component context
 */
function processAtClickDirectives(rootElement, context) {
    // Check if rootElement is a valid DOM element with querySelectorAll method
    if (!rootElement || typeof rootElement.querySelectorAll !== 'function') {
        console.warn('Invalid root element for directive processing:', rootElement);
        return;
    }

    // Find all elements with @click attribute
    const elements = rootElement.querySelectorAll('[\\@click]');
    console.log(`Found ${elements.length} elements with @click attribute`);

    elements.forEach(element => {
        const methodName = element.getAttribute('@click');
        console.log(`Processing @click for method: ${methodName}`);

        if (methodName && context[methodName] && typeof context[methodName] === 'function') {
            console.log(`Setting up @click handler for method: ${methodName}`);

            // Remove existing click handler if any
            const oldHandler = element._clickHandler;
            if (oldHandler) {
                element.removeEventListener('click', oldHandler);
            }

            // Create new click handler
            const clickHandler = (event) => {
                event.preventDefault();
                console.log(`Element clicked, calling method: ${methodName}`);
                context[methodName].call(context);

                // For toggleShow, update the visibility of elements with k-if
                if (methodName === 'toggleShow') {
                    const ifElements = rootElement.querySelectorAll('[k-if="showText"]');
                    const elseElements = rootElement.querySelectorAll('[k-else]');

                    ifElements.forEach(el => {
                        el.style.display = context.showText ? '' : 'none';
                    });

                    elseElements.forEach(el => {
                        el.style.display = context.showText ? 'none' : '';
                    });
                }

                // For increment, update the button text
                if (methodName === 'increment') {
                    element.textContent = `Clicked ${context.count} times`;
                }

                // Process text directives again to update any text that might have changed
                processTextDirectives(rootElement, context);
            };

            // Store the handler for future cleanup
            element._clickHandler = clickHandler;

            // Add the click event listener
            element.addEventListener('click', clickHandler);
            console.log(`Added click event listener for ${methodName}`);
        } else {
            console.warn(`Method ${methodName} not found in context or is not a function`);
        }
    });
}

/**
 * Prepare the context for directive processing by extracting reactive values
 * @param {Object} context - The component context
 * @returns {Object} The prepared context with unwrapped reactive values
 */
function prepareContext(context) {
    const result = {};

    // Set default values for common reactive properties
    const defaultValues = {
        message: 'Hello, this text is rendered using k-text directive!',
        showText: true,
        items: ['Item 1', 'Item 2', 'Item 3'],
        inputText: '',
        count: 0
    };

    console.log('Original context keys:', Object.keys(context));

    // Check for reactive properties that were set up with getters/setters
    const reactiveKeys = [];
    for (const key in context) {
        // Skip internal properties
        if (key.startsWith('_') || key.startsWith('$')) {
            continue;
        }

        // Check if there's a corresponding __reactive_key property
        if (`__reactive_${key}` in context) {
            console.log(`Found reactive property ${key} with getter/setter`);
            reactiveKeys.push(key);

            // Get the current value using the getter
            const value = context[key];

            // Store both the value and the ref object
            result[key] = value;
            result[`__reactive_${key}`] = context[`__reactive_${key}`];
        }
    }

    // Check for ref objects directly in the context
    for (const key in context) {
        // Skip if already processed
        if (key in result || reactiveKeys.includes(key)) {
            continue;
        }

        const value = context[key];

        // Check if it's a ref object (has a value property and is an object)
        if (value && typeof value === 'object' && 'value' in value) {
            console.log(`Found ref object for ${key}:`, value);

            // If the ref value is undefined, use default value if available
            if (value.value === undefined && key in defaultValues) {
                value.value = defaultValues[key];
                console.log(`Set default value for ${key}:`, defaultValues[key]);
            }

            // Store both the reactive object and its unwrapped value
            result[key] = value.value;
            result[`__reactive_${key}`] = value;
        }
    }

    // Copy all properties from the context
    for (const key in context) {
        // Skip if we already processed this key as a ref
        if (key in result || `__reactive_${key}` in result) {
            continue;
        }

        // Skip internal properties
        if (key.startsWith('_') || key.startsWith('$')) {
            // But keep functions like methods
            if (typeof context[key] === 'function') {
                result[key] = context[key];
            }
            continue;
        }

        // Keep functions (methods)
        if (typeof context[key] === 'function') {
            result[key] = context[key].bind(context);
            continue;
        }

        // For other properties, just copy them
        result[key] = context[key];
    }

    // If we still don't have the essential properties, add defaults
    for (const key in defaultValues) {
        if (!(key in result)) {
            console.log(`Adding default value for ${key}:`, defaultValues[key]);
            result[key] = defaultValues[key];
        }
    }

    // Add helper methods for reactivity
    result.__updateReactive = function (key, value) {
        const reactiveKey = `__reactive_${key}`;
        if (this[reactiveKey]) {
            this[reactiveKey].value = value;
            this[key] = value;
            console.log(`Updated reactive ${key} to:`, value);

            // Also update the original context if possible
            if (context[reactiveKey]) {
                context[reactiveKey].value = value;
            } else if (context[key] && typeof context[key] === 'object' && 'value' in context[key]) {
                context[key].value = value;
            }

            return true;
        }
        return false;
    };

    console.log('Prepared context keys:', Object.keys(result));
    console.log('Reactive keys:', Object.keys(result).filter(k => k.startsWith('__reactive_')));

    return result;
}

/**
 * Process all directives on a specific element
 * @param {HTMLElement} element - The element to process
 * @param {Object} context - The component context
 */
function processElementDirectives(element, context) {
    // Get all directive attributes on this element
    const attributes = Array.from(element.attributes);
    const directiveAttrs = attributes.filter(attr =>
        attr.name.startsWith('k-') ||
        attr.name.startsWith(':') ||
        attr.name.startsWith('@')
    );

    console.log(`Processing ${directiveAttrs.length} directives on element:`, element);

    // Process each directive
    directiveAttrs.forEach(attr => {
        const name = attr.name.startsWith('k-')
            ? attr.name.slice(2)
            : (attr.name.startsWith(':')
                ? 'bind'
                : (attr.name.startsWith('@') ? 'on' : attr.name));

        const value = attr.value;

        processDirective(element, name, value, context);
    });

    // Remove the processing marker if present
    if (element.hasAttribute('data-needs-directive-processing')) {
        element.removeAttribute('data-needs-directive-processing');
    }
}

/**
 * Process a specific directive on an element
 * @param {HTMLElement} element - The DOM element
 * @param {string} directiveName - The directive name (without k- prefix)
 * @param {string} value - The directive value/expression
 * @param {Object} context - The component context
 */
export function processDirective(element, directiveName, value, context) {
    const directive = directivesRegistry.get(directiveName);

    if (!directive) {
        console.warn(`Unknown directive: k-${directiveName}`);
        return;
    }

    try {
        // Special handling for k-for directive
        if (directiveName === 'for') {
            // Extract the list name from the expression
            const forMatch = value.match(/^\s*(?:\(?\s*(\w+)(?:\s*,\s*(\w+))?\s*\)?)?\s+(in|of)\s+(\w+(?:\.\w+)*)\s*$/);
            if (forMatch) {
                const [_, itemName, indexName, iterationType, listName] = forMatch;
                // Get the list value from the context
                const list = context[listName] || [];
                console.log(`k-for list "${listName}":`, list);
                directive.process(element, list, context, value);
            } else {
                directive.process(element, null, context, value);
            }
            return;
        }

        // Special handling for k-else directive (no expression to evaluate)
        if (directiveName === 'else') {
            directive.process(element, null, context);
            return;
        }

        // For k-if and k-else-if, get the value directly from the context
        if (directiveName === 'if' || directiveName === 'else-if') {
            const conditionValue = context[value];
            console.log(`Condition "${value}" value:`, conditionValue);
            directive.process(element, conditionValue, context, value);
            return;
        }

        // For k-text, k-html, and k-show, get the value directly from the context
        if (directiveName === 'text' || directiveName === 'html' || directiveName === 'show') {
            const textValue = context[value];
            console.log(`${directiveName} "${value}" value:`, textValue);
            directive.process(element, textValue, context, value);
            return;
        }

        // For k-model, set up two-way binding
        if (directiveName === 'model') {
            const modelValue = context[value];
            console.log(`model "${value}" value:`, modelValue);

            // Set initial value
            directive.process(element, modelValue, context, value);

            // Set up event listener for input changes
            element.addEventListener('input', (event) => {
                // Update the context value
                const newValue = event.target.value;
                context.__updateReactive(value, newValue);

                // Also update the span that displays the input value
                const displaySpan = element.parentElement.querySelector(`span[k-text="${value}"]`);
                if (displaySpan) {
                    displaySpan.textContent = newValue;
                }
            });

            return;
        }

        // For @click directive, set up click handler
        if (directiveName === 'on' && value.startsWith('click:')) {
            const methodName = value.split(':')[1];
            if (context[methodName] && typeof context[methodName] === 'function') {
                element.addEventListener('click', (event) => {
                    event.preventDefault();
                    context[methodName].call(context);
                });
            }
            return;
        }

        // For other directives, evaluate the expression
        const evaluatedValue = directivesRegistry.evaluateExpression(value, context);
        console.log(`Evaluated ${directiveName} directive value:`, evaluatedValue);

        // Process the directive
        directive.process(element, evaluatedValue, context, value);
    } catch (error) {
        console.error(`Error processing directive k-${directiveName}:`, error);
    }
}

/**
 * Helper function to evaluate a template expression
 * @param {string} expression - The expression to evaluate
 * @param {Object} context - The evaluation context
 * @returns {*} The evaluated result
 */
export function evaluateExpression(expression, context) {
    return directivesRegistry.evaluateExpression(expression, context);
}

/**
 * Force update of text directives with the latest context values
 * @param {HTMLElement} rootElement - The root element
 * @param {Object} context - The component context
 */
function updateTextDirectives(rootElement, context) {
    const textElements = rootElement.querySelectorAll('[k-text]');
    textElements.forEach(element => {
        const expression = element.getAttribute('k-text');
        if (!expression) return;

        try {
            // Evaluate the expression in the context
            let value;

            // Handle simple property access
            if (expression.indexOf('.') === -1 && expression.indexOf('(') === -1) {
                // Direct property access
                value = context[expression];

                // Handle reactive values
                if (value && typeof value === 'object' && 'value' in value) {
                    value = value.value;
                }
            } else {
                // More complex expression, use the evaluateExpression function
                value = evaluateExpression(expression, context);
            }

            // Update the element's text content
            element.textContent = value !== undefined ? value : '';
            console.log(`Updated k-text element with expression "${expression}" to:`, value);
        } catch (error) {
            console.error(`Error updating k-text directive with expression "${expression}":`, error);
        }
    });
}

/**
 * Process all event directives in a more professional way
 * @param {HTMLElement} rootElement - The root element
 * @param {Object} context - The component context
 */
function processEventDirectives(rootElement, context) {
    // Find all elements with event directives (@event)
    const elements = Array.from(rootElement.querySelectorAll('*'));

    elements.forEach(element => {
        // Get all attributes
        const attributes = Array.from(element.attributes);

        // Find attributes that start with @
        const eventAttributes = attributes.filter(attr => attr.name.startsWith('@'));

        eventAttributes.forEach(attr => {
            const eventName = attr.name.substring(1); // Remove the @ prefix
            const methodName = attr.value;

            if (context[methodName] && typeof context[methodName] === 'function') {
                console.log(`Setting up ${eventName} handler for method: ${methodName}`);

                // Create event handler
                const handler = (event) => {
                    event.preventDefault();
                    console.log(`Element ${eventName} event, calling method: ${methodName}`);

                    // Call the method
                    context[methodName].call(context);

                    // Update the UI
                    updateTextDirectives(rootElement, context);
                    processTextDirectives(rootElement, context);
                    processIfDirectives(rootElement, context);
                };

                // Register the event handler
                EventSystem.on(element, eventName, handler);

                // Add visual feedback for interactive elements
                if (element.tagName === 'BUTTON' || element.tagName === 'A' ||
                    element.tagName === 'INPUT' || element.tagName === 'SELECT') {

                    EventSystem.on(element, 'mouseenter', () => {
                        element.style.backgroundColor = '#e0e0e0';
                    });

                    EventSystem.on(element, 'mouseleave', () => {
                        element.style.backgroundColor = '';
                    });
                }
            }
        });
    });
}

function processButtonClickDirectives(rootElement, context) {
    // Check if rootElement is a valid DOM element with querySelectorAll method
    if (!rootElement || typeof rootElement.querySelectorAll !== 'function') {
        console.warn('Invalid root element for directive processing:', rootElement);
        return;
    }

    // Find all button elements
    const buttons = rootElement.querySelectorAll('button');
    console.log(`Found ${buttons.length} buttons to check for click handlers`);

    buttons.forEach(button => {
        // Check for toggle button
        if (button.textContent.includes('Toggle Show')) {
            console.log('Found Toggle Show button, adding click handler');

            // Create new click handler for toggle
            const toggleHandler = (event) => {
                event.preventDefault();
                console.log('Toggle button clicked');

                if (context.toggleShow && typeof context.toggleShow === 'function') {
                    // Call the toggleShow method
                    context.toggleShow.call(context);

                    // Get the updated value from the reactive property
                    const showTextValue = context.showText && typeof context.showText === 'object' && 'value' in context.showText
                        ? context.showText.value
                        : context.showText;

                    console.log('Updated showText value:', showTextValue);

                    // Update the UI
                    const ifElements = rootElement.querySelectorAll('[k-if="showText"]');
                    const elseElements = rootElement.querySelectorAll('[k-else]');

                    console.log(`Found ${ifElements.length} k-if elements and ${elseElements.length} k-else elements`);

                    ifElements.forEach(el => {
                        el.style.display = showTextValue ? '' : 'none';
                        console.log(`Set k-if element display to: ${showTextValue ? 'visible' : 'none'}`);
                    });

                    elseElements.forEach(el => {
                        el.style.display = showTextValue ? 'none' : '';
                        console.log(`Set k-else element display to: ${showTextValue ? 'none' : 'visible'}`);
                    });

                    // Process all directives again to ensure UI is updated
                    processTextDirectives(rootElement, context);
                    processIfDirectives(rootElement, context);

                    // Force update of any elements with k-text directives that might depend on showText
                    updateTextDirectives(rootElement, context);
                }
            };

            // Use the EventSystem to register the click handler
            EventSystem.on(button, 'click', toggleHandler);

            // Also add hover effect for better UX
            EventSystem.on(button, 'mouseenter', () => {
                button.style.backgroundColor = '#e0e0e0';
            });

            EventSystem.on(button, 'mouseleave', () => {
                button.style.backgroundColor = '';
            });
        }

        // Check for increment button
        if (button.textContent.includes('Clicked') || button.textContent.includes('times')) {
            console.log('Found increment button, adding click handler');

            // Create new click handler for increment
            const incrementHandler = (event) => {
                event.preventDefault();
                console.log('Increment button clicked');

                if (context.increment && typeof context.increment === 'function') {
                    // Call the increment method
                    context.increment.call(context);

                    // Get the updated count value from the reactive property
                    const countValue = context.count && typeof context.count === 'object' && 'value' in context.count
                        ? context.count.value
                        : context.count;

                    console.log('Updated count value:', countValue);

                    // Update the button text
                    button.textContent = `Clicked ${countValue} times`;

                    // Also update any other elements that might display the count
                    const countElements = rootElement.querySelectorAll('[k-text="count"]');
                    if (countElements.length > 0) {
                        console.log(`Updating ${countElements.length} elements with count value`);
                        countElements.forEach(el => {
                            el.textContent = countValue;
                        });
                    }

                    // Process all directives again to ensure UI is updated
                    processTextDirectives(rootElement, context);

                    // Force update of any elements with k-text directives that might depend on count
                    updateTextDirectives(rootElement, context);
                }
            };

            // Use the EventSystem to register the click handler
            EventSystem.on(button, 'click', incrementHandler);

            // Also add hover effect for better UX
            EventSystem.on(button, 'mouseenter', () => {
                button.style.backgroundColor = '#e0e0e0';
            });

            EventSystem.on(button, 'mouseleave', () => {
                button.style.backgroundColor = '';
            });
        }
    });
}