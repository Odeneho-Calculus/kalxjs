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
            console.log(`[compiler] Parsing template for ${options.filename || 'unknown'}`);

            // Check if this is a default template
            if (ast.template.isDefault) {
                console.log(`[compiler] Using default template for ${options.filename || 'unknown'}`);

                // Create a simple render function for the default template
                result.template = {
                    code: `function render() {
  return h('div', { class: 'default-template' }, ['Default Template Content']);
}`
                };
            } else {
                // Parse and compile the actual template
                const templateAst = parseTemplate(ast.template.content);
                result.template = compileTemplate(templateAst, options);
            }
        } catch (error) {
            console.error(`[compiler] Template compilation error:`, error);
            result.errors.push(`Template compilation error: ${error.message}`);

            // Create a fallback template that shows the error
            result.template = {
                code: `function render() {
  return h('div', { 
    style: 'padding: 20px; border: 2px solid red; border-radius: 4px; background-color: #fff5f5; color: #c53030;'
  }, [
    h('h2', {}, ['Template Compilation Error']),
    h('p', {}, [${JSON.stringify(error.message)}])
  ]);
}`
            };
        }
    } else {
        // Instead of just pushing an error, create a more helpful fallback template
        console.warn('No template section found, creating enhanced fallback template');

        // Create a fallback template that's more helpful and visually appealing
        result.template = {
            code: `function render() {
  return h('div', { 
    style: 'padding: 20px; border: 2px solid #3182ce; border-radius: 4px; background-color: #ebf8ff; color: #2c5282;'
  }, [
    h('h2', {}, ['Component Ready']),
    h('p', {}, ['This component is working but needs a template section.']),
    h('div', { style: 'margin-top: 15px; background: #fff; padding: 15px; border-radius: 4px; border: 1px solid #bee3f8;' }, [
      h('h3', { style: 'margin-top: 0; color: #3182ce;' }, ['How to fix this:']),
      h('p', {}, ['Add a <template> section to your .klx file with your component markup.']),
      h('pre', { style: 'background: #2d3748; color: #e2e8f0; padding: 10px; border-radius: 4px; overflow: auto;' }, [
\`<template>
  <div class="my-component">
    <h2>My Component</h2>
    <p>This is my component content</p>
  </div>
</template>\`
      ])
    ])
  ]);
}`
        };

        // Still add the error for reference, but with more helpful message
        result.errors.push('No template section found. A fallback template has been created, but you should add a <template> section to your component.');
    }

    // Process script
    if (ast.script) {
        try {
            console.log(`[compiler] Processing script for ${options.filename || 'unknown'}`);
            console.log(`[compiler] Script content length: ${ast.script.content.length}`);
            console.log(`[compiler] Script content starts with: ${ast.script.content.substring(0, 50)}...`);

            result.script = processScript(ast.script.content, options);

            // Process script setup if present
            if (ast.scriptSetup) {
                console.log(`[compiler] Processing script setup for ${options.filename || 'unknown'}`);
                result.scriptSetup = processScriptSetup(ast.scriptSetup.content, options);
            }
        } catch (error) {
            console.error(`[compiler] Script compilation error:`, error);
            result.errors.push(`Script compilation error: ${error.message}`);
        }
    } else {
        console.warn(`[compiler] No script section found for ${options.filename || 'unknown'}`);
        result.errors.push('No script section found');

        // Create a default script to avoid errors
        result.script = {
            code: `// Default script created by compiler
export default {
  name: 'DefaultComponent'
}`
        };
    }

    // Process style
    if (ast.style) {
        try {
            console.log(`[compiler] Processing style for ${options.filename || 'unknown'}`);
            result.style = processStyle(ast.style.content, ast.style.scoped, options);
        } catch (error) {
            console.error(`[compiler] Style compilation error:`, error);
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
    try {
        // Convert the template AST to a render function
        const renderCode = generateRenderFunction(ast);

        return {
            code: renderCode,
            ast
        };
    } catch (error) {
        console.error(`[compiler] Error in compileTemplate:`, error);
        throw error;
    }
}

/**
 * Generates a render function from a template AST
 * @private
 * @param {Object} ast - Template AST
 * @returns {string} Render function code
 */
function generateRenderFunction(ast) {
    try {
        // Start the render function
        let code = 'function render() {\n';

        // Check if we have any children
        if (!ast.children || ast.children.length === 0) {
            code += '  return h(\'div\', {}, [\'Empty template\']);\n}';
            return code;
        }

        code += '  return h(';

        // Generate code for the root element
        code += generateElementCode(ast.children[0]);

        // Close the render function
        code += ');\n}';

        return code;
    } catch (error) {
        console.error(`[compiler] Error in generateRenderFunction:`, error);

        // Return a fallback render function
        return `function render() {
  return h('div', { 
    style: 'padding: 20px; border: 2px solid red; border-radius: 4px; background-color: #fff5f5; color: #c53030;'
  }, [
    h('h2', {}, ['Render Function Generation Error']),
    h('p', {}, [${JSON.stringify(error.message)}])
  ]);
}`;
    }
}

/**
 * Generates code for an element node
 * @private
 * @param {Object} node - Element node
 * @returns {string} Element code
 */
function generateElementCode(node) {
    if (!node) return 'null';

    try {
        if (node.type === 'Text') {
            // Trim whitespace and check if the content is just whitespace
            const trimmed = node.content.trim();
            if (!trimmed) {
                return '""'; // Return empty string for whitespace-only nodes
            }
            return JSON.stringify(node.content);
        }

        if (node.type === 'Expression') {
            // Handle expressions safely
            return `this.${node.content}`;
        }

        if (node.type === 'Element') {
            // Handle component names (capitalized tags)
            const isComponent = node.tag.charAt(0) === node.tag.charAt(0).toUpperCase();
            let tagCode = isComponent ? node.tag : `'${node.tag}'`;

            let code = `${tagCode}, `;

            // Generate attributes
            code += '{ ';
            for (const [key, value] of Object.entries(node.attrs || {})) {
                // Convert hyphenated attributes to camelCase or quoted property names
                const propKey = key.includes('-') ? `'${key}'` : key;

                if (key.startsWith('on') && typeof value === 'string') {
                    // Event handler
                    code += `${propKey}: this.${value}, `;
                } else if (key.startsWith('v-')) {
                    // Handle directives (simplified)
                    if (key === 'v-if') {
                        // We're not actually implementing v-if here, just showing how it might be handled
                        code += `// v-if="${value}" would be processed here, `;
                    } else if (key === 'v-for') {
                        // We're not actually implementing v-for here, just showing how it might be handled
                        code += `// v-for="${value}" would be processed here, `;
                    } else {
                        code += `// ${key}="${value}" directive not implemented, `;
                    }
                } else if (typeof value === 'string' && value.startsWith('this.')) {
                    // Dynamic attribute already referencing this
                    code += `${propKey}: ${value}, `;
                } else if (typeof value === 'boolean') {
                    // Boolean attribute
                    code += `${propKey}: ${value}, `;
                } else {
                    // Static attribute
                    code += `${propKey}: ${JSON.stringify(value)}, `;
                }
            }
            code += '}, ';

            // Generate children
            if (node.children && node.children.length) {
                code += '[';
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    // For element children, we need to use h() function
                    if (child.type === 'Element') {
                        code += `h(${generateElementCode(child)})`;
                    } else {
                        code += generateElementCode(child);
                    }

                    // Add comma only if not the last child
                    if (i < node.children.length - 1) {
                        code += ', ';
                    }
                }
                code += ']';
            } else {
                code += '[]';
            }

            return code;
        }

        return 'null';
    } catch (error) {
        console.error(`[compiler] Error in generateElementCode for node:`, node, error);
        return `'div', { style: 'color: red;' }, ['Error generating element: ${error.message}']`;
    }
}

