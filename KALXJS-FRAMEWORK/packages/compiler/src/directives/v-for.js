/**
 * v-for Directive - List rendering with key optimization
 * Efficiently renders lists with automatic key tracking
 */

/**
 * Compiles v-for directive
 * @param {Object} node - AST node
 * @param {string} expression - For expression (e.g., "item in items")
 * @returns {Object} Compiled loop structure
 */
export function compileVFor(node, expression) {
    const parsed = parseVForExpression(expression);

    if (!parsed) {
        console.error(`[KALXJS] Invalid v-for expression: ${expression}`);
        return null;
    }

    return {
        type: 'loop',
        source: parsed.source,
        value: parsed.value,
        key: parsed.key,
        index: parsed.index,
        node
    };
}

/**
 * Parses v-for expression
 * @param {string} expression - For expression
 * @returns {Object} Parsed structure
 */
export function parseVForExpression(expression) {
    // Match patterns:
    // item in items
    // (item, index) in items
    // (value, key, index) in object

    const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
    const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
    const stripParensRE = /^\(|\)$/g;

    const match = expression.match(forAliasRE);
    if (!match) return null;

    const [, alias, source] = match;

    let value = alias.trim().replace(stripParensRE, '').trim();
    let key = null;
    let index = null;

    // Check for (item, key) or (item, key, index)
    const iteratorMatch = value.match(forIteratorRE);

    if (iteratorMatch) {
        value = value.replace(forIteratorRE, '').trim();
        key = iteratorMatch[1]?.trim();
        index = iteratorMatch[2]?.trim();
    }

    return {
        source: source.trim(),
        value,
        key,
        index
    };
}

/**
 * Generates runtime code for v-for
 * @param {Object} loop - Loop structure
 * @returns {string} Runtime code
 */
export function generateVForCode(loop) {
    const { source, value, key, index, node } = loop;

    // Determine iterator parameters
    const params = [value];
    if (key) params.push(key);
    if (index) params.push(index);

    // Extract or generate key expression
    const keyExpr = node.props?.key || (index || key || value);

    // Generate map call
    return `
        (${source}).map((${params.join(', ')}) => {
            return ${generateNodeCode(node, keyExpr)};
        })
    `;
}

/**
 * Generates code for a single node with key
 */
function generateNodeCode(node, keyExpr) {
    const props = { ...(node.props || {}), key: keyExpr };
    return `h('${node.tag}', ${JSON.stringify(props)}, ${JSON.stringify(node.children || [])})`;
}

/**
 * Creates v-for runtime helper
 * @returns {Function} Runtime helper
 */
export function createVForHelper() {
    return function vFor(source, renderFn) {
        if (Array.isArray(source)) {
            return source.map((item, index) => renderFn(item, index, index));
        }

        if (typeof source === 'object' && source !== null) {
            return Object.keys(source).map((key, index) =>
                renderFn(source[key], key, index)
            );
        }

        if (typeof source === 'number') {
            return Array.from({ length: source }, (_, i) =>
                renderFn(i + 1, i, i)
            );
        }

        return [];
    };
}

/**
 * Optimizes v-for with static analysis
 * @param {Object} loop - Loop structure
 * @returns {Object} Optimized loop
 */
export function optimizeVFor(loop) {
    // Add patch flags for optimized updates
    return {
        ...loop,
        patchFlag: {
            keyed: !!loop.node.props?.key,
            stable: false // TODO: Analyze if source is stable
        }
    };
}