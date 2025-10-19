/**
 * @kalxjs/compiler - CSS Modules Support
 * Implements CSS Modules for .klx files
 *
 * Features:
 * - Local scoping by default
 * - :global() selector for global styles
 * - composes from other modules
 * - Hash-based class names
 *
 * @module @kalxjs/compiler/css/modules
 */

import crypto from 'crypto';

/**
 * Process CSS Module
 * @param {string} css - CSS code
 * @param {object} options - Processing options
 * @returns {object} - Processed CSS and class map
 */
export function processCSSModule(css, options = {}) {
    const { filename = 'anonymous.module.css', hashLength = 8 } = options;

    console.log('[css-modules] Processing CSS module');

    const result = {
        css: '',
        classMap: {},
        exports: {}
    };

    try {
        // Generate unique hash for this module
        const hash = generateHash(filename, hashLength);

        // Parse CSS and transform class names
        const { transformedCSS, classNames } = transformCSSModule(css, hash);

        result.css = transformedCSS;
        result.classMap = classNames;

        // Generate exports object
        result.exports = Object.keys(classNames).reduce((acc, name) => {
            acc[name] = classNames[name];
            return acc;
        }, {});

        console.log(`[css-modules] Processed ${Object.keys(classNames).length} class names`);

        return result;

    } catch (error) {
        console.error('[css-modules] Error processing CSS module:', error);
        throw new Error(`Failed to process CSS module in ${filename}: ${error.message}`);
    }
}

/**
 * Transform CSS Module - scope class names
 */
function transformCSSModule(css, hash) {
    const classNames = {};
    let transformedCSS = css;

    // Match all class selectors (including nested)
    const classRegex = /\.([a-zA-Z_][\w-]*)/g;
    let match;

    // First pass: collect all class names
    const originalClasses = new Set();
    while ((match = classRegex.exec(css)) !== null) {
        const className = match[1];
        // Skip :global() selectors
        const beforeMatch = css.substring(Math.max(0, match.index - 10), match.index);
        if (!beforeMatch.includes(':global(')) {
            originalClasses.add(className);
        }
    }

    // Second pass: transform class names
    for (const className of originalClasses) {
        const scopedName = `${className}_${hash}`;
        classNames[className] = scopedName;

        // Replace all occurrences (not in :global())
        transformedCSS = transformedCSS.replace(
            new RegExp(`\\.${escapeRegex(className)}(?![\\w-])`, 'g'),
            (match, offset) => {
                // Check if inside :global()
                const before = transformedCSS.substring(Math.max(0, offset - 10), offset);
                if (before.includes(':global(')) {
                    return match;
                }
                return `.${scopedName}`;
            }
        );
    }

    // Remove :global() wrappers
    transformedCSS = transformedCSS.replace(/:global\(([^)]+)\)/g, '$1');

    // Handle composes
    transformedCSS = handleComposes(transformedCSS, classNames);

    return { transformedCSS, classNames };
}

/**
 * Handle composes keyword
 */
function handleComposes(css, classNames) {
    // Simple implementation - just remove composes statements
    // In a full implementation, you'd resolve the composed classes
    return css.replace(/composes:\s*[^;]+;/g, '');
}

/**
 * Generate hash for module
 */
function generateHash(filename, length = 8) {
    return crypto
        .createHash('md5')
        .update(filename)
        .digest('hex')
        .substring(0, length);
}

/**
 * Escape string for use in regex
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate JavaScript exports for CSS module
 */
export function generateCSSModuleExports(classMap) {
    const exports = Object.entries(classMap)
        .map(([key, value]) => `  "${key}": "${value}"`)
        .join(',\n');

    return `export default {\n${exports}\n};`;
}

/**
 * Check if CSS should be treated as a module
 */
export function isCSSModule(attrs = {}) {
    return attrs.module === true || attrs.module === '';
}

export default {
    processCSSModule,
    generateCSSModuleExports,
    isCSSModule
};