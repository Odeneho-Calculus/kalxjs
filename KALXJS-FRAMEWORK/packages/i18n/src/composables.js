/**
 * Composition API Hooks
 * useI18n and other composition utilities
 *
 * @module @kalxjs/i18n/composables
 */

import { inject, computed } from '@kalxjs/core';
import { createTranslator } from './translator.js';
import { createDateTimeFormatter, createNumberFormatter } from './formatters.js';

/**
 * Use i18n in component
 */
export function useI18n(options = {}) {
    const { useScope = 'global', messages } = options;

    // Get i18n instance from injection
    const globalI18n = inject('i18n');

    if (!globalI18n) {
        throw new Error('[i18n] useI18n must be used with i18n plugin installed');
    }

    // Create local scope if messages provided
    let i18n = globalI18n;

    if (useScope === 'local' && messages) {
        // Merge local messages
        Object.entries(messages).forEach(([locale, msgs]) => {
            globalI18n.mergeMessages(locale, msgs);
        });
    }

    // Create translator
    const translator = createTranslator(i18n);
    const dateFormatter = createDateTimeFormatter(i18n);
    const numberFormatter = createNumberFormatter(i18n);

    return {
        // Translation methods
        ...translator,

        // Formatting methods
        ...dateFormatter,
        ...numberFormatter,

        // State
        locale: i18n.locale,
        fallbackLocale: i18n.fallbackLocale,
        messages: i18n.messages,

        // Locale management
        setLocale: i18n.setLocale,
        availableLocales: computed(() => i18n.getAvailableLocales()),
    };
}

/**
 * Use locale (reactive locale value)
 */
export function useLocale() {
    const i18n = inject('i18n');

    if (!i18n) {
        throw new Error('[i18n] useLocale must be used with i18n plugin installed');
    }

    return {
        locale: i18n.locale,
        setLocale: i18n.setLocale,
        availableLocales: computed(() => i18n.getAvailableLocales()),
    };
}

/**
 * Use scoped translations
 */
export function useScopedI18n(scope) {
    const i18n = inject('i18n');

    if (!i18n) {
        throw new Error('[i18n] useScopedI18n must be used with i18n plugin installed');
    }

    const translator = createTranslator(i18n);

    function scopeKey(key) {
        return `${scope}.${key}`;
    }

    return {
        t: (key, values) => translator.t(scopeKey(key), values),
        tc: (key, choice, values) => translator.tc(scopeKey(key), choice, values),
        te: (key, locale) => translator.te(scopeKey(key), locale),
        td: (key, defaultValue, values) => translator.td(scopeKey(key), defaultValue, values),
    };
}

/**
 * Use datetime formatting
 */
export function useDateTimeFormat() {
    const i18n = inject('i18n');

    if (!i18n) {
        throw new Error('[i18n] useDateTimeFormat must be used with i18n plugin installed');
    }

    const { d } = createDateTimeFormatter(i18n);

    return {
        format: d,
        formatDate: (value, format) => d(value, format || 'short'),
        formatTime: (value) => d(value, 'time'),
        formatDateTime: (value) => d(value, 'datetime'),
    };
}

/**
 * Use number formatting
 */
export function useNumberFormat() {
    const i18n = inject('i18n');

    if (!i18n) {
        throw new Error('[i18n] useNumberFormat must be used with i18n plugin installed');
    }

    const { n } = createNumberFormatter(i18n);

    return {
        format: n,
        formatDecimal: (value) => n(value, 'decimal'),
        formatPercent: (value) => n(value, 'percent'),
        formatCurrency: (value, currency = 'USD') => n(value, { style: 'currency', currency }),
    };
}

/**
 * Use translation loading
 */
export function useTranslationLoader(loader) {
    const i18n = inject('i18n');

    if (!i18n) {
        throw new Error('[i18n] useTranslationLoader must be used with i18n plugin installed');
    }

    return {
        load: loader.load,
        preload: loader.preload,
        isLoaded: loader.isLoaded,
        isLoading: loader.isLoading,
    };
}