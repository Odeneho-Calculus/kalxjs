// Direct export file for composition API
// Export specific functions to avoid conflicts
import {
    useReactive,
    useRef,
    useComputed,
    watch,
    onMounted,
    onUnmounted,
    onBeforeUpdate,
    onUpdated,
    setCurrentInstance,
    getCurrentInstance
} from './composition/index.js';

import {
    onCreated,
    onBeforeMount,
    onBeforeUnmount,
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
    useMouse
};