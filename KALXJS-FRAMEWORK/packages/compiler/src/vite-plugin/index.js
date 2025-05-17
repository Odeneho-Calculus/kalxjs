import { compile } from '../compiler.js';

/**
 * Vite plugin for KalxJS single-file components
 * @param {Object} options - Plugin options
 * @returns {Object} Vite plugin
 */
export default function vitePlugin(options = {}) {
    return {
        name: 'kalxjs-sfc',

        transform(code, id) {
            if (!id.endsWith('.klx')) return null;

            try {
                const result = compile(code, {
                    filename: id,
                    ...options
                });

                return {
                    code: result.code,
                    map: result.map
                };
            } catch (err) {
                this.error(err);
                return null;
            }
        }
    };
}