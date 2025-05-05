// Re-export everything from vdom.js
import {
    createElement,
    h,
    createDOMElement,
    updateElement,
    updateProps
} from './vdom.js';

export {
    createElement,
    h,
    createDOMElement,
    updateElement,
    updateProps
};

// Also provide function to update children which is used internally
export { updateChildren } from './vdom.js';

// Default export for convenience
export default {
    createElement,
    h,
    createDOMElement,
    updateElement,
    updateProps
};