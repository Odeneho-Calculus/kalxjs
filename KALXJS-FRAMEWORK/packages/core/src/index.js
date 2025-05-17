// Core functionality imports
import { reactive, ref, computed, effect } from './reactivity/reactive.js';
import { h, createElement, updateElement } from './vdom/vdom.js';
import {
    createComponent,
    defineComponent,
    createApp,
    defineJsComponent,
    createJsComponent,
    createStyles,
    defineComponentEnhanced
} from './component/index.js';

// Import template-based component system
import { createTemplateComponent, defineTemplateComponent } from './template/index.js';

// Import custom renderer
import { createRenderer, createCustomRenderer } from './renderer/index.js';

// Import all composition API from a single file to avoid circular dependencies
import {
    useReactive,
    useRef,
    useComputed,
    watch,
    onMounted,
    onUnmounted,
    onBeforeUpdate,
    onUpdated,
    getCurrentInstance,
    setCurrentInstance
} from './composition.js';

// Import additional lifecycle hooks
import {
    onCreated,
    onBeforeMount,
    onBeforeUnmount,
    onErrorCaptured
} from './composition/lifecycle.js';

// Import utility functions
import {
    customRef,
    readonly,
    writableComputed,
    useLocalStorage,
    useDebounce,
    useThrottle,
    useMouse
} from './composition/utils.js';
import { createPlugin, PluginManager } from './plugin/index.js';
// Re-export store functions directly
export {
    createStore,
    createModule,
    createStorePlugin,
    createPersistedState,
    defineStore,
    useStore
} from './store/index.js';
import {
    createApi,
    useApi,
    createApiPlugin
} from './api/index.js';
import {
    memoize,
    memo,
    lazy,
    deferRender,
    createVirtualList,
    createPerformancePlugin
} from './performance/index.js';
import {
    createAIManager,
    useAI,
    createAIPlugin,
    AI_MODEL_TYPES
} from './ai/index.js';
import {
    createNativeBridge,
    useNative,
    createNativePlugin,
    NATIVE_PLATFORMS,
    NATIVE_FEATURES
} from './native/index.js';
import {
    createTestRunner,
    createComponentTest,
    createAssertions,
    createTestingPlugin,
    describe,
    test,
    it
} from './testing/index.js';
import {
    createServerRenderer,
    createClientHydration,
    createSSRPlugin
} from './ssr/index.js';
import {
    createTimeline,
    createTrack,
    createSpring,
    createPhysics,
    createAnimationPlugin,
    EASING,
    DIRECTION,
    FILL_MODE
} from './animation/index.js';

/**
 * Main entry point for kalxjs framework
 */
function createAppInstance(rootComponent) {
    // Make sure we're passing the component definition to createApp
    const app = createApp(rootComponent);

    // Plugin support is already added in createApp
    return app;
}

