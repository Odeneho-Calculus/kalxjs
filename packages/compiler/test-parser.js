// Test script for the KLX parser
import { parse } from './src/parser.js';
import fs from 'fs';
import path from 'path';

// Read the actual App.klx file from the test-app
const appKlxPath = path.resolve('../../test-app/src/App.klx');
console.log('Reading file from:', appKlxPath);

try {
  // Read the file content
  const appKlxContent = fs.readFileSync(appKlxPath, 'utf-8');
  console.log('File read successfully');
  console.log('File content length:', appKlxContent.length);
  console.log('First 100 characters:', appKlxContent.substring(0, 100));

  // Check if the file contains template and script tags
  console.log('Contains <template> tag:', appKlxContent.includes('<template>'));
  console.log('Contains <script> tag:', appKlxContent.includes('<script>'));
  console.log('Contains <style> tag:', appKlxContent.includes('<style>'));

  // Parse the file content
  console.log('Parsing file content...');
  const result = parse(appKlxContent);

  // Log the result
  console.log('\nParse result:');
  console.log('Template found:', !!result.template);
  console.log('Script found:', !!result.script);
  console.log('Style found:', !!result.style);
  console.log('Errors:', result.errors);

  if (result.template) {
    console.log('\nTemplate details:');
    console.log('Is default template:', result.template.isDefault === true);
    console.log('Template content length:', result.template.content.length);
    console.log('Template content (first 100 chars):', result.template.content.substring(0, 100) + '...');
  }

  if (result.script) {
    console.log('\nScript details:');
    console.log('Script content length:', result.script.content.length);
    console.log('Script content (first 100 chars):', result.script.content.substring(0, 100) + '...');
  }

  if (result.style) {
    console.log('\nStyle details:');
    console.log('Style content length:', result.style.content.length);
    console.log('Style content (first 100 chars):', result.style.content.substring(0, 100) + '...');
  }

  // Test with a simple string that definitely has template and script tags
  console.log('\n\nTesting with a simple test string:');
  const testString = `<template>
  <div>Hello World</div>
</template>
<script>
export default {
  name: 'TestComponent'
}
</script>`;

  const testResult = parse(testString);
  console.log('Test parse result:');
  console.log('Template found:', !!testResult.template);
  console.log('Script found:', !!testResult.script);
  console.log('Errors:', testResult.errors);

  if (testResult.template) {
    console.log('Template content:', testResult.template.content);
  }

  if (testResult.script) {
    console.log('Script content:', testResult.script.content);
  }

} catch (error) {
  console.error('Error reading or parsing file:', error);
}