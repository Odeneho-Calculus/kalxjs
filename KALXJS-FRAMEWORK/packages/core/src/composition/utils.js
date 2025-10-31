// @kalxjs/core - Utility functions for Composition API

import { ref, reactive, effect } from '../reactivity/reactive.js';
import { getCurrentInstance } from './instance.js';

/**
 * Creates a reactive reference with a getter and setter
 * @param {any} initialValue - Initial value
 * @param {Function} getter - Custom getter function
 * @param {Function} setter - Custom setter function
 * @returns {Object} Reactive reference
 */
export function customRef(factory) {
    const track = () => { };
    const trigger = () => { };

    const { get, set } = factory(track, trigger);

    return Object.defineProperty({}, 'value', {
        get,
        set
    });
}

/**
 * Creates a readonly reference
 * @param {Object} source - Source reference
 * @returns {Object} Readonly reference
 */
export function readonly(source) {
    // Handle ref
    if (source && typeof source === 'object' && 'value' in source) {
        return Object.defineProperty({}, 'value', {
            get: () => source.value,
            set: () => {
                console.warn('Cannot set a readonly ref');
            }
        });
    }

    // Handle reactive object
    const handler = {
        get(target, key, receiver) {
            const result = Reflect.get(target, key, receiver);
            return result;
        },
        set() {
            console.warn('Cannot set a readonly reactive object');
            return true;
        },
        deleteProperty() {
            console.warn('Cannot delete from a readonly reactive object');
            return true;
        }
    };

    return new Proxy(source, handler);
}

/**
 * Creates a computed reference that can be both read and written
 * @param {Object} options - Options with get and set functions
 * @returns {Object} Computed reference
 */
export function writableComputed(options) {
    const { get, set } = options;

    const computedRef = {
        get value() {
            return get();
        },
        set value(newValue) {
            set(newValue);
        }
    };

    return computedRef;
}

/**
 * Internal utility to safely test localStorage availability
 * @private
 * @returns {boolean} Whether localStorage is safely accessible
 */
function isLocalStorageAccessible() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return false;
    }

    try {
        // Test if localStorage is actually accessible by attempting a write/read/delete cycle
        const testKey = '__localStorage_access_test__';
        window.localStorage.setItem(testKey, 'test');
        window.localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        // Catches DOMException and other security-related errors
        if (error instanceof DOMException || error.name === 'DOMException') {
            console.debug('localStorage access blocked by security policy:', error.message);
        } else {
            console.debug('localStorage is not accessible:', error);
        }
        return false;
    }
}

/**
 * Creates a reactive reference that is synchronized with localStorage
 * Gracefully handles insecure contexts where localStorage is not available
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {Object} Reactive reference (works even if localStorage is unavailable)
 */
export function useLocalStorage(key, defaultValue) {
    // Check if localStorage is accessible at setup time
    const storageAccessible = isLocalStorageAccessible();

    // Get initial value from localStorage or use default
    const initialValue = (() => {
        if (!storageAccessible) {
            return defaultValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    })();

    // Create a ref with the initial value
    const valueRef = ref(initialValue);

    // Watch for changes and update localStorage (only if accessible)
    if (storageAccessible) {
        effect(() => {
            try {
                window.localStorage.setItem(key, JSON.stringify(valueRef.value));
            } catch (error) {
                // Handle both DOMException and other errors gracefully
                if (error instanceof DOMException || error.name === 'DOMException') {
                    console.debug(`localStorage access blocked for key "${key}":`, error.message);
                } else {
                    console.warn(`Error setting localStorage key "${key}":`, error);
                }
                // Continue without storage - reactive updates still work in memory
            }
        });
    }

    return valueRef;
}

/**
 * Creates a debounced version of a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function useDebounce(fn, delay) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

/**
 * Creates a throttled version of a function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
export function useThrottle(fn, limit) {
    let inThrottle;

    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Creates a reactive reference that tracks mouse position
 * @returns {Object} Reactive mouse position
 */
export function useMouse() {
    const position = reactive({
        x: 0,
        y: 0
    });

    const update = (event) => {
        position.x = event.clientX;
        position.y = event.clientY;
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('mousemove', update);

        // Clean up event listener when component is unmounted
        const instance = getCurrentInstance();
        if (instance) {
            if (!instance.unmounted) {
                instance.unmounted = [];
            }

            instance.unmounted.push(() => {
                window.removeEventListener('mousemove', update);
            });
        }
    }

    return position;
}