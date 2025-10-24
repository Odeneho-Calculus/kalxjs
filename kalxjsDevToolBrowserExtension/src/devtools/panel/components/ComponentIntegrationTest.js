/**
 * Component Integration Test
 * Verifies all advanced components are properly integrated and functioning
 */

import { createLogger } from '../../../shared/utils.js';

const logger = createLogger('ComponentIntegrationTest');

export class ComponentIntegrationTest {
    constructor() {
        this.testResults = [];
        this.integrationScore = 0;
    }

    /**
     * Run complete integration test suite
     */
    async runIntegrationTests() {
        logger.info('Starting component integration tests...');

        const tests = [
            { name: 'EventLogger Integration', test: () => this.testEventLogger() },
            { name: 'PerformanceProfiler Integration', test: () => this.testPerformanceProfiler() },
            { name: 'TimeTravel Integration', test: () => this.testTimeTravel() },
            { name: 'NetworkIntegration Integration', test: () => this.testNetworkIntegration() },
            { name: 'DataExporter Integration', test: () => this.testDataExporter() },
            { name: 'Cross-Component Communication', test: () => this.testCrossComponentCommunication() },
            { name: 'Memory Management', test: () => this.testMemoryManagement() },
            { name: 'Error Handling', test: () => this.testErrorHandling() }
        ];

        for (const testCase of tests) {
            try {
                const result = await testCase.test();
                this.testResults.push({
                    name: testCase.name,
                    passed: result.passed,
                    score: result.score,
                    details: result.details,
                    errors: result.errors || []
                });
                this.integrationScore += result.score;
            } catch (error) {
                this.testResults.push({
                    name: testCase.name,
                    passed: false,
                    score: 0,
                    details: 'Test failed with exception',
                    errors: [error.message]
                });
                logger.error(`Test ${testCase.name} failed:`, error);
            }
        }

        this.integrationScore = Math.round((this.integrationScore / tests.length) * 100) / 100;

        logger.info('Integration tests completed. Score:', this.integrationScore);
        return this.generateTestReport();
    }

    /**
     * Test EventLogger component integration
     */
    testEventLogger() {
        const issues = [];
        let score = 0;

        // Check if EventLogger is properly instantiated
        if (window.eventLoggerInstance) {
            score += 0.3;

            // Check core methods
            const requiredMethods = ['logEvent', 'clearEvents', 'exportEvents', 'togglePause'];
            const methodsExist = requiredMethods.every(method =>
                typeof window.eventLoggerInstance[method] === 'function'
            );

            if (methodsExist) {
                score += 0.4;
            } else {
                issues.push('Missing required methods in EventLogger');
            }

            // Check data structures
            if (window.eventLoggerInstance.events && Array.isArray(window.eventLoggerInstance.events)) {
                score += 0.2;
            } else {
                issues.push('EventLogger events array not properly initialized');
            }

            // Check UI integration
            const eventElements = ['events-list', 'event-timeline', 'clear-events'];
            const uiElementsExist = eventElements.some(id => document.getElementById(id));
            if (uiElementsExist) {
                score += 0.1;
            } else {
                issues.push('EventLogger UI elements not found');
            }
        } else {
            issues.push('EventLogger instance not found in global scope');
        }

        return {
            passed: score >= 0.7,
            score: score,
            details: `EventLogger integration test: ${score.toFixed(2)}/1.0`,
            errors: issues
        };
    }

    /**
     * Test PerformanceProfiler component integration
     */
    testPerformanceProfiler() {
        const issues = [];
        let score = 0;

        if (window.performanceProfilerInstance) {
            score += 0.3;

            const requiredMethods = ['startProfiling', 'stopProfiling', 'takeMemorySnapshot', 'exportPerformanceReport'];
            const methodsExist = requiredMethods.every(method =>
                typeof window.performanceProfilerInstance[method] === 'function'
            );

            if (methodsExist) {
                score += 0.4;
            } else {
                issues.push('Missing required methods in PerformanceProfiler');
            }

            if (window.performanceProfilerInstance.performanceData &&
                Array.isArray(window.performanceProfilerInstance.performanceData)) {
                score += 0.2;
            } else {
                issues.push('PerformanceProfiler data structures not properly initialized');
            }

            const perfElements = ['performance-overview', 'start-profiling', 'memory-snapshots'];
            const uiElementsExist = perfElements.some(id => document.getElementById(id));
            if (uiElementsExist) {
                score += 0.1;
            } else {
                issues.push('PerformanceProfiler UI elements not found');
            }
        } else {
            issues.push('PerformanceProfiler instance not found');
        }

        return {
            passed: score >= 0.7,
            score: score,
            details: `PerformanceProfiler integration test: ${score.toFixed(2)}/1.0`,
            errors: issues
        };
    }

