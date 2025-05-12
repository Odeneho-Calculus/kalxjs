import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default [
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