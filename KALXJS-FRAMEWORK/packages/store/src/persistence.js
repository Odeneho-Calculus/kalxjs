/**
 * KALXJS Store Persistence
 * State persistence with multiple storage backends
 *
 * @module @kalxjs/store/persistence
 */

/**
 * Storage adapters
 */
export const StorageAdapters = {
    /**
     * LocalStorage adapter
     */
    localStorage: {
        getItem(key) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.error('localStorage.getItem error:', e);
                return null;
            }
        },

        setItem(key, value) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.error('localStorage.setItem error:', e);
                return false;
            }
        },

        removeItem(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('localStorage.removeItem error:', e);
                return false;
            }
        },
    },

    /**
     * SessionStorage adapter
     */
    sessionStorage: {
        getItem(key) {
            try {
                return sessionStorage.getItem(key);
            } catch (e) {
                console.error('sessionStorage.getItem error:', e);
                return null;
            }
        },

        setItem(key, value) {
            try {
                sessionStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.error('sessionStorage.setItem error:', e);
                return false;
            }
        },

        removeItem(key) {
            try {
                sessionStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('sessionStorage.removeItem error:', e);
                return false;
            }
        },
    },

    /**
     * IndexedDB adapter
     */
    indexedDB: {
        dbName: 'kalxjs-store',
        storeName: 'state',
        db: null,

        async init() {
            if (this.db) return this.db;

            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, 1);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName);
                    }
                };
            });
        },

        async getItem(key) {
            try {
                const db = await this.init();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(this.storeName, 'readonly');
                    const store = tx.objectStore(this.storeName);
                    const request = store.get(key);

                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve(request.result);
                });
            } catch (e) {
                console.error('indexedDB.getItem error:', e);
                return null;
            }
        },

        async setItem(key, value) {
            try {
                const db = await this.init();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(this.storeName, 'readwrite');
                    const store = tx.objectStore(this.storeName);
                    const request = store.put(value, key);

                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve(true);
                });
            } catch (e) {
                console.error('indexedDB.setItem error:', e);
                return false;
            }
        },

        async removeItem(key) {
            try {
                const db = await this.init();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(this.storeName, 'readwrite');
                    const store = tx.objectStore(this.storeName);
                    const request = store.delete(key);

                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve(true);
                });
            } catch (e) {
                console.error('indexedDB.removeItem error:', e);
                return false;
            }
        },
    },
};

/**
 * Create persistence plugin
 *
 * @param {Object} options - Plugin options
 * @returns {Function} Plugin function
 */
export function createPersistencePlugin(options = {}) {
    const {
        key = 'kalxjs-store',
        storage = StorageAdapters.localStorage,
        paths = [], // Specific paths to persist
        beforeRestore = null,
        afterRestore = null,
        serializer = JSON.stringify,
        deserializer = JSON.parse,
        filter = null, // Filter function for selective persistence
        debounce = 1000, // Debounce save operations
    } = options;

    return ({ store }) => {
        const storageKey = `${key}-${store.$id}`;
        let saveTimeout = null;

        // Load persisted state
        (async () => {
            try {
                const saved = await storage.getItem(storageKey);
                if (!saved) return;

                const parsed = deserializer(saved);

                if (beforeRestore) {
                    await beforeRestore(parsed, store);
                }

                // Restore state
                if (paths.length > 0) {
                    // Restore only specified paths
                    const partial = {};
                    paths.forEach(path => {
                        if (path in parsed) {
                            partial[path] = parsed[path];
                        }
                    });
                    store.$patch(partial);
                } else {
                    // Restore all state
                    store.$patch(parsed);
                }

                if (afterRestore) {
                    await afterRestore(store);
                }
            } catch (e) {
                console.error('Failed to restore persisted state:', e);
            }
        })();

        // Save state on changes
        store.$subscribe(async (mutation, state) => {
            // Apply filter if provided
            if (filter && !filter(mutation)) {
                return;
            }

            // Debounce save operations
            if (saveTimeout) {
                clearTimeout(saveTimeout);
            }

            saveTimeout = setTimeout(async () => {
                try {
                    let toSave = state;

                    // Save only specified paths
                    if (paths.length > 0) {
                        toSave = {};
                        paths.forEach(path => {
                            if (path in state) {
                                toSave[path] = state[path];
                            }
                        });
                    }

                    const serialized = serializer(toSave);
                    await storage.setItem(storageKey, serialized);
                } catch (e) {
                    console.error('Failed to persist state:', e);
                }
            }, debounce);
        });

        // Add manual persistence methods
        store.$persist = {
            async save() {
                const serialized = serializer(store.$state);
                return await storage.setItem(storageKey, serialized);
            },

            async load() {
                const saved = await storage.getItem(storageKey);
                if (saved) {
                    const parsed = deserializer(saved);
                    store.$patch(parsed);
                    return true;
                }
                return false;
            },

            async clear() {
                return await storage.removeItem(storageKey);
            },
        };
    };
}

/**
 * Create multi-storage persistence
 * Persists to multiple storages with fallback
 *
 * @param {Array} storages - Array of storage adapters
 * @param {Object} options - Options
 * @returns {Function} Plugin function
 */
export function createMultiStoragePersistence(storages, options = {}) {
    const plugins = storages.map(storage =>
        createPersistencePlugin({ ...options, storage })
    );

    return ({ store, pinia }) => {
        plugins.forEach(plugin => plugin({ store, pinia }));
    };
}