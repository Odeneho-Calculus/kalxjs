/**
 * Edge Caching Strategies
 * Optimized caching for edge environments
 */

import { detectRuntime, EdgeRuntime } from './runtime-detector.js';

/**
 * Cache strategy types
 */
export const CacheStrategy = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    CACHE_ONLY: 'cache-only',
    NETWORK_ONLY: 'network-only'
};

/**
 * Cache TTL presets (in seconds)
 */
export const CacheTTL = {
    STATIC: 31536000, // 1 year
    IMMUTABLE: 31536000,
    LONG: 604800, // 1 week
    MEDIUM: 86400, // 1 day
    SHORT: 3600, // 1 hour
    VERY_SHORT: 300, // 5 minutes
    NO_CACHE: 0
};

/**
 * Edge Cache Manager
 */
export class EdgeCacheManager {
    constructor(options = {}) {
        this.namespace = options.namespace || 'kalxjs-edge';
        this.defaultTTL = options.defaultTTL || CacheTTL.MEDIUM;
        this.runtime = detectRuntime();
    }

    /**
     * Get item from cache
     * @param {string} key - Cache key
     * @returns {Promise<Response|null>}
     */
    async get(key) {
        const cacheKey = this.getCacheKey(key);

        try {
            if (this.runtime === EdgeRuntime.CLOUDFLARE_WORKERS) {
                const cache = caches.default;
                const response = await cache.match(cacheKey);
                return response || null;
            } else if (this.runtime === EdgeRuntime.DENO_DEPLOY) {
                // Deno KV
                const kv = await Deno.openKv();
                const entry = await kv.get([this.namespace, key]);
                if (entry.value) {
                    return new Response(entry.value.body, {
                        status: entry.value.status,
                        headers: entry.value.headers
                    });
                }
            }

            return null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Put item in cache
     * @param {string} key - Cache key
     * @param {Response} response - Response to cache
     * @param {Object} options - Cache options
     */
    async put(key, response, options = {}) {
        const cacheKey = this.getCacheKey(key);
        const ttl = options.ttl || this.defaultTTL;

        // Clone response for caching
        const clonedResponse = response.clone();

        // Add cache headers
        const headers = new Headers(clonedResponse.headers);
        headers.set('Cache-Control', `public, max-age=${ttl}`);
        headers.set('X-Cache-Status', 'HIT');

        const cachedResponse = new Response(clonedResponse.body, {
            status: clonedResponse.status,
            statusText: clonedResponse.statusText,
            headers
        });

        try {
            if (this.runtime === EdgeRuntime.CLOUDFLARE_WORKERS) {
                const cache = caches.default;
                await cache.put(cacheKey, cachedResponse);
            } else if (this.runtime === EdgeRuntime.DENO_DEPLOY) {
                const kv = await Deno.openKv();
                const body = await clonedResponse.text();
                await kv.set(
                    [this.namespace, key],
                    {
                        body,
                        status: clonedResponse.status,
                        headers: Object.fromEntries(headers.entries())
                    },
                    { expireIn: ttl * 1000 }
                );
            }
        } catch (error) {
            console.error('Cache put error:', error);
        }
    }

    /**
     * Delete item from cache
     * @param {string} key - Cache key
     */
    async delete(key) {
        const cacheKey = this.getCacheKey(key);

        try {
            if (this.runtime === EdgeRuntime.CLOUDFLARE_WORKERS) {
                const cache = caches.default;
                await cache.delete(cacheKey);
            } else if (this.runtime === EdgeRuntime.DENO_DEPLOY) {
                const kv = await Deno.openKv();
                await kv.delete([this.namespace, key]);
            }
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }

    /**
     * Get cache key with namespace
     * @param {string} key - Original key
     * @returns {string} Full cache key
     */
    getCacheKey(key) {
        return `https://${this.namespace}/${key}`;
    }
}

/**
 * Apply cache strategy to request
 * @param {Request} request - Request object
 * @param {Function} fetchFn - Fetch function
 * @param {Object} options - Strategy options
 * @returns {Promise<Response>}
 */
export async function applyCacheStrategy(request, fetchFn, options = {}) {
    const {
        strategy = CacheStrategy.CACHE_FIRST,
        ttl = CacheTTL.MEDIUM,
        cacheKey = request.url,
        cacheName = 'kalxjs-edge'
    } = options;

    const cacheManager = new EdgeCacheManager({ namespace: cacheName, defaultTTL: ttl });

    switch (strategy) {
        case CacheStrategy.CACHE_FIRST:
            return await cacheFirst(request, fetchFn, cacheManager, cacheKey, options);

        case CacheStrategy.NETWORK_FIRST:
            return await networkFirst(request, fetchFn, cacheManager, cacheKey, options);

        case CacheStrategy.STALE_WHILE_REVALIDATE:
            return await staleWhileRevalidate(request, fetchFn, cacheManager, cacheKey, options);

        case CacheStrategy.CACHE_ONLY:
            return await cacheOnly(cacheManager, cacheKey);

        case CacheStrategy.NETWORK_ONLY:
            return await fetchFn(request);

        default:
            return await fetchFn(request);
    }
}

/**
 * Cache-First strategy
 */
async function cacheFirst(request, fetchFn, cacheManager, cacheKey, options) {
    // Try cache first
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
        return cached;
    }

    // Fetch from network and cache
    const response = await fetchFn(request);
    if (response.ok) {
        await cacheManager.put(cacheKey, response, options);
    }

    return response;
}

/**
 * Network-First strategy
 */
async function networkFirst(request, fetchFn, cacheManager, cacheKey, options) {
    try {
        // Try network first
        const response = await fetchFn(request);
        if (response.ok) {
            await cacheManager.put(cacheKey, response, options);
        }
        return response;
    } catch (error) {
        // Fallback to cache
        const cached = await cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }
        throw error;
    }
}

/**
 * Stale-While-Revalidate strategy
 */
async function staleWhileRevalidate(request, fetchFn, cacheManager, cacheKey, options) {
    // Serve from cache immediately
    const cached = await cacheManager.get(cacheKey);

    // Revalidate in background
    fetchFn(request).then(async (response) => {
        if (response.ok) {
            await cacheManager.put(cacheKey, response, options);
        }
    }).catch(console.error);

    if (cached) {
        return cached;
    }

    // If no cache, wait for network
    return await fetchFn(request);
}

/**
 * Cache-Only strategy
 */
async function cacheOnly(cacheManager, cacheKey) {
    const cached = await cacheManager.get(cacheKey);
    if (!cached) {
        return new Response('Not found in cache', { status: 404 });
    }
    return cached;
}

/**
 * Generate cache key from request
 * @param {Request} request - Request object
 * @param {Object} options - Options
 * @returns {string} Cache key
 */
export function generateCacheKey(request, options = {}) {
    const url = new URL(request.url);

    let key = url.pathname;

    // Include query params if specified
    if (options.includeQuery) {
        const searchParams = Array.from(url.searchParams.entries())
            .sort(([a], [b]) => a.localeCompare(b));
        if (searchParams.length > 0) {
            key += '?' + searchParams.map(([k, v]) => `${k}=${v}`).join('&');
        }
    }

    // Include vary headers if specified
    if (options.varyHeaders && Array.isArray(options.varyHeaders)) {
        const varyValues = options.varyHeaders
            .map(header => request.headers.get(header))
            .filter(Boolean)
            .join(':');
        if (varyValues) {
            key += ':' + varyValues;
        }
    }

    return key;
}

/**
 * Purge cache
 * @param {string} pattern - Pattern to match (regex or string)
 * @param {Object} options - Options
 */
export async function purgeCache(pattern, options = {}) {
    const cacheManager = new EdgeCacheManager(options);

    // Note: Actual implementation depends on edge runtime capabilities
    console.log('Cache purge requested for pattern:', pattern);

    // For Cloudflare Workers, would use Cache API
    // For Deno, would iterate KV entries
}

export default {
    CacheStrategy,
    CacheTTL,
    EdgeCacheManager,
    applyCacheStrategy,
    generateCacheKey,
    purgeCache
};