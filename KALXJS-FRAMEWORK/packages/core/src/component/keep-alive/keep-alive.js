/**
 * KALXJS KeepAlive Component Implementation
 * Caches component instances to preserve state across route/component changes
 * Similar to Vue 3's KeepAlive component
 *
 * @module @kalxjs/core/component/keep-alive
 */

import { getCurrentInstance } from '../component.js';
import { isString } from '../../utils/index.js';

/**
 * Cache for component instances
 * Map<key, { vnode, instance }>
 */
const cache = new Map();
const keys = new Set();

/**
 * KeepAlive Component
 * Caches inactive component instances to preserve their state
 *
 * @example
 * ```js
 * import { KeepAlive } from '@kalxjs/core';
 *
 * // Cache all child components
 * <KeepAlive>
 *   <component :is="currentView" />
 * </KeepAlive>
 *
 * // With include/exclude patterns
 * <KeepAlive :include="['ComponentA', 'ComponentB']" :max="10">
 *   <router-view />
 * </KeepAlive>
 *
 * // With regex pattern
 * <KeepAlive :include="/^My/" :exclude="MyIgnored">
 *   <component :is="view" />
 * </KeepAlive>
 * ```
 */
export const KeepAlive = {
    name: 'KeepAlive',

    props: {
        // Components to cache (string, regex, or array)
        include: {
            type: [String, RegExp, Array],
            default: null
        },

        // Components to exclude from cache
        exclude: {
            type: [String, RegExp, Array],
            default: null
        },

        // Maximum number of cached instances
        max: {
            type: Number,
            default: Infinity
        }
    },

    setup(props, { slots }) {
        const instance = getCurrentInstance();
        const localCache = new Map();
        const localKeys = new Set();

        /**
         * Check if a component name matches a pattern
         */
        const matches = (pattern, name) => {
            if (!pattern || !name) return false;

            if (Array.isArray(pattern)) {
                return pattern.some(p => matches(p, name));
            }

            if (isString(pattern)) {
                return pattern.split(',').some(p => p.trim() === name);
            }

            if (pattern instanceof RegExp) {
                return pattern.test(name);
            }

            return false;
        };

        /**
         * Get component name from vnode
         */
        const getComponentName = (vnode) => {
            const comp = vnode.type;
            return comp?.name || comp?.displayName || null;
        };

        /**
         * Prune oldest cache entry when max is exceeded
         */
        const pruneCacheEntry = (key) => {
            const cached = localCache.get(key);
            if (cached) {
                // Call component's deactivated hook
                if (cached.instance?.deactivated) {
                    cached.instance.deactivated();
                }
                localCache.delete(key);
                localKeys.delete(key);
            }
        };

        /**
         * Reset cache based on include/exclude changes
         */
        const pruneCache = (filter) => {
            localCache.forEach((cached, key) => {
                const name = getComponentName(cached.vnode);
                if (name && !filter(name)) {
                    pruneCacheEntry(key);
                }
            });
        };

        // Watch include/exclude changes
        const updateCache = () => {
            const { include, exclude } = props;

            if (include) {
                pruneCache(name => matches(include, name));
            }

            if (exclude) {
                pruneCache(name => !matches(exclude, name));
            }
        };

        // Lifecycle hooks
        const onMounted = () => {
            updateCache();
        };

        const onUpdated = () => {
            updateCache();
        };

        const onUnmounted = () => {
            localCache.forEach((cached, key) => {
                pruneCacheEntry(key);
            });
        };

        // Register lifecycle hooks
        if (instance) {
            instance.mounted = instance.mounted || [];
            instance.mounted.push(onMounted);

            instance.updated = instance.updated || [];
            instance.updated.push(onUpdated);

            instance.unmounted = instance.unmounted || [];
            instance.unmounted.push(onUnmounted);
        }

        return () => {
            const children = slots.default?.();

            if (!children || !children.length) {
                return null;
            }

            // Get the first child vnode
            let vnode = children[0];

            if (children.length > 1) {
                console.warn('[KALXJS] KeepAlive should contain exactly one child component');
                return children;
            }

            const comp = vnode.type;
            const name = getComponentName(vnode);
            const { include, exclude, max } = props;

            // Check if component should be cached
            const shouldCache =
                (!include || (name && matches(include, name))) &&
                (!exclude || !(name && matches(exclude, name)));

            if (!shouldCache) {
                return vnode;
            }

            // Generate cache key
            const key = vnode.key == null ? comp : vnode.key;
            const cached = localCache.get(key);

            if (cached) {
                // Reuse cached instance
                vnode.instance = cached.instance;

                // Make this key the most recently used
                localKeys.delete(key);
                localKeys.add(key);

                // Call activated hook
                if (vnode.instance?.activated) {
                    vnode.instance.activated();
                }
            } else {
                // Add to cache
                localCache.set(key, { vnode, instance: vnode.instance });
                localKeys.add(key);

                // Prune oldest entry if max exceeded
                if (max !== Infinity && localKeys.size > max) {
                    const oldestKey = localKeys.values().next().value;
                    pruneCacheEntry(oldestKey);
                }

                // Call activated hook for new instances
                if (vnode.instance?.activated) {
                    vnode.instance.activated();
                }
            }

            // Mark vnode as kept alive
            vnode.shapeFlag |= 256; // ShapeFlags.COMPONENT_KEPT_ALIVE

            return vnode;
        };
    }
};

/**
 * Hook for components to detect when they are activated/deactivated
 *
 * @param {function} activatedCallback - Called when component is activated
 * @param {function} deactivatedCallback - Called when component is deactivated
 *
 * @example
 * ```js
 * import { onActivated, onDeactivated } from '@kalxjs/core';
 *
 * export default {
 *   setup() {
 *     onActivated(() => {
 *       console.log('Component activated!');
 *     });
 *
 *     onDeactivated(() => {
 *       console.log('Component deactivated!');
 *     });
 *   }
 * };
 * ```
 */
export function onActivated(callback) {
    const instance = getCurrentInstance();
    if (instance) {
        instance.activated = instance.activated || [];
        instance.activated.push(callback);
    }
}

export function onDeactivated(callback) {
    const instance = getCurrentInstance();
    if (instance) {
        instance.deactivated = instance.deactivated || [];
        instance.deactivated.push(callback);
    }
}

export default KeepAlive;