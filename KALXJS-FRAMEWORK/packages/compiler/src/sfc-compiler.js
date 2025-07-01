// @kalxjs/compiler - Enhanced SFC Compiler for .kal files
// Professional-grade SFC compiler with advanced optimizations and comprehensive error handling

import { parseEnhancedSFC } from './sfc-parser.js';
import { compileAdvancedTemplate } from './template-compiler.js';

/**
 * Enhanced SFC Compiler for KalxJS Single File Components
 * Provides comprehensive compilation with advanced optimizations
 */
export class EnhancedSFCCompiler {
    constructor(options = {}) {
        this.options = {
            optimizeImports: true,
            generateSourceMaps: true,
            strictMode: true,
            preserveWhitespace: false,
            scopedCSS: true,
            hotReload: true,
            ...options
        };

        this.errors = [];
        this.warnings = [];
        this.dependencies = new Set();
        this.exports = new Set();
    }

    /**
     * Compile a KAL Single File Component
     * @param {string} source - Source code of the .kal file
     * @param {Object} options - Compilation options
     * @returns {Object} Compiled component result
     */
    compile(source, options = {}) {
        this.reset();
        const mergedOptions = { ...this.options, ...options };

        try {
            // Parse the SFC
            const parsed = parseEnhancedSFC(source, {
                filename: mergedOptions.filename,
                preserveWhitespace: mergedOptions.preserveWhitespace,
                strictMode: mergedOptions.strictMode
            });

            // Collect parsing errors and warnings
            this.errors.push(...parsed.errors);
            this.warnings.push(...parsed.warnings);

            if (this.errors.length > 0 && mergedOptions.strictMode) {
                throw new Error(`SFC parsing failed: ${this.errors[0].message}`);
            }

            // Compile individual blocks
            const compiledTemplate = this.compileTemplate(parsed.template, mergedOptions);
            const compiledScript = this.compileScript(parsed.script, mergedOptions);
            const compiledStyle = this.compileStyle(parsed.style, mergedOptions);
            const compiledCustomBlocks = this.compileCustomBlocks(parsed.customBlocks, mergedOptions);

            // Generate final component code
            const componentCode = this.generateComponentCode({
                template: compiledTemplate,
                script: compiledScript,
                style: compiledStyle,
                customBlocks: compiledCustomBlocks
            }, mergedOptions);

            return {
                code: componentCode.code,
                map: componentCode.map,
                dependencies: Array.from(this.dependencies),
                exports: Array.from(this.exports),
                errors: this.errors,
                warnings: this.warnings,
                metadata: {
                    hasTemplate: !!parsed.template,
                    hasScript: !!parsed.script,
                    hasStyle: !!parsed.style,
                    hasCustomBlocks: parsed.customBlocks.length > 0,
                    isScoped: parsed.style?.scoped || false,
                    isSetup: parsed.script?.setup || false
                }
            };
        } catch (error) {
            this.addError(`SFC compilation failed: ${error.message}`);

            return {
                code: this.generateErrorComponent(error, mergedOptions),
                map: null,
                dependencies: [],
                exports: [],
                errors: this.errors,
                warnings: this.warnings,
                metadata: {
                    hasTemplate: false,
                    hasScript: false,
                    hasStyle: false,
                    hasCustomBlocks: false,
                    isScoped: false,
                    isSetup: false
                }
            };
        }
    }

    /**
     * Reset compiler state
     * @private
     */
    reset() {
        this.errors = [];
        this.warnings = [];
        this.dependencies.clear();
        this.exports.clear();
    }

    /**
     * Compile template block
     * @private
     * @param {Object} template - Template block
     * @param {Object} options - Compilation options
     * @returns {Object} Compiled template
     */
    compileTemplate(template, options) {
        if (!template) {
            return null;
        }

        try {
            const compiled = compileAdvancedTemplate(template.content, {
                filename: options.filename,
                preserveWhitespace: options.preserveWhitespace,
                optimizeStaticNodes: true,
                generateSourceMap: options.generateSourceMaps
            });

            // Collect template compilation errors and warnings
            this.errors.push(...compiled.errors);
            this.warnings.push(...compiled.warnings);

            // Track template dependencies
            if (compiled.imports) {
                compiled.imports.forEach(imp => {
                    this.dependencies.add(imp);
                });
            }

            return {
                code: compiled.code,
                imports: compiled.imports || [],
                ast: compiled.ast,
                staticNodes: compiled.staticNodes || [],
                sourceMap: compiled.sourceMap,
                attrs: template.attrs
            };
        } catch (error) {
            this.addError(`Template compilation error: ${error.message}`);

            return {
                code: this.generateErrorTemplate(error),
                imports: ['import { h } from "@kalxjs/core";'],
                ast: null,
                staticNodes: [],
                sourceMap: null,
                attrs: template.attrs
            };
        }
    }

