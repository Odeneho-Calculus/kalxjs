#!/usr/bin/env node

/**
 * KalxJS Development Tools - Main Control Script
 *
 * This is the main entry point for all KalxJS development tools.
 * It provides a unified interface for:
 * - Local testing environment setup
 * - Unused file cleanup
 * - Test runner orchestration
 * - Dependency analysis
 * - Development workflow management
 *
 * Usage:
 *   node scripts/dev-tools.js <command> [options]
 *
 * Commands:
 *   setup     - Setup local testing environment
 *   cleanup   - Clean unused files
 *   test      - Run test orchestrator
 *   analyze   - Analyze dependencies
 *   status    - Show development environment status
 *   help      - Show help information
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LocalTestSetup } from './setup-local-test.js';
import { UnusedFileDetector } from './cleanup-unused.js';
import { TestRunner } from './test-runner.js';
import { DependencyAnalyzer } from './dependency-analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DevTools {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.commands = {
            setup: this.setupCommand.bind(this),
            cleanup: this.cleanupCommand.bind(this),
            test: this.testCommand.bind(this),
            analyze: this.analyzeCommand.bind(this),
            status: this.statusCommand.bind(this),
            help: this.helpCommand.bind(this)
        };
    }

    /**
     * Main entry point
     */
    async run(args) {
        const command = args[0];
        const options = this.parseOptions(args.slice(1));

        if (!command || command === 'help') {
            this.helpCommand();
            return;
        }

        if (!this.commands[command]) {
            console.error(`❌ Unknown command: ${command}`);
            console.log('Run "node scripts/dev-tools.js help" for available commands');
            process.exit(1);
        }

        try {
            await this.commands[command](options);
        } catch (error) {
            console.error(`❌ Command failed: ${error.message}`);
            if (options.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    /**
     * Parse command line options
     */
    parseOptions(args) {
        const options = {
            verbose: false,
            dryRun: false,
            interactive: true,
            force: false
        };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];

            switch (arg) {
                case '--verbose':
                case '-v':
                    options.verbose = true;
                    break;
                case '--dry-run':
                    options.dryRun = true;
                    break;
                case '--no-interactive':
                    options.interactive = false;
                    break;
                case '--force':
                    options.force = true;
                    break;
                case '--help':
                case '-h':
                    options.help = true;
                    break;
                default:
                    // Handle key=value options
                    if (arg.includes('=')) {
                        const [key, value] = arg.split('=', 2);
                        const cleanKey = key.replace(/^--/, '');
                        options[cleanKey] = value;
                    } else if (arg.startsWith('--')) {
                        const cleanKey = arg.replace(/^--/, '');
                        options[cleanKey] = true;
                    }
                    break;
            }
        }

        return options;
    }

    /**
     * Setup command - Initialize local testing environment
     */
    async setupCommand(options) {
        console.log('🚀 Setting up KalxJS local testing environment...');

        if (options.help) {
            console.log(`
Setup Command - Initialize local testing environment

Usage: node scripts/dev-tools.js setup [options]

Options:
  --force              Force setup even if environment exists
  --no-interactive     Skip interactive prompts
  --verbose           Show detailed output

Description:
  Sets up a complete local testing environment for KalxJS development.
  This includes:
  - Cleaning previous installations
  - Building and linking packages
  - Creating test applications
  - Setting up development servers
            `);
            return;
        }

        const setup = new LocalTestSetup();
        await setup.setup();
    }

    /**
     * Cleanup command - Remove unused files
     */
    async cleanupCommand(options) {
        console.log('🧹 Starting KalxJS unused file cleanup...');

        if (options.help) {
            console.log(`
Cleanup Command - Remove unused files

Usage: node scripts/dev-tools.js cleanup [options]

Options:
  --dry-run           Show what would be deleted without actually deleting
  --no-interactive    Skip interactive file review
  --no-backup         Skip creating backup before deletion
  --verbose           Show detailed analysis output

Description:
  Intelligently detects and removes unused files from the codebase.
  Features:
  - Static code analysis for import detection
  - Asset reference checking
  - Safe cleanup with backup and rollback
  - Interactive review of files to be deleted
            `);
            return;
        }

        const detector = new UnusedFileDetector();
        await detector.cleanup({
            dryRun: options.dryRun,
            interactive: options.interactive,
            backup: !options['no-backup'],
            verbose: options.verbose
        });
    }

    /**
     * Test command - Run test orchestrator
     */
    async testCommand(options) {
        console.log('🧪 Starting KalxJS test runner...');

        if (options.help) {
            console.log(`
Test Command - Run test orchestrator

Usage: node scripts/dev-tools.js test [options]

Options:
  --apps=app1,app2    Specify which test apps to run (default: all)
  --no-watch          Disable file watching
  --no-tests          Skip running automated tests
  --no-monitor        Disable performance monitoring
  --verbose           Show detailed output

Description:
  Orchestrates local testing by:
  - Starting development servers for test applications
  - Monitoring file changes and triggering rebuilds
  - Running automated tests
  - Providing real-time feedback
            `);
            return;
        }

        const runner = new TestRunner();
        await runner.start({
            apps: options.apps ? options.apps.split(',') : undefined,
            watch: !options['no-watch'],
            runTests: !options['no-tests'],
            monitor: !options['no-monitor']
        });
    }

    /**
     * Analyze command - Dependency analysis
     */
    async analyzeCommand(options) {
        console.log('🔍 Starting KalxJS dependency analysis...');

        if (options.help) {
            console.log(`
Analyze Command - Dependency analysis

Usage: node scripts/dev-tools.js analyze [options]

Options:
  --include-tests     Include test files in analysis
  --no-graphs         Skip generating dependency graphs
  --no-circular       Skip circular dependency detection
  --no-dead-code      Skip dead code analysis
  --no-bundles        Skip bundle impact analysis
  --format=json       Output format (json, html)
  --verbose           Show detailed analysis output

Description:
  Provides comprehensive dependency analysis including:
  - File relationship mapping
  - Circular dependency detection
  - Unused export identification
  - Dead code detection
  - Bundle impact analysis
            `);
            return;
        }

        const analyzer = new DependencyAnalyzer();
        await analyzer.analyze({
            includeTests: options['include-tests'],
            generateGraphs: !options['no-graphs'],
            checkCircular: !options['no-circular'],
            findDeadCode: !options['no-dead-code'],
            analyzeBundles: !options['no-bundles'],
            outputFormat: options.format || 'json'
        });
    }

    /**
     * Status command - Show development environment status
     */
    async statusCommand(options) {
        console.log('📊 KalxJS Development Environment Status');

        if (options.help) {
            console.log(`
Status Command - Show development environment status

Usage: node scripts/dev-tools.js status [options]

Options:
  --verbose           Show detailed status information

Description:
  Shows the current status of the development environment including:
  - Local test setup status
  - Running processes
  - Package linking status
  - Recent logs and errors
            `);
            return;
        }

        await this.checkEnvironmentStatus(options.verbose);
    }

    /**
     * Help command - Show help information
     */
    helpCommand() {
        console.log(`
🛠️  KalxJS Development Tools

A comprehensive suite of tools for KalxJS framework development.

Usage: node scripts/dev-tools.js <command> [options]

Commands:
  setup     Setup local testing environment
  cleanup   Clean unused files from codebase
  test      Run test orchestrator with hot reload
  analyze   Analyze dependencies and code quality
  status    Show development environment status
  help      Show this help message

Global Options:
  --verbose, -v       Show detailed output
  --help, -h          Show command-specific help

Examples:
  # Setup local testing environment
  node scripts/dev-tools.js setup

  # Clean unused files (dry run)
  node scripts/dev-tools.js cleanup --dry-run

  # Start test runner for specific apps
  node scripts/dev-tools.js test --apps=basic-test,sfc-test

  # Analyze dependencies with graphs
  node scripts/dev-tools.js analyze --include-tests

  # Check environment status
  node scripts/dev-tools.js status --verbose

For more information on a specific command:
  node scripts/dev-tools.js <command> --help

Documentation: https://github.com/Odeneho-Calculus/kalxjs-framework
        `);
    }

    /**
     * Check environment status
     */
    async checkEnvironmentStatus(verbose = false) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 KALXJS DEVELOPMENT ENVIRONMENT STATUS');
        console.log('='.repeat(60));

        // Check Node.js and npm
        console.log('\n🔧 System Requirements:');
        console.log(`  Node.js: ${process.version}`);

        try {
            const { execSync } = await import('child_process');
            const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
            console.log(`  npm: ${npmVersion}`);
        } catch (error) {
            console.log('  npm: ❌ Not found');
        }

        // Check project structure
        console.log('\n📂 Project Structure:');
        const checkPath = (name, path) => {
            const exists = fs.existsSync(path);
            console.log(`  ${exists ? '✅' : '❌'} ${name}: ${exists ? 'Found' : 'Missing'}`);
            return exists;
        };

        checkPath('Root package.json', path.join(this.rootDir, 'package.json'));
        checkPath('Packages directory', path.join(this.rootDir, 'packages'));
        checkPath('Scripts directory', path.join(this.rootDir, 'scripts'));
        const hasLocalTest = checkPath('Local test directory', path.join(this.rootDir, 'local-test'));

        // Check packages
        console.log('\n📦 Packages:');
        const packagesDir = path.join(this.rootDir, 'packages');
        if (fs.existsSync(packagesDir)) {
            const packages = fs.readdirSync(packagesDir, { withFileTypes: true })
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name);

            packages.forEach(pkg => {
                const packagePath = path.join(packagesDir, pkg);
                const hasPackageJson = fs.existsSync(path.join(packagePath, 'package.json'));
                console.log(`  ${hasPackageJson ? '✅' : '❌'} ${pkg}`);
            });

            console.log(`  Total: ${packages.length} packages`);
        } else {
            console.log('  ❌ Packages directory not found');
        }

        // Check local test setup
        console.log('\n🧪 Local Test Environment:');
        if (hasLocalTest) {
            const testDir = path.join(this.rootDir, 'local-test');
            const testApps = ['basic-test', 'sfc-test', 'router-test', 'performance-test'];

            testApps.forEach(app => {
                const appPath = path.join(testDir, app);
                const exists = fs.existsSync(appPath);
                console.log(`  ${exists ? '✅' : '❌'} ${app}: ${exists ? 'Ready' : 'Missing'}`);
            });

            // Check if any test servers are running
            console.log('\n🚀 Running Processes:');
            await this.checkRunningProcesses();
        } else {
            console.log('  ❌ Local test environment not set up');
            console.log('  💡 Run: node scripts/dev-tools.js setup');
        }

        // Check recent logs
        console.log('\n📝 Recent Activity:');
        await this.checkRecentLogs(verbose);

        console.log('\n' + '='.repeat(60));
    }

    /**
     * Check for running processes
     */
    async checkRunningProcesses() {
        const ports = [3001, 3002, 3003, 3004];
        const appNames = ['basic-test', 'sfc-test', 'router-test', 'performance-test'];

        for (let i = 0; i < ports.length; i++) {
            const port = ports[i];
            const appName = appNames[i];

            try {
                const response = await fetch(`http://localhost:${port}`, {
                    method: 'HEAD',
                    timeout: 2000
                });

                if (response.ok) {
                    console.log(`  🟢 ${appName} running on port ${port}`);
                } else {
                    console.log(`  🔴 ${appName} not responding on port ${port}`);
                }
            } catch (error) {
                console.log(`  🔴 ${appName} not running on port ${port}`);
            }
        }
    }

    /**
     * Check recent logs
     */
    async checkRecentLogs(verbose) {
        const logFiles = [
            'local-test-setup.log',
            'cleanup-unused.log',
            'test-runner.log',
            'dependency-analysis.log'
        ];

        for (const logFile of logFiles) {
            const logPath = path.join(this.rootDir, logFile);

            if (fs.existsSync(logPath)) {
                try {
                    const stats = fs.statSync(logPath);
                    const age = Date.now() - stats.mtime.getTime();
                    const ageHours = Math.floor(age / (1000 * 60 * 60));

                    console.log(`  📄 ${logFile}: ${ageHours}h ago (${(stats.size / 1024).toFixed(1)} KB)`);

                    if (verbose) {
                        // Show last few lines
                        const content = fs.readFileSync(logPath, 'utf8');
                        const lines = content.split('\n').filter(line => line.trim());
                        const lastLines = lines.slice(-3);

                        lastLines.forEach(line => {
                            console.log(`    ${line}`);
                        });
                    }
                } catch (error) {
                    console.log(`  📄 ${logFile}: Error reading file`);
                }
            }
        }
    }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const devTools = new DevTools();
    const args = process.argv.slice(2);

    devTools.run(args).catch(error => {
        console.error('Dev tools failed:', error);
        process.exit(1);
    });
}

export { DevTools };