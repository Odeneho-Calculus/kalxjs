// @kalxjs/core - Composition API

import { reactive, ref, computed, effect } from '../reactivity/reactive.js';
import { getCurrentInstance, setCurrentInstance } from './instance.js';

// Re-export instance management functions
export { getCurrentInstance, setCurrentInstance };

// Re-export all lifecycle hooks from lifecycle.js
export {
    onCreated,
    onBeforeMount,
    onBeforeUpdate,
    onUpdated,
    onBeforeUnmount,
    onUnmounted,
    onErrorCaptured
} from './lifecycle.js';

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