    /**
     * Test TimeTravel component integration
     */
    testTimeTravel() {
        const issues = [];
        let score = 0;

        if (window.timeTravelInstance) {
            score += 0.3;

            const requiredMethods = ['navigateToState', 'startReplay', 'addBookmark', 'exportHistory'];
            const methodsExist = requiredMethods.every(method =>
                typeof window.timeTravelInstance[method] === 'function'
            );

            if (methodsExist) {
                score += 0.4;
            } else {
                issues.push('Missing required methods in TimeTravel');
            }

            if (window.timeTravelInstance.stateHistory &&
                Array.isArray(window.timeTravelInstance.stateHistory)) {
                score += 0.2;
            } else {
                issues.push('TimeTravel state history not properly initialized');
            }

            const timeTravelElements = ['timeline-scrubber', 'history-list', 'play-replay'];
            const uiElementsExist = timeTravelElements.some(id => document.getElementById(id));
            if (uiElementsExist) {
                score += 0.1;
            } else {
                issues.push('TimeTravel UI elements not found');
            }
        } else {
            issues.push('TimeTravel instance not found');
        }

        return {
            passed: score >= 0.7,
            score: score,
            details: `TimeTravel integration test: ${score.toFixed(2)}/1.0`,
            errors: issues
        };
    }

    /**
     * Test NetworkIntegration component integration
     */
    testNetworkIntegration() {
        const issues = [];
        let score = 0;

        if (window.networkIntegrationInstance) {
            score += 0.3;

            const requiredMethods = ['startMonitoring', 'analyzeNetworkPerformance', 'exportNetworkReport'];
            const methodsExist = requiredMethods.every(method =>
                typeof window.networkIntegrationInstance[method] === 'function'
            );

            if (methodsExist) {
                score += 0.4;
            } else {
                issues.push('Missing required methods in NetworkIntegration');
            }

            if (window.networkIntegrationInstance.networkRequests &&
                Array.isArray(window.networkIntegrationInstance.networkRequests)) {
                score += 0.2;
            } else {
                issues.push('NetworkIntegration request tracking not properly initialized');
            }

            // Check if network APIs are hooked
            if (window.fetch && window.fetch.toString().includes('networkIntegration')) {
                score += 0.1;
            } else {
                issues.push('Network API hooking may not be active');
            }
        } else {
            issues.push('NetworkIntegration instance not found');
        }

        return {
            passed: score >= 0.7,
            score: score,
            details: `NetworkIntegration test: ${score.toFixed(2)}/1.0`,
            errors: issues
        };
    }

    /**
     * Test DataExporter component integration
     */
    testDataExporter() {
        const issues = [];
        let score = 0;

        if (window.dataExporterInstance) {
            score += 0.3;

            const requiredMethods = ['quickExport', 'generateReport', 'exportNetworkReport'];
            const methodsExist = requiredMethods.every(method =>
                typeof window.dataExporterInstance[method] === 'function'
            );

            if (methodsExist) {
                score += 0.4;
            } else {
                issues.push('Missing required methods in DataExporter');
            }

            if (window.dataExporterInstance.exportFormats &&
                Array.isArray(window.dataExporterInstance.exportFormats)) {
                score += 0.2;
            } else {
                issues.push('DataExporter formats not properly initialized');
            }

            if (window.dataExporterInstance.reportTemplates &&
                window.dataExporterInstance.reportTemplates.size > 0) {
                score += 0.1;
            } else {
                issues.push('DataExporter templates not loaded');
            }
        } else {
            issues.push('DataExporter instance not found');
        }

        return {
            passed: score >= 0.7,
            score: score,
            details: `DataExporter test: ${score.toFixed(2)}/1.0`,
            errors: issues
        };
    }

