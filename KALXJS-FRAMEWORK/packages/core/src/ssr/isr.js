/**
 * @kalxjs/core - Incremental Static Regeneration (ISR)
 * Next.js-style ISR for KALXJS
 *
 * Features:
 * - Static generation with revalidation
 * - On-demand regeneration
 * - Stale-while-revalidate pattern
 * - Background regeneration
 * - Cache management
 *
 * @module @kalxjs/core/ssr/isr
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * ISR cache configuration
 */
const ISR_CONFIG = {
    cacheDir: '.kalxjs/isr-cache',
    defaultRevalidate: 60, // seconds
    maxAge: 86400 // 24 hours
};

/**
 * ISR page registry
 */
const isrRegistry = new Map();

/**
 * Register a page for ISR
 *
 * @param {string} pagePath - Page route path
 * @param {Function} generator - Page generator function
 * @param {object} options - ISR options
 *
 * @example
 * ```js
 * registerISRPage('/blog/:slug', async ({ params }) => {
 *   const post = await fetchPost(params.slug);
 *   return renderPage(post);
 * }, {
 *   revalidate: 3600, // Revalidate every hour
 *   fallback: 'blocking' // or 'static' or false
 * });
 * ```
 */
export function registerISRPage(pagePath, generator, options = {}) {
    const {
        revalidate = ISR_CONFIG.defaultRevalidate,
        fallback = 'blocking', // 'blocking', 'static', false
        maxAge = ISR_CONFIG.maxAge
    } = options;

    console.log(`[isr] Registering ISR page: ${pagePath}`);
    console.log(`  - Revalidate: ${revalidate}s`);
    console.log(`  - Fallback: ${fallback}`);

    isrRegistry.set(pagePath, {
        generator,
        revalidate,
        fallback,
        maxAge,
        lastGenerated: new Map() // Track generation time per path
    });
}

/**
 * Get page with ISR
 * Implements stale-while-revalidate pattern
 *
 * @param {string} pagePath - Page route
 * @param {object} params - Route parameters
 * @param {object} options - Options
 * @returns {Promise<object>} - Page data with metadata
 */
export async function getISRPage(pagePath, params = {}, options = {}) {
    console.log(`[isr] Fetching ISR page: ${pagePath}`);

    const config = isrRegistry.get(pagePath);

    if (!config) {
        throw new Error(`ISR page not registered: ${pagePath}`);
    }

    const cacheKey = generateCacheKey(pagePath, params);
    const cachePath = getCachePath(cacheKey);

    try {
        // Try to read from cache
        const cached = await readCache(cachePath);

        if (cached) {
            const age = Date.now() - cached.generatedAt;
            const isStale = age > (config.revalidate * 1000);

            console.log(`[isr] Cache found for ${pagePath}`);
            console.log(`  - Age: ${Math.floor(age / 1000)}s`);
            console.log(`  - Stale: ${isStale}`);

            if (isStale) {
                // Stale-while-revalidate: return stale data, regenerate in background
                console.log('[isr] Serving stale content, regenerating in background');

                // Regenerate in background (don't await)
                regenerateInBackground(pagePath, params, config, cacheKey, cachePath);

                return {
                    html: cached.html,
                    props: cached.props,
                    status: 'stale',
                    generatedAt: cached.generatedAt,
                    revalidateAt: cached.generatedAt + (config.revalidate * 1000)
                };
            }

            // Fresh cache
            console.log('[isr] Serving fresh cached content');
            return {
                html: cached.html,
                props: cached.props,
                status: 'fresh',
                generatedAt: cached.generatedAt,
                revalidateAt: cached.generatedAt + (config.revalidate * 1000)
            };
        }

        // No cache - generate now
        console.log('[isr] No cache found, generating page');

        if (config.fallback === 'static') {
            // Serve static fallback while generating
            console.log('[isr] Using static fallback');

            // Generate in background
            regenerateInBackground(pagePath, params, config, cacheKey, cachePath);

            return {
                html: generateFallbackHTML(pagePath),
                props: {},
                status: 'fallback',
                generatedAt: Date.now()
            };
        }

        // Blocking fallback - wait for generation
        console.log('[isr] Using blocking fallback');
        return await generatePage(pagePath, params, config, cacheKey, cachePath);

    } catch (error) {
        console.error('[isr] Error fetching ISR page:', error);
        throw error;
    }
}

/**
 * Generate page content
 */
