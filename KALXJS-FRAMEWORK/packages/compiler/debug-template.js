// Debug script focused on template parsing
import { parse } from './src/parser.js';
import { compile } from './src/compiler.js';
import { generateCode } from './src/codegen.js';
import fs from 'fs';
import path from 'path';

// Function to debug template parsing
function debugTemplateParsing(source, filename) {
    console.log(`\n========== DEBUGGING TEMPLATE PARSING FOR ${filename} ==========\n`);

    // Step 1: Parse
    console.log('STEP 1: PARSING TEMPLATE');
    console.log('Input source length:', source.length);
    console.log('First 200 chars:', source.substring(0, 200).replace(/\n/g, '\\n'));

    // Extract template section manually for verification
    const templateRegex = /<template(?:\s+[^>]*)?>([\s\S]*?)<\/template>/i;
    const templateMatch = templateRegex.exec(source);

    if (templateMatch) {
        console.log('\nTemplate section found manually:');
        console.log('- Template content length:', templateMatch[1].trim().length);
        console.log('- Template content first 100 chars:', templateMatch[1].trim().substring(0, 100).replace(/\n/g, '\\n'));

        // Log the first element in the template
        const firstElementRegex = /<([a-z0-9-]+)(?:\s+([^>]*))?(?:\/>|>)/i;
        const firstElementMatch = firstElementRegex.exec(templateMatch[1].trim());

        if (firstElementMatch) {
            console.log('- First element tag:', firstElementMatch[1]);
            console.log('- First element attributes:', firstElementMatch[2] || 'none');
        } else {
            console.log('- No element found in template content');
        }
    } else {
        console.log('\nNo template section found manually');
    }

    // Use the parser
    const ast = parse(source);

    console.log('\nParse result from parser.js:');
    console.log('- Template found:', !!ast.template);
    if (ast.template) {
        console.log('  - Template length:', ast.template.content.length);
        console.log('  - Template first 100 chars:', ast.template.content.substring(0, 100).replace(/\n/g, '\\n'));
        console.log('  - Is default template:', !!ast.template.isDefault);
    }

    // Step 2: Compile
    console.log('\nSTEP 2: COMPILING TEMPLATE');
    const compiled = compile(ast, { filename });

    console.log('Compile result:');
    console.log('- Template compiled:', !!compiled.template);
    if (compiled.template) {
        console.log('  - Template code length:', compiled.template.code.length);
        console.log('  - Template code first 200 chars:', compiled.template.code.substring(0, 200).replace(/\n/g, '\\n'));

        // Check if the template contains "Default Template Content"
        if (compiled.template.code.includes('Default Template Content')) {
            console.log('  - WARNING: Template contains "Default Template Content" fallback');
        }

        // Check if the template contains error messages
        if (compiled.template.code.includes('Template Compilation Error')) {
            console.log('  - WARNING: Template contains compilation error message');
        }
    }

    // Step 3: Generate Code
    console.log('\nSTEP 3: GENERATING CODE WITH TEMPLATE');
    const generated = generateCode(compiled, { filename });

    console.log('Generated code length:', generated.code.length);

    // Check if the generated code contains "Default Template Content"
    if (generated.code.includes('Default Template Content')) {
        console.log('WARNING: Generated code contains "Default Template Content" fallback');
    }

    // Check if the generated code contains error messages
    if (generated.code.includes('Template Compilation Error')) {
        console.log('WARNING: Generated code contains template compilation error message');
    }

    // Save the generated code to a file for inspection
    const outputPath = path.resolve(`./debug-template-${path.basename(filename)}.js`);
    fs.writeFileSync(outputPath, generated.code, 'utf-8');
    console.log(`\nFull generated code saved to: ${outputPath}`);

    return generated.code;
}

// Debug a real file
try {
    const appKlxPath = path.resolve('../../test-app/src/App.klx');
    console.log('\nReading file from:', appKlxPath);

    const appKlxContent = fs.readFileSync(appKlxPath, 'utf-8');
    console.log('File read successfully, length:', appKlxContent.length);

    // Debug the App.klx file
    debugTemplateParsing(appKlxContent, 'App.klx');

    // Try to debug the Home.klx file too
    try {
        const homeKlxPath = path.resolve('../../test-app/src/views/Home.klx');
        console.log('\nReading Home.klx file from:', homeKlxPath);

        const homeKlxContent = fs.readFileSync(homeKlxPath, 'utf-8');
        console.log('Home.klx file read successfully, length:', homeKlxContent.length);

        // Debug the Home.klx file
        debugTemplateParsing(homeKlxContent, 'Home.klx');
    } catch (error) {
        console.error('Error reading or processing Home.klx file:', error);
    }
} catch (error) {
    console.error('Error reading or processing App.klx file:', error);
}