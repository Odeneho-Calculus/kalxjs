// packages/core/src/reactivity/index.js

// Re-export all the reactivity functions from reactive.js
export { reactive, ref, computed, effect } from './reactive.js';

// Export new Signals-based reactivity system
export {
    signal,
    computed as computedSignal,
    effect as effectSignal,
    batch,
    untrack,
    memo,
    createResource,
    createStore as createSignalStore,
    getCurrentListener,
    queueEffect,
    isBatchingUpdates,
    signalWithEquals
} from './signals/index.js';