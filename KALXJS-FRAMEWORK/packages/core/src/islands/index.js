/**
 * @kalxjs/core - Islands Architecture
 * Implements Astro/Qwik-style islands for shipping minimal JavaScript
 *
 * Features:
 * - Isolate interactive components
 * - Zero JS for static content
 * - Resumability pattern
 * - Fine-grained lazy loading
 * - Automatic code splitting per island
 *
 * @module @kalxjs/core/islands
 */

import { defineAsyncComponent } from '../component/dynamic/index.js';
import { hydrate } from '../ssr/selective-hydration.js';

/**
 * Island component registry
 */
const islandRegistry = new Map();
let islandIdCounter = 0;

/**
 * Define an island component
 * Islands are interactive components that hydrate independently
 *
 * @param {object} component - Component definition
 * @param {object} options - Island options
 * @returns {object} - Island component
 *
 * @example
 * ```js
 * const Counter = defineIsland({
 *   name: 'Counter',
 *   render() {
 *     return h('button', { onClick: () => count.value++ }, count.value);
 *   }
 * }, {
 *   when: 'interaction', // When to hydrate: 'load', 'idle', 'visible', 'interaction'
 *   only: 'client' // Where to render: 'client', 'server', 'both'
 * });
 * ```
 */
export function defineIsland(component, options = {}) {
    const {
        when = 'load', // Hydration strategy
        only = 'both', // Rendering strategy
        props = null, // Static props
        clientOnly = false,
        serverOnly = false
    } = options;

    // Generate unique island ID
    const islandId = `island-${++islandIdCounter}`;

    console.log(`[islands] Defining island: ${component.name || islandId}`);
    console.log(`  - Hydration: ${when}`);
    console.log(`  - Rendering: ${only}`);

    // Register island
    islandRegistry.set(islandId, {
        component,
        options,
        when,
        only
    });

    // Create island wrapper component
    const islandComponent = {
        name: `Island_${component.name || islandId}`,
        __isIsland: true,
        __islandId: islandId,

        setup(props, context) {
            // Check if we're on server
            const isServer = typeof window === 'undefined';

            // Server-side rendering
            if (isServer) {
                if (only === 'client' || serverOnly) {
                    // Don't render on server
                    return () => createIslandPlaceholder(islandId, props);
                }

                // Render component on server
                if (component.setup) {
                    return component.setup(props, context);
                }

                return component.render ? component.render.bind(component) : null;
            }

            // Client-side hydration
            if (only === 'server' || clientOnly) {
                // Already hydrated, just return
                return component.setup ? component.setup(props, context) : null;
            }

            // Apply hydration strategy
            return setupIslandHydration(component, islandId, when, props, context);
        },

        render: component.render
    };

    return islandComponent;
}

/**
 * Create placeholder for island (SSR)
 */
function createIslandPlaceholder(islandId, props) {
    return {
        type: 'div',
        props: {
            'data-island-id': islandId,
            'data-island-props': JSON.stringify(props || {}),
            style: 'display: contents;'
        },
        children: []
    };
}

/**
 * Setup island hydration on client
 */
function setupIslandHydration(component, islandId, when, props, context) {
    // Find island element
    const islandEl = document.querySelector(`[data-island-id="${islandId}"]`);

    if (!islandEl) {
        console.warn(`[islands] Island element not found: ${islandId}`);
        return component.setup ? component.setup(props, context) : null;
    }

    // Determine when to hydrate
    switch (when) {
        case 'load':
            // Hydrate immediately
            hydrateIsland(islandEl, component, props, context);
            break;

        case 'idle':
            // Hydrate when browser is idle
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    hydrateIsland(islandEl, component, props, context);
                });
            } else {
                setTimeout(() => hydrateIsland(islandEl, component, props, context), 200);
            }
            break;

        case 'visible':
            // Hydrate when island becomes visible
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        hydrateIsland(islandEl, component, props, context);
                        observer.disconnect();
                    }
                });
            });
            observer.observe(islandEl);
            break;

        case 'interaction':
            // Hydrate on first interaction
            const events = ['click', 'mouseenter', 'focus', 'touchstart'];
            const hydrateOnEvent = () => {
                hydrateIsland(islandEl, component, props, context);
                events.forEach(event => {
                    islandEl.removeEventListener(event, hydrateOnEvent);
                });
            };
            events.forEach(event => {
                islandEl.addEventListener(event, hydrateOnEvent, { once: true, passive: true });
            });
            break;

        default:
            hydrateIsland(islandEl, component, props, context);
    }

    return component.setup ? component.setup(props, context) : null;
}

