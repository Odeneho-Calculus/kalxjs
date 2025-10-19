/**
 * Cache Strategies for PWA
 * Implements common caching patterns
 *
 * @module @kalxjs/pwa/cache-strategies
 */

/**
 * Cache-First Strategy
 * Returns cached response if available, falls back to network
 */
export async function cacheFirst(request, cacheName, options = {}) {
    const { timeout = 5000 } = options;

    // Try cache first
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    // Fallback to network with timeout
    try {
        const response = await fetchWithTimeout(request, timeout);

        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        // Return offline fallback if available
        return getOfflineFallback(request);
    }
}

/**
 * Network-First Strategy
 * Tries network first, falls back to cache
 */
export async function networkFirst(request, cacheName, options = {}) {
    const { timeout = 3000 } = options;

    try {
        const response = await fetchWithTimeout(request, timeout);

        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        // Fallback to cache
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }

        return getOfflineFallback(request);
    }
}

/**
 * Cache-Only Strategy
 * Returns only cached responses
 */
export async function cacheOnly(request) {
    const cached = await caches.match(request);

    if (cached) {
        return cached;
    }

    return getOfflineFallback(request);
}

/**
 * Network-Only Strategy
 * Always fetches from network
 */
export async function networkOnly(request, options = {}) {
    const { timeout = 5000 } = options;

    try {
        return await fetchWithTimeout(request, timeout);
    } catch (error) {
        return getOfflineFallback(request);
    }
}

/**
 * Stale-While-Revalidate Strategy
 * Returns cached response immediately, updates cache in background
 */
export async function staleWhileRevalidate(request, cacheName, options = {}) {
    const { timeout = 5000 } = options;

    const cached = await caches.match(request);

    // Fetch and update cache in background
    const networkPromise = (async () => {
        try {
            const response = await fetchWithTimeout(request, timeout);

            if (response.ok) {
                const cache = await caches.open(cacheName);
                cache.put(request, response.clone());
            }

            return response;
        } catch (error) {
            return null;
        }
    })();

    // Return cached immediately if available
    if (cached) {
        return cached;
    }

    // Otherwise wait for network
    const response = await networkPromise;
    return response || getOfflineFallback(request);
}

/**
 * Cache with Network Fallback and Update
 * Returns cache but updates in background
 */
export async function cacheWithUpdate(request, cacheName, options = {}) {
    const { timeout = 5000, maxAge = 3600000 } = options; // 1 hour default

    const cached = await caches.match(request);
    const cacheTime = cached ? getCacheTime(cached) : 0;
    const now = Date.now();

    // Check if cache is fresh
    if (cached && (now - cacheTime) < maxAge) {
        // Update in background
        updateCacheInBackground(request, cacheName, timeout);
        return cached;
    }

    // Cache expired or missing, fetch from network
    try {
        const response = await fetchWithTimeout(request, timeout);

        if (response.ok) {
            const cache = await caches.open(cacheName);
            const responseWithTime = addCacheTime(response.clone());
            cache.put(request, responseWithTime);
        }

        return response;
    } catch (error) {
        // Return stale cache if available
        if (cached) {
            return cached;
        }

        return getOfflineFallback(request);
    }
}

/**
 * Fetch with timeout
 */
function fetchWithTimeout(request, timeout) {
    return Promise.race([
        fetch(request),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Fetch timeout')), timeout)
        ),
    ]);
}

/**
 * Get offline fallback response
 */
async function getOfflineFallback(request) {
    const url = typeof request === 'string' ? request : request.url;

    // Try to get from offline cache
    const offlineCache = await caches.open('offline-fallback');

    // Determine resource type
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
        return await offlineCache.match('/offline-image.png') || new Response('', { status: 404 });
    }

    if (url.match(/\.(css)$/i)) {
        return await offlineCache.match('/offline.css') || new Response('', { status: 404 });
    }

    if (url.match(/\.(js)$/i)) {
        return await offlineCache.match('/offline.js') || new Response('', { status: 404 });
    }

    // Default: return offline page
    return await offlineCache.match('/offline.html') || new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
    });
}

/**
 * Add cache time to response
 */
function addCacheTime(response) {
    const headers = new Headers(response.headers);
    headers.set('X-Cache-Time', Date.now().toString());

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

/**
 * Get cache time from response
 */
function getCacheTime(response) {
    const cacheTime = response.headers.get('X-Cache-Time');
    return cacheTime ? parseInt(cacheTime, 10) : 0;
}

/**
 * Update cache in background
 */
async function updateCacheInBackground(request, cacheName, timeout) {
    try {
        const response = await fetchWithTimeout(request, timeout);

        if (response.ok) {
            const cache = await caches.open(cacheName);
            const responseWithTime = addCacheTime(response);
            cache.put(request, responseWithTime);
        }
    } catch (error) {
        // Silently fail for background updates
    }
}

/**
 * Create custom strategy
 */
export function createCacheStrategy(handler) {
    return async (request, cacheName, options) => {
        return handler(request, cacheName, options, {
            cacheFirst,
            networkFirst,
            cacheOnly,
            networkOnly,
            staleWhileRevalidate,
            cacheWithUpdate,
            fetchWithTimeout,
            getOfflineFallback,
        });
    };
}

/**
 * Cache strategy router
 * Route different URLs to different strategies
 */
export class CacheStrategyRouter {
    constructor() {
        this.routes = [];
    }

    addRoute(pattern, strategy, cacheName, options = {}) {
        this.routes.push({ pattern, strategy, cacheName, options });
    }

    async handle(request) {
        const url = typeof request === 'string' ? request : request.url;

        for (const route of this.routes) {
            if (this.matchPattern(url, route.pattern)) {
                return route.strategy(request, route.cacheName, route.options);
            }
        }

        // Default: network first
        return networkFirst(request, 'default-cache');
    }

    matchPattern(url, pattern) {
        if (pattern instanceof RegExp) {
            return pattern.test(url);
        }
        if (typeof pattern === 'string') {
            return url.includes(pattern);
        }
        if (typeof pattern === 'function') {
            return pattern(url);
        }
        return false;
    }
}