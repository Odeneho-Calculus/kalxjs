const path = require('path');
const detectPort = require('detect-port');
const ora = require('ora');
const gradient = require('gradient-string');
const fs = require('fs');

// Import ESM modules dynamically for compatibility - available to all functions
let chalk, boxen;

async function initializeESModules() {
    if (!chalk || !boxen) {
        chalk = await import('chalk').then(m => m.default);
        boxen = await import('boxen').then(m => m.default);
    }
}

/**
 * Start development server
 * @param {Object} options - Command options
 */
async function serve(options = {}) {
    // Initialize ESM modules
    await initializeESModules();

    // Set default options
    options = {
        port: 3000,
        host: true,
        open: false,
        https: false,
        ...options
    };

    // Display a fancy header
    console.log('\n');
    console.log(gradient.pastel.multiline('╔═════════════════════════════════════╗'));
    console.log(gradient.pastel.multiline('║                                     ║'));
    console.log(gradient.pastel.multiline('║     KalxJS Development Server       ║'));
    console.log(gradient.pastel.multiline('║                                     ║'));
    console.log(gradient.pastel.multiline('╚═════════════════════════════════════╝'));
    console.log('\n');

    // Start the spinner with a custom spinner
    const spinner = ora({
        text: chalk.cyan('Initializing development server...'),
        spinner: 'dots',
        color: 'cyan'
    }).start();

    try {
        // Check if we're in a kalxjs project directory
        const projectRoot = process.cwd();

        // Verify this is a valid project
        spinner.text = chalk.cyan('Validating project structure...');

        if (!fs.existsSync(path.join(projectRoot, 'package.json'))) {
            spinner.fail(chalk.red('No package.json found. Are you in a kalxjs project directory?'));
            console.log('\n');
            console.log(boxen(
                chalk.redBright('⚠️ Project Validation Failed ⚠️') + '\n\n' +
                chalk.white('This command must be run from the root of a KalxJS project.') + '\n\n' +
                chalk.yellow('To create a new project, run:') + '\n' +
                chalk.cyan('  kalxjs create my-app'),
                {
                    padding: 1,
                    margin: 1,
                    borderColor: 'red',
                    borderStyle: 'round'
                }
            ));
            process.exit(1);
        }

        // Read package.json to verify it's a kalxjs project
        const packageJson = require(path.join(projectRoot, 'package.json'));

        // Check for KalxJS dependencies (both legacy 'kalxjs' and scoped '@kalxjs/*' packages)
        const isKalxJSProject = packageJson.dependencies && (
            packageJson.dependencies.kalxjs ||
            packageJson.dependencies['@kalxjs/core'] ||
            Object.keys(packageJson.dependencies).some(dep => dep.startsWith('@kalxjs/'))
        );

        // Also check for app directory structure (typical KalxJS project structure)
        const hasAppDirectory = fs.existsSync(path.join(projectRoot, 'app'));

        if (!isKalxJSProject && !hasAppDirectory) {
            spinner.warn(chalk.yellow('This does not appear to be a kalxjs project, but proceeding anyway...'));
        } else {
            spinner.succeed(chalk.green('Valid KalxJS project detected'));
        }

        // Check for Vite and install if needed
        let vite;
        try {
            spinner.text = chalk.cyan('Looking for Vite bundler...');
            vite = require('vite');
            spinner.succeed(chalk.green('Vite bundler found'));
        } catch (err) {
            spinner.warn(chalk.yellow('Vite not found. Installing...'));

            // Create a new spinner for the installation
            const installSpinner = ora({
                text: chalk.cyan('Installing Vite bundler...'),
                spinner: 'bouncingBar',
                color: 'yellow'
            }).start();

            try {
                require('child_process').execSync('npm install --save-dev vite@latest', { stdio: 'pipe' });
                installSpinner.succeed(chalk.green('Vite installed successfully'));

                // Clear require cache to ensure the newly installed module is loaded
                Object.keys(require.cache).forEach(key => {
                    if (key.includes('vite')) {
                        delete require.cache[key];
                    }
                });

                // Try to resolve the path to vite
                const vitePath = require.resolve('vite', { paths: [process.cwd()] });
                vite = require(vitePath);
            } catch (installErr) {
                installSpinner.fail(chalk.red('Failed to install Vite'));
                console.log('\n');
                console.log(boxen(
                    chalk.redBright('⚠️ Vite Installation Failed ⚠️') + '\n\n' +
                    chalk.white('Error details:') + '\n' +
                    chalk.red(installErr.message),
                    {
                        padding: 1,
                        margin: 1,
                        borderColor: 'red',
                        borderStyle: 'round'
                    }
                ));
                process.exit(1);
            }
        }

        // Restart the main spinner
        spinner.text = chalk.cyan('Setting up development server...');

        // Check for available port
        spinner.text = chalk.cyan('Finding available port...');
        const requestedPort = options.port || 3000;
        const port = await detectPort(requestedPort);

        if (port !== parseInt(requestedPort)) {
            spinner.info(chalk.yellow(`Port ${requestedPort} is in use, using port ${port} instead`));
        } else {
            spinner.succeed(chalk.green(`Port ${port} is available`));
        }

        // Check for project configuration
        spinner.text = chalk.cyan('Checking project configuration...');

        // Look for vite.config.js
        let viteConfigExists = fs.existsSync(path.join(projectRoot, 'vite.config.js'));
        if (!viteConfigExists) {
            spinner.info(chalk.yellow('No vite.config.js found, using default configuration'));
        } else {
            spinner.succeed(chalk.green('Found vite.config.js'));
        }

        // Start the server
        spinner.text = chalk.cyan('Starting development server...');

        // Create server with options
        const serverOptions = {
            root: process.cwd(),
            server: {
                port,
                host: options.host,
                https: options.https,
                open: options.open
            }
        };

        try {
            const server = await vite.createServer(serverOptions);
            await server.listen();

            // Get URLs
            const localUrl = `http${options.https ? 's' : ''}://localhost:${port}`;
            const networkUrls = Object.values(server.resolvedUrls?.network || []);

            // Stop spinner and show success message
            spinner.stop();

            // Display server info in a fancy box
            console.log('\n');
            console.log(boxen(
                gradient.rainbow('🚀 Development Server Running 🚀') + '\n\n' +
                chalk.white('Project: ') + chalk.green(packageJson.name || path.basename(projectRoot)) + '\n' +
                chalk.white('Version: ') + chalk.yellow(packageJson.version || 'N/A') + '\n\n' +
                chalk.white('Available on:') + '\n' +
                chalk.cyan('  ➜ Local:   ') + chalk.greenBright(localUrl) + '\n' +
                chalk.cyan('  ➜ Network: ') + chalk.greenBright(networkUrls[0] || 'unavailable') + '\n\n' +
                chalk.white('Press ') + chalk.cyan('Ctrl+C') + chalk.white(' to stop the server'),
                {
                    padding: 1,
                    margin: 1,
                    borderColor: 'green',
                    borderStyle: 'round'
                }
            ));

            // Add event listener for server close
            process.on('SIGINT', async () => {
                console.log('\n');
                const closeSpinner = ora({
                    text: chalk.cyan('Shutting down server...'),
                    spinner: 'dots',
                    color: 'cyan'
                }).start();

                try {
                    await server.close();
                    closeSpinner.succeed(chalk.green('Server stopped successfully'));
                } catch (err) {
                    closeSpinner.fail(chalk.red('Error shutting down server'));
                }

                process.exit(0);
            });

        } catch (serverErr) {
            spinner.fail(chalk.red('Failed to start development server'));
            console.log('\n');
            console.log(boxen(
                chalk.redBright('⚠️ Server Start Failed ⚠️') + '\n\n' +
                chalk.white('Error details:') + '\n' +
                chalk.red(serverErr.stack || serverErr.message),
                {
                    padding: 1,
                    margin: 1,
                    borderColor: 'red',
                    borderStyle: 'round'
                }
            ));
            process.exit(1);
        }
    } catch (err) {
        // Stop any running spinners
        spinner.fail(chalk.red('Development server initialization failed'));

        // Display error in a fancy box
        console.log('\n');
        console.log(boxen(
            chalk.redBright('⚠️ Server Error ⚠️') + '\n\n' +
            chalk.white('Error details:') + '\n' +
            chalk.red(err.stack || err.message),
            {
                padding: 1,
                margin: 1,
                borderColor: 'red',
                borderStyle: 'round'
            }
        ));

        // Provide some helpful tips
        console.log('\n');
        console.log(chalk.yellow('Troubleshooting tips:'));
        console.log(chalk.cyan('1.') + ' Check if you are in a valid KalxJS project directory');
        console.log(chalk.cyan('2.') + ' Ensure all dependencies are installed: ' + chalk.white('npm install'));
        console.log(chalk.cyan('3.') + ' Try specifying a different port: ' + chalk.white('kalxjs serve --port 4000'));
        console.log(chalk.cyan('4.') + ' Check for syntax errors in your code');
        console.log('\n');

        process.exit(1);
    }
}

module.exports = serve;