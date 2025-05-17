// @kalxjs/core - Composition API

import { reactive, ref, computed, effect } from '../reactivity/reactive.js';
import { getCurrentInstance, setCurrentInstance } from './instance.js';

// Re-export instance management functions
export { getCurrentInstance, setCurrentInstance };

/**
 * Creates a reactive object that can be used in the setup function
 * @param {Object} target - Object to make reactive
 * @returns {Proxy} Reactive object
 */
export function useReactive(target) {
    return reactive(target);
}

/**
 * Creates a reactive reference that can be used in the setup function
 * @param {any} value - Initial value
 * @returns {Object} Reactive reference
 */
export function useRef(value) {
    return ref(value);
}

/**
 * Creates a computed property that can be used in the setup function
 * @param {Function} getter - Getter function
 * @returns {Object} Computed property
 */
export function useComputed(getter) {
    return computed(getter);
}

/**
 * Watches for changes in a reactive source and runs a callback
 * @param {Object|Function} source - Reactive object or getter function
 * @param {Function} callback - Callback function
 * @param {Object} options - Watch options
 * @returns {Function} Function to stop watching
 */
export function watch(source, callback, options = {}) {
    const { immediate = false } = options;

    // Handle ref or reactive objects
    const getter = typeof source === 'function'
        ? source
        : () => {
            // Handle ref
            if (source && 'value' in source) {
                return source.value;
            }
            // Handle reactive object
            return source;
        };

    let oldValue;

    const runner = effect(() => getter(), {
        lazy: true,
        scheduler: () => {
            const newValue = runner();
            callback(newValue, oldValue);
            oldValue = newValue;
        }
    });

    if (immediate) {
        oldValue = runner();
        callback(oldValue, undefined);
    } else {
        oldValue = runner();
    }

    return () => {
        // Cleanup effect
        runner.active = false;
    };
}

/**
 * Runs a callback once when the component is mounted
 * @param {Function} callback - Callback function
 */
export function onMounted(callback) {
    getCurrentInstance().mounted.push(callback);
}

/**
 * Runs a callback before the component is unmounted
 * @param {Function} callback - Callback function
 */
export function onUnmounted(callback) {
    getCurrentInstance().unmounted.push(callback);
}

/**
 * Runs a callback before the component is updated
 * @param {Function} callback - Callback function
 */
export function onBeforeUpdate(callback) {
    getCurrentInstance().beforeUpdate.push(callback);
}

/**
 * Runs a callback after the component is updated
 * @param {Function} callback - Callback function
 */
export function onUpdated(callback) {
    getCurrentInstance().updated.push(callback);
}

