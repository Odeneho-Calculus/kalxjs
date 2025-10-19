/**
 * Theme System
 * Complete design system with colors, typography, spacing, and shadows
 *
 * @module @kalxjs/ui/theme
 */

import colors, { createColorVariables } from './colors.js';
import spacing, { createSpacingVariables } from './spacing.js';
import typography, { createTypographyVariables } from './typography.js';
import shadows, { createShadowVariables } from './shadows.js';

/**
 * Default theme configuration
 */
export const defaultTheme = {
    mode: 'light',
    colors: colors.light,
    spacing: spacing.spacing,
    typography: typography.textStyles,
    shadows: shadows.shadows,
};

/**
 * Create complete theme
 */
export function createTheme(options = {}) {
    const {
        mode = 'light',
        colors: customColors = {},
        spacing: customSpacing = {},
        typography: customTypography = {},
        shadows: customShadows = {},
    } = options;

    return {
        mode,
        colors: {
            ...colors.getThemeColors(mode),
            ...customColors,
        },
        spacing: {
            ...spacing.spacing,
            ...customSpacing,
        },
        typography: {
            ...typography.textStyles,
            ...customTypography,
        },
        shadows: {
            ...shadows.getShadows(mode),
            ...customShadows,
        },
    };
}

/**
 * Create CSS variables from theme
 */
export function createThemeVariables(theme) {
    const mode = theme?.mode || 'light';

    return {
        ...createColorVariables(mode),
        ...createSpacingVariables(),
        ...createTypographyVariables(),
        ...createShadowVariables(mode),
    };
}

/**
 * Apply theme to document
 */
export function applyTheme(theme, target = document.documentElement) {
    const variables = createThemeVariables(theme);

    Object.entries(variables).forEach(([property, value]) => {
        target.style.setProperty(property, value);
    });

    // Set data attribute for theme mode
    target.setAttribute('data-theme', theme.mode);
}

/**
 * Theme provider for KALXJS
 */
export function installTheme(app, options = {}) {
    const theme = createTheme(options);

    // Apply theme on mount
    if (typeof document !== 'undefined') {
        applyTheme(theme);
    }

    // Provide theme globally
    app.provide('theme', theme);

    return {
        name: 'KalxjsTheme',
        version: '1.0.0',
        theme,
    };
}

/**
 * Composable to use theme
 */
export function useTheme() {
    // In a real KALXJS app, this would use inject()
    // For now, return a basic implementation
    return {
        theme: defaultTheme,
        setTheme: (newTheme) => {
            applyTheme(newTheme);
        },
        toggleMode: () => {
            const newMode = defaultTheme.mode === 'light' ? 'dark' : 'light';
            const newTheme = createTheme({ mode: newMode });
            applyTheme(newTheme);
            defaultTheme.mode = newMode;
        },
    };
}

/**
 * Export all theme utilities
 */
export {
    // Colors
    colors,
    createColorVariables,

    // Spacing
    spacing,
    createSpacingVariables,

    // Typography
    typography,
    createTypographyVariables,

    // Shadows
    shadows,
    createShadowVariables,
};

/**
 * Default export
 */
export default {
    default: defaultTheme,
    create: createTheme,
    apply: applyTheme,
    install: installTheme,
    use: useTheme,
    colors,
    spacing,
    typography,
    shadows,
};