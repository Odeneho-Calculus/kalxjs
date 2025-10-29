/**
 * Browser-specific entry point for KalJS Core
 * This file ensures that all browser-compatible functions are directly available
 * Note: Testing utilities are excluded as they depend on Node.js modules
 */

// Import and re-export all composition API functions
export {
    watch,
    getCurrentInstance,
    setCurrentInstance,
    useReactive,
    useRef,
    useComputed
} from './composition/index.js';

// Import and re-export lifecycle hooks
export {
    onCreated,
    onBeforeMount,
    onMounted,
    onBeforeUpdate,
    onUpdated,
    onBeforeUnmount,
    onUnmounted,
    onErrorCaptured
} from './composition/lifecycle.js';

// Import and re-export injection functions
export {
    provide,
    inject,
    hasInjectionContext,
    hasInjection,
    appProvide
} from './composition/inject.js';

// Import and re-export all reactivity functions
export {
    ref,
    reactive,
    computed,
    effect,
    signal,
    batch,
    untrack,
    createResource,
    createSignalStore
} from './reactivity/index.js';

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
    createApp,
    defineJsComponent,
    createJsComponent,
    createStyles,
    defineComponentEnhanced,
    Suspense,
    useSuspense,
    Teleport,
    usePortal,
    ErrorBoundary,
    useErrorHandler,
    withErrorBoundary,
    Fragment,
    createFragment,
    isFragment,
    DynamicComponent,
    resolveDynamicComponent,
    isComponent,
    defineAsyncComponent,
    KeepAlive,
    onActivated,
    onDeactivated,
    Transition,
    TransitionGroup,
    useFLIPAnimation
} from './component/index.js';

// Import and re-export template component functions
export {
    createTemplateComponent,
    defineTemplateComponent
} from './template/index.js';

// Import and re-export renderer functions
export {
    createRenderer,
    createCustomRenderer
} from './renderer/index.js';

// Import and re-export store functions
export {
    createStore,
    createModule,
    createStorePlugin,
    createPersistedState,
    defineStore,
    useStore
} from './store/index.js';

// Import and re-export API functions
export {
    createApi,
    useApi,
    createApiPlugin
} from './api/index.js';

// Import and re-export performance functions
export {
    memoize,
    memo,
    lazy,
    deferRender,
    createVirtualList,
    createPerformancePlugin
} from './performance/index.js';

// Import and re-export AI functions
export {
    createAIManager,
    useAI,
    createAIPlugin,
    AI_MODEL_TYPES
} from './ai/index.js';

// Import and re-export native bridge functions
export {
    createNativeBridge,
    useNative,
    createNativePlugin,
    NATIVE_PLATFORMS,
    NATIVE_FEATURES
} from './native/index.js';

// Import and re-export animation functions
export {
    createTimeline,
    createTrack,
    createSpring,
    createPhysics,
    createAnimationPlugin,
    EASING,
    DIRECTION,
    FILL_MODE
} from './animation/index.js';

// Import and re-export plugin functions
export {
    createPlugin,
    PluginManager
} from './plugin/index.js';

// Import and re-export utility functions
export {
    customRef,
    readonly,
    writableComputed,
    useLocalStorage,
    useDebounce,
    useThrottle,
    useMouse
} from './composition/utils.js';

// Note: SSR functions (createServerRenderer, createClientHydration, createSSRPlugin) are intentionally excluded
// from the browser build as they depend on Node.js modules and should only run on the server.
// Server-rendered applications should use the server entry point for SSR functionality.