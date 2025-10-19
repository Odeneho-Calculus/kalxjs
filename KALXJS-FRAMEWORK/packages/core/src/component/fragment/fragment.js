/**
 * Fragment - Render multiple root nodes without wrapper
 * Allows components to return multiple elements
 */

/**
 * Fragment component
 * @param {Object} props - Component props
 * @param {Object} context - Component context
 * @returns {Array} Array of vnodes
 */
export function Fragment(props, context) {
    const { slots } = context;
    const { key } = props;

    // Return children directly without wrapper
    if (slots.default) {
        const children = slots.default();

        // Ensure children is an array
        const childrenArray = Array.isArray(children) ? children : [children];

        // Add key if provided
        if (key !== undefined) {
            childrenArray.forEach((child, index) => {
                if (child && typeof child === 'object') {
                    child.key = child.key || `${key}-${index}`;
                }
            });
        }

        return childrenArray;
    }

    return [];
}

// Symbol for identifying fragments
export const FragmentSymbol = Symbol('Fragment');
Fragment.symbol = FragmentSymbol;
Fragment.__isFragment = true;

/**
 * Creates a fragment vnode
 * @param {Object} props - Props (mainly key)
 * @param {Array} children - Child vnodes
 * @returns {Object} Fragment vnode
 */
export function createFragment(props, children) {
    return {
        type: Fragment,
        symbol: FragmentSymbol,
        props: props || {},
        children: Array.isArray(children) ? children : [children],
        key: props?.key
    };
}

/**
 * Checks if a vnode is a fragment
 * @param {Object} vnode - Virtual node
 * @returns {boolean} True if fragment
 */
export function isFragment(vnode) {
    return vnode && (
        vnode.type === Fragment ||
        vnode.symbol === FragmentSymbol ||
        vnode.type?.__isFragment
    );
}