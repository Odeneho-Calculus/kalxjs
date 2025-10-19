/**
 * Streaming SSR - Export streaming and selective hydration
 */

export {
    createStreamRenderer,
    renderToWebStream
} from './stream-renderer.js';

export {
    HydrationPriority,
    hydrationQueue,
    markForHydration,
    hydrateNow
} from './selective-hydration.js';

/**
 * Utility: Create SSR context with streaming support
 * @param {Object} options - SSR options
 * @returns {Object} SSR context
 */
export function createSSRContext(options = {}) {
    const {
        url = '/',
        request = {},
        modules = new Set(),
        teleports = {}
    } = options;

    return {
        url,
        request,
        modules,
        teleports,

        // Track modules for preloading
        trackModule(id) {
            modules.add(id);
        },

        // Register teleport content
        registerTeleport(target, content) {
            if (!teleports[target]) {
                teleports[target] = [];
            }
            teleports[target].push(content);
        },

        // Get tracked modules for preload tags
        getPreloadLinks() {
            return Array.from(modules)
                .map(id => `<link rel="modulepreload" href="${id}">`)
                .join('\n');
        },

        // Get teleport content for target
        getTeleportContent(target) {
            return teleports[target] || [];
        }
    };
}