import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

// Enhanced plugin to handle .klx files
function klxPlugin() {
    return {
        name: 'vite-plugin-klx',
        
        // This hook runs before Vite's internal transform
        enforce: 'pre',
        
        // Handle .klx files
        transform(code, id) {
            if (!id.endsWith('.klx')) return null;
            
            try {
                console.log(`Processing .klx file: ${id}`);
                
                // Read the file directly from the filesystem
                const fileContent = fs.readFileSync(id, 'utf-8');
                console.log(`File content length: ${fileContent.length} characters`);
                
                // Extract template, script, and style sections
                const templateMatch = /<template>([\s\S]*?)<\/template>/i.exec(fileContent);
                const scriptMatch = /<script>([\s\S]*?)<\/script>/i.exec(fileContent);
                const styleMatch = /<style>([\s\S]*?)<\/style>/i.exec(fileContent);
                
                console.log(`Template match: ${templateMatch ? 'YES' : 'NO'}`);
                console.log(`Script match: ${scriptMatch ? 'YES' : 'NO'}`);
                console.log(`Style match: ${styleMatch ? 'YES' : 'NO'}`);
                
                if (!templateMatch || !scriptMatch) {
                    console.error(`Invalid .klx file: ${id}. Missing template or script section.`);
                    return `
                        export default {
                            name: 'ErrorComponent',
                            template: '<div style="color: red; padding: 20px; border: 1px solid red;"><h3>Error Processing Component</h3><p>Missing template or script section in .klx file</p></div>'
                        }
                    `;
                }
                
                const template = templateMatch[1].trim();
                const script = scriptMatch[1].trim();
                const style = styleMatch ? styleMatch[1].trim() : '';
                
                // Process template to escape backticks and handle line breaks
                const processedTemplate = template
                    .replace(/\`/g, '\\`')
                    .replace(/\$/g, '\\$');
                
                // Create a JavaScript file that exports the component
                let jsCode = script;
                
                // Add template as a string property to the component
                const exportMatch = /export\s+default\s+\{/g.exec(jsCode);
                if (exportMatch) {
                    const index = exportMatch.index + exportMatch[0].length;
                    jsCode = jsCode.slice(0, index) + `
  template: \`${processedTemplate}\`,
` + jsCode.slice(index);
                } else {
                    console.error(`Invalid .klx file: ${id}. No "export default {" found in script section.`);
                    return `
                        export default {
                            name: 'ErrorComponent',
                            template: '<div style="color: red; padding: 20px; border: 1px solid red;"><h3>Error Processing Component</h3><p>No "export default {" found in script section</p></div>'
                        }
                    `;
                }
                
                // Add style to the document if it exists
                if (style) {
                    const processedStyle = style.replace(/\`/g, '\\`').replace(/\$/g, '\\$');
                    
                    jsCode += `
// Add component styles
(function() {
  const styleId = 'klx-style-${id.split('/').pop().replace('.klx', '')}';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = \`${processedStyle}\`;
    document.head.appendChild(styleEl);
  }
})();
`;
                }
                
                console.log(`Successfully processed .klx file: ${id}`);
                
                return {
                    code: jsCode,
                    map: null
                };
            } catch (error) {
                console.error(`Error processing .klx file ${id}:`, error);
                return `
                    export default {
                        name: 'ErrorComponent',
                        template: '<div style="color: red; padding: 20px; border: 1px solid red;"><h3>Error Processing Component</h3><p>Error: ${error.message.replace(/'/g, "\\'")}</p></div>'
                    }
                `;
            }
        }
    };
}

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@kalxjs/core': path.resolve(__dirname, './packages/core/src')
        },
        extensions: ['.js', '.json', '.klx']
    },
    server: {
        port: 3001,
        open: true
    },
    plugins: [
        klxPlugin()
    ],
    assetsInclude: ['**/*.klx']
});