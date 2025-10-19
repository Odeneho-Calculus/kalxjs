/**
 * @kalxjs/webpack-loader
 * Webpack loader for .klx Single File Components
 *
 * Features:
 * - Compiles .klx files to JavaScript
 * - Supports hot module replacement (HMR)
 * - Handles TypeScript, script setup
 * - CSS preprocessing (SCSS, Less, Stylus)
 * - CSS Modules support
 * - Scoped CSS
 * - Source maps
 *
 * @module @kalxjs/webpack-loader
 */

import { compileKLXFile } from '../src/compile-klx.js';
import loaderUtils from 'loader-utils';
import path from 'path';

/**
 * KALXJS Webpack Loader
 * This is the main loader function
 */
export default function kalxjsLoader(source) {
    const callback = this.async();
    const options = loaderUtils.getOptions(this) || {};
    const filename = this.resourcePath;

    console.log('[webpack-loader] Processing .klx file:', filename);

    // Enable caching
    this.cacheable && this.cacheable();

    // Compile .klx file
    compileKLXFile(source, {
        filename,
        sourceMap: this.sourceMap,
        hotReload: this.hot,
        isProduction: this.mode === 'production',
        ...options
    })
        .then(result => {
            console.log('[webpack-loader] Compilation successful');

            // Add dependencies (for watch mode)
            if (result.dependencies) {
                result.dependencies.forEach(dep => {
                    this.addDependency(dep);
                });
            }

            // Return compiled code
            callback(null, result.code, result.map);
        })
        .catch(error => {
            console.error('[webpack-loader] Compilation error:', error);
            callback(error);
        });
}

/**
 * Pitch function - runs before the loader
 * Used for caching and optimization
 */
export function pitch() {
    // Can be used for optimization
}

/**
 * Raw mode - handle binary data if needed
 */
export const raw = false;

/**
 * Export the loader
 */
export { kalxjsLoader };