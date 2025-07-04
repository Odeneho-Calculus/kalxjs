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
    ref  // Import ref directly
} from './composition/index.js';

import {
    setCurrentInstance,
    getCurrentInstance,
    provide,
    inject
} from './composition/instance.js';

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
    ref,  // Export ref directly
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
    inject
};
