// Debug script for the KLX parser
import { parse } from './src/parser.js';
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
const result = parse(testContent);

// Log the result
console.log('\nParse result:');
console.log('Template found:', !!result.template);
console.log('Script found:', !!result.script);
console.log('Style found:', !!result.style);

if (result.template) {
    console.log('\nTemplate content:', result.template.content);
}

if (result.script) {
    console.log('\nScript content:', result.script.content);
}

if (result.style) {
    console.log('\nStyle content:', result.style.content);
}

// Now try to parse a real file
try {
    const appKlxPath = path.resolve('../../test-app/src/App.klx');
    console.log('\nReading file from:', appKlxPath);

    const appKlxContent = fs.readFileSync(appKlxPath, 'utf-8');
    console.log('File read successfully, length:', appKlxContent.length);

    // Parse the file content
    console.log('Parsing file content...');
    const fileResult = parse(appKlxContent);

    // Log the result
    console.log('\nFile parse result:');
    console.log('Template found:', !!fileResult.template);
    console.log('Script found:', !!fileResult.script);
    console.log('Style found:', !!fileResult.style);

    if (fileResult.template) {
        console.log('\nTemplate content (first 100 chars):', fileResult.template.content.substring(0, 100) + '...');
        console.log('Is default template:', fileResult.template.isDefault === true);
    }
} catch (error) {
    console.error('Error reading or parsing file:', error);
}