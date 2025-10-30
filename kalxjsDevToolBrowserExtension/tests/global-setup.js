/**
 * Global Setup for Playwright Extension Tests
 * Runs once before all tests
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async (config) => {
    console.log('🧪 Setting up KALXJS DevTools Extension test environment...\n');

    // Verify extension build exists
    const buildPath = path.join(__dirname, '../build');
    if (!fs.existsSync(buildPath)) {
        throw new Error(
            'Extension build not found at ' + buildPath +
            '\nPlease run: npm run build'
        );
    }

    // Verify critical files exist
    const requiredFiles = [
        'manifest.json',
        'background/service-worker.js',
        'content-script/content.js',
        'devtools/devtools.js'
    ];

    for (const file of requiredFiles) {
        const filePath = path.join(buildPath, file);
        if (!fs.existsSync(filePath)) {
            throw new Error(
                `Required extension file not found: ${file}\n` +
                `Expected at: ${filePath}`
            );
        }
    }

    // Create test-results directory
    const resultsDir = path.join(__dirname, '../test-results');
    const subdirs = ['json', 'junit', 'videos', 'traces'];

    for (const dir of [resultsDir, ...subdirs.map(d => path.join(resultsDir, d))]) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    // Create playwright-report directory for HTML reporter
    const reportDir = path.join(__dirname, '../playwright-report');
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    // Verify test fixtures exist
    const fixturesDir = path.join(__dirname, './fixtures');
    if (!fs.existsSync(fixturesDir)) {
        throw new Error(`Test fixtures directory not found at ${fixturesDir}`);
    }

    console.log('✅ Build verified');
    console.log('✅ Test results directory created');
    console.log('✅ Test fixtures verified');
    console.log('\n📝 Starting tests...\n');
};