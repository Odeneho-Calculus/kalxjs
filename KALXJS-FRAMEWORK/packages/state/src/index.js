// packages/state/src/index.js
import { reactive, effect } from '../../core/src/reactivity/reactive';

/**
 * Create a new store for state management
 * @param {Object} options - Store options
 * @returns {Object} Store instance
 */
export function createStore(options) {
    const store = {
        state: reactive(options.state || {}),

        // Commit a mutation
        commit(type, ...args) {
            const mutation = options.mutations?.[type];
            if (!mutation) {
                console.warn(`Unknown mutation type: ${type}`);
                return;
            }
            mutation.apply(this, [this.state, ...args]);
        },

        // Dispatch an action
        dispatch(type, ...args) {
            const action = options.actions?.[type];
            if (!action) {
                console.warn(`Unknown action type: ${type}`);
                return;
            }
            return action.apply(this, [this, ...args]);
        },

        // Watch state changes
        watch(getter, callback) {
            effect(() => {
                const value = getter(this.state);
                callback(value);
            });
        },

        install(app) {
            // Inject store into components
            app._context.$store = this;
        }
    };

    // Add install method to store
    Object.assign(store, {
        install: function (app) {
            app._context.$store = store;
        }
    });

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
                    console.warn('No store injected');
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
                    console.warn('No store injected');
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
                    console.warn('No store injected');
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
                    console.warn('No store injected');
                    return;
                }

                return store.getters[mappedKey];
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