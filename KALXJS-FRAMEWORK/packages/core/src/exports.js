/**
 * Direct exports file to ensure all required functions are properly exported
 */

// Import from composition
import {
    watch,
    onMounted,
    onUnmounted,
    onBeforeUpdate,
    onUpdated,
    getCurrentInstance,
    setCurrentInstance
} from './composition.js';

// Import from lifecycle
import {
    onCreated,
    onBeforeMount,
    onBeforeUnmount,
    onErrorCaptured
} from './composition/lifecycle.js';

// Import from reactivity
import {
    reactive,
    ref,
    computed,
    effect
} from './reactivity/reactive.js';

// Import from vdom
import {
    h,
    createElement,
    updateElement
} from './vdom/vdom.js';

// Import from component
import {
    createComponent,
    defineComponent,
    createApp
} from './component/component.js';

// Direct exports to ensure these functions are available
export {
    // Composition API
    watch,
    onMounted,
    onUnmounted,
    onBeforeUpdate,
    onUpdated,
    getCurrentInstance,
    setCurrentInstance,

    // Lifecycle hooks
    onCreated,
    onBeforeMount,
    onBeforeUnmount,
    onErrorCaptured,

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
    createApp
};