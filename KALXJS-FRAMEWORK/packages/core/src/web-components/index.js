/**
 * KALXJS Web Components Module
 * Export KALXJS components as standard Web Components
 *
 * @module @kalxjs/core/web-components
 */

export {
    defineCustomElement,
    registerCustomElement,
    registerCustomElements,
} from './custom-element.js';

export {
    createShadowRoot,
    injectStyles,
    createAdoptableStylesheet,
    adoptStylesheet,
    configureSlots,
    getAssignedNodes,
    getAssignedElements,
    createShadowTemplate,
    focusInShadow,
    queryShadow,
    isInShadowDOM,
    getShadowHost,
    StyleEncapsulation,
} from './shadow-dom.js';