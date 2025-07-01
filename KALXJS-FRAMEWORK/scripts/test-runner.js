#!/usr/bin/env node

/**
 * KalxJS Local Testing Orchestrator
 *
 * This script orchestrates local testing of the KalxJS framework by:
 * - Starting development servers for test applications
 * - Monitoring file changes and triggering rebuilds
 * - Running automated tests
 * - Providing real-time feedback on framework changes
 *
 * Features:
 * - Multi-application test server management
 * - Hot reload monitoring
 * - Automated test execution
 * - Performance monitoring
 * - Error tracking and reporting
 */

import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

class TestRunner {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.testDir = path.join(this.rootDir, 'local-test');
        this.logFile = path.join(this.rootDir, 'test-runner.log');

        this.testApps = [
            { name: 'basic-test', port: 3001, description: 'Basic KalxJS functionality' },
            { name: 'sfc-test', port: 3002, description: 'Single File Components' },
            { name: 'router-test', port: 3003, description: 'Router functionality' },
            { name: 'performance-test', port: 3004, description: 'Performance testing' }
        ];

        this.processes = new Map();
        this.watchers = new Map();
        this.testResults = new Map();
        this.isRunning = false;

        this.isWindows = process.platform === 'win32';
        this.npmCmd = this.isWindows ? 'npm.cmd' : 'npm';

