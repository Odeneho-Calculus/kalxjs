const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the file we want to check
const filePath = path.join(__dirname, 'KALXJS-FRAMEWORK/packages/cli/src/commands/create.js');

try {
    // Read the file
    console.log(`Reading file: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Check for syntax errors using Node's built-in parser
    console.log('Checking for syntax errors...');
    try {
        // Use Node's built-in parser to check for syntax errors
        // This will throw an error if there's a syntax issue
        new Function(fileContent);
        console.log('✅ No syntax errors found in the file.');
    } catch (syntaxError) {
        console.error('❌ Syntax error found:');
        console.error(syntaxError);

        // Try to identify the line number from the error message
        const match = syntaxError.message.match(/at line (\d+)/);
        if (match && match[1]) {
            const lineNumber = parseInt(match[1], 10);
            const lines = fileContent.split('\n');

            // Show the problematic line and a few lines before and after for context
            console.error('\nContext:');
            for (let i = Math.max(0, lineNumber - 3); i < Math.min(lines.length, lineNumber + 4); i++) {
                const prefix = i === lineNumber - 1 ? '> ' : '  ';
                console.error(`${prefix}${i + 1}: ${lines[i]}`);
            }
        }
    }

    // Additional check using Node's command-line syntax check
    console.log('\nRunning Node.js syntax check...');
    try {
        execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
        console.log('✅ Node.js syntax check passed.');
    } catch (error) {
        console.error('❌ Node.js syntax check failed:');
        console.error(error.stdout ? error.stdout.toString() : '');
        console.error(error.stderr ? error.stderr.toString() : '');
    }

} catch (fileError) {
    console.error(`Error reading file: ${fileError.message}`);
}