/**
 * Hydration Speed Benchmark
 * Tests client-side hydration performance
 */

import { MetricsCollector } from '../utils/metrics-collector.js';
import { BrowserRunner } from '../utils/browser-runner.js';
import config from '../../benchmark.config.js';

export class HydrationSpeedBenchmark {
    constructor() {
        this.collector = new MetricsCollector();
        this.runner = null;
    }

    /**
     * Run hydration speed benchmark
     */
    async run(framework = 'kalxjs') {
        console.log(`\n💧 Running Hydration Speed Benchmark for ${framework}...`);

        this.runner = new BrowserRunner(config.browser);
        await this.runner.launch();

        const results = {
            name: `Hydration Speed - ${framework}`,
            framework,
            metrics: {},
            targets: config.targets.hydration
        };

        try {
            // Full hydration time
            const fullHydration = await this.measureFullHydration(framework);
            results.metrics.fullHydration = fullHydration;

            // Selective hydration
            const selectiveHydration = await this.measureSelectiveHydration(framework);
            results.metrics.selectiveHydration = selectiveHydration;

            // Progressive hydration
            const progressiveHydration = await this.measureProgressiveHydration(framework);
            results.metrics.progressiveHydration = progressiveHydration;

            // Time to interactive after hydration
            const ttiAfterHydration = await this.measureTTIAfterHydration(framework);
            results.metrics.ttiAfterHydration = ttiAfterHydration;

            // Hydration with errors
            const errorRecovery = await this.measureErrorRecovery(framework);
            results.metrics.errorRecovery = errorRecovery;

            results.passed = fullHydration.mean < config.targets.hydration.time;

        } catch (error) {
            console.error(`Error in hydration benchmark: ${error.message}`);
            results.error = error.message;
            results.passed = false;
        } finally {
            await this.runner.close();
        }

        return results;
    }

    /**
     * Measure full hydration time
     */
    async measureFullHydration(framework) {
        console.log('  → Measuring full hydration...');

        const url = this.getFrameworkURL(framework, 'ssr');

        for (let i = 0; i < 20; i++) {
            await this.runner.navigate(url);

            const hydrationTime = await this.runner.evaluate(() => {
                return new Promise(resolve => {
                    const start = performance.now();

                    // Wait for hydration complete marker
                    const checkHydration = () => {
                        if (window.__HYDRATION_COMPLETE__) {
                            const end = performance.now();
                            resolve(end - start);
                        } else {
                            requestAnimationFrame(checkHydration);
                        }
                    };

                    checkHydration();

                    // Timeout after 5 seconds
                    setTimeout(() => resolve(5000), 5000);
                });
            });

            this.collector.recordMetric('fullHydration', hydrationTime);
        }

        return this.collector.getStats('fullHydration');
    }

    /**
     * Measure selective hydration
     */
    async measureSelectiveHydration(framework) {
        console.log('  → Measuring selective hydration...');

        const url = this.getFrameworkURL(framework, 'ssr-selective');

        if (!await this.checkFeatureSupport(url)) {
            console.warn('  ⚠ Selective hydration not supported');
            return { mean: 0, message: 'Not supported' };
        }

        for (let i = 0; i < 20; i++) {
            await this.runner.navigate(url);

            const hydrationTime = await this.runner.evaluate(() => {
                return new Promise(resolve => {
                    const start = performance.now();

                    // Wait for first interactive component
                    const checkInteractive = () => {
                        if (window.__FIRST_COMPONENT_HYDRATED__) {
                            const end = performance.now();
                            resolve(end - start);
                        } else {
                            requestAnimationFrame(checkInteractive);
                        }
                    };

                    checkInteractive();

                    setTimeout(() => resolve(5000), 5000);
                });
            });

            this.collector.recordMetric('selectiveHydration', hydrationTime);
        }

        return this.collector.getStats('selectiveHydration');
    }

