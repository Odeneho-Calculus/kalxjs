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

        // Add details for each test suite
        results.testResults.forEach(testResult => {
            output += `${testResult.testFilePath}\n`;
            output += `  ${testResult.numFailingTests > 0 ? '✕' : '✓'} ${testResult.testResults.length} tests, ${testResult.numFailingTests} failed, ${testResult.perfStats.end - testResult.perfStats.start}ms\n`;

            // Add details for each test case
            testResult.testResults.forEach(test => {
                const status = test.status === 'passed' ? '✓' : test.status === 'failed' ? '✕' : '○';
                output += `    ${status} ${test.title} (${test.duration}ms)\n`;

                // Add error message for failed tests
                if (test.status === 'failed' && test.failureMessages) {
                    test.failureMessages.forEach(message => {
                        output += `      ${message.split('\n').join('\n      ')}\n`;
                    });
                }
            });

            output += '\n';
        });

        // Write to file
        fs.writeFileSync(outputFile, output);
        console.log(`\nTest results written to ${outputFile}`);
    }
}

export default FileReporter;
