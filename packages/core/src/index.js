// Core functionality imports
import { reactive, ref, computed, effect } from './reactivity/reactive';
import { h, createElement, updateElement } from './vdom/vdom';
import { createComponent, defineComponent, createApp } from './component/component';

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
    onCreated,
    onBeforeMount,
    onBeforeUnmount,
    onErrorCaptured,
    customRef,
    readonly,
    writableComputed,
    useLocalStorage,
    useDebounce,
    useThrottle,
    useMouse
} from './composition';
import { createPlugin, PluginManager } from './plugin';
import {
    createStore,
    createModule,
    createStorePlugin,
    createPersistedState,
    defineStore
} from './store';
import {
    createApi,
    useApi,
    createApiPlugin
} from './api';
import {
    memoize,
    memo,
    lazy,
    deferRender,
    createVirtualList,
    createPerformancePlugin
} from './performance';
import {
    createAIManager,
    useAI,
    createAIPlugin,
    AI_MODEL_TYPES
} from './ai';
import {
    createNativeBridge,
    useNative,
    createNativePlugin,
    NATIVE_PLATFORMS,
    NATIVE_FEATURES
} from './native';
import {
    createTestRunner,
    createComponentTest,
    createAssertions,
    createTestingPlugin,
    describe,
    test,
    it
} from './testing';
import {
    createServerRenderer,
    createClientHydration,
    createSSRPlugin
} from './ssr';
import {
    createTimeline,
    createTrack,
    createSpring,
    createPhysics,
    createAnimationPlugin,
    EASING,
    DIRECTION,
    FILL_MODE
} from './animation';

/**
 * Main entry point for kalxjs framework
 */
function createAppInstance(options) {
    const app = createApp(options);

    // Add plugin support
    app.use = function (plugin, options = {}) {
        if (!plugin) return this;

        if (typeof plugin.install === 'function') {
            plugin.install(this, options);
        } else if (typeof plugin === 'function') {
            plugin(this, options);
        }
        return this;
    };

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
    defineComponent,

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
    createStore,
    createModule,
    createStorePlugin,
    createPersistedState,
    defineStore,

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
    version: '2.0.0',

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
    defineComponent,
    createAppInstance as createApp,

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
    createStore,
    createModule,
    createStorePlugin,
    createPersistedState,
    defineStore,

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
export * from './component';
export * from './vdom';
export * from './lifecycle';
export * from './reactivity';
export * from './composition';
export * from './composition/lifecycle';
export * from './composition/utils';
export * from './plugin';
export * from './store';
export * from './api';
export * from './performance';
export * from './ai';
export * from './native';
export * from './testing';
export * from './ssr';
export * from './animation';
