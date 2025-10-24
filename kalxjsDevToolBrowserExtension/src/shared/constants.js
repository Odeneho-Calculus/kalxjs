/**
 * KALXJS DevTools Extension Constants
 * Shared constants across all extension contexts
 */

// Extension identification
export const EXTENSION_ID = 'kalxjs-devtools';
export const KALXJS_HOOK_NAME = '__KALXJS_DEVTOOLS_HOOK__';
export const KALXJS_DETECTOR_NAME = '__KALXJS_DEVTOOLS_DETECTOR__';

// Message types for cross-context communication
export const MESSAGE_TYPES = {
    // Detection messages
    FRAMEWORK_DETECTED: 'FRAMEWORK_DETECTED',
    FRAMEWORK_UNDETECTED: 'FRAMEWORK_UNDETECTED',

    // DevTools messages
    DEVTOOLS_INIT: 'DEVTOOLS_INIT',
    DEVTOOLS_READY: 'DEVTOOLS_READY',
    DEVTOOLS_DISCONNECT: 'DEVTOOLS_DISCONNECT',

    // Component messages
    COMPONENT_REGISTERED: 'COMPONENT_REGISTERED',
    COMPONENT_UPDATED: 'COMPONENT_UPDATED',
    COMPONENT_UNMOUNTED: 'COMPONENT_UNMOUNTED',
    COMPONENT_SELECTED: 'COMPONENT_SELECTED',

    // State messages
    STATE_CHANGED: 'STATE_CHANGED',
    STATE_INSPECT: 'STATE_INSPECT',
    STATE_UPDATE: 'STATE_UPDATE',

    // Event messages
    EVENT_EMITTED: 'EVENT_EMITTED',
    EVENT_SUBSCRIBE: 'EVENT_SUBSCRIBE',

    // Performance messages
    PERFORMANCE_START: 'PERFORMANCE_START',
    PERFORMANCE_END: 'PERFORMANCE_END',
    PERFORMANCE_MARK: 'PERFORMANCE_MARK',

    // Bridge messages
    BRIDGE_CONNECT: 'BRIDGE_CONNECT',
    BRIDGE_DISCONNECT: 'BRIDGE_DISCONNECT',
    BRIDGE_MESSAGE: 'BRIDGE_MESSAGE'
};

// Event origins for message validation
export const MESSAGE_ORIGINS = {
    CONTENT_SCRIPT: 'content-script',
    INJECTED_SCRIPT: 'injected-script',
    BACKGROUND: 'background',
    DEVTOOLS: 'devtools',
    PANEL: 'panel'
};

// KALXJS framework version compatibility
export const KALXJS_VERSIONS = {
    MIN_SUPPORTED: '2.0.0',
    CURRENT: '2.2.8',
    FEATURES: {
        '2.0.0': ['basic-components', 'state-management'],
        '2.1.0': ['router', 'devtools-hook'],
        '2.2.0': ['performance-profiling', 'component-inspector'],
        '2.2.8': ['time-travel-debugging', 'advanced-profiling']
    }
};

// DevTools panel configuration
export const PANEL_CONFIG = {
    NAME: 'KALXJS',
    ICON_PATH: '/icons/icon-32.svg', // Use available SVG icon
    THEME: {
        LIGHT: 'light',
        DARK: 'dark'
    },
    TABS: {
        COMPONENTS: 'components',
        STATE: 'state',
        EVENTS: 'events',
        PERFORMANCE: 'performance',
        TIMELINE: 'timeline'
    }
};

// Performance thresholds and limits
export const PERFORMANCE_LIMITS = {
    MAX_COMPONENTS: 10000,
    MAX_EVENT_HISTORY: 1000,
    MAX_STATE_HISTORY: 500,
    RENDER_TIME_WARNING: 16, // ms
    RENDER_TIME_CRITICAL: 50, // ms
    MEMORY_WARNING: 100, // MB
    MEMORY_CRITICAL: 250 // MB
};

// Debugging configuration
export const DEBUG_CONFIG = {
    LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
    ENABLE_WARNINGS: process.env.NODE_ENV === 'development',
    ENABLE_PERFORMANCE_TRACKING: true,
    MAX_STACK_TRACE_DEPTH: 10
};

// Storage keys for persistent extension settings
export const STORAGE_KEYS = {
    USER_PREFERENCES: 'kalxjs_devtools_preferences',
    PANEL_STATE: 'kalxjs_devtools_panel_state',
    PERFORMANCE_DATA: 'kalxjs_devtools_performance',
    DEBUG_SETTINGS: 'kalxjs_devtools_debug_settings'
};

// Default user preferences
export const DEFAULT_PREFERENCES = {
    theme: 'auto', // 'light', 'dark', 'auto'
    showPerformanceWarnings: true,
    enableTimeTravel: true,
    maxHistorySize: 100,
    autoSelectComponents: true,
    showInternalComponents: false,
    enableHotReload: true,
    logLevel: 'info'
};

// Error codes for extension errors
export const ERROR_CODES = {
    FRAMEWORK_NOT_DETECTED: 'E001',
    COMMUNICATION_FAILED: 'E002',
    INVALID_MESSAGE_FORMAT: 'E003',
    PERMISSION_DENIED: 'E004',
    DEVTOOLS_INIT_FAILED: 'E005',
    COMPONENT_NOT_FOUND: 'E006',
    STATE_UPDATE_FAILED: 'E007',
    PERFORMANCE_TRACKING_FAILED: 'E008'
};

// Regular expressions for framework detection
export const DETECTION_PATTERNS = {
    KALXJS_GLOBAL: /window\.__KALXJS__|globalThis\.__KALXJS__/,
    KALXJS_IMPORT: /from\s+['"`]@?kalxjs\/core['"`]/,
    KALXJS_REQUIRE: /require\(['"`]@?kalxjs\/core['"`]\)/,
    KALXJS_CDN: /kalxjs[@\.][\w\.-]+\/.*\.js/,
    KALXJS_COMMENT: /\/\*[\s\S]*?kalxjs[\s\S]*?\*\/|\/\/.*kalxjs/i
};

export default {
    EXTENSION_ID,
    KALXJS_HOOK_NAME,
    KALXJS_DETECTOR_NAME,
    MESSAGE_TYPES,
    MESSAGE_ORIGINS,
    KALXJS_VERSIONS,
    PANEL_CONFIG,
    PERFORMANCE_LIMITS,
    DEBUG_CONFIG,
    STORAGE_KEYS,
    DEFAULT_PREFERENCES,
    ERROR_CODES,
    DETECTION_PATTERNS
};