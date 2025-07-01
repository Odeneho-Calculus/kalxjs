// @kalxjs/compiler - Template Compiler
// This file provides the template compiler for KalxJS templates with k-directives

// Import JSDOM for server-side DOM parsing
let DOMParser;
let Node;

// Check if we're in a browser or Node.js environment
if (typeof window !== 'undefined' && window.DOMParser) {
    DOMParser = window.DOMParser;
    Node = window.Node;
} else {
    // We're in Node.js, use a simple mock implementation
    DOMParser = class {
        parseFromString(html) {
            return {
                body: {
                    firstChild: {
                        nodeType: 1, // ELEMENT_NODE
                        tagName: 'DIV',
                        attributes: [],
                        childNodes: [],
                        children: [],
                        setAttribute: () => { },
                        getAttribute: () => null,
                        hasAttribute: () => false,
                        removeAttribute: () => { }
                    }
                }
            };
        }
    };

    Node = {
        ELEMENT_NODE: 1,
        TEXT_NODE: 3,
        COMMENT_NODE: 8
    };
}

/**
 * Compile a template string with KalxJS directives
 * @param {string} template - The template string
 * @param {Object} options - Compilation options
 * @returns {Object} Compiled template result
 */
export function compileTemplate(template, options = {}) {
    try {
        console.log('[template-compiler] Compiling template');

        // Parse the template into a DOM structure
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${template}</div>`, 'text/html');
        const templateRoot = doc.body.firstChild;

        // Process the template
        processNode(templateRoot, options);

        // Generate the render function
        const renderFunction = generateRenderFunction(templateRoot, options);

        return {
            code: renderFunction,
            ast: templateRoot,
            errors: []
        };
    } catch (error) {
        console.error('[template-compiler] Template compilation error:', error);

        // Return a fallback render function
        return {
            code: generateErrorRenderFunction(error),
            errors: [error.message]
        };
    }
}

/**
 * Process a DOM node and its children for directives
 * @param {Node} node - The DOM node to process
 * @param {Object} options - Processing options
 */
function processNode(node, options) {
    if (!node) return;

    // Process element nodes
    if (node.nodeType === Node.ELEMENT_NODE) {
        // Process directives
        processDirectives(node, options);

        // Process children recursively
        Array.from(node.childNodes).forEach(child => {
            processNode(child, options);
        });
    }
}

/**
 * Process directives on an element
 * @param {Element} el - The element to process
 * @param {Object} options - Processing options
 */
function processDirectives(el, options) {
    if (!el || !el.attributes) return;

    // Get all attributes
    const attributes = Array.from(el.attributes);

    // Process k-for directive first (it affects the structure)
    const forAttr = attributes.find(attr => attr.name === 'k-for');
    if (forAttr) {
        processForDirective(el, forAttr.value, options);
    }

    // Process k-if, k-else-if, k-else directives
    const ifAttr = attributes.find(attr => attr.name === 'k-if');
    if (ifAttr) {
        processIfDirective(el, ifAttr.value, options);
    }

    const elseIfAttr = attributes.find(attr => attr.name === 'k-else-if');
    if (elseIfAttr) {
        processElseIfDirective(el, elseIfAttr.value, options);
    }

    const elseAttr = attributes.find(attr => attr.name === 'k-else');
    if (elseAttr) {
        processElseDirective(el, options);
    }

    // Process other directives
    attributes.forEach(attr => {
        const name = attr.name;
        const value = attr.value;

        // Skip already processed directives
        if (['k-for', 'k-if', 'k-else-if', 'k-else'].includes(name)) {
            return;
        }

        // Process k-bind shorthand (:prop)
        if (name.startsWith(':')) {
            const prop = name.slice(1);
            processBindDirective(el, prop, value, options);
            return;
        }

        // Process k-on shorthand (@event)
        if (name.startsWith('@')) {
            const event = name.slice(1);
            processOnDirective(el, event, value, options);
            return;
        }

        // Process regular k-directives
        if (name.startsWith('k-')) {
            const parts = name.slice(2).split(':');
            const directive = parts[0];
            const arg = parts[1] || null;

            switch (directive) {
                case 'bind':
                    processBindDirective(el, arg, value, options);
                    break;
                case 'model':
                    processModelDirective(el, value, options);
                    break;
                case 'text':
                    processTextDirective(el, value, options);
                    break;
                case 'html':
                    processHtmlDirective(el, value, options);
                    break;
                case 'show':
                    processShowDirective(el, value, options);
                    break;
                case 'slot':
                    processSlotDirective(el, arg, value, options);
                    break;
                case 'pre':
                    // Skip processing for this element and its children
                    el.setAttribute('k-pre-processed', 'true');
                    break;
                case 'once':
                    el.setAttribute('k-once-processed', 'true');
                    break;
                case 'memo':
                    processMemoDirective(el, value, options);
                    break;
                case 'cloak':
                    // Remove k-cloak when processed
                    el.removeAttribute('k-cloak');
                    break;
                default:
                    // Unknown directive
                    console.warn(`[template-compiler] Unknown directive: ${name}`);
            }
        }
    });
}

/**
 * Process k-for directive
 * @param {Element} el - The element with the directive
 * @param {string} expression - The directive expression
 * @param {Object} options - Processing options
 */
function processForDirective(el, expression, options) {
    // Mark the element as processed
    el.setAttribute('k-for-processed', expression);

    // Parse the expression (e.g., "item in items" or "(item, index) in items")
    const forMatch = expression.match(/^\s*(?:\(?\s*(\w+)(?:\s*,\s*(\w+))?\s*\)?|\s*(\w+))\s+in\s+(\w+(?:\.\w+)*)\s*$/);
    if (!forMatch) {
        console.error(`[template-compiler] Invalid k-for expression: ${expression}`);
        return;
    }

    // Extract the item name, index name, and list name
    const itemName = forMatch[1] || forMatch[3];
    const indexName = forMatch[2];
    const listName = forMatch[4];

    // Store the information for the render function
    el.setAttribute('k-for-item', itemName);
    if (indexName) {
        el.setAttribute('k-for-index', indexName);
    }
    el.setAttribute('k-for-list', listName);

    // Create a template for the item
    const template = el.outerHTML;
    el.setAttribute('k-for-template', template);
}

/**
 * Process k-if directive
 * @param {Element} el - The element with the directive
 * @param {string} expression - The directive expression
 * @param {Object} options - Processing options
 */
function processIfDirective(el, expression, options) {
    // Mark the element as processed
    el.setAttribute('k-if-processed', expression);
}

/**
 * Process k-else-if directive
 * @param {Element} el - The element with the directive
 * @param {string} expression - The directive expression
 * @param {Object} options - Processing options
 */
function processElseIfDirective(el, expression, options) {
    // Check if the previous sibling has k-if or k-else-if
    const prevSibling = el.previousElementSibling;
    if (!prevSibling || (!prevSibling.hasAttribute('k-if-processed') && !prevSibling.hasAttribute('k-else-if-processed'))) {
        console.warn('[template-compiler] k-else-if used without preceding k-if or k-else-if');
        return;
    }

    // Mark the element as processed
    el.setAttribute('k-else-if-processed', expression);
}

/**
 * Process k-else directive
 * @param {Element} el - The element with the directive
 * @param {Object} options - Processing options
 */
function processElseDirective(el, options) {
    // Check if the previous sibling has k-if or k-else-if
    const prevSibling = el.previousElementSibling;
    if (!prevSibling || (!prevSibling.hasAttribute('k-if-processed') && !prevSibling.hasAttribute('k-else-if-processed'))) {
        console.warn('[template-compiler] k-else used without preceding k-if or k-else-if');
        return;
    }

    // Mark the element as processed
    el.setAttribute('k-else-processed', 'true');
}

/**
 * Process k-bind directive
 * @param {Element} el - The element with the directive
 * @param {string} prop - The property to bind to
 * @param {string} expression - The directive expression
 * @param {Object} options - Processing options
 */
function processBindDirective(el, prop, expression, options) {
    // Mark the element as processed
    el.setAttribute(`k-bind-${prop || 'object'}-processed`, expression);
}

/**
 * Process k-model directive
 * @param {Element} el - The element with the directive
 * @param {string} expression - The directive expression
 * @param {Object} options - Processing options
 */
function processModelDirective(el, expression, options) {
    // Mark the element as processed
    el.setAttribute('k-model-processed', expression);

    // Add k-bind for the value
    processBindDirective(el, 'value', expression, options);

    // Add k-on for the input event
    const eventType = el.tagName === 'SELECT' || (el.tagName === 'INPUT' &&
        (el.type === 'checkbox' || el.type === 'radio')) ? 'change' : 'input';

    const handler = `${expression} = $event.target.${el.type === 'checkbox' ? 'checked' : 'value'}`;
    processOnDirective(el, eventType, handler, options);
}

/**
 * Process k-text directive
 * @param {Element} el - The element with the directive
 * @param {string} expression - The directive expression
 * @param {Object} options - Processing options
 */
function processTextDirective(el, expression, options) {
    // Mark the element as processed
    el.setAttribute('k-text-processed', expression);

    // Clear the element content
    el.textContent = '';

    // Add a placeholder for the expression
    // Use a simple text node representation since we might be in Node.js
    el.textContent = `{{${expression}}}`;
}

/**
 * Process k-html directive
 * @param {Element} el - The element with the directive
 * @param {string} expression - The directive expression
 * @param {Object} options - Processing options
 */
function processHtmlDirective(el, expression, options) {
    // Mark the element as processed
    el.setAttribute('k-html-processed', expression);

    // Clear the element content
    el.innerHTML = '';

    // Add a comment placeholder for the expression
    // Use a simple comment representation since we might be in Node.js
    el.setAttribute('k-html-content', expression);
}

/**
 * Process k-show directive
 * @param {Element} el - The element with the directive
 * @param {string} expression - The directive expression
 * @param {Object} options - Processing options
 */
function processShowDirective(el, expression, options) {
    // Mark the element as processed
    el.setAttribute('k-show-processed', expression);
}

/**
 * Process k-on directive
 * @param {Element} el - The element with the directive
 * @param {string} event - The event name
 * @param {string} expression - The directive expression
 * @param {Object} options - Processing options
 */
function processOnDirective(el, event, expression, options) {
    // Mark the element as processed
    el.setAttribute(`k-on-${event}-processed`, expression);
}

/**
 * Process k-slot directive
 * @param {Element} el - The element with the directive
 * @param {string} name - The slot name
 * @param {string} expression - The directive expression
 * @param {Object} options - Processing options
 */
function processSlotDirective(el, name, expression, options) {
    // Mark the element as processed
    el.setAttribute('k-slot-processed', name || 'default');

    if (expression) {
        el.setAttribute('k-slot-scope', expression);
    }
}

/**
 * Process k-memo directive
 * @param {Element} el - The element with the directive
 * @param {string} expression - The directive expression
 * @param {Object} options - Processing options
 */
function processMemoDirective(el, expression, options) {
    // Mark the element as processed
    el.setAttribute('k-memo-processed', expression);
}

/**
 * Generate a render function from a processed template
 * @param {Node} root - The root node of the processed template
 * @param {Object} options - Generation options
 * @returns {string} The render function code
 */
function generateRenderFunction(root, options) {
    // Start the render function
    let code = `function render(_ctx) {
  const { h, applyDirectives } = _ctx.$framework;
  
  // Helper function to create elements with directives
  function createElement(tag, props, children, directives) {
    const el = h(tag, props, children);
    if (directives) {
      applyDirectives(el, _ctx, directives);
    }
    return el;
  }
  
  // Create the root element
  return `;

    // Generate code for the root element
    code += generateElementCode(root.firstChild);

    // Close the render function
    code += `;\n}`;

    return code;
}

/**
 * Generate code for an element
 * @param {Element} el - The element to generate code for
 * @returns {string} The element code
 */
function generateElementCode(el) {
    if (!el) return 'null';

    // Handle text nodes
    if (el.nodeType === Node.TEXT_NODE) {
        const text = el.textContent.trim();
        if (!text) return 'null';

        // Check for interpolation
        if (text.match(/\{\{\s*([^}]+)\s*\}\}/)) {
            return generateInterpolationCode(text);
        }

        return JSON.stringify(text);
    }

    // Handle comment nodes
    if (el.nodeType === Node.COMMENT_NODE) {
        return 'null';
    }

    // Handle element nodes
    if (el.nodeType === Node.ELEMENT_NODE) {
        // Check for k-for directive
        if (el.hasAttribute('k-for-processed')) {
            return generateForCode(el);
        }

        // Check for k-if, k-else-if, k-else directives
        if (el.hasAttribute('k-if-processed') ||
            el.hasAttribute('k-else-if-processed') ||
            el.hasAttribute('k-else-processed')) {
            return generateConditionalCode(el);
        }

        // Generate code for a regular element
        return generateRegularElementCode(el);
    }

    return 'null';
}

/**
 * Generate code for text interpolation
 * @param {string} text - The text with interpolation
 * @returns {string} The interpolation code
 */
function generateInterpolationCode(text) {
    // Replace {{ expr }} with _ctx.expr
    return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expr) => {
        return `_ctx.${expr.trim()}`;
    });
}

/**
 * Generate code for k-for directive
 * @param {Element} el - The element with k-for directive
 * @returns {string} The for loop code
 */
function generateForCode(el) {
    const itemName = el.getAttribute('k-for-item');
    const indexName = el.getAttribute('k-for-index');
    const listName = el.getAttribute('k-for-list');

    // Generate the loop code
    let code = `_ctx.${listName}.map((${itemName}`;
    if (indexName) {
        code += `, ${indexName}`;
    }
    code += ') => {\n';

    // Generate the element code
    code += `  return ${generateRegularElementCode(el)};\n`;

    // Close the loop
    code += '})';

    return code;
}

/**
 * Generate code for conditional directives
 * @param {Element} el - The element with conditional directive
 * @returns {string} The conditional code
 */
function generateConditionalCode(el) {
    let code = '';

    if (el.hasAttribute('k-if-processed')) {
        const condition = el.getAttribute('k-if-processed');
        code = `_ctx.${condition} ? ${generateRegularElementCode(el)} : `;

        // Check for k-else-if or k-else siblings
        let nextEl = el.nextElementSibling;
        while (nextEl) {
            if (nextEl.hasAttribute('k-else-if-processed')) {
                const elseIfCondition = nextEl.getAttribute('k-else-if-processed');
                code += `_ctx.${elseIfCondition} ? ${generateRegularElementCode(nextEl)} : `;
                nextEl = nextEl.nextElementSibling;
            } else if (nextEl.hasAttribute('k-else-processed')) {
                code += generateRegularElementCode(nextEl);
                break;
            } else {
                code += 'null';
                break;
            }
        }

        if (!code.endsWith(' : ') && !code.endsWith('null')) {
            code += 'null';
        }
    } else if (el.hasAttribute('k-else-if-processed')) {
        // This should be handled by the k-if element
        return 'null';
    } else if (el.hasAttribute('k-else-processed')) {
        // This should be handled by the k-if element
        return 'null';
    }

    return code;
}

/**
 * Generate code for a regular element
 * @param {Element} el - The element to generate code for
 * @returns {string} The element code
 */
function generateRegularElementCode(el) {
    // Get the tag name
    const tag = el.tagName.toLowerCase();

    // Generate props
    const props = {};
    Array.from(el.attributes).forEach(attr => {
        const name = attr.name;
        const value = attr.value;

        // Skip directive attributes
        if (name.startsWith('k-') || name.startsWith(':') || name.startsWith('@')) {
            return;
        }

        props[name] = value;
    });

    // Generate directives
    const directives = {};
    Array.from(el.attributes).forEach(attr => {
        const name = attr.name;
        const value = attr.value;

        // Process directive attributes
        if (name.startsWith('k-') && !name.endsWith('-processed')) {
            const parts = name.slice(2).split(':');
            const directive = parts[0];
            const arg = parts[1] || null;

            directives[directive] = { arg, value };
        } else if (name.startsWith(':')) {
            const prop = name.slice(1);
            directives.bind = directives.bind || {};
            directives.bind[prop] = value;
        } else if (name.startsWith('@')) {
            const event = name.slice(1);
            directives.on = directives.on || {};
            directives.on[event] = value;
        }
    });

    // Generate children
    const children = [];
    Array.from(el.childNodes).forEach(child => {
        const childCode = generateElementCode(child);
        if (childCode !== 'null') {
            children.push(childCode);
        }
    });

    // Generate the element code
    let code = `createElement('${tag}', ${JSON.stringify(props)}, [${children.join(', ')}]`;

    // Add directives if any
    if (Object.keys(directives).length > 0) {
        code += `, ${JSON.stringify(directives)}`;
    }

    code += ')';

    return code;
}

/**
 * Generate an error render function
 * @param {Error} error - The error that occurred
 * @returns {string} The error render function code
 */
function generateErrorRenderFunction(error) {
    return `function render(_ctx) {
  return h('div', {
    style: 'padding: 20px; border: 2px solid red; border-radius: 4px; background-color: #fff5f5; color: #c53030;'
  }, [
    h('h2', {}, ['Template Compilation Error']),
    h('p', {}, [${JSON.stringify(error.message)}]),
    h('pre', { style: 'margin-top: 10px; background: #f8f9fa; padding: 10px; border-radius: 4px; overflow: auto;' }, [
      ${JSON.stringify(error.stack)}
    ])
  ]);
}`;
}