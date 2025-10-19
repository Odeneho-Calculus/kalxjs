/**
 * RTL (Right-to-Left) Support
 * Utilities for RTL languages
 *
 * @module @kalxjs/i18n/rtl
 */

/**
 * RTL locales
 */
const RTL_LOCALES = [
    'ar', // Arabic
    'he', // Hebrew
    'fa', // Persian
    'ur', // Urdu
    'yi', // Yiddish
    'ji', // Yiddish (old code)
    'iw', // Hebrew (old code)
    'ps', // Pashto
    'sd', // Sindhi
    'ug', // Uyghur
];

/**
 * Check if locale is RTL
 */
export function isRTL(locale) {
    if (!locale) return false;

    const lang = locale.split('-')[0].toLowerCase();
    return RTL_LOCALES.includes(lang);
}

/**
 * Get text direction for locale
 */
export function getDirection(locale) {
    return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Apply direction to document
 */
export function applyDirection(locale) {
    if (typeof document === 'undefined') return;

    const direction = getDirection(locale);
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
}

/**
 * Create RTL-aware styles
 */
export function createRTLStyles(styles, direction) {
    if (direction !== 'rtl') {
        return styles;
    }

    const rtlStyles = { ...styles };

    // Swap left/right properties
    const swapProperties = {
        'margin-left': 'margin-right',
        'margin-right': 'margin-left',
        'padding-left': 'padding-right',
        'padding-right': 'padding-left',
        'left': 'right',
        'right': 'left',
        'border-left': 'border-right',
        'border-right': 'border-left',
        'border-left-width': 'border-right-width',
        'border-right-width': 'border-left-width',
        'border-left-color': 'border-right-color',
        'border-right-color': 'border-left-color',
        'border-left-style': 'border-right-style',
        'border-right-style': 'border-left-style',
        'border-top-left-radius': 'border-top-right-radius',
        'border-top-right-radius': 'border-top-left-radius',
        'border-bottom-left-radius': 'border-bottom-right-radius',
        'border-bottom-right-radius': 'border-bottom-left-radius',
    };

    Object.entries(swapProperties).forEach(([ltr, rtl]) => {
        if (ltr in rtlStyles) {
            const temp = rtlStyles[ltr];
            rtlStyles[ltr] = rtlStyles[rtl] || temp;
            rtlStyles[rtl] = temp;
        }
    });

    // Flip text-align
    if (rtlStyles['text-align'] === 'left') {
        rtlStyles['text-align'] = 'right';
    } else if (rtlStyles['text-align'] === 'right') {
        rtlStyles['text-align'] = 'left';
    }

    // Flip float
    if (rtlStyles.float === 'left') {
        rtlStyles.float = 'right';
    } else if (rtlStyles.float === 'right') {
        rtlStyles.float = 'left';
    }

    // Flip transform
    if (rtlStyles.transform && rtlStyles.transform.includes('translateX')) {
        rtlStyles.transform = rtlStyles.transform.replace(
            /translateX\((-?\d+(?:\.\d+)?)(px|%|em|rem)\)/g,
            (match, value, unit) => `translateX(${-parseFloat(value)}${unit})`
        );
    }

    return rtlStyles;
}

/**
 * Create RTL directive
 */
export function createRTLDirective(i18n) {
    return {
        mounted(el, binding) {
            updateRTL(el, i18n.locale.value, binding.value);
        },
        updated(el, binding) {
            updateRTL(el, i18n.locale.value, binding.value);
        },
    };
}

function updateRTL(el, locale, options = {}) {
    const { auto = true, force } = options;

    let direction;

    if (force) {
        direction = force;
    } else if (auto) {
        direction = getDirection(locale);
    } else {
        return;
    }

    el.dir = direction;
}

/**
 * Register RTL locale
 */
export function registerRTLLocale(locale) {
    const lang = locale.split('-')[0].toLowerCase();
    if (!RTL_LOCALES.includes(lang)) {
        RTL_LOCALES.push(lang);
    }
}

/**
 * Unregister RTL locale
 */
export function unregisterRTLLocale(locale) {
    const lang = locale.split('-')[0].toLowerCase();
    const index = RTL_LOCALES.indexOf(lang);
    if (index !== -1) {
        RTL_LOCALES.splice(index, 1);
    }
}

/**
 * Get logical property for RTL
 */
export function getLogicalProperty(property, value, direction) {
    if (direction !== 'rtl') {
        return { [property]: value };
    }

    const logicalMap = {
        'margin-left': 'margin-inline-start',
        'margin-right': 'margin-inline-end',
        'padding-left': 'padding-inline-start',
        'padding-right': 'padding-inline-end',
        'border-left': 'border-inline-start',
        'border-right': 'border-inline-end',
        'left': 'inset-inline-start',
        'right': 'inset-inline-end',
    };

    const logicalProperty = logicalMap[property] || property;
    return { [logicalProperty]: value };
}