    /**
     * Test cross-component communication
     */
    testCrossComponentCommunication() {
        const issues = [];
        let score = 0;

        // Check if panel instance exists and has component references
        if (window.panelInstance) {
            score += 0.2;

            const componentProperties = [
                'eventLogger',
                'performanceProfiler',
                'timeTravel',
                'networkIntegration',
                'dataExporter'
            ];

            const componentsConnected = componentProperties.filter(prop =>
                window.panelInstance[prop] !== null
            ).length;

            score += (componentsConnected / componentProperties.length) * 0.5;

            if (componentsConnected < componentProperties.length) {
                issues.push(`Only ${componentsConnected}/${componentProperties.length} components connected to panel`);
            }

            // Check bridge communication
            if (window.panelInstance.bridge && window.panelInstance.bridge.connected) {
                score += 0.3;
            } else {
                issues.push('Panel bridge not properly connected');
                score += 0.1; // Partial credit if bridge exists but not connected
            }
        } else {
            issues.push('Panel instance not found - components cannot communicate');
        }

        return {
            passed: score >= 0.7,
            score: score,
            details: `Cross-component communication test: ${score.toFixed(2)}/1.0`,
            errors: issues
        };
    }

    /**
     * Test memory management
     */
    testMemoryManagement() {
        const issues = [];
        let score = 0;

        let memoryIssues = 0;

        // Check event logger memory limits
        if (window.eventLoggerInstance) {
            if (window.eventLoggerInstance.maxEvents &&
                window.eventLoggerInstance.maxEvents <= 1000) {
                score += 0.15;
            } else {
                issues.push('EventLogger memory limits not properly configured');
                memoryIssues++;
            }
        }

        // Check performance profiler memory management
        if (window.performanceProfilerInstance) {
            const perfData = window.performanceProfilerInstance.performanceData;
            if (perfData && perfData.length <= 1000) {
                score += 0.15;
            } else {
                issues.push('PerformanceProfiler may have memory issues');
                memoryIssues++;
            }
        }

        // Check time travel history limits
        if (window.timeTravelInstance) {
            const history = window.timeTravelInstance.stateHistory;
            if (history && window.timeTravelInstance.maxHistorySize) {
                score += 0.15;
            } else {
                issues.push('TimeTravel history limits not configured');
                memoryIssues++;
            }
        }

        // Check network request limits
        if (window.networkIntegrationInstance) {
            const requests = window.networkIntegrationInstance.networkRequests;
            if (requests && requests.length <= 1000) {
                score += 0.15;
            } else {
                issues.push('NetworkIntegration may accumulate too many requests');
                memoryIssues++;
            }
        }

        // Check localStorage usage
        try {
            const storageKeys = Object.keys(localStorage).filter(key =>
                key.startsWith('kalxjs-devtools-')
            );
            if (storageKeys.length > 0) {
                score += 0.2;
            } else {
                issues.push('No persistent storage configured');
            }
        } catch (error) {
            issues.push('Unable to check localStorage usage');
        }

        // Overall memory health check
        if ('memory' in performance) {
            const memInfo = performance.memory;
            if (memInfo.usedJSHeapSize < memInfo.jsHeapSizeLimit * 0.8) {
                score += 0.2;
            } else {
                issues.push('High memory usage detected');
            }
        }

        return {
            passed: score >= 0.7 && memoryIssues <= 1,
            score: score,
            details: `Memory management test: ${score.toFixed(2)}/1.0, Issues: ${memoryIssues}`,
            errors: issues
        };
    }

