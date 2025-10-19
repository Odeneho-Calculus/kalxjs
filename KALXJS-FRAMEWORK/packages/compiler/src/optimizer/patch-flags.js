/**
 * KALXJS Patch Flag Optimizer
 * Adds flags to vnodes to optimize diffing algorithm
 * Inspired by Vue 3's PatchFlags system
 *
 * @module @kalxjs/compiler/optimizer/patch-flags
 */

/**
 * Patch flags for optimization hints
 * These tell the runtime exactly what changed in a vnode
 */
export const PatchFlags = {
    // Dynamic text content
    TEXT: 1,                    // 1

    // Dynamic class binding
    CLASS: 1 << 1,             // 2

    // Dynamic style binding
    STYLE: 1 << 2,             // 4

    // Dynamic props (excluding class and style)
    PROPS: 1 << 3,             // 8

    // Dynamic props with keys (need full diff)
    FULL_PROPS: 1 << 4,        // 16

    // Has event listeners
    HYDRATE_EVENTS: 1 << 5,    // 32

    // Stable fragment (children order won't change)
    STABLE_FRAGMENT: 1 << 6,   // 64

    // Fragment with keyed children
    KEYED_FRAGMENT: 1 << 7,    // 128

    // Fragment with unkeyed children
    UNKEYED_FRAGMENT: 1 << 8,  // 256

    // Need full patch (bail out of optimization)
    NEED_PATCH: 1 << 9,        // 512

    // Dynamic slots
    DYNAMIC_SLOTS: 1 << 10,    // 1024

    // Hoisted static node (never needs patch)
    HOISTED: -1,

    // Bail (skip optimization completely)
    BAIL: -2
};

/**
 * Analyze node and determine appropriate patch flags
 *
 * @param {object} node - AST node
 * @returns {number} - Combined patch flags
 */
export function analyzePatchFlags(node) {
    if (!node || node.type !== 'element') {
        return 0;
    }

    let flags = 0;

    // Check for dynamic text
    if (hasDynamicText(node)) {
        flags |= PatchFlags.TEXT;
    }

    // Check for dynamic class
    if (hasDynamicClass(node)) {
        flags |= PatchFlags.CLASS;
    }

    // Check for dynamic style
    if (hasDynamicStyle(node)) {
        flags |= PatchFlags.STYLE;
    }

    // Check for dynamic props
    if (hasDynamicProps(node)) {
        flags |= PatchFlags.PROPS;
    }

    // Check for event listeners
    if (hasEventListeners(node)) {
        flags |= PatchFlags.HYDRATE_EVENTS;
    }

    // Check for dynamic slots
    if (hasDynamicSlots(node)) {
        flags |= PatchFlags.DYNAMIC_SLOTS;
    }

    // Check children type for fragment flags
    if (node.children) {
        if (hasKeyedChildren(node)) {
            flags |= PatchFlags.KEYED_FRAGMENT;
        } else if (hasUnkeyedChildren(node)) {
            flags |= PatchFlags.UNKEYED_FRAGMENT;
        } else if (isStableFragment(node)) {
            flags |= PatchFlags.STABLE_FRAGMENT;
        }
    }

    return flags;
}

/**
 * Check if node has dynamic text content
 */
function hasDynamicText(node) {
    if (node.children && node.children.length === 1) {
        const child = node.children[0];
        return child.type === 'interpolation' || child.type === 'expression';
    }
    return false;
}

/**
 * Check if node has dynamic class binding
 */
function hasDynamicClass(node) {
    if (!node.props) return false;

    return node.props.some(prop =>
        prop.name === 'class' && (prop.dynamic || prop.expression)
    );
}

/**
 * Check if node has dynamic style binding
 */
function hasDynamicStyle(node) {
    if (!node.props) return false;

    return node.props.some(prop =>
        prop.name === 'style' && (prop.dynamic || prop.expression)
    );
}

/**
 * Check if node has dynamic props
 */
function hasDynamicProps(node) {
    if (!node.props) return false;

    return node.props.some(prop =>
        prop.name !== 'class' &&
        prop.name !== 'style' &&
        (prop.dynamic || prop.expression)
    );
}

/**
 * Check if node has event listeners
 */
