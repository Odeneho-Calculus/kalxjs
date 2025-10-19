/**
 * i18n Plugin
 * Main plugin for internationalization
 *
 * @module @kalxjs/i18n/plugin
 */

import { reactive, computed } from '@kalxjs/core';

/**
 * Create i18n instance
 */
export function createI18n(options = {}) {
    const {
        locale = 'en',
        fallbackLocale = 'en',
        messages = {},
        datetimeFormats = {},
        numberFormats = {},
        missing = null,
        silentTranslationWarn = false,
        silentFallbackWarn = false,
    } = options;

    const state = reactive({
        locale,
        fallbackLocale,
        messages,
        datetimeFormats,
        numberFormats,
    });

    /**
     * Get current locale
     */
    const currentLocale = computed(() => state.locale);

    /**
     * Get current messages
     */
    const currentMessages = computed(() => state.messages[state.locale] || {});

    /**
     * Set locale
     */
    function setLocale(newLocale) {
        if (!state.messages[newLocale] && !silentFallbackWarn) {
            console.warn(`[i18n] Locale "${newLocale}" not found, falling back to "${state.fallbackLocale}"`);
        }
        state.locale = newLocale;
    }

    /**
     * Get message by key
     */
    function getMessage(key, locale = state.locale) {
        const messages = state.messages[locale];
        if (!messages) {
            return null;
        }

        // Support nested keys (e.g., "user.name")
        const keys = key.split('.');
        let value = messages;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }

        return typeof value === 'string' ? value : null;
    }

    /**
     * Set messages for locale
     */
    function setMessages(locale, messages) {
        state.messages[locale] = {
            ...state.messages[locale],
            ...messages,
        };
    }

    /**
     * Merge messages for locale
     */
    function mergeMessages(locale, messages) {
        if (!state.messages[locale]) {
            state.messages[locale] = {};
        }

        state.messages[locale] = deepMerge(state.messages[locale], messages);
    }

    /**
     * Get available locales
     */
    function getAvailableLocales() {
        return Object.keys(state.messages);
    }

    /**
     * Check if locale exists
     */
    function hasLocale(locale) {
        return locale in state.messages;
    }

    /**
     * Set datetime formats
     */
    function setDatetimeFormats(locale, formats) {
        state.datetimeFormats[locale] = formats;
    }

    /**
     * Set number formats
     */
    function setNumberFormats(locale, formats) {
        state.numberFormats[locale] = formats;
    }

    /**
     * Get missing handler
     */
    function getMissingHandler() {
        return missing;
    }

    return {
        // State
        locale: currentLocale,
        messages: currentMessages,
        fallbackLocale: computed(() => state.fallbackLocale),

        // Methods
        setLocale,
        getMessage,
        setMessages,
        mergeMessages,
        getAvailableLocales,
        hasLocale,
        setDatetimeFormats,
        setNumberFormats,
        getMissingHandler,

        // Internal state (for advanced use)
        _state: state,
    };
}

/**
 * Deep merge objects
 */
function deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }

    return result;
}

/**
 * Install i18n plugin
 */
export function installI18n(app, i18n) {
    // Provide i18n instance
    app.provide('i18n', i18n);

    // Add global properties
    app.config.globalProperties.$t = i18n.t;
    app.config.globalProperties.$tc = i18n.tc;
    app.config.globalProperties.$te = i18n.te;
    app.config.globalProperties.$d = i18n.d;
    app.config.globalProperties.$n = i18n.n;
    app.config.globalProperties.$i18n = i18n;

    return {
        name: 'KalxjsI18n',
        version: '1.0.0',
    };
}