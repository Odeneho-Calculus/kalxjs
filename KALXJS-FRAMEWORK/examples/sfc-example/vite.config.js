import { defineConfig } from 'vite';
import enhancedKalPlugin from '../../packages/compiler/src/enhanced-vite-plugin.js';
import path from 'path';

export default defineConfig({
    plugins: [
        enhancedKalPlugin({
            // Enhanced plugin options
            include: /\.kal$/,
            exclude: /node_modules/,

            // Compiler options
            optimizeImports: true,
            generateSourceMaps: true,
            strictMode: false,
            preserveWhitespace: false,
            scopedCSS: true,
            hotReload: true,

            // Development options
            verbose: true
        })
    ],
    resolve: {
        alias: {
            '@kalxjs/core': path.resolve(__dirname, '../../packages/core/src/index.js')
        }
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html')
            }
        }
    },
    server: {
        port: 3000,
        open: true
    }
});