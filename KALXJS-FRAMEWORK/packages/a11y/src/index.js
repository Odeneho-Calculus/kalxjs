/**
 * KALXJS Accessibility Module
 * Complete accessibility utilities and features
 *
 * @module @kalxjs/a11y
 */

// ARIA helpers
export {
    AriaRoles,
    setAriaAttribute,
    getAriaAttribute,
    setAriaAttributes,
    createAriaLabel,
    createAriaLabelledBy,
    createAriaDescribedBy,
    setExpanded,
    toggleExpanded,
    setPressed,
    togglePressed,
    setSelected,
    setChecked,
    setDisabled,
    setHidden,
    setLive,
    setAtomic,
    setRelevant,
    createAccessibleButton,
    createAccessibleDialog,
    createAccessibleMenu,
    createAccessibleTabs,
    announce as announceAria,
} from './aria.js';

// Focus management
export {
    getFocusableElements,
    getFirstFocusable,
    getLastFocusable,
    focusElement,
    focusFirst,
    focusLast,
    createFocusTrap,
    createFocusStore,
    createFocusScope,
    makeFocusable,
    isFocused,
    isFocusWithin,
    waitForFocus,
} from './focus-management.js';

// Keyboard navigation
export {
    Keys,
    isKey,
    hasModifier,
    createShortcut,
    createShortcutManager,
    createArrowNavigation,
    createRovingTabindex,
    makeKeyboardAccessible,
} from './keyboard-navigation.js';

// Screen reader
export {
    LivePriority,
    createAnnouncer,
    getGlobalAnnouncer,
    announce,
    announceAssertive,
    announcePolite,
    createStatusMessage,
    createVisuallyHidden,
    createLoadingAnnouncer,
    createProgressAnnouncer,
    isScreenReaderActive,
    addScreenReaderText,
    createAlert,
} from './screen-reader.js';

// Skip links
export {
    createSkipLink,
    createSkipLinks,
    installSkipLinks,
    SkipLinkPresets,
    createDynamicSkipLink,
    createSkipLinkGroup,
} from './skip-links.js';

// Directives
export {
    vFocus,
    vTrapFocus,
    vArrowNav,
    vRovingTabindex,
    vAnnounce,
    vSkipLink,
    vAria,
    a11yDirectives,
} from './a11y-directives.js';

// Testing
export {
    hasAccessibleName,
    getAccessibleName,
    isFocusable,
    hasRole,
    getA11yViolations,
    auditA11y,
    assertAccessible,
    createA11yTestHelpers,
    checkColorContrast,
} from './testing.js';

/**
 * Install a11y plugin for KALXJS
 */
export async function installA11y(app, options = {}) {
    const {
        installDirectives = true,
        installSkipLinks = true,
        skipLinksConfig = 'standard',
        createGlobalAnnouncer = true,
    } = options;

    // Install directives
    if (installDirectives) {
        const { a11yDirectives } = await import('./a11y-directives.js');
        Object.entries(a11yDirectives).forEach(([name, directive]) => {
            app.directive(name, directive);
        });
    }

    // Install skip links
    if (installSkipLinks) {
        const { installSkipLinks: install, SkipLinkPresets } = await import('./skip-links.js');
        const links = typeof skipLinksConfig === 'string'
            ? SkipLinkPresets[skipLinksConfig]?.() || []
            : skipLinksConfig;

        if (typeof document !== 'undefined') {
            install(links);
        }
    }

    // Create global announcer
    if (createGlobalAnnouncer && typeof document !== 'undefined') {
        const { getGlobalAnnouncer } = await import('./screen-reader.js');
        getGlobalAnnouncer();
    }

    return {
        name: 'KalxjsA11y',
        version: '1.0.0',
    };
}

/**
 * Default export
 */
export default {
    install: installA11y,
};