/**
 * Simple compiler for .klx files
 * This is a basic implementation that extracts script, template, and style sections
 */
const fs = require('fs');
const path = require('path');

/**
 * Compile a .klx file into JavaScript
 * @param {string} filePath - Path to the .klx file
 * @returns {string} - Compiled JavaScript code
 */
function compileKlxFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return compileKlxContent(content, filePath);
}

/**
 * Compile .klx content into JavaScript
 * @param {string} content - Content of the .klx file
 * @param {string} filePath - Path to the .klx file (for error reporting)
 * @returns {string} - Compiled JavaScript code
 */
function compileKlxContent(content, filePath) {
    try {
        // Extract template, script, and style sections
        const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
        const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
        const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);

        const template = templateMatch ? templateMatch[1].trim() : '';
        const script = scriptMatch ? scriptMatch[1].trim() : 'export default {}';
        const style = styleMatch ? styleMatch[1].trim() : '';

        // Generate JavaScript code
        let jsCode = script;

        // If the script doesn't export a default object, wrap it
        if (!jsCode.includes('export default')) {
            jsCode = `${jsCode}\nexport default {}`;
        }

        // Add template and style as properties to the exported object
        const templateCode = `
// Template string extracted from .klx file
const __template = ${JSON.stringify(template)};

// Style string extracted from .klx file
const __style = ${JSON.stringify(style)};

// Inject template and style into the exported component
const __component = ${jsCode.includes('export default') ? jsCode.replace('export default', '') : '{}'};
__component.template = __template;
__component.style = __style;

export default __component;
`;

        return templateCode;
    } catch (error) {
        console.error(`Error compiling ${filePath}:`, error);
        return `
      console.error("Error compiling ${filePath}: ${error.message}");
      export default {
        render() {
          return h('div', { style: 'color: red; padding: 20px; border: 1px solid red;' }, [
            h('h2', {}, ['Compilation Error']),
            h('pre', {}, [${JSON.stringify(error.message)}])
          ]);
        }
      };
    `;
    }
}

/**
 * Register the compiler with Vite
 * @param {Object} options - Compiler options
 * @returns {Object} - Vite plugin
 */
function vitePlugin(options = {}) {
    return {
        name: 'vite-plugin-klx',
        transform(code, id) {
            if (!id.endsWith('.klx')) return null;

            return {
                code: compileKlxContent(code, id),
                map: null
            };
        }
    };
}

module.exports = {
    compileKlxFile,
    compileKlxContent,
    vitePlugin
};