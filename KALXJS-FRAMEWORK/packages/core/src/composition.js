// Direct export file for composition API
// Export specific functions to avoid conflicts
import {
    useReactive,
    useRef,
    useComputed,
    watch
} from './composition/index.js';

import {
    setCurrentInstance,
    getCurrentInstance
} from './composition/instance.js';

import {
    onCreated,
    onBeforeMount,
    onMounted,
    onBeforeUpdate,
    onUpdated,
    onBeforeUnmount,
    onUnmounted,
    onErrorCaptured
} from './composition/lifecycle.js';

import {
    customRef,
    readonly,
    writableComputed,
    useLocalStorage,
    useDebounce,
    useThrottle,
    useMouse
} from './composition/utils.js';

import {
    provide,
    inject,
    hasInjectionContext,
    hasInjection,
    appProvide
} from './composition/inject.js';

export {
    useReactive,
    useRef,
    useComputed,
    watch,
    onMounted,
    onUnmounted,
    onBeforeUpdate,
    onUpdated,
    setCurrentInstance,
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
    useMouse,
    provide,
    inject,
    hasInjectionContext,
    hasInjection,
    appProvide
};