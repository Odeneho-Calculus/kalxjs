/**
 * Runtime Performance Benchmark
 * Tests rendering speed and update performance
 */

import { MetricsCollector } from '../utils/metrics-collector.js';
import { BrowserRunner } from '../utils/browser-runner.js';
import config from '../../benchmark.config.js';

export class RuntimePerformanceBenchmark {
    constructor() {
        this.collector = new MetricsCollector();
        this.runner = null;
    }

    /**
     * Run runtime performance benchmark
     */
    async run(framework = 'kalxjs') {
        console.log(`\n⚡ Running Runtime Performance Benchmark for ${framework}...`);

        this.runner = new BrowserRunner(config.browser);
        await this.runner.launch();

        const results = {
            name: `Runtime Performance - ${framework}`,
            framework,
            metrics: {},
            targets: config.targets.performance
        };

        try {
            // Initial render performance
            const initialRender = await this.measureInitialRender(framework);
            results.metrics.initialRender = initialRender;

            // List rendering (various sizes)
            const listPerf = await this.measureListRendering(framework);
            results.metrics.listRendering = listPerf;

            // Update performance
            const updatePerf = await this.measureUpdatePerformance(framework);
            results.metrics.updatePerformance = updatePerf;

            // Conditional rendering
            const conditionalPerf = await this.measureConditionalRendering(framework);
            results.metrics.conditionalRendering = conditionalPerf;

            // Deep nesting performance
            const nestingPerf = await this.measureDeepNesting(framework);
            results.metrics.deepNesting = nestingPerf;

            // Diffing algorithm performance
            const diffPerf = await this.measureDiffingPerformance(framework);
            results.metrics.diffing = diffPerf;

            results.passed = updatePerf.p95 < 100; // < 100ms for 95th percentile

        } catch (error) {
            console.error(`Error in runtime benchmark: ${error.message}`);
            results.error = error.message;
            results.passed = false;
        } finally {
            await this.runner.close();
        }

        return results;
    }

    /**
     * Measure initial render performance
     */
    async measureInitialRender(framework) {
        console.log('  → Measuring initial render...');

        const url = this.getFrameworkURL(framework);

        for (let i = 0; i < config.warmupIterations; i++) {
            await this.runner.navigate(url);
        }

        for (let i = 0; i < config.iterations; i++) {
            this.collector.startTiming('initialRender');

            await this.runner.navigate(url);

            await this.runner.evaluate(() => {
                return new Promise(resolve => {
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        window.addEventListener('load', resolve);
                    }
                });
            });

            this.collector.endTiming('initialRender');
        }

        return this.collector.getStats('initialRender');
    }

    /**
     * Measure list rendering performance
     */
    async measureListRendering(framework) {
        console.log('  → Measuring list rendering...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        const results = {};

        for (const size of Object.values(config.dataSizes)) {
            console.log(`    • Testing ${size} items...`);

            for (let i = 0; i < 10; i++) {
                const renderTime = await this.runner.evaluate((itemCount) => {
                    const start = performance.now();

                    if (window.renderList) {
                        window.renderList(itemCount);
                    }

                    return new Promise(resolve => {
                        requestAnimationFrame(() => {
                            const end = performance.now();
                            resolve(end - start);
                        });
                    });
                }, size);

                this.collector.recordMetric(`list_${size}`, renderTime);
            }

            results[`${size}`] = this.collector.getStats(`list_${size}`);
        }

        return results;
    }

    /**
     * Measure update performance
     */
    async measureUpdatePerformance(framework) {
        console.log('  → Measuring update performance...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        // Setup: Render initial list
        await this.runner.evaluate(() => {
            if (window.renderList) {
                window.renderList(1000);
            }
        });

        // Measure updates
        for (let i = 0; i < 50; i++) {
            const updateTime = await this.runner.evaluate(() => {
                const start = performance.now();

                if (window.updateList) {
                    window.updateList();
                }

                return new Promise(resolve => {
                    requestAnimationFrame(() => {
                        const end = performance.now();
                        resolve(end - start);
                    });
                });
            });

            this.collector.recordMetric('update', updateTime);
        }

        return this.collector.getStats('update');
    }

    /**
     * Measure conditional rendering performance
     */
    async measureConditionalRendering(framework) {
        console.log('  → Measuring conditional rendering...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        for (let i = 0; i < 50; i++) {
            const renderTime = await this.runner.evaluate(() => {
                const start = performance.now();

                if (window.toggleCondition) {
                    window.toggleCondition();
                }

                return new Promise(resolve => {
                    requestAnimationFrame(() => {
                        const end = performance.now();
                        resolve(end - start);
                    });
                });
            });

            this.collector.recordMetric('conditional', renderTime);
        }

        return this.collector.getStats('conditional');
    }

    /**
     * Measure deep nesting performance
     */
    async measureDeepNesting(framework) {
        console.log('  → Measuring deep nesting performance...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        for (const depth of [5, 10, 20, 50]) {
            const renderTime = await this.runner.evaluate((nestingDepth) => {
                const start = performance.now();

                if (window.renderNested) {
                    window.renderNested(nestingDepth);
                }

                return new Promise(resolve => {
                    requestAnimationFrame(() => {
                        const end = performance.now();
                        resolve(end - start);
                    });
                });
            }, depth);

            this.collector.recordMetric(`nesting_${depth}`, renderTime);
        }

        return {
            '5': this.collector.getStats('nesting_5'),
            '10': this.collector.getStats('nesting_10'),
            '20': this.collector.getStats('nesting_20'),
            '50': this.collector.getStats('nesting_50')
        };
    }

    /**
     * Measure diffing algorithm performance
     */
    async measureDiffingPerformance(framework) {
        console.log('  → Measuring diffing performance...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        // Setup: Render initial list
        await this.runner.evaluate(() => {
            if (window.renderList) {
                window.renderList(1000);
            }
        });

        const scenarios = {
            append: 'Append items',
            prepend: 'Prepend items',
            remove: 'Remove items',
            swap: 'Swap items',
            reverse: 'Reverse list',
            shuffle: 'Shuffle list'
        };

        const results = {};

        for (const [scenario, description] of Object.entries(scenarios)) {
            console.log(`    • Testing ${description}...`);

            for (let i = 0; i < 20; i++) {
                const diffTime = await this.runner.evaluate((scenarioType) => {
                    const start = performance.now();

                    if (window.diffScenarios && window.diffScenarios[scenarioType]) {
                        window.diffScenarios[scenarioType]();
                    }

                    return new Promise(resolve => {
                        requestAnimationFrame(() => {
                            const end = performance.now();
                            resolve(end - start);
                        });
                    });
                }, scenario);

                this.collector.recordMetric(`diff_${scenario}`, diffTime);
            }

            results[scenario] = this.collector.getStats(`diff_${scenario}`);
        }

        return results;
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
    const benchmark = new RuntimePerformanceBenchmark();
    const results = await benchmark.run('kalxjs');
    console.log('\n✅ Results:', JSON.stringify(results, null, 2));
}

export default RuntimePerformanceBenchmark;