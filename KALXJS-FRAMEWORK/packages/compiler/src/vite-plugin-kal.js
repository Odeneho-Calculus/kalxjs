// @kalxjs/compiler - Vite plugin for .kal files
// This plugin handles Single File Components with the .kal extension

import { compileSFC } from './sfc-compiler.js';
import { parseSFC } from './sfc-parser.js';
import path from 'path';
import fs from 'fs';

/**
 * Create a filter function for include/exclude patterns
 * @param {RegExp|RegExp[]} include - Include pattern
 * @param {RegExp|RegExp[]} exclude - Exclude pattern
 * @returns {Function} Filter function
 */
function createFilter(include, exclude) {
    return (id) => {
        if (exclude && testPattern(exclude, id)) {
            return false;
        }
        if (include && !testPattern(include, id)) {
            return false;
        }
        return true;
    };
}

/**
 * Test if a pattern matches a string
 * @param {RegExp|RegExp[]} pattern - Pattern to test
 * @param {string} id - String to test
 * @returns {boolean} Whether the pattern matches
 */
function testPattern(pattern, id) {
    if (Array.isArray(pattern)) {
        return pattern.some(p => testPattern(p, id));
    }
    return pattern.test(id);
}

/**
 * Vite plugin for KalxJS single-file components (.kal files)
 * @param {Object} options - Plugin options
 * @returns {Object} Vite plugin
 */
