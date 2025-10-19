/**
 * Native Bridge
 * Communication bridge between JavaScript and native code
 */

import { Platform } from './platform.js';

/**
 * Native Module Registry
 */
const nativeModules = new Map();

/**
 * Register a native module
 * @param {string} name - Module name
 * @param {Object} module - Module implementation
 */
export function registerNativeModule(name, module) {
    nativeModules.set(name, module);
}

/**
 * Get a native module
 * @param {string} name - Module name
 * @returns {Object|null} Native module
 */
export function getNativeModule(name) {
    return nativeModules.get(name) || null;
}

/**
 * Call native method
 * @param {string} moduleName - Module name
 * @param {string} methodName - Method name
 * @param {Array} args - Method arguments
 * @returns {Promise<any>} Result
 */
export async function callNativeMethod(moduleName, methodName, args = []) {
    const module = getNativeModule(moduleName);

    if (!module) {
        throw new Error(`Native module "${moduleName}" not found`);
    }

    if (typeof module[methodName] !== 'function') {
        throw new Error(`Method "${methodName}" not found in module "${moduleName}"`);
    }

    try {
        return await module[methodName](...args);
    } catch (error) {
        console.error(`Error calling ${moduleName}.${methodName}:`, error);
        throw error;
    }
}

/**
 * Native Event Emitter
 */
class NativeEventEmitter {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Add event listener
     * @param {string} eventName - Event name
     * @param {Function} listener - Listener function
     * @returns {Object} Subscription
     */
    addListener(eventName, listener) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }

        this.listeners.get(eventName).add(listener);

        return {
            remove: () => {
                const listeners = this.listeners.get(eventName);
                if (listeners) {
                    listeners.delete(listener);
                }
            }
        };
    }

    /**
     * Remove event listener
     * @param {string} eventName - Event name
     * @param {Function} listener - Listener function
     */
    removeListener(eventName, listener) {
        const listeners = this.listeners.get(eventName);
        if (listeners) {
            listeners.delete(listener);
        }
    }

    /**
     * Emit event
     * @param {string} eventName - Event name
     * @param {any} data - Event data
     */
    emit(eventName, data) {
        const listeners = this.listeners.get(eventName);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`Error in listener for event "${eventName}":`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for an event
     * @param {string} eventName - Event name
     */
    removeAllListeners(eventName) {
        if (eventName) {
            this.listeners.delete(eventName);
        } else {
            this.listeners.clear();
        }
    }
}

/**
 * Global event emitter instance
 */
export const nativeEventEmitter = new NativeEventEmitter();

/**
 * Create a native module wrapper
 * @param {Object} spec - Module specification
 * @returns {Object} Module wrapper
 */
export function createNativeModule(spec) {
    const { name, methods = {}, constants = {} } = spec;

    const module = {
        ...constants,
        ...Object.keys(methods).reduce((acc, methodName) => {
            acc[methodName] = async (...args) => {
                return await callNativeMethod(name, methodName, args);
            };
            return acc;
        }, {})
    };

    registerNativeModule(name, module);
    return module;
}

/**
 * Platform-specific code splitting
 */
export class PlatformModule {
    constructor() {
        this.implementations = {};
    }

    /**
     * Register platform-specific implementation
     * @param {string} platform - Platform name
     * @param {Object} implementation - Implementation
     */
    register(platform, implementation) {
        this.implementations[platform] = implementation;
    }

    /**
     * Get implementation for current platform
     * @returns {Object} Implementation
     */
    get() {
        const platform = Platform.OS;
        return this.implementations[platform] ||
            this.implementations.default ||
            {};
    }

    /**
     * Call platform-specific method
     * @param {string} methodName - Method name
     * @param {Array} args - Arguments
     * @returns {any} Result
     */
    call(methodName, ...args) {
        const impl = this.get();
        if (typeof impl[methodName] === 'function') {
            return impl[methodName](...args);
        }
        throw new Error(`Method "${methodName}" not found for platform "${Platform.OS}"`);
    }
}

/**
 * Hot reload support for native modules
 */
export function enableHotReloadForNativeModules() {
    if (typeof module !== 'undefined' && module.hot) {
        module.hot.accept((err) => {
            if (err) {
                console.error('Error during hot reload:', err);
            }
        });
    }
}

export default {
    registerNativeModule,
    getNativeModule,
    callNativeMethod,
    nativeEventEmitter,
    createNativeModule,
    PlatformModule,
    enableHotReloadForNativeModules
};