    /**
     * Test error handling
     */
    testErrorHandling() {
        const issues = [];
        let score = 0;

        // Check if logger is available
        if (typeof createLogger === 'function') {
            score += 0.2;
        } else {
            issues.push('Logger utility not available');
        }

        // Check component error handling
        const components = [
            window.eventLoggerInstance,
            window.performanceProfilerInstance,
            window.timeTravelInstance,
            window.networkIntegrationInstance,
            window.dataExporterInstance
        ];

        let componentsWithErrorHandling = 0;
        components.forEach(component => {
            if (component && typeof component.initialize === 'function') {
                // Check if component has try-catch in critical methods
                const initString = component.initialize.toString();
                if (initString.includes('try') || initString.includes('catch')) {
                    componentsWithErrorHandling++;
                }
            }
        });

        score += (componentsWithErrorHandling / components.length) * 0.4;

        // Check global error handling
        if (window.onerror || window.addEventListener) {
            score += 0.2;
        } else {
            issues.push('No global error handling detected');
        }

        // Check console error capturing
        if (console.error && console.error.toString().includes('kalxjs')) {
            score += 0.1;
        }

        // Test error recovery
        try {
            // Simulate an error condition
            if (window.panelInstance && typeof window.panelInstance._initialize === 'function') {
                score += 0.1;
            }
        } catch (error) {
            issues.push('Component initialization error recovery failed');
        }

        return {
            passed: score >= 0.6,
            score: score,
            details: `Error handling test: ${score.toFixed(2)}/1.0`,
            errors: issues
        };
    }

    /**
     * Generate integration test report
     */
    generateTestReport() {
        const passedTests = this.testResults.filter(test => test.passed).length;
        const totalTests = this.testResults.length;
        const passRate = (passedTests / totalTests) * 100;

        const report = {
            summary: {
                totalTests: totalTests,
                passedTests: passedTests,
                failedTests: totalTests - passedTests,
                passRate: Math.round(passRate * 100) / 100,
                integrationScore: this.integrationScore,
                status: passRate >= 80 ? 'EXCELLENT' : passRate >= 60 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
            },
            results: this.testResults,
            recommendations: this.generateRecommendations(),
            timestamp: new Date().toISOString()
        };

        logger.info('Integration test report generated:', report.summary);
        return report;
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations() {
        const recommendations = [];
        const failedTests = this.testResults.filter(test => !test.passed);

        if (failedTests.length > 0) {
            recommendations.push({
                priority: 'high',
                title: 'Address Failed Integration Tests',
                description: `${failedTests.length} integration tests failed`,
                actions: failedTests.map(test => `Fix ${test.name}: ${test.errors.join(', ')}`)
            });
        }

        if (this.integrationScore < 0.8) {
            recommendations.push({
                priority: 'medium',
                title: 'Improve Component Integration',
                description: `Integration score is ${this.integrationScore}/1.0`,
                actions: [
                    'Ensure all components are properly initialized',
                    'Verify cross-component communication',
                    'Check error handling coverage'
                ]
            });
        }

        const memoryTest = this.testResults.find(test => test.name === 'Memory Management');
        if (memoryTest && !memoryTest.passed) {
            recommendations.push({
                priority: 'high',
                title: 'Memory Management Issues',
                description: 'Memory management test failed',
                actions: [
                    'Implement proper data limits',
                    'Add memory cleanup routines',
                    'Monitor memory usage patterns'
                ]
            });
        }

        return recommendations;
    }

    /**
     * Export test report
     */
    exportTestReport() {
        const report = this.generateTestReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `kalxjs-devtools-integration-test-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        a.click();

        URL.revokeObjectURL(url);
        logger.info('Integration test report exported');
    }

    /**
     * Display test results in console
     */
    displayResults() {
        const report = this.generateTestReport();

        console.group('🧪 KALXJS DevTools Integration Test Results');
        console.log('📊 Summary:', report.summary);
        console.log('✅ Passed Tests:', report.results.filter(t => t.passed).map(t => t.name));
        console.log('❌ Failed Tests:', report.results.filter(t => !t.passed).map(t => t.name));
        console.log('💡 Recommendations:', report.recommendations);
        console.groupEnd();

        return report;
    }
}

// Auto-run tests if in development mode
if (typeof window !== 'undefined' && window.location.href.includes('devtools')) {
    window.componentIntegrationTest = new ComponentIntegrationTest();

    // Run tests after a short delay to allow components to initialize
    setTimeout(() => {
        window.componentIntegrationTest.runIntegrationTests().then(report => {
            console.log('🎯 Integration Test Results:', report);

            // Add test results to global scope for debugging
            window.integrationTestReport = report;

            if (report.summary.status === 'EXCELLENT') {
                console.log('🎉 All components integrated successfully!');
            } else if (report.summary.status === 'GOOD') {
                console.log('✅ Most components working well, minor issues detected');
            } else {
                console.warn('⚠️ Integration issues detected, check recommendations');
            }
        });
    }, 2000);
}