import { defineConfig } from 'vite';
import kalPlugin from '../../packages/compiler/src/vite-plugin-kal.js';
import path from 'path';

export default defineConfig({
    plugins: [
        kalPlugin({
            // Plugin options
            // You can customize the behavior of the plugin here
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
        port: 3001, // Using a different port than the SFC example
        open: true
    }
});