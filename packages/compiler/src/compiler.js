// @kalxjs/compiler - Compiler for .klx files

import { parseTemplate } from './parser.js';

/**
 * Compiles a parsed KLX component AST
 * @param {Object} ast - AST from the parser
 * @param {Object} options - Compilation options
 * @returns {Object} Compiled component
 */
export function compile(ast, options = {}) {
    const result = {
        template: null,
        script: null,
        style: null,
        errors: [...(ast.errors || [])]
    };

    // Compile template
    if (ast.template) {
        try {
            const templateAst = parseTemplate(ast.template.content);
            result.template = compileTemplate(templateAst, options);
        } catch (error) {
            result.errors.push(`Template compilation error: ${error.message}`);
        }
    }

    // Process script
    if (ast.script) {
        try {
            result.script = processScript(ast.script.content, options);
        } catch (error) {
            result.errors.push(`Script compilation error: ${error.message}`);
        }
    }

    // Process style
    if (ast.style) {
        try {
            result.style = processStyle(ast.style.content, ast.style.scoped, options);
        } catch (error) {
            result.errors.push(`Style compilation error: ${error.message}`);
        }
    }

    return result;
}

/**
 * Compiles a template AST into a render function
 * @param {Object} ast - Template AST
 * @param {Object} options - Compilation options
 * @returns {Object} Compiled template
 */
function compileTemplate(ast, options) {
    // Convert the template AST to a render function
    const renderCode = generateRenderFunction(ast);

    return {
        code: renderCode,
        ast
    };
}

/**
 * Generates a render function from a template AST
 * @private
 * @param {Object} ast - Template AST
 * @returns {string} Render function code
 */
function generateRenderFunction(ast) {
    // Start the render function
    let code = 'function render() {\n';
    code += '  return h(';

    // Generate code for the root element
    code += generateElementCode(ast.children[0]);

    // Close the render function
    code += ');\n}';

    return code;
}

/**
 * Generates code for an element node
 * @private
 * @param {Object} node - Element node
 * @returns {string} Element code
 */
function generateElementCode(node) {
    if (!node) return 'null';

    if (node.type === 'Text') {
        return JSON.stringify(node.content);
    }

    if (node.type === 'Expression') {
        return `this.${node.content}`;
    }

    if (node.type === 'Element') {
        let code = `'${node.tag}', `;

        // Generate attributes
        code += '{ ';
        for (const [key, value] of Object.entries(node.attrs || {})) {
            if (key.startsWith('@')) {
                // Event handler
                const event = key.slice(1);
                code += `on${event.charAt(0).toUpperCase() + event.slice(1)}: this.${value}, `;
            } else if (key.startsWith(':')) {
                // Dynamic attribute
                const attr = key.slice(1);
                code += `${attr}: this.${value}, `;
            } else {
                // Static attribute
                code += `${key}: ${JSON.stringify(value)}, `;
            }
        }
        code += '}, ';

        // Generate children
        if (node.children && node.children.length) {
            code += '[';
            for (const child of node.children) {
                code += generateElementCode(child) + ', ';
            }
            code += ']';
        } else {
            code += '[]';
        }

        return code;
    }

    return 'null';
}

/**
 * Processes the script section
 * @private
 * @param {string} script - Script content
 * @param {Object} options - Compilation options
 * @returns {Object} Processed script
 */
function processScript(script, options) {
    // For now, just return the script as-is
    // In a real implementation, we would analyze and transform the script
    return {
        code: script
    };
}

/**
 * Processes the style section
 * @private
 * @param {string} style - Style content
 * @param {boolean} scoped - Whether the style is scoped
 * @param {Object} options - Compilation options
 * @returns {Object} Processed style
 */
function processStyle(style, scoped, options) {
    if (!scoped) {
        return { code: style };
    }

    // For scoped styles, we would add a unique attribute to all selectors
    // and to the component's root element
    const scopeId = `data-v-${generateScopeId()}`;

    // Simple scoped CSS implementation (a real one would use a CSS parser)
    const scopedStyle = style.replace(/([^{]*){/g, (match, selector) => {
        return `${selector}[${scopeId}] {`;
    });

    return {
        code: scopedStyle,
        scopeId
    };
}

/**
 * Generates a unique scope ID for scoped styles
 * @private
 * @returns {string} Unique ID
 */
function generateScopeId() {
    return Math.random().toString(36).substring(2, 10);
}