// @kalxjs/compiler - Vite plugin for .klx files
// This plugin is inspired by Vue's Vite plugin for .vue files

import { compileKLX } from './index.js';
import path from 'path';

/**
 * Create a filter function for include/exclude patterns
 * @param {RegExp|RegExp[]} include - Include pattern
 * @param {RegExp|RegExp[]} exclude - Exclude pattern
 * @returns {Function} Filter function
 */
function createFilter(include, exclude) {
    return (id) => {
        if (exclude && testPattern(exclude, id)) {
            return false;
        }
        if (include && !testPattern(include, id)) {
            return false;
        }
        return true;
    };
}

/**
 * Test if a pattern matches a string
 * @param {RegExp|RegExp[]} pattern - Pattern to test
 * @param {string} id - String to test
 * @returns {boolean} Whether the pattern matches
 */
function testPattern(pattern, id) {
    if (Array.isArray(pattern)) {
        return pattern.some(p => testPattern(p, id));
    }
    return pattern.test(id);
}

/**
 * Vite plugin for KalxJS single-file components
 * @param {Object} options - Plugin options
 * @returns {Object} Vite plugin
 */
export default function klxPlugin(options = {}) {
    const { include, exclude, customElement, ...rest } = options;

    // Filter for .klx files
    const filter = createFilter(include || /\.klx$/, exclude);

    // Cache for compiled components
    const compiledCache = new Map();

    return {
        name: 'vite:klx',

        // Handle .klx files as a transform step
        transform(code, id, transformOptions) {
            // Skip if not a .klx file or if excluded
            if (!filter(id)) return null;

            // Remove query parameters from the id (like ?t=1747166908020)
            const cleanId = id.split('?')[0];

            // Skip if not a .klx file
            if (!cleanId.endsWith('.klx')) return null;

            // Get the file name for debugging
            const fileName = path.basename(cleanId);

            // Check if we have a cached version
            const cacheKey = cleanId + code;
            const cached = compiledCache.get(cacheKey);
            if (cached) {
                return cached;
            }

            try {
                console.log(`[vite:klx] Compiling ${fileName}`);

                // Compile the .klx file
                const result = compileKLX(code, {
                    filename: cleanId,
                    ...rest
                });

                // Check for errors
                if (result.errors && result.errors.length > 0) {
                    console.error(`[vite:klx] Compilation errors for ${fileName}:`, result.errors);
                    this.warn(`KLX compilation errors: ${result.errors.join(', ')}`);
                }

                // Add debug information
                const debugCode = `
// KalxJS SFC compiled by vite-plugin-klx
// Source: ${cleanId}
// Timestamp: ${new Date().toISOString()}
${result.code}`;

                // Cache the result
                const output = {
                    code: debugCode,
                    map: result.map
                };

                compiledCache.set(cacheKey, output);

                return output;
            } catch (err) {
                console.error(`[vite:klx] Error compiling ${fileName}:`, err);

                // Create a fallback component that shows the error
                const fallbackCode = `
import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'CompilationErrorComponent',
  render() {
    return h('div', { 
      style: 'padding: 20px; border: 2px solid red; border-radius: 4px; background-color: #fff5f5; color: #c53030;'
    }, [
      h('h2', {}, ['KLX Compilation Error']),
      h('p', {}, [${JSON.stringify(err.message)}]),
      h('pre', { style: 'background-color: #f8f8f8; padding: 10px; overflow: auto; font-size: 12px;' }, [
        ${JSON.stringify(err.stack || 'No stack trace available')}
      ])
    ]);
  }
});
`;

                // Return the fallback component instead of throwing an error
                // This allows the app to still load with an error message
                return {
                    code: fallbackCode,
                    map: null
                };
            }
        },

        // Add a configureServer hook to log when the plugin is loaded
        configureServer(server) {
            console.log('[vite:klx] Plugin initialized');

            // Add a middleware to handle .klx file requests
            server.middlewares.use((req, res, next) => {
                if (req.url && req.url.endsWith('.klx')) {
                    console.log(`[vite:klx] Request for .klx file: ${req.url}`);
                }
                next();
            });
        },

        // Handle HMR for .klx files
        handleHotUpdate(ctx) {
            // Skip if not a .klx file
            if (!ctx.file.endsWith('.klx')) return;

            console.log(`[vite:klx] HMR update for ${path.basename(ctx.file)}`);

            // Clear the cache for this file
            const cacheKey = ctx.file + ctx.content;
            compiledCache.delete(cacheKey);

            // Let Vite handle the update
            return ctx.modules;
        }
    };
}

// Functions are now defined at the top of the file