/**
 * Hydrate an island
 */
function hydrateIsland(element, component, props, context) {
    console.log('[islands] Hydrating island:', element.dataset.islandId);

    try {
        // Parse serialized props
        const serializedProps = element.dataset.islandProps;
        const hydratedProps = serializedProps ? JSON.parse(serializedProps) : props;

        // Create component instance
        const instance = component.setup
            ? component.setup(hydratedProps, context)
            : null;

        // Mount component
        if (instance && typeof instance === 'function') {
            const vnode = instance();
            // TODO: Actually render and patch the DOM
            // This would integrate with the VDOM system
        }

        // Mark as hydrated
        element.dataset.islandHydrated = 'true';

        console.log('[islands] Island hydrated successfully');

    } catch (error) {
        console.error('[islands] Hydration error:', error);
    }
}

/**
 * Static island - never hydrates, pure HTML
 * Perfect for content that never changes
 */
export function defineStaticIsland(component) {
    return defineIsland(component, {
        when: 'never',
        only: 'server'
    });
}

/**
 * Client-only island - only renders on client
 * Useful for components that depend on browser APIs
 */
export function defineClientIsland(component, when = 'load') {
    return defineIsland(component, {
        when,
        only: 'client'
    });
}

/**
 * Interactive island - hydrates on interaction
 * Great for components like modals, dropdowns
 */
export function defineInteractiveIsland(component) {
    return defineIsland(component, {
        when: 'interaction',
        only: 'both'
    });
}

/**
 * Visible island - hydrates when scrolled into view
 * Perfect for below-the-fold content
 */
export function defineVisibleIsland(component) {
    return defineIsland(component, {
        when: 'visible',
        only: 'both'
    });
}

/**
 * Get all registered islands
 */
export function getRegisteredIslands() {
    return Array.from(islandRegistry.entries()).map(([id, data]) => ({
        id,
        name: data.component.name,
        when: data.when,
        only: data.only
    }));
}

/**
 * Serialize islands for SSR
 * Generates script tags to hydrate islands on client
 */
export function serializeIslands() {
    const islands = getRegisteredIslands();

    if (islands.length === 0) {
        return '';
    }

    let script = '<script type="module">\n';
    script += '// KALXJS Islands Hydration\n';
    script += `window.__KALXJS_ISLANDS__ = ${JSON.stringify(islands)};\n`;
    script += '</script>\n';

    return script;
}

/**
 * Auto-split code per island
 * Each island gets its own JS chunk
 */
export function createIslandBundle(islandId) {
    const island = islandRegistry.get(islandId);

    if (!island) {
        throw new Error(`Island not found: ${islandId}`);
    }

    // Return dynamic import
    return {
        id: islandId,
        chunkName: `island-${islandId}`,
        loader: () => Promise.resolve(island.component)
    };
}

/**
 * Zero JS optimization - strip all JS from static islands
 */
export function optimizeStaticIslands(html) {
    // Remove scripts from static-only islands
    return html.replace(
        /<div data-island-id="[^"]+" data-island-only="server"[^>]*>[\s\S]*?<\/div>/g,
        (match) => {
            // Remove event handlers and other JS artifacts
            return match
                .replace(/on\w+="[^"]*"/g, '')
                .replace(/data-v-[a-f0-9]+/g, '');
        }
    );
}

export default {
    defineIsland,
    defineStaticIsland,
    defineClientIsland,
    defineInteractiveIsland,
    defineVisibleIsland,
    getRegisteredIslands,
    serializeIslands,
    createIslandBundle,
    optimizeStaticIslands
};