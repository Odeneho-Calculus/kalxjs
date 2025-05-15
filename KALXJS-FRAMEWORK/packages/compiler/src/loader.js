// @kalxjs/compiler - Webpack loader for .klx files

import { compileKLX } from './index.js';

/**
 * Webpack loader for .klx files
 * @param {string} source - Source code
 * @returns {string} Compiled JavaScript
 */
export function klxLoader(source) {
    const callback = this.async();
    const options = this.getOptions() || {};

    // Set the resource path
    options.filename = this.resourcePath;

    try {
        // Compile the .klx file
        const { code, map, errors } = compileKLX(source, options);

        // Handle compilation errors
        if (errors && errors.length) {
            const errorMessage = errors.map(e => `KLX compilation error: ${e}`).join('\\n');
            callback(new Error(errorMessage));
            return;
        }

        // Return the compiled code
        callback(null, code, map);
    } catch (error) {
        callback(error);
    }
}

/**
 * Vite plugin for .klx files
 * @param {Object} options - Plugin options
 * @returns {Object} Vite plugin
 */
export function viteKlxPlugin(options = {}) {
    return {
        name: 'vite-plugin-klx',

        transform(code, id) {
            // Only process .klx files
            if (!id.endsWith('.klx')) {
                return null;
            }

            try {
                // Compile the .klx file
                const result = compileKLX(code, {
                    ...options,
                    filename: id
                });

                // Handle compilation errors
                if (result.errors && result.errors.length) {
                    const errorMessage = result.errors.map(e => `KLX compilation error: ${e}`).join('\\n');
                    this.error(new Error(errorMessage));
                    return null;
                }

                // Return the compiled code
                return {
                    code: result.code,
                    map: result.map
                };
            } catch (error) {
                this.error(error);
                return null;
            }
        }
    };
}