/**
 * KALXJS Internationalization Module
 * Complete i18n system with translation, formatting, and RTL support
 *
 * @module @kalxjs/i18n
 */

// Plugin
import { createI18n, installI18n } from './plugin.js';
export { createI18n, installI18n };

// Translator
import {
    createTranslator,
    createScopedTranslator,
    createNamespace,
} from './translator.js';
export {
    createTranslator,
    createScopedTranslator,
    createNamespace,
};

// Interpolation
export {
    interpolate,
    registerModifier,
    unregisterModifier,
    interpolateList,
    interpolateLinked,
    interpolateHtml,
    createInterpolator,
} from './interpolation.js';

// Pluralization
export {
    getPluralRule,
    pluralize,
    registerPluralRule,
    createPluralHelper,
    getIntlPluralRule,
    formatPlural,
} from './pluralization.js';

// Formatters
import {
    createDateTimeFormatter,
    createNumberFormatter,
    createCurrencyFormatter,
    createRelativeTimeFormatter,
    DateTimeFormats,
    NumberFormats,
} from './formatters.js';
export {
    createDateTimeFormatter,
    createNumberFormatter,
    createCurrencyFormatter,
    createRelativeTimeFormatter,
    DateTimeFormats,
    NumberFormats,
};

// RTL Support
export {
    isRTL,
    getDirection,
    applyDirection,
    createRTLStyles,
    createRTLDirective,
    registerRTLLocale,
    unregisterRTLLocale,
    getLogicalProperty,
} from './rtl.js';

// Loader
import {
    createTranslationLoader,
    createLazyLocaleLoader,
    createNamespaceLoader,
    setupAutoLoad,
} from './loader.js';
export {
    createTranslationLoader,
    createLazyLocaleLoader,
    createNamespaceLoader,
    setupAutoLoad,
};

// Composables
export {
    useI18n,
    useLocale,
    useScopedI18n,
    useDateTimeFormat,
    useNumberFormat,
    useTranslationLoader,
} from './composables.js';

/**
 * Create complete i18n instance with all features
 */
export function setupI18n(options = {}) {
    const i18n = createI18n(options);

    // Add translation methods
    const translator = createTranslator(i18n);
    const dateFormatter = createDateTimeFormatter(i18n);
    const numberFormatter = createNumberFormatter(i18n);

    Object.assign(i18n, translator, dateFormatter, numberFormatter);

    // Setup loader if provided
    if (options.loader) {
        const loader = createTranslationLoader(i18n, options.loader);
        i18n.loader = loader;

        if (options.loader.autoLoad) {
            setupAutoLoad(i18n, loader, options.loader);
        }
    }

    return i18n;
}

/**
 * Default export
 */
export default {
    createI18n: setupI18n,
    install: installI18n,
};