    /**
     * Compile script block
     * @private
     * @param {Object} script - Script block
     * @param {Object} options - Compilation options
     * @returns {Object} Compiled script
     */
    compileScript(script, options) {
        if (!script) {
            return this.generateDefaultScript(options);
        }

        try {
            if (script.setup) {
                return this.compileScriptSetup(script, options);
            } else {
                return this.compileRegularScript(script, options);
            }
        } catch (error) {
            this.addError(`Script compilation error: ${error.message}`);

            return {
                code: this.generateErrorScript(error, options),
                imports: [],
                exports: ['default'],
                sourceMap: null,
                attrs: script.attrs
            };
        }
    }

    /**
     * Compile regular script block
     * @private
     * @param {Object} script - Script block
     * @param {Object} options - Compilation options
     * @returns {Object} Compiled script
     */
    compileRegularScript(script, options) {
        let code = script.content;
        const imports = [];
        const exports = [];

        // Extract imports
        const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?/g;
        let match;

        while ((match = importRegex.exec(code)) !== null) {
            imports.push(match[0]);
            this.dependencies.add(match[0]);
        }

        // Check for export default
        if (code.includes('export default')) {
            exports.push('default');
            this.exports.add('default');
        }

        // Validate script structure
        this.validateScriptStructure(code);

        return {
            code,
            imports,
            exports,
            sourceMap: options.generateSourceMaps ? this.generateScriptSourceMap(script) : null,
            attrs: script.attrs
        };
    }

    /**
     * Compile script setup block
     * @private
     * @param {Object} script - Script setup block
     * @param {Object} options - Compilation options
     * @returns {Object} Compiled script setup
     */
    compileScriptSetup(script, options) {
        // Transform script setup to regular component options
        const setupCode = this.transformScriptSetup(script.content);

        return {
            code: setupCode,
            imports: this.extractImportsFromSetup(script.content),
            exports: ['default'],
            sourceMap: options.generateSourceMaps ? this.generateScriptSourceMap(script) : null,
            attrs: script.attrs,
            isSetup: true
        };
    }

    /**
     * Transform script setup to component options
     * @private
     * @param {string} setupCode - Script setup code
     * @returns {string} Transformed code
     */
    transformScriptSetup(setupCode) {
        // This is a simplified transformation
        // In a full implementation, you'd need proper AST transformation

        const imports = [];
        const setupBody = [];
        const exports = [];

        const lines = setupCode.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith('import ')) {
                imports.push(line);
            } else if (trimmed.startsWith('const ') || trimmed.startsWith('let ') || trimmed.startsWith('function ')) {
                setupBody.push(line);

                // Extract variable/function names for export
                const match = trimmed.match(/(?:const|let|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
                if (match) {
                    exports.push(match[1]);
                }
            } else if (trimmed) {
                setupBody.push(line);
            }
        }

        // Generate component with setup function
        return `${imports.join('\n')}

export default {
  setup(props, { emit }) {
${setupBody.map(line => '    ' + line).join('\n')}

    return {
${exports.map(name => `      ${name}`).join(',\n')}
    };
  }
};`;
    }

    /**
     * Extract imports from script setup
     * @private
     * @param {string} setupCode - Script setup code
     * @returns {Array} Array of import statements
     */
    extractImportsFromSetup(setupCode) {
        const imports = [];
        const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?/g;
        let match;

        while ((match = importRegex.exec(setupCode)) !== null) {
            imports.push(match[0]);
            this.dependencies.add(match[0]);
        }

        return imports;
    }

