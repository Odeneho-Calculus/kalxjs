const fs = require('fs');
const path = require('path');

// Path to the file to check
const filePath = path.join(__dirname, 'KALXJS-FRAMEWORK/packages/cli/src/commands/create.js');

try {
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Try to parse the file as JavaScript
    try {
        // This will throw an error if there's a syntax error
        require(filePath);
        console.log('✅ No syntax errors found in the file.');
    } catch (parseError) {
        console.error('❌ Syntax error found:');
        console.error(parseError);
    }
} catch (readError) {
    console.error('Error reading the file:', readError);
}