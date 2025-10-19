/**
 * Startup Time Benchmark
 * Measures framework initialization and bootstrap performance
 */

import { MetricsCollector } from '../utils/metrics-collector.js';
import { BrowserRunner } from '../utils/browser-runner.js';
import config from '../../benchmark.config.js';

export class StartupTimeBenchmark {
    constructor() {
        this.collector = new MetricsCollector();
        this.runner = null;
    }

    /**
     * Run startup benchmark
     */
    async run(framework = 'kalxjs') {
        console.log(`\n🚀 Running Startup Time Benchmark for ${framework}...`);

        this.runner = new BrowserRunner(config.browser);
        await this.runner.launch();

        const results = {
            name: `Startup Time - ${framework}`,
            framework,
            metrics: {},
            targets: config.targets.performance
        };

        try {
            // Cold start benchmark
            const coldStart = await this.measureColdStart(framework);
            results.metrics.coldStart = coldStart;

            // Warm start benchmark
            const warmStart = await this.measureWarmStart(framework);
            results.metrics.warmStart = warmStart;

            // Framework initialization time
            const initTime = await this.measureInitialization(framework);
            results.metrics.initTime = initTime;

            // Time to first render
            const firstRender = await this.measureFirstRender(framework);
            results.metrics.firstRender = firstRender;

            // Time to interactive
            const tti = await this.measureTimeToInteractive(framework);
            results.metrics.tti = tti;

            results.passed = tti < config.targets.performance.tti;

        } catch (error) {
            console.error(`Error in startup benchmark: ${error.message}`);
            results.error = error.message;
            results.passed = false;
        } finally {
            await this.runner.close();
        }

        return results;
    }

    /**
     * Measure cold start time
     */
    async measureColdStart(framework) {
        console.log('  → Measuring cold start...');

        for (let i = 0; i < config.iterations; i++) {
            const url = this.getFrameworkURL(framework);
            this.collector.startTiming('coldStart');

            await this.runner.navigate(url, 'domcontentloaded');

            const loadTime = this.collector.endTiming('coldStart');

            // Clear cache for true cold start
            await this.runner.evaluate(() => {
                if ('caches' in window) {
                    caches.keys().then(names => names.forEach(name => caches.delete(name)));
                }
            });
        }

        return this.collector.getStats('coldStart');
    }

    /**
     * Measure warm start time
     */
    async measureWarmStart(framework) {
        console.log('  → Measuring warm start...');

        // Prime the cache
        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        for (let i = 0; i < config.iterations; i++) {
            this.collector.startTiming('warmStart');

            await this.runner.navigate(url, 'domcontentloaded');

            this.collector.endTiming('warmStart');
        }

        return this.collector.getStats('warmStart');
    }

    /**
     * Measure framework initialization time
     */
    async measureInitialization(framework) {
        console.log('  → Measuring initialization time...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        const initTime = await this.runner.evaluate(() => {
            // Framework-specific initialization markers
            if (window.__KALXJS_INIT_START__ && window.__KALXJS_INIT_END__) {
                return window.__KALXJS_INIT_END__ - window.__KALXJS_INIT_START__;
            }

            // Fallback to performance timing
            const perfData = performance.getEntriesByType('navigation')[0];
            return perfData.domInteractive - perfData.fetchStart;
        });

        this.collector.recordMetric('initTime', initTime);

        return this.collector.getStats('initTime');
    }

    /**
     * Measure time to first render
     */
    async measureFirstRender(framework) {
        console.log('  → Measuring time to first render...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        const firstRender = await this.runner.evaluate(() => {
            const paintEntries = performance.getEntriesByType('paint');
            const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            return fcp ? fcp.startTime : 0;
        });

        this.collector.recordMetric('firstRender', firstRender);

        return this.collector.getStats('firstRender');
    }

    /**
     * Measure time to interactive
     */
    async measureTimeToInteractive(framework) {
        console.log('  → Measuring time to interactive...');

        const url = this.getFrameworkURL(framework);
        await this.runner.navigate(url);

        // Use Lighthouse to get accurate TTI
        try {
            const lighthouseResult = await this.runner.runLighthouse(url);
            const tti = lighthouseResult.metrics.tti;

            this.collector.recordMetric('tti', tti);

            return this.collector.getStats('tti');
        } catch (error) {
            console.warn('  ⚠ Lighthouse TTI measurement failed, using fallback');

            // Fallback: measure DOM interactive time
            const tti = await this.runner.evaluate(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                return perfData.domInteractive;
            });

            this.collector.recordMetric('tti', tti);
            return this.collector.getStats('tti');
        }
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
    const benchmark = new StartupTimeBenchmark();
    const results = await benchmark.run('kalxjs');
    console.log('\n✅ Results:', JSON.stringify(results, null, 2));
}

export default StartupTimeBenchmark;