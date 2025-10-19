/**
 * Update Performance Benchmark
 * Tests reactive update speed and batching efficiency
 */

import { MetricsCollector } from '../utils/metrics-collector.js';
import { BrowserRunner } from '../utils/browser-runner.js';
import config from '../../benchmark.config.js';

export class UpdatePerformanceBenchmark {
    constructor() {
        this.collector = new MetricsCollector();
        this.runner = null;
    }

    /**
     * Run update performance benchmark
     */
    async run(framework = 'kalxjs') {
        console.log(`\n🔄 Running Update Performance Benchmark for ${framework}...`);

        this.runner = new BrowserRunner(config.browser);
        await this.runner.launch();

        const results = {
            name: `Update Performance - ${framework}`,
            framework,
            metrics: {},
            targets: { updateTime: 50 } // < 50ms target
        };

        try {
            // Single update performance
            const singleUpdate = await this.measureSingleUpdate(framework);
            results.metrics.singleUpdate = singleUpdate;

            // Batch update performance
            const batchUpdate = await this.measureBatchUpdate(framework);
            results.metrics.batchUpdate = batchUpdate;

            // Cascading updates
            const cascadingUpdates = await this.measureCascadingUpdates(framework);
            results.metrics.cascadingUpdates = cascadingUpdates;

            // Deep reactivity updates
            const deepUpdates = await this.measureDeepUpdates(framework);
            results.metrics.deepUpdates = deepUpdates;

            // Signal vs Virtual DOM comparison
            const signalVsVDOM = await this.compareSignalVsVDOM(framework);
            results.metrics.signalVsVDOM = signalVsVDOM;

            // Computed value updates
            const computedUpdates = await this.measureComputedUpdates(framework);
            results.metrics.computedUpdates = computedUpdates;

            results.passed = singleUpdate.mean < 50;

        } catch (error) {
            console.error(`Error in update benchmark: ${error.message}`);
            results.error = error.message;
            results.passed = false;
        } finally {
            await this.runner.close();
        }

        return results;
    }

    /**
     * Measure single update performance
     */
    async measureSingleUpdate(framework) {
        console.log('  → Measuring single update...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        for (let i = 0; i < 100; i++) {
            const updateTime = await this.runner.evaluate(() => {
                const start = performance.now();

                if (window.updateSingleValue) {
                    window.updateSingleValue();
                }

                return new Promise(resolve => {
                    requestAnimationFrame(() => {
                        const end = performance.now();
                        resolve(end - start);
                    });
                });
            });

            this.collector.recordMetric('singleUpdate', updateTime);
        }

        return this.collector.getStats('singleUpdate');
    }

    /**
     * Measure batch update performance
     */
    async measureBatchUpdate(framework) {
        console.log('  → Measuring batch updates...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        for (const count of [10, 50, 100, 500]) {
            for (let i = 0; i < 20; i++) {
                const updateTime = await this.runner.evaluate((updateCount) => {
                    const start = performance.now();

                    if (window.batchUpdate) {
                        window.batchUpdate(updateCount);
                    }

                    return new Promise(resolve => {
                        requestAnimationFrame(() => {
                            const end = performance.now();
                            resolve(end - start);
                        });
                    });
                }, count);

                this.collector.recordMetric(`batch_${count}`, updateTime);
            }
        }

        return {
            '10': this.collector.getStats('batch_10'),
            '50': this.collector.getStats('batch_50'),
            '100': this.collector.getStats('batch_100'),
            '500': this.collector.getStats('batch_500')
        };
    }

    /**
     * Measure cascading updates
     */
    async measureCascadingUpdates(framework) {
        console.log('  → Measuring cascading updates...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        for (let i = 0; i < 50; i++) {
            const updateTime = await this.runner.evaluate(() => {
                const start = performance.now();

                if (window.triggerCascade) {
                    window.triggerCascade();
                }

                return new Promise(resolve => {
                    // Wait for all cascading updates to complete
                    setTimeout(() => {
                        const end = performance.now();
                        resolve(end - start);
                    }, 100);
                });
            });

            this.collector.recordMetric('cascading', updateTime);
        }

        return this.collector.getStats('cascading');
    }

    /**
     * Measure deep reactivity updates
     */
    async measureDeepUpdates(framework) {
        console.log('  → Measuring deep updates...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        for (const depth of [5, 10, 20]) {
            for (let i = 0; i < 30; i++) {
                const updateTime = await this.runner.evaluate((nestingDepth) => {
                    const start = performance.now();

                    if (window.updateDeepProperty) {
                        window.updateDeepProperty(nestingDepth);
                    }

                    return new Promise(resolve => {
                        requestAnimationFrame(() => {
                            const end = performance.now();
                            resolve(end - start);
                        });
                    });
                }, depth);

                this.collector.recordMetric(`deep_${depth}`, updateTime);
            }
        }

        return {
            '5': this.collector.getStats('deep_5'),
            '10': this.collector.getStats('deep_10'),
            '20': this.collector.getStats('deep_20')
        };
    }

    /**
     * Compare Signal-based vs Virtual DOM updates
     */
    async compareSignalVsVDOM(framework) {
        console.log('  → Comparing Signal vs VDOM updates...');

        if (framework !== 'kalxjs') {
            return { message: 'Only available for KALXJS' };
        }

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        // Test with signals
        for (let i = 0; i < 50; i++) {
            const signalTime = await this.runner.evaluate(() => {
                const start = performance.now();

                if (window.updateWithSignals) {
                    window.updateWithSignals();
                }

                return new Promise(resolve => {
                    requestAnimationFrame(() => {
                        const end = performance.now();
                        resolve(end - start);
                    });
                });
            });

            this.collector.recordMetric('signal', signalTime);
        }

        // Test with VDOM
        for (let i = 0; i < 50; i++) {
            const vdomTime = await this.runner.evaluate(() => {
                const start = performance.now();

                if (window.updateWithVDOM) {
                    window.updateWithVDOM();
                }

                return new Promise(resolve => {
                    requestAnimationFrame(() => {
                        const end = performance.now();
                        resolve(end - start);
                    });
                });
            });

            this.collector.recordMetric('vdom', vdomTime);
        }

        const signalStats = this.collector.getStats('signal');
        const vdomStats = this.collector.getStats('vdom');

        return {
            signal: signalStats,
            vdom: vdomStats,
            improvement: ((vdomStats.mean - signalStats.mean) / vdomStats.mean * 100).toFixed(2) + '%'
        };
    }

    /**
     * Measure computed value updates
     */
    async measureComputedUpdates(framework) {
        console.log('  → Measuring computed updates...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        for (let i = 0; i < 50; i++) {
            const updateTime = await this.runner.evaluate(() => {
                const start = performance.now();

                if (window.updateComputed) {
                    window.updateComputed();
                }

                return new Promise(resolve => {
                    requestAnimationFrame(() => {
                        const end = performance.now();
                        resolve(end - start);
                    });
                });
            });

            this.collector.recordMetric('computed', updateTime);
        }

        return this.collector.getStats('computed');
    }

    /**
     * Get framework URL
     */
    getFrameworkURL(framework) {
        const port = 3000 + config.frameworks.indexOf(framework);
        return `http://localhost:${port}`;
    }

    /**
     * Get results summary
     */
    getSummary() {
        return this.collector.getAllStats();
    }
}

/**
 * Run benchmark if called directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    const benchmark = new UpdatePerformanceBenchmark();
    const results = await benchmark.run('kalxjs');
    console.log('\n✅ Results:', JSON.stringify(results, null, 2));
}

export default UpdatePerformanceBenchmark;