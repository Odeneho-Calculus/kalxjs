import { createStore } from '@kalxjs/state';
    import store from './index';

    /**
     * Composition API hook for using the store
     * @param {Object} options - Optional custom store options
     * @returns {Object} Store instance with state, getters, actions, etc.
     */
    export function useStore(options = {}) {
      // If no options provided, return the main store
      if (Object.keys(options).length === 0) {
        return {
          state: store.state,
          getters: store.getters,
          dispatch: store.dispatch.bind(store),
          commit: store.commit.bind(store),
          $reset: store.$reset && store.$reset.bind(store),
          $patch: store.$patch && store.$patch.bind(store),
          $subscribe: store.$subscribe && store.$subscribe.bind(store),
          // Return the full store for advanced usage
          $store: store
        };
      }

      // Create a new store with the provided options
      return createStore(options);
    } 