export default function kalPlugin(options = {}) {
    const { include, exclude, customElement, ...rest } = options;

    // Filter for .kal files
    const filter = createFilter(include || /\.kal$/, exclude);

    // Cache for compiled components
    const compiledCache = new Map();

    return {
        name: 'vite:kal',
        // Add enforce: 'pre' to ensure this plugin runs before Vite's asset handling
        enforce: 'pre',

        // Handle .kal files as a transform step
        async transform(code, id, transformOptions) {
            // Skip if not a .kal file or if excluded
            if (!filter(id)) return null;

            // Remove query parameters from the id (like ?t=1747166908020)
            const cleanId = id.split('?')[0];

            // Skip if not a .kal file
            if (!cleanId.endsWith('.kal')) return null;

            // Get the file name for debugging
            const fileName = path.basename(cleanId);

            // Check if the code is just an export statement pointing to a file path or a JSON string
            if (code.trim().startsWith('export default')) {
                if (code.includes('.kal"')) {
                    console.log(`[vite:kal] Detected asset reference in ${fileName}, loading actual file content`);

                    try {
                        // We need to read the actual file content from disk
                        const actualFilePath = cleanId;

                        if (fs.existsSync(actualFilePath)) {
                            code = fs.readFileSync(actualFilePath, 'utf-8');
                            console.log(`[vite:kal] Successfully loaded file content for ${fileName}`);
                        } else {
                            console.error(`[vite:kal] Could not find file at ${actualFilePath}`);
                        }
                    } catch (err) {
                        console.error(`[vite:kal] Error loading file content for ${fileName}:`, err);
                    }
                } else if (code.includes('"<template>')) {
                    // This is a JSON string containing the template content
                    try {
                        // Extract the JSON string
                        const match = /export default\s+(.+)/.exec(code);
                        if (match && match[1]) {
                            // Parse the JSON string to get the actual template content
                            code = JSON.parse(match[1]);
                            console.log(`[vite:kal] Successfully extracted template content from JSON for ${fileName}`);
                        }
                    } catch (err) {
                        console.error(`[vite:kal] Error extracting template content from JSON for ${fileName}:`, err);
                    }
                }
            }

            // Check if we have a cached version
            const cacheKey = cleanId + code;
            const cached = compiledCache.get(cacheKey);
            if (cached) {
                return cached;
            }

            try {
                console.log(`[vite:kal] Compiling ${fileName}`);

                // Use the simple compiler instead of the complex parser/compiler
                console.log(`[vite:kal] Using advanced SFC compiler for ${fileName}`);
                const result = compileSFC(parseSFC(code), {
                    filename: cleanId,
                    ...rest
                });

                console.log(`[vite:kal] Generated code for ${fileName}:`, {
                    codeLength: result.script.code.length,
                    codePreview: result.script.code.substring(0, 150) + '...'
                });

                // Add debug information
                const debugCode = `
// KalxJS SFC compiled by vite-plugin-kal (advanced)
// Source: ${cleanId}
// Timestamp: ${new Date().toISOString()}
${result.script.code}`;

                // Cache the result
                const output = {
                    code: debugCode,
                    map: result.script.map || null
                };

                compiledCache.set(cacheKey, output);

                return output;
            } catch (err) {
                console.error(`[vite:kal] Error compiling ${fileName}:`, err);

                // Create an improved fallback component that shows the error with better UI
                const fallbackCode = `
import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'CompilationErrorComponent',
  render() {
    return h('div', { 
      style: 'padding: 20px; border: 2px solid #e53e3e; border-radius: 4px; background-color: #fff5f5; color: #c53030; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;'
    }, [
      h('h2', { style: 'margin-top: 0; border-bottom: 1px solid #feb2b2; padding-bottom: 10px;' }, ['KAL Compilation Error']),
      h('p', { style: 'font-size: 16px;' }, [${JSON.stringify(err.message)}]),
      h('div', { style: 'margin-top: 20px;' }, [
        h('h3', { style: 'margin-top: 0; font-size: 16px; color: #822727;' }, ['Error Details:']),
        h('pre', { 
          style: 'background-color: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 4px; overflow: auto; font-size: 14px; margin-top: 10px;' 
        }, [
          ${JSON.stringify(err.stack || 'No stack trace available')}
        ])
      ]),
      h('div', { style: 'margin-top: 20px; background-color: #fffaf0; border: 1px solid #fbd38d; padding: 15px; border-radius: 4px;' }, [
        h('h3', { style: 'margin-top: 0; font-size: 16px; color: #744210;' }, ['Troubleshooting Tips:']),
        h('ul', { style: 'margin-top: 10px; padding-left: 20px;' }, [
          h('li', {}, ['Check your template syntax for any errors']),
          h('li', {}, ['Ensure all tags are properly closed']),
          h('li', {}, ['Verify that your script section is valid JavaScript']),
          h('li', {}, ['Make sure your component has a <template> section'])
        ])
      ])
    ]);
  }
});
`;

                // Return the fallback component instead of throwing an error
                return {
                    code: fallbackCode,
                    map: null
                };
            }
        },

        // Add a resolveId hook to handle .kal imports
        resolveId(id, importer) {
            if (id.endsWith('.kal')) {
                console.log(`[vite:kal] Resolving .kal file: ${id}`);
                // Return the id as is to let Vite handle the resolution
                return null;
            }
            return null;
        },

        // Add a load hook to handle .kal files
        load(id) {
            if (id.endsWith('.kal')) {
                console.log(`[vite:kal] Loading .kal file: ${id}`);
                // Return null to let Vite handle the loading
                return null;
            }
            return null;
        }
    };
}

/**
 * Generates JavaScript code from compiled component
 * @param {Object} compiled - Compiled component
 * @param {Object} options - Code generation options
 * @returns {Object} Generated code and source map
 */
