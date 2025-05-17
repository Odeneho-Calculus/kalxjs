/**
 * Browser-specific entry point for KalJS Core
 * This file ensures that all composition API functions are directly available
 */

// Import and re-export all composition API functions
export {
    watch,
    onMounted,
    onUnmounted,
    onBeforeUpdate,
    onUpdated,
    getCurrentInstance,
    setCurrentInstance,
    useReactive,
    useRef,
    useComputed
} from './composition/index.js';

// Import and re-export all reactivity functions
export {
    ref,
    reactive,
    computed,
    effect
} from './reactivity/reactive.js';

// Import and re-export vdom functions
export {
    h,
    createElement,
    updateElement
} from './vdom/vdom.js';

// Import and re-export component functions
export {
    defineComponent,
    createComponent,
    createApp
} from './component/component.js';

// Re-export everything else from the main index
export * from './index.js';