const kalxjs = {
    // Reactivity system
    reactive,
    ref,
    computed,
    effect,

    // Virtual DOM
    h,
    createElement,

    // Component system
    createComponent,
    defineComponent: defineComponentEnhanced, // Use enhanced version by default

    // New JS-based component system
    defineJsComponent,
    createJsComponent,
    createStyles,

    // Template-based component system
    createTemplateComponent,
    defineTemplateComponent,

    // Custom renderer
    createRenderer,
    createCustomRenderer,

    // Composition API
    useReactive,
    useRef,
    useComputed,
    watch,
    onMounted,
    onUnmounted,
    onBeforeUpdate,
    onUpdated,
    getCurrentInstance,
    setCurrentInstance,

    // Additional lifecycle hooks
    onCreated,
    onBeforeMount,
    onBeforeUnmount,
    onErrorCaptured,

    // Utility functions
    customRef,
    readonly,
    writableComputed,
    useLocalStorage,
    useDebounce,
    useThrottle,
    useMouse,

    // Plugin system
    createPlugin,

    // State management

    // API integration
    createApi,
    useApi,
    createApiPlugin,

    // Performance optimizations
    memoize,
    memo,
    lazy,
    deferRender,
    createVirtualList,
    createPerformancePlugin,

    // AI capabilities
    createAIManager,
    useAI,
    createAIPlugin,
    AI_MODEL_TYPES,

    // Native bridge
    createNativeBridge,
    useNative,
    createNativePlugin,
    NATIVE_PLATFORMS,
    NATIVE_FEATURES,

    // Testing framework
    createTestRunner,
    createComponentTest,
    createAssertions,
    createTestingPlugin,
    describe,
    test,
    it,

    // Server-side rendering
    createServerRenderer,
    createClientHydration,
    createSSRPlugin,

    // Animation system
    createTimeline,
    createTrack,
    createSpring,
    createPhysics,
    createAnimationPlugin,
    EASING,
    DIRECTION,
    FILL_MODE,

    // Version
    version: '2.2.1',

    /**
     * Creates a new kalxjs application
     * @param {Object} options - Application options
     * @returns {Object} Application instance
     */
    createApp(options) {
        return createApp(options);
    }
};

export default kalxjs;

// Export version directly
export const version = '2.2.1';

// Export version utilities
export { getPackageVersion, getAllVersions, checkVersionCompatibility, versions } from './version.js';

// Export individual APIs
export {
    // Reactivity
    reactive,
    ref,
    computed,
    effect,

    // Virtual DOM
    h,
    createElement,
    updateElement,

    // Component
    createComponent,
    defineComponentEnhanced as defineComponent,
    createAppInstance as createApp,

    // New JS-based component system
    defineJsComponent,
    createJsComponent,
    createStyles,

    // Template-based component system
    createTemplateComponent,
    defineTemplateComponent,

    // Custom renderer
    createRenderer,
    createCustomRenderer,

    // Composition API
    useReactive,
    useRef,
    useComputed,
    watch,
    onMounted,
    onUnmounted,
    onBeforeUpdate,
    onUpdated,
    getCurrentInstance,
    setCurrentInstance,

    // Additional lifecycle hooks
    onCreated,
    onBeforeMount,
    onBeforeUnmount,
    onErrorCaptured,

    // Utility functions
    customRef,
    readonly,
    writableComputed,
    useLocalStorage,
    useDebounce,
    useThrottle,
    useMouse,

    // Plugin system
    createPlugin,
    PluginManager,

    // State management

    // API integration
    createApi,
    useApi,
    createApiPlugin,

    // Performance optimizations
    memoize,
    memo,
    lazy,
    deferRender,
    createVirtualList,
    createPerformancePlugin,

    // AI capabilities
    createAIManager,
    useAI,
    createAIPlugin,
    AI_MODEL_TYPES,

    // Native bridge
    createNativeBridge,
    useNative,
    createNativePlugin,
    NATIVE_PLATFORMS,
    NATIVE_FEATURES,

    // Testing framework
    createTestRunner,
    createComponentTest,
    createAssertions,
    createTestingPlugin,
    describe,
    test,
    it,

    // Server-side rendering
    createServerRenderer,
    createClientHydration,
    createSSRPlugin,

    // Animation system
    createTimeline,
    createTrack,
    createSpring,
    createPhysics,
    createAnimationPlugin,
    EASING,
    DIRECTION,
    FILL_MODE
};

// Additional exports
export * from './component/index.js';
export * from './vdom/index.js';
export * from './lifecycle/index.js';
export * from './reactivity/index.js';
export * from './composition.js';
export * from './composition/lifecycle.js';
export * from './composition/utils.js';
export * from './plugin/index.js';
export * from './store/index.js';
export * from './api/index.js';
export * from './performance/index.js';
export * from './ai/index.js';
export * from './native/index.js';
export * from './testing/index.js';
export * from './ssr/index.js';
export * from './animation/index.js';
export * from './template/index.js';
export * from './renderer/index.js';
