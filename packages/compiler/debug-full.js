// Comprehensive debug script for the KLX compiler pipeline
import { parse } from './src/parser.js';
import { compile } from './src/compiler.js';
import { generateCode } from './src/codegen.js';
import fs from 'fs';
import path from 'path';

// Function to debug the entire compilation pipeline
function debugCompilation(source, filename) {
    console.log(`\n========== DEBUGGING ${filename} ==========\n`);

    // Step 1: Parse
    console.log('STEP 1: PARSING');
    console.log('Input source length:', source.length);
    console.log('First 100 chars:', source.substring(0, 100).replace(/\n/g, '\\n'));

    const ast = parse(source);

    console.log('\nParse result:');
    console.log('- Template found:', !!ast.template);
    if (ast.template) {
        console.log('  - Template length:', ast.template.content.length);
        console.log('  - Template first 50 chars:', ast.template.content.substring(0, 50).replace(/\n/g, '\\n'));
        console.log('  - Is default template:', !!ast.template.isDefault);
    }

    console.log('- Script found:', !!ast.script);
    if (ast.script) {
        console.log('  - Script length:', ast.script.content.length);
        console.log('  - Script first 50 chars:', ast.script.content.substring(0, 50).replace(/\n/g, '\\n'));
    }

    console.log('- Script Setup found:', !!ast.scriptSetup);
    if (ast.scriptSetup) {
        console.log('  - Script Setup length:', ast.scriptSetup.content.length);
        console.log('  - Script Setup first 50 chars:', ast.scriptSetup.content.substring(0, 50).replace(/\n/g, '\\n'));
    }

    console.log('- Style found:', !!ast.style);
    if (ast.style) {
        console.log('  - Style length:', ast.style.content.length);
    }

    console.log('- Errors:', ast.errors.length > 0 ? ast.errors : 'None');

    // Step 2: Compile
    console.log('\nSTEP 2: COMPILING');
    const compiled = compile(ast, { filename });

    console.log('Compile result:');
    console.log('- Template compiled:', !!compiled.template);
    if (compiled.template) {
        console.log('  - Template code length:', compiled.template.code.length);
        console.log('  - Template code first 100 chars:', compiled.template.code.substring(0, 100).replace(/\n/g, '\\n'));
    }

    console.log('- Script compiled:', !!compiled.script);
    if (compiled.script) {
        console.log('  - Script code length:', compiled.script.code.length);
        console.log('  - Script code first 100 chars:', compiled.script.code.substring(0, 100).replace(/\n/g, '\\n'));
    }

    console.log('- Script Setup compiled:', !!compiled.scriptSetup);
    if (compiled.scriptSetup) {
        console.log('  - Script Setup code length:', compiled.scriptSetup.code.length);
        console.log('  - Script Setup code first 100 chars:', compiled.scriptSetup.code.substring(0, 100).replace(/\n/g, '\\n'));
    }

    console.log('- Style compiled:', !!compiled.style);
    if (compiled.style) {
        console.log('  - Style code length:', compiled.style.code.length);
    }

    console.log('- Errors:', compiled.errors.length > 0 ? compiled.errors : 'None');

    // Step 3: Generate Code
    console.log('\nSTEP 3: GENERATING CODE');
    const generated = generateCode(compiled, { filename });

    console.log('Generated code length:', generated.code.length);
    console.log('Generated code first 200 chars:', generated.code.substring(0, 200).replace(/\n/g, '\\n'));

    // Check for duplicate render functions
    const renderCount = (generated.code.match(/render\(\)/g) || []).length;
    console.log('Number of render() functions:', renderCount);

    // Check for syntax errors
    console.log('\nChecking for potential syntax errors:');
    if (generated.code.includes(');,')) {
        console.log('WARNING: Found ");," pattern which might indicate a syntax error');
    }
    if (generated.code.includes('],\n  render()')) {
        console.log('WARNING: Found "],\\n  render()" pattern which might indicate a missing comma');
    }

    // Save the generated code to a file for inspection
    const outputPath = path.resolve(`./debug-output-${path.basename(filename)}.js`);
    fs.writeFileSync(outputPath, generated.code, 'utf-8');
    console.log(`\nFull generated code saved to: ${outputPath}`);

    return generated.code;
}

// Test with a simple component
const simpleComponent = `<template>
  <div class="test">
    <h1>Test Template</h1>
    <p>This is a test template</p>
  </div>
</template>

<script>
export default {
  name: 'TestComponent'
}
</script>

<style>
.test {
  color: red;
}
</style>`;

// Debug the simple component
debugCompilation(simpleComponent, 'SimpleTest.klx');

// Debug a real file
try {
    const appKlxPath = path.resolve('../../test-app/src/App.klx');
    console.log('\nReading file from:', appKlxPath);

    const appKlxContent = fs.readFileSync(appKlxPath, 'utf-8');
    console.log('File read successfully, length:', appKlxContent.length);

    // Debug the App.klx file
    debugCompilation(appKlxContent, 'App.klx');

    // Try to debug the Home.klx file too
    try {
        const homeKlxPath = path.resolve('../../test-app/src/views/Home.klx');
        console.log('\nReading Home.klx file from:', homeKlxPath);

        const homeKlxContent = fs.readFileSync(homeKlxPath, 'utf-8');
        console.log('Home.klx file read successfully, length:', homeKlxContent.length);

        // Debug the Home.klx file
        debugCompilation(homeKlxContent, 'Home.klx');
    } catch (error) {
        console.error('Error reading or processing Home.klx file:', error);
    }
} catch (error) {
    console.error('Error reading or processing App.klx file:', error);
}