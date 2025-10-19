/**
 * ARIA Attributes Helpers
 * Utilities for managing ARIA attributes and roles
 *
 * @module @kalxjs/a11y/aria
 */

/**
 * Common ARIA roles
 */
export const AriaRoles = {
    // Landmark roles
    BANNER: 'banner',
    COMPLEMENTARY: 'complementary',
    CONTENTINFO: 'contentinfo',
    FORM: 'form',
    MAIN: 'main',
    NAVIGATION: 'navigation',
    REGION: 'region',
    SEARCH: 'search',

    // Widget roles
    ALERT: 'alert',
    ALERTDIALOG: 'alertdialog',
    BUTTON: 'button',
    CHECKBOX: 'checkbox',
    DIALOG: 'dialog',
    GRIDCELL: 'gridcell',
    LINK: 'link',
    LOG: 'log',
    MARQUEE: 'marquee',
    MENUITEM: 'menuitem',
    MENUITEMCHECKBOX: 'menuitemcheckbox',
    MENUITEMRADIO: 'menuitemradio',
    OPTION: 'option',
    PROGRESSBAR: 'progressbar',
    RADIO: 'radio',
    SCROLLBAR: 'scrollbar',
    SEARCHBOX: 'searchbox',
    SLIDER: 'slider',
    SPINBUTTON: 'spinbutton',
    STATUS: 'status',
    SWITCH: 'switch',
    TAB: 'tab',
    TABPANEL: 'tabpanel',
    TEXTBOX: 'textbox',
    TIMER: 'timer',
    TOOLTIP: 'tooltip',
    TREEITEM: 'treeitem',
};

/**
 * Set ARIA attribute on element
 */
export function setAriaAttribute(element, attribute, value) {
    if (!element) return;

    const ariaAttr = attribute.startsWith('aria-') ? attribute : `aria-${attribute}`;

    if (value === null || value === undefined || value === false) {
        element.removeAttribute(ariaAttr);
    } else {
        element.setAttribute(ariaAttr, String(value));
    }
}

/**
 * Get ARIA attribute from element
 */
export function getAriaAttribute(element, attribute) {
    if (!element) return null;

    const ariaAttr = attribute.startsWith('aria-') ? attribute : `aria-${attribute}`;
    return element.getAttribute(ariaAttr);
}

/**
 * Set multiple ARIA attributes at once
 */
export function setAriaAttributes(element, attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
        setAriaAttribute(element, key, value);
    });
}

/**
 * Create ARIA label helpers
 */
export function createAriaLabel(text, element) {
    if (!element) return;
    element.setAttribute('aria-label', text);
}

export function createAriaLabelledBy(ids, element) {
    if (!element) return;
    const idString = Array.isArray(ids) ? ids.join(' ') : ids;
    element.setAttribute('aria-labelledby', idString);
}

export function createAriaDescribedBy(ids, element) {
    if (!element) return;
    const idString = Array.isArray(ids) ? ids.join(' ') : ids;
    element.setAttribute('aria-describedby', idString);
}

/**
 * Expand/Collapse helpers
 */
export function setExpanded(element, isExpanded) {
    setAriaAttribute(element, 'expanded', isExpanded);
}

export function toggleExpanded(element) {
    const currentState = getAriaAttribute(element, 'expanded') === 'true';
    setExpanded(element, !currentState);
    return !currentState;
}

/**
 * Pressed state helpers
 */
export function setPressed(element, isPressed) {
    setAriaAttribute(element, 'pressed', isPressed);
}

export function togglePressed(element) {
    const currentState = getAriaAttribute(element, 'pressed') === 'true';
    setPressed(element, !currentState);
    return !currentState;
}

/**
 * Selected state helpers
 */
export function setSelected(element, isSelected) {
    setAriaAttribute(element, 'selected', isSelected);
}

/**
 * Checked state helpers
 */
export function setChecked(element, state) {
    // state can be true, false, or 'mixed'
    setAriaAttribute(element, 'checked', state);
}

/**
 * Disabled state helpers
 */
export function setDisabled(element, isDisabled) {
    setAriaAttribute(element, 'disabled', isDisabled);
}

/**
 * Hidden state helpers
 */
export function setHidden(element, isHidden) {
    setAriaAttribute(element, 'hidden', isHidden);
}

/**
 * Live region helpers
 */
export function setLive(element, value = 'polite') {
    // value can be 'off', 'polite', or 'assertive'
    setAriaAttribute(element, 'live', value);
}

export function setAtomic(element, isAtomic) {
    setAriaAttribute(element, 'atomic', isAtomic);
}

export function setRelevant(element, value = 'additions text') {
    // value can be 'additions', 'removals', 'text', 'all'
    setAriaAttribute(element, 'relevant', value);
}

/**
 * Create accessible button
 */
export function createAccessibleButton(options = {}) {
    const {
        role = 'button',
        label,
        pressed,
        expanded,
        controls,
        describedBy,
    } = options;

    return {
        role,
        'aria-label': label,
        'aria-pressed': pressed,
        'aria-expanded': expanded,
        'aria-controls': controls,
        'aria-describedby': describedBy,
    };
}

/**
 * Create accessible dialog
 */
export function createAccessibleDialog(options = {}) {
    const {
        role = 'dialog',
        modal = true,
        labelledBy,
        describedBy,
    } = options;

    return {
        role,
        'aria-modal': modal,
        'aria-labelledby': labelledBy,
        'aria-describedby': describedBy,
    };
}

/**
 * Create accessible menu
 */
export function createAccessibleMenu(options = {}) {
    const {
        role = 'menu',
        orientation = 'vertical',
        labelledBy,
    } = options;

    return {
        role,
        'aria-orientation': orientation,
        'aria-labelledby': labelledBy,
    };
}

/**
 * Create accessible tabs
 */
export function createAccessibleTabs(options = {}) {
    const { labelledBy } = options;

    return {
        tabList: {
            role: 'tablist',
            'aria-labelledby': labelledBy,
        },
        tab: (selected, controls) => ({
            role: 'tab',
            'aria-selected': selected,
            'aria-controls': controls,
            tabindex: selected ? 0 : -1,
        }),
        tabPanel: (labelledBy) => ({
            role: 'tabpanel',
            'aria-labelledby': labelledBy,
            tabindex: 0,
        }),
    };
}

/**
 * Announce to screen readers
 */
export function announce(message, priority = 'polite') {
    const announcer = document.getElementById('kalxjs-announcer');
    if (announcer) {
        announcer.textContent = message;
        setLive(announcer, priority);
    }
}