/**
 * Processes the script section
 * @private
 * @param {string} script - Script content
 * @param {Object} options - Compilation options
 * @returns {Object} Processed script
 */
function processScript(script, options) {
    try {
        // For now, just return the script as-is
        // In a real implementation, we would analyze and transform the script
        return {
            code: script
        };
    } catch (error) {
        console.error(`[compiler] Error in processScript:`, error);
        throw error;
    }
}

/**
 * Processes the script setup section
 * @private
 * @param {string} scriptSetup - Script setup content
 * @param {Object} options - Compilation options
 * @returns {Object} Processed script setup
 */
function processScriptSetup(scriptSetup, options) {
    try {
        // For now, just return the script setup as-is
        // In a real implementation, we would transform the script setup into setup() function
        return {
            code: scriptSetup,
            isSetup: true
        };
    } catch (error) {
        console.error(`[compiler] Error in processScriptSetup:`, error);
        throw error;
    }
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
    try {
        if (!scoped) {
            return { code: style };
        }

        // For scoped styles, we would add a unique attribute to all selectors
        // and to the component's root element
        const scopeId = `data-v-${generateScopeId(options.filename)}`;

        // Simple scoped CSS implementation (a real one would use a CSS parser)
        const scopedStyle = style.replace(/([^{]*){/g, (match, selector) => {
            return `${selector}[${scopeId}] {`;
        });

        return {
            code: scopedStyle,
            scopeId
        };
    } catch (error) {
        console.error(`[compiler] Error in processStyle:`, error);
        return { code: `/* Error processing style: ${error.message} */` };
    }
}

/**
 * Generates a unique scope ID for scoped styles
 * @private
 * @param {string} filename - Component filename
 * @returns {string} Unique ID
 */
function generateScopeId(filename) {
    if (filename) {
        // Create a hash from the filename
        let hash = 0;
        for (let i = 0; i < filename.length; i++) {
            const char = filename.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36).substring(0, 8);
    }

    // Fallback to random ID
    return Math.random().toString(36).substring(2, 10);
}