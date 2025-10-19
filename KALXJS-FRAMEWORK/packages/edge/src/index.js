/**
 * @kalxjs/edge
 * Edge Computing support for KalxJS
 * Optimized for Cloudflare Workers, Deno Deploy, Vercel Edge, etc.
 */

// Export all edge modules
export * from './runtime-detector.js';
export * from './edge-renderer.js';
export * from './cache-strategies.js';
export * from './middleware.js';
export * from './geo-routing.js';

// Platform-specific exports
export * from './cloudflare/index.js';
export * from './deno/index.js';
export * from './vercel/index.js';

// Re-export core for convenience
export { ref, reactive, computed } from '@kalxjs/core';

export default {
    name: '@kalxjs/edge',
    version: '1.0.0'
};