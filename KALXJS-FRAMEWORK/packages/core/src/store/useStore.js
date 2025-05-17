// @kalxjs/core - Store composition API
import { getCurrentInstance } from '../composition.js';
import { createStore } from './index.js';

/**
 * Composition API hook for using the store
 * @param {Object} options - Store options
 * @returns {Object} Store instance
 */
export function useStore(options = {}) {
    // Get current component instance if available
    const instance = getCurrentInstance();

    // If no options provided and instance has a store, return it
    if (Object.keys(options).length === 0 && instance && instance.$store) {
        return instance.$store;
    }

    // Create a new store with the provided options
    const store = createStore(options);

    // If we have a component instance, inject the store
    if (instance) {
        instance.$store = store;
    }

    return {
        state: store.state,
        getters: store.getters,
        dispatch: store.dispatch.bind(store),
        commit: store.commit.bind(store),
        $reset: store.$reset.bind(store),
        $patch: store.$patch.bind(store),
        $subscribe: store.$subscribe.bind(store),
        // Return the full store for advanced usage
        $store: store
    };
}