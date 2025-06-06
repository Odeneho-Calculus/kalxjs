#!/usr/bin/env node

const { program } = require('commander');
const { create, component, serve, build } = require('../src/commands');
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
    .action((name, options) => create(name, options));

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
    .action((name, options) => component(name, options));

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
    .action((options) => serve(options));

// Build command
program
    .command('build')
    .description('Build for production')
    .option('-v, --verbose', 'Enable verbose output')
    .option('-m, --mode <mode>', 'Build mode (development/production)', 'production')
    .option('-o, --output <dir>', 'Output directory', 'dist')
    .option('--no-minify', 'Disable minification')
    .option('--analyze', 'Analyze bundle size')
    .action((options) => build(options));

program.parse(process.argv);