    /**
     * Compile style block
     * @private
     * @param {Object} style - Style block
     * @param {Object} options - Compilation options
     * @returns {Object} Compiled style
     */
    compileStyle(style, options) {
        if (!style) {
            return null;
        }

        try {
            let code = style.content;

            // Handle scoped CSS
            if (style.scoped && options.scopedCSS) {
                code = this.transformScopedCSS(code, options);
            }

            // Handle CSS preprocessing (if lang is specified)
            if (style.lang && style.lang !== 'css') {
                code = this.preprocessCSS(code, style.lang, options);
            }

            return {
                code,
                scoped: style.scoped,
                module: style.module,
                lang: style.lang || 'css',
                sourceMap: options.generateSourceMaps ? this.generateStyleSourceMap(style) : null,
                attrs: style.attrs
            };
        } catch (error) {
            this.addError(`Style compilation error: ${error.message}`);

            return {
                code: `/* Style compilation error: ${error.message} */`,
                scoped: false,
                module: false,
                lang: 'css',
                sourceMap: null,
                attrs: style.attrs
            };
        }
    }

    /**
     * Transform scoped CSS
     * @private
     * @param {string} css - CSS code
     * @param {Object} options - Options
     * @returns {string} Scoped CSS
     */
    transformScopedCSS(css, options) {
        // Generate unique scope ID
        const scopeId = this.generateScopeId(options.filename);

        // Add scope attribute to selectors
        // This is a simplified implementation
        return css.replace(/([^{}]+)\{/g, (match, selector) => {
            const trimmedSelector = selector.trim();
            if (trimmedSelector.startsWith('@') || trimmedSelector.includes('keyframes')) {
                return match; // Don't scope at-rules
            }
            return `${trimmedSelector}[data-v-${scopeId}] {`;
        });
    }

    /**
     * Generate scope ID for scoped CSS
     * @private
     * @param {string} filename - Component filename
     * @returns {string} Scope ID
     */
    generateScopeId(filename) {
        // Simple hash generation for scope ID
        let hash = 0;
        const str = filename || 'anonymous';

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return Math.abs(hash).toString(36).substring(0, 8);
    }

    /**
     * Preprocess CSS (placeholder for CSS preprocessors)
     * @private
     * @param {string} css - CSS code
     * @param {string} lang - CSS language (scss, less, etc.)
     * @param {Object} options - Options
     * @returns {string} Processed CSS
     */
    preprocessCSS(css, lang, options) {
        // Placeholder for CSS preprocessing
        // In a real implementation, you'd integrate with Sass, Less, etc.
        this.addWarning(`CSS preprocessing for '${lang}' is not yet implemented`);
        return css;
    }

    /**
     * Compile custom blocks
     * @private
     * @param {Array} customBlocks - Custom blocks
     * @param {Object} options - Compilation options
     * @returns {Array} Compiled custom blocks
     */
    compileCustomBlocks(customBlocks, options) {
        return customBlocks.map(block => {
            try {
                return {
                    type: block.type,
                    content: block.content,
                    attrs: block.attrs,
                    compiled: this.compileCustomBlock(block, options)
                };
            } catch (error) {
                this.addError(`Custom block compilation error (${block.type}): ${error.message}`);

                return {
                    type: block.type,
                    content: block.content,
                    attrs: block.attrs,
                    compiled: null
                };
            }
        });
    }

    /**
     * Compile a single custom block
     * @private
     * @param {Object} block - Custom block
     * @param {Object} options - Options
     * @returns {Object} Compiled block
     */
    compileCustomBlock(block, options) {
        // Handle known custom block types
        switch (block.type) {
            case 'docs':
                return this.compileDocsBlock(block, options);
            case 'i18n':
                return this.compileI18nBlock(block, options);
            default:
                // Unknown custom block - pass through
                return {
                    content: block.content,
                    processed: false
                };
        }
    }

    /**
     * Compile docs block
     * @private
     * @param {Object} block - Docs block
     * @param {Object} options - Options
     * @returns {Object} Compiled docs
     */
    compileDocsBlock(block, options) {
        return {
            content: block.content,
            processed: true,
            type: 'markdown'
        };
    }

    /**
     * Compile i18n block
     * @private
     * @param {Object} block - i18n block
     * @param {Object} options - Options
     * @returns {Object} Compiled i18n
     */
    compileI18nBlock(block, options) {
        try {
            const parsed = JSON.parse(block.content);
            return {
                content: parsed,
                processed: true,
                type: 'json'
            };
        } catch (error) {
            this.addError(`Invalid JSON in i18n block: ${error.message}`);
            return {
                content: block.content,
                processed: false
            };
        }
    }

    /**
     * Generate final component code
     * @private
     * @param {Object} compiled - Compiled blocks
     * @param {Object} options - Options
     * @returns {Object} Final component code
     */
    generateComponentCode(compiled, options) {
        const { template, script, style, customBlocks } = compiled;

        let code = '';
        let sourceMap = null;

        // Collect all imports
        const allImports = new Set();

        // Add template imports
        if (template && template.imports) {
            template.imports.forEach(imp => allImports.add(imp));
        }

        // Add script imports
        if (script && script.imports) {
            script.imports.forEach(imp => allImports.add(imp));
        }

        // Generate imports section
        if (allImports.size > 0) {
            code += Array.from(allImports).join('\n') + '\n\n';
        }

        // Generate component definition
        if (script && script.code) {
            // Extract component options from script
            const componentOptions = this.extractComponentOptions(script.code);

            // Add render function if template exists
            if (template && template.code) {
                componentOptions.render = template.code;
            }

            // Generate final component
            code += this.generateFinalComponent(componentOptions, options);
        } else {
            // Generate minimal component with just template
            code += this.generateMinimalComponent(template, options);
        }

        // Add style injection if needed
        if (style && style.code) {
            code += '\n\n' + this.generateStyleInjection(style, options);
        }

        // Add HMR support if enabled
        if (options.hotReload) {
            code += '\n\n' + this.generateHMRCode(options);
        }

        return {
            code,
            map: sourceMap
        };
    }

    /**
     * Extract component options from script code
     * @private
     * @param {string} scriptCode - Script code
     * @returns {Object} Component options
     */
    extractComponentOptions(scriptCode) {
        // This is a simplified extraction
        // In a real implementation, you'd use proper AST parsing

        const options = {};

        // Extract export default content
        const exportMatch = scriptCode.match(/export\s+default\s+({[\s\S]*})/);
        if (exportMatch) {
            try {
                // This is unsafe - in production, use proper AST parsing
                const optionsStr = exportMatch[1];
                // For now, just return the raw options string
                options.raw = optionsStr;
            } catch (error) {
                this.addError(`Failed to parse component options: ${error.message}`);
            }
        }

        return options;
    }

    /**
     * Generate final component code
     * @private
     * @param {Object} options - Component options
     * @param {Object} compileOptions - Compilation options
     * @returns {string} Final component code
     */
    generateFinalComponent(options, compileOptions) {
        if (options.raw) {
            // If we have raw options, modify them to include render function
            let componentCode = options.raw;

            // This is a simplified approach - in production, use proper AST manipulation
            if (options.render) {
                // Insert render function
                componentCode = componentCode.replace(/}$/, `,\n  render: ${options.render}\n}`);
            }

            return `export default ${componentCode};`;
        }

        // Fallback to basic component
        return `export default {
  name: '${this.getComponentName(compileOptions.filename)}',
  ${options.render ? `render: ${options.render}` : ''}
};`;
    }

