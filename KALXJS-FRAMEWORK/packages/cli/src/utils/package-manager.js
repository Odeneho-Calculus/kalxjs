/**
 * Package Manager Utilities
 * Detect and execute package manager commands
 *
 * @module @kalxjs/cli/utils/package-manager
 */

import { execSync } from 'child_process';
import { fileExistsSync } from './file-system.js';
import path from 'path';

/**
 * Detect package manager
 */
export function detectPackageManager(cwd = process.cwd()) {
    // Check lock files
    if (fileExistsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
        return 'pnpm';
    }
    if (fileExistsSync(path.join(cwd, 'yarn.lock'))) {
        return 'yarn';
    }
    if (fileExistsSync(path.join(cwd, 'package-lock.json'))) {
        return 'npm';
    }

    // Check which is available
    try {
        execSync('pnpm --version', { stdio: 'ignore' });
        return 'pnpm';
    } catch { }

    try {
        execSync('yarn --version', { stdio: 'ignore' });
        return 'yarn';
    } catch { }

    return 'npm';
}

/**
 * Get install command
 */
export function getInstallCommand(packageManager) {
    const commands = {
        npm: 'npm install',
        yarn: 'yarn install',
        pnpm: 'pnpm install',
    };
    return commands[packageManager] || commands.npm;
}

/**
 * Get add package command
 */
export function getAddCommand(packageManager, packageName, isDev = false) {
    if (packageManager === 'npm') {
        return `npm install ${isDev ? '--save-dev' : '--save'} ${packageName}`;
    } else if (packageManager === 'yarn') {
        return `yarn add ${isDev ? '--dev' : ''} ${packageName}`;
    } else if (packageManager === 'pnpm') {
        return `pnpm add ${isDev ? '--save-dev' : ''} ${packageName}`;
    }
    return `npm install ${packageName}`;
}

/**
 * Get run script command
 */
export function getRunCommand(packageManager, script) {
    if (packageManager === 'npm') {
        return `npm run ${script}`;
    } else if (packageManager === 'yarn') {
        return `yarn ${script}`;
    } else if (packageManager === 'pnpm') {
        return `pnpm ${script}`;
    }
    return `npm run ${script}`;
}

/**
 * Install dependencies
 */
export async function installDependencies(packageManager, cwd) {
    const command = getInstallCommand(packageManager);

    try {
        execSync(command, {
            cwd,
            stdio: 'inherit',
        });
        return true;
    } catch (error) {
        console.error('Failed to install dependencies:', error);
        return false;
    }
}

/**
 * Add package
 */
export async function addPackage(packageManager, packageName, options = {}) {
    const { dev = false, cwd = process.cwd() } = options;
    const command = getAddCommand(packageManager, packageName, dev);

    try {
        execSync(command, {
            cwd,
            stdio: 'inherit',
        });
        return true;
    } catch (error) {
        console.error(`Failed to add package ${packageName}:`, error);
        return false;
    }
}

/**
 * Run script
 */
export async function runScript(packageManager, script, cwd = process.cwd()) {
    const command = getRunCommand(packageManager, script);

    try {
        execSync(command, {
            cwd,
            stdio: 'inherit',
        });
        return true;
    } catch (error) {
        console.error(`Failed to run script ${script}:`, error);
        return false;
    }
}

/**
 * Check if package is installed
 */
export function isPackageInstalled(packageName, cwd = process.cwd()) {
    const nodeModulesPath = path.join(cwd, 'node_modules', packageName);
    return fileExistsSync(nodeModulesPath);
}

/**
 * Get package version
 */
export function getPackageVersion(packageName, cwd = process.cwd()) {
    try {
        const packageJsonPath = path.join(cwd, 'node_modules', packageName, 'package.json');
        const packageJson = require(packageJsonPath);
        return packageJson.version;
    } catch {
        return null;
    }
}

/**
 * Export default
 */
export default {
    detect: detectPackageManager,
    getInstallCommand,
    getAddCommand,
    getRunCommand,
    install: installDependencies,
    addPackage,
    runScript,
    isPackageInstalled,
    getPackageVersion,
};