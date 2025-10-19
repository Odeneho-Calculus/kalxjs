/**
 * @kalxjs/rollup-plugin
 * Rollup plugin for .klx Single File Components
 *
 * Features:
 * - Compiles .klx files to JavaScript
 * - Tree shaking support
 * - Code splitting
 * - TypeScript support
 * - CSS preprocessing
 * - Source maps
 *
 * @module @kalxjs/rollup-plugin
 */

import { compileKLXFile } from '../src/compile-klx.js';
import { createFilter } from '@rollup/pluginutils';
import path from 'path';

/**
 * Create KALXJS Rollup Plugin
 * @param {object} options - Plugin options
 * @returns {object} - Rollup plugin
 */
export default function kalxjsPlugin(options = {}) {
    const {
        include = /\.klx$/,
        exclude,
        sourceMap = true,
        ...compilerOptions
    } = options;

    const filter = createFilter(include, exclude);
    const compiledCache = new Map();

    return {
        name: 'rollup-plugin-kalxjs',

        /**
         * Transform .klx files
         */
        async transform(code, id) {
            if (!filter(id)) return null;

            console.log('[rollup-plugin] Transforming:', id);

            try {
                // Check cache
                const cached = compiledCache.get(id);
                if (cached && cached.source === code) {
                    console.log('[rollup-plugin] Using cached result');
                    return cached.result;
                }

                // Compile .klx file
                const result = await compileKLXFile(code, {
                    filename: id,
                    sourceMap,
                    isProduction: process.env.NODE_ENV === 'production',
                    ...compilerOptions
                });

                const output = {
                    code: result.code,
                    map: result.map
                };

                // Cache result
                compiledCache.set(id, {
                    source: code,
                    result: output
                });

                console.log('[rollup-plugin] Transform successful');

                return output;

            } catch (error) {
                console.error('[rollup-plugin] Transform error:', error);
                this.error({
                    message: `Failed to compile ${id}: ${error.message}`,
                    stack: error.stack
                });
            }
        },

        /**
         * Build start hook
         */
        buildStart() {
            console.log('[rollup-plugin] Build started');
            // Clear cache on new build
            compiledCache.clear();
        },

        /**
         * Build end hook
         */
        buildEnd() {
            console.log('[rollup-plugin] Build ended');
        }
    };
}

export { kalxjsPlugin };