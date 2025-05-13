import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@kalxjs/core': path.resolve(__dirname, './packages/core/src')
        }
    },
    server: {
        port: 3000,
        open: true
    }
});