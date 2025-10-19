/**
 * KALXJS Vite Plugin
 * Enhanced Vite integration with HMR support
 *
 * @module @kalxjs/compiler-plugin/vite
 */

import { compileTemplate } from '@kalxjs/compiler';
import { createFilter } from '@rollup/pluginutils';
import fs from 'fs';
import path from 'path';

/**
 * Create KALXJS Vite Plugin
 *
 * @param {object} options - Plugin options
 * @returns {object} - Vite plugin
 *
 * @example
 * ```js
 * // vite.config.js
 * import { defineConfig } from 'vite';
 * import kalxjs from '@kalxjs/vite-plugin';
 *
 * export default defineConfig({
 *   plugins: [
 *     kalxjs({
 *       include: '**\/*.klx',
 *       hmr: true,
 *       devtools: true
 *     })
 *   ]
 * });
 * ```
 */
export default function kalxjsPlugin(options = {}) {
    const {
        include = /\.klx$/,
        exclude,
        hmr = true,
        devtools = true,
        compiler = {},
        ssr = false
    } = options;

    const filter = createFilter(include, exclude);
    let config;
    let isProduction = false;

    // Store component metadata for HMR
    const componentMap = new Map();

    return {
        name: 'vite-plugin-kalxjs',

        /**
         * Configure plugin
         */
        config(userConfig, { command }) {
            isProduction = command === 'build';

            return {
                define: {
                    __DEV__: !isProduction,
                    __KALXJS_DEVTOOLS__: devtools && !isProduction
                },
                optimizeDeps: {
                    include: ['@kalxjs/core', '@kalxjs/router', '@kalxjs/store'],
                    exclude: ['@kalxjs/devtools']
                },
                resolve: {
                    extensions: ['.klx', '.js', '.ts', '.jsx', '.tsx'],
                    alias: {
                        '@kalxjs/core': '@kalxjs/core/src/index.js'
                    }
                }
            };
        },

        /**
         * Configuration resolved
         */
        configResolved(resolvedConfig) {
            config = resolvedConfig;
        },

        /**
         * Transform .klx files
         */
        async transform(code, id) {
            if (!filter(id)) return null;

            try {
                // Compile .klx file to JavaScript
                const compiled = await compileKLX(code, {
                    filename: id,
                    sourceMap: !isProduction,
                    hmr: hmr && !isProduction,
                    ssr,
                    ...compiler
                });

                // Store component metadata for HMR
                if (hmr && !isProduction) {
                    componentMap.set(id, {
                        code: compiled.code,
                        timestamp: Date.now()
                    });
                }

                return {
                    code: compiled.code,
                    map: compiled.map
                };
            } catch (error) {
                this.error({
                    message: `Failed to compile ${id}: ${error.message}`,
                    stack: error.stack
                });
            }
        },

        /**
         * Handle HMR updates
         */
        async handleHotUpdate({ file, server, modules }) {
            if (!filter(file)) return;

            const metadata = componentMap.get(file);
            if (!metadata) return;

            // Read updated file
            const code = await fs.promises.readFile(file, 'utf-8');

            // Recompile
            const compiled = await compileKLX(code, {
                filename: file,
                hmr: true,
                ...compiler
            });

            // Update metadata
            componentMap.set(file, {
                code: compiled.code,
                timestamp: Date.now()
            });

            // Send HMR update to client
            server.ws.send({
                type: 'custom',
                event: 'kalxjs:update',
                data: {
                    file,
                    timestamp: Date.now(),
                    type: 'component-update'
                }
            });

            // Return affected modules
            return modules;
        },

        /**
         * Handle dev server
         */
        configureServer(server) {
            // Add custom middleware for .klx files
            server.middlewares.use((req, res, next) => {
                if (req.url?.endsWith('.klx')) {
                    // Set proper content type
                    res.setHeader('Content-Type', 'application/javascript');
                }
                next();
            });

            // Listen for custom HMR events
            server.ws.on('kalxjs:hmr', (data) => {
                console.log('[KALXJS HMR]', data);
            });
        },

        /**
         * Generate bundle (for build)
         */
        generateBundle(options, bundle) {
            // Add source maps for .klx files
            if (!isProduction && config.build.sourcemap) {
                for (const [fileName, chunk] of Object.entries(bundle)) {
                    if (chunk.type === 'chunk' && chunk.facadeModuleId?.endsWith('.klx')) {
                        // Source maps are already added in transform
                    }
                }
            }
        }
    };
}

