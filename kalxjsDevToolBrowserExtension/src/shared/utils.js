/**
 * KALXJS DevTools Extension Utilities
 * Shared utility functions across all extension contexts
 */

import { DEBUG_CONFIG, ERROR_CODES } from './constants.js';

/**
 * Enhanced logging utility with levels and context
 */
export class Logger {
    constructor(context = 'DevTools') {
        this.context = context;
        this.level = DEBUG_CONFIG.LOG_LEVEL;
    }

    _log(level, message, ...args) {
        if (!this._shouldLog(level)) return;

        const timestamp = new Date().toISOString();
        const prefix = `[KALXJS DevTools][${this.context}][${level.toUpperCase()}] ${timestamp}:`;

        console[level](prefix, message, ...args);
    }

    _shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.level);
        const messageLevelIndex = levels.indexOf(level);

        return messageLevelIndex >= currentLevelIndex;
    }

    debug(message, ...args) { this._log('debug', message, ...args); }
    info(message, ...args) { this._log('info', message, ...args); }
    warn(message, ...args) { this._log('warn', message, ...args); }
    error(message, ...args) { this._log('error', message, ...args); }
}

/**
 * Create a scoped logger instance
 */
export function createLogger(context) {
    return new Logger(context);
}

/**
 * Message validation and sanitization
 */
export function validateMessage(message) {
    if (!message || typeof message !== 'object') {
        return { valid: false, error: 'Invalid message format' };
    }

    const requiredFields = ['type', 'origin', 'data'];
    const missingFields = requiredFields.filter(field => !(field in message));

    if (missingFields.length > 0) {
        return {
            valid: false,
            error: `Missing required fields: ${missingFields.join(', ')}`
        };
    }

    return { valid: true };
}

/**
 * Safe JSON serialization with circular reference handling
 */
export function safeStringify(obj, space = 0) {
    const seen = new WeakSet();

    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular Reference]';
            }
            seen.add(value);
        }

        // Handle functions
        if (typeof value === 'function') {
            return `[Function: ${value.name || 'anonymous'}]`;
        }

        // Handle undefined
        if (value === undefined) {
            return '[Undefined]';
        }

        return value;
    }, space);
}

/**
 * Safe JSON parsing with error handling
 */
export function safeParse(jsonString, defaultValue = null) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        createLogger('Utils').warn('JSON parse failed:', error.message);
        return defaultValue;
    }
}

/**
 * Deep object comparison
 */
export function deepEquals(obj1, obj2) {
    if (obj1 === obj2) return true;

    if (obj1 == null || obj2 == null) return obj1 === obj2;

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        return obj1 === obj2;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every(key =>
        keys2.includes(key) && deepEquals(obj1[key], obj2[key])
    );
}

/**
 * Deep clone with circular reference handling
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;

    const seen = new WeakMap();

    function clone(item) {
        if (item === null || typeof item !== 'object') return item;

        if (seen.has(item)) return seen.get(item);

        let clonedItem;

        if (item instanceof Date) {
            clonedItem = new Date(item.getTime());
        } else if (item instanceof Array) {
            clonedItem = [];
            seen.set(item, clonedItem);
            item.forEach(element => clonedItem.push(clone(element)));
        } else if (item instanceof Object) {
            clonedItem = {};
            seen.set(item, clonedItem);
            Object.keys(item).forEach(key => {
                clonedItem[key] = clone(item[key]);
            });
        }

        return clonedItem;
    }

    return clone(obj);
}

/**
 * Generate unique identifier
 */
export function generateId(prefix = 'kalxjs') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function execution
 */
export function debounce(func, wait, immediate = false) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
        };

        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) func.apply(this, args);
    };
}

/**
 * Throttle function execution
 */
export function throttle(func, limit) {
    let inThrottle;

    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format file size in human readable format
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration in human readable format
 */
export function formatDuration(milliseconds) {
    if (milliseconds < 1000) {
        return `${milliseconds.toFixed(1)}ms`;
    } else if (milliseconds < 60000) {
        return `${(milliseconds / 1000).toFixed(2)}s`;
    } else {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
        return `${minutes}m ${seconds}s`;
    }
}

/**
 * Format timestamp in human readable format
 */
export function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * Check if value is a plain object
 */
export function isPlainObject(value) {
    if (typeof value !== 'object' || value === null) return false;

    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
}

/**
 * Get object path value safely
 */
export function getObjectPath(obj, path, defaultValue = undefined) {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
        if (result == null || typeof result !== 'object') {
            return defaultValue;
        }
        result = result[key];
    }

    return result !== undefined ? result : defaultValue;
}

/**
 * Set object path value safely
 */
export function setObjectPath(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;

    for (const key of keys) {
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }

    current[lastKey] = value;
    return obj;
}

/**
 * Escape HTML for safe display
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Create error object with code
 */
export function createError(code, message, details = {}) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    error.timestamp = Date.now();
    return error;
}

/**
 * Check if extension context is available
 */
export function isExtensionContext() {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
}

/**
 * Check if running in DevTools context
 */
export function isDevToolsContext() {
    return typeof chrome !== 'undefined' && chrome.devtools;
}

/**
 * Check if running in content script context
 */
export function isContentScriptContext() {
    return typeof window !== 'undefined' && typeof chrome !== 'undefined' && chrome.runtime;
}

/**
 * Performance measurement utility
 */
export class PerformanceMonitor {
    constructor() {
        this.marks = new Map();
        this.measures = new Map();
    }

    mark(name) {
        const timestamp = performance.now();
        this.marks.set(name, timestamp);
        return timestamp;
    }

    measure(name, startMark, endMark = null) {
        const endTime = endMark ? this.marks.get(endMark) : performance.now();
        const startTime = this.marks.get(startMark);

        if (startTime === undefined) {
            throw createError(ERROR_CODES.PERFORMANCE_TRACKING_FAILED, `Start mark "${startMark}" not found`);
        }

        const duration = endTime - startTime;
        this.measures.set(name, { startTime, endTime, duration });

        return duration;
    }

    getMeasure(name) {
        return this.measures.get(name);
    }

    getAllMeasures() {
        return Object.fromEntries(this.measures);
    }

    clear() {
        this.marks.clear();
        this.measures.clear();
    }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

export default {
    Logger,
    createLogger,
    validateMessage,
    safeStringify,
    safeParse,
    deepEquals,
    deepClone,
    generateId,
    debounce,
    throttle,
    formatBytes,
    formatDuration,
    formatTimestamp,
    isPlainObject,
    getObjectPath,
    setObjectPath,
    escapeHtml,
    createError,
    isExtensionContext,
    isDevToolsContext,
    isContentScriptContext,
    PerformanceMonitor,
    performanceMonitor
};