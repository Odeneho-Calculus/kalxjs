import { defineConfig } from 'vite';
import kalxSFC from '@kalxjs/compiler/vite-plugin';
import path from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: true
  },
  plugins: [
    kalxSFC() // Add support for .klx single file components
  ],
  optimizeDeps: {
    include: [
      '@kalxjs/core',
      '@kalxjs/compiler',
      '@kalxjs/router',
      '@kalxjs/state',
      '@kalxjs/ai',
      '@kalxjs/api',
      '@kalxjs/composition',
      '@kalxjs/performance',
      '@kalxjs/plugins',
    ]
  },
  // Add .klx files to assetsInclude to prevent Vite from trying to process them as JS
  assetsInclude: ['**/*.klx'],
  // Custom handling for .klx files
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});