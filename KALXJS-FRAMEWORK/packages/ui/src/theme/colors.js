/**
 * Color System
 * Design tokens for colors with light/dark mode support
 *
 * @module @kalxjs/ui/theme/colors
 */

/**
 * Brand colors
 */
export const brandColors = {
    primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9', // Main primary
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
    },
    secondary: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7', // Main secondary
        600: '#9333ea',
        700: '#7e22ce',
        800: '#6b21a8',
        900: '#581c87',
    },
    success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e', // Main success
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
    },
    warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b', // Main warning
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
    },
    danger: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444', // Main danger
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
    },
    info: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6', // Main info
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
    },
};

/**
 * Neutral/grayscale colors
 */
export const neutralColors = {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
};

/**
 * Semantic color mappings for light mode
 */
export const lightModeColors = {
    background: {
        primary: '#ffffff',
        secondary: neutralColors[50],
        tertiary: neutralColors[100],
    },
    text: {
        primary: neutralColors[900],
        secondary: neutralColors[700],
        tertiary: neutralColors[500],
        inverse: '#ffffff',
    },
    border: {
        primary: neutralColors[200],
        secondary: neutralColors[300],
        focus: brandColors.primary[500],
    },
    surface: {
        primary: '#ffffff',
        secondary: neutralColors[50],
        overlay: 'rgba(0, 0, 0, 0.5)',
    },
};

/**
 * Semantic color mappings for dark mode
 */
export const darkModeColors = {
    background: {
        primary: neutralColors[900],
        secondary: neutralColors[800],
        tertiary: neutralColors[700],
    },
    text: {
        primary: neutralColors[50],
        secondary: neutralColors[300],
        tertiary: neutralColors[500],
        inverse: neutralColors[900],
    },
    border: {
        primary: neutralColors[700],
        secondary: neutralColors[600],
        focus: brandColors.primary[400],
    },
    surface: {
        primary: neutralColors[800],
        secondary: neutralColors[700],
        overlay: 'rgba(0, 0, 0, 0.7)',
    },
};

/**
 * Get theme colors based on mode
 */
export function getThemeColors(mode = 'light') {
    return mode === 'dark' ? darkModeColors : lightModeColors;
}

/**
 * Create CSS variables from color palette
 */
export function createColorVariables(mode = 'light') {
    const theme = getThemeColors(mode);
    const variables = {};

    // Add brand colors
    Object.entries(brandColors).forEach(([name, shades]) => {
        Object.entries(shades).forEach(([shade, value]) => {
            variables[`--color-${name}-${shade}`] = value;
        });
    });

    // Add neutral colors
    Object.entries(neutralColors).forEach(([shade, value]) => {
        variables[`--color-neutral-${shade}`] = value;
    });

    // Add semantic colors
    Object.entries(theme).forEach(([category, values]) => {
        Object.entries(values).forEach(([name, value]) => {
            variables[`--color-${category}-${name}`] = value;
        });
    });

    return variables;
}

/**
 * Export default theme colors
 */
export default {
    brand: brandColors,
    neutral: neutralColors,
    light: lightModeColors,
    dark: darkModeColors,
    getThemeColors,
    createColorVariables,
};