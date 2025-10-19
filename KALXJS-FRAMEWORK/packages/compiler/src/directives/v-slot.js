/**
 * v-slot Directive - Named and scoped slots
 * Enables content distribution with data passing
 */

/**
 * Compiles v-slot directive
 * @param {Object} node - AST node
 * @param {string} slotName - Slot name (default if not specified)
 * @param {string} slotProps - Slot props binding
 * @returns {Object} Compiled slot
 */
export function compileVSlot(node, slotName = 'default', slotProps) {
    return {
        type: 'slot',
        name: slotName,
        props: slotProps,
        content: node.children || []
    };
}

/**
 * Parses v-slot shorthand
 * @param {string} directive - Directive value (e.g., #header="{ user }")
 * @returns {Object} Parsed slot info
 */
export function parseVSlot(directive) {
    // Match patterns:
    // v-slot:header
    // v-slot:header="props"
    // #header
    // #header="{ user }"

    const slotRE = /^(#|v-slot:)([^=]+)(?:="([^"]*)")?/;
    const match = directive.match(slotRE);

    if (!match) {
        return { name: 'default', props: null };
    }

    return {
        name: match[2]?.trim() || 'default',
        props: match[3]?.trim() || null
    };
}

/**
 * Generates runtime code for slots
 * @param {Array} slots - Compiled slots
 * @returns {string} Slots object code
 */
export function generateSlotsCode(slots) {
    if (!slots || slots.length === 0) {
        return '{}';
    }

    const slotEntries = slots.map(slot => {
        const propsParam = slot.props || '';
        const content = generateSlotContent(slot.content);

        return `${slot.name}: (${propsParam}) => ${content}`;
    });

    return `{ ${slotEntries.join(', ')} }`;
}

/**
 * Generates slot content code
 */
function generateSlotContent(content) {
    if (!content || content.length === 0) {
        return '[]';
    }

    // Simplified - would use full code generator in real implementation
    return JSON.stringify(content);
}

/**
 * Creates slot runtime helper
 * @returns {Function} Runtime helper
 */
export function createSlotHelper() {
    return function renderSlot(slots, name = 'default', props = {}, fallback = null) {
        const slot = slots[name];

        if (slot) {
            return slot(props);
        }

        if (fallback) {
            return typeof fallback === 'function' ? fallback() : fallback;
        }

        return null;
    };
}

/**
 * Normalizes slots object
 * @param {Object} slots - Raw slots
 * @returns {Object} Normalized slots
 */
export function normalizeSlots(slots) {
    const normalized = {};

    if (!slots) return normalized;

    // Handle default slot
    if (typeof slots === 'function') {
        normalized.default = slots;
        return normalized;
    }

    // Handle object slots
    Object.keys(slots).forEach(key => {
        const slot = slots[key];
        normalized[key] = typeof slot === 'function'
            ? slot
            : () => slot;
    });

    return normalized;
}