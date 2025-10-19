/**
 * String Interpolation
 * Interpolate values into translation strings
 *
 * @module @kalxjs/i18n/interpolation
 */

/**
 * Interpolation patterns
 */
const INTERPOLATION_REGEX = /{([^}]+)}/g;
const NAMED_REGEX = /^[\w.]+$/;

/**
 * Interpolate values into message
 */
export function interpolate(message, values = {}) {
    if (!message || typeof message !== 'string') {
        return message;
    }

    return message.replace(INTERPOLATION_REGEX, (match, key) => {
        const trimmedKey = key.trim();

        // Handle modifiers (e.g., {name | uppercase})
        if (trimmedKey.includes('|')) {
            return interpolateWithModifiers(trimmedKey, values);
        }

        // Handle nested keys (e.g., {user.name})
        const value = getNestedValue(values, trimmedKey);

        return value !== undefined ? String(value) : match;
    });
}

/**
 * Get nested value from object
 */
function getNestedValue(obj, path) {
    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return undefined;
        }
    }

    return value;
}

/**
 * Interpolate with modifiers
 */
function interpolateWithModifiers(key, values) {
    const [varName, ...modifiers] = key.split('|').map(s => s.trim());
    let value = getNestedValue(values, varName);

    if (value === undefined) {
        return `{${key}}`;
    }

    // Apply modifiers
    for (const modifier of modifiers) {
        value = applyModifier(value, modifier);
    }

    return String(value);
}

/**
 * Apply modifier to value
 */
function applyModifier(value, modifier) {
    switch (modifier.toLowerCase()) {
        case 'uppercase':
        case 'upper':
            return String(value).toUpperCase();

        case 'lowercase':
        case 'lower':
            return String(value).toLowerCase();

        case 'capitalize':
            return String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();

        case 'trim':
            return String(value).trim();

        default:
            // Check for custom modifiers
            if (customModifiers[modifier]) {
                return customModifiers[modifier](value);
            }
            return value;
    }
}

/**
 * Custom modifiers registry
 */
const customModifiers = {};

/**
 * Register custom modifier
 */
export function registerModifier(name, fn) {
    customModifiers[name] = fn;
}

/**
 * Unregister custom modifier
 */
export function unregisterModifier(name) {
    delete customModifiers[name];
}

/**
 * List interpolation (e.g., "apple, banana, and orange")
 */
export function interpolateList(items, options = {}) {
    const {
        type = 'conjunction', // 'conjunction' or 'disjunction'
        style = 'long', // 'long', 'short', or 'narrow'
    } = options;

    if (!Array.isArray(items) || items.length === 0) {
        return '';
    }

    if (items.length === 1) {
        return String(items[0]);
    }

    // Check if Intl.ListFormat is available
    if (typeof Intl !== 'undefined' && Intl.ListFormat) {
        const formatter = new Intl.ListFormat('en', { type, style });
        return formatter.format(items.map(String));
    }

    // Fallback implementation
    if (items.length === 2) {
        const separator = type === 'conjunction' ? ' and ' : ' or ';
        return `${items[0]}${separator}${items[1]}`;
    }

    const last = items[items.length - 1];
    const rest = items.slice(0, -1);
    const separator = type === 'conjunction' ? ', and ' : ', or ';

    return `${rest.join(', ')}${separator}${last}`;
}

/**
 * Linked messages (reference other messages)
 */
export function interpolateLinked(message, getMessage, values = {}) {
    const LINKED_REGEX = /@:([^@\s]+)/g;

    return message.replace(LINKED_REGEX, (match, key) => {
        const linkedMessage = getMessage(key.trim());

        if (!linkedMessage) {
            return match;
        }

        return interpolate(linkedMessage, values);
    });
}

/**
 * HTML interpolation (with escaping)
 */
export function interpolateHtml(message, values = {}, escape = true) {
    const result = interpolate(message, values);

    if (!escape) {
        return result;
    }

    return escapeHtml(result);
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Create interpolation function with custom delimiters
 */
export function createInterpolator(options = {}) {
    const {
        prefix = '{',
        suffix = '}',
        modifierSeparator = '|',
    } = options;

    const regex = new RegExp(
        `${escapeRegex(prefix)}([^${escapeRegex(suffix)}]+)${escapeRegex(suffix)}`,
        'g'
    );

    return function interpolateCustom(message, values = {}) {
        if (!message || typeof message !== 'string') {
            return message;
        }

        return message.replace(regex, (match, key) => {
            const trimmedKey = key.trim();

            if (trimmedKey.includes(modifierSeparator)) {
                return interpolateWithModifiers(trimmedKey, values);
            }

            const value = getNestedValue(values, trimmedKey);
            return value !== undefined ? String(value) : match;
        });
    };
}

/**
 * Escape regex special characters
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}