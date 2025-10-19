/**
 * Memory Usage Benchmark
 * Profiles heap memory consumption and detects memory leaks
 */

import { MetricsCollector } from '../utils/metrics-collector.js';
import { BrowserRunner } from '../utils/browser-runner.js';
import config from '../../benchmark.config.js';

export class MemoryUsageBenchmark {
    constructor() {
        this.collector = new MetricsCollector();
        this.runner = null;
    }

    /**
     * Run memory usage benchmark
     */
    async run(framework = 'kalxjs') {
        console.log(`\n💾 Running Memory Usage Benchmark for ${framework}...`);

        this.runner = new BrowserRunner(config.browser);
        await this.runner.launch();

        const results = {
            name: `Memory Usage - ${framework}`,
            framework,
            metrics: {},
            targets: { baseline: config.targets.performance.memory }
        };

        try {
            // Baseline memory
            const baseline = await this.measureBaseline(framework);
            results.metrics.baseline = baseline;

            // Component creation memory
            const componentMemory = await this.measureComponentMemory(framework);
            results.metrics.componentMemory = componentMemory;

            // Large list memory
            const listMemory = await this.measureListMemory(framework);
            results.metrics.listMemory = listMemory;

            // Memory after updates
            const updateMemory = await this.measureUpdateMemory(framework);
            results.metrics.updateMemory = updateMemory;

            // Memory leak detection
            const leaks = await this.detectMemoryLeaks(framework);
            results.metrics.leaks = leaks;
            results.hasLeaks = leaks.detected;

            // DOM nodes count
            const domNodes = await this.measureDOMNodes(framework);
            results.metrics.domNodes = domNodes;

            results.passed = baseline.mean < config.targets.performance.memory && !leaks.detected;

        } catch (error) {
            console.error(`Error in memory benchmark: ${error.message}`);
            results.error = error.message;
            results.passed = false;
        } finally {
            await this.runner.close();
        }

        return results;
    }

    /**
     * Measure baseline memory
     */
    async measureBaseline(framework) {
        console.log('  → Measuring baseline memory...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        // Wait for app to stabilize
        await this.sleep(1000);

        for (let i = 0; i < 10; i++) {
            const memory = await this.runner.getMemoryMetrics();
            this.collector.recordMetric('baseline', memory.jsHeapSize);
            await this.sleep(100);
        }

        return this.collector.getStats('baseline');
    }

    /**
     * Measure component creation memory
     */
    async measureComponentMemory(framework) {
        console.log('  → Measuring component memory...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        await this.runner.evaluate(() => {
            window.gcBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;

            // Create 100 components
            if (window.createComponents) {
                window.createComponents(100);
            }
        });

        await this.sleep(500);

        const memory = await this.runner.evaluate(() => {
            const after = performance.memory ? performance.memory.usedJSHeapSize : 0;
            return after - window.gcBefore;
        });

        this.collector.recordMetric('componentMemory', memory);

        return this.collector.getStats('componentMemory');
    }

    /**
     * Measure large list memory
     */
    async measureListMemory(framework) {
        console.log('  → Measuring list memory...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        for (const size of [100, 1000, 10000]) {
            const beforeMemory = await this.runner.getMemoryMetrics();

            await this.runner.evaluate((itemCount) => {
                if (window.renderList) {
                    window.renderList(itemCount);
                }
            }, size);

            await this.sleep(500);

            const afterMemory = await this.runner.getMemoryMetrics();
            const delta = afterMemory.jsHeapSize - beforeMemory.jsHeapSize;

            this.collector.recordMetric(`listMemory_${size}`, delta);
        }

        return {
            '100': this.collector.getStats('listMemory_100'),
            '1000': this.collector.getStats('listMemory_1000'),
            '10000': this.collector.getStats('listMemory_10000')
        };
    }

    /**
     * Measure memory after updates
     */
    async measureUpdateMemory(framework) {
        console.log('  → Measuring update memory...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        const beforeMemory = await this.runner.getMemoryMetrics();

        // Perform 100 updates
        for (let i = 0; i < 100; i++) {
            await this.runner.evaluate(() => {
                if (window.triggerUpdate) {
                    window.triggerUpdate();
                }
            });

            if (i % 10 === 0) {
                await this.sleep(50);
            }
        }

        await this.sleep(500);

        const afterMemory = await this.runner.getMemoryMetrics();
        const delta = afterMemory.jsHeapSize - beforeMemory.jsHeapSize;

        this.collector.recordMetric('updateMemory', delta);

        return this.collector.getStats('updateMemory');
    }

    /**
     * Detect memory leaks
     */
    async detectMemoryLeaks(framework) {
        console.log('  → Detecting memory leaks...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        const samples = [];

        // Take memory samples over time
        for (let i = 0; i < 10; i++) {
            // Create and destroy components
            await this.runner.evaluate(() => {
                if (window.createAndDestroyComponents) {
                    window.createAndDestroyComponents(50);
                }
            });

            await this.sleep(500);

            const memory = await this.runner.getMemoryMetrics();
            samples.push(memory.jsHeapSize);
        }

        // Analyze trend
        const trend = this.analyzeTrend(samples);
        const detected = trend.slope > 100000; // Growing > 100KB per iteration

        return {
            detected,
            trend: trend.slope,
            samples,
            message: detected ? 'Potential memory leak detected' : 'No leaks detected'
        };
    }

    /**
     * Measure DOM nodes count
     */
    async measureDOMNodes(framework) {
        console.log('  → Measuring DOM nodes...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        const counts = await this.runner.evaluate(() => {
            const allNodes = document.querySelectorAll('*').length;
            const componentNodes = document.querySelectorAll('[data-component]').length;
            const textNodes = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT
            );

            let textCount = 0;
            while (textNodes.nextNode()) textCount++;

            return {
                total: allNodes,
                components: componentNodes,
                text: textCount
            };
        });

        return counts;
    }

    /**
     * Analyze trend in data
     */
    analyzeTrend(data) {
        const n = data.length;
        const xMean = (n - 1) / 2;
        const yMean = data.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (i - xMean) * (data[i] - yMean);
            denominator += Math.pow(i - xMean, 2);
        }

        const slope = numerator / denominator;
        const intercept = yMean - slope * xMean;

        return { slope, intercept };
    }

    /**
     * Get framework URL
     */
    getFrameworkURL(framework) {
        const port = 3000 + config.frameworks.indexOf(framework);
        return `http://localhost:${port}`;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
    const benchmark = new MemoryUsageBenchmark();
    const results = await benchmark.run('kalxjs');
    console.log('\n✅ Results:', JSON.stringify(results, null, 2));
}

export default MemoryUsageBenchmark;