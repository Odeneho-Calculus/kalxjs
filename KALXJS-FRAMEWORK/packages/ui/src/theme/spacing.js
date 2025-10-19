/**
 * Spacing System
 * Consistent spacing scale for layout and components
 *
 * @module @kalxjs/ui/theme/spacing
 */

/**
 * Base spacing unit (4px)
 */
export const BASE_UNIT = 4;

/**
 * Spacing scale (multiples of base unit)
 */
export const spacing = {
    0: '0',
    1: `${BASE_UNIT}px`,          // 4px
    2: `${BASE_UNIT * 2}px`,      // 8px
    3: `${BASE_UNIT * 3}px`,      // 12px
    4: `${BASE_UNIT * 4}px`,      // 16px
    5: `${BASE_UNIT * 5}px`,      // 20px
    6: `${BASE_UNIT * 6}px`,      // 24px
    8: `${BASE_UNIT * 8}px`,      // 32px
    10: `${BASE_UNIT * 10}px`,    // 40px
    12: `${BASE_UNIT * 12}px`,    // 48px
    16: `${BASE_UNIT * 16}px`,    // 64px
    20: `${BASE_UNIT * 20}px`,    // 80px
    24: `${BASE_UNIT * 24}px`,    // 96px
    32: `${BASE_UNIT * 32}px`,    // 128px
    40: `${BASE_UNIT * 40}px`,    // 160px
    48: `${BASE_UNIT * 48}px`,    // 192px
    56: `${BASE_UNIT * 56}px`,    // 224px
    64: `${BASE_UNIT * 64}px`,    // 256px
};

/**
 * Semantic spacing for components
 */
export const componentSpacing = {
    // Padding
    paddingXs: spacing[1],
    paddingSm: spacing[2],
    paddingMd: spacing[4],
    paddingLg: spacing[6],
    paddingXl: spacing[8],

    // Margin
    marginXs: spacing[1],
    marginSm: spacing[2],
    marginMd: spacing[4],
    marginLg: spacing[6],
    marginXl: spacing[8],

    // Gap (for flexbox/grid)
    gapXs: spacing[1],
    gapSm: spacing[2],
    gapMd: spacing[4],
    gapLg: spacing[6],
    gapXl: spacing[8],
};

/**
 * Container max widths for responsive layouts
 */
export const containerMaxWidths = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
};

/**
 * Border radius scale
 */
export const borderRadius = {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
    full: '9999px',
};

/**
 * Create CSS variables from spacing scale
 */
export function createSpacingVariables() {
    const variables = {};

    // Add spacing scale
    Object.entries(spacing).forEach(([name, value]) => {
        variables[`--spacing-${name}`] = value;
    });

    // Add component spacing
    Object.entries(componentSpacing).forEach(([name, value]) => {
        variables[`--${name}`] = value;
    });

    // Add border radius
    Object.entries(borderRadius).forEach(([name, value]) => {
        variables[`--radius-${name}`] = value;
    });

    // Add container widths
    Object.entries(containerMaxWidths).forEach(([name, value]) => {
        variables[`--container-${name}`] = value;
    });

    return variables;
}

/**
 * Helper to get spacing value
 */
export function getSpacing(multiplier) {
    return `${BASE_UNIT * multiplier}px`;
}

/**
 * Export default spacing configuration
 */
export default {
    baseUnit: BASE_UNIT,
    spacing,
    component: componentSpacing,
    containers: containerMaxWidths,
    borderRadius,
    getSpacing,
    createVariables: createSpacingVariables,
};