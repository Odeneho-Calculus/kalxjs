// @kalxjs/core - Built-in state management

import { reactive, ref, computed, effect } from '../reactivity/reactive';

/**
 * Creates a store with state, getters, actions, and mutations
 * @param {Object} options - Store options
 * @returns {Object} Store instance
 */
export function createStore(options = {}) {
    const {
        state = {},
        getters = {},
        actions = {},
        mutations = {},
        plugins = []
    } = options;

    // Create reactive state
    const storeState = reactive(typeof state === 'function' ? state() : state);

    // Store for computed getters
    const computedGetters = {};

    // Create store instance
    const store = {
        // State access via $state
        $state: storeState,

        // Direct state access (for convenience)
        get state() {
            return this.$state;
        },

        // Reset state to initial values
        $reset() {
            const initialState = typeof state === 'function' ? state() : state;
            Object.keys(initialState).forEach(key => {
                this.$state[key] = initialState[key];
            });
        },

        // Patch state (partial update)
        $patch(partialState) {
            if (typeof partialState === 'function') {
                partialState(this.$state);
            } else {
                Object.keys(partialState).forEach(key => {
                    this.$state[key] = partialState[key];
                });
            }
        },

        // Subscribe to state changes
        $subscribe(callback) {
            const unsubscribe = effect(() => {
                // This will track all state properties
                const stateSnapshot = JSON.parse(JSON.stringify(this.$state));
                callback(stateSnapshot);
            });

            return unsubscribe;
        },

        // Dispatch an action
        dispatch(type, payload) {
            if (!actions[type]) {
                console.warn(`[KalxJS Store] Action "${type}" does not exist`);
                return Promise.resolve();
            }

            try {
                const context = {
                    state: this.$state,
                    getters: this.getters,
                    dispatch: this.dispatch.bind(this),
                    commit: this.commit.bind(this)
                };

                return Promise.resolve(actions[type](context, payload));
            } catch (error) {
                return Promise.reject(error);
            }
        },

        // Commit a mutation
        commit(type, payload) {
            if (!mutations[type]) {
                console.warn(`[KalxJS Store] Mutation "${type}" does not exist`);
                return;
            }

            mutations[type](this.$state, payload);
        }
    };

    // Setup getters
    store.getters = {};
    Object.keys(getters).forEach(key => {
        // Create computed property for each getter
        computedGetters[key] = computed(() => {
            return getters[key](store.state, store.getters);
        });

        // Define getter on the store
        Object.defineProperty(store.getters, key, {
            get: () => computedGetters[key].value,
            enumerable: true
        });

        // Also define getter directly on the store for convenience
        Object.defineProperty(store, key, {
            get: () => store.getters[key],
            enumerable: true
        });
    });

    // Setup actions
    Object.keys(actions).forEach(key => {
        store[key] = (payload) => store.dispatch(key, payload);
    });

    // Setup mutations
    Object.keys(mutations).forEach(key => {
        store[`commit${key.charAt(0).toUpperCase() + key.slice(1)}`] = (payload) => {
            store.commit(key, payload);
        };
    });

    // Apply plugins
    plugins.forEach(plugin => plugin(store));

    return store;
}

/**
 * Creates a store module that can be used with createStore
 * @param {Object} options - Module options
 * @returns {Object} Module definition
 */
export function createModule(options = {}) {
    const {
        namespaced = false,
        state = {},
        getters = {},
        actions = {},
        mutations = {},
        modules = {}
    } = options;

    return {
        namespaced,
        state,
        getters,
        actions,
        mutations,
        modules
    };
}

/**
 * Creates a plugin for the store
 * @param {Function} plugin - Plugin function
 * @returns {Function} Plugin function
 */
export function createStorePlugin(plugin) {
    return plugin;
}

/**
 * Creates a persisted state plugin
 * @param {Object} options - Plugin options
 * @returns {Function} Plugin function
 */
export function createPersistedState(options = {}) {
    const {
        key = 'kalxjs-store',
        paths = null,
        storage = localStorage,
        serialize = JSON.stringify,
        deserialize = JSON.parse
    } = options;

    return (store) => {
        // Load persisted state
        try {
            const persistedString = storage.getItem(key);
            if (persistedString) {
                const persistedState = deserialize(persistedString);

                if (persistedState) {
                    store.$patch(persistedState);
                }
            }
        } catch (err) {
            console.error('[KalxJS Store] Error loading persisted state:', err);
        }

        // Subscribe to changes
        store.$subscribe((state) => {
            try {
                // Filter state if paths are specified
                let stateToPersist = state;
                if (paths) {
                    stateToPersist = {};
                    paths.forEach(path => {
                        const pathParts = path.split('.');
                        let value = state;

                        for (const part of pathParts) {
                            value = value[part];
                            if (value === undefined) break;
                        }

                        if (value !== undefined) {
                            // Set nested value
                            let target = stateToPersist;
                            for (let i = 0; i < pathParts.length - 1; i++) {
                                const part = pathParts[i];
                                if (!target[part]) target[part] = {};
                                target = target[part];
                            }
                            target[pathParts[pathParts.length - 1]] = value;
                        }
                    });
                }

                // Persist state
                storage.setItem(key, serialize(stateToPersist));
            } catch (err) {
                console.error('[KalxJS Store] Error persisting state:', err);
            }
        });
    };
}

/**
 * Creates a store with composition API
 * @param {Object} options - Store options
 * @returns {Object} Composable store
 */
export function defineStore(id, options) {
    // Allow both object-style and setup-style stores
    const useStore = () => {
        // For setup function style
        if (typeof options === 'function') {
            const setupStore = {};

            // Call setup function
            const setupResult = options();

            // Process setup result
            Object.keys(setupResult).forEach(key => {
                const result = setupResult[key];

                // Handle refs, computed, etc.
                if (result && typeof result === 'object' && 'value' in result) {
                    // For refs and computed
                    Object.defineProperty(setupStore, key, {
                        get: () => result.value,
                        set: (value) => { result.value = value },
                        enumerable: true
                    });
                } else {
                    // For methods and other values
                    setupStore[key] = result;
                }
            });

            // Add $reset method if state is defined
            if (setupResult.$state) {
                setupStore.$reset = () => {
                    const initialState = setupResult.$state;
                    Object.keys(initialState).forEach(key => {
                        initialState[key].value = initialState[key]._initialValue;
                    });
                };
            }

            return setupStore;
        }

        // For options-style store
        const store = createStore({
            ...options,
            id
        });

        return store;
    };

    useStore.$id = id;

    return useStore;
}