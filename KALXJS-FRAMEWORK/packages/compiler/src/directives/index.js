/**
 * Directives - Export all template directives
 */

export {
    compileVModel,
    generateVModelCode
} from './v-model.js';

export {
    compileVIf,
    generateVIfCode,
    optimizeVIf,
    createVIfHelper
} from './v-if.js';

export {
    compileVFor,
    parseVForExpression,
    generateVForCode,
    createVForHelper,
    optimizeVFor
} from './v-for.js';

export {
    compileVShow,
    generateVShowCode,
    createVShowHelper,
    mergeVShowWithStyle
} from './v-show.js';

export {
    compileVSlot,
    parseVSlot,
    generateSlotsCode,
    createSlotHelper,
    normalizeSlots
} from './v-slot.js';

/**
 * Registry of all directives
 */
export const directiveRegistry = {
    'v-model': compileVModel,
    'v-if': compileVIf,
    'v-else-if': compileVIf,
    'v-else': compileVIf,
    'v-for': compileVFor,
    'v-show': compileVShow,
    'v-slot': compileVSlot
};

/**
 * Compiles a directive
 * @param {string} name - Directive name
 * @param {Object} node - AST node
 * @param {string} value - Directive value
 * @param {Object} modifiers - Directive modifiers
 * @returns {Object} Compiled directive
 */
export function compileDirective(name, node, value, modifiers = {}) {
    const compiler = directiveRegistry[name];

    if (!compiler) {
        console.warn(`[KALXJS] Unknown directive: ${name}`);
        return null;
    }

    return compiler(node, value, modifiers);
}

/**
 * Creates all runtime helpers
 * @returns {Object} Runtime helpers
 */
export function createDirectiveHelpers() {
    return {
        vIf: createVIfHelper(),
        vFor: createVForHelper(),
        vShow: createVShowHelper(),
        renderSlot: createSlotHelper()
    };
}