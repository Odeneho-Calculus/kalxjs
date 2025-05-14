// Debug script for the KLX compiler
import { parse } from './src/parser.js';
import { compile } from './src/compiler.js';
import { generateCode } from './src/codegen.js';
import fs from 'fs';
import path from 'path';

// Create a simple test file
const testContent = `<template>
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

// Parse the test content
console.log('Parsing test content...');
const ast = parse(testContent);

// Compile the AST
console.log('\nCompiling AST...');
const compiled = compile(ast, { filename: 'TestComponent.klx' });

// Generate code
console.log('\nGenerating code...');
const generated = generateCode(compiled, { filename: 'TestComponent.klx' });

// Log the result
console.log('\nGenerated code:');
console.log(generated.code);

// Now try with a real file
try {
    const appKlxPath = path.resolve('../../test-app/src/App.klx');
    console.log('\n\nReading file from:', appKlxPath);

    const appKlxContent = fs.readFileSync(appKlxPath, 'utf-8');
    console.log('File read successfully, length:', appKlxContent.length);

    // Parse the file content
    console.log('Parsing file content...');
    const fileAst = parse(appKlxContent);

    // Compile the AST
    console.log('\nCompiling file AST...');
    const fileCompiled = compile(fileAst, { filename: 'App.klx' });

    // Generate code
    console.log('\nGenerating file code...');
    const fileGenerated = generateCode(fileCompiled, { filename: 'App.klx' });

    // Log the result
    console.log('\nGenerated file code (first 500 chars):');
    console.log(fileGenerated.code.substring(0, 500) + '...');

    // Save the generated code to a file for inspection
    const outputPath = path.resolve('./debug-output.js');
    fs.writeFileSync(outputPath, fileGenerated.code, 'utf-8');
    console.log(`\nFull generated code saved to: ${outputPath}`);
} catch (error) {
    console.error('Error processing file:', error);
}