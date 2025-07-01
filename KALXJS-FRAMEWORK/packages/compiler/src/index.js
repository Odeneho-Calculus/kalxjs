// @kalxjs/compiler - Main entry point

import { parse } from './parser.js';
import { parse as parseImproved } from './improved-parser.js';
import { parse as parseRobust } from './robust-parser.js';
import { parse as parseSimple } from './simple-parser.js';
import { compile } from './compiler.js';
import { generateCode } from './codegen.js';
import { parseSFC } from './sfc-parser.js';
import { compileSFC } from './sfc-compiler.js';

/**
 * Compiles a KLX single-file component into JavaScript
 * @param {string} source - Source code of the .klx file
 * @param {Object} options - Compilation options
 * @returns {Object} Compilation result with JavaScript code
 */
export function compileKLX(source, options = {}) {
    // Parse the .klx file into an AST
    // Try the simple parser first, then robust parser, then improved parser, then fall back to the original
    let ast;
    try {
        ast = parseSimple(source);
        console.log('[compiler] Using simple parser');
    } catch (simpleError) {
        console.warn('[compiler] Simple parser failed, trying robust parser:', simpleError);
        try {
            ast = parseRobust(source);
            console.log('[compiler] Using robust parser');
        } catch (error) {
            console.warn('[compiler] Robust parser failed, trying improved parser:', error);
            try {
                ast = parseImproved(source);
                console.log('[compiler] Using improved parser');
            } catch (improvedError) {
                console.warn('[compiler] Improved parser failed, falling back to original parser:', improvedError);
                ast = parse(source);
                console.log('[compiler] Using original parser');
            }
        }
    }

    // Compile the AST
    const compiled = compile(ast, options);

    // Generate JavaScript code
    const { code, map } = generateCode(compiled, options);

    return {
        code,
        map,
        ast,
        errors: compiled.errors || []
    };
}

/**
 * Compiles a KAL single-file component into JavaScript
 * @param {string} source - Source code of the .kal file
 * @param {Object} options - Compilation options
 * @returns {Object} Compilation result with JavaScript code
 */
export function compileKAL(source, options = {}) {
    console.log('[compiler] Compiling KAL file');

    try {
        // Parse the .kal file into an AST using the SFC parser
        const ast = parseSFC(source);

        // Compile the AST using the SFC compiler
        const compiled = compileSFC(ast, options);

        // Generate JavaScript code
        const { code, map } = generateCode(compiled, options);

        return {
            code,
            map,
            ast,
            errors: compiled.errors || []
        };
    } catch (error) {
        console.error('[compiler] Error compiling KAL file:', error);

        // Return a minimal result with the error
        return {
            code: `
// KAL compilation error
console.error('KAL compilation error:', ${JSON.stringify(error.message)});
export default {
  name: 'CompilationErrorComponent',
  render: () => h('div', { style: 'color: red' }, ['Compilation Error: ' + ${JSON.stringify(error.message)}])
};`,
            map: null,
            ast: null,
            errors: [error.message]
        };
    }
}

// Export individual modules
export { parse } from './parser.js';
export { compile } from './compiler.js';
export { generateCode } from './codegen.js';
export { parseSFC } from './sfc-parser.js';
export { compileSFC } from './sfc-compiler.js';

// Export plugins
export { default as vitePlugin } from './vite-plugin-klx-fixed.js';
export { default as kalPlugin } from './vite-plugin-kal.js';