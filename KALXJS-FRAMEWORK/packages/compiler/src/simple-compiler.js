// @kalxjs/compiler - Simple SFC Compiler
// A simplified but reliable compiler for KalxJS Single File Components

/**
 * Extract sections from a KAL Single File Component
 * @param {string} source - Source code of the .kal file
 * @returns {Object} Object containing template, script, and style sections
 */
export function extractSections(source) {
  console.log('[simple-compiler] Extracting sections from KAL file');

  // Extract template section
  const templateMatch = /<template>([\s\S]*?)<\/template>/i.exec(source);
  const template = templateMatch ? templateMatch[1].trim() : null;

  // Extract script section
  const scriptMatch = /<script>([\s\S]*?)<\/script>/i.exec(source);
  const script = scriptMatch ? scriptMatch[1].trim() : null;

  // Extract style section
  const styleMatch = /<style>([\s\S]*?)<\/style>/i.exec(source);
  const style = styleMatch ? styleMatch[1].trim() : null;

  console.log('[simple-compiler] Sections extracted:');
  console.log(`- Template: ${template ? 'Found (' + template.length + ' chars)' : 'Not found'}`);
  console.log(`- Script: ${script ? 'Found (' + script.length + ' chars)' : 'Not found'}`);
  console.log(`- Style: ${style ? 'Found (' + style.length + ' chars)' : 'Not found'}`);

  return { template, script, style };
}

/**
 * Compile a KAL Single File Component into JavaScript
 * @param {string} source - Source code of the .kal file
 * @param {Object} options - Compilation options
 * @returns {Object} Compiled component code
 */
