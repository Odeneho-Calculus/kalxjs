/**
 * Playwright Configuration for KALXJS Router E2E Testing
 *
 * This configuration is optimized for testing the simplified-test-app with:
 * - Chromium/Chrome browsers
 * - Vite dev server starting automatically
 * - Clean URL routing (History Mode)
 * - Comprehensive reporting
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    testMatch: '**/*.spec.js',
    timeout: 30 * 1000, // 30 seconds per test
    expect: {
        timeout: 5000 // 5 seconds for assertions
    },
    fullyParallel: false, // Route testing should be sequential to avoid state conflicts
    forbidOnly: process.env.CI ? true : false,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // Single worker to avoid parallel navigation conflicts

    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/json/results.json' }],
        ['junit', { outputFile: 'test-results/junit/results.xml' }],
        ['list']
    ],

    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        navigationTimeout: 30 * 1000,
    },

    // Start Vite dev server before running tests
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },

    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
            },
        },
    ],
});
