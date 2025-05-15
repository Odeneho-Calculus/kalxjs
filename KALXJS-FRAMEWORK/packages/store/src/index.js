// packages/store/src/index.js
import { reactive, effect } from '../../core/src/reactivity/reactive';

/**
 * Create a new store for global state management
 * @param {Object} options - Store options
 * @returns {Object} Store instance
 */
export function createStore(options = {}) {
    const store = {
        state: reactive(options.state || {}),
        _mutations: options.mutations || {},
        _actions: options.actions || {},
        _subscribers: [],
        _getters: {},
        getters: {},

        // Commit a mutation
        commit(type, payload) {
            const mutation = this._mutations[type];
            if (!mutation) {
                console.warn(`[Store] Unknown mutation type: ${type}`);
                return;
            }

            // Call the mutation
            mutation(this.state, payload);

            // Notify subscribers
            this._subscribers.forEach(sub => sub({ type, payload }, this.state));
        },

        // Dispatch an action
        dispatch(type, payload) {
            const action = this._actions[type];
            if (!action) {
                console.warn(`[Store] Unknown action type: ${type}`);
                return Promise.resolve();
            }

            return action({
                commit: this.commit.bind(this),
                dispatch: this.dispatch.bind(this),
                state: this.state,
                getters: this.getters
            }, payload);
        },

        // Subscribe to store mutations
        subscribe(fn) {
            if (typeof fn !== 'function') {
                console.warn('[Store] Store subscriber must be a function');
                return;
            }

            this._subscribers.push(fn);

            // Return unsubscribe function
            return () => {
                const index = this._subscribers.indexOf(fn);
                if (index > -1) {
                    this._subscribers.splice(index, 1);
                }
            };
        },

        // Register a module
        registerModule(path, module) {
            // Implementation for dynamic module registration
            // (Simplified for now)
            console.warn('[Store] registerModule is not fully implemented yet');
        },

        // Plugin installation method for Vue.use()
        install(app) {
            app._context.$store = this;

            // Make store available to all components
            app.config.globalProperties.$store = this;
        }
    };

    // Initialize getters
    if (options.getters) {
        const computed = {};
        const getters = options.getters;

        // Register getters
        Object.keys(getters).forEach(key => {
            // Define computed property
            Object.defineProperty(store.getters, key, {
                get: () => getters[key](store.state, store.getters),
                enumerable: true
            });

            // Add to internal getters
            store._getters[key] = getters[key];
        });
    }

    return store;
}

/**
 * Map state to component properties
 * @param {string|Array} namespace - Optional namespace
 * @param {Array|Object} map - State map
 */
export function mapState(namespace, map) {
    if (typeof namespace !== 'string') {
        map = namespace;
        namespace = '';
    }

    const res = {};

    if (Array.isArray(map)) {
        map.forEach(key => {
            res[key] = function () {
                const store = this.$store;
                if (!store) {
                    console.warn('[Store] No store injected');
                    return;
                }

                const path = namespace ? `${namespace}.${key}` : key;
                return getNestedState(store.state, path);
            };
        });
    } else {
        Object.keys(map).forEach(key => {
            const val = map[key];
            res[key] = function () {
                const store = this.$store;
                if (!store) {
                    console.warn('[Store] No store injected');
                    return;
                }

                if (typeof val === 'function') {
                    return val.call(this, store.state, store.getters);
                } else {
                    const path = namespace ? `${namespace}.${val}` : val;
                    return getNestedState(store.state, path);
                }
            };
        });
    }

    return res;
}

/**
 * Map getters to component properties
 * @param {string|Array} namespace - Optional namespace
 * @param {Array|Object} getters - Getters map
 */
export function mapGetters(namespace, getters) {
    if (typeof namespace !== 'string') {
        getters = namespace;
        namespace = '';
    }

    const res = {};

    if (Array.isArray(getters)) {
        getters.forEach(key => {
            const mappedKey = namespace ? `${namespace}/${key}` : key;
            res[key] = function () {
                const store = this.$store;
                if (!store) {
                    console.warn('[Store] No store injected');
                    return;
                }

                return store.getters[mappedKey];
            };
        });
    } else {
        Object.keys(getters).forEach(key => {
            const val = getters[key];
            const mappedKey = namespace ? `${namespace}/${val}` : val;
            res[key] = function () {
                const store = this.$store;
                if (!store) {
                    console.warn('[Store] No store injected');
                    return;
                }

                return store.getters[mappedKey];
            };
        });
    }

    return res;
}

/**
 * Map mutations to component methods
 * @param {string|Array} namespace - Optional namespace
 * @param {Array|Object} mutations - Mutations map
 */
export function mapMutations(namespace, mutations) {
    if (typeof namespace !== 'string') {
        mutations = namespace;
        namespace = '';
    }

    const res = {};

    if (Array.isArray(mutations)) {
        mutations.forEach(key => {
            const mappedKey = namespace ? `${namespace}/${key}` : key;
            res[key] = function (...args) {
                const store = this.$store;
                if (!store) {
                    console.warn('[Store] No store injected');
                    return;
                }

                return store.commit.apply(store, [mappedKey, ...args]);
            };
        });
    } else {
        Object.keys(mutations).forEach(key => {
            const val = mutations[key];
            const mappedKey = namespace ? `${namespace}/${val}` : val;
            res[key] = function (...args) {
                const store = this.$store;
                if (!store) {
                    console.warn('[Store] No store injected');
                    return;
                }

                return store.commit.apply(store, [mappedKey, ...args]);
            };
        });
    }

    return res;
}

/**
 * Map actions to component methods
 * @param {string|Array} namespace - Optional namespace
 * @param {Array|Object} actions - Actions map
 */
export function mapActions(namespace, actions) {
    if (typeof namespace !== 'string') {
        actions = namespace;
        namespace = '';
    }

    const res = {};

    if (Array.isArray(actions)) {
        actions.forEach(key => {
            const mappedKey = namespace ? `${namespace}/${key}` : key;
            res[key] = function (...args) {
                const store = this.$store;
                if (!store) {
                    console.warn('[Store] No store injected');
                    return;
                }

                return store.dispatch.apply(store, [mappedKey, ...args]);
            };
        });
    } else {
        Object.keys(actions).forEach(key => {
            const val = actions[key];
            const mappedKey = namespace ? `${namespace}/${val}` : val;
            res[key] = function (...args) {
                const store = this.$store;
                if (!store) {
                    console.warn('[Store] No store injected');
                    return;
                }

                return store.dispatch.apply(store, [mappedKey, ...args]);
            };
        });
    }

    return res;
}

// Helper function to get nested state
function getNestedState(state, path) {
    return path.split('.').reduce((obj, key) => {
        return obj ? obj[key] : undefined;
    }, state);
}