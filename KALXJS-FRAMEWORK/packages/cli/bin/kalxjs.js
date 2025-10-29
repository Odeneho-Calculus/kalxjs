#!/usr/bin/env node

const { program } = require('commander');
const { create, component, serve, build, generate } = require('../src/commands');
const path = require('path');
const fs = require('fs');

// Get the correct version from the CLI's own package.json
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Initialize CLI
program
    .version(packageJson.version, '-V, --version', 'Output the version number')
    .description('kalxjs CLI - A development toolkit for kalxjs framework');

// Add support for lowercase -v flag
program
    .option('-v', 'Output the version number (alias for -V)', () => {
        console.log(packageJson.version);
        process.exit(0);
    });

// Add explicit version command
program
    .command('version')
    .description('Display CLI version')
    .action(() => {
        console.log(`KalxJS CLI version: ${packageJson.version}`);
    });

// Create new project
program
    .command('create <project-name>')
    .description('Create a new kalxjs project')
    .option('--router', 'Add router support')
    .option('--state', 'Add state management')
    .option('--scss', 'Add SCSS support')
    .option('--testing', 'Add testing setup')
    .option('--linting', 'Add ESLint setup')
    .option('--skip-install', 'Skip installing dependencies')
    .option('--skip-prompts', 'Skip feature selection prompts')
    .option('--cwd <directory>', 'Working directory for project creation')
    .action(async (name, options) => {
        try {
            await create(name, options);
        } catch (err) {
            console.error('Error:', err.message);
            process.exit(1);
        }
    });

// Generate component
program
    .command('component <name>')
    .alias('c')
    .description('Generate a new component')
    .option('-d, --dir <directory>', 'Target directory for the component')
    .option('-s, --style [type]', 'Add stylesheet (css/scss)')
    .option('-t, --test', 'Add test file')
    .option('-p, --props', 'Add props')
    .option('--state', 'Add state')
    .option('--methods', 'Add methods')
    .option('--lifecycle', 'Add lifecycle hooks')
    .action(async (name, options) => {
        try {
            await component(name, options);
        } catch (err) {
            console.error('Error:', err.message);
            process.exit(1);
        }
    });

// Generate command for multiple artifact types
program
    .command('generate <type> <name>')
    .alias('g')
    .description('Generate code artifacts (components, pages, stores, routes)')
    .option('-d, --dir <directory>', 'Target directory')
    .option('--composition', 'Use composition API (for components)')
    .option('-s, --style [type]', 'Add stylesheet (css/scss)')
    .option('-t, --test', 'Add test file')
    .action(async (type, name, options) => {
        try {
            await generate(type, name, options);
        } catch (err) {
            console.error('Error:', err.message);
            process.exit(1);
        }
    });

// Serve command
program
    .command('serve')
    .alias('dev')
    .description('Start development server')
    .option('-p, --port <port>', 'Port to serve on', '3000')
    .option('-h, --host [host]', 'Host to serve on (use --no-host to disable)', true)
    .option('-o, --open', 'Open browser automatically', false)
    .option('-s, --https', 'Use HTTPS protocol', false)
    .option('-m, --mode <mode>', 'Server mode (development/production)', 'development')
    .action(async (options) => {
        try {
            await serve(options);
        } catch (err) {
            console.error('Error:', err.message);
            process.exit(1);
        }
    });

// Build command
program
    .command('build')
    .description('Build for production')
    .option('-v, --verbose', 'Enable verbose output')
    .option('-m, --mode <mode>', 'Build mode (development/production)', 'production')
    .option('-o, --output <dir>', 'Output directory', 'dist')
    .option('--no-minify', 'Disable minification')
    .option('--analyze', 'Analyze bundle size')
    .action(async (options) => {
        try {
            await build(options);
        } catch (err) {
            console.error('Error:', err.message);
            process.exit(1);
        }
    });

program.parse(process.argv);