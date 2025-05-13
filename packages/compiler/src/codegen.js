// @kalxjs/compiler - Code generation for .klx files

/**
 * Generates JavaScript code from compiled component
 * @param {Object} compiled - Compiled component
 * @param {Object} options - Code generation options
 * @returns {Object} Generated code and source map
 */
export function generateCode(compiled, options = {}) {
    const { template, script, style } = compiled;

    try {
        // Start with the imports
        let code = `import { h, defineComponent } from '@kalxjs/core';\n\n`;

        // Track imports from the script section
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
            // Fallback render function
            code += `  render() {\n    return h('div', { class: 'klx-component-fallback' }, ['No template defined or template compilation failed']);\n  }\n`;
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