/**
 * Playwright Configuration for KALXJS DevTools Extension Testing
 *
 * This configuration is optimized for browser extension testing with:
 * - Chrome/Chromium as primary browser
 * - Extension loading and context management
 * - Proper timeouts for async operations
 * - Detailed reporting and screenshots on failure
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    testDir: './tests/e2e',
    testMatch: '**/*.spec.js',
    timeout: 30 * 1000, // 30 seconds per test
    expect: {
        timeout: 5000 // 5 seconds for assertions
    },
    fullyParallel: false, // Extension tests should be sequential
    forbidOnly: process.env.CI ? true : false,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // Single worker for extension isolation

    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/json/results.json' }],
        ['junit', { outputFile: 'test-results/junit/results.xml' }],
        ['list']
    ],

    use: {
        baseURL: 'file://',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    // No web server needed - testing browser extension directly
    webServer: undefined,

    projects: [
        {
            name: 'chromium-extension',
            use: {
                browserName: 'chromium',
                // Extension-specific configurations
                launchArgs: [
                    '--disable-blink-features=AutomationControlled'
                ],
                headless: false, // Must be false for extensions
            },
        },
    ],

    globalSetup: resolve(__dirname, './tests/global-setup.js'),
    globalTeardown: resolve(__dirname, './tests/global-teardown.js'),
};