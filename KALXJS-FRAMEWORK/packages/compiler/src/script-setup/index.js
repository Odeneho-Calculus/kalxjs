/**
 * @kalxjs/compiler - Script Setup Processing
 * Implements Vue 3-style <script setup> syntax with compiler macros
 *
 * Features:
 * - defineProps() macro
 * - defineEmits() macro
 * - defineExpose() macro
 * - Auto import helpers
 * - Top-level await support
 *
 * @module @kalxjs/compiler/script-setup
 */

import * as babelParser from '@babel/parser';
import * as babelTypes from '@babel/types';
import traverse from '@babel/traverse';
import generate from '@babel/generator';

/**
 * Process <script setup> block
 * @param {string} code - Script setup code
 * @param {object} options - Processing options
 * @returns {object} - Processed script with metadata
 */
export function processScriptSetup(code, options = {}) {
    const { filename = 'anonymous.klx' } = options;

    console.log('[script-setup] Processing script setup block');

    const result = {
        code: '',
        props: null,
        emits: null,
        expose: null,
        imports: [],
        bindings: new Set(),
        hasAwait: false
    };

    try {
        // Parse the code into AST
        const ast = babelParser.parse(code, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript', 'topLevelAwait']
        });

        // Extract macro calls and analyze code
        traverse(ast, {
            // Handle defineProps()
            CallExpression(path) {
                const { callee } = path.node;

                if (babelTypes.isIdentifier(callee)) {
                    if (callee.name === 'defineProps') {
                        result.props = extractDefineProps(path);
                        path.remove();
                    } else if (callee.name === 'defineEmits') {
                        result.emits = extractDefineEmits(path);
                        path.remove();
                    } else if (callee.name === 'defineExpose') {
                        result.expose = extractDefineExpose(path);
                        path.remove();
                    }
                }
            },

            // Track imports
            ImportDeclaration(path) {
                result.imports.push({
                    source: path.node.source.value,
                    specifiers: path.node.specifiers.map(s => ({
                        type: s.type,
                        imported: s.imported?.name,
                        local: s.local.name
                    }))
                });
            },

            // Track top-level variables (bindings)
            VariableDeclaration(path) {
                if (path.parent.type === 'Program') {
                    path.node.declarations.forEach(decl => {
                        if (babelTypes.isIdentifier(decl.id)) {
                            result.bindings.add(decl.id.name);
                        }
                    });
                }
            },

            // Track top-level functions
            FunctionDeclaration(path) {
                if (path.parent.type === 'Program') {
                    if (path.node.id) {
                        result.bindings.add(path.node.id.name);
                    }
                }
            },

            // Check for top-level await
            AwaitExpression(path) {
                let parent = path.parentPath;
                while (parent) {
                    if (parent.isFunctionDeclaration() ||
                        parent.isFunctionExpression() ||
                        parent.isArrowFunctionExpression()) {
                        return; // Inside function, not top-level
                    }
                    parent = parent.parentPath;
                }
                result.hasAwait = true;
            }
        });

        // Generate transformed code
        result.code = generateSetupFunction(ast, result);

        console.log('[script-setup] Processing complete');
        console.log(`  - Props: ${result.props ? 'defined' : 'none'}`);
        console.log(`  - Emits: ${result.emits ? 'defined' : 'none'}`);
        console.log(`  - Expose: ${result.expose ? 'defined' : 'none'}`);
        console.log(`  - Bindings: ${result.bindings.size}`);
        console.log(`  - Top-level await: ${result.hasAwait}`);

        return result;

    } catch (error) {
        console.error('[script-setup] Error processing script setup:', error);
        throw new Error(`Failed to process script setup in ${filename}: ${error.message}`);
    }
}

/**
 * Extract defineProps() macro
 */
function extractDefineProps(path) {
    const args = path.node.arguments;

    if (args.length === 0) {
        return { type: 'runtime', value: null };
    }

    const arg = args[0];

    // Type-only props (TypeScript)
    if (babelTypes.isTSType(arg)) {
        return {
            type: 'type',
            value: generate(arg).code
        };
    }

    // Runtime props (object or array)
    if (babelTypes.isObjectExpression(arg) || babelTypes.isArrayExpression(arg)) {
        return {
            type: 'runtime',
            value: generate(arg).code
        };
    }

    return { type: 'runtime', value: null };
}

/**
 * Extract defineEmits() macro
 */
function extractDefineEmits(path) {
    const args = path.node.arguments;

    if (args.length === 0) {
        return { type: 'runtime', value: null };
    }

    const arg = args[0];

    // Type-only emits (TypeScript)
    if (babelTypes.isTSType(arg)) {
        return {
            type: 'type',
            value: generate(arg).code
        };
    }

    // Runtime emits (array)
    if (babelTypes.isArrayExpression(arg)) {
        return {
            type: 'runtime',
            value: generate(arg).code
        };
    }

    return { type: 'runtime', value: null };
}

/**
 * Extract defineExpose() macro
 */
function extractDefineExpose(path) {
    const args = path.node.arguments;

    if (args.length === 0) {
        return null;
    }

    const arg = args[0];

    if (babelTypes.isObjectExpression(arg)) {
        return {
            value: generate(arg).code
        };
    }

    return null;
}

/**
 * Generate setup function from AST
 */
function generateSetupFunction(ast, metadata) {
    const { code } = generate(ast, {
        compact: false,
        retainLines: true
    });

    return code;
}

/**
 * Compile macro - converts defineProps/defineEmits/defineExpose to runtime code
 */
export function compileMacros(setupResult, options = {}) {
    let code = '';

    // Import required helpers
    code += `import { defineComponent } from '@kalxjs/core';\n`;

    // Add user imports
    setupResult.imports.forEach(imp => {
        code += `import `;
        imp.specifiers.forEach((spec, i) => {
            if (i > 0) code += ', ';
            if (spec.type === 'ImportDefaultSpecifier') {
                code += spec.local;
            } else if (spec.type === 'ImportNamespaceSpecifier') {
                code += `* as ${spec.local}`;
            } else {
                code += `{ ${spec.imported}${spec.local !== spec.imported ? ` as ${spec.local}` : ''} }`;
            }
        });
        code += ` from '${imp.source}';\n`;
    });

    code += '\n';

    // Generate component options
    code += 'export default defineComponent({\n';

    // Props
    if (setupResult.props) {
        code += `  props: ${setupResult.props.value || '{}'},\n`;
    }

    // Emits
    if (setupResult.emits) {
        code += `  emits: ${setupResult.emits.value || '[]'},\n`;
    }

    // Setup function
    code += `  setup(props, { emit, expose }) {\n`;

    // Add setup code
    code += `    ${setupResult.code.split('\n').join('\n    ')}\n`;

    // Return bindings
    code += '\n    return {\n';
    for (const binding of setupResult.bindings) {
        code += `      ${binding},\n`;
    }
    code += '    };\n';

    code += '  }\n';
    code += '});\n';

    return code;
}

export default { processScriptSetup, compileMacros };