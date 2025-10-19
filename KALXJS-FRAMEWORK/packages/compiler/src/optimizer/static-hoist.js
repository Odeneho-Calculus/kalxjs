/**
 * KALXJS Static Hoisting Optimizer
 * Hoists static nodes and props to avoid re-rendering
 * Inspired by Vue 3's compiler optimizations
 *
 * @module @kalxjs/compiler/optimizer/static-hoist
 */

/**
 * Types of hoistable nodes
 */
export const HoistableType = {
    ELEMENT: 1,      // Static element
    PROPS: 2,        // Static props
    TEXT: 3,         // Static text
    ATTRIBUTES: 4    // Static attributes
};

/**
 * Analyze and hoist static content
 *
 * @param {object} ast - Abstract Syntax Tree
 * @returns {object} - Optimized AST with hoisted nodes
 *
 * @example
 * ```js
 * const optimized = hoistStatic(ast);
 * // Before: <div class="static">Hello</div> (rendered every time)
 * // After: const _hoisted_1 = createElement('div', { class: 'static' }, 'Hello')
 * ```
 */
export function hoistStatic(ast) {
    const hoistedNodes = [];
    let hoistCounter = 0;

    /**
     * Check if node is static (no dynamic bindings)
     */
    const isStaticNode = (node) => {
        if (!node) return false;

        // Text nodes are always static
        if (node.type === 'text' && !node.expression) {
            return true;
        }

        // Elements with no dynamic props/directives
        if (node.type === 'element') {
            // Check for dynamic directives
            if (node.directives && node.directives.length > 0) {
                return false;
            }

            // Check for dynamic props
            if (node.props) {
                for (const prop of node.props) {
                    if (prop.dynamic || prop.expression) {
                        return false;
                    }
                }
            }

            // Check children recursively
            if (node.children) {
                return node.children.every(isStaticNode);
            }

            return true;
        }

        return false;
    };

    /**
     * Check if props object is static
     */
    const hasStaticProps = (node) => {
        if (!node.props || node.props.length === 0) {
            return false;
        }

        return node.props.every(prop => !prop.dynamic && !prop.expression);
    };

    /**
     * Transform node to hoisted version
     */
    const transformToHoisted = (node) => {
        const hoistId = `_hoisted_${++hoistCounter}`;

        hoistedNodes.push({
            id: hoistId,
            node: node,
            type: getHoistableType(node)
        });

        return {
            type: 'hoisted',
            id: hoistId,
            original: node
        };
    };

    /**
     * Get hoistable type
     */
    const getHoistableType = (node) => {
        if (node.type === 'text') return HoistableType.TEXT;
        if (node.type === 'element') return HoistableType.ELEMENT;
        return null;
    };

    /**
     * Walk through AST and hoist static nodes
     */
    const walk = (node) => {
        if (!node) return node;

        // Skip already hoisted nodes
        if (node.type === 'hoisted') return node;

        // Check if entire node is static
        if (isStaticNode(node)) {
            return transformToHoisted(node);
        }

        // If node itself isn't static, check children
        if (node.children && Array.isArray(node.children)) {
            node.children = node.children.map(walk);
        }

        // Hoist static props even if node is dynamic
        if (node.type === 'element' && hasStaticProps(node)) {
            const propsId = `_hoisted_${++hoistCounter}_props`;
            hoistedNodes.push({
                id: propsId,
                node: node.props,
                type: HoistableType.PROPS
            });

            node.hoistedProps = propsId;
        }

        return node;
    };

    // Process AST
    const optimizedAst = walk(ast);

    return {
        ast: optimizedAst,
        hoisted: hoistedNodes,
        stats: {
            count: hoistedNodes.length,
            saved: hoistedNodes.length // Each hoist saves re-creation on update
        }
    };
}

/**
 * Generate hoisted code declarations
 *
 * @param {Array} hoistedNodes - Array of hoisted nodes
 * @returns {string} - JavaScript code for hoisted declarations
 */
export function generateHoistedCode(hoistedNodes) {
    const declarations = hoistedNodes.map(({ id, node, type }) => {
        switch (type) {
            case HoistableType.TEXT:
                return `const ${id} = createTextNode(${JSON.stringify(node.content)});`;

            case HoistableType.ELEMENT:
                return `const ${id} = ${generateElementCode(node)};`;

            case HoistableType.PROPS:
                return `const ${id} = ${JSON.stringify(node)};`;

            default:
                return '';
        }
    });

    return declarations.join('\n');
}

/**
 * Generate code for element node
 */
function generateElementCode(node) {
    const tag = node.tag;
    const props = node.props ? JSON.stringify(node.props) : 'null';
    const children = node.children ? `[${node.children.map(generateChildCode).join(', ')}]` : 'null';

    return `createElement('${tag}', ${props}, ${children})`;
}

/**
 * Generate code for child node
 */
function generateChildCode(node) {
    if (node.type === 'text') {
        return JSON.stringify(node.content);
    }
    if (node.type === 'hoisted') {
        return node.id;
    }
    return generateElementCode(node);
}

/**
 * Analyze hoisting opportunities in template
 *
 * @param {string} template - Template string
 * @returns {object} - Analysis results
 */
export function analyzeHoisting(template) {
    // Simple analysis of potential hoisting opportunities
    const staticElements = template.match(/<[^>]+>/g) || [];
    const dynamicBindings = template.match(/[:@v-]/g) || [];

    const total = staticElements.length;
    const dynamic = dynamicBindings.length;
    const hoistable = total - dynamic;

    return {
        total,
        hoistable,
        dynamic,
        percentage: total > 0 ? Math.round((hoistable / total) * 100) : 0
    };
}

export default hoistStatic;