import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: './',
    publicDir: 'public',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './app'),
            '@core': path.resolve(__dirname, './app/core'),
            '@components': path.resolve(__dirname, './app/components'),
            '@assets': path.resolve(__dirname, './app/assets'),
            '@config': path.resolve(__dirname, './config')
        }
    },
    server: {
        port: 3000,
        open: true
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        minify: 'terser',
        sourcemap: true
    },
    test: {
        globals: true,
        environment: "jsdom"
    },
    esbuild: {
        loader: {
            '.js': 'jsx'
        },
        jsxFactory: 'h',
        jsxFragment: 'Fragment'
    },
    optimizeDeps: {
        include: ['@kalxjs/core', '@kalxjs/router', '@kalxjs/state'],
        esbuildOptions: {
            loader: {
                '.js': 'jsx'
            }
        }
    }
});
