/**
 * Formatters
 * Number, date, and currency formatting
 *
 * @module @kalxjs/i18n/formatters
 */

/**
 * Create date formatter
 */
export function createDateTimeFormatter(i18n) {
    function d(value, format, locale) {
        const targetLocale = locale || i18n.locale.value;
        const formats = i18n._state.datetimeFormats[targetLocale];

        let options = {};

        // Get format options
        if (typeof format === 'string' && formats && formats[format]) {
            options = formats[format];
        } else if (typeof format === 'object') {
            options = format;
        }

        // Format date
        try {
            const date = value instanceof Date ? value : new Date(value);

            if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
                const formatter = new Intl.DateTimeFormat(targetLocale, options);
                return formatter.format(date);
            }

            // Fallback to toLocaleString
            return date.toLocaleString(targetLocale, options);
        } catch (e) {
            console.error('[i18n] Date formatting error:', e);
            return String(value);
        }
    }

    return { d };
}

/**
 * Create number formatter
 */
export function createNumberFormatter(i18n) {
    function n(value, format, locale) {
        const targetLocale = locale || i18n.locale.value;
        const formats = i18n._state.numberFormats[targetLocale];

        let options = {};

        // Get format options
        if (typeof format === 'string' && formats && formats[format]) {
            options = formats[format];
        } else if (typeof format === 'object') {
            options = format;
        }

        // Format number
        try {
            const number = Number(value);

            if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
                const formatter = new Intl.NumberFormat(targetLocale, options);
                return formatter.format(number);
            }

            // Fallback to toLocaleString
            return number.toLocaleString(targetLocale, options);
        } catch (e) {
            console.error('[i18n] Number formatting error:', e);
            return String(value);
        }
    }

    return { n };
}

/**
 * Create currency formatter
 */
export function createCurrencyFormatter(locale) {
    function formatCurrency(value, currency, options = {}) {
        const {
            style = 'currency',
            currencyDisplay = 'symbol',
            minimumFractionDigits,
            maximumFractionDigits,
            ...rest
        } = options;

        try {
            if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
                const formatter = new Intl.NumberFormat(locale, {
                    style,
                    currency,
                    currencyDisplay,
                    minimumFractionDigits,
                    maximumFractionDigits,
                    ...rest,
                });
                return formatter.format(value);
            }

            // Fallback
            return `${currency} ${Number(value).toFixed(2)}`;
        } catch (e) {
            console.error('[i18n] Currency formatting error:', e);
            return String(value);
        }
    }

    return { formatCurrency };
}

/**
 * Create relative time formatter
 */
export function createRelativeTimeFormatter(locale) {
    function formatRelativeTime(value, unit, options = {}) {
        const {
            numeric = 'auto',
            style = 'long',
        } = options;

        try {
            if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
                const formatter = new Intl.RelativeTimeFormat(locale, {
                    numeric,
                    style,
                });
                return formatter.format(value, unit);
            }

            // Fallback
            const suffix = value > 0 ? 'from now' : 'ago';
            const absValue = Math.abs(value);
            return `${absValue} ${unit}${absValue !== 1 ? 's' : ''} ${suffix}`;
        } catch (e) {
            console.error('[i18n] Relative time formatting error:', e);
            return String(value);
        }
    }

    /**
     * Smart relative time (auto-selects unit)
     */
    function smartRelativeTime(date, options = {}) {
        const now = new Date();
        const target = date instanceof Date ? date : new Date(date);
        const diffMs = target - now;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (Math.abs(diffYears) > 0) {
            return formatRelativeTime(diffYears, 'year', options);
        }
        if (Math.abs(diffMonths) > 0) {
            return formatRelativeTime(diffMonths, 'month', options);
        }
        if (Math.abs(diffDays) > 0) {
            return formatRelativeTime(diffDays, 'day', options);
        }
        if (Math.abs(diffHours) > 0) {
            return formatRelativeTime(diffHours, 'hour', options);
        }
        if (Math.abs(diffMinutes) > 0) {
            return formatRelativeTime(diffMinutes, 'minute', options);
        }
        return formatRelativeTime(diffSeconds, 'second', options);
    }

    return {
        formatRelativeTime,
        smartRelativeTime,
    };
}

/**
 * Predefined format presets
 */
export const DateTimeFormats = {
    short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    },
    long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    },
    full: {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    },
    time: {
        hour: 'numeric',
        minute: 'numeric',
    },
    datetime: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    },
};

export const NumberFormats = {
    decimal: {
        style: 'decimal',
    },
    percent: {
        style: 'percent',
    },
    currency: {
        style: 'currency',
        currency: 'USD',
    },
    compact: {
        notation: 'compact',
    },
    scientific: {
        notation: 'scientific',
    },
};