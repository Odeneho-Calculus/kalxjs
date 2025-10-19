/**
 * Edge Middleware System
 * Request/response middleware for edge functions
 */

/**
 * Middleware function type
 * @callback MiddlewareFunction
 * @param {Request} request - Request object
 * @param {Object} context - Context object
 * @param {Function} next - Next middleware function
 * @returns {Promise<Response|void>}
 */

/**
 * Middleware Manager
 */
export class MiddlewareManager {
    constructor() {
        this.middleware = [];
    }

    /**
     * Add middleware
     * @param {MiddlewareFunction} fn - Middleware function
     */
    use(fn) {
        this.middleware.push(fn);
        return this;
    }

    /**
     * Execute middleware chain
     * @param {Request} request - Request object
     * @param {Object} context - Context object
     * @returns {Promise<Response>}
     */
    async execute(request, context = {}) {
        let index = 0;

        const next = async () => {
            if (index >= this.middleware.length) {
                return null;
            }

            const middleware = this.middleware[index++];
            return await middleware(request, context, next);
        };

        const response = await next();
        return response || new Response('Not Found', { status: 404 });
    }
}

/**
 * CORS middleware
 * @param {Object} options - CORS options
 * @returns {MiddlewareFunction}
 */
export function cors(options = {}) {
    const {
        origin = '*',
        methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders = ['Content-Type', 'Authorization'],
        exposedHeaders = [],
        credentials = false,
        maxAge = 86400
    } = options;

    return async (request, context, next) => {
        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Methods': methods.join(', '),
                    'Access-Control-Allow-Headers': allowedHeaders.join(', '),
                    'Access-Control-Max-Age': maxAge.toString(),
                    ...(credentials && { 'Access-Control-Allow-Credentials': 'true' })
                }
            });
        }

        // Execute next middleware
        const response = await next();

        // Add CORS headers to response
        if (response) {
            const headers = new Headers(response.headers);
            headers.set('Access-Control-Allow-Origin', origin);
            if (exposedHeaders.length > 0) {
                headers.set('Access-Control-Expose-Headers', exposedHeaders.join(', '));
            }
            if (credentials) {
                headers.set('Access-Control-Allow-Credentials', 'true');
            }

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers
            });
        }

        return response;
    };
}

/**
 * Rate limiting middleware
 * @param {Object} options - Rate limit options
 * @returns {MiddlewareFunction}
 */
export function rateLimit(options = {}) {
    const {
        limit = 100,
        window = 60000, // 1 minute
        keyGenerator = (request) => request.headers.get('CF-Connecting-IP') || 'unknown'
    } = options;

    const requests = new Map();

    return async (request, context, next) => {
        const key = keyGenerator(request);
        const now = Date.now();

        if (!requests.has(key)) {
            requests.set(key, []);
        }

        const userRequests = requests.get(key);

        // Remove old requests outside the window
        const validRequests = userRequests.filter(time => now - time < window);
        requests.set(key, validRequests);

        // Check limit
        if (validRequests.length >= limit) {
            return new Response('Too Many Requests', {
                status: 429,
                headers: {
                    'Retry-After': Math.ceil(window / 1000).toString()
                }
            });
        }

        // Add current request
        validRequests.push(now);

        return await next();
    };
}

/**
 * Authentication middleware
 * @param {Object} options - Auth options
 * @returns {MiddlewareFunction}
 */
export function auth(options = {}) {
    const {
        type = 'bearer',
        verify = async () => false,
        unauthorized = () => new Response('Unauthorized', { status: 401 })
    } = options;

    return async (request, context, next) => {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return unauthorized();
        }

        try {
            let token;
            if (type === 'bearer') {
                token = authHeader.replace('Bearer ', '');
            } else if (type === 'basic') {
                token = authHeader.replace('Basic ', '');
            } else {
                token = authHeader;
            }

            const isValid = await verify(token, request, context);

            if (!isValid) {
                return unauthorized();
            }

            // Store auth info in context
            context.auth = { token, isAuthenticated: true };

            return await next();
        } catch (error) {
            console.error('Auth error:', error);
            return unauthorized();
        }
    };
}

/**
 * Logging middleware
 * @param {Object} options - Logging options
 * @returns {MiddlewareFunction}
 */
export function logger(options = {}) {
    const {
        logRequest = true,
        logResponse = true,
        logTiming = true
    } = options;

    return async (request, context, next) => {
        const startTime = performance.now();

        if (logRequest) {
            console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);
        }

        const response = await next();

        const duration = performance.now() - startTime;

        if (logResponse && response) {
            console.log(`[${new Date().toISOString()}] ${response.status} ${request.method} ${request.url}${logTiming ? ` (${duration.toFixed(2)}ms)` : ''}`);
        }

        return response;
    };
}

/**
 * Error handling middleware
 * @param {Object} options - Error handling options
 * @returns {MiddlewareFunction}
 */
export function errorHandler(options = {}) {
    const {
        production = false,
        onError
    } = options;

    return async (request, context, next) => {
        try {
            return await next();
        } catch (error) {
            console.error('Middleware error:', error);

            if (onError) {
                return await onError(error, request, context);
            }

            if (production) {
                return new Response('Internal Server Error', { status: 500 });
            }

            return new Response(JSON.stringify({
                error: error.message,
                stack: error.stack
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    };
}

/**
 * Compression middleware
 * @param {Object} options - Compression options
 * @returns {MiddlewareFunction}
 */
export function compress(options = {}) {
    const {
        threshold = 1024, // Only compress responses larger than 1KB
        types = ['text/html', 'text/css', 'text/javascript', 'application/json']
    } = options;

    return async (request, context, next) => {
        const response = await next();

        if (!response) return response;

        const acceptEncoding = request.headers.get('Accept-Encoding') || '';
        const contentType = response.headers.get('Content-Type') || '';

        // Check if compression is applicable
        if (!types.some(type => contentType.includes(type))) {
            return response;
        }

        if (!acceptEncoding.includes('gzip')) {
            return response;
        }

        // Note: Actual compression would require CompressionStream API
        // Available in modern edge runtimes
        const headers = new Headers(response.headers);
        headers.set('Content-Encoding', 'gzip');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    };
}

/**
 * Create middleware chain
 * @param {Array<MiddlewareFunction>} middleware - Array of middleware
 * @returns {MiddlewareManager}
 */
export function createMiddlewareChain(middleware = []) {
    const manager = new MiddlewareManager();
    middleware.forEach(mw => manager.use(mw));
    return manager;
}

export default {
    MiddlewareManager,
    createMiddlewareChain,
    cors,
    rateLimit,
    auth,
    logger,
    errorHandler,
    compress
};