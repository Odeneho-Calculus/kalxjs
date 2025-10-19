/**
 * @kalxjs/esbuild-plugin
 * esbuild plugin for .klx Single File Components
 *
 * Features:
 * - Ultra-fast compilation with esbuild
 * - Compiles .klx files to JavaScript
 * - TypeScript support
 * - CSS handling
 * - Source maps
 * - Watch mode support
 *
 * @module @kalxjs/esbuild-plugin
 */

import { compileKLXFile } from '../src/compile-klx.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Create KALXJS esbuild Plugin
 * @param {object} options - Plugin options
 * @returns {object} - esbuild plugin
 */
export default function kalxjsPlugin(options = {}) {
    const {
        sourceMap = true,
        ...compilerOptions
    } = options;

    return {
        name: 'esbuild-plugin-kalxjs',

        setup(build) {
            // Resolve .klx files
            build.onResolve({ filter: /\.klx$/ }, args => {
                return {
                    path: path.isAbsolute(args.path)
                        ? args.path
                        : path.resolve(args.resolveDir, args.path),
                    namespace: 'kalxjs'
                };
            });

            // Load and compile .klx files
            build.onLoad({ filter: /\.klx$/, namespace: 'kalxjs' }, async (args) => {
                console.log('[esbuild-plugin] Loading:', args.path);

                try {
                    // Read file
                    const source = await fs.readFile(args.path, 'utf-8');

                    // Compile .klx file
                    const result = await compileKLXFile(source, {
                        filename: args.path,
                        sourceMap,
                        isProduction: build.initialOptions.minify || false,
                        ...compilerOptions
                    });

                    console.log('[esbuild-plugin] Compilation successful');

                    // Return compiled code
                    return {
                        contents: result.code,
                        loader: 'js',
                        resolveDir: path.dirname(args.path),
                        watchFiles: [args.path]
                    };

                } catch (error) {
                    console.error('[esbuild-plugin] Compilation error:', error);

                    return {
                        errors: [{
                            text: error.message,
                            location: {
                                file: args.path,
                                line: error.line || 1,
                                column: error.column || 0
                            }
                        }]
                    };
                }
            });

            // Handle .klx imports from other files
            build.onResolve({ filter: /\.klx$/ }, args => {
                if (args.namespace === 'kalxjs') return;

                return {
                    path: path.isAbsolute(args.path)
                        ? args.path
                        : path.resolve(args.resolveDir, args.path),
                    namespace: 'kalxjs'
                };
            });
        }
    };
}

export { kalxjsPlugin };