        this.setupLogging();
        this.setupSignalHandlers();
    }

    /**
     * Setup logging system
     */
    setupLogging() {
        this.log = (message, level = 'INFO', app = 'RUNNER') => {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${level}] [${app}] ${message}`;

            console.log(logMessage);

            try {
                fs.appendFileSync(this.logFile, logMessage + '\n');
            } catch (error) {
                console.error('Failed to write to log file:', error.message);
            }
        };

        // Clear previous log
        try {
            fs.writeFileSync(this.logFile, '');
        } catch (error) {
            console.warn('Could not clear log file:', error.message);
        }
    }

    /**
     * Setup signal handlers for graceful shutdown
     */
    setupSignalHandlers() {
        const shutdown = (signal) => {
            this.log(`Received ${signal}, shutting down gracefully...`);
            this.stop().then(() => {
                process.exit(0);
            });
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.log(`Uncaught exception: ${error.message}`, 'ERROR');
            this.log(`Stack trace: ${error.stack}`, 'ERROR');
            this.stop().then(() => {
                process.exit(1);
            });
        });
    }

    /**
     * Start the test runner
     */
    async start(options = {}) {
        const {
            apps = this.testApps.map(app => app.name),
            watch = true,
            runTests = true,
            monitor = true
        } = options;

        try {
            this.log('🚀 Starting KalxJS Test Runner');
            this.isRunning = true;

            // Step 1: Validate environment
            await this.validateEnvironment();

            // Step 2: Start test applications
            await this.startTestApplications(apps);

            // Step 3: Setup file watching (if enabled)
            if (watch) {
                await this.setupFileWatching();
            }

            // Step 4: Run initial tests (if enabled)
            if (runTests) {
                await this.runTests();
            }

            // Step 5: Start monitoring (if enabled)
            if (monitor) {
                await this.startMonitoring();
            }

            this.log('✅ Test runner started successfully!');
            this.printStatus();

            // Keep the process running
            await this.keepAlive();

        } catch (error) {
            this.log(`❌ Test runner failed to start: ${error.message}`, 'ERROR');
            this.log(`Stack trace: ${error.stack}`, 'ERROR');
            await this.stop();
            process.exit(1);
        }
    }

    /**
     * Stop the test runner
     */
    async stop() {
        if (!this.isRunning) return;

        this.log('🛑 Stopping test runner...');
        this.isRunning = false;

        // Stop all processes
        for (const [appName, process] of this.processes) {
            this.log(`Stopping ${appName}...`);
            try {
                process.kill('SIGTERM');

                // Wait a bit for graceful shutdown
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Force kill if still running
                if (!process.killed) {
                    process.kill('SIGKILL');
                }
            } catch (error) {
                this.log(`Warning: Could not stop ${appName}: ${error.message}`, 'WARN');
            }
        }

        // Stop file watchers
        for (const [path, watcher] of this.watchers) {
            try {
                watcher.close();
            } catch (error) {
                this.log(`Warning: Could not stop watcher for ${path}: ${error.message}`, 'WARN');
            }
        }

        this.processes.clear();
        this.watchers.clear();

        this.log('✅ Test runner stopped');
    }

    /**
     * Validate environment
     */
    async validateEnvironment() {
        this.log('🔍 Validating environment...');

        // Check if test directory exists
        if (!fs.existsSync(this.testDir)) {
            throw new Error('Test directory not found. Run setup-local-test.js first.');
        }

        // Check if test applications exist
        for (const app of this.testApps) {
            const appDir = path.join(this.testDir, app.name);
            if (!fs.existsSync(appDir)) {
                throw new Error(`Test application ${app.name} not found in ${appDir}`);
            }

            const packageJsonPath = path.join(appDir, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                throw new Error(`package.json not found for ${app.name}`);
            }
        }

        // Check Node.js and npm
        const nodeVersion = process.version;
        this.log(`✓ Node.js version: ${nodeVersion}`);

        try {
            const npmVersion = execSync(`${this.npmCmd} --version`, { encoding: 'utf8' }).trim();
            this.log(`✓ npm version: ${npmVersion}`);
        } catch (error) {
            throw new Error('npm not found in PATH');
        }

        this.log('✓ Environment validation passed');
    }

    /**
     * Start test applications
     */
    async startTestApplications(appNames) {
        this.log('📱 Starting test applications...');

        const appsToStart = this.testApps.filter(app => appNames.includes(app.name));

        for (const app of appsToStart) {
            await this.startApplication(app);
        }

        // Wait for applications to start
        await this.waitForApplications(appsToStart);

        this.log(`✅ Started ${appsToStart.length} test applications`);
    }

    /**
     * Start a single application
     */
    async startApplication(app) {
        const appDir = path.join(this.testDir, app.name);

        this.log(`Starting ${app.name} on port ${app.port}...`, 'INFO', app.name);

        try {
            const process = spawn(this.npmCmd, ['run', 'dev'], {
                cwd: appDir,
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true,
                env: {
                    ...process.env,
                    PORT: app.port.toString()
                }
            });

            // Handle process output
            process.stdout.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    this.log(output, 'INFO', app.name);
                }
            });

            process.stderr.on('data', (data) => {
                const output = data.toString().trim();
                if (output && !output.includes('Warning:')) {
                    this.log(output, 'ERROR', app.name);
                }
            });

            process.on('close', (code) => {
                this.log(`Process exited with code ${code}`, code === 0 ? 'INFO' : 'ERROR', app.name);
                this.processes.delete(app.name);
            });

            process.on('error', (error) => {
                this.log(`Process error: ${error.message}`, 'ERROR', app.name);
                this.processes.delete(app.name);
            });

            this.processes.set(app.name, process);

        } catch (error) {
            throw new Error(`Failed to start ${app.name}: ${error.message}`);
        }
    }

    /**
     * Wait for applications to be ready
     */
    async waitForApplications(apps) {
        this.log('⏳ Waiting for applications to be ready...');

        const maxWaitTime = 60000; // 60 seconds
        const checkInterval = 2000; // 2 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            let allReady = true;

            for (const app of apps) {
                if (!await this.isApplicationReady(app)) {
                    allReady = false;
                    break;
                }
            }

            if (allReady) {
                this.log('✅ All applications are ready');
                return;
            }

            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        throw new Error('Timeout waiting for applications to be ready');
    }

    /**
     * Check if application is ready
     */
    async isApplicationReady(app) {
        try {
            const response = await fetch(`http://localhost:${app.port}`, {
                method: 'HEAD',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Setup file watching for hot reload
     */
    async setupFileWatching() {
        this.log('👀 Setting up file watching...');

        const watchPaths = [
            path.join(this.rootDir, 'packages'),
            path.join(this.rootDir, 'src')
        ];

        for (const watchPath of watchPaths) {
            if (fs.existsSync(watchPath)) {
                await this.watchDirectory(watchPath);
            }
        }

        this.log(`✅ Watching ${this.watchers.size} directories for changes`);
    }

    /**
     * Watch a directory for changes
     */
    async watchDirectory(dirPath) {
        try {
            const { watch } = await import('chokidar');

            const watcher = watch(dirPath, {
                ignored: [
                    '**/node_modules/**',
                    '**/dist/**',
                    '**/build/**',
                    '**/.git/**',
                    '**/coverage/**'
                ],
                persistent: true,
                ignoreInitial: true
            });

            watcher.on('change', (filePath) => {
                this.handleFileChange(filePath, 'change');
            });

            watcher.on('add', (filePath) => {
                this.handleFileChange(filePath, 'add');
            });

            watcher.on('unlink', (filePath) => {
                this.handleFileChange(filePath, 'delete');
            });

            watcher.on('error', (error) => {
                this.log(`Watcher error for ${dirPath}: ${error.message}`, 'ERROR');
            });

            this.watchers.set(dirPath, watcher);

        } catch (error) {
            this.log(`Could not setup watcher for ${dirPath}: ${error.message}`, 'WARN');
        }
    }

    /**
     * Handle file changes
     */
    handleFileChange(filePath, changeType) {
        const relativePath = path.relative(this.rootDir, filePath);
        this.log(`File ${changeType}: ${relativePath}`, 'INFO', 'WATCHER');

        // Determine if rebuild is needed
        if (this.shouldTriggerRebuild(filePath)) {
            this.triggerRebuild(filePath);
        }

        // Determine if tests should be re-run
        if (this.shouldRunTests(filePath)) {
            this.runTests();
        }
    }

    /**
     * Check if file change should trigger rebuild
     */
    shouldTriggerRebuild(filePath) {
        const ext = path.extname(filePath);
        const codeExtensions = ['.js', '.mjs', '.ts', '.jsx', '.tsx', '.kal'];

        return codeExtensions.includes(ext) &&
               filePath.includes('packages') &&
               !filePath.includes('test');
    }

    /**
     * Check if file change should trigger test run
     */
    shouldRunTests(filePath) {
        return filePath.includes('test') ||
               filePath.includes('spec') ||
               this.shouldTriggerRebuild(filePath);
    }

    /**
     * Trigger rebuild of packages
     */
    async triggerRebuild(changedFile) {
        this.log(`🔨 Triggering rebuild due to change in ${path.relative(this.rootDir, changedFile)}`, 'INFO', 'REBUILD');

        try {
            // Determine which package was changed
            const packageName = this.getPackageFromPath(changedFile);

            if (packageName) {
                await this.rebuildPackage(packageName);
            } else {
                // Rebuild all packages if we can't determine specific package
                await this.rebuildAllPackages();
            }

        } catch (error) {
            this.log(`Rebuild failed: ${error.message}`, 'ERROR', 'REBUILD');
        }
    }

    /**
     * Get package name from file path
     */
    getPackageFromPath(filePath) {
        const packagesDir = path.join(this.rootDir, 'packages');
        const relativePath = path.relative(packagesDir, filePath);

        if (relativePath.startsWith('..')) {
            return null; // File is not in packages directory
        }

        const pathParts = relativePath.split(path.sep);
        return pathParts[0];
    }

    /**
     * Rebuild a specific package
     */
    async rebuildPackage(packageName) {
        const packageDir = path.join(this.rootDir, 'packages', packageName);

        if (!fs.existsSync(packageDir)) {
            this.log(`Package directory not found: ${packageDir}`, 'WARN', 'REBUILD');
            return;
        }

        this.log(`Rebuilding package: ${packageName}`, 'INFO', 'REBUILD');

        try {
            // Check if package has build script
            const packageJsonPath = path.join(packageDir, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

            if (packageJson.scripts && packageJson.scripts.build) {
                execSync(`${this.npmCmd} run build`, {
                    cwd: packageDir,
                    stdio: 'pipe'
                });

                this.log(`✅ Rebuilt package: ${packageName}`, 'INFO', 'REBUILD');
            } else {
                this.log(`No build script for package: ${packageName}`, 'INFO', 'REBUILD');
            }

        } catch (error) {
            this.log(`Failed to rebuild package ${packageName}: ${error.message}`, 'ERROR', 'REBUILD');
        }
    }

    /**
     * Rebuild all packages
     */
    async rebuildAllPackages() {
        this.log('Rebuilding all packages...', 'INFO', 'REBUILD');

        try {
            execSync(`${this.npmCmd} run build`, {
                cwd: this.rootDir,
                stdio: 'pipe'
            });

            this.log('✅ Rebuilt all packages', 'INFO', 'REBUILD');
        } catch (error) {
            this.log(`Failed to rebuild all packages: ${error.message}`, 'ERROR', 'REBUILD');
        }
    }

    /**
     * Run tests
     */
    async runTests() {
        this.log('🧪 Running tests...', 'INFO', 'TEST');

        try {
            const testOutput = execSync(`${this.npmCmd} test`, {
                cwd: this.rootDir,
                encoding: 'utf8',
                stdio: 'pipe'
            });

            this.log('✅ Tests passed', 'INFO', 'TEST');
            this.testResults.set('last_run', {
                status: 'passed',
                timestamp: new Date().toISOString(),
                output: testOutput
            });

        } catch (error) {
            this.log(`❌ Tests failed: ${error.message}`, 'ERROR', 'TEST');
            this.testResults.set('last_run', {
                status: 'failed',
                timestamp: new Date().toISOString(),
                error: error.message,
                output: error.stdout || ''
            });
        }
    }

    /**
     * Start monitoring
     */
    async startMonitoring() {
        this.log('📊 Starting monitoring...', 'INFO', 'MONITOR');

        // Monitor application health
        setInterval(() => {
            this.checkApplicationHealth();
        }, 30000); // Check every 30 seconds

        // Monitor system resources
        setInterval(() => {
            this.checkSystemResources();
        }, 60000); // Check every minute

        this.log('✅ Monitoring started', 'INFO', 'MONITOR');
    }

    /**
     * Check application health
     */
    async checkApplicationHealth() {
        for (const app of this.testApps) {
            if (this.processes.has(app.name)) {
                const isReady = await this.isApplicationReady(app);
                if (!isReady) {
                    this.log(`⚠️ Application ${app.name} is not responding`, 'WARN', 'MONITOR');
                }
            }
        }
    }

    /**
     * Check system resources
     */
    checkSystemResources() {
        const memUsage = process.memoryUsage();
        const memUsageMB = Math.round(memUsage.rss / 1024 / 1024);

        this.log(`Memory usage: ${memUsageMB} MB`, 'INFO', 'MONITOR');

        if (memUsageMB > 1000) { // More than 1GB
            this.log(`⚠️ High memory usage detected: ${memUsageMB} MB`, 'WARN', 'MONITOR');
        }
    }

    /**
     * Print current status
     */
    printStatus() {
        console.log('\n' + '='.repeat(60));
        console.log('🎯 KALXJS TEST RUNNER STATUS');
        console.log('='.repeat(60));

        console.log('\n📱 Test Applications:');
        for (const app of this.testApps) {
            const status = this.processes.has(app.name) ? '🟢 RUNNING' : '🔴 STOPPED';
            console.log(`  ${status} ${app.name} - ${app.description}`);
            console.log(`    URL: http://localhost:${app.port}`);
        }

        console.log('\n👀 File Watching:');
        console.log(`  Watching ${this.watchers.size} directories for changes`);

        console.log('\n🧪 Test Results:');
        const lastTest = this.testResults.get('last_run');
        if (lastTest) {
            const status = lastTest.status === 'passed' ? '✅ PASSED' : '❌ FAILED';
            console.log(`  Last run: ${status} at ${lastTest.timestamp}`);
        } else {
            console.log('  No tests run yet');
        }

        console.log('\n📊 Monitoring:');
        console.log('  Application health checks: Every 30 seconds');
        console.log('  System resource checks: Every minute');

        console.log('\n🔧 Controls:');
        console.log('  Press Ctrl+C to stop all applications');
        console.log('  Check logs in: ' + this.logFile);

        console.log('\n' + '='.repeat(60));
    }

    /**
     * Keep the process alive
     */
    async keepAlive() {
        return new Promise((resolve) => {
            // The process will be kept alive by the event loop
            // until it's explicitly stopped
        });
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);

    const options = {
        apps: args.includes('--apps') ?
            args[args.indexOf('--apps') + 1]?.split(',') || [] :
            undefined,
        watch: !args.includes('--no-watch'),
        runTests: !args.includes('--no-tests'),
        monitor: !args.includes('--no-monitor')
    };

    console.log('🧪 KalxJS Test Runner');
    console.log('Options:', options);

    const runner = new TestRunner();
    runner.start(options).catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

export { TestRunner };