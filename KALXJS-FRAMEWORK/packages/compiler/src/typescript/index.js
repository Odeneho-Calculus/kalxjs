/**
 * @kalxjs/compiler - TypeScript Support
 * Provides TypeScript compilation for .klx files with <script lang="ts">
 *
 * Features:
 * - TypeScript to JavaScript compilation
 * - Type checking (optional)
 * - Source maps
 * - JSX/TSX support
 *
 * @module @kalxjs/compiler/typescript
 */

import typescript from 'typescript';

/**
 * TypeScript compiler options
 */
const DEFAULT_COMPILER_OPTIONS = {
    target: typescript.ScriptTarget.ES2020,
    module: typescript.ModuleKind.ESNext,
    jsx: typescript.JsxEmit.Preserve,
    strict: false, // Don't enforce strict mode by default
    esModuleInterop: true,
    skipLibCheck: true,
    moduleResolution: typescript.ModuleResolutionKind.NodeJs,
    resolveJsonModule: true,
    isolatedModules: true,
    declaration: false,
    sourceMap: true
};

/**
 * Compile TypeScript code to JavaScript
 * @param {string} code - TypeScript code
 * @param {object} options - Compilation options
 * @returns {object} - Compiled result
 */
export function compileTypeScript(code, options = {}) {
    const {
        filename = 'anonymous.ts',
        sourceMap = true,
        typeCheck = false,
        compilerOptions = {}
    } = options;

    console.log('[typescript] Compiling TypeScript code');

    try {
        // Merge compiler options
        const tsOptions = {
            ...DEFAULT_COMPILER_OPTIONS,
            ...compilerOptions,
            sourceMap
        };

        // Compile TypeScript
        const result = typescript.transpileModule(code, {
            compilerOptions: tsOptions,
            fileName: filename,
            reportDiagnostics: typeCheck
        });

        // Check for errors
        if (typeCheck && result.diagnostics && result.diagnostics.length > 0) {
            const errors = formatDiagnostics(result.diagnostics);
            console.warn('[typescript] Type errors found:', errors);
        }

        console.log('[typescript] Compilation successful');

        return {
            code: result.outputText,
            map: result.sourceMapText ? JSON.parse(result.sourceMapText) : null,
            diagnostics: result.diagnostics || []
        };

    } catch (error) {
        console.error('[typescript] Compilation error:', error);
        throw new Error(`TypeScript compilation failed for ${filename}: ${error.message}`);
    }
}

/**
 * Type check TypeScript code
 * @param {string} code - TypeScript code
 * @param {object} options - Options
 * @returns {array} - Array of diagnostics
 */
export function typeCheck(code, options = {}) {
    const { filename = 'anonymous.ts', compilerOptions = {} } = options;

    console.log('[typescript] Type checking code');

    try {
        const tsOptions = {
            ...DEFAULT_COMPILER_OPTIONS,
            ...compilerOptions,
            noEmit: true
        };

        // Create a virtual source file
        const sourceFile = typescript.createSourceFile(
            filename,
            code,
            typescript.ScriptTarget.Latest,
            true
        );

        // Create a program
        const host = createCompilerHost(sourceFile, tsOptions);
        const program = typescript.createProgram([filename], tsOptions, host);

        // Get diagnostics
        const diagnostics = [
            ...program.getSyntacticDiagnostics(sourceFile),
            ...program.getSemanticDiagnostics(sourceFile)
        ];

        return diagnostics.map(formatDiagnostic);

    } catch (error) {
        console.error('[typescript] Type check error:', error);
        return [];
    }
}

/**
 * Create virtual compiler host
 */
function createCompilerHost(sourceFile, options) {
    return {
        getSourceFile: (fileName) => {
            if (fileName === sourceFile.fileName) {
                return sourceFile;
            }
            // Return lib files from TypeScript
            return typescript.createSourceFile(
                fileName,
                '',
                typescript.ScriptTarget.Latest
            );
        },
        getDefaultLibFileName: () => 'lib.d.ts',
        writeFile: () => { },
        getCurrentDirectory: () => '',
        getDirectories: () => [],
        fileExists: () => true,
        readFile: () => '',
        getCanonicalFileName: (fileName) => fileName,
        useCaseSensitiveFileNames: () => true,
        getNewLine: () => '\n'
    };
}

/**
 * Format TypeScript diagnostics
 */
function formatDiagnostics(diagnostics) {
    return diagnostics.map(formatDiagnostic).join('\n');
}

/**
 * Format single diagnostic
 */
function formatDiagnostic(diagnostic) {
    const message = typescript.flattenDiagnosticMessageText(
        diagnostic.messageText,
        '\n'
    );

    if (diagnostic.file) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
            diagnostic.start
        );
        return `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`;
    }

    return message;
}

/**
 * Check if code is TypeScript
 */
export function isTypeScript(code, attrs = {}) {
    // Check script lang attribute
    if (attrs.lang === 'ts' || attrs.lang === 'typescript') {
        return true;
    }

    // Heuristic: check for TypeScript-specific syntax
    const tsPatterns = [
        /:\s*(string|number|boolean|any|unknown|never|void)\b/,
        /interface\s+\w+/,
        /type\s+\w+\s*=/,
        /enum\s+\w+/,
        /<.*>\s*\(/,  // Generic functions
        /as\s+(string|number|boolean|any|unknown)/
    ];

    return tsPatterns.some(pattern => pattern.test(code));
}

export default {
    compileTypeScript,
    typeCheck,
    isTypeScript
};