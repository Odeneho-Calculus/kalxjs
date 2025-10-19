/**
 * Batch - Signal update batching for performance
 */

let isBatching = false;
let batchedEffects = new Set();

/**
 * Batches multiple signal updates together
 * @param {Function} fn - Function containing signal updates
 */
export function batch(fn) {
    if (isBatching) {
        return fn();
    }

    isBatching = true;

    try {
        return fn();
    } finally {
        isBatching = false;
        flushBatchedEffects();
    }
}

/**
 * Adds effect to batch queue
 * @param {Object} effect - Effect to queue
 */
export function queueEffect(effect) {
    if (isBatching) {
        batchedEffects.add(effect);
    } else {
        effect.execute();
    }
}

/**
 * Flushes all batched effects
 */
function flushBatchedEffects() {
    const effects = Array.from(batchedEffects);
    batchedEffects.clear();

    effects.forEach(effect => {
        try {
            effect.execute();
        } catch (error) {
            console.error('[KALXJS] Error in batched effect:', error);
        }
    });
}

/**
 * Checks if currently batching
 */
export function isBatchingUpdates() {
    return isBatching;
}