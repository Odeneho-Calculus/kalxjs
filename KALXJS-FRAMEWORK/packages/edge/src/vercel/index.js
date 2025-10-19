/**
 * Vercel Edge Functions Integration for KalxJS
 * Optimized for Vercel Edge runtime
 */

import { MiddlewareManager } from '../middleware.js';

/**
 * Create Vercel Edge handler
 * @param {Object} options - Handler options
 * @returns {Function} Handler function
 */
export function createEdgeHandler(options = {}) {
    const {
        middleware = [],
        rewrite,
        redirect
    } = options;

    const manager = new MiddlewareManager();

    // Add middleware
    middleware.forEach(mw => manager.use(mw));

    return async (request, context) => {
        const ctx = {
            ...context,
            geo: context.geo || {},
            ip: request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')
        };

        try {
            // Handle rewrites
            if (rewrite) {
                const url = new URL(request.url);
                const newPath = rewrite(url.pathname, ctx);
                if (newPath && newPath !== url.pathname) {
                    return NextResponse.rewrite(new URL(newPath, request.url));
                }
            }

            // Handle redirects
            if (redirect) {
                const url = new URL(request.url);
                const newPath = redirect(url.pathname, ctx);
                if (newPath && newPath !== url.pathname) {
                    return NextResponse.redirect(new URL(newPath, request.url));
                }
            }

            return await manager.execute(request, ctx);
        } catch (error) {
            console.error('Edge handler error:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    };
}

/**
 * NextResponse wrapper for Vercel Edge
 */
export const NextResponse = {
    /**
     * Create a response
     * @param {any} body - Response body
     * @param {Object} init - Response init
     * @returns {Response}
     */
    json(body, init = {}) {
        return new Response(JSON.stringify(body), {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                ...init.headers
            }
        });
    },

    /**
     * Redirect response
     * @param {string|URL} url - Redirect URL
     * @param {number} status - Status code
     * @returns {Response}
     */
    redirect(url, status = 307) {
        return new Response(null, {
            status,
            headers: {
                'Location': url.toString()
            }
        });
    },

    /**
     * Rewrite response (changes URL without redirect)
     * @param {string|URL} url - Rewrite URL
     * @returns {Response}
     */
    rewrite(url) {
        return new Response(null, {
            headers: {
                'x-middleware-rewrite': url.toString()
            }
        });
    },

    /**
     * Next (continue to next handler)
     * @returns {Response}
     */
    next() {
        return new Response(null, {
            headers: {
                'x-middleware-next': '1'
            }
        });
    }
};

/**
 * Vercel KV wrapper
 */
export class VercelKV {
    constructor(options = {}) {
        this.url = options.url || process.env.KV_REST_API_URL;
        this.token = options.token || process.env.KV_REST_API_TOKEN;
    }

    /**
     * Get value
     * @param {string} key - Key
     * @returns {Promise<any>}
     */
    async get(key) {
        const response = await fetch(`${this.url}/get/${key}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.result;
    }

    /**
     * Set value
     * @param {string} key - Key
     * @param {any} value - Value
     * @param {Object} options - Options (ex, px, exat, etc.)
     * @returns {Promise<string>}
     */
    async set(key, value, options = {}) {
        const body = { key, value, ...options };

        const response = await fetch(`${this.url}/set`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        return data.result;
    }

    /**
     * Delete value
     * @param {string} key - Key
     * @returns {Promise<number>}
     */
    async del(key) {
        const response = await fetch(`${this.url}/del/${key}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        const data = await response.json();
        return data.result;
    }

    /**
     * Check if key exists
     * @param {string} key - Key
     * @returns {Promise<boolean>}
     */
    async exists(key) {
        const response = await fetch(`${this.url}/exists/${key}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        const data = await response.json();
        return data.result === 1;
    }
}

/**
 * Get geolocation from request
 * @param {Request} request - Request object
 * @returns {Object} Geolocation data
 */
export function getGeolocation(request) {
    return {
        city: request.headers.get('x-vercel-ip-city'),
        country: request.headers.get('x-vercel-ip-country'),
        region: request.headers.get('x-vercel-ip-country-region'),
        latitude: request.headers.get('x-vercel-ip-latitude'),
        longitude: request.headers.get('x-vercel-ip-longitude')
    };
}

export default {
    createEdgeHandler,
    NextResponse,
    VercelKV,
    getGeolocation
};