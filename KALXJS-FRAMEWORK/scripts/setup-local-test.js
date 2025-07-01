#!/usr/bin/env node

/**
 * KalxJS Local Testing Setup Script
 *
 * This script creates a safe, isolated local testing environment for KalxJS development
 * without interfering with npm published packages or user installations.
 *
 * Features:
 * - Clean previous local installations
 * - Link current local codebase
 * - Create test applications
 * - Handle dependencies correctly
 * - Cross-platform compatibility
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

class LocalTestSetup {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.packagesDir = path.join(this.rootDir, 'packages');
        this.testDir = path.join(this.rootDir, 'local-test');
        this.backupDir = path.join(this.rootDir, '.local-test-backup');
        this.logFile = path.join(this.rootDir, 'local-test-setup.log');

        this.packages = [
            'core',
            'router',
            'store',
            'cli',
            'devtools',
            'compiler',
            'build-tools',
            'types',
            'utils',
            'performance'
        ];

        this.isWindows = process.platform === 'win32';
        this.npmCmd = this.isWindows ? 'npm.cmd' : 'npm';

        this.setupLogging();
    }

    /**
     * Setup logging system
     */
    setupLogging() {
        this.log = (message, level = 'INFO') => {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${level}] ${message}`;

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
     * Main setup process
     */
    async setup() {
        try {
            this.log('🚀 Starting KalxJS Local Test Setup');

            // Step 1: Validate environment
            await this.validateEnvironment();

            // Step 2: Create backup
            await this.createBackup();

            // Step 3: Clean previous installations
            await this.cleanPreviousInstallations();

            // Step 4: Build packages
            await this.buildPackages();

            // Step 5: Link packages locally
            await this.linkPackages();

            // Step 6: Create test applications
            await this.createTestApplications();

            // Step 7: Setup development environment
            await this.setupDevelopmentEnvironment();

            // Step 8: Verify installation
            await this.verifyInstallation();

            this.log('✅ Local test setup completed successfully!');
            this.printUsageInstructions();

        } catch (error) {
            this.log(`❌ Setup failed: ${error.message}`, 'ERROR');
            this.log(`Stack trace: ${error.stack}`, 'ERROR');

            // Attempt rollback
            await this.rollback();
            process.exit(1);
        }
    }

    /**
     * Validate environment and dependencies
     */
    async validateEnvironment() {
        this.log('🔍 Validating environment...');

        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

        if (majorVersion < 16) {
            throw new Error(`Node.js 16+ required, found ${nodeVersion}`);
        }

        this.log(`✓ Node.js version: ${nodeVersion}`);

        // Check npm availability
        try {
            const npmVersion = execSync(`${this.npmCmd} --version`, { encoding: 'utf8' }).trim();
            this.log(`✓ npm version: ${npmVersion}`);
        } catch (error) {
            throw new Error('npm not found in PATH');
        }

        // Check if we're in the correct directory
        if (!fs.existsSync(path.join(this.rootDir, 'package.json'))) {
            throw new Error('Not in KalxJS framework root directory');
        }

        // Check packages directory
        if (!fs.existsSync(this.packagesDir)) {
            throw new Error('Packages directory not found');
        }

        this.log('✓ Environment validation passed');
    }

    /**
     * Create backup of current state
     */
    async createBackup() {
        this.log('💾 Creating backup...');

        try {
            // Remove old backup
            if (fs.existsSync(this.backupDir)) {
                fs.rmSync(this.backupDir, { recursive: true, force: true });
            }

            // Create backup directory
            fs.mkdirSync(this.backupDir, { recursive: true });

            // Backup package.json files
            const backupPackageJson = (srcPath, destPath) => {
                if (fs.existsSync(srcPath)) {
                    fs.copyFileSync(srcPath, destPath);
                }
            };

            // Backup root package.json
            backupPackageJson(
                path.join(this.rootDir, 'package.json'),
                path.join(this.backupDir, 'package.json')
            );

            // Backup package package.json files
            this.packages.forEach(pkg => {
                const pkgPath = path.join(this.packagesDir, pkg);
                if (fs.existsSync(pkgPath)) {
                    const backupPkgDir = path.join(this.backupDir, 'packages', pkg);
                    fs.mkdirSync(backupPkgDir, { recursive: true });

                    backupPackageJson(
                        path.join(pkgPath, 'package.json'),
                        path.join(backupPkgDir, 'package.json')
                    );
                }
            });

            this.log('✓ Backup created');
        } catch (error) {
            this.log(`⚠️ Backup creation failed: ${error.message}`, 'WARN');
        }
    }

    /**
     * Clean previous local installations
     */
    async cleanPreviousInstallations() {
        this.log('🧹 Cleaning previous installations...');

        try {
            // Unlink all packages
            for (const pkg of this.packages) {
                const pkgPath = path.join(this.packagesDir, pkg);
                if (fs.existsSync(pkgPath)) {
                    try {
                        this.log(`Unlinking @kalxjs/${pkg}...`);
                        execSync(`${this.npmCmd} unlink`, {
                            cwd: pkgPath,
                            stdio: 'pipe'
                        });
                    } catch (error) {
                        // Ignore unlink errors - package might not be linked
                        this.log(`Note: Could not unlink @kalxjs/${pkg} (might not be linked)`, 'WARN');
                    }
                }
            }

            // Clean global npm links
            try {
                const globalPackages = execSync(`${this.npmCmd} list -g --depth=0`, {
                    encoding: 'utf8',
                    stdio: 'pipe'
                });

                this.packages.forEach(pkg => {
                    if (globalPackages.includes(`@kalxjs/${pkg}`)) {
                        try {
                            execSync(`${this.npmCmd} unlink -g @kalxjs/${pkg}`, { stdio: 'pipe' });
                            this.log(`Unlinked global @kalxjs/${pkg}`);
                        } catch (error) {
                            this.log(`Could not unlink global @kalxjs/${pkg}`, 'WARN');
                        }
                    }
                });
            } catch (error) {
                this.log('Could not check global packages', 'WARN');
            }

            // Remove test directory
            if (fs.existsSync(this.testDir)) {
                fs.rmSync(this.testDir, { recursive: true, force: true });
                this.log('✓ Removed previous test directory');
            }

            // Clean node_modules in packages
            this.packages.forEach(pkg => {
                const nodeModulesPath = path.join(this.packagesDir, pkg, 'node_modules');
                if (fs.existsSync(nodeModulesPath)) {
                    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
                    this.log(`✓ Cleaned node_modules for ${pkg}`);
                }
            });

            this.log('✓ Previous installations cleaned');
        } catch (error) {
            this.log(`⚠️ Cleanup warning: ${error.message}`, 'WARN');
        }
    }

    /**
     * Build all packages
     */
    async buildPackages() {
        this.log('🔨 Building packages...');

        try {
            // Install root dependencies first
            this.log('Installing root dependencies...');
            execSync(`${this.npmCmd} install`, {
                cwd: this.rootDir,
                stdio: 'inherit'
            });

            // Build packages in dependency order
            const buildOrder = [
                'types',
                'utils',
                'core',
                'router',
                'store',
                'compiler',
                'devtools',
                'build-tools',
                'performance',
                'cli'
            ];

            for (const pkg of buildOrder) {
                const pkgPath = path.join(this.packagesDir, pkg);
                if (fs.existsSync(pkgPath)) {
                    this.log(`Building @kalxjs/${pkg}...`);

                    // Install package dependencies
                    try {
                        execSync(`${this.npmCmd} install`, {
                            cwd: pkgPath,
                            stdio: 'pipe'
                        });
                    } catch (error) {
                        this.log(`Warning: Could not install dependencies for ${pkg}`, 'WARN');
                    }

                    // Build if build script exists
                    const packageJson = JSON.parse(
                        fs.readFileSync(path.join(pkgPath, 'package.json'), 'utf8')
                    );

                    if (packageJson.scripts && packageJson.scripts.build) {
                        try {
                            execSync(`${this.npmCmd} run build`, {
                                cwd: pkgPath,
                                stdio: 'pipe'
                            });
                            this.log(`✓ Built @kalxjs/${pkg}`);
                        } catch (error) {
                            this.log(`⚠️ Build warning for ${pkg}: ${error.message}`, 'WARN');
                        }
                    } else {
                        this.log(`✓ No build needed for @kalxjs/${pkg}`);
                    }
                }
            }

            this.log('✓ Package building completed');
        } catch (error) {
            throw new Error(`Package building failed: ${error.message}`);
        }
    }

    /**
     * Link packages for local development
     */
    async linkPackages() {
        this.log('🔗 Linking packages for local development...');

        try {
            // Link packages in dependency order
            for (const pkg of this.packages) {
                const pkgPath = path.join(this.packagesDir, pkg);
                if (fs.existsSync(pkgPath)) {
                    this.log(`Linking @kalxjs/${pkg}...`);

                    try {
                        // Create global link
                        execSync(`${this.npmCmd} link`, {
                            cwd: pkgPath,
                            stdio: 'pipe'
                        });

                        this.log(`✓ Linked @kalxjs/${pkg}`);
                    } catch (error) {
                        this.log(`⚠️ Could not link @kalxjs/${pkg}: ${error.message}`, 'WARN');
                    }
                }
            }

            this.log('✓ Package linking completed');
        } catch (error) {
            throw new Error(`Package linking failed: ${error.message}`);
        }
    }

    /**
     * Create test applications
     */
    async createTestApplications() {
        this.log('📱 Creating test applications...');

        try {
            // Create test directory
            fs.mkdirSync(this.testDir, { recursive: true });

            // Create basic test app
            await this.createBasicTestApp();

            // Create SFC test app
            await this.createSFCTestApp();

            // Create router test app
            await this.createRouterTestApp();

            // Create performance test app
            await this.createPerformanceTestApp();

            this.log('✓ Test applications created');
        } catch (error) {
            throw new Error(`Test application creation failed: ${error.message}`);
        }
    }

    /**
     * Create basic test application
     */
    async createBasicTestApp() {
        const appDir = path.join(this.testDir, 'basic-test');
        fs.mkdirSync(appDir, { recursive: true });

        // Package.json
        const packageJson = {
            name: 'kalxjs-basic-test',
            version: '1.0.0',
            type: 'module',
            scripts: {
                dev: 'vite',
                build: 'vite build',
                preview: 'vite preview'
            },
            dependencies: {},
            devDependencies: {
                vite: '^4.4.0'
            }
        };

        fs.writeFileSync(
            path.join(appDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );

        // HTML file
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KalxJS Basic Test</title>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/main.js"></script>
</body>
</html>`;

        fs.writeFileSync(path.join(appDir, 'index.html'), htmlContent);

        // Main JS file
        const mainJsContent = `import { createApp, h, ref, computed } from '@kalxjs/core';

const App = {
    setup() {
        const count = ref(0);
        const doubled = computed(() => count.value * 2);

        const increment = () => {
            count.value++;
        };

        return {
            count,
            doubled,
            increment
        };
    },

    render() {
        return h('div', { class: 'app' }, [
            h('h1', null, 'KalxJS Basic Test'),
            h('p', null, \`Count: \${this.count}\`),
            h('p', null, \`Doubled: \${this.doubled}\`),
            h('button', { onClick: this.increment }, 'Increment')
        ]);
    }
};

const app = createApp(App);
app.mount('#app');

console.log('✅ KalxJS Basic Test App loaded successfully!');`;

        fs.writeFileSync(path.join(appDir, 'main.js'), mainJsContent);

        // Vite config
        const viteConfig = `import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3001
    }
});`;

        fs.writeFileSync(path.join(appDir, 'vite.config.js'), viteConfig);

        this.log('✓ Basic test app created');
    }

    /**
     * Create SFC test application
     */
    async createSFCTestApp() {
        const appDir = path.join(this.testDir, 'sfc-test');
        fs.mkdirSync(appDir, { recursive: true });

        // Package.json
        const packageJson = {
            name: 'kalxjs-sfc-test',
            version: '1.0.0',
            type: 'module',
            scripts: {
                dev: 'vite',
                build: 'vite build',
                preview: 'vite preview'
            },
            dependencies: {},
            devDependencies: {
                vite: '^4.4.0'
            }
        };

        fs.writeFileSync(
            path.join(appDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );

        // HTML file
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KalxJS SFC Test</title>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/main.js"></script>
</body>
</html>`;

        fs.writeFileSync(path.join(appDir, 'index.html'), htmlContent);

        // Main JS file
        const mainJsContent = `import { createApp } from '@kalxjs/core';
import App from './App.kal';

const app = createApp(App);
app.mount('#app');

console.log('✅ KalxJS SFC Test App loaded successfully!');`;

        fs.writeFileSync(path.join(appDir, 'main.js'), mainJsContent);

        // SFC file
        const sfcContent = `<template>
    <div class="app">
        <h1>KalxJS SFC Test</h1>
        <div class="counter">
            <p>Count: {{ count }}</p>
            <p>Doubled: {{ doubled }}</p>
            <button @click="increment">Increment</button>
            <button @click="decrement">Decrement</button>
        </div>
        <div class="todo-list">
            <h2>Todo List</h2>
            <input v-model="newTodo" @keyup.enter="addTodo" placeholder="Add a todo...">
            <ul>
                <li v-for="todo in todos" :key="todo.id">
                    <span :class="{ completed: todo.completed }" @click="toggleTodo(todo)">
                        {{ todo.text }}
                    </span>
                    <button @click="removeTodo(todo)">Remove</button>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { ref, computed } from '@kalxjs/core';

export default {
    setup() {
        const count = ref(0);
        const doubled = computed(() => count.value * 2);

        const newTodo = ref('');
        const todos = ref([]);
        let todoId = 0;

        const increment = () => {
            count.value++;
        };

        const decrement = () => {
            count.value--;
        };

        const addTodo = () => {
            if (newTodo.value.trim()) {
                todos.value.push({
                    id: ++todoId,
                    text: newTodo.value.trim(),
                    completed: false
                });
                newTodo.value = '';
            }
        };

        const removeTodo = (todo) => {
            const index = todos.value.indexOf(todo);
            if (index > -1) {
                todos.value.splice(index, 1);
            }
        };

        const toggleTodo = (todo) => {
            todo.completed = !todo.completed;
        };

        return {
            count,
            doubled,
            increment,
            decrement,
            newTodo,
            todos,
            addTodo,
            removeTodo,
            toggleTodo
        };
    }
};
</script>

<style scoped>
.app {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
}

.counter {
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.todo-list {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.completed {
    text-decoration: line-through;
    opacity: 0.6;
}

button {
    margin: 5px;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: #007bff;
    color: white;
    cursor: pointer;
}

button:hover {
    background: #0056b3;
}

input {
    width: 100%;
    padding: 8px;
    margin: 10px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
}

ul {
    list-style: none;
    padding: 0;
}

li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    margin: 4px 0;
    border: 1px solid #eee;
    border-radius: 4px;
}

li span {
    cursor: pointer;
    flex: 1;
}
</style>`;

        fs.writeFileSync(path.join(appDir, 'App.kal'), sfcContent);

        // Vite config with KalxJS plugin
        const viteConfig = `import { defineConfig } from 'vite';
import { kalxjs } from '@kalxjs/build-tools';

export default defineConfig({
    plugins: [
        kalxjs({
            devtools: true,
            hmr: true
        })
    ],
    server: {
        port: 3002
    }
});`;

        fs.writeFileSync(path.join(appDir, 'vite.config.js'), viteConfig);

        this.log('✓ SFC test app created');
    }

    /**
     * Create router test application
     */
    async createRouterTestApp() {
        const appDir = path.join(this.testDir, 'router-test');
        fs.mkdirSync(appDir, { recursive: true });

        // Package.json
        const packageJson = {
            name: 'kalxjs-router-test',
            version: '1.0.0',
            type: 'module',
            scripts: {
                dev: 'vite',
                build: 'vite build',
                preview: 'vite preview'
            },
            dependencies: {},
            devDependencies: {
                vite: '^4.4.0'
            }
        };

        fs.writeFileSync(
            path.join(appDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );

        // HTML file
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KalxJS Router Test</title>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/main.js"></script>
</body>
</html>`;

        fs.writeFileSync(path.join(appDir, 'index.html'), htmlContent);

        // Main JS file
        const mainJsContent = `import { createApp } from '@kalxjs/core';
import { createRouter, createWebHistory } from '@kalxjs/router';
import App from './App.js';
import Home from './views/Home.js';
import About from './views/About.js';
import Contact from './views/Contact.js';

const routes = [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/contact', component: Contact }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

const app = createApp(App);
app.use(router);
app.mount('#app');

console.log('✅ KalxJS Router Test App loaded successfully!');`;

        fs.writeFileSync(path.join(appDir, 'main.js'), mainJsContent);

        // App component
        const appContent = `import { h } from '@kalxjs/core';
import { RouterView, RouterLink } from '@kalxjs/router';

export default {
    render() {
        return h('div', { class: 'app' }, [
            h('nav', { class: 'nav' }, [
                h(RouterLink, { to: '/', class: 'nav-link' }, 'Home'),
                h(RouterLink, { to: '/about', class: 'nav-link' }, 'About'),
                h(RouterLink, { to: '/contact', class: 'nav-link' }, 'Contact')
            ]),
            h('main', { class: 'main' }, [
                h(RouterView)
            ])
        ]);
    }
};`;

        fs.writeFileSync(path.join(appDir, 'App.js'), appContent);

        // Create views directory
        const viewsDir = path.join(appDir, 'views');
        fs.mkdirSync(viewsDir, { recursive: true });

        // Home view
        const homeContent = `import { h, ref } from '@kalxjs/core';

export default {
    setup() {
        const count = ref(0);

        const increment = () => {
            count.value++;
        };

        return {
            count,
            increment
        };
    },

    render() {
        return h('div', { class: 'page' }, [
            h('h1', null, 'Home Page'),
            h('p', null, 'Welcome to the KalxJS Router Test!'),
            h('div', { class: 'counter' }, [
                h('p', null, \`Count: \${this.count}\`),
                h('button', { onClick: this.increment }, 'Increment')
            ])
        ]);
    }
};`;

        fs.writeFileSync(path.join(viewsDir, 'Home.js'), homeContent);

        // About view
        const aboutContent = `import { h } from '@kalxjs/core';

export default {
    render() {
        return h('div', { class: 'page' }, [
            h('h1', null, 'About Page'),
            h('p', null, 'This is a test application for KalxJS router functionality.'),
            h('ul', null, [
                h('li', null, 'Client-side routing'),
                h('li', null, 'Route parameters'),
                h('li', null, 'Navigation guards'),
                h('li', null, 'Lazy loading')
            ])
        ]);
    }
};`;

        fs.writeFileSync(path.join(viewsDir, 'About.js'), aboutContent);

        // Contact view
        const contactContent = `import { h, ref } from '@kalxjs/core';

export default {
    setup() {
        const form = ref({
            name: '',
            email: '',
            message: ''
        });

        const submitted = ref(false);

        const submitForm = () => {
            console.log('Form submitted:', form.value);
            submitted.value = true;
            setTimeout(() => {
                submitted.value = false;
                form.value = { name: '', email: '', message: '' };
            }, 2000);
        };

        return {
            form,
            submitted,
            submitForm
        };
    },

    render() {
        return h('div', { class: 'page' }, [
            h('h1', null, 'Contact Page'),
            this.submitted
                ? h('div', { class: 'success' }, 'Thank you for your message!')
                : h('form', { onSubmit: (e) => { e.preventDefault(); this.submitForm(); } }, [
                    h('div', { class: 'form-group' }, [
                        h('label', null, 'Name:'),
                        h('input', {
                            type: 'text',
                            value: this.form.name,
                            onInput: (e) => this.form.name = e.target.value
                        })
                    ]),
                    h('div', { class: 'form-group' }, [
                        h('label', null, 'Email:'),
                        h('input', {
                            type: 'email',
                            value: this.form.email,
                            onInput: (e) => this.form.email = e.target.value
                        })
                    ]),
                    h('div', { class: 'form-group' }, [
                        h('label', null, 'Message:'),
                        h('textarea', {
                            value: this.form.message,
                            onInput: (e) => this.form.message = e.target.value
                        })
                    ]),
                    h('button', { type: 'submit' }, 'Send Message')
                ])
        ]);
    }
};`;

        fs.writeFileSync(path.join(viewsDir, 'Contact.js'), contactContent);

        // Vite config
        const viteConfig = `import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3003
    }
});`;

        fs.writeFileSync(path.join(appDir, 'vite.config.js'), viteConfig);

        this.log('✓ Router test app created');
    }

    /**
     * Create performance test application
     */
    async createPerformanceTestApp() {
        const appDir = path.join(this.testDir, 'performance-test');
        fs.mkdirSync(appDir, { recursive: true });

        // Package.json
        const packageJson = {
            name: 'kalxjs-performance-test',
            version: '1.0.0',
            type: 'module',
            scripts: {
                dev: 'vite',
                build: 'vite build',
                preview: 'vite preview'
            },
            dependencies: {},
            devDependencies: {
                vite: '^4.4.0'
            }
        };

        fs.writeFileSync(
            path.join(appDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );

        // HTML file
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KalxJS Performance Test</title>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/main.js"></script>
</body>
</html>`;

        fs.writeFileSync(path.join(appDir, 'index.html'), htmlContent);

        // Main JS file
        const mainJsContent = `import { createApp, h, ref, computed, signal, derived } from '@kalxjs/core';
import { initPerformanceOptimizer } from '@kalxjs/core/performance';

// Initialize performance optimizer
const optimizer = initPerformanceOptimizer({
    optimizationLevel: 'balanced'
});

const App = {
    setup() {
        // Test signals vs refs
        const signalCount = signal(0);
        const refCount = ref(0);

        const signalDoubled = derived(() => signalCount() * 2);
        const refDoubled = computed(() => refCount.value * 2);

        const items = ref([]);
        const filter = ref('');

        const filteredItems = computed(() => {
            if (!filter.value) return items.value;
            return items.value.filter(item =>
                item.name.toLowerCase().includes(filter.value.toLowerCase())
            );
        });

        // Generate test data
        const generateItems = (count) => {
            const newItems = [];
            for (let i = 0; i < count; i++) {
                newItems.push({
                    id: i,
                    name: \`Item \${i}\`,
                    value: Math.random() * 100,
                    active: Math.random() > 0.5
                });
            }
            items.value = newItems;
        };

        // Performance test functions
        const testSignalPerformance = () => {
            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                signalCount(i);
            }
            const end = performance.now();
            console.log(\`Signal updates: \${end - start}ms\`);
        };

        const testRefPerformance = () => {
            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                refCount.value = i;
            }
            const end = performance.now();
            console.log(\`Ref updates: \${end - start}ms\`);
        };

        const testMassiveUpdate = () => {
            const start = performance.now();
            const newItems = [];
            for (let i = 0; i < 10000; i++) {
                newItems.push({
                    id: i,
                    name: \`Updated Item \${i}\`,
                    value: Math.random() * 100,
                    active: Math.random() > 0.5
                });
            }
            items.value = newItems;
            const end = performance.now();
            console.log(\`Massive update: \${end - start}ms\`);
        };

        // Initialize with some data
        generateItems(100);

        return {
            signalCount,
            refCount,
            signalDoubled,
            refDoubled,
            items,
            filter,
            filteredItems,
            generateItems,
            testSignalPerformance,
            testRefPerformance,
            testMassiveUpdate,
            optimizer
        };
    },

    render() {
        return h('div', { class: 'app' }, [
            h('h1', null, 'KalxJS Performance Test'),

            // Performance controls
            h('div', { class: 'controls' }, [
                h('h2', null, 'Performance Tests'),
                h('button', { onClick: this.testSignalPerformance }, 'Test Signal Performance'),
                h('button', { onClick: this.testRefPerformance }, 'Test Ref Performance'),
                h('button', { onClick: this.testMassiveUpdate }, 'Test Massive Update'),
                h('button', { onClick: () => this.generateItems(1000) }, 'Generate 1000 Items'),
                h('button', { onClick: () => this.generateItems(10000) }, 'Generate 10000 Items')
            ]),

            // Counters
            h('div', { class: 'counters' }, [
                h('h2', null, 'Reactivity Comparison'),
                h('div', { class: 'counter-group' }, [
                    h('div', { class: 'counter' }, [
                        h('h3', null, 'Signal'),
                        h('p', null, \`Count: \${this.signalCount()}\`),
                        h('p', null, \`Doubled: \${this.signalDoubled()}\`),
                        h('button', { onClick: () => this.signalCount(this.signalCount() + 1) }, 'Increment Signal')
                    ]),
                    h('div', { class: 'counter' }, [
                        h('h3', null, 'Ref'),
                        h('p', null, \`Count: \${this.refCount}\`),
                        h('p', null, \`Doubled: \${this.refDoubled}\`),
                        h('button', { onClick: () => this.refCount++ }, 'Increment Ref')
                    ])
                ])
            ]),

            // Item list with filtering
            h('div', { class: 'item-list' }, [
                h('h2', null, \`Items (\${this.filteredItems.length} of \${this.items.length})\`),
                h('input', {
                    type: 'text',
                    placeholder: 'Filter items...',
                    value: this.filter,
                    onInput: (e) => this.filter = e.target.value
                }),
                h('div', { class: 'items' },
                    this.filteredItems.slice(0, 100).map(item =>
                        h('div', {
                            key: item.id,
                            class: \`item \${item.active ? 'active' : ''}\`
                        }, [
                            h('span', { class: 'name' }, item.name),
                            h('span', { class: 'value' }, item.value.toFixed(2)),
                            h('button', {
                                onClick: () => {
                                    item.active = !item.active;
                                    // Force update
                                    this.items = [...this.items];
                                }
                            }, item.active ? 'Deactivate' : 'Activate')
                        ])
                    )
                )
            ]),

            // Performance insights
            h('div', { class: 'performance-insights' }, [
                h('h2', null, 'Performance Insights'),
                h('button', {
                    onClick: () => {
                        const insights = this.optimizer.getPerformanceInsights();
                        console.log('Performance Insights:', insights);
                    }
                }, 'Get Performance Insights'),
                h('p', null, 'Check console for detailed performance metrics')
            ])
        ]);
    }
};

const app = createApp(App);
app.mount('#app');

console.log('✅ KalxJS Performance Test App loaded successfully!');
console.log('Performance Optimizer:', optimizer);`;

        fs.writeFileSync(path.join(appDir, 'main.js'), mainJsContent);

        // CSS file
        const cssContent = `.app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
}

.controls {
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.controls button {
    margin: 5px;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: #007bff;
    color: white;
    cursor: pointer;
}

.controls button:hover {
    background: #0056b3;
}

.counters {
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.counter-group {
    display: flex;
    gap: 20px;
}

.counter {
    flex: 1;
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 4px;
}

.item-list {
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.item-list input {
    width: 100%;
    padding: 8px;
    margin: 10px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.items {
    max-height: 400px;
    overflow-y: auto;
}

.item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    margin: 4px 0;
    border: 1px solid #eee;
    border-radius: 4px;
}

.item.active {
    background-color: #e7f3ff;
    border-color: #007bff;
}

.item .name {
    flex: 1;
    font-weight: bold;
}

.item .value {
    margin: 0 10px;
    color: #666;
}

.item button {
    padding: 4px 8px;
    border: none;
    border-radius: 3px;
    background: #28a745;
    color: white;
    cursor: pointer;
    font-size: 12px;
}

.item button:hover {
    background: #218838;
}

.performance-insights {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.performance-insights button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: #17a2b8;
    color: white;
    cursor: pointer;
}

.performance-insights button:hover {
    background: #138496;
}`;

        fs.writeFileSync(path.join(appDir, 'style.css'), cssContent);

        // Update HTML to include CSS
        const updatedHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KalxJS Performance Test</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/main.js"></script>
</body>
</html>`;

        fs.writeFileSync(path.join(appDir, 'index.html'), updatedHtmlContent);

        // Vite config
        const viteConfig = `import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3004
    }
});`;

        fs.writeFileSync(path.join(appDir, 'vite.config.js'), viteConfig);

        this.log('✓ Performance test app created');
    }

    /**
     * Setup development environment
     */
    async setupDevelopmentEnvironment() {
        this.log('⚙️ Setting up development environment...');

        try {
            // Install dependencies for all test apps
            const testApps = ['basic-test', 'sfc-test', 'router-test', 'performance-test'];

            for (const app of testApps) {
                const appDir = path.join(this.testDir, app);
                if (fs.existsSync(appDir)) {
                    this.log(`Installing dependencies for ${app}...`);

                    try {
                        execSync(`${this.npmCmd} install`, {
                            cwd: appDir,
                            stdio: 'pipe'
                        });

                        // Link KalxJS packages
                        for (const pkg of this.packages) {
                            try {
                                execSync(`${this.npmCmd} link @kalxjs/${pkg}`, {
                                    cwd: appDir,
                                    stdio: 'pipe'
                                });
                            } catch (error) {
                                // Some packages might not be needed
                                this.log(`Note: Could not link @kalxjs/${pkg} to ${app}`, 'WARN');
                            }
                        }

                        this.log(`✓ Dependencies installed for ${app}`);
                    } catch (error) {
                        this.log(`⚠️ Could not install dependencies for ${app}: ${error.message}`, 'WARN');
                    }
                }
            }

            // Create development scripts
            await this.createDevelopmentScripts();

            this.log('✓ Development environment setup completed');
        } catch (error) {
            throw new Error(`Development environment setup failed: ${error.message}`);
        }
    }

    /**
     * Create development scripts
     */
    async createDevelopmentScripts() {
        const scriptsDir = path.join(this.testDir, 'scripts');
        fs.mkdirSync(scriptsDir, { recursive: true });

        // Start all apps script
        const startAllScript = `#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testDir = path.dirname(__dirname);
const apps = [
    { name: 'basic-test', port: 3001 },
    { name: 'sfc-test', port: 3002 },
    { name: 'router-test', port: 3003 },
    { name: 'performance-test', port: 3004 }
];

console.log('🚀 Starting all KalxJS test applications...');

const processes = [];

apps.forEach(app => {
    const appDir = path.join(testDir, app.name);
    console.log(\`Starting \${app.name} on port \${app.port}...\`);

    const process = spawn('npm', ['run', 'dev'], {
        cwd: appDir,
        stdio: 'inherit',
        shell: true
    });

    processes.push(process);
});

// Handle cleanup
process.on('SIGINT', () => {
    console.log('\\n🛑 Stopping all applications...');
    processes.forEach(proc => {
        proc.kill('SIGINT');
    });
    process.exit(0);
});

console.log('\\n📱 Test applications started:');
apps.forEach(app => {
    console.log(\`  - \${app.name}: http://localhost:\${app.port}\`);
});
console.log('\\nPress Ctrl+C to stop all applications');`;

        fs.writeFileSync(path.join(scriptsDir, 'start-all.js'), startAllScript);

        // Individual app start scripts
        const apps = [
            { name: 'basic-test', port: 3001 },
            { name: 'sfc-test', port: 3002 },
            { name: 'router-test', port: 3003 },
            { name: 'performance-test', port: 3004 }
        ];

        apps.forEach(app => {
            const script = `#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appDir = path.join(path.dirname(__dirname), '${app.name}');

console.log('🚀 Starting ${app.name} on port ${app.port}...');
console.log('📂 App directory:', appDir);

const process = spawn('npm', ['run', 'dev'], {
    cwd: appDir,
    stdio: 'inherit',
    shell: true
});

process.on('close', (code) => {
    console.log(\`${app.name} exited with code \${code}\`);
});`;

            fs.writeFileSync(path.join(scriptsDir, `start-${app.name}.js`), script);
        });

        // Make scripts executable on Unix systems
        if (!this.isWindows) {
            try {
                execSync(`chmod +x ${path.join(scriptsDir, '*.js')}`, { stdio: 'pipe' });
            } catch (error) {
                this.log('Could not make scripts executable', 'WARN');
            }
        }

        this.log('✓ Development scripts created');
    }

    /**
     * Verify installation
     */
    async verifyInstallation() {
        this.log('🔍 Verifying installation...');

        try {
            // Check if packages are linked
            let linkedPackages = 0;

            for (const pkg of this.packages) {
                try {
                    const result = execSync(`${this.npmCmd} list -g @kalxjs/${pkg}`, {
                        encoding: 'utf8',
                        stdio: 'pipe'
                    });

                    if (result.includes(`@kalxjs/${pkg}`)) {
                        linkedPackages++;
                        this.log(`✓ @kalxjs/${pkg} is linked`);
                    }
                } catch (error) {
                    this.log(`⚠️ @kalxjs/${pkg} is not linked`, 'WARN');
                }
            }

            // Check test applications
            const testApps = ['basic-test', 'sfc-test', 'router-test', 'performance-test'];
            let validApps = 0;

            for (const app of testApps) {
                const appDir = path.join(this.testDir, app);
                if (fs.existsSync(path.join(appDir, 'package.json'))) {
                    validApps++;
                    this.log(`✓ ${app} is ready`);
                } else {
                    this.log(`❌ ${app} is missing`, 'ERROR');
                }
            }

            // Summary
            this.log(`📊 Verification Summary:`);
            this.log(`  - Linked packages: ${linkedPackages}/${this.packages.length}`);
            this.log(`  - Test applications: ${validApps}/${testApps.length}`);

            if (linkedPackages >= this.packages.length * 0.8 && validApps === testApps.length) {
                this.log('✅ Installation verification passed');
            } else {
                this.log('⚠️ Installation verification completed with warnings', 'WARN');
            }

        } catch (error) {
            this.log(`⚠️ Verification warning: ${error.message}`, 'WARN');
        }
    }

    /**
     * Print usage instructions
     */
    printUsageInstructions() {
        console.log('\n' + '='.repeat(60));
        console.log('🎉 KalxJS Local Test Environment Ready!');
        console.log('='.repeat(60));
        console.log('\n📱 Test Applications:');
        console.log('  • Basic Test:       http://localhost:3001');
        console.log('  • SFC Test:         http://localhost:3002');
        console.log('  • Router Test:      http://localhost:3003');
        console.log('  • Performance Test: http://localhost:3004');

        console.log('\n🚀 Quick Start:');
        console.log('  # Start all applications');
        console.log('  node local-test/scripts/start-all.js');
        console.log('');
        console.log('  # Start individual applications');
        console.log('  node local-test/scripts/start-basic-test.js');
        console.log('  node local-test/scripts/start-sfc-test.js');
        console.log('  node local-test/scripts/start-router-test.js');
        console.log('  node local-test/scripts/start-performance-test.js');

        console.log('\n🔧 Development:');
        console.log('  • Make changes to packages/*/src files');
        console.log('  • Changes will be reflected in test apps via npm link');
        console.log('  • Use browser DevTools to inspect KalxJS DevTools');
        console.log('  • Press Ctrl+Shift+D to toggle KalxJS DevTools');

        console.log('\n📝 Logs:');
        console.log(`  • Setup log: ${this.logFile}`);
        console.log('  • Application logs: Check terminal output');

        console.log('\n🛠️ Troubleshooting:');
        console.log('  • If apps fail to start, check package linking');
        console.log('  • Run setup again if needed: node scripts/setup-local-test.js');
        console.log('  • Check logs for detailed error information');

        console.log('\n' + '='.repeat(60));
    }

    /**
     * Rollback changes
     */
    async rollback() {
        this.log('🔄 Attempting rollback...');

        try {
            // Restore from backup
            if (fs.existsSync(this.backupDir)) {
                // Restore package.json files
                const restorePackageJson = (srcPath, destPath) => {
                    if (fs.existsSync(srcPath)) {
                        fs.copyFileSync(srcPath, destPath);
                    }
                };

                // Restore root package.json
                restorePackageJson(
                    path.join(this.backupDir, 'package.json'),
                    path.join(this.rootDir, 'package.json')
                );

                // Restore package package.json files
                this.packages.forEach(pkg => {
                    const backupPkgDir = path.join(this.backupDir, 'packages', pkg);
                    if (fs.existsSync(backupPkgDir)) {
                        restorePackageJson(
                            path.join(backupPkgDir, 'package.json'),
                            path.join(this.packagesDir, pkg, 'package.json')
                        );
                    }
                });

                this.log('✓ Backup restored');
            }

            // Clean up test directory
            if (fs.existsSync(this.testDir)) {
                fs.rmSync(this.testDir, { recursive: true, force: true });
                this.log('✓ Test directory cleaned');
            }

            this.log('✅ Rollback completed');
        } catch (error) {
            this.log(`❌ Rollback failed: ${error.message}`, 'ERROR');
        }
    }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const setup = new LocalTestSetup();
    setup.setup().catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

export { LocalTestSetup };