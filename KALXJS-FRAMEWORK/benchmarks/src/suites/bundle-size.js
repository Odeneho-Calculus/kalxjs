/**
 * Bundle Size Benchmark
 * Analyzes and compares bundle sizes across frameworks
 */

import fs from 'fs/promises';
import path from 'path';
import gzipSize from 'gzip-size';
import { MetricsCollector } from '../utils/metrics-collector.js';
import config from '../../benchmark.config.js';

export class BundleSizeBenchmark {
    constructor() {
        this.collector = new MetricsCollector();
    }

    /**
     * Run bundle size benchmark
     */
    async run(framework = 'kalxjs') {
        console.log(`\n📦 Running Bundle Size Benchmark for ${framework}...`);

        const results = {
            name: `Bundle Size - ${framework}`,
            framework,
            metrics: {},
            targets: config.targets.bundleSize
        };

        try {
            // Get bundle paths
            const bundles = await this.findBundles(framework);

            if (bundles.length === 0) {
                throw new Error(`No bundles found for ${framework}`);
            }

            // Analyze each bundle
            const analysis = await this.analyzeBundles(bundles);

            results.metrics = {
                raw: analysis.total.raw,
                minified: analysis.total.minified,
                gzipped: analysis.total.gzipped,
                brotli: analysis.total.brotli
            };

            results.breakdown = analysis.breakdown;
            results.files = bundles.length;

            // Check against targets
            results.passed = results.metrics.gzipped < config.targets.bundleSize.gzipped;

            console.log(`  ✓ Raw size: ${this.formatBytes(results.metrics.raw)}`);
            console.log(`  ✓ Gzipped: ${this.formatBytes(results.metrics.gzipped)}`);
            console.log(`  ✓ Files: ${results.files}`);

        } catch (error) {
            console.error(`Error in bundle size benchmark: ${error.message}`);
            results.error = error.message;
            results.passed = false;
        }

        return results;
    }

    /**
     * Find bundle files for a framework
     */
    async findBundles(framework) {
        const basePath = path.join(process.cwd(), 'apps', framework, 'dist');

        try {
            await fs.access(basePath);
        } catch {
            // Try alternative paths
            const altPath = path.join(process.cwd(), '..', 'apps', framework, 'dist');
            try {
                await fs.access(altPath);
                return await this.findFilesRecursive(altPath, /\.(js|css)$/);
            } catch {
                return [];
            }
        }

        return await this.findFilesRecursive(basePath, /\.(js|css)$/);
    }

    /**
     * Find files recursively
     */
    async findFilesRecursive(dir, pattern) {
        const files = [];

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    const subFiles = await this.findFilesRecursive(fullPath, pattern);
                    files.push(...subFiles);
                } else if (pattern.test(entry.name)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Ignore errors for inaccessible directories
        }

        return files;
    }

    /**
     * Analyze bundle files
     */
    async analyzeBundles(bundles) {
        const breakdown = {
            js: { raw: 0, minified: 0, gzipped: 0, brotli: 0, files: [] },
            css: { raw: 0, minified: 0, gzipped: 0, brotli: 0, files: [] },
            vendor: { raw: 0, minified: 0, gzipped: 0, brotli: 0, files: [] },
            chunks: { raw: 0, minified: 0, gzipped: 0, brotli: 0, files: [] }
        };

        for (const bundlePath of bundles) {
            const content = await fs.readFile(bundlePath);
            const stats = await fs.stat(bundlePath);
            const filename = path.basename(bundlePath);
            const ext = path.extname(bundlePath).slice(1);

            const sizes = {
                raw: stats.size,
                minified: content.length,
                gzipped: await gzipSize(content),
                brotli: await this.getBrotliSize(content)
            };

            // Categorize bundle
            let category = ext;
            if (filename.includes('vendor') || filename.includes('node_modules')) {
                category = 'vendor';
            } else if (filename.includes('chunk') || filename.match(/\.[a-f0-9]{8}\./)) {
                category = 'chunks';
            }

            // Add to breakdown
            breakdown[category].raw += sizes.raw;
            breakdown[category].minified += sizes.minified;
            breakdown[category].gzipped += sizes.gzipped;
            breakdown[category].brotli += sizes.brotli;
            breakdown[category].files.push({
                name: filename,
                path: bundlePath,
                ...sizes
            });
        }

        // Calculate totals
        const total = {
            raw: 0,
            minified: 0,
            gzipped: 0,
            brotli: 0
        };

        Object.values(breakdown).forEach(cat => {
            total.raw += cat.raw;
            total.minified += cat.minified;
            total.gzipped += cat.gzipped;
            total.brotli += cat.brotli;
        });

        return { total, breakdown };
    }

    /**
     * Get brotli compressed size
     */
    async getBrotliSize(content) {
        try {
            const { promisify } = await import('util');
            const { brotliCompress } = await import('zlib');
            const compress = promisify(brotliCompress);

            const compressed = await compress(content);
            return compressed.length;
        } catch {
            // If brotli not available, estimate as 85% of gzip
            return Math.floor((await gzipSize(content)) * 0.85);
        }
    }

    /**
     * Analyze tree-shaking effectiveness
     */
    async analyzeTreeShaking(bundles) {
        const unusedCode = [];

        for (const bundlePath of bundles) {
            const content = await fs.readFile(bundlePath, 'utf-8');

            // Look for common patterns of unused code
            const patterns = [
                /\/\*\s*unused\s*\*\//gi,
                /\/\*\s*@__PURE__\s*\*\//gi,
                /\/\/#\s*sourceMappingURL=/gi
            ];

            patterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    unusedCode.push({
                        file: path.basename(bundlePath),
                        pattern: pattern.source,
                        count: matches.length
                    });
                }
            });
        }

        return unusedCode;
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
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
    const benchmark = new BundleSizeBenchmark();
    const results = await benchmark.run('kalxjs');
    console.log('\n✅ Results:', JSON.stringify(results, null, 2));
}

export default BundleSizeBenchmark;