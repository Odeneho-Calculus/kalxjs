/**
 * KALXJS Pinia-Style Store
 * Composition API-based state management (Pinia-inspired)
 *
 * Features:
 * - Composition API style stores
 * - TypeScript support
 * - DevTools integration
 * - Hot module replacement
 * - Plugin system
 *
 * @module @kalxjs/store/pinia
 */

import { reactive, computed, ref, effectScope } from '@kalxjs/core';

/**
 * Store registry
 */
const storeRegistry = new Map();
const activeStores = new Map();

/**
 * Create a Pinia-style store manager
 *
 * @returns {Object} Pinia instance
 */
export function createPinia() {
    const state = ref({});
    const _plugins = [];

    const pinia = {
        /**
         * Install Pinia in the app
         */
        install(app) {
            app.provide('pinia', pinia);
            app.config.globalProperties.$pinia = pinia;

            // Setup DevTools
            if (typeof window !== 'undefined' && window.__KALXJS_DEVTOOLS__) {
                setupDevTools(pinia);
            }
        },

        /**
         * Register plugin
         */
        use(plugin) {
            _plugins.push(plugin);
            return this;
        },

        /**
         * Get all plugins
         */
        _plugins,

        /**
         * Global state
         */
        state,

        /**
         * Active stores
         */
        _stores: activeStores,
    };

    return pinia;
}

/**
 * Define a store
 *
 * @param {string} id - Store ID
 * @param {Function} setup - Setup function (Composition API style)
 * @param {Object} options - Store options
 * @returns {Function} Store factory
 *
 * @example
 * ```js
 * import { defineStore } from '@kalxjs/store';
 * import { ref, computed } from '@kalxjs/core';
 *
 * export const useCounterStore = defineStore('counter', () => {
 *   const count = ref(0);
 *   const doubled = computed(() => count.value * 2);
 *
 *   function increment() {
 *     count.value++;
 *   }
 *
 *   return { count, doubled, increment };
 * });
 * ```
 */
export function defineStore(id, setup, options = {}) {
    // Register store definition
    storeRegistry.set(id, { setup, options });

    // Return store factory
    return function useStore(pinia) {
        // Get or create store instance
        if (!activeStores.has(id)) {
            const store = createStoreInstance(id, setup, options, pinia);
            activeStores.set(id, store);
        }

        return activeStores.get(id);
    };
}

/**
 * Create store instance
 * @private
 */
function createStoreInstance(id, setup, options, pinia) {
    const scope = effectScope(true);

    let store;

    scope.run(() => {
        // Run setup function
        const setupResult = setup();

        // Create store object
        store = reactive({
            $id: id,
            $pinia: pinia,
            $state: setupResult,
            $scope: scope,
            $subscribe: createSubscribe(id),
            $onAction: createOnAction(id),
            $patch: createPatch(setupResult),
            $reset: createReset(id, setup, options),
            $dispose: () => {
                activeStores.delete(id);
                scope.stop();
            },
            ...setupResult,
        });
    });

    // Apply plugins
    if (pinia && pinia._plugins) {
        pinia._plugins.forEach(plugin => {
            plugin({ store, pinia, options });
        });
    }

    return store;
}

/**
 * Create $subscribe method
 * @private
 */
function createSubscribe(id) {
    const subscribers = new Set();

    return function $subscribe(callback, options = {}) {
        subscribers.add(callback);

        // Call callback on state changes
        const unwatch = watch(
            () => activeStores.get(id)?.$state,
            (state, oldState) => {
                callback({ storeId: id, type: 'direct' }, state);
            },
            { deep: true, ...options }
        );

        // Return unsubscribe function
        return () => {
            subscribers.delete(callback);
            unwatch();
        };
    };
}

/**
 * Create $onAction method
 * @private
 */
function createOnAction(id) {
    const actionListeners = new Set();

    return function $onAction(callback) {
        actionListeners.add(callback);

        return () => {
            actionListeners.delete(callback);
        };
    };
}

/**
 * Create $patch method
 * @private
 */
