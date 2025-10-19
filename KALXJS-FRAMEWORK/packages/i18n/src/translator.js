/**
 * Translator
 * Translation management and interpolation
 *
 * @module @kalxjs/i18n/translator
 */

import { interpolate } from './interpolation.js';
import { pluralize } from './pluralization.js';

/**
 * Create translator
 */
export function createTranslator(i18n) {
    /**
     * Translate key
     */
    function t(key, values = {}) {
        let message = i18n.getMessage(key);

        // Try fallback locale if message not found
        if (!message && i18n.fallbackLocale.value !== i18n.locale.value) {
            message = i18n.getMessage(key, i18n.fallbackLocale.value);
        }

        // Call missing handler if provided
        if (!message) {
            const missingHandler = i18n.getMissingHandler();
            if (missingHandler) {
                message = missingHandler(i18n.locale.value, key, values);
            }
        }

        // Return key if no message found
        if (!message) {
            return key;
        }

        // Interpolate values
        return interpolate(message, values);
    }

    /**
     * Translate with choice (pluralization)
     */
    function tc(key, choice = 1, values = {}) {
        let message = i18n.getMessage(key);

        // Try fallback locale
        if (!message && i18n.fallbackLocale.value !== i18n.locale.value) {
            message = i18n.getMessage(key, i18n.fallbackLocale.value);
        }

        if (!message) {
            return key;
        }

        // Apply pluralization
        const pluralized = pluralize(message, choice, i18n.locale.value);

        // Interpolate with count
        return interpolate(pluralized, { ...values, count: choice });
    }

    /**
     * Check if translation exists
     */
    function te(key, locale) {
        const message = i18n.getMessage(key, locale);
        return message !== null;
    }

    /**
     * Translate with default value
     */
    function td(key, defaultValue, values = {}) {
        if (te(key)) {
            return t(key, values);
        }
        return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }

    /**
     * Translate and return object
     */
    function to(key, values = {}) {
        const message = i18n.getMessage(key);

        if (!message) {
            return null;
        }

        if (typeof message === 'object') {
            const result = {};
            for (const k in message) {
                result[k] = interpolate(message[k], values);
            }
            return result;
        }

        return interpolate(message, values);
    }

    /**
     * Translate array of keys
     */
    function tm(keys, values = {}) {
        return keys.map(key => t(key, values));
    }

    /**
     * Get raw message without interpolation
     */
    function tr(key) {
        return i18n.getMessage(key) || key;
    }

    return {
        t,
        tc,
        te,
        td,
        to,
        tm,
        tr,
    };
}

/**
 * Create scoped translator
 */
export function createScopedTranslator(i18n, scope) {
    const translator = createTranslator(i18n);

    function scopeKey(key) {
        return `${scope}.${key}`;
    }

    return {
        t: (key, values) => translator.t(scopeKey(key), values),
        tc: (key, choice, values) => translator.tc(scopeKey(key), choice, values),
        te: (key, locale) => translator.te(scopeKey(key), locale),
        td: (key, defaultValue, values) => translator.td(scopeKey(key), defaultValue, values),
        to: (key, values) => translator.to(scopeKey(key), values),
        tm: (keys, values) => translator.tm(keys.map(scopeKey), values),
        tr: (key) => translator.tr(scopeKey(key)),
    };
}

/**
 * Create translation namespace
 */
export function createNamespace(i18n, namespace) {
    const translator = createTranslator(i18n);
    const prefix = namespace ? `${namespace}.` : '';

    return new Proxy(translator, {
        get(target, prop) {
            if (prop in target) {
                return target[prop];
            }

            // Create nested namespace
            return createNamespace(i18n, `${prefix}${String(prop)}`);
        },
    });
}