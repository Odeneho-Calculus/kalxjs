import fs from 'fs';
import path from 'path';

class FileReporter {
    constructor(globalConfig, options) {
        this._globalConfig = globalConfig;
        this._options = options;
    }

    onRunComplete(contexts, results) {
        const outputFile = path.resolve(process.cwd(), 'testResults.txt');

        // Format the test results
        let output = '=== KALXJS TEST RESULTS ===\n\n';
        output += `Date: ${new Date().toISOString()}\n`;
        output += `Test Suites: ${results.numTotalTestSuites} total, ${results.numPassedTestSuites} passed, ${results.numFailedTestSuites} failed\n`;
        output += `Tests: ${results.numTotalTests} total, ${results.numPassedTests} passed, ${results.numFailedTests} failed, ${results.numPendingTests} pending\n`;
        output += `Time: ${(results.startTime ? (Date.now() - results.startTime) / 1000 : 0).toFixed(2)}s\n\n`;

        // Add details for each test suite, but only if it has failures or pending tests
        results.testResults.forEach(testResult => {
            // Filter out passed tests
            const relevantTests = testResult.testResults.filter(
                test => test.status !== 'passed'
            );

            // Only include test suites that have failures or pending tests
            if (relevantTests.length > 0) {
                output += `${testResult.testFilePath}\n`;
                output += `  ${testResult.numFailingTests > 0 ? '✕' : '✓'} ${testResult.testResults.length} tests, ${testResult.numFailingTests} failed, ${testResult.perfStats.end - testResult.perfStats.start}ms\n`;

                // Add details for only failed or pending tests
                relevantTests.forEach(test => {
                    const status = test.status === 'failed' ? '✕' : '○'; // failed or pending
                    output += `    ${status} ${test.title} (${test.duration}ms)\n`;

                    // Add error message for failed tests
                    if (test.status === 'failed' && test.failureMessages) {
                        test.failureMessages.forEach(message => {
                            output += `      ${message.split('\n').join('\n      ')}\n`;
                        });
                    }
                });
                output += '\n';
            }
        });

        // Write to file
        fs.writeFileSync(outputFile, output);
        console.log(`\nTest results written to ${outputFile}`);
    }
}

export default FileReporter;