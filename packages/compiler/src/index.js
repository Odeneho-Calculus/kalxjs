// @kalxjs/compiler - Main entry point

import { parse } from './parser.js';
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
    const ast = parse(source);

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