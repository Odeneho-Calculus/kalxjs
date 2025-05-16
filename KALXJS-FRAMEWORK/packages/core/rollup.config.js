import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

// Define environment
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production' || !isDev;

// Define banner for development builds
const devBanner = `/**
 * KalxJS Core - Development Build
 * WARNING: This is a development build with extra debugging.
 * Do not use in production.
 * 
 * Version: ${require('./package.json').version}
 * Build date: ${new Date().toISOString()}
 */`;

// Define terser options with better debugging for development
const terserOptions = isProd ? {
    compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true
    }
} : {
    compress: {
        pure_getters: false,
        sequences: false,
        drop_console: false,
        drop_debugger: false
    },
    mangle: false,
    format: {
        beautify: true,
        comments: 'all'
    }
};

export default [
    // Composition API build
    {
        input: 'src/composition/index.js',
        output: {
            file: 'dist/composition/index.js',
            format: 'es',
            sourcemap: true,
            exports: 'named'
        },
        plugins: [
            nodeResolve()
        ]
    },
    // Development build with debugging enabled
    {
        input: 'src/index.js',
        output: {
            file: 'dist/kalxjs.dev.js',
            format: 'es',
            sourcemap: true,
            exports: 'named',
            banner: devBanner
        },
        plugins: [
            nodeResolve()
        ]
    },
    // ESM build
    {
        input: 'src/index.js',
        output: {
            file: 'dist/kalxjs.esm.js',
            format: 'es',
            sourcemap: true,
            exports: 'named'
        },
        plugins: [
            nodeResolve()
        ]
    },
    // ESM index build for direct imports
    {
        input: 'src/index.js',
        output: {
            file: 'dist/index.esm.js',
            format: 'es',
            sourcemap: true,
            exports: 'named'
        },
        plugins: [
            nodeResolve()
        ]
    },
    // Browser-specific build with all exports
    {
        input: 'src/browser.js',
        output: {
            file: 'dist/browser.esm.js',
            format: 'es',
            sourcemap: true,
            exports: 'named'
        },
        plugins: [
            nodeResolve()
        ]
    },
    // ESM production build (minified)
    {
        input: 'src/index.js',
        output: {
            file: 'dist/kalxjs.esm.min.js',
            format: 'es',
            sourcemap: true
        },
        plugins: [
            nodeResolve(),
            terser()
        ]
    },
    // UMD build
    {
        input: 'src/index.js',
        output: {
            file: 'dist/kalxjs.umd.js',
            format: 'umd',
            name: 'kalxjs',
            sourcemap: true
        },
        plugins: [
            nodeResolve()
        ]
    },
    // UMD production build (minified)
    {
        input: 'src/index.js',
        output: {
            file: 'dist/kalxjs.umd.min.js',
            format: 'umd',
            name: 'kalxjs',
            sourcemap: true
        },
        plugins: [
            nodeResolve(),
            terser()
        ]
    },
    // IIFE build (for direct browser usage)
    {
        input: 'src/index.js',
        output: {
            file: 'dist/kalxjs.iife.js',
            format: 'iife',
            name: 'kalxjs',
            sourcemap: true
        },
        plugins: [
            nodeResolve()
        ]
    },
    // IIFE production build (minified)
    {
        input: 'src/index.js',
        output: {
            file: 'dist/kalxjs.iife.min.js',
            format: 'iife',
            name: 'kalxjs',
            sourcemap: true
        },
        plugins: [
            nodeResolve(),
            terser()
        ]
    }
];