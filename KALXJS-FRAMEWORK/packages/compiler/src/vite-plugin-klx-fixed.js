// @kalxjs/compiler - Vite plugin for .klx files

import { compileKLX } from './index.js';
import path from 'path';
import fs from 'fs';

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
        // Add enforce: 'pre' to ensure this plugin runs before Vite's asset handling
        enforce: 'pre',

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

            // Check if the code is just an export statement pointing to a file path or a JSON string
            // This happens when Vite treats .klx files as assets or when our custom resolver plugin is used
            if (code.trim().startsWith('export default')) {
                if (code.includes('.klx"')) {
                    console.log(`[vite:klx] Detected asset reference in ${fileName}, loading actual file content`);

                    try {
                        // We need to read the actual file content from disk
                        const actualFilePath = cleanId;

                        if (fs.existsSync(actualFilePath)) {
                            code = fs.readFileSync(actualFilePath, 'utf-8');
                            console.log(`[vite:klx] Successfully loaded file content for ${fileName}`);
                        } else {
                            console.error(`[vite:klx] Could not find file at ${actualFilePath}`);
                        }
                    } catch (err) {
                        console.error(`[vite:klx] Error loading file content for ${fileName}:`, err);
                    }
                } else if (code.includes('"<template>')) {
                    // This is a JSON string containing the template content
                    try {
                        // Extract the JSON string
                        const match = /export default\s+(.+)/.exec(code);
                        if (match && match[1]) {
                            // Parse the JSON string to get the actual template content
                            code = JSON.parse(match[1]);
                            console.log(`[vite:klx] Successfully extracted template content from JSON for ${fileName}`);
                        }
                    } catch (err) {
                        console.error(`[vite:klx] Error extracting template content from JSON for ${fileName}:`, err);
                    }
                }
            }

            // Check if we have a cached version
            const cacheKey = cleanId + code;
            const cached = compiledCache.get(cacheKey);
            if (cached) {
                return cached;
            }

            try {
                console.log(`[vite:klx] Compiling ${fileName}`);

                // Check if the file has the required sections before compiling
                // Use more robust regex patterns that handle whitespace and attributes better
                const templateRegex = /<template(?:\s+[^>]*)?>([\s\S]*?)<\/template>/i;
                const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/i;

                const templateMatch = templateRegex.exec(code);
                const scriptMatch = scriptRegex.exec(code);

                const hasTemplate = templateMatch !== null;
                const hasScript = scriptMatch !== null;

                console.log(`[vite:klx] File analysis for ${fileName}:`);
                console.log(`- Has template: ${hasTemplate}`);
                console.log(`- Has script: ${hasScript}`);

                if (hasTemplate) {
                    console.log(`- Template content length: ${templateMatch[1].trim().length}`);
                    console.log(`- Template starts with: ${templateMatch[1].trim().substring(0, 50)}...`);
                }

                if (hasScript) {
                    console.log(`- Script content length: ${scriptMatch[1].trim().length}`);
                    console.log(`- Script starts with: ${scriptMatch[1].trim().substring(0, 50)}...`);
                }

                if (!hasTemplate || !hasScript) {
                    console.warn(`[vite:klx] Missing sections in ${fileName}: ${!hasTemplate ? 'template' : ''} ${!hasScript ? 'script' : ''}`);

                    // Log the file content for debugging
                    console.log(`[vite:klx] File content for ${fileName} (first 200 chars):`, code.substring(0, 200));

                    // Add missing sections if needed for testing purposes
                    let modifiedCode = code;

                    if (!hasTemplate) {
                        console.log(`[vite:klx] Adding default template section to ${fileName}`);
                        modifiedCode = `<template>
  <div class="default-component">
    <h2>Default Component</h2>
    <p>This is a default template. Please add a proper template section.</p>
  </div>
</template>
${modifiedCode}`;
                    }

                    if (!hasScript) {
                        console.log(`[vite:klx] Adding default script section to ${fileName}`);
                        modifiedCode = `${modifiedCode}
<script>
export default {
  name: '${path.basename(fileName, '.klx')}',
}
</script>`;
                    }

                    // Use the modified code for compilation if we added sections
                    if (modifiedCode !== code) {
                        console.log(`[vite:klx] Using modified code for ${fileName}`);
                        code = modifiedCode;
                    }
                }

                // Compile the .klx file
                console.log(`[vite:klx] Compiling ${fileName} with options:`, {
                    filename: cleanId,
                    ...rest
                });

                const result = compileKLX(code, {
                    filename: cleanId,
                    ...rest
                });

                // Additional post-processing to fix common issues
                if (result.code) {
                    // Fix trailing commas after return statements
                    result.code = result.code.replace(/return\s+{[^}]*};\s*,/g, (match) => {
                        console.log(`[vite:klx] Fixing trailing comma after return statement in ${fileName}`);
                        return match.replace(',', '');
                    });

                    // Fix trailing commas after function bodies
                    result.code = result.code.replace(/}\s*,\s*}/g, (match) => {
                        console.log(`[vite:klx] Fixing trailing comma after function body in ${fileName}`);
                        return match.replace(',', '');
                    });

                    // Fix syntax errors with multiple commas
                    result.code = result.code.replace(/,\s*,/g, ',');

                    // Log the first 200 characters of the compiled code for debugging
                    console.log(`[vite:klx] Compiled code for ${fileName} (first 200 chars):`, result.code.substring(0, 200));
                }

                // Check for errors
                if (result.errors && result.errors.length > 0) {
                    console.error(`[vite:klx] Compilation errors for ${fileName}:`, result.errors);
                    this.warn(`KLX compilation errors: ${result.errors.join(', ')}`);

                    // If the errors are just about missing template or script sections,
                    // we can continue with the compilation result since we've already added them
                    const criticalErrors = result.errors.filter(err =>
                        !err.includes('No <template> section found') &&
                        !err.includes('No script section found') &&
                        !err.includes('using default template')
                    );

                    // If there are critical errors, create a fallback component
                    if (criticalErrors.length > 0) {
                        console.error(`[vite:klx] Critical errors found for ${fileName}:`, criticalErrors);

                        return {
                            code: `
import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'CompilationErrorComponent',
  render() {
    return h('div', { 
      style: 'padding: 20px; border: 2px solid #e53e3e; border-radius: 4px; background-color: #fff5f5; color: #c53030; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;'
    }, [
      h('h2', { style: 'margin-top: 0; border-bottom: 1px solid #feb2b2; padding-bottom: 10px;' }, ['KLX Compilation Error']),
      h('div', { style: 'margin-top: 20px;' }, [
        h('h3', { style: 'margin-top: 0; font-size: 16px; color: #822727;' }, ['Errors:']),
        h('ul', { style: 'margin-top: 10px;' }, [
          ${criticalErrors.map(err => `h('li', {}, [${JSON.stringify(err)}])`).join(',\n          ')}
        ])
      ])
    ]);
  }
});`,
                            map: null
                        };
                    } else {
                        console.log(`[vite:klx] Non-critical errors found for ${fileName}, continuing with compilation result`);
                    }
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

                // Create an improved fallback component that shows the error with better UI
                const fallbackCode = `
import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'CompilationErrorComponent',
  render() {
    return h('div', { 
      style: 'padding: 20px; border: 2px solid #e53e3e; border-radius: 4px; background-color: #fff5f5; color: #c53030; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;'
    }, [
      h('h2', { style: 'margin-top: 0; border-bottom: 1px solid #feb2b2; padding-bottom: 10px;' }, ['KLX Compilation Error']),
      h('p', { style: 'font-size: 16px;' }, [${JSON.stringify(err.message)}]),
      h('div', { style: 'margin-top: 20px;' }, [
        h('h3', { style: 'margin-top: 0; font-size: 16px; color: #822727;' }, ['Error Details:']),
        h('pre', { 
          style: 'background-color: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 4px; overflow: auto; font-size: 14px; margin-top: 10px;' 
        }, [
          ${JSON.stringify(err.stack || 'No stack trace available')}
        ])
      ]),
      h('div', { style: 'margin-top: 20px; background-color: #fffaf0; border: 1px solid #fbd38d; padding: 15px; border-radius: 4px;' }, [
        h('h3', { style: 'margin-top: 0; font-size: 16px; color: #744210;' }, ['Troubleshooting Tips:']),
        h('ul', { style: 'margin-top: 10px; padding-left: 20px;' }, [
          h('li', {}, ['Check your template syntax for any errors']),
          h('li', {}, ['Ensure all tags are properly closed']),
          h('li', {}, ['Verify that your script section is valid JavaScript']),
          h('li', {}, ['Make sure your component has a <template> section'])
        ])
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

        // Add a resolveId hook to handle .klx imports
        resolveId(id, importer) {
            if (id.endsWith('.klx')) {
                console.log(`[vite:klx] Resolving .klx file: ${id}`);
                // Return the id as is to let Vite handle the resolution
                return null;
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