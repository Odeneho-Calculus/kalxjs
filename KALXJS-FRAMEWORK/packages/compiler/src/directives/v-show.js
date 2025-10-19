/**
 * v-show Directive - Toggle display with CSS
 * Unlike v-if, keeps element in DOM and toggles display property
 */

/**
 * Compiles v-show directive
 * @param {Object} node - AST node
 * @param {string} condition - Show condition
 * @returns {Object} Compiled directive
 */
export function compileVShow(node, condition) {
    return {
        type: 'show',
        condition,
        node
    };
}

/**
 * Generates runtime code for v-show
 * @param {string} condition - Condition expression
 * @returns {string} Style binding code
 */
export function generateVShowCode(condition) {
    return `{
        style: {
            display: (${condition}) ? '' : 'none'
        }
    }`;
}

/**
 * Creates v-show runtime helper
 * @returns {Function} Runtime helper
 */
export function createVShowHelper() {
    return function vShow(el, condition) {
        if (!el) return;

        const display = condition ? '' : 'none';

        if (el.style) {
            el.style.display = display;
        }

        return condition;
    };
}

/**
 * Merges v-show with existing style prop
 * @param {Object} props - Existing props
 * @param {string} condition - Show condition
 * @returns {Object} Merged props
 */
export function mergeVShowWithStyle(props, condition) {
    const existingStyle = props.style || {};

    return {
        ...props,
        style: {
            ...existingStyle,
            display: condition ? (existingStyle.display || '') : 'none'
        }
    };
}