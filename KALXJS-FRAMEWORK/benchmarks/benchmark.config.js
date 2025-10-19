/**
 * Benchmark Configuration
 * Centralized configuration for all benchmarks
 */

export default {
    // General settings
    iterations: 100,
    warmupIterations: 10,

    // Test data sizes
    dataSizes: {
        small: 100,
        medium: 1000,
        large: 10000,
        xlarge: 100000
    },

    // Target frameworks
    frameworks: ['kalxjs', 'react', 'vue', 'svelte'],

    // Performance targets
    targets: {
        bundleSize: {
            raw: 200000,        // 200KB
            minified: 100000,   // 100KB
            gzipped: 50000      // 50KB
        },
        performance: {
            tti: 2000,          // Time to Interactive (ms)
            fcp: 1000,          // First Contentful Paint (ms)
            lcp: 2500,          // Largest Contentful Paint (ms)
            cls: 0.1,           // Cumulative Layout Shift
            fid: 100,           // First Input Delay (ms)
            memory: 52428800    // 50MB in bytes
        },
        ssr: {
            renderTime: 50,     // SSR render time (ms)
            htmlSize: 100000,   // HTML size (bytes)
            streamTime: 100     // Stream completion time (ms)
        },
        hydration: {
            time: 500,          // Hydration time (ms)
            interactive: 1000   // Time to interactive after hydration (ms)
        }
    },

    // Browser settings
    browser: {
        headless: true,
        viewport: {
            width: 1920,
            height: 1080
        },
        throttling: {
            cpu: 4,             // CPU slowdown multiplier
            network: '4G'       // Network profile
        }
    },

    // Report settings
    report: {
        format: ['json', 'html', 'console'],
        outputDir: './reports',
        compare: true,
        charts: true
    },

    // Real-world app settings
    realWorld: {
        apps: ['todo', 'dashboard', 'blog'],
        interactions: 50,    // Number of user interactions to simulate
        duration: 60000      // Test duration (ms)
    }
};