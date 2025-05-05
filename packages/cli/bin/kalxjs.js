#!/usr/bin/env node

const { program } = require('commander');
const { create, component, serve, build } = require('../src/commands');

// Initialize CLI
program
    .version(require('../package.json').version)
    .description('kalxjs CLI - A development toolkit for kalxjs framework');

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
    .description('Start development server')
    .option('-p, --port <port>', 'Port to serve on', '3000')
    .action((options) => serve(options));

// Build command
program
    .command('build')
    .description('Build for production')
    .action((options) => build(options));

program.parse(process.argv);