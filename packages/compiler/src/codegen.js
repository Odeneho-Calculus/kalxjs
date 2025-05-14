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
        // Start with the imports
        let code = `import { h, defineComponent } from '@kalxjs/core';\n\n`;

        // Track imports from the script sections
        const imports = [];

        // Process script content
        let scriptContent = '';
        if (script) {
            // Extract imports
            const importRegex = /import\s+.*?;\n/g;
            let match;
            let scriptCode = script.code;

            while ((match = importRegex.exec(scriptCode))) {
                imports.push(match[0]);
            }

            // Remove imports from script content
            scriptCode = scriptCode.replace(importRegex, '');

            // Remove export default { ... } wrapper
            scriptContent = scriptCode
                .replace(/export\s+default\s+defineComponent\s*\(\s*{/, '')
                .replace(/export\s+default\s+{/, '')
                .replace(/}\s*\)\s*;?\s*$/, '')
                .replace(/}\s*;?\s*$/, '')
                .trim();
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

        // Add imports at the top
        if (imports.length > 0) {
            code = imports.join('') + code;
        }

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

            // Add comma if needed
            if (!scriptContent.trim().endsWith(',')) {
                code += ',\n';
            } else {
                code += '\n';
            }
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

        // Add the render function
        if (template && template.code) {
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
        } else {
            // Enhanced fallback render function with better UI and guidance
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
      h('p', {}, [${JSON.stringify(error.message)}]),
      h('pre', { style: 'background-color: #f8f8f8; padding: 10px; overflow: auto; font-size: 12px;' }, [
        ${JSON.stringify(error.stack || 'No stack trace available')}
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