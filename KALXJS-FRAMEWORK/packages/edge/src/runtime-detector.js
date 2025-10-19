/**
 * Edge Runtime Detector
 * Detect which edge runtime environment is being used
 */

/**
 * Edge runtime types
 */
export const EdgeRuntime = {
    CLOUDFLARE_WORKERS: 'cloudflare-workers',
    DENO_DEPLOY: 'deno-deploy',
    VERCEL_EDGE: 'vercel-edge',
    NETLIFY_EDGE: 'netlify-edge',
    FASTLY_COMPUTE: 'fastly-compute',
    AWS_LAMBDA_EDGE: 'aws-lambda-edge',
    UNKNOWN: 'unknown'
};

/**
 * Detect current edge runtime
 * @returns {string} Runtime type
 */
export function detectRuntime() {
    // Cloudflare Workers
    if (typeof caches !== 'undefined' && typeof crypto !== 'undefined' &&
        typeof crypto.subtle !== 'undefined' && typeof navigator === 'undefined') {
        return EdgeRuntime.CLOUDFLARE_WORKERS;
    }

    // Deno Deploy
    if (typeof Deno !== 'undefined') {
        return EdgeRuntime.DENO_DEPLOY;
    }

    // Vercel Edge
    if (typeof EdgeRuntime !== 'undefined' ||
        (typeof process !== 'undefined' && process.env?.VERCEL)) {
        return EdgeRuntime.VERCEL_EDGE;
    }

    // Netlify Edge
    if (typeof Netlify !== 'undefined') {
        return EdgeRuntime.NETLIFY_EDGE;
    }

    // Fastly Compute@Edge
    if (typeof fastly !== 'undefined') {
        return EdgeRuntime.FASTLY_COMPUTE;
    }

    // AWS Lambda@Edge
    if (typeof process !== 'undefined' &&
        process.env?.AWS_EXECUTION_ENV?.includes('Lambda')) {
        return EdgeRuntime.AWS_LAMBDA_EDGE;
    }

    return EdgeRuntime.UNKNOWN;
}

/**
 * Runtime capabilities
 */
export const runtimeCapabilities = {
    [EdgeRuntime.CLOUDFLARE_WORKERS]: {
        name: 'Cloudflare Workers',
        supportsStreaming: true,
        supportsWebCrypto: true,
        supportsKV: true,
        supportsCache: true,
        coldStartTime: '<1ms',
        maxExecutionTime: 50000, // ms (CPU time)
        maxMemory: 128 * 1024 * 1024, // 128MB
        globalAPIs: ['fetch', 'caches', 'crypto', 'Request', 'Response']
    },

    [EdgeRuntime.DENO_DEPLOY]: {
        name: 'Deno Deploy',
        supportsStreaming: true,
        supportsWebCrypto: true,
        supportsKV: true,
        supportsCache: false,
        coldStartTime: '<10ms',
        maxExecutionTime: 50000,
        maxMemory: 512 * 1024 * 1024, // 512MB
        globalAPIs: ['fetch', 'Deno', 'crypto', 'Request', 'Response']
    },

    [EdgeRuntime.VERCEL_EDGE]: {
        name: 'Vercel Edge Functions',
        supportsStreaming: true,
        supportsWebCrypto: true,
        supportsKV: true,
        supportsCache: true,
        coldStartTime: '<50ms',
        maxExecutionTime: 30000,
        maxMemory: 128 * 1024 * 1024,
        globalAPIs: ['fetch', 'crypto', 'Request', 'Response']
    },

    [EdgeRuntime.NETLIFY_EDGE]: {
        name: 'Netlify Edge Functions',
        supportsStreaming: true,
        supportsWebCrypto: true,
        supportsKV: false,
        supportsCache: false,
        coldStartTime: '<50ms',
        maxExecutionTime: 50000,
        maxMemory: 128 * 1024 * 1024,
        globalAPIs: ['fetch', 'crypto', 'Request', 'Response', 'Netlify']
    }
};

/**
 * Get runtime capabilities
 * @returns {Object} Capabilities object
 */
export function getRuntimeCapabilities() {
    const runtime = detectRuntime();
    return runtimeCapabilities[runtime] || {
        name: 'Unknown Runtime',
        supportsStreaming: false,
        supportsWebCrypto: false,
        supportsKV: false,
        supportsCache: false,
        coldStartTime: 'unknown',
        maxExecutionTime: 0,
        maxMemory: 0,
        globalAPIs: []
    };
}

/**
 * Check if specific feature is supported
 * @param {string} feature - Feature name
 * @returns {boolean}
 */
export function isFeatureSupported(feature) {
    const capabilities = getRuntimeCapabilities();
    return capabilities[`supports${feature}`] || false;
}

/**
 * Get execution environment info
 * @returns {Object} Environment info
 */
export function getEnvironmentInfo() {
    return {
        runtime: detectRuntime(),
        capabilities: getRuntimeCapabilities(),
        isEdge: detectRuntime() !== EdgeRuntime.UNKNOWN,
        platform: typeof navigator !== 'undefined' ? 'browser' : 'edge'
    };
}

export default {
    EdgeRuntime,
    detectRuntime,
    getRuntimeCapabilities,
    isFeatureSupported,
    getEnvironmentInfo
};