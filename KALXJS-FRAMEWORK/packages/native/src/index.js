/**
 * @kalxjs/native
 * Native Mobile and Desktop support for KalxJS
 * Provides React Native-like API with cross-platform capabilities
 */

// Export all native modules
export * from './platform.js';
export * from './components.js';
export * from './api.js';
export * from './bridge.js';
export * from './hot-reload.js';

// Platform-specific exports
export * from './electron/index.js';
export * from './tauri/index.js';
export * from './mobile/index.js';

// Re-export core for convenience
export { ref, reactive, computed, watch } from '@kalxjs/core';

export default {
    name: '@kalxjs/native',
    version: '2.0.0'
};