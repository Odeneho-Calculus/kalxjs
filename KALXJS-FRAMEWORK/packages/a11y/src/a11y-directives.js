/**
 * Accessibility Directives
 * KALXJS directives for accessibility features
 *
 * @module @kalxjs/a11y/directives
 */

import { createFocusTrap } from './focus-management.js';
import { createArrowNavigation, createRovingTabindex } from './keyboard-navigation.js';
import { announce } from './screen-reader.js';

/**
 * v-focus directive
 * Automatically focus element when mounted
 */
export const vFocus = {
    mounted(el, binding) {
        if (binding.value !== false) {
            el.focus();
        }
    },
};

/**
 * v-trap-focus directive
 * Trap focus within element
 */
export const vTrapFocus = {
    mounted(el, binding) {
        const options = typeof binding.value === 'object' ? binding.value : {};
        const trap = createFocusTrap(el, options);

        if (binding.value !== false) {
            trap.activate();
        }

        el._focusTrap = trap;
    },

    updated(el, binding) {
        if (el._focusTrap) {
            if (binding.value === false) {
                el._focusTrap.deactivate();
            } else if (!el._focusTrap.isActive()) {
                el._focusTrap.activate();
            }
        }
    },

    unmounted(el) {
        if (el._focusTrap) {
            el._focusTrap.deactivate();
            delete el._focusTrap;
        }
    },
};

/**
 * v-arrow-nav directive
 * Enable arrow key navigation
 */
export const vArrowNav = {
    mounted(el, binding) {
        const options = typeof binding.value === 'object' ? binding.value : {};
        const navigation = createArrowNavigation(el, options);

        navigation.enable();
        el._arrowNav = navigation;
    },

    unmounted(el) {
        if (el._arrowNav) {
            el._arrowNav.disable();
            delete el._arrowNav;
        }
    },
};

/**
 * v-roving-tabindex directive
 * Enable roving tabindex pattern
 */
export const vRovingTabindex = {
    mounted(el, binding) {
        const options = typeof binding.value === 'object' ? binding.value : {};
        const roving = createRovingTabindex(el, options);

        roving.enable();
        el._rovingTabindex = roving;
    },

    unmounted(el) {
        if (el._rovingTabindex) {
            el._rovingTabindex.disable();
            delete el._rovingTabindex;
        }
    },
};

/**
 * v-announce directive
 * Announce content changes to screen readers
 */
export const vAnnounce = {
    updated(el, binding) {
        if (binding.value && binding.value !== binding.oldValue) {
            const message = typeof binding.value === 'string'
                ? binding.value
                : el.textContent;

            const priority = binding.arg || 'polite';
            announce(message, priority);
        }
    },
};

/**
 * v-skip-link directive
 * Create skip link for element
 */
export const vSkipLink = {
    mounted(el, binding) {
        const { text, id } = binding.value || {};

        if (!id) {
            console.warn('v-skip-link requires an id');
            return;
        }

        el.id = id;

        if (!el.hasAttribute('tabindex')) {
            el.setAttribute('tabindex', '-1');
        }
    },
};

/**
 * v-aria directive
 * Dynamically set ARIA attributes
 */
export const vAria = {
    mounted(el, binding) {
        updateAriaAttributes(el, binding.value);
    },

    updated(el, binding) {
        updateAriaAttributes(el, binding.value);
    },
};

function updateAriaAttributes(el, attributes) {
    if (!attributes || typeof attributes !== 'object') return;

    Object.entries(attributes).forEach(([key, value]) => {
        const attrName = key.startsWith('aria-') ? key : `aria-${key}`;

        if (value === null || value === undefined || value === false) {
            el.removeAttribute(attrName);
        } else {
            el.setAttribute(attrName, String(value));
        }
    });
}

/**
 * Export all directives
 */
export const a11yDirectives = {
    focus: vFocus,
    trapFocus: vTrapFocus,
    arrowNav: vArrowNav,
    rovingTabindex: vRovingTabindex,
    announce: vAnnounce,
    skipLink: vSkipLink,
    aria: vAria,
};