/**
 * Compile .klx single file component
 */
async function compileKLX(source, options) {
    const { filename, hmr, ssr, sourceMap } = options;

    // Parse SFC
    const descriptor = parseSFC(source, filename);

    // Compile template
    const templateCode = descriptor.template
        ? await compileTemplate(descriptor.template.content, options)
        : null;

    // Process script
    const scriptCode = descriptor.script
        ? processScript(descriptor.script.content, descriptor, options)
        : '';

    // Process styles
    const stylesCode = descriptor.styles
        ? processStyles(descriptor.styles, descriptor, options)
        : '';

    // Generate final code
    const code = generateComponentCode({
        template: templateCode,
        script: scriptCode,
        styles: stylesCode,
        filename,
        hmr,
        ssr
    });

    return {
        code,
        map: sourceMap ? generateSourceMap(code, filename) : null
    };
}

/**
 * Parse Single File Component
 */
function parseSFC(source, filename) {
    const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/);
    const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/);
    const styleMatches = [...source.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)];

    return {
        filename,
        template: templateMatch ? {
            content: templateMatch[1].trim(),
            loc: { start: 0, end: templateMatch[0].length }
        } : null,
        script: scriptMatch ? {
            content: scriptMatch[1].trim(),
            loc: { start: 0, end: scriptMatch[0].length }
        } : null,
        styles: styleMatches.map(match => ({
            content: match[2].trim(),
            attrs: parseAttrs(match[1]),
            scoped: match[1].includes('scoped'),
            module: match[1].includes('module')
        }))
    };
}

/**
 * Parse attributes from tag
 */
function parseAttrs(attrString) {
    const attrs = {};
    const regex = /(\w+)(?:="([^"]*)")?/g;
    let match;

    while ((match = regex.exec(attrString)) !== null) {
        attrs[match[1]] = match[2] || true;
    }

    return attrs;
}

/**
 * Process script section
 */
function processScript(script, descriptor, options) {
    // Handle <script setup> in the future
    return script;
}

/**
 * Process styles section
 */
function processStyles(styles, descriptor, options) {
    return styles.map((style, i) => {
        let css = style.content;

        // Add scoped attributes if needed
        if (style.scoped) {
            const scopeId = generateScopeId(descriptor.filename);
            css = scopeStyles(css, scopeId);
        }

        return css;
    }).join('\n');
}

/**
 * Generate scope ID for scoped styles
 */
function generateScopeId(filename) {
    const hash = filename.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    return `data-v-${Math.abs(hash).toString(16)}`;
}

/**
 * Scope CSS with data attribute
 */
function scopeStyles(css, scopeId) {
    return css.replace(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g, (match, selector) => {
        selector = selector.trim();
        return `${selector}[${scopeId}]${match.slice(selector.length)}`;
    });
}

/**
 * Generate final component code
 */
function generateComponentCode({ template, script, styles, filename, hmr, ssr }) {
    const componentName = path.basename(filename, '.klx').replace(/[^a-zA-Z0-9]/g, '_');

    let code = '';

    // Import statements
    code += `import { defineComponent } from '@kalxjs/core';\n\n`;

    // Script content
    if (script) {
        code += `${script}\n\n`;
    }

    // Template function
    if (template) {
        code += `const render = ${template};\n\n`;
    }

    // Component definition
    code += `const ${componentName} = defineComponent({\n`;
    code += `  name: '${componentName}',\n`;
    if (template) {
        code += `  render,\n`;
    }
    code += `  ...options\n`;
    code += `});\n\n`;

    // Styles (injected at runtime)
    if (styles) {
        code += `if (typeof document !== 'undefined') {\n`;
        code += `  const style = document.createElement('style');\n`;
        code += `  style.textContent = ${JSON.stringify(styles)};\n`;
        code += `  document.head.appendChild(style);\n`;
        code += `}\n\n`;
    }

    // HMR code
    if (hmr) {
        code += `if (import.meta.hot) {\n`;
        code += `  import.meta.hot.accept();\n`;
        code += `  import.meta.hot.data = { component: ${componentName} };\n`;
        code += `}\n\n`;
    }

    // Export
    code += `export default ${componentName};\n`;

    return code;
}

/**
 * Generate source map
 */
function generateSourceMap(code, filename) {
    // Simplified source map generation
    return {
        version: 3,
        file: filename,
        sources: [filename],
        sourcesContent: [code],
        names: [],
        mappings: ''
    };
}

export { kalxjsPlugin };