function hasEventListeners(node) {
    if (!node.props) return false;

    return node.props.some(prop =>
        prop.name.startsWith('@') || prop.name.startsWith('on')
    );
}

/**
 * Check if node has dynamic slots
 */
function hasDynamicSlots(node) {
    if (!node.slots) return false;

    return Object.values(node.slots).some(slot => slot.dynamic);
}

/**
 * Check if children are keyed
 */
function hasKeyedChildren(node) {
    if (!node.children || node.children.length === 0) return false;

    return node.children.some(child =>
        child.type === 'element' && child.key != null
    );
}

/**
 * Check if children are explicitly unkeyed
 */
function hasUnkeyedChildren(node) {
    if (!node.children || node.children.length === 0) return false;

    return node.children.every(child =>
        child.type === 'element' && child.key == null
    );
}

/**
 * Check if fragment children are stable (won't reorder)
 */
function isStableFragment(node) {
    if (!node.children) return true;

    // Children without v-for are considered stable
    return !node.directives?.some(dir => dir.name === 'for');
}

/**
 * Add patch flags to AST nodes
 *
 * @param {object} ast - Abstract Syntax Tree
 * @returns {object} - AST with patch flags
 */
export function addPatchFlags(ast) {
    const walk = (node) => {
        if (!node) return node;

        // Add patch flags to element nodes
        if (node.type === 'element') {
            node.patchFlag = analyzePatchFlags(node);
        }

        // Process children recursively
        if (node.children && Array.isArray(node.children)) {
            node.children = node.children.map(walk);
        }

        return node;
    };

    return walk(ast);
}

/**
 * Get human-readable description of patch flags
 *
 * @param {number} flags - Patch flags
 * @returns {Array<string>} - Array of flag descriptions
 */
export function describePatchFlags(flags) {
    const descriptions = [];

    if (flags === PatchFlags.HOISTED) return ['HOISTED (static)'];
    if (flags === PatchFlags.BAIL) return ['BAIL (no optimization)'];
    if (flags === 0) return ['STATIC (no dynamic content)'];

    if (flags & PatchFlags.TEXT) descriptions.push('TEXT');
    if (flags & PatchFlags.CLASS) descriptions.push('CLASS');
    if (flags & PatchFlags.STYLE) descriptions.push('STYLE');
    if (flags & PatchFlags.PROPS) descriptions.push('PROPS');
    if (flags & PatchFlags.FULL_PROPS) descriptions.push('FULL_PROPS');
    if (flags & PatchFlags.HYDRATE_EVENTS) descriptions.push('EVENTS');
    if (flags & PatchFlags.STABLE_FRAGMENT) descriptions.push('STABLE_FRAGMENT');
    if (flags & PatchFlags.KEYED_FRAGMENT) descriptions.push('KEYED_FRAGMENT');
    if (flags & PatchFlags.UNKEYED_FRAGMENT) descriptions.push('UNKEYED_FRAGMENT');
    if (flags & PatchFlags.NEED_PATCH) descriptions.push('NEED_PATCH');
    if (flags & PatchFlags.DYNAMIC_SLOTS) descriptions.push('DYNAMIC_SLOTS');

    return descriptions;
}

/**
 * Generate optimized patch code based on flags
 *
 * @param {number} flags - Patch flags
 * @returns {string} - Optimized patch code
 */
export function generatePatchCode(flags) {
    if (flags === PatchFlags.HOISTED) {
        return '// Skip: hoisted static node';
    }

    if (flags === 0) {
        return '// Skip: fully static';
    }

    const checks = [];

    if (flags & PatchFlags.TEXT) {
        checks.push('patchText(n1, n2)');
    }

    if (flags & PatchFlags.CLASS) {
        checks.push('patchClass(el, n2.props.class)');
    }

    if (flags & PatchFlags.STYLE) {
        checks.push('patchStyle(el, n1.props.style, n2.props.style)');
    }

    if (flags & PatchFlags.PROPS) {
        checks.push('patchProps(el, n1.props, n2.props)');
    }

    if (flags & PatchFlags.HYDRATE_EVENTS) {
        checks.push('patchEvents(el, n2.props)');
    }

    return checks.join(';\n');
}

export default { PatchFlags, analyzePatchFlags, addPatchFlags, describePatchFlags };