// @kalxjs/compiler - SFC Compiler for .kal files
// This compiler processes Single File Components with advanced optimizations

import { parseTemplate } from './sfc-parser.js';
import { compileTemplate as compileTemplateWithDirectives } from './template-compiler.js';
import { parseSFC } from './robust-sfc-parser.js';

/**
 * Compiles a parsed KAL component AST
 * @param {Object} ast - AST from the SFC parser
 * @param {Object} options - Compilation options
 * @returns {Object} Compiled component
 */
export function compileSFC(ast, options = {}) {
    console.log('[sfc-compiler] Compiling KAL component');

    // Use robust parser if option is set
    if (options.useRobustParser && options.source) {
        console.log('[sfc-compiler] Using robust SFC parser');
        ast = parseSFC(options.source);
    }

    const result = {
        template: null,
        script: null,
        style: null,
        customBlocks: {},
        errors: [...(ast.errors || [])]
    };

    // Compile template
    if (ast.template) {
        try {
            console.log(`[sfc-compiler] Parsing template for ${options.filename || 'unknown'}`);

            // Parse and compile the template with directives
            try {
                // First try the new template compiler with directives
                result.template = compileTemplateWithDirectives(ast.template.content, options);
            } catch (error) {
                console.error(`[sfc-compiler] Error using directive-based template compiler:`, error);
                console.log(`[sfc-compiler] Falling back to legacy template compiler`);
                
                // Fall back to the legacy template compiler
                const templateAst = parseTemplate(ast.template.content);
                result.template = compileTemplate(templateAst, options);
            }

            // Store template attributes
            result.template.attrs = ast.template.attrs;
        } catch (error) {
            console.error(`[sfc-compiler] Template compilation error:`, error);
            result.errors.push(`Template compilation error: ${error.message}`);

            // Create a fallback template that shows the error
            result.template = {
                code: `function render(_ctx) {
  return h('div', {
    style: 'padding: 20px; border: 2px solid red; border-radius: 4px; background-color: #fff5f5; color: #c53030;'
  }, [
    h('h2', {}, ['Template Compilation Error']),
    h('p', {}, [${JSON.stringify(error.message)}])
  ]);
}`,

                attrs: ast.template ? ast.template.attrs : {}
            };
        }
    } else {
        console.warn('[sfc-compiler] No template section found, creating enhanced fallback template');

        // Create a fallback template that's more helpful and visually appealing
        result.template = {
            code: `function render(_ctx) {
  return h('div', {
    style: 'padding: 20px; border: 2px solid #3182ce; border-radius: 4px; background-color: #ebf8ff; color: #2c5282;'
  }, [
    h('h2', {}, ['Component Ready']),
    h('p', {}, ['This component is working but needs a template section.']),
    h('div', { style: 'margin-top: 15px; background: #fff; padding: 15px; border-radius: 4px; border: 1px solid #bee3f8;' }, [
      h('h3', { style: 'margin-top: 0; color: #3182ce;' }, ['How to fix this:']),
      h('p', {}, ['Add a <template> section to your .kal file with your component markup.']),
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
}`,
            attrs: {}
        };

        result.errors.push('No template section found. A fallback template has been created, but you should add a <template> section to your component.');
    }

    // Process script
    if (ast.script) {
        try {
            console.log(`[sfc-compiler] Processing script for ${options.filename || 'unknown'}`);

            // Check if this is a setup script
            const isSetupScript = ast.script.attrs && ast.script.attrs.setup === true;

            if (isSetupScript) {
                console.log('[sfc-compiler] Processing script with setup attribute');
                result.script = processScriptSetup(ast.script.content, options);
            } else {
                result.script = processScript(ast.script.content, options);
            }

            // Store script attributes
            result.script.attrs = ast.script.attrs;
        } catch (error) {
            console.error(`[sfc-compiler] Script compilation error:`, error);
            result.errors.push(`Script compilation error: ${error.message}`);

            // Create a default script to avoid errors
            result.script = {
                code: `// Default script created by compiler
export default {
  name: '${options.filename ? options.filename.split('/').pop().replace(/\.\w+$/, '') : 'DefaultComponent'}'
}`,
                attrs: ast.script ? ast.script.attrs : {}
            };
        }
    } else {
        console.warn(`[sfc-compiler] No script section found for ${options.filename || 'unknown'}`);
        result.errors.push('No script section found');

        // Create a default script to avoid errors
        result.script = {
            code: `// Default script created by compiler
export default {
  name: '${options.filename ? options.filename.split('/').pop().replace(/\.\w+$/, '') : 'DefaultComponent'}'
}`,
            attrs: {}
        };
    }

    // Process style
    if (ast.style) {
        try {
            console.log(`[sfc-compiler] Processing style for ${options.filename || 'unknown'}`);
            result.style = processStyle(ast.style.content, ast.style.attrs, options);
        } catch (error) {
            console.error(`[sfc-compiler] Style compilation error:`, error);
            result.errors.push(`Style compilation error: ${error.message}`);

            // Create a default style
            result.style = {
                code: `/* Default style created by compiler */
.component-${options.filename ? options.filename.split('/').pop().replace(/\.\w+$/, '') : 'default'} {
  display: block;
}`,
                attrs: ast.style ? ast.style.attrs : {}
            };
        }
    }

    // Process custom blocks
    if (ast.customBlocks && ast.customBlocks.length > 0) {
        for (const block of ast.customBlocks) {
            try {
                console.log(`[sfc-compiler] Processing custom block: ${block.type}`);
                result.customBlocks[block.type] = {
                    content: block.content,
                    attrs: block.attrs
                };
            } catch (error) {
                console.error(`[sfc-compiler] Custom block compilation error:`, error);
                result.errors.push(`Custom block compilation error (${block.type}): ${error.message}`);
            }
        }
    }

    return result;
}