function generateCode(compiled, options = {}) {
    const { template, script, style, customBlocks } = compiled;

    try {
        // Track imports from the script sections
        const imports = [];
        let hasHImport = false;
        let hasDefineComponentImport = false;
        let hasOpenBlockImport = false;
        let hasCreateBlockImport = false;
        let hasToDisplayStringImport = false;
        let hasCreateVNodeImport = false;

        // Process script content
        let scriptContent = '';
        if (script) {
            // Extract imports
            const importRegex = /import\s+.*?;\n/g;
            let match;
            let scriptCode = script.code;

            while ((match = importRegex.exec(scriptCode))) {
                imports.push(match[0]);

                // Check if required imports are already present
                if (match[0].includes('h') && match[0].includes('@kalxjs/core')) {
                    hasHImport = true;
                }
                if (match[0].includes('defineComponent') && match[0].includes('@kalxjs/core')) {
                    hasDefineComponentImport = true;
                }
                if (match[0].includes('openBlock') && match[0].includes('@kalxjs/core')) {
                    hasOpenBlockImport = true;
                }
                if (match[0].includes('createBlock') && match[0].includes('@kalxjs/core')) {
                    hasCreateBlockImport = true;
                }
                if (match[0].includes('toDisplayString') && match[0].includes('@kalxjs/core')) {
                    hasToDisplayStringImport = true;
                }
                if (match[0].includes('createVNode') && match[0].includes('@kalxjs/core')) {
                    hasCreateVNodeImport = true;
                }
            }

            // Remove imports from script content
            scriptCode = scriptCode.replace(importRegex, '');

            // Also remove any remaining import statements that might not end with newline
            scriptCode = scriptCode.replace(/import\s+.*?;/g, '');

            // Remove export default { ... } wrapper
            scriptContent = scriptCode
                .replace(/export\s+default\s+defineComponent\s*\(\s*{/, '')
                .replace(/export\s+default\s+{/, '')
                .replace(/}\s*\)\s*;?\s*$/, '')
                .replace(/}\s*;?\s*$/, '')
                .trim();
        }

        // Start with the imports
        let code = '';

        // Collect all required imports from @kalxjs/core
        const coreImports = new Set();
        if (!hasHImport) coreImports.add('h');
        if (!hasDefineComponentImport) coreImports.add('defineComponent');
        if (!hasOpenBlockImport) coreImports.add('openBlock as _openBlock');
        if (!hasCreateBlockImport) coreImports.add('createBlock as _createBlock');
        if (!hasToDisplayStringImport) coreImports.add('toDisplayString as _toDisplayString');
        if (!hasCreateVNodeImport) coreImports.add('createVNode as _createVNode');

        // Process imports to remove duplicates and consolidate @kalxjs/core imports
        const processedImports = [];
        const nonCoreImports = [];

        // First pass: collect all imports from @kalxjs/core and other imports
        for (const imp of imports) {
            if (imp.includes('@kalxjs/core')) {
                // Extract imported items from @kalxjs/core
                const match = imp.match(/import\s+{([^}]*)}\s+from/);
                if (match && match[1]) {
                    match[1].split(',').forEach(item => {
                        const trimmed = item.trim();
                        coreImports.add(trimmed);
                    });
                }
            } else {
                // Keep non-core imports
                nonCoreImports.push(imp);
            }
        }

        // Add a single consolidated @kalxjs/core import
        if (coreImports.size > 0) {
            processedImports.push(`import { ${Array.from(coreImports).join(', ')} } from '@kalxjs/core';\n`);
        }

        // Add all other imports
        processedImports.push(...nonCoreImports);

        // Add imports to the code
        if (processedImports.length > 0) {
            code = processedImports.join('');
        }

        // Add a newline after imports
        code += '\n';

        // Add the component definition
        code += `export default defineComponent({\n`;

        // Add name if not present
        if (!scriptContent.includes('name:')) {
            const filename = options.filename || 'AnonymousComponent';
            const componentName = filename.split('/').pop().replace(/\.\w+$/, '');
            code += `  name: '${componentName}',\n`;
        }

        // Add the script content
        if (scriptContent) {
            code += scriptContent;

            // Check if we need to add a comma
            const needsComma = template && template.code;
            const hasTrailingSemicolon = scriptContent.trim().endsWith(';');
            const hasTrailingComma = scriptContent.trim().endsWith(',');

            if (needsComma && !hasTrailingSemicolon && !hasTrailingComma) {
                code += ',\n';
            } else if (hasTrailingComma) {
                // If it already has a comma, just add a newline
                code += '\n';
            } else {
                // If it has a semicolon or doesn't need a comma, just add a newline
                code += '\n';
            }
        }

        // Check if the script content already has a render function
        const hasRenderFunction = scriptContent.includes('render(') || scriptContent.includes('render :');

        // Add the render function from the template if available and no render function exists in script
        if (template && template.code && !hasRenderFunction) {
            console.log('[codegen] Adding template-generated render function');

            // Extract the render function body
            const renderBody = template.code
                .replace(/function\s+render\(_ctx\)\s*{\n/, '')
                .replace(/}\s*$/, '')
                .split('\n')
                .map(line => `    ${line}`)
                .join('\n');

            code += `  render(_ctx) {\n${renderBody}\n  }`;
        } else if (hasRenderFunction && template && template.code) {
            console.warn('[codegen] Render function found in script, not adding template-generated render function');
        } else if (!template || !template.code) {
            // Enhanced fallback render function with better UI and guidance
            console.log('[codegen] Adding fallback render function');

            code += `  render() {
    return h('div', {
      class: 'kal-component-fallback',
      style: 'padding: 20px; border: 2px solid #3182ce; border-radius: 4px; background-color: #ebf8ff; color: #2c5282;'
    }, [
      h('h2', {}, ['Component Ready']),
      h('p', {}, ['This component is working but needs a template section.']),
      h('div', { style: 'margin-top: 15px; background: #fff; padding: 15px; border-radius: 4px; border: 1px solid #bee3f8;' }, [
        h('h3', { style: 'margin-top: 0; color: #3182ce;' }, ['How to fix this:']),
        h('p', {}, ['Add a <template> section to your .kal file with your component markup.']),
        h('pre', { style: 'background: #2d3748; color: #e2e8f0; padding: 10px; border-radius: 4px; overflow: auto;' }, [
\`<template>
  <div class="my-component">
    <h2>My Component</h2>
    <p>This is my component content</p>
  </div>
</template>\`
        ])
      ])
    ]);
  }`;
        }

        // Close the component definition
        code += `\n});\n\n`;

        // Add style if present
        if (style) {
            const styleId = style.scopeId || `kal-style-${Math.random().toString(36).substring(2, 10)}`;

            code += `// Inject component styles\n`;
            code += `(function() {\n`;
            code += `  if (typeof document !== 'undefined') {\n`;
            code += `    // Check if style already exists\n`;
            code += `    if (!document.getElementById('${styleId}')) {\n`;
            code += `      const style = document.createElement('style');\n`;
            code += `      style.textContent = ${JSON.stringify(style.code)};\n`;
            code += `      style.setAttribute('id', '${styleId}');\n`;

            // Add scope ID attribute if scoped
            if (style.scopeId) {
                code += `      // Add scope ID for scoped styles\n`;
                code += `      const componentSelector = '[data-v-${styleId.replace('data-v-', '')}]';\n`;
                code += `      document.querySelector('head').appendChild(style);\n`;
                code += `      // Add scope ID to component root element when mounted\n`;
                code += `      const originalMounted = component.mounted;\n`;
                code += `      component.mounted = function() {\n`;
                code += `        this.$el.setAttribute('${style.scopeId}', '');\n`;
                code += `        if (originalMounted) originalMounted.call(this);\n`;
                code += `      };\n`;
            } else {
                code += `      document.head.appendChild(style);\n`;
            }

            code += `    }\n`;
            code += `  }\n`;
            code += `})();\n`;
        }

        // Process custom blocks if needed
        if (customBlocks && Object.keys(customBlocks).length > 0) {
            code += `\n// Custom blocks\n`;
            code += `export const blocks = {\n`;

            for (const [type, block] of Object.entries(customBlocks)) {
                code += `  ${type}: ${JSON.stringify(block.content)},\n`;
            }

            code += `};\n`;
        }

        return {
            code,
            map: null // Source map not implemented in this example
        };
    } catch (error) {
        console.error('Error generating code:', error);

        // Generate fallback component
        const fallbackCode = `
import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'CodeGenerationErrorComponent',
  render() {
    return h('div', {
      style: 'padding: 20px; border: 2px solid red; border-radius: 4px; background-color: #fff5f5; color: #c53030;'
    }, [
      h('h2', {}, ['KAL Code Generation Error']),
      h('p', {}, ['${error.message}']),
      h('pre', { style: 'background-color: #f8f8f8; padding: 10px; overflow: auto; font-size: 12px;' }, [
        '${error.stack || 'No stack trace available'}'
      ])
    ]);
  }
});
`;

        return {
            code: fallbackCode,
            map: null
        };
    }
}