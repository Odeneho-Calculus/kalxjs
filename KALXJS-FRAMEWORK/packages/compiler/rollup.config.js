import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
    // Main package build
    {
        input: 'src/index.js',
        output: [
            {
                file: 'dist/index.cjs.js',
                format: 'cjs',
                exports: 'auto'
            },
            {
                file: 'dist/index.esm.js',
                format: 'es'
            }
        ],
        plugins: [
            nodeResolve(),
            terser()
        ],
        external: ['@babel/core', '@babel/preset-env'],
        onwarn(warning, warn) {
            // Suppress circular dependency warnings
            if (warning.code === 'CIRCULAR_DEPENDENCY') return;
            warn(warning);
        }
    },
    // Vite plugin build
    {
        input: 'vite-plugin/index.js',
        output: [
            {
                file: 'dist/vite-plugin.cjs.js',
                format: 'cjs',
                exports: 'auto'
            },
            {
                file: 'dist/vite-plugin.esm.js',
                format: 'es'
            }
        ],
        plugins: [
            nodeResolve(),
            terser()
        ],
        external: ['../src/index.js', '@kalxjs/compiler'],
        onwarn(warning, warn) {
            if (warning.code === 'CIRCULAR_DEPENDENCY') return;
            warn(warning);
        }
    }
];