/**
 * Compiles a template AST into a render function with optimizations
 * @param {Object} ast - Template AST
 * @param {Object} options - Compilation options
 * @returns {Object} Compiled template
 */
function compileTemplate(ast, options) {
    try {
        // Convert the template AST to a render function with optimizations
        let renderCode = generateOptimizedRenderFunction(ast, options);

        return {
            code: renderCode,
            ast
        };
    } catch (error) {
        console.error(`[sfc-compiler] Error in compileTemplate:`, error);
        throw error;
    }
}

/**
 * Generates an optimized render function from a template AST
 * @private
 * @param {Object} ast - Template AST
 * @param {Object} options - Compilation options
 * @returns {string} Render function code
 */
function generateOptimizedRenderFunction(ast, options) {
    try {
        // Start the render function
        let code = 'function render(_ctx) {\n';

        // Add static hoisting for performance optimization
        const staticNodes = [];
        const staticImports = new Set();

        // Analyze the AST for static content
        analyzeStaticContent(ast, staticNodes);

        // Generate static hoisted variables
        if (staticNodes.length > 0) {
            code += '  // Static hoisted content\n';
            staticNodes.forEach((node, index) => {
                code += `  const _hoisted_${index + 1} = ${generateNodeCode(node, staticImports)};\n`;
            });
            code += '\n';
        }

        // Check if we have any children
        if (!ast.children || ast.children.length === 0) {
            code += '  return h(\'div\', {}, [\'Empty template\']);\n}';
            return code;
        }

        // Add openBlock for better diffing
        code += '  return (_openBlock(), _createBlock(';

        // Generate code for the root element with optimizations
        const rootElement = ast.children[0];
        const isStatic = staticNodes.includes(rootElement);

        if (isStatic) {
            // Use the hoisted variable
            const index = staticNodes.indexOf(rootElement);
            code += `_hoisted_${index + 1}`;
        } else {
            // Generate dynamic code
            code += generateElementCode(rootElement, staticNodes);
        }

        // Close the render function
        code += '));\n}';

        return code;
    } catch (error) {
        console.error(`[sfc-compiler] Error in generateOptimizedRenderFunction:`, error);

        // Return a fallback render function
        return `function render(_ctx) {
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
 * Analyzes the AST for static content that can be hoisted
 * @private
 * @param {Object} ast - Template AST
 * @param {Array} staticNodes - Array to collect static nodes
 */
function analyzeStaticContent(ast, staticNodes) {
    // Check if the node is static (no dynamic bindings)
    function isNodeStatic(node) {
        if (node.type === 'Expression') {
            return false;
        }

        if (node.type === 'Element') {
            // Check if any attributes are dynamic
            for (const [key, value] of Object.entries(node.attrs || {})) {
                if (key.startsWith(':') || key.startsWith('@') || key.startsWith('v-')) {
                    return false;
                }
            }

            // Check if all children are static
            return node.children.every(isNodeStatic);
        }

        return true;
    }

    // Collect static nodes
    function collectStaticNodes(node) {
        if (node.type === 'Element') {
            if (isNodeStatic(node)) {
                staticNodes.push(node);
            } else {
                // Even if the node itself is not static, its children might be
                node.children.forEach(collectStaticNodes);
            }
        }
    }

    // Start the analysis from the root
    if (ast.children && ast.children.length > 0) {
        ast.children.forEach(collectStaticNodes);
    }
}

/**
 * Generates code for a node with static hoisting
 * @private
 * @param {Object} node - AST node
 * @param {Set} imports - Set to collect required imports
 * @returns {string} Node code
 */
function generateNodeCode(node, imports) {
    if (node.type === 'Text') {
        return JSON.stringify(node.content);
    }

    if (node.type === 'Expression') {
        return `_ctx.${node.content}`;
    }

    if (node.type === 'Element') {
        // Add required imports
        imports.add('createVNode');

        // Handle component names (capitalized tags)
        const isComponent = node.tag.charAt(0) === node.tag.charAt(0).toUpperCase();
        let tagCode = isComponent ? node.tag : `'${node.tag}'`;

        // Generate attributes
        let attrsCode = '{ ';
        for (const [key, value] of Object.entries(node.attrs || {})) {
            // Convert hyphenated attributes to camelCase or quoted property names
            const propKey = key.includes('-') ? `'${key}'` : key;

            if (typeof value === 'boolean') {
                attrsCode += `${propKey}: true, `;
            } else {
                attrsCode += `${propKey}: ${JSON.stringify(value)}, `;
            }
        }
        attrsCode += '}';

        // Generate children
        let childrenCode = '[';
        for (const child of node.children) {
            childrenCode += generateNodeCode(child, imports) + ', ';
        }
        childrenCode += ']';

        return `_createVNode(${tagCode}, ${attrsCode}, ${childrenCode})`;
    }

    return 'null';
}

/**
 * Generates code for an element node with optimizations
 * @private
 * @param {Object} node - Element node
 * @param {Array} staticNodes - Array of static nodes
 * @returns {string} Element code
 */
function generateElementCode(node, staticNodes) {
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
            return `_toDisplayString(_ctx.${node.content})`;
        }

        if (node.type === 'Element') {
            // Check if this node is static and has been hoisted
            const staticIndex = staticNodes.indexOf(node);
            if (staticIndex !== -1) {
                return `_hoisted_${staticIndex + 1}`;
            }

            // Handle component names (capitalized tags)
            const isComponent = node.tag.charAt(0) === node.tag.charAt(0).toUpperCase();
            let tagCode = isComponent ? node.tag : `'${node.tag}'`;

            let code = `${tagCode}, `;

            // Generate attributes with patch flags
            let patchFlags = 0;
            const dynamicProps = [];

            code += '{ ';
            for (const [key, value] of Object.entries(node.attrs || {})) {
                // Convert hyphenated attributes to camelCase or quoted property names
                const propKey = key.includes('-') ? `'${key}'` : key;

                if (key.startsWith('@') || (key.startsWith('on') && key.length > 2)) {
                    // Event handler
                    const eventName = key.startsWith('@') ? key.slice(1) : key.slice(2);
                    code += `${key.startsWith('@') ? `'on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}'` : propKey}: _ctx.${value}, `;

                    // Set PROPS patch flag
                    patchFlags |= 8; // PatchFlags.PROPS
                    dynamicProps.push(key.startsWith('@') ? `on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}` : propKey);
                } else if (key.startsWith(':') || key.startsWith('v-bind:')) {
                    // Dynamic binding
                    const bindName = key.startsWith(':') ? key.slice(1) : key.slice(7);
                    code += `${bindName}: _ctx.${value}, `;

                    // Set appropriate patch flags
                    if (bindName === 'class') {
                        patchFlags |= 2; // PatchFlags.CLASS
                    } else if (bindName === 'style') {
                        patchFlags |= 4; // PatchFlags.STYLE
                    } else {
                        patchFlags |= 8; // PatchFlags.PROPS
                        dynamicProps.push(bindName);
                    }
                } else if (key === 'v-if' || key === 'v-else' || key === 'v-else-if') {
                    // Conditional rendering - handled separately
                    continue;
                } else if (key === 'v-for') {
                    // List rendering - handled separately
                    continue;
                } else if (key === 'v-model') {
                    // Two-way binding
                    code += `modelValue: _ctx.${value}, 'onUpdate:modelValue': $event => _ctx.${value} = $event, `;

                    // Set PROPS patch flag
                    patchFlags |= 8; // PatchFlags.PROPS
                    dynamicProps.push('modelValue');
                } else {
                    // Static attribute
                    if (typeof value === 'boolean') {
                        code += `${propKey}: true, `;
                    } else {
                        code += `${propKey}: ${JSON.stringify(value)}, `;
                    }
                }
            }
            code += '}, ';

            // Generate children
            code += '[';

            // Check for static children that have been hoisted
            for (const child of node.children) {
                const childStaticIndex = staticNodes.indexOf(child);

                if (childStaticIndex !== -1) {
                    code += `_hoisted_${childStaticIndex + 1}, `;
                } else {
                    code += generateElementCode(child, staticNodes) + ', ';
                }
            }

            code += ']';

            // Add patch flags if any
            if (patchFlags !== 0) {
                code += `, ${patchFlags}`;

                // Add dynamic props if needed
                if (dynamicProps.length > 0 && (patchFlags & 8) !== 0) { // PatchFlags.PROPS
                    code += `, ${JSON.stringify(dynamicProps)}`;
                }
            }

            return code;
        }

        return 'null';
    } catch (error) {
        console.error(`[sfc-compiler] Error in generateElementCode:`, error);
        return '"Error generating element code"';
    }
}

/**
 * Processes a script section
 * @private
 * @param {string} content - Script content
 * @param {Object} options - Compilation options
 * @returns {Object} Processed script
 */
function processScript(content, options) {
    // For now, just return the script content as is
    return {
        code: content
    };
}

/**
 * Processes a script setup section
 * @private
 * @param {string} content - Script setup content
 * @param {Object} options - Compilation options
 * @returns {Object} Processed script setup
 */
function processScriptSetup(content, options) {
    // Check if the content already imports ref
    const hasRefImport = content.includes("import { ref } from '@kalxjs/core'") ||
        content.includes("import {ref} from '@kalxjs/core'") ||
        content.includes("import {ref,") ||
        content.includes("import { ref,");

    // If it doesn't have a ref import, add it to the context
    const setupCode = hasRefImport ? content : `
    // Make ref available from context
    const { ref } = _ctx;
    ${content}
    `;

    // Return the script setup content wrapped in a setup function
    return {
        code: `export default {
  setup(_props, _ctx) {
    ${setupCode}
  }
}`
    };
}

/**
 * Processes a style section
 * @private
 * @param {string} content - Style content
 * @param {Object} attrs - Style attributes
 * @param {Object} options - Compilation options
 * @returns {Object} Processed style
 */
function processStyle(content, attrs, options) {
    // Generate a unique scope ID if scoped
    const scopeId = attrs.scoped ?
        `data-v-${Math.random().toString(36).substring(2, 10)}` :
        null;

    // Process the style content
    let processedContent = content;

    // If scoped, add the scope ID to all selectors
    if (scopeId) {
        // Simple scoping implementation - in a real compiler, this would be more robust
        processedContent = content.replace(/([^{]*){/g, (match, selector) => {
            // Split multiple selectors
            const selectors = selector.split(',');

            // Add scope ID to each selector
            const scopedSelectors = selectors.map(s => {
                s = s.trim();
                // Don't add the scope ID to @media, @keyframes, etc.
                if (s.startsWith('@')) {
                    return s;
                }
                return `${s}[${scopeId}]`;
            });

            return `${scopedSelectors.join(', ')} {`;
        });
    }

    return {
        code: processedContent,
        scopeId
    };
}