function createPatch(state) {
    return function $patch(partialStateOrMutator) {
        if (typeof partialStateOrMutator === 'function') {
            partialStateOrMutator(state);
        } else {
            Object.assign(state, partialStateOrMutator);
        }
    };
}

/**
 * Create $reset method
 * @private
 */
function createReset(id, setup, options) {
    return function $reset() {
        const store = activeStores.get(id);
        if (!store) return;

        // Re-run setup to get initial state
        const initialState = setup();

        // Reset state
        Object.keys(store.$state).forEach(key => {
            if (key in initialState) {
                store.$state[key] = initialState[key];
            }
        });
    };
}

/**
 * Get active store by ID
 *
 * @param {string} id - Store ID
 * @returns {Object|undefined} Store instance
 */
export function getActiveStore(id) {
    return activeStores.get(id);
}

/**
 * Map store state to component
 *
 * @param {Function} useStore - Store factory
 * @param {Array|Object} keys - Keys to map
 * @returns {Object} Mapped state
 *
 * @example
 * ```js
 * setup() {
 *   const counterStore = useCounterStore();
 *
 *   return {
 *     ...mapState(counterStore, ['count', 'doubled'])
 *   };
 * }
 * ```
 */
export function mapState(useStore, keys) {
    const store = typeof useStore === 'function' ? useStore() : useStore;
    const mapped = {};

    const keyArray = Array.isArray(keys) ? keys : Object.keys(keys);

    keyArray.forEach(key => {
        mapped[key] = computed(() => store[key]);
    });

    return mapped;
}

/**
 * Map store actions to component
 *
 * @param {Function} useStore - Store factory
 * @param {Array} methods - Methods to map
 * @returns {Object} Mapped actions
 */
export function mapActions(useStore, methods) {
    const store = typeof useStore === 'function' ? useStore() : useStore;
    const mapped = {};

    methods.forEach(method => {
        mapped[method] = (...args) => store[method](...args);
    });

    return mapped;
}

/**
 * Setup DevTools integration
 * @private
 */
function setupDevTools(pinia) {
    if (!window.__KALXJS_DEVTOOLS__) return;

    const devtools = window.__KALXJS_DEVTOOLS__;

    // Register stores with DevTools
    activeStores.forEach((store, id) => {
        devtools.emit('store:registered', {
            id,
            state: store.$state,
        });
    });

    // Watch for new stores
    const originalSet = activeStores.set.bind(activeStores);
    activeStores.set = function (id, store) {
        originalSet(id, store);

        devtools.emit('store:registered', {
            id,
            state: store.$state,
        });
    };
}

/**
 * Storeできる plugin system
 */
export const StorePlugins = {
    /**
     * Persistence plugin
     */
    persistence(options = {}) {
        const {
            key = 'kalxjs-store',
            storage = localStorage,
            paths = [],
        } = options;

        return ({ store }) => {
            // Load persisted state
            try {
                const saved = storage.getItem(`${key}-${store.$id}`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    store.$patch(parsed);
                }
            } catch (e) {
                console.error('Failed to load persisted state:', e);
            }

            // Save state on changes
            store.$subscribe((mutation, state) => {
                try {
                    let toSave = state;

                    // Filter paths if specified
                    if (paths.length > 0) {
                        toSave = {};
                        paths.forEach(path => {
                            if (path in state) {
                                toSave[path] = state[path];
                            }
                        });
                    }

                    storage.setItem(`${key}-${store.$id}`, JSON.stringify(toSave));
                } catch (e) {
                    console.error('Failed to persist state:', e);
                }
            });
        };
    },

    /**
     * Logger plugin
     */
    logger(options = {}) {
        const { collapsed = true, filter = () => true } = options;

        return ({ store }) => {
            store.$subscribe((mutation, state) => {
                if (!filter(mutation)) return;

                const logFunc = collapsed ? console.groupCollapsed : console.group;

                logFunc(`[Store ${store.$id}] ${mutation.type}`);
                console.log('State:', state);
                console.groupEnd();
            });
        };
    },
};