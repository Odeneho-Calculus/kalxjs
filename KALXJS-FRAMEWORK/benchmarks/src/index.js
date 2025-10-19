/**
 * KALXJS Performance Benchmarks
 * Main entry point for running all benchmarks
 */

import { StartupTimeBenchmark } from './suites/startup-time.js';
import { BundleSizeBenchmark } from './suites/bundle-size.js';
import { MemoryUsageBenchmark } from './suites/memory-usage.js';
import { RuntimePerformanceBenchmark } from './suites/runtime-performance.js';
import { SSRPerformanceBenchmark } from './suites/ssr-performance.js';
import { HydrationSpeedBenchmark } from './suites/hydration-speed.js';
import { UpdatePerformanceBenchmark } from './suites/update-performance.js';
import { ReportGenerator } from './utils/report-generator.js';
import config from '../benchmark.config.js';

class BenchmarkRunner {
    constructor(options = {}) {
        this.options = {
            framework: options.framework || 'kalxjs',
            compare: options.compare || false,
            suites: options.suites || 'all',
            ...options
        };

        this.reportGenerator = new ReportGenerator();
    }

    /**
     * Run all benchmarks
     */
    async runAll() {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║         KALXJS PERFORMANCE BENCHMARK SUITE v1.0            ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        const frameworks = this.options.compare ? config.frameworks : [this.options.framework];

        for (const framework of frameworks) {
            console.log(`\n🎯 Benchmarking ${framework.toUpperCase()}...`);
            console.log('─'.repeat(60));

            const results = await this.runSuitesForFramework(framework);

            // Add results to report
            results.forEach(result => {
                this.reportGenerator.addResult(result);
            });
        }

        // Generate reports
        console.log('\n📊 Generating reports...');
        const reportPaths = await this.reportGenerator.saveAll();

        console.log('\n✅ Benchmark complete!');
        console.log(`\n📄 Reports saved:`);
        console.log(`  - JSON: ${reportPaths.json}`);
        console.log(`  - HTML: ${reportPaths.html}`);

        return this.reportGenerator.results;
    }

    /**
     * Run suites for a framework
     */
    async runSuitesForFramework(framework) {
        const results = [];
        const suites = this.getSuitesToRun();

        for (const suite of suites) {
            try {
                const result = await this.runSuite(suite, framework);
                results.push(result);

                const status = result.passed ? '✓ PASS' : '✗ FAIL';
                console.log(`  ${status} - ${result.name}`);
            } catch (error) {
                console.error(`  ✗ ERROR - ${suite}: ${error.message}`);
                results.push({
                    name: suite,
                    framework,
                    error: error.message,
                    passed: false
                });
            }
        }

        return results;
    }

    /**
     * Run a single suite
     */
    async runSuite(suiteName, framework) {
        const benchmarks = {
            'startup': StartupTimeBenchmark,
            'bundle': BundleSizeBenchmark,
            'memory': MemoryUsageBenchmark,
            'runtime': RuntimePerformanceBenchmark,
            'ssr': SSRPerformanceBenchmark,
            'hydration': HydrationSpeedBenchmark,
            'update': UpdatePerformanceBenchmark
        };

        const BenchmarkClass = benchmarks[suiteName];
        if (!BenchmarkClass) {
            throw new Error(`Unknown benchmark suite: ${suiteName}`);
        }

        const benchmark = new BenchmarkClass();
        return await benchmark.run(framework);
    }

    /**
     * Get suites to run
     */
    getSuitesToRun() {
        if (this.options.suites === 'all') {
            return ['startup', 'bundle', 'memory', 'runtime', 'ssr', 'hydration', 'update'];
        }

        if (Array.isArray(this.options.suites)) {
            return this.options.suites;
        }

        return [this.options.suites];
    }

    /**
     * Run specific benchmark suite
     */
    async runSuite(suiteName, framework = 'kalxjs') {
        console.log(`\n🎯 Running ${suiteName} benchmark for ${framework}...`);

        const benchmarks = {
            'startup': StartupTimeBenchmark,
            'bundle': BundleSizeBenchmark,
            'memory': MemoryUsageBenchmark,
            'runtime': RuntimePerformanceBenchmark,
            'ssr': SSRPerformanceBenchmark,
            'hydration': HydrationSpeedBenchmark,
            'update': UpdatePerformanceBenchmark
        };

        const BenchmarkClass = benchmarks[suiteName];
        if (!BenchmarkClass) {
            throw new Error(`Unknown benchmark suite: ${suiteName}`);
        }

        const benchmark = new BenchmarkClass();
        const result = await benchmark.run(framework);

        this.reportGenerator.addResult(result);

        return result;
    }
}

/**
 * CLI entry point
 */
async function main() {
    const args = process.argv.slice(2);

    const options = {
        framework: 'kalxjs',
        compare: args.includes('--compare'),
        suites: 'all'
    };

    // Parse framework option
    const frameworkIndex = args.indexOf('--framework');
    if (frameworkIndex !== -1 && args[frameworkIndex + 1]) {
        options.framework = args[frameworkIndex + 1];
    }

    // Parse suite option
    const suiteIndex = args.indexOf('--suite');
    if (suiteIndex !== -1 && args[suiteIndex + 1]) {
        options.suites = args[suiteIndex + 1];
    }

    // Check for help
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
KALXJS Performance Benchmarks

Usage:
  npm run bench                    # Run all benchmarks for KALXJS
  npm run bench --compare          # Compare all frameworks
  npm run bench --framework react  # Benchmark specific framework
  npm run bench --suite startup    # Run specific suite

Options:
  --compare              Compare KALXJS with React, Vue, Svelte
  --framework <name>     Benchmark specific framework
  --suite <name>         Run specific benchmark suite
  --help, -h             Show this help message

Available Suites:
  startup                Framework initialization time
  bundle                 Bundle size analysis
  memory                 Memory usage and leak detection
  runtime                Rendering and update performance
  ssr                    Server-side rendering performance
  hydration              Client-side hydration speed
  update                 Reactive update performance
    `);
        process.exit(0);
    }

    const runner = new BenchmarkRunner(options);

    try {
        await runner.runAll();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Benchmark failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { BenchmarkRunner };
export default BenchmarkRunner;