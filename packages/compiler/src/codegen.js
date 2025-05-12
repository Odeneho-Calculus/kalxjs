// @kalxjs/compiler - Code generation for .klx files

/**
 * Generates JavaScript code from compiled component
 * @param {Object} compiled - Compiled component
 * @param {Object} options - Code generation options
 * @returns {Object} Generated code and source map
 */
export function generateCode(compiled, options = {}) {
    const { template, script, style } = compiled;

    // Start with the imports
    let code = `import { h, defineComponent } from '@kalxjs/core';\n\n`;

    // Add the component definition
    code += `export default defineComponent({\n`;

    // Add the script content (excluding imports and exports)
    if (script) {
        const scriptContent = script.code
            .replace(/import\s+.*?;\n/g, '') // Remove imports
            .replace(/export\s+default\s+{/, '') // Remove export default {
            .replace(/}\s*;?\s*$/, ''); // Remove closing brace

        code += scriptContent.trim();

        // Add comma if needed
        if (!scriptContent.trim().endsWith(',')) {
            code += ',\n';
        } else {
            code += '\n';
        }
    }

    // Add the render function
    if (template) {
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
        code += `  render() {\n    return h('div', {}, ['No template defined']);\n  }\n`;
    }

    // Close the component definition
    code += `});\n\n`;

    // Add style if present
    if (style) {
        const styleId = style.scopeId || `klx-style-${Math.random().toString(36).substring(2, 10)}`;

        code += `// Inject component styles\n`;
        code += `if (typeof document !== 'undefined') {\n`;
        code += `  const style = document.createElement('style');\n`;
        code += `  style.textContent = ${JSON.stringify(style.code)};\n`;
        code += `  style.setAttribute('id', '${styleId}');\n`;
        code += `  document.head.appendChild(style);\n`;
        code += `}\n`;
    }

    return {
        code,
        map: null // Source map not implemented in this example
    };
}