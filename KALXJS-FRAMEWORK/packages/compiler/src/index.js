// @kalxjs/compiler - Main entry point

import { parse } from './parser.js';
import { parse as parseImproved } from './improved-parser.js';
import { parse as parseRobust } from './robust-parser.js';
import { parse as parseSimple } from './simple-parser.js';
import { compile } from './compiler.js';
import { generateCode } from './codegen.js';

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

// Export individual modules
export { parse } from './parser.js';
export { compile } from './compiler.js';
export { generateCode } from './codegen.js';
// Use the fixed version of the plugin
export { default as vitePlugin } from './vite-plugin-klx-fixed.js';

// Export Priority 1 - Enhanced Template Directives
export * from './directives/index.js';