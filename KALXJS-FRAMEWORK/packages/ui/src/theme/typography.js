/**
 * Typography System
 * Font families, sizes, weights, and line heights
 *
 * @module @kalxjs/ui/theme/typography
 */

/**
 * Font families
 */
export const fontFamilies = {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    mono: '"SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

/**
 * Font sizes (rem based for accessibility)
 */
export const fontSizes = {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
};

/**
 * Font weights
 */
export const fontWeights = {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
};

/**
 * Line heights
 */
export const lineHeights = {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
};

/**
 * Letter spacing
 */
export const letterSpacing = {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
};

/**
 * Text style presets
 */
export const textStyles = {
    h1: {
        fontSize: fontSizes['5xl'],
        fontWeight: fontWeights.bold,
        lineHeight: lineHeights.tight,
        letterSpacing: letterSpacing.tight,
    },
    h2: {
        fontSize: fontSizes['4xl'],
        fontWeight: fontWeights.bold,
        lineHeight: lineHeights.tight,
        letterSpacing: letterSpacing.tight,
    },
    h3: {
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.semibold,
        lineHeight: lineHeights.snug,
        letterSpacing: letterSpacing.tight,
    },
    h4: {
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.semibold,
        lineHeight: lineHeights.snug,
    },
    h5: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.semibold,
        lineHeight: lineHeights.normal,
    },
    h6: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.semibold,
        lineHeight: lineHeights.normal,
    },
    body: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.normal,
    },
    bodyLarge: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.relaxed,
    },
    bodySmall: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.normal,
    },
    caption: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.tight,
    },
    button: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
        lineHeight: lineHeights.none,
        letterSpacing: letterSpacing.wide,
        textTransform: 'uppercase',
    },
    label: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
        lineHeight: lineHeights.tight,
    },
    code: {
        fontFamily: fontFamilies.mono,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.normal,
    },
};

/**
 * Create CSS variables from typography system
 */
export function createTypographyVariables() {
    const variables = {};

    // Add font families
    Object.entries(fontFamilies).forEach(([name, value]) => {
        variables[`--font-${name}`] = value;
    });

    // Add font sizes
    Object.entries(fontSizes).forEach(([name, value]) => {
        variables[`--text-${name}`] = value;
    });

    // Add font weights
    Object.entries(fontWeights).forEach(([name, value]) => {
        variables[`--font-weight-${name}`] = value;
    });

    // Add line heights
    Object.entries(lineHeights).forEach(([name, value]) => {
        variables[`--leading-${name}`] = value;
    });

    // Add letter spacing
    Object.entries(letterSpacing).forEach(([name, value]) => {
        variables[`--tracking-${name}`] = value;
    });

    return variables;
}

/**
 * Get text style CSS
 */
export function getTextStyle(styleName) {
    return textStyles[styleName] || textStyles.body;
}

/**
 * Export default typography configuration
 */
export default {
    fontFamilies,
    fontSizes,
    fontWeights,
    lineHeights,
    letterSpacing,
    textStyles,
    getTextStyle,
    createVariables: createTypographyVariables,
};