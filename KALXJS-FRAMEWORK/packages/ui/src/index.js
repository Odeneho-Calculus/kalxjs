/**
 * KALXJS UI Component Library
 * Modern, accessible UI components for KALXJS applications
 *
 * @module @kalxjs/ui
 */

// Theme
export * from './theme/index.js';

// Components
export { default as Button, buttonStyles } from './components/Button.js';
export { default as Input, inputStyles } from './components/Input.js';
export { default as Modal, modalStyles } from './components/Modal.js';
export { default as Card, cardStyles } from './components/Card.js';
export { default as Alert, alertStyles } from './components/Alert.js';
export { default as Badge, badgeStyles } from './components/Badge.js';
export { default as Tooltip, tooltipStyles } from './components/Tooltip.js';
export { default as Dropdown, DropdownItem, dropdownStyles } from './components/Dropdown.js';
export { default as Tabs, TabList, Tab, TabPanels, TabPanel, tabsStyles } from './components/Tabs.js';

// Composables
export * from './composables/index.js';

/**
 * Install all component styles
 */
export function installStyles() {
    if (typeof document === 'undefined') return;

    const styleId = 'kalxjs-ui-styles';
    if (document.getElementById(styleId)) return;

    const {
        buttonStyles,
        inputStyles,
        modalStyles,
        cardStyles,
        alertStyles,
        badgeStyles,
        tooltipStyles,
        dropdownStyles,
        tabsStyles,
    } = await import('./index.js');

    const allStyles = [
        buttonStyles,
        inputStyles,
        modalStyles,
        cardStyles,
        alertStyles,
        badgeStyles,
        tooltipStyles,
        dropdownStyles,
        tabsStyles,
    ].join('\n\n');

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = allStyles;
    document.head.appendChild(style);
}

/**
 * KALXJS plugin
 */
export function installUI(app, options = {}) {
    const { theme, autoInstallStyles = true } = options;

    // Install theme
    if (theme) {
        const { installTheme } = await import('./theme/index.js');
        app.use(installTheme, theme);
    }

    // Install styles
    if (autoInstallStyles) {
        installStyles();
    }

    return {
        name: 'KalxjsUI',
        version: '1.0.0',
    };
}

/**
 * Default export
 */
export default {
    install: installUI,
    installStyles,
};