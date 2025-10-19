/**
 * @kalxjs/compiler-plugin - Unified KLX File Compiler
 * Shared compilation logic for all build tool plugins
 *
 * @module @kalxjs/compiler-plugin/compile-klx
 */

import { parse } from '@kalxjs/compiler';
import { processScriptSetup, compileMacros } from '../../compiler/src/script-setup/index.js';
import { compileTypeScript, isTypeScript } from '../../compiler/src/typescript/index.js';
import { processCSSModule, isCSSModule, generateCSSModuleExports } from '../../compiler/src/css/modules.js';
import { processWithPreprocessor, detectPreprocessor } from '../../compiler/src/css/preprocessors.js';

/**
 * Compile .klx file to JavaScript
 * @param {string} source - Source code
 * @param {object} options - Compilation options
 * @returns {Promise<object>} - Compiled result
 */
export async function compileKLXFile(source, options = {}) {
    const {
        filename = 'anonymous.klx',
        sourceMap = false,
        hotReload = false,
        isProduction = false
    } = options;

    console.log('[compile-klx] Compiling file:', filename);

    try {
        // Parse .klx file
        const descriptor = parseKLXFile(source);

        // Process script
        let scriptCode = '';
        let scriptSetupResult = null;

        if (descriptor.scriptSetup) {
            // Handle <script setup>
            scriptSetupResult = processScriptSetup(descriptor.scriptSetup.content, { filename });
            scriptCode = compileMacros(scriptSetupResult);
        } else if (descriptor.script) {
            // Handle regular <script>
            const { content, attrs } = descriptor.script;

            // Check for TypeScript
            if (isTypeScript(content, attrs)) {
                const tsResult = compileTypeScript(content, { filename, sourceMap });
                scriptCode = tsResult.code;
            } else {
                scriptCode = content;
            }
        }

        // Process template
        let templateCode = '';
        if (descriptor.template) {
            // TODO: Use actual template compiler
            templateCode = `function render() { return ${JSON.stringify(descriptor.template.content)}; }`;
        }

        // Process styles
        let stylesCode = '';
        const cssModules = {};

        for (let i = 0; i < descriptor.styles.length; i++) {
            const style = descriptor.styles[i];
            let css = style.content;

            // Handle preprocessors
            const preprocessor = detectPreprocessor(style.attrs);
            if (preprocessor) {
                const result = await processWithPreprocessor(css, {
                    lang: preprocessor,
                    filename,
                    sourceMap
                });
                css = result.css;
            }

            // Handle CSS modules
            if (isCSSModule(style.attrs)) {
                const moduleResult = processCSSModule(css, { filename });
                css = moduleResult.css;
                cssModules[`style${i}`] = moduleResult.exports;
            }

            // Handle scoped styles
            if (style.scoped) {
                const scopeId = generateScopeId(filename);
                css = scopeStyles(css, scopeId);
            }

            stylesCode += css;
        }

        // Generate final component code
        const code = generateFinalCode({
            script: scriptCode,
            template: templateCode,
            styles: stylesCode,
            cssModules,
            filename,
            hotReload,
            isProduction
        });

        console.log('[compile-klx] Compilation successful');

        return {
            code,
            map: sourceMap ? generateSourceMap(code, filename) : null,
            dependencies: []
        };

    } catch (error) {
        console.error('[compile-klx] Compilation error:', error);
        throw error;
    }
}

/**
 * Parse .klx file into descriptor
 */
function parseKLXFile(source) {
    const descriptor = {
        template: null,
        script: null,
        scriptSetup: null,
        styles: []
    };

    // Parse template
    const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/);
    if (templateMatch) {
        descriptor.template = {
            content: templateMatch[1].trim()
        };
    }

    // Parse script setup
    const scriptSetupMatch = source.match(/<script\s+setup([^>]*)>([\s\S]*?)<\/script>/);
    if (scriptSetupMatch) {
        descriptor.scriptSetup = {
            content: scriptSetupMatch[2].trim(),
            attrs: parseAttrs(scriptSetupMatch[1])
        };
    } else {
        // Parse regular script
        const scriptMatch = source.match(/<script([^>]*)>([\s\S]*?)<\/script>/);
        if (scriptMatch) {
            descriptor.script = {
                content: scriptMatch[2].trim(),
                attrs: parseAttrs(scriptMatch[1])
            };
        }
    }

    // Parse styles
    const styleMatches = [...source.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)];
    descriptor.styles = styleMatches.map(match => ({
        content: match[2].trim(),
        attrs: parseAttrs(match[1]),
        scoped: match[1].includes('scoped'),
        module: match[1].includes('module')
    }));

    return descriptor;
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
function generateFinalCode(options) {
    const { script, template, styles, cssModules, filename, hotReload, isProduction } = options;

    let code = '';

    // Add imports
    code += `import { defineComponent } from '@kalxjs/core';\n\n`;

    // Add script code
    if (script) {
        code += `${script}\n\n`;
    }

    // Add template
    if (template) {
        code += `const render = ${template};\n\n`;
    }

    // Add CSS modules exports
    if (Object.keys(cssModules).length > 0) {
        code += `const __cssModules = ${JSON.stringify(cssModules)};\n\n`;
    }

    // Inject styles (runtime)
    if (styles && !isProduction) {
        code += `if (typeof document !== 'undefined') {\n`;
        code += `  const style = document.createElement('style');\n`;
        code += `  style.textContent = ${JSON.stringify(styles)};\n`;
        code += `  document.head.appendChild(style);\n`;
        code += `}\n\n`;
    }

    // Add HMR code
    if (hotReload) {
        code += `if (import.meta.hot) {\n`;
        code += `  import.meta.hot.accept();\n`;
        code += `}\n\n`;
    }

    return code;
}

/**
 * Generate source map
 */
function generateSourceMap(code, filename) {
    return {
        version: 3,
        file: filename,
        sources: [filename],
        sourcesContent: [code],
        names: [],
        mappings: ''
    };
}

export default { compileKLXFile };