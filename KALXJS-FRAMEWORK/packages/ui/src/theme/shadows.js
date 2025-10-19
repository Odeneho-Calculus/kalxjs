/**
 * Shadow System
 * Elevation and depth through box shadows
 *
 * @module @kalxjs/ui/theme/shadows
 */

/**
 * Box shadow scale for elevation
 */
export const shadows = {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

/**
 * Dark mode shadows (lighter for visibility)
 */
export const darkShadows = {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
};

/**
 * Focus ring styles
 */
export const focusRings = {
    default: '0 0 0 3px rgba(14, 165, 233, 0.3)',
    primary: '0 0 0 3px rgba(14, 165, 233, 0.3)',
    secondary: '0 0 0 3px rgba(168, 85, 247, 0.3)',
    success: '0 0 0 3px rgba(34, 197, 94, 0.3)',
    warning: '0 0 0 3px rgba(245, 158, 11, 0.3)',
    danger: '0 0 0 3px rgba(239, 68, 68, 0.3)',
};

/**
 * Get shadows based on theme mode
 */
export function getShadows(mode = 'light') {
    return mode === 'dark' ? darkShadows : shadows;
}

/**
 * Create CSS variables for shadows
 */
export function createShadowVariables(mode = 'light') {
    const themeShadows = getShadows(mode);
    const variables = {};

    // Add box shadows
    Object.entries(themeShadows).forEach(([name, value]) => {
        variables[`--shadow-${name}`] = value;
    });

    // Add focus rings
    Object.entries(focusRings).forEach(([name, value]) => {
        variables[`--focus-ring-${name}`] = value;
    });

    return variables;
}

/**
 * Elevation levels (semantic shadow names)
 */
export const elevation = {
    ground: shadows.none,
    raised: shadows.sm,
    floating: shadows.md,
    overlay: shadows.lg,
    modal: shadows.xl,
    popover: shadows['2xl'],
};

/**
 * Get elevation shadow
 */
export function getElevation(level, mode = 'light') {
    const themeShadows = getShadows(mode);
    const elevationMap = {
        ground: themeShadows.none,
        raised: themeShadows.sm,
        floating: themeShadows.md,
        overlay: themeShadows.lg,
        modal: themeShadows.xl,
        popover: themeShadows['2xl'],
    };
    return elevationMap[level] || themeShadows.none;
}

/**
 * Export default shadow configuration
 */
export default {
    shadows,
    darkShadows,
    focusRings,
    elevation,
    getShadows,
    getElevation,
    createVariables: createShadowVariables,
};