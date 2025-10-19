/**
 * Pluralization Rules
 * Handle plural forms for different languages
 *
 * @module @kalxjs/i18n/pluralization
 */

/**
 * Pluralization rule functions
 */
const pluralRules = {
    // English, German, Dutch, Swedish, Danish, Norwegian, Finnish
    en(count) {
        return count === 1 ? 0 : 1;
    },

    // French, Brazilian Portuguese
    fr(count) {
        return count === 0 || count === 1 ? 0 : 1;
    },

    // Russian, Ukrainian, Serbian, Croatian
    ru(count) {
        if (count % 10 === 1 && count % 100 !== 11) {
            return 0;
        }
        if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
            return 1;
        }
        return 2;
    },

    // Czech, Slovak
    cs(count) {
        if (count === 1) {
            return 0;
        }
        if (count >= 2 && count <= 4) {
            return 1;
        }
        return 2;
    },

    // Polish
    pl(count) {
        if (count === 1) {
            return 0;
        }
        if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
            return 1;
        }
        return 2;
    },

    // Arabic
    ar(count) {
        if (count === 0) {
            return 0;
        }
        if (count === 1) {
            return 1;
        }
        if (count === 2) {
            return 2;
        }
        if (count % 100 >= 3 && count % 100 <= 10) {
            return 3;
        }
        if (count % 100 >= 11) {
            return 4;
        }
        return 5;
    },

    // Chinese, Japanese, Korean, Thai
    zh(count) {
        return 0;
    },
};

// Aliases
pluralRules.de = pluralRules.en;
pluralRules.nl = pluralRules.en;
pluralRules.sv = pluralRules.en;
pluralRules.da = pluralRules.en;
pluralRules.no = pluralRules.en;
pluralRules.fi = pluralRules.en;
pluralRules.es = pluralRules.en;
pluralRules.it = pluralRules.en;
pluralRules.pt = pluralRules.fr;
pluralRules.uk = pluralRules.ru;
pluralRules.sr = pluralRules.ru;
pluralRules.hr = pluralRules.ru;
pluralRules.sk = pluralRules.cs;
pluralRules.ja = pluralRules.zh;
pluralRules.ko = pluralRules.zh;
pluralRules.th = pluralRules.zh;

/**
 * Get pluralization rule for locale
 */
export function getPluralRule(locale) {
    // Extract language code (e.g., 'en' from 'en-US')
    const lang = locale.split('-')[0].toLowerCase();

    return pluralRules[lang] || pluralRules.en;
}

/**
 * Pluralize message
 */
export function pluralize(message, count, locale) {
    if (typeof message !== 'string') {
        return message;
    }

    // Split message by pipe (|)
    const choices = message.split('|').map(s => s.trim());

    if (choices.length === 1) {
        return choices[0];
    }

    // Get pluralization rule
    const rule = getPluralRule(locale);
    const index = rule(count);

    // Return the appropriate choice
    return choices[Math.min(index, choices.length - 1)] || choices[0];
}

/**
 * Register custom pluralization rule
 */
export function registerPluralRule(locale, rule) {
    pluralRules[locale.toLowerCase()] = rule;
}

/**
 * Create pluralization helper
 */
export function createPluralHelper(locale) {
    const rule = getPluralRule(locale);

    return {
        /**
         * Get plural form index
         */
        getIndex(count) {
            return rule(count);
        },

        /**
         * Choose from array of choices
         */
        choose(count, choices) {
            const index = rule(count);
            return choices[Math.min(index, choices.length - 1)] || choices[0];
        },

        /**
         * Pluralize message
         */
        pluralize(count, message) {
            return pluralize(message, count, locale);
        },
    };
}

/**
 * Use Intl.PluralRules if available (modern approach)
 */
export function getIntlPluralRule(locale) {
    if (typeof Intl !== 'undefined' && Intl.PluralRules) {
        const pluralRules = new Intl.PluralRules(locale);

        return (count) => {
            const rule = pluralRules.select(count);

            // Map Intl rules to indices
            switch (rule) {
                case 'zero':
                    return 0;
                case 'one':
                    return 1;
                case 'two':
                    return 2;
                case 'few':
                    return 3;
                case 'many':
                    return 4;
                case 'other':
                default:
                    return 5;
            }
        };
    }

    return getPluralRule(locale);
}

/**
 * Format with plural rules
 */
export function formatPlural(count, options, locale) {
    const {
        zero,
        one,
        two,
        few,
        many,
        other,
    } = options;

    const rule = getIntlPluralRule(locale);
    const index = rule(count);

    const forms = [zero, one, two, few, many, other];
    return forms[index] || other || String(count);
}