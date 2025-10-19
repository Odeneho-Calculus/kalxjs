/**
 * Deno Deploy Integration for KalxJS
 * Optimized for Deno Deploy edge runtime
 */

import { MiddlewareManager } from '../middleware.js';

/**
 * Create Deno Deploy handler
 * @param {Object} options - Handler options
 * @returns {Function} Handler function
 */
export function createDenoHandler(options = {}) {
    const {
        middleware = [],
        routes = new Map()
    } = options;

    const manager = new MiddlewareManager();

    // Add middleware
    middleware.forEach(mw => manager.use(mw));

    return async (request) => {
        const context = {
            kv: null, // Will be set if KV is used
            url: new URL(request.url)
        };

        try {
            // Check routes
            const url = new URL(request.url);
            const route = routes.get(url.pathname);

            if (route) {
                return await route(request, context);
            }

            return await manager.execute(request, context);
        } catch (error) {
            console.error('Deno handler error:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    };
}

/**
 * Deno KV wrapper
 */
export class DenoKV {
    constructor() {
        this.kv = null;
    }

    /**
     * Initialize KV
     * @returns {Promise<void>}
     */
    async init() {
        if (!this.kv) {
            this.kv = await Deno.openKv();
        }
    }

    /**
     * Get value from KV
     * @param {Array} key - Key path
     * @returns {Promise<any>}
     */
    async get(key) {
        await this.init();
        const result = await this.kv.get(key);
        return result.value;
    }

    /**
     * Set value in KV
     * @param {Array} key - Key path
     * @param {any} value - Value
     * @param {Object} options - Options
     */
    async set(key, value, options = {}) {
        await this.init();
        return await this.kv.set(key, value, options);
    }

    /**
     * Delete value from KV
     * @param {Array} key - Key path
     */
    async delete(key) {
        await this.init();
        return await this.kv.delete(key);
    }

    /**
     * List entries
     * @param {Object} selector - Selector
     * @returns {AsyncIterator}
     */
    async *list(selector) {
        await this.init();
        for await (const entry of this.kv.list(selector)) {
            yield entry;
        }
    }

    /**
     * Atomic operation
     * @returns {Object} Atomic operation builder
     */
    async atomic() {
        await this.init();
        return this.kv.atomic();
    }
}

/**
 * Serve static files from Deno
 * @param {string} directory - Directory path
 * @param {Object} options - Options
 * @returns {Function} Middleware
 */
export function serveStatic(directory, options = {}) {
    const {
        index = 'index.html',
        notFound = '404.html'
    } = options;

    return async (request, context, next) => {
        const url = new URL(request.url);
        let filePath = url.pathname;

        // Security: prevent directory traversal
        if (filePath.includes('..')) {
            return new Response('Forbidden', { status: 403 });
        }

        // Handle index file
        if (filePath.endsWith('/')) {
            filePath += index;
        }

        const fullPath = `${directory}${filePath}`;

        try {
            const file = await Deno.readFile(fullPath);
            const contentType = getContentType(fullPath);

            return new Response(file, {
                headers: { 'Content-Type': contentType }
            });
        } catch (error) {
            if (error instanceof Deno.errors.NotFound) {
                // Try to serve 404 page
                try {
                    const notFoundFile = await Deno.readFile(`${directory}/${notFound}`);
                    return new Response(notFoundFile, {
                        status: 404,
                        headers: { 'Content-Type': 'text/html' }
                    });
                } catch {
                    return new Response('Not Found', { status: 404 });
                }
            }

            throw error;
        }
    };
}

/**
 * Get content type from file path
 * @param {string} filePath - File path
 * @returns {string} Content type
 */
function getContentType(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();

    const types = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'text/javascript',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'woff': 'font/woff',
        'woff2': 'font/woff2',
        'ttf': 'font/ttf',
        'eot': 'application/vnd.ms-fontobject'
    };

    return types[ext] || 'application/octet-stream';
}

/**
 * WebSocket handler for Deno
 * @param {Function} handler - WebSocket handler
 * @returns {Function} Request handler
 */
export function handleWebSocket(handler) {
    return async (request) => {
        const upgrade = request.headers.get('upgrade') || '';

        if (upgrade.toLowerCase() !== 'websocket') {
            return new Response('Expected WebSocket', { status: 426 });
        }

        const { socket, response } = Deno.upgradeWebSocket(request);

        socket.onopen = () => handler.onOpen?.(socket);
        socket.onmessage = (event) => handler.onMessage?.(socket, event);
        socket.onclose = () => handler.onClose?.(socket);
        socket.onerror = (error) => handler.onError?.(socket, error);

        return response;
    };
}

export default {
    createDenoHandler,
    DenoKV,
    serveStatic,
    handleWebSocket
};