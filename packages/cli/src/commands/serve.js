const path = require('path');
const chalk = require('chalk');
const detectPort = require('detect-port');
const ora = require('ora');

async function serve(options = {}) {
    const spinner = ora('Starting development server...').start();

    try {
        // Check if we're in a kalxjs project directory
        let vite;
        try {
            vite = require('vite');
        } catch (err) {
            spinner.fail('Vite not found. Installing...');
            require('child_process').execSync('npm install --save-dev vite@latest', { stdio: 'inherit' });
            vite = require('vite');
        }

        const requestedPort = options.port || 3000;
        const port = await detectPort(requestedPort);

        if (port !== requestedPort) {
            spinner.info(`Port ${requestedPort} is in use, using port ${port} instead`);
        }

        const server = await vite.createServer({
            root: process.cwd(),
            server: {
                port,
                host: true
            }
        });

        await server.listen();

        const localUrl = `http://localhost:${port}`;
        const networkUrls = Object.values(server.resolvedUrls?.network || []);

        spinner.succeed(
            `Development server running at:\n` +
            `  > Local: ${chalk.cyan(localUrl)}\n` +
            `  > Network: ${chalk.cyan(networkUrls[0] || 'unavailable')}`
        );

    } catch (err) {
        spinner.fail('Failed to start development server');
        console.error(chalk.red(err.stack || err.message));
        process.exit(1);
    }
}

module.exports = serve;