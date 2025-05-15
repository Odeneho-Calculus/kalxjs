/**
 * KALXJS Framework Configuration
 * 
 * This file contains configuration options for the KALXJS Framework.
 */

export default {
    // Build configuration
    build: {
        // Output directory for built files
        outDir: 'dist',

        // Source directory
        srcDir: 'src',

        // Whether to minify output
        minify: process.env.NODE_ENV === 'production',

        // Whether to generate source maps
        sourcemap: process.env.NODE_ENV !== 'production',

        // Bundle formats to generate
        formats: ['esm', 'cjs', 'iife'],

        // External dependencies
        external: [],

        // Plugins for the build process
        plugins: []
    },

    // Development server configuration
    server: {
        // Port to run the dev server on
        port: 3000,

        // Host to bind the server to
        host: 'localhost',

        // Whether to open the browser automatically
        open: true,

        // Proxy configuration for API requests
        proxy: {
            // '/api': 'http://localhost:8080'
        }
    },

    // Framework plugins
    plugins: [
        // Add your plugins here
    ],

    // Compiler options
    compiler: {
        // Whether to enable template compilation caching
        cache: true,

        // Custom delimiters for template interpolation
        delimiters: ['{{', '}}'],

        // Whether to preserve whitespace in templates
        whitespace: 'condense'
    },

    // Performance options
    performance: {
        // Whether to enable performance tracking
        tracking: process.env.NODE_ENV === 'development',

        // Performance budgets
        budgets: {
            assets: 300 * 1024, // 300kb
            chunks: 200 * 1024, // 200kb
            modules: 100 * 1024 // 100kb
        }
    },

    // DevTools options
    devtools: {
        // Whether to enable devtools
        enabled: process.env.NODE_ENV !== 'production',

        // Whether to enable performance profiling
        profiling: false
    }
};