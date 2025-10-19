import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@kalxjs/core': path.resolve(__dirname, '../../packages/core/src/index.js'),
      '@kalxjs/router': path.resolve(__dirname, '../../packages/router/src/index.js'),
      '@kalxjs/composition': path.resolve(__dirname, '../../packages/composition/src/index.js'),
    },
  },
});
