// @kalxjs/build-tools - Vite Plugin for KalxJS
// Modern build system integration with Vite

import { createFilter } from '@rollup/pluginutils';
import { AdvancedCompiler, CompilerFlags } from '../../compiler/src/advanced-compiler.js';
import { initEnhancedDevTools, getHMRManager } from '../../devtools/src/enhanced-devtools.js';

/**
 * KalxJS Vite Plugin
 * Provides seamless integration with Vite build system
 */
export function kalxjs(options = {}) {
    const {
        include = /\.kal$/,
        exclude,
        compilerOptions = {},
        devtools = true,
        hmr = true,
        ssr = false,
        ...viteOptions
    } = options;

    const filter = createFilter(include, exclude);
    const compiler = new AdvancedCompiler({
        mode: process.env.NODE_ENV || 'development',
        flags: process.env.NODE_ENV === 'production'
            ? CompilerFlags.PRODUCTION
            : CompilerFlags.DEVELOPMENT,
        ...compilerOptions
    });

    let isDevServer = false;
    let hmrManager = null;

    return {
        name: 'kalxjs',

        configResolved(config) {
            isDevServer = config.command === 'serve';

            // Initialize devtools in development
            if (isDevServer && devtools) {
                initEnhancedDevTools({ autoEnable: true });

                if (hmr) {
                    hmrManager = getHMRManager();
                }
            }
        },

        buildStart() {
            // Add KalxJS runtime to optimized dependencies
            this.addWatchFile('node_modules/@kalxjs/core');
        },

        resolveId(id, importer) {
            // Handle KalxJS virtual modules
            if (id.startsWith('kalxjs:')) {
                return id;
            }

            // Handle .kal file imports
            if (id.endsWith('.kal')) {
                return this.resolve(id, importer, { skipSelf: true });
            }
        },

        load(id) {
            // Handle virtual modules
            if (id === 'kalxjs:runtime') {
                return this.generateRuntimeCode();
            }

            if (id === 'kalxjs:devtools') {
                return this.generateDevToolsCode();
            }
        },

        async transform(code, id) {
            if (!filter(id)) return;

            try {
                // Compile .kal files
                const result = compiler.compile(code, {
                    filename: id,
                    sourceMap: true,
                    ssr,
                    hmr: isDevServer && hmr
                });

                // Register component for HMR
                if (isDevServer && hmr && hmrManager) {
                    const componentId = this.getComponentId(id);
                    hmrManager.register(componentId, result.component);
                }

                return {
                    code: result.code,
                    map: result.map
                };
            } catch (error) {
                this.error(`Failed to compile ${id}: ${error.message}`, {
                    id,
                    loc: error.loc,
                    frame: error.frame
                });
            }
        },

        handleHotUpdate({ file, modules, server }) {
            if (!filter(file)) return;

            // Handle .kal file hot updates
            if (file.endsWith('.kal')) {
                const componentId = this.getComponentId(file);

                // Read and compile the updated file
                const fs = require('fs');
                const updatedCode = fs.readFileSync(file, 'utf-8');

                try {
                    const result = compiler.compile(updatedCode, {
                        filename: file,
                        hmr: true
                    });

                    // Update component via HMR
                    if (hmrManager) {
                        hmrManager.update(componentId, result.component);
                    }

                    // Send HMR update to client
                    server.ws.send({
                        type: 'kalxjs-hmr-update',
                        updates: [{
                            type: 'component-update',
                            id: componentId,
                            timestamp: Date.now()
                        }]
                    });

                    return [];
                } catch (error) {
                    // Send error to client
                    server.ws.send({
                        type: 'error',
                        err: {
                            message: error.message,
                            stack: error.stack,
                            id: file,
                            frame: error.frame,
                            plugin: 'kalxjs'
                        }
                    });
                    return [];
                }
            }
        },

        generateBundle(options, bundle) {
            // Add KalxJS runtime chunks
            if (options.format === 'es') {
                this.emitFile({
                    type: 'chunk',
                    id: 'kalxjs:runtime',
                    name: 'kalxjs-runtime'
                });
            }

            // Generate component manifest for SSR
            if (ssr) {
                const manifest = this.generateSSRManifest(bundle);
                this.emitFile({
                    type: 'asset',
                    fileName: 'kalxjs-ssr-manifest.json',
                    source: JSON.stringify(manifest, null, 2)
                });
            }
        },

        // Helper methods
        getComponentId(filename) {
            return filename.replace(/\\/g, '/').replace(/\.[^.]+$/, '');
        },

        generateRuntimeCode() {
            return `
// KalxJS Runtime
import { createApp, h } from '@kalxjs/core';
import { signal, derived, createEffect } from '@kalxjs/core/signals';
import { ConcurrentAPI } from '@kalxjs/core/concurrent';

export {
    createApp,
    h,
    signal,
    derived,
    createEffect,
    ConcurrentAPI
};

// Auto-initialize devtools in development
if (import.meta.env.DEV) {
    import('@kalxjs/devtools/enhanced').then(({ initEnhancedDevTools }) => {
        initEnhancedDevTools();
    });
}
`;
        },

        generateDevToolsCode() {
            return `
// KalxJS DevTools Integration
import { initEnhancedDevTools } from '@kalxjs/devtools/enhanced';

export function setupDevTools(app) {
    if (import.meta.env.DEV) {
        const devtools = initEnhancedDevTools();
        devtools.enable();
        return devtools;
    }
    return null;
}

export { initEnhancedDevTools };
`;
        },

        generateSSRManifest(bundle) {
            const manifest = {
                components: {},
                assets: {},
                chunks: {}
            };

            Object.keys(bundle).forEach(fileName => {
                const chunk = bundle[fileName];

                if (chunk.type === 'chunk') {
                    manifest.chunks[chunk.name || fileName] = {
                        file: fileName,
                        imports: chunk.imports,
                        dynamicImports: chunk.dynamicImports
                    };
                } else if (chunk.type === 'asset') {
                    manifest.assets[fileName] = {
                        file: fileName,
                        source: chunk.source
                    };
                }
            });

            return manifest;
        }
    };
}