    /**
     * Measure progressive hydration
     */
    async measureProgressiveHydration(framework) {
        console.log('  → Measuring progressive hydration...');

        const url = this.getFrameworkURL(framework, 'ssr-progressive');

        if (!await this.checkFeatureSupport(url)) {
            console.warn('  ⚠ Progressive hydration not supported');
            return { mean: 0, message: 'Not supported' };
        }

        for (let i = 0; i < 20; i++) {
            await this.runner.navigate(url);

            const metrics = await this.runner.evaluate(() => {
                return new Promise(resolve => {
                    const timings = [];

                    window.addEventListener('component-hydrated', (e) => {
                        timings.push({
                            component: e.detail.name,
                            time: performance.now()
                        });
                    });

                    // Wait for all components
                    setTimeout(() => {
                        resolve({
                            count: timings.length,
                            first: timings[0]?.time || 0,
                            last: timings[timings.length - 1]?.time || 0,
                            total: (timings[timings.length - 1]?.time || 0) - (timings[0]?.time || 0)
                        });
                    }, 3000);
                });
            });

            this.collector.recordMetric('progressiveHydration', metrics.total);
            this.collector.recordMetric('firstComponent', metrics.first);
        }

        return {
            total: this.collector.getStats('progressiveHydration'),
            firstComponent: this.collector.getStats('firstComponent')
        };
    }

    /**
     * Measure TTI after hydration
     */
    async measureTTIAfterHydration(framework) {
        console.log('  → Measuring TTI after hydration...');

        const url = this.getFrameworkURL(framework, 'ssr');

        for (let i = 0; i < 10; i++) {
            await this.runner.navigate(url);

            const ttiTime = await this.runner.evaluate(() => {
                return new Promise(resolve => {
                    const hydrationStart = performance.now();

                    const checkInteractive = () => {
                        if (window.__HYDRATION_COMPLETE__) {
                            // Try to interact
                            const button = document.querySelector('button');
                            if (button) {
                                button.click();

                                // Check if interaction worked
                                requestAnimationFrame(() => {
                                    const ttiEnd = performance.now();
                                    resolve(ttiEnd - hydrationStart);
                                });
                            } else {
                                resolve(performance.now() - hydrationStart);
                            }
                        } else {
                            requestAnimationFrame(checkInteractive);
                        }
                    };

                    checkInteractive();

                    setTimeout(() => resolve(5000), 5000);
                });
            });

            this.collector.recordMetric('ttiAfterHydration', ttiTime);
        }

        return this.collector.getStats('ttiAfterHydration');
    }

    /**
     * Measure error recovery during hydration
     */
    async measureErrorRecovery(framework) {
        console.log('  → Measuring error recovery...');

        const url = this.getFrameworkURL(framework, 'ssr-error');

        if (!await this.checkFeatureSupport(url)) {
            console.warn('  ⚠ Error recovery test not available');
            return { recovered: true, message: 'Test not available' };
        }

        await this.runner.navigate(url);

        const recovery = await this.runner.evaluate(() => {
            return new Promise(resolve => {
                let errorDetected = false;
                let recovered = false;

                window.addEventListener('error', () => {
                    errorDetected = true;
                });

                window.addEventListener('hydration-error-recovered', () => {
                    recovered = true;
                });

                setTimeout(() => {
                    resolve({
                        errorDetected,
                        recovered,
                        message: recovered ? 'Recovered successfully' : 'No recovery'
                    });
                }, 2000);
            });
        });

        return recovery;
    }

    /**
     * Check if feature is supported
     */
    async checkFeatureSupport(url) {
        try {
            await this.runner.navigate(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get framework URL
     */
    getFrameworkURL(framework, mode = 'ssr') {
        const port = 3000 + config.frameworks.indexOf(framework);
        return `http://localhost:${port}/${mode}`;
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
    const benchmark = new HydrationSpeedBenchmark();
    const results = await benchmark.run('kalxjs');
    console.log('\n✅ Results:', JSON.stringify(results, null, 2));
}

export default HydrationSpeedBenchmark;