async function generatePage(pagePath, params, config, cacheKey, cachePath) {
    console.log(`[isr] Generating page: ${pagePath}`);

    const startTime = Date.now();

    try {
        // Call generator function
        const result = await config.generator({ params });

        const generatedAt = Date.now();
        const duration = generatedAt - startTime;

        console.log(`[isr] Page generated in ${duration}ms`);

        // Cache the result
        await writeCache(cachePath, {
            html: result.html || result,
            props: result.props || {},
            generatedAt
        });

        // Update last generated time
        config.lastGenerated.set(cacheKey, generatedAt);

        return {
            html: result.html || result,
            props: result.props || {},
            status: 'generated',
            generatedAt,
            revalidateAt: generatedAt + (config.revalidate * 1000)
        };

    } catch (error) {
        console.error('[isr] Page generation error:', error);
        throw error;
    }
}

/**
 * Regenerate page in background
 */
async function regenerateInBackground(pagePath, params, config, cacheKey, cachePath) {
    // Don't block - fire and forget
    setImmediate(async () => {
        try {
            console.log(`[isr] Background regeneration started: ${pagePath}`);
            await generatePage(pagePath, params, config, cacheKey, cachePath);
            console.log(`[isr] Background regeneration complete: ${pagePath}`);
        } catch (error) {
            console.error('[isr] Background regeneration error:', error);
        }
    });
}

/**
 * On-demand revalidation
 * Allows manual cache invalidation
 */
export async function revalidatePage(pagePath, params = {}) {
    console.log(`[isr] On-demand revalidation: ${pagePath}`);

    const config = isrRegistry.get(pagePath);

    if (!config) {
        throw new Error(`ISR page not registered: ${pagePath}`);
    }

    const cacheKey = generateCacheKey(pagePath, params);
    const cachePath = getCachePath(cacheKey);

    // Delete cache
    await deleteCache(cachePath);

    // Regenerate
    return await generatePage(pagePath, params, config, cacheKey, cachePath);
}

/**
 * Generate cache key
 */
function generateCacheKey(pagePath, params) {
    const paramsStr = JSON.stringify(params, Object.keys(params).sort());
    const hash = crypto
        .createHash('md5')
        .update(`${pagePath}:${paramsStr}`)
        .digest('hex');

    return `${pagePath.replace(/\//g, '_')}_${hash}`;
}

/**
 * Get cache file path
 */
function getCachePath(cacheKey) {
    return path.join(ISR_CONFIG.cacheDir, `${cacheKey}.json`);
}

/**
 * Read from cache
 */
async function readCache(cachePath) {
    try {
        const data = await fs.readFile(cachePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

/**
 * Write to cache
 */
async function writeCache(cachePath, data) {
    try {
        // Ensure directory exists
        await fs.mkdir(path.dirname(cachePath), { recursive: true });

        // Write cache file
        await fs.writeFile(cachePath, JSON.stringify(data), 'utf-8');

        console.log(`[isr] Cache written: ${cachePath}`);
    } catch (error) {
        console.error('[isr] Cache write error:', error);
        // Don't throw - cache write failure shouldn't break the app
    }
}

/**
 * Delete cache
 */
async function deleteCache(cachePath) {
    try {
        await fs.unlink(cachePath);
        console.log(`[isr] Cache deleted: ${cachePath}`);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('[isr] Cache delete error:', error);
        }
    }
}

/**
 * Generate fallback HTML
 */
function generateFallbackHTML(pagePath) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Loading...</title>
    <style>
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: sans-serif;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="spinner"></div>
    </div>
    <script>
        // Auto-refresh after 1 second to get generated content
        setTimeout(() => location.reload(), 1000);
    </script>
</body>
</html>
    `.trim();
}

/**
 * Clear all ISR cache
 */
export async function clearISRCache() {
    try {
        await fs.rm(ISR_CONFIG.cacheDir, { recursive: true, force: true });
        console.log('[isr] All cache cleared');
    } catch (error) {
        console.error('[isr] Error clearing cache:', error);
    }
}

/**
 * Get ISR statistics
 */
export function getISRStats() {
    const pages = Array.from(isrRegistry.entries()).map(([path, config]) => ({
        path,
        revalidate: config.revalidate,
        fallback: config.fallback,
        lastGenerated: Array.from(config.lastGenerated.entries())
    }));

    return {
        totalPages: isrRegistry.size,
        pages
    };
}

export default {
    registerISRPage,
    getISRPage,
    revalidatePage,
    clearISRCache,
    getISRStats
};