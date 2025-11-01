import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
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
    host: '0.0.0.0', // Allow connections from all network interfaces
    open: true,
    strictPort: false, // Try another port if 3000 is in use
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true // Improve file watching reliability
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@kalxjs/core', '@kalxjs/router', '@kalxjs/state'],
          utils: ['@kalxjs/utils', '@kalxjs/performance']
        }
      }
    }
  },
  test: {
    globals: true,
    environment: "jsdom"
  }
});