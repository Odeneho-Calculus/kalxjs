/**
 * SSR Performance Benchmark
 * Tests server-side rendering performance
 */

import { MetricsCollector } from '../utils/metrics-collector.js';
import config from '../../benchmark.config.js';

export class SSRPerformanceBenchmark {
    constructor() {
        this.collector = new MetricsCollector();
    }

    /**
     * Run SSR performance benchmark
     */
    async run(framework = 'kalxjs') {
        console.log(`\n🖥️  Running SSR Performance Benchmark for ${framework}...`);

        const results = {
            name: `SSR Performance - ${framework}`,
            framework,
            metrics: {},
            targets: config.targets.ssr
        };

        try {
            // Load SSR renderer
            const renderer = await this.loadRenderer(framework);

            if (!renderer) {
                throw new Error(`No SSR renderer found for ${framework}`);
            }

            // HTML generation time
            const htmlGeneration = await this.measureHTMLGeneration(renderer);
            results.metrics.htmlGeneration = htmlGeneration;

            // Stream rendering time
            const streamRender = await this.measureStreamRendering(renderer);
            results.metrics.streamRendering = streamRender;

            // Component-level rendering
            const componentRender = await this.measureComponentRendering(renderer);
            results.metrics.componentRendering = componentRender;

            // Large app rendering
            const largeAppRender = await this.measureLargeAppRendering(renderer);
            results.metrics.largeAppRendering = largeAppRender;

            // HTML size
            const htmlSize = await this.measureHTMLSize(renderer);
            results.metrics.htmlSize = htmlSize;

            results.passed = htmlGeneration.mean < config.targets.ssr.renderTime;

        } catch (error) {
            console.error(`Error in SSR benchmark: ${error.message}`);
            results.error = error.message;
            results.passed = false;
        }

        return results;
    }

    /**
     * Load SSR renderer for framework
     */
    async loadRenderer(framework) {
        try {
            if (framework === 'kalxjs') {
                const { renderToString, renderToStream } = await import('../../../packages/core/src/ssr/index.js');
                return { renderToString, renderToStream };
            } else if (framework === 'react') {
                const { renderToString } = await import('react-dom/server');
                return { renderToString };
            } else if (framework === 'vue') {
                const { renderToString } = await import('@vue/server-renderer');
                return { renderToString };
            }
        } catch (error) {
            console.warn(`  ⚠ Could not load ${framework} SSR renderer: ${error.message}`);
            return null;
        }
    }

    /**
     * Measure HTML generation time
     */
    async measureHTMLGeneration(renderer) {
        console.log('  → Measuring HTML generation time...');

        const testApp = this.createTestApp();

        for (let i = 0; i < config.iterations; i++) {
            this.collector.startTiming('htmlGeneration');

            try {
                const html = await renderer.renderToString(testApp);
            } catch (error) {
                console.warn(`  ⚠ Render error: ${error.message}`);
            }

            this.collector.endTiming('htmlGeneration');
        }

        return this.collector.getStats('htmlGeneration');
    }

    /**
     * Measure stream rendering time
     */
    async measureStreamRendering(renderer) {
        console.log('  → Measuring stream rendering...');

        if (!renderer.renderToStream) {
            console.warn('  ⚠ Stream rendering not supported');
            return { mean: 0, message: 'Not supported' };
        }

        const testApp = this.createTestApp();

        for (let i = 0; i < 20; i++) {
            this.collector.startTiming('streamRender');

            try {
                const stream = await renderer.renderToStream(testApp);

                // Consume stream
                await this.consumeStream(stream);
            } catch (error) {
                console.warn(`  ⚠ Stream error: ${error.message}`);
            }

            this.collector.endTiming('streamRender');
        }

        return this.collector.getStats('streamRender');
    }

    /**
     * Measure component-level rendering
     */
    async measureComponentRendering(renderer) {
        console.log('  → Measuring component rendering...');

        const results = {};

        // Test different component types
        const componentTypes = ['simple', 'stateful', 'withChildren', 'dynamic'];

        for (const type of componentTypes) {
            const component = this.createComponentByType(type);

            for (let i = 0; i < 50; i++) {
                this.collector.startTiming(`component_${type}`);

                try {
                    await renderer.renderToString(component);
                } catch (error) {
                    console.warn(`  ⚠ Component render error: ${error.message}`);
                }

                this.collector.endTiming(`component_${type}`);
            }

            results[type] = this.collector.getStats(`component_${type}`);
        }

        return results;
    }