/**
 * Webpack Plugin for KalxJS
 */
export class KalxJSWebpackPlugin {
    constructor(options = {}) {
        this.options = {
            compilerOptions: {},
            devtools: true,
            hmr: true,
            ...options
        };

        this.compiler = new AdvancedCompiler({
            mode: process.env.NODE_ENV || 'development',
            flags: process.env.NODE_ENV === 'production'
                ? CompilerFlags.PRODUCTION
                : CompilerFlags.DEVELOPMENT,
            ...this.options.compilerOptions
        });
    }

    apply(compiler) {
        const pluginName = 'KalxJSWebpackPlugin';

        // Add .kal file resolution
        compiler.hooks.afterResolvers.tap(pluginName, (compiler) => {
            compiler.resolverFactory.hooks.resolver
                .for('normal')
                .tap(pluginName, (resolver) => {
                    resolver.hooks.resolve.tapAsync(pluginName, (request, resolveContext, callback) => {
                        if (request.request && request.request.endsWith('.kal')) {
                            // Handle .kal file resolution
                            return callback();
                        }
                        callback();
                    });
                });
        });

        // Add .kal file loader
        compiler.hooks.compilation.tap(pluginName, (compilation) => {
            compilation.hooks.buildModule.tap(pluginName, (module) => {
                if (module.resource && module.resource.endsWith('.kal')) {
                    // Process .kal files
                    this.processKalFile(module, compilation);
                }
            });
        });

        // Setup HMR in development
        if (this.options.hmr && compiler.options.mode === 'development') {
            compiler.hooks.compilation.tap(pluginName, (compilation) => {
                compilation.hooks.additionalAssets.tapAsync(pluginName, (callback) => {
                    // Add HMR runtime
                    this.addHMRRuntime(compilation);
                    callback();
                });
            });
        }
    }

