/**
 * Global Teardown for Playwright Extension Tests
 * Runs once after all tests complete
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async (config) => {
    console.log('\n\n🏁 Test suite completed\n');

    // Generate summary report
    const resultsDir = path.join(__dirname, '../test-results/json');
    const resultsFile = path.join(resultsDir, 'results.json');

    if (fs.existsSync(resultsFile)) {
        try {
            const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
            const stats = {
                total: results.stats?.expected || 0,
                passed: results.stats?.unexpected === 0 ? results.stats?.expected : 0,
                failed: results.stats?.unexpected || 0,
                skipped: results.stats?.skipped || 0
            };

            console.log('📊 Test Results Summary:');
            console.log(`   Total:   ${stats.total}`);
            console.log(`   Passed:  ${stats.passed}`);
            console.log(`   Failed:  ${stats.failed}`);
            console.log(`   Skipped: ${stats.skipped}`);
        } catch (e) {
            // Silently fail - results may be generated after
        }
    }

    console.log('\n📁 Results location: test-results/');
    console.log('   - HTML Report: test-results/html/index.html');
    console.log('   - JSON Results: test-results/json/results.json');
    console.log('   - JUnit XML: test-results/junit/results.xml\n');
};