/**
 * KALXJS Shadow DOM Utilities
 * Advanced shadow DOM support for web components
 *
 * @module @kalxjs/core/web-components/shadow-dom
 */

/**
 * Create a shadow root with KALXJS integration
 *
 * @param {HTMLElement} host - Host element
 * @param {Object} options - Shadow DOM options
 * @returns {ShadowRoot}
 */
export function createShadowRoot(host, options = {}) {
    const {
        mode = 'open',
        delegatesFocus = false,
        slotAssignment = 'named',
    } = options;

    const shadowRoot = host.attachShadow({
        mode,
        delegatesFocus,
        ...(slotAssignment && { slotAssignment }),
    });

    return shadowRoot;
}

/**
 * Inject styles into shadow root
 *
 * @param {ShadowRoot} shadowRoot - Shadow root
 * @param {string|Array<string>} styles - CSS styles
 */
export function injectStyles(shadowRoot, styles) {
    const styleArray = Array.isArray(styles) ? styles : [styles];

    styleArray.forEach(css => {
        const styleEl = document.createElement('style');
        styleEl.textContent = css;
        shadowRoot.appendChild(styleEl);
    });
}

/**
 * Create adoptable stylesheet for shadow DOM
 * (More performant for shared styles)
 *
 * @param {string} css - CSS content
 * @returns {CSSStyleSheet|null}
 */
export function createAdoptableStylesheet(css) {
    if (!window.CSSStyleSheet || !('adoptedStyleSheets' in document)) {
        console.warn('Adoptable stylesheets not supported');
        return null;
    }

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    return sheet;
}

/**
 * Adopt stylesheet into shadow root
 *
 * @param {ShadowRoot} shadowRoot - Shadow root
 * @param {CSSStyleSheet|Array<CSSStyleSheet>} sheets - Stylesheets to adopt
 */
export function adoptStylesheet(shadowRoot, sheets) {
    if (!shadowRoot.adoptedStyleSheets) {
        console.warn('Adopted stylesheets not supported');
        return;
    }

    const sheetArray = Array.isArray(sheets) ? sheets : [sheets];
    shadowRoot.adoptedStyleSheets = [
        ...shadowRoot.adoptedStyleSheets,
        ...sheetArray,
    ];
}

/**
 * Handle slot projection in shadow DOM
 *
 * @param {ShadowRoot} shadowRoot - Shadow root
 * @param {Object} slots - Slot configuration
 */
export function configureSlots(shadowRoot, slots = {}) {
    const slotElements = shadowRoot.querySelectorAll('slot');

    slotElements.forEach(slot => {
        const name = slot.getAttribute('name') || 'default';

        if (slots[name]) {
            // Configure slot with provided options
            const { fallback, onChange } = slots[name];

            if (fallback && slot.assignedNodes().length === 0) {
                slot.innerHTML = fallback;
            }

            if (onChange) {
                slot.addEventListener('slotchange', (e) => {
                    onChange(slot.assignedNodes({ flatten: true }));
                });
            }
        }
    });
}

/**
 * Get assigned nodes for a slot
 *
 * @param {HTMLSlotElement} slot - Slot element
 * @param {boolean} flatten - Whether to flatten nested slots
 * @returns {Array<Node>}
 */
export function getAssignedNodes(slot, flatten = true) {
    if (!slot || !(slot instanceof HTMLSlotElement)) {
        return [];
    }

    return slot.assignedNodes({ flatten });
}

/**
 * Get assigned elements for a slot (elements only, no text nodes)
 *
 * @param {HTMLSlotElement} slot - Slot element
 * @param {boolean} flatten - Whether to flatten nested slots
 * @returns {Array<Element>}
 */
export function getAssignedElements(slot, flatten = true) {
    if (!slot || !(slot instanceof HTMLSlotElement)) {
        return [];
    }

    return slot.assignedElements({ flatten });
}

/**
 * Create a template for shadow DOM content
 *
 * @param {string} html - HTML content
 * @param {string|Array<string>} styles - CSS styles
 * @returns {DocumentFragment}
 */
export function createShadowTemplate(html, styles = []) {
    const template = document.createElement('template');

    const styleArray = Array.isArray(styles) ? styles : [styles];
    const styleContent = styleArray.map(css => `<style>${css}</style>`).join('\n');

    template.innerHTML = `${styleContent}\n${html}`;

    return template.content.cloneNode(true);
}

/**
 * Focus management for shadow DOM
 *
 * @param {ShadowRoot} shadowRoot - Shadow root
 * @param {string} selector - Selector for element to focus
 */
export function focusInShadow(shadowRoot, selector) {
    const element = shadowRoot.querySelector(selector);

    if (element && typeof element.focus === 'function') {
        element.focus();
    }
}

/**
 * Query elements across shadow boundaries
 *
 * @param {Element} root - Root element
 * @param {string} selector - CSS selector
 * @returns {Array<Element>}
 */
export function queryShadow(root, selector) {
    const results = [];

    function traverse(node) {
        if (node.matches && node.matches(selector)) {
            results.push(node);
        }

        // Traverse children
        const children = node.children || [];
        for (const child of children) {
            traverse(child);
        }

        // Traverse shadow root
        if (node.shadowRoot) {
            const shadowChildren = node.shadowRoot.children || [];
            for (const child of shadowChildren) {
                traverse(child);
            }
        }
    }

    traverse(root);
    return results;
}

/**
 * Check if element is in shadow DOM
 *
 * @param {Element} element - Element to check
 * @returns {boolean}
 */
export function isInShadowDOM(element) {
    return element.getRootNode() instanceof ShadowRoot;
}

/**
 * Get shadow root host
 *
 * @param {Element} element - Element in shadow DOM
 * @returns {Element|null}
 */
export function getShadowHost(element) {
    const root = element.getRootNode();
    return root instanceof ShadowRoot ? root.host : null;
}

/**
 * Style encapsulation utilities
 */
export const StyleEncapsulation = {
    /**
     * Scope CSS to shadow root using :host selector
     */
    scopeToHost(css) {
        return `:host {\n${css}\n}`;
    },

    /**
     * Scope CSS to specific host states
     */
    scopeToHostState(state, css) {
        return `:host(${state}) {\n${css}\n}`;
    },

    /**
     * Style slotted content
     */
    scopeToSlotted(selector, css) {
        return `::slotted(${selector}) {\n${css}\n}`;
    },

    /**
     * Apply CSS custom properties for theming
     */
    withCSSVariables(variables) {
        const entries = Object.entries(variables);
        return entries.map(([key, value]) => `${key}: ${value};`).join('\n');
    },
};