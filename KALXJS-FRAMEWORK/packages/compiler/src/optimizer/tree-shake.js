/**
 * KALXJS Tree Shaking Optimizer
 * Removes unused code and optimizes bundle size
 *
 * @module @kalxjs/compiler/optimizer/tree-shake
 */

/**
 * Analyze and mark dead code for elimination
 *
 * @param {object} ast - Abstract Syntax Tree
 * @param {Set} usedIdentifiers - Set of used identifiers
 * @returns {object} - Optimized AST
 */
export function treeShake(ast, usedIdentifiers = new Set()) {
    const analysis = {
        removed: [],
        kept: [],
        savings: 0
    };

    /**
     * Check if a node is used
     */
    const isUsed = (node) => {
        if (!node.name) return true; // Keep unnamed nodes
        return usedIdentifiers.has(node.name);
    };

    /**
     * Walk through AST and remove unused nodes
     */
    const walk = (node) => {
        if (!node) return null;

        // Remove unused imports
        if (node.type === 'import' && !isUsed(node)) {
            analysis.removed.push(node.name);
            return null;
        }

        // Remove unused function declarations
        if (node.type === 'function' && !isUsed(node)) {
            analysis.removed.push(node.name);
            analysis.savings += estimateSize(node);
            return null;
        }

        // Remove unused variable declarations
        if (node.type === 'variable' && !isUsed(node)) {
            analysis.removed.push(node.name);
            analysis.savings += estimateSize(node);
            return null;
        }

        // Keep node and process children
        analysis.kept.push(node.name || node.type);

        if (node.children && Array.isArray(node.children)) {
            node.children = node.children.map(walk).filter(Boolean);
        }

        return node;
    };

    const optimized = walk(ast);

    return {
        ast: optimized,
        analysis
    };
}

/**
 * Collect all used identifiers in AST
 *
 * @param {object} ast - Abstract Syntax Tree
 * @returns {Set} - Set of used identifiers
 */
export function collectUsedIdentifiers(ast) {
    const used = new Set();

    const walk = (node) => {
        if (!node) return;

        // Collect referenced identifiers
        if (node.type === 'identifier') {
            used.add(node.name);
        }

        // Collect from expressions
        if (node.type === 'expression' && node.references) {
            node.references.forEach(ref => used.add(ref));
        }

        // Collect from function calls
        if (node.type === 'call' && node.callee) {
            used.add(node.callee);
        }

        // Process children
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(walk);
        }

        // Process properties
        if (node.props && Array.isArray(node.props)) {
            node.props.forEach(walk);
        }
    };

    walk(ast);
    return used;
}

/**
 * Remove unused CSS
 *
 * @param {string} css - CSS content
 * @param {Set} usedSelectors - Set of used CSS selectors
 * @returns {object} - Optimized CSS and analysis
 */
export function shakeCSS(css, usedSelectors = new Set()) {
    const rules = parseCSS(css);
    const kept = [];
    const removed = [];

    rules.forEach(rule => {
        const selector = rule.selector;
        const isUsed = usedSelectors.has(selector) ||
            selector.startsWith('@') || // Keep @media, @keyframes, etc.
            selector === '*' ||          // Keep universal selector
            selector.startsWith(':root'); // Keep CSS variables

        if (isUsed) {
            kept.push(rule);
        } else {
            removed.push(selector);
        }
    });

    return {
        css: generateCSS(kept),
        analysis: {
            total: rules.length,
            kept: kept.length,
            removed: removed.length,
            selectors: removed
        }
    };
}

/**
 * Simple CSS parser (basic implementation)
 */
function parseCSS(css) {
    const rules = [];
    const regex = /([^{]+)\{([^}]+)\}/g;
    let match;

    while ((match = regex.exec(css)) !== null) {
        rules.push({
            selector: match[1].trim(),
            content: match[2].trim()
        });
    }

    return rules;
}

/**
 * Generate CSS from rules
 */
function generateCSS(rules) {
    return rules.map(rule => `${rule.selector} { ${rule.content} }`).join('\n');
}

/**
 * Estimate byte size of AST node
 */
function estimateSize(node) {
    // Rough estimation
    return JSON.stringify(node).length;
}

/**
 * Optimize imports by removing unused ones
 *
 * @param {Array} imports - Array of import statements
 * @param {Set} usedIdentifiers - Set of used identifiers
 * @returns {Array} - Optimized imports
 */
export function optimizeImports(imports, usedIdentifiers) {
    return imports.filter(imp => {
        // Keep default imports if used
        if (imp.default && usedIdentifiers.has(imp.default)) {
            return true;
        }

        // Keep named imports if any are used
        if (imp.named) {
            imp.named = imp.named.filter(name => usedIdentifiers.has(name));
            return imp.named.length > 0;
        }

        // Keep side-effect imports (no bindings)
        if (!imp.default && !imp.named) {
            return true;
        }

        return false;
    });
}

/**
 * Analyze bundle and suggest optimizations
 *
 * @param {object} bundle - Bundle analysis
 * @returns {object} - Optimization suggestions
 */
export function analyzeBundleSize(bundle) {
    const suggestions = [];

    // Check for large unused modules
    if (bundle.unusedModules) {
        bundle.unusedModules.forEach(mod => {
            if (mod.size > 10000) { // > 10KB
                suggestions.push({
                    type: 'unused-module',
                    module: mod.name,
                    size: mod.size,
                    suggestion: `Remove unused module "${mod.name}" (${formatSize(mod.size)})`
                });
            }
        });
    }

    // Check for duplicate code
    if (bundle.duplicates) {
        bundle.duplicates.forEach(dup => {
            suggestions.push({
                type: 'duplicate',
                module: dup.name,
                count: dup.count,
                suggestion: `"${dup.name}" is duplicated ${dup.count} times. Consider creating a shared module.`
            });
        });
    }

    // Check for unminified code
    if (bundle.unminified && bundle.unminified.length > 0) {
        suggestions.push({
            type: 'unminified',
            files: bundle.unminified,
            suggestion: 'Some files are not minified. Enable minification for production.'
        });
    }

    return {
        totalSize: bundle.size,
        potentialSavings: calculateSavings(suggestions),
        suggestions
    };
}

/**
 * Format bytes to human readable
 */
function formatSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Calculate potential savings
 */
function calculateSavings(suggestions) {
    return suggestions.reduce((total, sug) => {
        if (sug.size) return total + sug.size;
        return total;
    }, 0);
}

export default {
    treeShake,
    collectUsedIdentifiers,
    shakeCSS,
    optimizeImports,
    analyzeBundleSize
};