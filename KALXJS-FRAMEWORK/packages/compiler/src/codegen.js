// @kalxjs/compiler - Code generation for .klx files

/**
 * Generates JavaScript code from compiled component
 * @param {Object} compiled - Compiled component
 * @param {Object} options - Code generation options
 * @returns {Object} Generated code and source map
 */
export function generateCode(compiled, options = {}) {
    const { template, script, scriptSetup, style } = compiled;

    try {
        // Track imports from the script sections
        const imports = [];
        let hasHImport = false;
        let hasDefineComponentImport = false;

        // Process script content
        let scriptContent = '';
        if (script) {
            // Extract imports
            const importRegex = /import\s+.*?;\n/g;
            let match;
            let scriptCode = script.code;

            while ((match = importRegex.exec(scriptCode))) {
                imports.push(match[0]);

                // Check if h and defineComponent are already imported
                if (match[0].includes('h') && match[0].includes('@kalxjs/core')) {
                    hasHImport = true;
                }
                if (match[0].includes('defineComponent') && match[0].includes('@kalxjs/core')) {
                    hasDefineComponentImport = true;
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

            // Remove any remaining import statements that might be in the content
            scriptContent = scriptContent.replace(/^\s*import\s+.*?;/gm, '');
        }

        // Process script setup content if present
        let setupContent = '';
        if (scriptSetup) {
            // Extract imports from setup
            const setupImportRegex = /import\s+.*?;\n/g;
            let setupMatch;
            let setupCode = scriptSetup.code;

            while ((setupMatch = setupImportRegex.exec(setupCode))) {
                // Add to imports if not already included
                if (!imports.includes(setupMatch[0])) {
                    imports.push(setupMatch[0]);
                }
            }

            // Remove imports from setup content
            setupCode = setupCode.replace(setupImportRegex, '');

            // Store the setup code to be added to the setup() function
            setupContent = setupCode.trim();
        }

        // Start with the imports
        let code = '';

        // Collect all required imports from @kalxjs/core
        const coreImports = new Set();
        if (!hasHImport) coreImports.add('h');
        if (!hasDefineComponentImport) coreImports.add('defineComponent');

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

            // Check if we need to add a comma, but only if there's a render function coming next
            const needsComma = (template && template.code) || (!template || !template.code);
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

            // Add setup function if we have script setup content
            if (setupContent) {
                // Check if there's already a setup function in the script content
                if (!scriptContent.includes('setup(') && !scriptContent.includes('setup :')) {
                    code += `  setup() {\n`;
                    // Add the setup content, indented properly
                    code += setupContent.split('\n')
                        .map(line => `    ${line}`)
                        .join('\n');

                    // Add return statement if not present
                    if (!setupContent.includes('return {') && !setupContent.includes('return(')) {
                        code += '\n    // Auto-generated return statement\n    return {};\n';
                    }

                    code += '  },\n';
                } else {
                    console.warn('Script setup content found but setup() function already exists in main script');
                }
            }

            // Check if the script content already has a render function
            const hasRenderFunction = scriptContent.includes('render(') || scriptContent.includes('render :');

            // Add the render function from the template if available and no render function exists in script
            if (template && template.code && !hasRenderFunction) {
                console.log('[codegen] Adding template-generated render function');

                code += `  render() {\n`;

                // Extract the render function body
                const renderBody = template.code
                    .replace(/function\s+render\(\)\s*{\n/, '')
                    .replace(/}\s*$/, '')
                    .split('\n')
                    .map(line => `    ${line}`)
                    .join('\n');

                code += renderBody + '\n';
                code += `  }\n`;
            } else if (hasRenderFunction && template && template.code) {
                console.warn('[codegen] Render function found in script, not adding template-generated render function');
            } else if (!template || !template.code) {
                // Enhanced fallback render function with better UI and guidance
                console.log('[codegen] Adding fallback render function');

                code += `  render() {
    return h('div', {
      class: 'klx-component-fallback',
      style: 'padding: 20px; border: 2px solid #3182ce; border-radius: 4px; background-color: #ebf8ff; color: #2c5282;'
    }, [
      h('h2', {}, ['Component Ready']),
      h('p', {}, ['This component is working but needs a template section.']),
      h('div', { style: 'margin-top: 15px; background: #fff; padding: 15px; border-radius: 4px; border: 1px solid #bee3f8;' }, [
        h('h3', { style: 'margin-top: 0; color: #3182ce;' }, ['How to fix this:']),
        h('p', {}, ['Add a <template> section to your .klx file with your component markup.']),
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
  }\n`;
            }
        }

        // Clean up any trailing commas or syntax errors before closing the component definition
        try {
            // Fix trailing commas after return statements
            code = code.replace(/return\s+{[^}]*};\s*,/g, (match) => {
                console.log('[codegen] Fixing trailing comma after return statement');
                return match.replace(',', '');
            });

            // Fix trailing commas after function bodies
            code = code.replace(/}\s*,\s*}/g, (match) => {
                console.log('[codegen] Fixing trailing comma after function body');
                return match.replace(',', '');
            });

            // Fix trailing commas after the render function
            const lastRenderFunctionEnd = code.lastIndexOf(']);');
            if (lastRenderFunctionEnd !== -1) {
                // Check if there's a comma after the closing bracket
                const nextChar = code.substring(lastRenderFunctionEnd + 3, lastRenderFunctionEnd + 4);
                if (nextChar === ',') {
                    // Replace the comma with nothing
                    code = code.substring(0, lastRenderFunctionEnd + 3) +
                        code.substring(lastRenderFunctionEnd + 4);
                    console.log('[codegen] Removed trailing comma after render function');
                }
            }

            // Fix multiple render functions (a common issue)
            const renderFunctionRegex = /render\(\)\s*{[^}]*}\s*,\s*render\(\)/g;
            if (renderFunctionRegex.test(code)) {
                console.log('[codegen] Found multiple render functions, fixing...');
                code = code.replace(renderFunctionRegex, 'render()');
            }

            // Remove any trailing commas before the closing parenthesis of defineComponent
            code = code.replace(/,(\s*})\s*\)\s*;/g, '$1);');

            // Fix any double commas
            code = code.replace(/,,/g, ',');
        } catch (error) {
            console.error('[codegen] Error while fixing syntax:', error);
        }

        // Close the component definition
        code += `});\n\n`;

        // Add style if present
        if (style) {
            const styleId = style.scopeId || `klx-style-${Math.random().toString(36).substring(2, 10)}`;

            code += `// Inject component styles\n`;
            code += `(function() {\n`;
            code += `  if (typeof document !== 'undefined') {\n`;
            code += `    // Check if style already exists\n`;
            code += `    if (!document.getElementById('${styleId}')) {\n`;
            code += `      const style = document.createElement('style');\n`;
            code += `      style.textContent = ${JSON.stringify(style.code)};\n`;
            code += `      style.setAttribute('id', '${styleId}');\n`;
            code += `      document.head.appendChild(style);\n`;
            code += `    }\n`;
            code += `  }\n`;
            code += `})();\n`;
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
      h('h2', {}, ['KLX Code Generation Error']),
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
