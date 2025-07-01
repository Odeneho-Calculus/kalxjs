// Re-export everything from vdom.js
import {
    createElement,
    h,
    createDOMElement,
    updateElement,
    updateProps
} from './vdom.js';

// Import SFC helper functions
import {
    openBlock,
    createBlock,
    toDisplayString,
    createVNode
} from './sfc-helpers.js';

export {
    createElement,
    h,
    createDOMElement,
    updateElement,
    updateProps,
    // Export SFC helper functions
    openBlock,
    createBlock,
    toDisplayString,
    createVNode
};

// Also provide function to update children which is used internally
export { updateChildren } from './vdom.js';

// Default export for convenience
export default {
    createElement,
    h,
    createDOMElement,
    updateElement,
    updateProps,
    // Include SFC helper functions
    openBlock,
    createBlock,
    toDisplayString,
    createVNode
};