    /**
     * Measure large app rendering
     */
    async measureLargeAppRendering(renderer) {
        console.log('  → Measuring large app rendering...');

        const largeApp = this.createLargeApp();

        for (let i = 0; i < 10; i++) {
            this.collector.startTiming('largeApp');

            try {
                await renderer.renderToString(largeApp);
            } catch (error) {
                console.warn(`  ⚠ Large app render error: ${error.message}`);
            }

            this.collector.endTiming('largeApp');
        }

        return this.collector.getStats('largeApp');
    }

    /**
     * Measure HTML size
     */
    async measureHTMLSize(renderer) {
        console.log('  → Measuring HTML size...');

        const testApp = this.createTestApp();

        try {
            const html = await renderer.renderToString(testApp);
            const size = Buffer.byteLength(html, 'utf8');

            this.collector.recordMetric('htmlSize', size);

            return {
                bytes: size,
                kb: (size / 1024).toFixed(2),
                message: `${(size / 1024).toFixed(2)} KB`
            };
        } catch (error) {
            console.warn(`  ⚠ Size measurement error: ${error.message}`);
            return { bytes: 0, message: 'Error' };
        }
    }

    /**
     * Create test app
     */
    createTestApp() {
        // Return a simple app structure
        return {
            type: 'div',
            props: { id: 'app' },
            children: [
                {
                    type: 'header',
                    children: [{ type: 'h1', children: ['Test App'] }]
                },
                {
                    type: 'main',
                    children: Array.from({ length: 100 }, (_, i) => ({
                        type: 'div',
                        props: { key: i },
                        children: [`Item ${i}`]
                    }))
                }
            ]
        };
    }

    /**
     * Create component by type
     */
    createComponentByType(type) {
        switch (type) {
            case 'simple':
                return { type: 'div', children: ['Simple Component'] };

            case 'stateful':
                return {
                    type: 'div',
                    props: { 'data-state': 'active' },
                    children: ['Stateful Component']
                };

            case 'withChildren':
                return {
                    type: 'div',
                    children: Array.from({ length: 10 }, (_, i) => ({
                        type: 'span',
                        children: [`Child ${i}`]
                    }))
                };

            case 'dynamic':
                return {
                    type: 'div',
                    children: [
                        { type: 'h2', children: ['Dynamic'] },
                        { type: 'p', children: ['Content'] }
                    ]
                };

            default:
                return { type: 'div', children: ['Component'] };
        }
    }

    /**
     * Create large app
     */
    createLargeApp() {
        return {
            type: 'div',
            props: { id: 'app' },
            children: Array.from({ length: 1000 }, (_, i) => ({
                type: 'div',
                props: { key: i, className: 'item' },
                children: [
                    { type: 'h3', children: [`Item ${i}`] },
                    { type: 'p', children: ['Lorem ipsum dolor sit amet'] }
                ]
            }))
        };
    }

    /**
     * Consume stream
     */
    async consumeStream(stream) {
        return new Promise((resolve, reject) => {
            let html = '';

            if (stream.on) {
                // Node.js stream
                stream.on('data', chunk => { html += chunk; });
                stream.on('end', () => resolve(html));
                stream.on('error', reject);
            } else if (stream.getReader) {
                // Web stream
                const reader = stream.getReader();
                const decoder = new TextDecoder();

                const pump = () => {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            resolve(html);
                            return;
                        }
                        html += decoder.decode(value);
                        pump();
                    }).catch(reject);
                };

                pump();
            } else {
                reject(new Error('Unknown stream type'));
            }
        });
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
    const benchmark = new SSRPerformanceBenchmark();
    const results = await benchmark.run('kalxjs');
    console.log('\n✅ Results:', JSON.stringify(results, null, 2));
}

export default SSRPerformanceBenchmark;