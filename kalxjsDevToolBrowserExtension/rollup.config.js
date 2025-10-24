import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import css from 'rollup-plugin-css-only';
import { terser } from 'rollup-plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

const baseConfig = {
    external: [],
    plugins: [
        nodeResolve({
            browser: true,
            preferBuiltins: false
        }),
        commonjs(),
        replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            preventAssignment: true
        }),
        css({ output: 'build/styles/bundle.css' }),
        copy({
            targets: [
                { src: 'manifest.json', dest: 'build' },
                { src: 'src/devtools/devtools.html', dest: 'build/devtools' },
                { src: 'src/devtools/panel/panel.html', dest: 'build/devtools/panel' },
                { src: 'src/devtools/panel/panel.css', dest: 'build/devtools/panel' },
                { src: 'src/assets/**/*', dest: 'build' }
            ]
        }),
        ...(isProduction ? [terser()] : [])
    ]
};

export default [
    // Background Service Worker
    {
        ...baseConfig,
        input: 'src/background/service-worker.js',
        output: {
            file: 'build/background/service-worker.js',
            format: 'es'
        }
    },

    // Content Script
    {
        ...baseConfig,
        input: 'src/content-script/content.js',
        output: {
            file: 'build/content-script/content.js',
            format: 'iife'
        }
    },

    // Injected Script
    {
        ...baseConfig,
        input: 'src/content-script/injected.js',
        output: {
            file: 'build/content-script/injected.js',
            format: 'iife'
        }
    },

    // DevTools Page
    {
        ...baseConfig,
        input: 'src/devtools/devtools.js',
        output: {
            file: 'build/devtools/devtools.js',
            format: 'es'
        }
    },

    // DevTools Panel
    {
        ...baseConfig,
        input: 'src/devtools/panel/panel.js',
        output: {
            file: 'build/devtools/panel/panel.js',
            format: 'es'
        }
    }
];