    /**
     * Generate minimal component with just template
     * @private
     * @param {Object} template - Template
     * @param {Object} options - Options
     * @returns {string} Minimal component code
     */
    generateMinimalComponent(template, options) {
        const renderFunction = template ? template.code : 'function render() { return h("div", {}, ["Empty component"]); }';

        return `export default {
  name: '${this.getComponentName(options.filename)}',
  render: ${renderFunction}
};`;
    }

    /**
     * Generate style injection code
     * @private
     * @param {Object} style - Style
     * @param {Object} options - Options
     * @returns {string} Style injection code
     */
    generateStyleInjection(style, options) {
        const css = JSON.stringify(style.code);

        return `// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = ${css};
  document.head.appendChild(style);
}`;
    }

    /**
     * Generate HMR code
     * @private
     * @param {Object} options - Options
     * @returns {string} HMR code
     */
    generateHMRCode(options) {
        return `// HMR support
if (import.meta.hot) {
  import.meta.hot.accept();
}`;
    }

    /**
     * Get component name from filename
     * @private
     * @param {string} filename - Filename
     * @returns {string} Component name
     */
    getComponentName(filename) {
        if (!filename) return 'AnonymousComponent';

        const name = filename.split('/').pop().replace(/\.\w+$/, '');
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    /**
     * Generate default script
     * @private
     * @param {Object} options - Options
     * @returns {Object} Default script
     */
    generateDefaultScript(options) {
        const componentName = this.getComponentName(options.filename);

        return {
            code: `export default {
  name: '${componentName}'
};`,
            imports: [],
            exports: ['default'],
            sourceMap: null,
            attrs: {}
        };
    }

    /**
     * Generate error component
     * @private
     * @param {Error} error - Error
     * @param {Object} options - Options
     * @returns {string} Error component code
     */
    generateErrorComponent(error, options) {
        return `import { h } from "@kalxjs/core";

export default {
  name: 'CompilationErrorComponent',
  render() {
    return h('div', {
      style: 'padding: 20px; border: 2px solid #e53e3e; border-radius: 4px; background-color: #fff5f5; color: #c53030; font-family: monospace;'
    }, [
      h('h2', { style: 'margin-top: 0; color: #c53030;' }, ['SFC Compilation Error']),
      h('p', { style: 'margin-bottom: 15px;' }, [${JSON.stringify(error.message)}]),
      h('div', { style: 'background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 4px; overflow: auto;' }, [
        h('pre', { style: 'margin: 0; font-size: 12px;' }, [${JSON.stringify(error.stack || 'No stack trace available')}])
      ])
    ]);
  }
};`;
    }

    /**
     * Generate error template
     * @private
     * @param {Error} error - Error
     * @returns {string} Error template code
     */
    generateErrorTemplate(error) {
        return `function render() {
  return h('div', {
    style: 'padding: 15px; border: 1px solid #f56565; border-radius: 4px; background-color: #fff5f5; color: #c53030;'
  }, [
    h('strong', {}, ['Template Error: ']),
    h('span', {}, [${JSON.stringify(error.message)}])
  ]);
}`;
    }

    /**
     * Generate error script
     * @private
     * @param {Error} error - Error
     * @param {Object} options - Options
     * @returns {Object} Error script
     */
    generateErrorScript(error, options) {
        return {
            code: `export default {
  name: '${this.getComponentName(options.filename)}',
  data() {
    return {
      error: ${JSON.stringify(error.message)}
    };
  }
};`,
            imports: [],
            exports: ['default'],
            sourceMap: null,
            attrs: {}
        };
    }

    /**
     * Validate script structure
     * @private
     * @param {string} code - Script code
     */
    validateScriptStructure(code) {
        if (!code.includes('export default')) {
            this.addWarning('Script should export a default component definition');
        }

        // Check for common issues
        if (code.includes('Vue.') || code.includes('vue')) {
            this.addWarning('Found Vue.js references. Make sure to use KalxJS equivalents.');
        }
    }

    /**
     * Generate script source map
     * @private
     * @param {Object} script - Script block
     * @returns {Object} Source map
     */
    generateScriptSourceMap(script) {
        return {
            version: 3,
            sources: ['script.js'],
            mappings: '',
            names: []
        };
    }

    /**
     * Generate style source map
     * @private
     * @param {Object} style - Style block
     * @returns {Object} Source map
     */
    generateStyleSourceMap(style) {
        return {
            version: 3,
            sources: ['style.css'],
            mappings: '',
            names: []
        };
    }

    /**
     * Add error to error list
     * @private
     * @param {string} message - Error message
     */
    addError(message) {
        this.errors.push({ type: 'error', message });
    }

    /**
     * Add warning to warning list
     * @private
     * @param {string} message - Warning message
     */
    addWarning(message) {
        this.warnings.push({ type: 'warning', message });
    }
}

/**
 * Compile a KAL Single File Component
 * @param {string} source - Source code
 * @param {Object} options - Compilation options
 * @returns {Object} Compilation result
 */
export function compileEnhancedSFC(source, options = {}) {
    const compiler = new EnhancedSFCCompiler(options);
    return compiler.compile(source, options);
}

// Export with standard name for compatibility
export function compileSFC(source, options = {}) {
    return compileEnhancedSFC(source, options);
}

/**
 * Create an SFC compiler instance
 * @param {Object} options - Compiler options
 * @returns {EnhancedSFCCompiler} Compiler instance
 */
export function createSFCCompiler(options = {}) {
    return new EnhancedSFCCompiler(options);
}