/**
 * @kalxjs/core - SSR Component-Level Caching
 * Implements intelligent caching for server-rendered components
 *
 * Features:
 * - Component-level cache with TTL
 * - Cache key generation from props
 * - LRU cache eviction
 * - Cache invalidation strategies
 * - Memory-efficient storage
 *
 * @module @kalxjs/core/ssr/cache
 */

/**
 * LRU Cache implementation
 */
class LRUCache {
    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }

        // Move to end (most recently used)
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);

        return value;
    }

    set(key, value) {
        // Delete if exists (to reorder)
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, value);
    }

    has(key) {
        return this.cache.has(key);
    }

    delete(key) {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    get size() {
        return this.cache.size;
    }
}

/**
 * Component cache storage
 */
const componentCache = new LRUCache(1000);
const cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0
};

/**
 * Cache a component's rendered output
 *
 * @param {string} componentName - Component name
 * @param {object} props - Component props
 * @param {string} html - Rendered HTML
 * @param {object} options - Cache options
 *
 * @example
 * ```js
 * cacheComponent('UserCard', { id: 123 }, '<div>...</div>', {
 *   ttl: 3600, // 1 hour
 *   tags: ['user', 'profile']
 * });
 * ```
 */
export function cacheComponent(componentName, props, html, options = {}) {
    const {
        ttl = 3600, // Time to live in seconds (default 1 hour)
        tags = [],
        maxAge = null
    } = options;

    const cacheKey = generateCacheKey(componentName, props);
    const expiresAt = Date.now() + (ttl * 1000);

    const cacheEntry = {
        html,
        props,
        componentName,
        tags,
        createdAt: Date.now(),
        expiresAt,
        maxAge,
        hits: 0
    };

    componentCache.set(cacheKey, cacheEntry);

    console.log(`[ssr-cache] Cached component: ${componentName} (key: ${cacheKey})`);

    return cacheKey;
}

/**
 * Get cached component HTML
 *
 * @param {string} componentName - Component name
 * @param {object} props - Component props
 * @returns {string|null} - Cached HTML or null
 */
export function getCachedComponent(componentName, props) {
    const cacheKey = generateCacheKey(componentName, props);
    const entry = componentCache.get(cacheKey);

    if (!entry) {
        cacheStats.misses++;
        console.log(`[ssr-cache] Cache miss: ${componentName}`);
        return null;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
        componentCache.delete(cacheKey);
        cacheStats.misses++;
        cacheStats.evictions++;
        console.log(`[ssr-cache] Cache expired: ${componentName}`);
        return null;
    }

    // Update hit count
    entry.hits++;
    cacheStats.hits++;

    console.log(`[ssr-cache] Cache hit: ${componentName} (hits: ${entry.hits})`);

    return entry.html;
}

/**
 * Generate cache key from component name and props
 */
function generateCacheKey(componentName, props) {
    // Sort props for consistent keys
    const sortedProps = sortObject(props);
    const propsStr = JSON.stringify(sortedProps);

    // Create hash
    const hash = simpleHash(propsStr);

    return `${componentName}:${hash}`;
}

/**
 * Sort object keys recursively for consistent hashing
 */
function sortObject(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sortObject);
    }

    return Object.keys(obj)
        .sort()
        .reduce((result, key) => {
            result[key] = sortObject(obj[key]);
            return result;
        }, {});
}

/**
 * Simple string hash function
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Invalidate cache by component name
 */
export function invalidateComponent(componentName) {
    let count = 0;

    for (const [key, entry] of componentCache.cache.entries()) {
        if (entry.componentName === componentName) {
            componentCache.delete(key);
            count++;
        }
    }

    console.log(`[ssr-cache] Invalidated ${count} entries for: ${componentName}`);

    return count;
}

/**
 * Invalidate cache by tags
 */
export function invalidateByTags(tags) {
    let count = 0;
    const tagSet = new Set(Array.isArray(tags) ? tags : [tags]);

    for (const [key, entry] of componentCache.cache.entries()) {
        const entryTags = new Set(entry.tags || []);
        const hasMatchingTag = [...tagSet].some(tag => entryTags.has(tag));

        if (hasMatchingTag) {
            componentCache.delete(key);
            count++;
        }
    }

    console.log(`[ssr-cache] Invalidated ${count} entries for tags:`, Array.from(tagSet));

    return count;
}

/**
 * Clear all cache
 */
export function clearCache() {
    const size = componentCache.size;
    componentCache.clear();
    cacheStats.evictions += size;

    console.log(`[ssr-cache] Cleared ${size} cache entries`);

    return size;
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    const hitRate = cacheStats.hits + cacheStats.misses > 0
        ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(2)
        : 0;

    return {
        ...cacheStats,
        hitRate: `${hitRate}%`,
        size: componentCache.size,
        maxSize: componentCache.maxSize
    };
}

/**
 * Wrap component with caching
 *
 * @example
 * ```js
 * const CachedUserCard = withCache(UserCard, {
 *   ttl: 3600,
 *   cacheKey: (props) => `user-${props.id}`,
 *   tags: (props) => ['user', `user-${props.id}`]
 * });
 * ```
 */
export function withCache(component, options = {}) {
    const {
        ttl = 3600,
        cacheKey = null,
        tags = null
    } = options;

    return {
        name: `Cached_${component.name}`,
        __isCached: true,

        async setup(props, context) {
            const componentName = component.name || 'Anonymous';

            // Check cache
            const cached = getCachedComponent(componentName, props);
            if (cached) {
                return () => ({ type: 'div', props: { innerHTML: cached } });
            }

            // Render component
            const result = component.setup
                ? await component.setup(props, context)
                : null;

            // Get rendered HTML (simplified - would integrate with actual renderer)
            const html = ''; // TODO: Get actual rendered HTML

            // Cache the result
            const cacheTags = typeof tags === 'function' ? tags(props) : tags;
            cacheComponent(componentName, props, html, {
                ttl,
                tags: cacheTags
            });

            return result;
        },

        render: component.render
    };
}

export default {
    cacheComponent,
    getCachedComponent,
    invalidateComponent,
    invalidateByTags,
    clearCache,
    getCacheStats,
    withCache
};