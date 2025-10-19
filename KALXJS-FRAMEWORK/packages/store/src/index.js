/**
 * KALXJS Store Module
 * Complete state management system with Pinia-style API
 *
 * @module @kalxjs/store
 */

// Pinia-style Store
export {
    createPinia,
    defineStore,
    getActiveStore,
    mapState,
    mapActions,
    StorePlugins,
} from './pinia-store.js';

// DevTools Integration
export {
    DevToolsConnector,
    createDevToolsPlugin,
} from './devtools.js';

// Time Travel
export {
    TimeTravelManager,
    createTimeTravelPlugin,
    useTimeTravel,
} from './time-travel.js';

// Persistence
export {
    StorageAdapters,
    createPersistencePlugin,
    createMultiStoragePersistence,
} from './persistence.js';
