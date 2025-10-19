/**
 * KALXJS Compiler Optimizer Module
 * Central export for all optimization features
 *
 * @module @kalxjs/compiler/optimizer
 */

// Static hoisting
export {
    hoistStatic,
    HoistableType,
    generateHoistedCode,
    analyzeHoisting
} from './static-hoist.js';

// Patch flags
export {
    PatchFlags,
    analyzePatchFlags,
    addPatchFlags,
    describePatchFlags,
    generatePatchCode
} from './patch-flags.js';

// Tree shaking
export {
    treeShake,
    collectUsedIdentifiers,
    shakeCSS,
    optimizeImports,
    analyzeBundleSize
} from './tree-shake.js';

/**
 * Apply all optimizations to AST
 *
 * @param {object} ast - Abstract Syntax Tree
 * @param {object} options - Optimization options
 * @returns {object} - Fully optimized AST
 */
export function optimize(ast, options = {}) {
    const {
        hoistStatic: enableHoisting = true,
        patchFlags: enablePatchFlags = true,
        treeShake: enableTreeShake = true,
        cacheHandlers = true
    } = options;

    let optimized = ast;
    const stats = {
        hoisted: 0,
        patchFlags: 0,
        treeSh human: 0,
        time: 0
    };

    const startTime = performance.now();

    // Step 1: Static hoisting
    if (enableHoisting) {
        const { hoistStatic } = await import('./static-hoist.js');
        const hoistResult = hoistStatic(optimized);
        optimized = hoistResult.ast;
        stats.hoisted = hoistResult.hoisted.length;
    }

    // Step 2: Add patch flags
    if (enablePatchFlags) {
        const { addPatchFlags } = await import('./patch-flags.js');
        optimized = addPatchFlags(optimized);
        stats.patchFlags = countPatchFlags(optimized);
    }

    // Step 3: Tree shaking
    if (enableTreeShake) {
        const { treeShake, collectUsedIdentifiers } = await import('./tree-shake.js');
        const used = collectUsedIdentifiers(optimized);
        const shakeResult = treeShake(optimized, used);
        optimized = shakeResult.ast;
        stats.treeShake = shakeResult.analysis.removed.length;
    }

    stats.time = performance.now() - startTime;

    return {
        ast: optimized,
        stats
    };
}

/**
 * Count nodes with patch flags
 */
function countPatchFlags(ast) {
    let count = 0;

    const walk = (node) => {
        if (node && node.patchFlag) count++;
        if (node && node.children) {
            node.children.forEach(walk);
        }
    };

    walk(ast);
    return count;
}

export default optimize;