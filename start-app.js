const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the my-app directory
const appDir = path.join(__dirname, 'my-app');

// Check if the directory exists
if (!fs.existsSync(appDir)) {
    console.error('Error: my-app directory not found');
    process.exit(1);
}

console.log('Starting the application...');
console.log('App directory:', appDir);

// Change to the app directory and run the dev server
const child = exec('cd my-app && npm run dev', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return;
    }
    console.log(`Stdout: ${stdout}`);
});

// Forward the output to the console
child.stdout.on('data', (data) => {
    console.log(data.toString());
});

child.stderr.on('data', (data) => {
    console.error(data.toString());
});

console.log('Server starting...');
console.log('Press Ctrl+C to stop the server');