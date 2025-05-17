// @kalxjs/core - Automatic API integration

import { ref, reactive } from '../reactivity/reactive';

/**
 * Default fetch implementation
 * @private
 */
const defaultFetch = async (url, options = {}) => {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }

    return response.text();
};

/**
 * Creates an API client with automatic reactive state
 * @param {Object} options - API client options
 * @returns {Object} API client
 */
export function createApi(options = {}) {
    const {
        baseUrl = '',
        headers = {},
        fetchImplementation = defaultFetch,
        onRequest = null,
        onResponse = null,
        onError = null
    } = options;

    // Create reactive state for the API client
    const state = reactive({
        loading: false,
        error: null,
        data: null,
        status: null
    });

    // Create a cache for requests
    const cache = new Map();

    /**
     * Makes an API request
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise} Request promise
     */
    const request = async (url, options = {}) => {
        const {
            method = 'GET',
            body = null,
            params = null,
            headers: requestHeaders = {},
            cache: useCache = false,
            cacheTime = 60000, // 1 minute
            retry = 0,
            retryDelay = 1000,
            transform = null
        } = options;

        // Build full URL
        let fullUrl = `${baseUrl}${url}`;

        // Add query parameters
        if (params) {
            const queryParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    queryParams.append(key, params[key]);
                }
            });

            const queryString = queryParams.toString();
            if (queryString) {
                fullUrl += `?${queryString}`;
            }
        }

        // Create request options
        const fetchOptions = {
            method,
            headers: {
                ...headers,
                ...requestHeaders
            }
        };

        // Add body if present
        if (body) {
            if (body instanceof FormData) {
                fetchOptions.body = body;
            } else if (typeof body === 'object') {
                fetchOptions.body = JSON.stringify(body);
                fetchOptions.headers['Content-Type'] = 'application/json';
            } else {
                fetchOptions.body = body;
            }
        }

        // Check cache
        const cacheKey = `${method}:${fullUrl}:${JSON.stringify(fetchOptions.body || '')}`;
        if (useCache && method === 'GET') {
            const cachedResponse = cache.get(cacheKey);
            if (cachedResponse && Date.now() - cachedResponse.timestamp < cacheTime) {
                return cachedResponse.data;
            }
        }

        // Call onRequest hook
        if (onRequest) {
            const modifiedOptions = onRequest(fullUrl, fetchOptions);
            if (modifiedOptions) {
                fullUrl = modifiedOptions.url || fullUrl;
                Object.assign(fetchOptions, modifiedOptions.options || {});
            }
        }

        // Update state
        state.loading = true;
        state.error = null;

        // Make the request
        let response;
        let error;
        let retries = 0;

        while (retries <= retry) {
            try {
                response = await fetchImplementation(fullUrl, fetchOptions);
                break;
            } catch (err) {
                error = err;

                if (retries === retry) {
                    break;
                }

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retries++;
            }
        }

        // Handle error
        if (error) {
            state.loading = false;
            state.error = error;
            state.status = 'error';

            // Call onError hook
            if (onError) {
                onError(error, { url: fullUrl, options: fetchOptions });
            }

            throw error;
        }

        // Transform response if needed
        if (transform) {
            response = transform(response);
        }

        // Update state
        state.loading = false;
        state.data = response;
        state.status = 'success';

        // Call onResponse hook
        if (onResponse) {
            response = onResponse(response, { url: fullUrl, options: fetchOptions }) || response;
        }

        // Cache the response
        if (useCache && method === 'GET') {
            cache.set(cacheKey, {
                data: response,
                timestamp: Date.now()
            });
        }

        return response;
    };

    /**
     * Clears the cache
     * @param {string} url - Optional URL to clear from cache
     */
    const clearCache = (url = null) => {
        if (url) {
            // Clear specific URL from cache
            const urlPattern = `${baseUrl}${url}`;

            for (const key of cache.keys()) {
                if (key.includes(urlPattern)) {
                    cache.delete(key);
                }
            }
        } else {
            // Clear entire cache
            cache.clear();
        }
    };

    // Create convenience methods for common HTTP methods
    const get = (url, options = {}) => request(url, { ...options, method: 'GET' });
    const post = (url, data, options = {}) => request(url, { ...options, method: 'POST', body: data });
    const put = (url, data, options = {}) => request(url, { ...options, method: 'PUT', body: data });
    const patch = (url, data, options = {}) => request(url, { ...options, method: 'PATCH', body: data });
    const del = (url, options = {}) => request(url, { ...options, method: 'DELETE' });

    return {
        state,
        request,
        get,
        post,
        put,
        patch,
        delete: del,
        clearCache
    };
}

/**
 * Creates a composable API endpoint
 * @param {string} url - Endpoint URL
 * @param {Object} options - Endpoint options
 * @returns {Function} Composable endpoint
 */
export function useApi(url, options = {}) {
    const {
        method = 'GET',
        immediate = false,
        initialData = null,
        transform = null,
        onSuccess = null,
        onError = null,
        ...requestOptions
    } = options;

    // Create reactive state
    const data = ref(initialData);
    const loading = ref(false);
    const error = ref(null);
    const status = ref(null);

    // Create the request function
    const execute = async (payload = null, overrideOptions = {}) => {
        loading.value = true;
        error.value = null;
        status.value = 'loading';

        try {
            // Determine which API method to use
            const api = window.$kalxjs && window.$kalxjs.api;

            if (!api) {
                throw new Error('KalxJS API client not found. Make sure to use the API plugin.');
            }

            // Prepare request options
            const finalOptions = {
                ...requestOptions,
                ...overrideOptions
            };

            // Make the request
            let response;

            switch (method.toUpperCase()) {
                case 'GET':
                    response = await api.get(url, finalOptions);
                    break;
                case 'POST':
                    response = await api.post(url, payload, finalOptions);
                    break;
                case 'PUT':
                    response = await api.put(url, payload, finalOptions);
                    break;
                case 'PATCH':
                    response = await api.patch(url, payload, finalOptions);
                    break;
                case 'DELETE':
                    response = await api.delete(url, finalOptions);
                    break;
                default:
                    response = await api.request(url, {
                        ...finalOptions,
                        method,
                        body: payload
                    });
            }

            // Transform response if needed
            if (transform) {
                response = transform(response);
            }

            // Update state
            data.value = response;
            status.value = 'success';

            // Call onSuccess hook
            if (onSuccess) {
                onSuccess(response);
            }

            return response;
        } catch (err) {
            // Update error state
            error.value = err;
            status.value = 'error';

            // Call onError hook
            if (onError) {
                onError(err);
            }

            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Execute immediately if requested
    if (immediate) {
        execute();
    }

    return {
        data,
        loading,
        error,
        status,
        execute
    };
}

/**
 * Creates an API plugin for KalxJS
 * @param {Object} options - API plugin options
 * @returns {Object} API plugin
 */
export function createApiPlugin(options = {}) {
    return {
        name: 'api',
        install(app) {
            // Create API client
            const api = createApi(options);

            // Add API client to the app
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};
            app.config.globalProperties.$api = api;

            // Add API client to the window for useApi
            if (typeof window !== 'undefined') {
                window.$kalxjs = window.$kalxjs || {};
                window.$kalxjs.api = api;
            }

            // Add useApi to the app
            app.useApi = useApi;
        }
    };
}