    processKalFile(module, compilation) {
        try {
            const source = module._source.source();
            const result = this.compiler.compile(source, {
                filename: module.resource,
                sourceMap: true
            });

            // Replace module source
            module._source = compilation.compiler.webpack.sources.RawSource(result.code);

            if (result.map) {
                module._sourceMap = result.map;
            }
        } catch (error) {
            compilation.errors.push(new Error(`KalxJS compilation failed: ${error.message}`));
        }
    }

    addHMRRuntime(compilation) {
        const hmrRuntime = `
// KalxJS HMR Runtime
if (module.hot) {
    const { getHMRManager } = require('@kalxjs/devtools/enhanced');
    const hmrManager = getHMRManager();

    module.hot.accept((err) => {
        if (err) {
            console.error('HMR update failed:', err);
        }
    });
}
`;

        compilation.assets['kalxjs-hmr-runtime.js'] = {
            source: () => hmrRuntime,
            size: () => hmrRuntime.length
        };
    }
}

/**
 * Rollup Plugin for KalxJS
 */
export function kalxjsRollup(options = {}) {
    const {
        include = /\.kal$/,
        exclude,
        compilerOptions = {}
    } = options;

    const filter = createFilter(include, exclude);
    const compiler = new AdvancedCompiler({
        mode: process.env.NODE_ENV || 'development',
        flags: process.env.NODE_ENV === 'production'
            ? CompilerFlags.PRODUCTION
            : CompilerFlags.DEVELOPMENT,
        ...compilerOptions
    });

    return {
        name: 'kalxjs-rollup',

        async transform(code, id) {
            if (!filter(id)) return null;

            try {
                const result = compiler.compile(code, {
                    filename: id,
                    sourceMap: true
                });

                return {
                    code: result.code,
                    map: result.map
                };
            } catch (error) {
                this.error(`Failed to compile ${id}: ${error.message}`);
            }
        },

        generateBundle(options, bundle) {
            // Add runtime chunk
            this.emitFile({
                type: 'chunk',
                id: 'kalxjs-runtime',
                name: 'kalxjs-runtime'
            });
        }
    };
}

/**
 * ESBuild Plugin for KalxJS
 */
export function kalxjsESBuild(options = {}) {
    const compiler = new AdvancedCompiler({
        mode: process.env.NODE_ENV || 'development',
        flags: process.env.NODE_ENV === 'production'
            ? CompilerFlags.PRODUCTION
            : CompilerFlags.DEVELOPMENT,
        ...options.compilerOptions
    });

    return {
        name: 'kalxjs-esbuild',
        setup(build) {
            // Handle .kal files
            build.onLoad({ filter: /\.kal$/ }, async (args) => {
                const fs = require('fs');
                const source = await fs.promises.readFile(args.path, 'utf8');

                try {
                    const result = compiler.compile(source, {
                        filename: args.path,
                        sourceMap: true
                    });

                    return {
                        contents: result.code,
                        loader: 'js'
                    };
                } catch (error) {
                    return {
                        errors: [{
                            text: error.message,
                            location: {
                                file: args.path,
                                line: error.line,
                                column: error.column
                            }
                        }]
                    };
                }
            });

            // Add KalxJS runtime resolution
            build.onResolve({ filter: /^kalxjs:/ }, (args) => {
                return {
                    path: args.path,
                    namespace: 'kalxjs-virtual'
                };
            });

            build.onLoad({ filter: /.*/, namespace: 'kalxjs-virtual' }, (args) => {
                if (args.path === 'kalxjs:runtime') {
                    return {
                        contents: `
export { createApp, h } from '@kalxjs/core';
export { signal, derived, createEffect } from '@kalxjs/core/signals';
export { ConcurrentAPI } from '@kalxjs/core/concurrent';
`,
                        loader: 'js'
                    };
                }
            });
        }
    };
}

// Export all build tool integrations
export default {
    vite: kalxjs,
    webpack: KalxJSWebpackPlugin,
    rollup: kalxjsRollup,
    esbuild: kalxjsESBuild
};