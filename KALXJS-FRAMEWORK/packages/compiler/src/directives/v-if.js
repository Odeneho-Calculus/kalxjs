/**
 * v-if, v-else-if, v-else Directives - Conditional rendering
 * Only renders elements when condition is true
 */

/**
 * Compiles v-if directive
 * @param {Object} node - AST node
 * @param {string} condition - Condition expression
 * @param {Array} siblings - Sibling nodes for else-if/else
 * @returns {Object} Compiled conditional structure
 */
export function compileVIf(node, condition, siblings = []) {
    const branches = [{ condition, node }];

    // Look for v-else-if and v-else in siblings
    let currentIndex = siblings.indexOf(node);

    for (let i = currentIndex + 1; i < siblings.length; i++) {
        const sibling = siblings[i];

        if (sibling.directives?.['v-else-if']) {
            branches.push({
                condition: sibling.directives['v-else-if'],
                node: sibling
            });
        } else if (sibling.directives?.['v-else']) {
            branches.push({
                condition: null, // else has no condition
                node: sibling
            });
            break; // v-else is always the last branch
        } else {
            break; // No more related conditionals
        }
    }

    return {
        type: 'conditional',
        branches
    };
}

/**
 * Generates runtime code for v-if
 * @param {Object} conditional - Conditional structure
 * @returns {string} Runtime code
 */
export function generateVIfCode(conditional) {
    const { branches } = conditional;

    if (branches.length === 0) {
        return 'null';
    }

    // Build ternary chain
    let code = '';

    for (let i = 0; i < branches.length; i++) {
        const branch = branches[i];

        if (branch.condition === null) {
            // v-else
            code += generateNodeCode(branch.node);
        } else {
            // v-if or v-else-if
            if (i > 0) code += ' : ';
            code += `(${branch.condition}) ? ${generateNodeCode(branch.node)}`;
        }
    }

    // Close ternary chain with null
    if (branches[branches.length - 1].condition !== null) {
        code += ' : null';
    }

    return code;
}

/**
 * Generates code for a single node
 */
function generateNodeCode(node) {
    // Simplified node code generation
    // In real implementation, this would call the main code generator
    return `h('${node.tag}', ${JSON.stringify(node.props || {})}, ${JSON.stringify(node.children || [])})`;
}

/**
 * Optimizes v-if for static conditions
 * @param {string} condition - Condition expression
 * @returns {boolean|null} Static result or null if dynamic
 */
export function optimizeVIf(condition) {
    // Try to evaluate static conditions
    try {
        // Simple static conditions
        if (condition === 'true') return true;
        if (condition === 'false') return false;

        // Could add more complex static analysis here
        return null; // Dynamic condition
    } catch {
        return null;
    }
}

/**
 * Creates v-if runtime helper
 * @returns {Function} Runtime helper
 */
export function createVIfHelper() {
    return function vIf(condition, renderFn, elseFn = () => null) {
        return condition ? renderFn() : elseFn();
    };
}