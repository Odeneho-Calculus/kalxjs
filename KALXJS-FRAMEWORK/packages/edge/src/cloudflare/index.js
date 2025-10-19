/**
 * Cloudflare Workers Integration for KalxJS
 * Optimized for Cloudflare Workers edge runtime
 */

import { MiddlewareManager } from '../middleware.js';
import { EdgeCacheManager } from '../cache-strategies.js';

/**
 * Create Cloudflare Workers handler
 * @param {Object} options - Handler options
 * @returns {Function} Worker handler
 */
export function createWorkerHandler(options = {}) {
    const {
        middleware = [],
        cache = true,
        cors = false
    } = options;

    const manager = new MiddlewareManager();

    // Add middleware
    middleware.forEach(mw => manager.use(mw));

    return async (request, env, ctx) => {
        const context = {
            env,
            ctx,
            waitUntil: (promise) => ctx.waitUntil(promise),
            passThroughOnException: () => ctx.passThroughOnException()
        };

        try {
            return await manager.execute(request, context);
        } catch (error) {
            console.error('Worker error:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    };
}

/**
 * KV Storage wrapper for Cloudflare Workers
 */
export class WorkerKV {
    constructor(namespace) {
        this.namespace = namespace;
    }

    /**
     * Get value from KV
     * @param {string} key - Key
     * @param {Object} options - Options
     * @returns {Promise<any>}
     */
    async get(key, options = {}) {
        const { type = 'text' } = options;
        return await this.namespace.get(key, type);
    }

    /**
     * Put value in KV
     * @param {string} key - Key
     * @param {any} value - Value
     * @param {Object} options - Options
     */
    async put(key, value, options = {}) {
        return await this.namespace.put(key, value, options);
    }

    /**
     * Delete value from KV
     * @param {string} key - Key
     */
    async delete(key) {
        return await this.namespace.delete(key);
    }

    /**
     * List keys
     * @param {Object} options - List options
     * @returns {Promise<Object>}
     */
    async list(options = {}) {
        return await this.namespace.list(options);
    }
}

/**
 * Durable Objects wrapper
 */
export class DurableObjectWrapper {
    constructor(binding, id) {
        this.binding = binding;
        this.id = id;
    }

    /**
     * Get Durable Object stub
     * @returns {Object} Durable Object stub
     */
    getStub() {
        return this.binding.get(this.id);
    }

    /**
     * Call Durable Object method
     * @param {string} method - Method name
     * @param {Array} args - Arguments
     * @returns {Promise<any>}
     */
    async call(method, ...args) {
        const stub = this.getStub();
        return await stub.fetch(new Request(`https://do/${method}`, {
            method: 'POST',
            body: JSON.stringify(args)
        }));
    }
}

/**
 * Scheduled event handler
 * @param {Function} handler - Handler function
 * @returns {Function} Scheduled handler
 */
export function onScheduled(handler) {
    return async (event, env, ctx) => {
        try {
            return await handler({
                scheduledTime: event.scheduledTime,
                cron: event.cron,
                env,
                ctx
            });
        } catch (error) {
            console.error('Scheduled handler error:', error);
        }
    };
}

/**
 * Queue handler
 * @param {Function} handler - Handler function
 * @returns {Function} Queue handler
 */
export function onQueue(handler) {
    return async (batch, env, ctx) => {
        try {
            const messages = batch.messages.map(msg => ({
                id: msg.id,
                timestamp: msg.timestamp,
                body: msg.body
            }));

            return await handler({ messages, env, ctx });
        } catch (error) {
            console.error('Queue handler error:', error);
        }
    };
}

/**
 * R2 Storage wrapper
 */
export class WorkerR2 {
    constructor(bucket) {
        this.bucket = bucket;
    }

    /**
     * Get object from R2
     * @param {string} key - Object key
     * @returns {Promise<Object|null>}
     */
    async get(key) {
        return await this.bucket.get(key);
    }

    /**
     * Put object in R2
     * @param {string} key - Object key
     * @param {any} value - Object value
     * @param {Object} options - Options
     * @returns {Promise<Object>}
     */
    async put(key, value, options = {}) {
        return await this.bucket.put(key, value, options);
    }

    /**
     * Delete object from R2
     * @param {string} key - Object key
     */
    async delete(key) {
        return await this.bucket.delete(key);
    }

    /**
     * List objects
     * @param {Object} options - List options
     * @returns {Promise<Object>}
     */
    async list(options = {}) {
        return await this.bucket.list(options);
    }
}

export default {
    createWorkerHandler,
    WorkerKV,
    DurableObjectWrapper,
    WorkerR2,
    onScheduled,
    onQueue
};