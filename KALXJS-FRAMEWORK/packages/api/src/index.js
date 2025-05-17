import { ref, reactive, computed } from '@kalxjs/core';

/**
 * Custom hook for API requests with built-in state management
 * @param {Object} options - Configuration options
 * @param {string} options.baseUrl - Base URL for API requests
 * @param {Object} options.headers - Default headers for requests
 * @param {number} options.timeout - Request timeout in milliseconds
 * @param {Function} options.onError - Global error handler
 * @returns {Object} API utilities and state
 */
export function useApi(options = {}) {
    const {
        baseUrl = '',
        headers: defaultHeaders = { 'Content-Type': 'application/json' },
        timeout = 30000,
        onError = null
    } = options;

    // State
    const isLoading = ref(false);
    const error = ref(null);
    const abortControllers = reactive({});

    // Computed
    const hasError = computed(() => error.value !== null);

    /**
     * Make an API request
     * @param {Object} config - Request configuration
     * @returns {Promise} - Response promise
     */
    async function request(config) {
        const {
            url,
            method = 'GET',
            data = null,
            params = {},
            headers = {},
            signal = null,
            cache = 'default',
            key = url + method
        } = config;

        // Create URL with query parameters
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, value);
            }
        });

        const fullUrl = `${baseUrl}${url}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

        // Create abort controller if not provided
        let controller;
        if (signal) {
            controller = { signal };
        } else {
            controller = new AbortController();
            abortControllers[key] = controller;
        }

        // Reset state
        isLoading.value = true;
        error.value = null;

        try {
            // Prepare request options
            const requestOptions = {
                method,
                headers: { ...defaultHeaders, ...headers },
                signal: controller.signal,
                cache
            };

            // Add body for non-GET requests
            if (method !== 'GET' && data) {
                requestOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
            }

            // Set timeout
            const timeoutId = setTimeout(() => {
                if (abortControllers[key]) {
                    abortControllers[key].abort();
                    delete abortControllers[key];
                }
            }, timeout);

            // Make request
            const response = await fetch(fullUrl, requestOptions);
            clearTimeout(timeoutId);

            // Handle response
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            // Parse response based on content type
            const contentType = response.headers.get('content-type');
            let result;

            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else if (contentType && contentType.includes('text/')) {
                result = await response.text();
            } else {
                result = await response.blob();
            }

            return result;
        } catch (err) {
            error.value = err.message || 'Unknown error occurred';

            if (onError && typeof onError === 'function') {
                onError(err);
            }

            throw err;
        } finally {
            isLoading.value = false;
            if (abortControllers[key]) {
                delete abortControllers[key];
            }
        }
    }

    /**
     * Abort an ongoing request
     * @param {string} key - Request key to abort
     */
    function abort(key) {
        if (abortControllers[key]) {
            abortControllers[key].abort();
            delete abortControllers[key];
        }
    }

    /**
     * Abort all ongoing requests
     */
    function abortAll() {
        Object.values(abortControllers).forEach(controller => {
            controller.abort();
        });
        Object.keys(abortControllers).forEach(key => {
            delete abortControllers[key];
        });
    }

    // Convenience methods
    const get = (url, config = {}) => request({ ...config, url, method: 'GET' });
    const post = (url, data, config = {}) => request({ ...config, url, method: 'POST', data });
    const put = (url, data, config = {}) => request({ ...config, url, method: 'PUT', data });
    const patch = (url, data, config = {}) => request({ ...config, url, method: 'PATCH', data });
    const del = (url, config = {}) => request({ ...config, url, method: 'DELETE' });

    return {
        // State
        isLoading,
        error,
        hasError,

        // Methods
        request,
        get,
        post,
        put,
        patch,
        delete: del,
        abort,
        abortAll
    };
}