export function compileComponent(source, options = {}) {
  console.log('[simple-compiler] Compiling KAL component');

  try {
    // Extract sections
    const { template, script, style } = extractSections(source);

    if (!template) {
      console.warn('[simple-compiler] No template section found');
    }

    if (!script) {
      console.warn('[simple-compiler] No script section found');
    }

    // Generate component code
    let code = '';

    // Add imports
    code += `import { h, defineComponent, ref } from '@kalxjs/core';\n\n`;

    // Process script content to extract imports and component definition
    let scriptImports = '';
    let componentOptions = '';

    if (script) {
      // Extract imports from script
      const importLines = [];
      const scriptLines = script.split('\n');
      const nonImportLines = [];

      // Separate import statements from the rest of the script
      for (const line of scriptLines) {
        if (line.trim().startsWith('import ')) {
          importLines.push(line);
        } else {
          nonImportLines.push(line);
        }
      }

      scriptImports = importLines.join('\n');

      // Extract component options by removing the export default { and closing }
      const scriptContent = nonImportLines.join('\n');
      const exportMatch = /export\s+default\s+{([\s\S]*)}/m.exec(scriptContent);

      if (exportMatch && exportMatch[1]) {
        componentOptions = exportMatch[1].trim();
      }
    }

    // Add script imports (excluding the framework import we already added)
    if (scriptImports) {
      // Filter out any imports from @kalxjs/core since we already have that
      // But keep track of what was imported so we can ensure they're available
      const coreImports = new Set();
      const filteredImports = scriptImports
        .split('\n')
        .filter(line => {
          if (line.includes('@kalxjs/core')) {
            // Extract what was being imported
            const importMatch = /import\s+{([^}]+)}\s+from\s+['"]@kalxjs\/core['"]/;
            const matches = importMatch.exec(line);
            if (matches && matches[1]) {
              matches[1].split(',').forEach(item => {
                coreImports.add(item.trim());
              });
            }
            return false;
          }
          return true;
        })
        .join('\n');

      // Log what was imported from @kalxjs/core
      console.log('[simple-compiler] Imports from @kalxjs/core:', Array.from(coreImports));

      if (filteredImports.trim()) {
        code += filteredImports + '\n\n';
      }
    }

    // Start component definition
    code += `export default defineComponent({\n`;

    // Add component options from script
    if (componentOptions) {
      // Check if the component has a setup function
      const hasSetup = componentOptions.includes('setup(') || componentOptions.includes('setup (');

      // If it has a setup function, we need to modify it to ensure ref is available
      if (hasSetup) {
        console.log('[simple-compiler] Component has setup function, ensuring ref is available');

        // Replace the setup function with one that has ref available
        const setupRegex = /(setup\s*\([^)]*\)\s*{)([\s\S]*?)(\n\s*})/g;
        componentOptions = componentOptions.replace(setupRegex, (match, start, body, end) => {
          // Add ref to the setup function body if it's not already defined
          if (!body.includes('const ref =') && !body.includes('let ref =') && !body.includes('var ref =')) {
            return `${start}\n    // Ensure ref is available\n    const refFn = ref;\n${body}${end}`;
          }
          return match;
        });

        // Check if the setup function returns a render function
        // If not, we need to add one that uses the template
        if (!componentOptions.includes('return {') || !componentOptions.includes('render:')) {
          console.log('[simple-compiler] Setup function does not return a render function, adding one');

          // Process template to handle Vue-like syntax
          let processedTemplate = '';
          if (template) {
            // 1. Replace {{ expressions }} with string interpolation
            processedTemplate = template
              .replace(/{{(.*?)}}/g, (match, expression) => {
                const expr = expression.trim();
                // Check if this is a ref object and use .value if needed
                return `\${(this.${expr} && typeof this.${expr} === 'object' && 'value' in this.${expr}) ? this.${expr}.value : this.${expr}}`;
              })
              // 2. Replace @click handlers with onclick attributes
              .replace(/@click="(.*?)"/g, (match, handler) => {
                return `onclick="javascript:void(0)" data-click="${handler.trim()}"`;
              });
          }

          // Find the return statement in the setup function
          const returnRegex = /(return\s*{)([\s\S]*?)(})/g;
          componentOptions = componentOptions.replace(returnRegex, (match, start, body, end) => {
            // Add a render function that uses the template
            if (template) {
              return `${start}${body},
      // Added by compiler - render function that uses the template
      render: function() {
        console.log('Compiled component render function called');

        // Create a proper vnode with tag, props, and children
        const vnode = {
          tag: 'div',
          props: { class: 'kal-component' },
          children: [{
            tag: 'div',
            props: {
              innerHTML: this._renderTemplate(),
              onclick: (e) => {
                // Handle click events by finding the closest element with data-click attribute
                const path = e.composedPath ? e.composedPath() : e.path || [e.target];
                for (const el of path) {
                  if (el.hasAttribute && el.hasAttribute('data-click')) {
                    const handlerName = el.getAttribute('data-click');
                    if (typeof this[handlerName] === 'function') {
                      this[handlerName]();
                      e.preventDefault();
                      e.stopPropagation();
                      break;
                    }
                  }
                }
              }
            },
            children: []
          }]
        };

        console.log('Compiled component returning vnode:', vnode);
        return vnode;
      },

      // Added by compiler - helper method to render the template
      _renderTemplate: function() {
        console.log('Compiled component _renderTemplate called with this:', this);
        try {
          // Create a context object with unwrapped refs for template rendering
          const context = { ...this };
          
          // Add props to the context
          if (this.props) {
            for (const key in this.props) {
              if (!(key in context)) {
                context[key] = this.props[key];
              }
            }
          }
          
          // Add default props from the component definition
          if (this.$options && this.$options.props) {
            for (const key in this.$options.props) {
              if (!(key in context) || context[key] === undefined) {
                const propDef = this.$options.props[key];
                if (typeof propDef === 'object' && 'default' in propDef) {
                  context[key] = typeof propDef.default === 'function' 
                    ? propDef.default() 
                    : propDef.default;
                }
              }
            }
          }
          
          // Unwrap any ref objects for template rendering
          for (const key in context) {
            if (context[key] && typeof context[key] === 'object' && 'value' in context[key]) {
              context[key] = context[key].value;
            }
          }
          
          console.log('Template rendering context:', context);
          
          const templateFn = function() { return \`${processedTemplate.replace(/`/g, '\\`')}\`; };
          const result = templateFn.call(context);
          console.log('Compiled component _renderTemplate result:', result);
          return result;
        } catch (error) {
          console.error('Error in _renderTemplate:', error);
          return '<div style="color: red; padding: 10px; border: 1px solid red;"><h3>Template Error</h3><p>' + error.message + '</p></div>';
        }
      }${end}`;
            }
            return match;
          });
        }
      }

      code += componentOptions;

      // Add comma if needed
      if (!componentOptions.endsWith(',')) {
        code += ',\n';
      } else {
        code += '\n';
      }
    }

    // Add render function if the component doesn't have a setup function or if the setup function doesn't return a render function
    const hasSetupWithRender = componentOptions &&
      (componentOptions.includes('setup(') || componentOptions.includes('setup (')) &&
      componentOptions.includes('render:');

    if (template && !hasSetupWithRender) {
      console.log('[simple-compiler] Adding render function for template');
      code += `  render() {\n`;
      code += `    console.log('Compiled component render function called');\n`;
      code += `    \n`;
      code += `    // Create a proper vnode with tag, props, and children\n`;
      code += `    return {\n`;
      code += `      tag: 'div',\n`;
      code += `      props: { class: 'kal-component' },\n`;
      code += `      children: [{\n`;
      code += `        tag: 'div',\n`;
      code += `        props: {\n`;
      code += `          innerHTML: this._renderTemplate(),\n`;
      code += `          onclick: (e) => {\n`;
      code += `            // Handle click events by finding the closest element with data-click attribute\n`;
      code += `            const path = e.composedPath ? e.composedPath() : e.path || [e.target];\n`;
      code += `            for (const el of path) {\n`;
      code += `              if (el.hasAttribute && el.hasAttribute('data-click')) {\n`;
      code += `                const handlerName = el.getAttribute('data-click');\n`;
      code += `                if (typeof this[handlerName] === 'function') {\n`;
      code += `                  this[handlerName]();\n`;
      code += `                  e.preventDefault();\n`;
      code += `                  e.stopPropagation();\n`;
      code += `                  break;\n`;
      code += `                }\n`;
      code += `              }\n`;
      code += `            }\n`;
      code += `          }\n`;
      code += `        },\n`;
      code += `        children: []\n`;
      code += `      }]\n`;
      code += `    };\n`;
      code += `  },\n`;

      // Process template to handle Vue-like syntax
      // 1. Replace {{ expressions }} with string interpolation
      const processedTemplate = template
        .replace(/{{(.*?)}}/g, (match, expression) => {
          return `\${this.${expression.trim()}}`;
        })
        // 2. Replace @click handlers with onclick attributes
        .replace(/@click="(.*?)"/g, (match, handler) => {
          return `onclick="javascript:void(0)" data-click="${handler.trim()}"`;
        });

      // Add a helper method to render the template with the current component state
      code += `  _renderTemplate() {\n`;
      code += `    console.log('_renderTemplate called with this:', this);\n`;
      code += `    try {\n`;
      code += `      // Create a context object with unwrapped refs for template rendering\n`;
      code += `      const context = this._createRenderContext();\n`;
      code += `      \n`;
      code += `      // Use the context to render the template\n`;
      code += `      const templateFn = function() { return \`${processedTemplate.replace(/`/g, '\\`')}\`; };\n`;
      code += `      const result = templateFn.call(context);\n`;
      code += `      console.log('_renderTemplate result:', result);\n`;
      code += `      return result;\n`;
      code += `    } catch (error) {\n`;
      code += `      console.error('Error in _renderTemplate:', error);\n`;
      code += `      return '<div style="color: red; padding: 10px; border: 1px solid red;"><h3>Template Error</h3><p>' + error.message + '</p></div>';\n`;
      code += `    }\n`;
      code += `  },\n`;

      code += `  // Helper method to create the render context with unwrapped refs\n`;
      code += `  _createRenderContext() {\n`;
      code += `    const context = { ...this };\n`;
      code += `    \n`;
      code += `    // Add props to the context\n`;
      code += `    if (this.props) {\n`;
      code += `      for (const key in this.props) {\n`;
      code += `        if (!(key in context)) {\n`;
      code += `          context[key] = this.props[key];\n`;
      code += `        }\n`;
      code += `      }\n`;
      code += `    }\n`;
      code += `    \n`;
      code += `    // Add default props from the component definition\n`;
      code += `    if (this.$options && this.$options.props) {\n`;
      code += `      for (const key in this.$options.props) {\n`;
      code += `        if (!(key in context) || context[key] === undefined) {\n`;
      code += `          const propDef = this.$options.props[key];\n`;
      code += `          if (typeof propDef === 'object' && 'default' in propDef) {\n`;
      code += `            context[key] = typeof propDef.default === 'function' \n`;
      code += `              ? propDef.default() \n`;
      code += `              : propDef.default;\n`;
      code += `          }\n`;
      code += `        }\n`;
      code += `      }\n`;
      code += `    }\n`;
      code += `    \n`;
      code += `    // Unwrap any ref objects for template rendering\n`;
      code += `    for (const key in context) {\n`;
      code += `      if (context[key] && typeof context[key] === 'object' && 'value' in context[key]) {\n`;
      code += `        context[key] = context[key].value;\n`;
      code += `      }\n`;
      code += `    }\n`;
      code += `    \n`;
      code += `    console.log('Template rendering context:', context);\n`;
      code += `    // Return a vnode with the template HTML\n`;
      code += `    return {\n`;
      code += `      tag: 'div',\n`;
      code += `      props: { innerHTML: \`${template.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` },\n`;
      code += `      children: []\n`;
      code += `    };\n`;
      code += `  }\n`;
    } else if (hasSetupWithRender) {
      console.log('[simple-compiler] Setup function already returns a render function, skipping template render');
    } else {
      // Fallback render function
      code += `  render() {\n`;
      code += `    console.log('Fallback render function called - no template found');\n`;
      code += `    // Create a proper vnode with tag, props, and children\n`;
      code += `    return {\n`;
      code += `      tag: 'div',\n`;
      code += `      props: { class: 'kal-component-empty' },\n`;
      code += `      children: [{\n`;
      code += `        tag: 'p',\n`;
      code += `        props: { style: 'padding: 10px; border: 1px solid #f0ad4e; background-color: #fcf8e3; color: #8a6d3b; border-radius: 4px;' },\n`;
      code += `        children: ['No template found']\n`;
      code += `      }]\n`;
      code += `    };\n`;
      code += `  }\n`;
    }

    // Close component definition
    code += `});\n\n`;

    // Add style if present
    if (style) {
      const styleId = `kal-style-${Math.random().toString(36).substring(2, 10)}`;

      code += `// Inject component styles\n`;
      code += `(function() {\n`;
      code += `  if (typeof document !== 'undefined') {\n`;
      code += `    const styleId = '${styleId}';\n`;
      code += `    if (!document.getElementById(styleId)) {\n`;
      code += `      const styleEl = document.createElement('style');\n`;
      code += `      styleEl.id = styleId;\n`;
      code += `      styleEl.textContent = \`${style.replace(/`/g, '\\`')}\`;\n`;
      code += `      document.head.appendChild(styleEl);\n`;
      code += `    }\n`;
      code += `  }\n`;
      code += `})();\n`;
    }

    return { code, map: null };
  } catch (error) {
    console.error('[simple-compiler] Error compiling component:', error);

    // Generate fallback component
    const fallbackCode = `
import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'ErrorComponent',
  render() {
    return {
      tag: 'div',
      props: {
        style: 'padding: 20px; border: 2px solid red; border-radius: 4px; background-color: #fff5f5; color: #c53030;'
      },
      children: [
        { tag: 'h2', props: {}, children: ['KAL Compilation Error'] },
        { tag: 'p', props: {}, children: ['${error.message.replace(/'/g, "\\'")}'] }
      ]
    };
  }
});`;

    return { code: fallbackCode, map: null };
  }
}
