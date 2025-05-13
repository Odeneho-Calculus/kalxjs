import { compileKLX } from './index.js';

/**
 * Vite plugin for KalxJS single-file components
 * @param {Object} options - Plugin options
 * @returns {Object} Vite plugin
 */
export default function vitePlugin(options = {}) {
    return {
        name: 'kalxjs-sfc',

        transform(code, id) {
            // Check if this is a .klx file
            if (!id.endsWith('.klx')) return null;

            // Remove query parameters from the id (like ?t=1747166908020)
            const cleanId = id.split('?')[0];

            try {
                console.log(`[kalxjs-sfc] Compiling ${cleanId}`);

                // Compile the .klx file
                const result = compileKLX(code, {
                    filename: cleanId,
                    ...options
                });

                // Check for errors
                if (result.errors && result.errors.length > 0) {
                    console.error(`[kalxjs-sfc] Compilation errors for ${cleanId}:`, result.errors);
                    this.warn(`KLX compilation errors: ${result.errors.join(', ')}`);
                }

                // Add debug information
                const debugCode = `
// KalxJS SFC compiled by vite-plugin
// Source: ${cleanId}
// Timestamp: ${new Date().toISOString()}
${result.code}`;

                return {
                    code: debugCode,
                    map: result.map
                };
            } catch (err) {
                console.error(`[kalxjs-sfc] Error compiling ${cleanId}:`, err);

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
            console.log('[kalxjs-sfc] Plugin initialized');

            // Add a middleware to handle .klx file requests
            server.middlewares.use((req, res, next) => {
                if (req.url && req.url.endsWith('.klx')) {
                    console.log(`[kalxjs-sfc] Request for .klx file: ${req.url}`);
                }
                next();
            });
        }
    };
}