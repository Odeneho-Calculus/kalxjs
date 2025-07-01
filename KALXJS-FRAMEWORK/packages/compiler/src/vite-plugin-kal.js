// @kalxjs/compiler - Enhanced Vite Plugin for .kal files
// Professional-grade Vite plugin with comprehensive SFC support, HMR, and advanced features

import { compileEnhancedSFC } from './sfc-compiler.js';
import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';

/**
 * Enhanced Vite Plugin for KalxJS Single File Components
 * Provides comprehensive SFC compilation with advanced features
 */
export default function enhancedKalPlugin(options = {}) {
    const {
        include = /\.kal$/,
        exclude,
        customElement = false,
        reactivityTransform = false,
        ...compilerOptions
    } = options;

    // Plugin state
    const cache = new Map();
    const hmrBoundaries = new Map();
    const dependencyGraph = new Map();

    // Filter function for file matching
    const filter = createFilter(include, exclude);

    // Plugin configuration
    let isProduction = false;
    let root = '';
    let server = null;

    return {
        name: 'vite:kalxjs-enhanced',
        enforce: 'pre',

        // Plugin configuration
        configResolved(config) {
            isProduction = config.command === 'build';
            root = config.root;
        },

        // Development server configuration
        configureServer(devServer) {
            server = devServer;

            // Setup HMR handling
            server.ws.on('kalxjs:hmr-update', (data) => {
                this.handleHMRUpdate(data);
            });
        },

        // Build start hook
        buildStart() {
            // Clear cache on build start
            cache.clear();
            hmrBoundaries.clear();
            dependencyGraph.clear();
        },

        // Resolve ID hook
        resolveId(id, importer) {
            // Handle .kal file imports
            if (id.endsWith('.kal')) {
                return this.resolveKalFile(id, importer);
            }
            return null;
        },

        // Load hook
        load(id) {
            if (!filter(id)) return null;

            // Clean query parameters
            const cleanId = id.split('?')[0];
            if (!cleanId.endsWith('.kal')) return null;

            try {
                // Read file content
                const source = fs.readFileSync(cleanId, 'utf-8');

                // Store original source for HMR
                this.storeOriginalSource(cleanId, source);

                return source;
            } catch (error) {
                this.error(`Failed to load .kal file: ${cleanId}`, error);
                return null;
            }
        },

        // Transform hook - main compilation logic
        async transform(code, id, transformOptions) {
            if (!filter(id)) return null;

            const cleanId = id.split('?')[0];
            if (!cleanId.endsWith('.kal')) return null;

            const filename = path.basename(cleanId);

            try {
                // Check cache first
                const cacheKey = this.generateCacheKey(code, cleanId, compilerOptions);
                const cached = cache.get(cacheKey);

                if (cached && !this.shouldInvalidateCache(cleanId, cached.timestamp)) {
                    return cached.result;
                }

                // Compile the SFC
                const startTime = Date.now();
                const compiled = await this.compileSFC(code, {
                    filename: cleanId,
                    ...compilerOptions,
                    isProduction,
                    hmr: !isProduction
                });

                const compilationTime = Date.now() - startTime;

                // Handle compilation errors
                if (compiled.errors.length > 0) {
                    this.handleCompilationErrors(compiled.errors, cleanId);
                }

                // Handle compilation warnings
                if (compiled.warnings.length > 0) {
                    this.handleCompilationWarnings(compiled.warnings, cleanId);
                }

                // Generate final result
                const result = {
                    code: compiled.code,
                    map: compiled.map,
                    meta: {
                        kalxjs: {
                            dependencies: compiled.dependencies,
                            exports: compiled.exports,
                            metadata: compiled.metadata,
                            compilationTime
                        }
                    }
                };

                // Cache the result
                cache.set(cacheKey, {
                    result,
                    timestamp: Date.now(),
                    dependencies: compiled.dependencies
                });

                // Update dependency graph for HMR
                this.updateDependencyGraph(cleanId, compiled.dependencies);

                // Setup HMR boundaries
                if (!isProduction) {
                    this.setupHMRBoundary(cleanId, compiled.metadata);
                }

                this.logCompilation(filename, compilationTime, compiled);

                return result;
            } catch (error) {
                this.error(`Failed to transform .kal file: ${filename}`, error);

                // Return error component
                return {
                    code: this.generateErrorComponent(error, cleanId),
                    map: null
                };
            }
        },

        // Handle HMR updates
        async handleHotUpdate(ctx) {
            if (!filter(ctx.file)) return;

            const { file, read, server } = ctx;

            try {
                // Read updated content
                const content = await read();

                // Invalidate cache
                this.invalidateCache(file);

                // Recompile
                const compiled = await this.compileSFC(content, {
                    filename: file,
                    ...compilerOptions,
                    isProduction: false,
                    hmr: true
                });

                // Handle compilation errors in HMR
                if (compiled.errors.length > 0) {
                    server.ws.send({
                        type: 'error',
                        err: {
                            message: `KalxJS compilation error in ${path.basename(file)}`,
                            stack: compiled.errors.map(e => e.message).join('\n')
                        }
                    });
                    return [];
                }

                // Determine update type
                const updateType = this.determineHMRUpdateType(file, compiled);

                // Send HMR update
                server.ws.send({
                    type: 'custom',
                    event: 'kalxjs:hmr-update',
                    data: {
                        file,
                        updateType,
                        timestamp: Date.now(),
                        metadata: compiled.metadata
                    }
                });

                // Return modules to update
                return this.getModulesToUpdate(file, updateType);
            } catch (error) {
                this.error(`HMR update failed for ${file}`, error);
                return [];
            }
        },

        // Generate bundle hook
        generateBundle(options, bundle) {
            if (isProduction) {
                this.optimizeBundle(bundle);
            }
        }
    };

    // Helper methods (bound to plugin context)
    function createFilter(include, exclude) {
        return (id) => {
            if (exclude && testPattern(exclude, id)) return false;
            if (include && !testPattern(include, id)) return false;
            return true;
        };
    }

    function testPattern(pattern, id) {
        if (Array.isArray(pattern)) {
            return pattern.some(p => testPattern(p, id));
        }
        if (pattern instanceof RegExp) {
            return pattern.test(id);
        }
        return id.includes(pattern);
    }

    // Compilation method
    async function compileSFC(source, options) {
        return compileEnhancedSFC(source, {
            optimizeImports: !options.isProduction ? false : true,
            generateSourceMaps: !options.isProduction,
            strictMode: options.isProduction,
            preserveWhitespace: false,
            scopedCSS: true,
            hotReload: options.hmr,
            ...options
        });
    }

    // Cache management
    function generateCacheKey(code, id, options) {
        const hash = createHash('md5');
        hash.update(code);
        hash.update(id);
        hash.update(JSON.stringify(options));
        return hash.digest('hex');
    }

    function shouldInvalidateCache(id, timestamp) {
        try {
            const stats = fs.statSync(id);
            return stats.mtime.getTime() > timestamp;
        } catch {
            return true;
        }
    }

    function invalidateCache(file) {
        // Remove all cache entries for this file
        for (const [key, value] of cache.entries()) {
            if (key.includes(file)) {
                cache.delete(key);
            }
        }
    }

    // Error and warning handling
    function handleCompilationErrors(errors, filename) {
        const displayName = path.basename(filename);

        errors.forEach(error => {
            console.error(`\n[KalxJS] Compilation error in ${displayName}:`);
            console.error(`  ${error.message}`);

            if (error.line) {
                console.error(`  at line ${error.line}${error.column ? `:${error.column}` : ''}`);
            }

            if (error.source) {
                console.error(`  ${error.source}`);
            }
        });
    }

    function handleCompilationWarnings(warnings, filename) {
        const displayName = path.basename(filename);

        warnings.forEach(warning => {
            console.warn(`\n[KalxJS] Warning in ${displayName}:`);
            console.warn(`  ${warning.message}`);

            if (warning.line) {
                console.warn(`  at line ${warning.line}${warning.column ? `:${warning.column}` : ''}`);
            }
        });
    }

    // HMR support
    function storeOriginalSource(id, source) {
        // Store for HMR comparison
        hmrBoundaries.set(id, {
            source,
            timestamp: Date.now()
        });
    }

    function updateDependencyGraph(id, dependencies) {
        dependencyGraph.set(id, dependencies);
    }

    function setupHMRBoundary(id, metadata) {
        // Setup HMR boundary based on component metadata
        const boundary = {
            id,
            hasTemplate: metadata.hasTemplate,
            hasScript: metadata.hasScript,
            hasStyle: metadata.hasStyle,
            isScoped: metadata.isScoped,
            timestamp: Date.now()
        };

        hmrBoundaries.set(id, boundary);
    }

    function determineHMRUpdateType(file, compiled) {
        const previous = hmrBoundaries.get(file);
        if (!previous) return 'full-reload';

        const current = compiled.metadata;

        // Check what changed
        const changes = {
            template: previous.hasTemplate !== current.hasTemplate,
            script: previous.hasScript !== current.hasScript,
            style: previous.hasStyle !== current.hasStyle,
            scoped: previous.isScoped !== current.isScoped
        };

        // Determine update strategy
        if (changes.script || changes.scoped) {
            return 'full-reload';
        } else if (changes.template) {
            return 'template-update';
        } else if (changes.style) {
            return 'style-update';
        } else {
            return 'template-update'; // Default to template update
        }
    }

    function getModulesToUpdate(file, updateType) {
        // Return modules that need to be updated based on update type
        const modules = [file];

        // Add dependent modules if needed
        for (const [id, deps] of dependencyGraph.entries()) {
            if (deps.some(dep => dep.includes(file))) {
                modules.push(id);
            }
        }

        return modules;
    }

    // Resolve .kal files
    function resolveKalFile(id, importer) {
        if (path.isAbsolute(id)) {
            return id;
        }

        if (importer) {
            const resolved = path.resolve(path.dirname(importer), id);
            if (fs.existsSync(resolved)) {
                return resolved;
            }
        }

        return null;
    }

    // Bundle optimization
    function optimizeBundle(bundle) {
        // Optimize the bundle for production
        for (const [fileName, chunk] of Object.entries(bundle)) {
            if (chunk.type === 'chunk' && chunk.facadeModuleId?.endsWith('.kal')) {
                // Apply production optimizations
                this.optimizeChunk(chunk);
            }
        }
    }

    function optimizeChunk(chunk) {
        // Apply chunk-level optimizations
        // This could include tree-shaking, minification hints, etc.
    }

    // Error component generation
    function generateErrorComponent(error, filename) {
        const componentName = path.basename(filename, '.kal');

        return `import { h } from "@kalxjs/core";

export default {
  name: '${componentName}ErrorComponent',
  render() {
    return h('div', {
      style: {
        padding: '20px',
        border: '2px solid #e53e3e',
        borderRadius: '8px',
        backgroundColor: '#fff5f5',
        color: '#c53030',
        fontFamily: 'monospace',
        margin: '20px',
        maxWidth: '600px'
      }
    }, [
      h('h2', {
        style: { marginTop: 0, color: '#c53030', fontSize: '18px' }
      }, ['KalxJS Compilation Error']),
      h('p', {
        style: { marginBottom: '15px', fontSize: '14px' }
      }, [${JSON.stringify(error.message)}]),
      h('details', {
        style: { marginTop: '15px' }
      }, [
        h('summary', {
          style: { cursor: 'pointer', fontWeight: 'bold' }
        }, ['Error Details']),
        h('pre', {
          style: {
            background: '#2d3748',
            color: '#e2e8f0',
            padding: '15px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px',
            marginTop: '10px'
          }
        }, [${JSON.stringify(error.stack || 'No stack trace available')}])
      ])
    ]);
  }
};`;
    }

    // Logging
    function logCompilation(filename, compilationTime, compiled) {
        if (compilerOptions.verbose) {
            console.log(`\n[KalxJS] Compiled ${filename} in ${compilationTime}ms`);

            if (compiled.metadata) {
                const { hasTemplate, hasScript, hasStyle, isScoped } = compiled.metadata;
                const features = [];
                if (hasTemplate) features.push('template');
                if (hasScript) features.push('script');
                if (hasStyle) features.push(isScoped ? 'scoped-style' : 'style');

                console.log(`  Features: ${features.join(', ')}`);
            }

            if (compiled.warnings.length > 0) {
                console.log(`  Warnings: ${compiled.warnings.length}`);
            }
        }
    }

    // Error reporting
    function error(message, error) {
        console.error(`\n[KalxJS Plugin] ${message}`);
        if (error) {
            console.error(error.stack || error.message);
        }
    }
}