/**
 * KALXJS DevTools Module
 * Complete devtools API and utilities
 *
 * @module @kalxjs/devtools
 */

// Core API
export {
    DevToolsHook,
    initDevTools,
    getDevToolsHook
} from './devtools-api.js';

// Component Inspector
export {
    ComponentInspector,
    createInspector
} from './component-inspector.js';

// Performance Profiler
export {
    PerformanceProfiler,
    createProfiler
} from './performance-profiler.js';

/**
 * Initialize all devtools features
 *
 * @param {object} options - Initialization options
 * @returns {object} - DevTools instance
 */
export function createDevTools(options = {}) {
    const {
        enabled = process.env.NODE_ENV !== 'production',
        inspector = true,
        profiler = true
    } = options;

    if (!enabled) {
        return null;
    }

    const hook = initDevTools();

    const devtools = {
        hook,
        inspector: inspector ? createInspector() : null,
        profiler: profiler ? createProfiler() : null
    };

    // Auto-connect
    if (hook) {
        hook.connect();
    }

    return devtools;
}

export default createDevTools;
