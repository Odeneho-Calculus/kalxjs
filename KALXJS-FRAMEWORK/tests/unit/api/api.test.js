/**
 * @jest-environment jsdom
 */
import { useApi } from '@kalxjs/api';
import { ref, reactive, computed } from '@kalxjs/core';

// Mock the core module
jest.mock('@kalxjs/core', () => ({
    ref: jest.fn(val => ({
        value: val,
        __isRef: true
    })),
    reactive: jest.fn(obj => ({
        ...obj,
        __isReactive: true
    })),
    computed: jest.fn(fn => ({
        value: fn(),
        __isComputed: true
    }))
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock AbortController
global.AbortController = class {
    constructor() {
        this.signal = {};
        this.abort = jest.fn();
    }
};

describe('@kalxjs/api', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Setup default successful response
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ data: 'test data' }),
            headers: {
                get: (header) => header === 'content-type' ? 'application/json' : null
            },
            status: 200,
            statusText: 'OK'
        });

        // Reset ref mock to return new objects
        ref.mockImplementation(val => ({
            value: val,
            __isRef: true
        }));

        // Reset reactive mock
        reactive.mockImplementation(obj => ({
            ...obj,
            __isReactive: true
        }));

        // Reset computed mock
        computed.mockImplementation(fn => ({
            value: fn(),
            __isComputed: true
        }));

        // Reset setTimeout and clearTimeout
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('useApi initialization', () => {
        test('should initialize with default options', () => {
            // Test
            const api = useApi();

            // Assert
            expect(ref).toHaveBeenCalledWith(false); // isLoading
            expect(ref).toHaveBeenCalledWith(null); // error
            expect(reactive).toHaveBeenCalledWith({}); // abortControllers
            expect(computed).toHaveBeenCalled(); // hasError

            expect(api).toHaveProperty('isLoading');
            expect(api).toHaveProperty('error');
            expect(api).toHaveProperty('hasError');
            expect(api).toHaveProperty('request');
            expect(api).toHaveProperty('get');
            expect(api).toHaveProperty('post');
            expect(api).toHaveProperty('put');
            expect(api).toHaveProperty('patch');
            expect(api).toHaveProperty('delete');
            expect(api).toHaveProperty('abort');
            expect(api).toHaveProperty('abortAll');
        });

        test('should initialize with custom options', () => {
            // Setup
            const options = {
                baseUrl: 'https://api.example.com',
                headers: { 'X-Custom-Header': 'custom-value' },
                timeout: 5000,
                onError: jest.fn()
            };

            // Test
            const api = useApi(options);

            // Assert - we'll verify through a request
            api.get('/test');

            expect(fetch).toHaveBeenCalledWith(
                'https://api.example.com/test',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Custom-Header': 'custom-value'
                    })
                })
            );
        });
    });

    describe('request method', () => {
        test('should make GET request with correct parameters', async () => {
            // Setup
            const api = useApi({ baseUrl: 'https://api.test.com' });

            // Test
            await api.request({
                url: '/users',
                method: 'GET',
                params: { page: 1, limit: 10 }
            });

            // Assert
            expect(fetch).toHaveBeenCalledWith(
                'https://api.test.com/users?page=1&limit=10',
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    })
                })
            );
        });

        test('should make POST request with JSON body', async () => {
            // Setup
            const api = useApi();
            const data = { name: 'Test User', email: 'test@example.com' };

            // Test
            await api.request({
                url: '/users',
                method: 'POST',
                data
            });

            // Assert
            expect(fetch).toHaveBeenCalledWith(
                '/users',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify(data)
                })
            );
        });

        test('should handle string data in non-GET requests', async () => {
            // Setup
            const api = useApi();
            const stringData = 'raw string data';

            // Test
            await api.request({
                url: '/data',
                method: 'POST',
                data: stringData
            });

            // Assert
            expect(fetch).toHaveBeenCalledWith(
                '/data',
                expect.objectContaining({
                    method: 'POST',
                    body: stringData
                })
            );
        });

        test('should skip null and undefined query parameters', async () => {
            // Setup
            const api = useApi();

            // Test
            await api.request({
                url: '/users',
                params: {
                    id: 1,
                    name: 'test',
                    email: null,
                    role: undefined
                }
            });

            // Assert
            expect(fetch).toHaveBeenCalledWith(
                '/users?id=1&name=test',
                expect.any(Object)
            );
        });

        test('should use provided abort signal', async () => {
            // Setup
            const api = useApi();
            const signal = { type: 'abort-signal' };

            // Test
            await api.request({
                url: '/test',
                signal
            });

            // Assert
            expect(fetch).toHaveBeenCalledWith(
                '/test',
                expect.objectContaining({
                    signal
                })
            );
        });

        test('should create abort controller if signal not provided', async () => {
            // Setup
            const api = useApi();

            // Test
            await api.request({
                url: '/test',
                key: 'test-request'
            });

            // Assert
            expect(fetch).toHaveBeenCalledWith(
                '/test',
                expect.objectContaining({
                    signal: expect.any(Object)
                })
            );
        });

        test('should set loading state during request', async () => {
            // Setup
            const api = useApi();
            api.isLoading.value = false;

            // Create a delayed response
            let resolvePromise;
            const delayedPromise = new Promise(resolve => {
                resolvePromise = resolve;
            });

            global.fetch.mockImplementationOnce(() => delayedPromise);

            // Start request (don't await)
            const requestPromise = api.request({ url: '/test' });

            // Assert loading state is true during request
            expect(api.isLoading.value).toBe(true);

            // Resolve the fetch promise
            resolvePromise({
                ok: true,
                json: async () => ({ data: 'test' }),
                headers: {
                    get: () => 'application/json'
                }
            });

            // Wait for request to complete
            await requestPromise;

            // Assert loading state is false after request
            expect(api.isLoading.value).toBe(false);
        });

        test('should handle API error responses', async () => {
            // Setup
            const api = useApi();

            // Mock error response
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: async () => ({ error: 'Resource not found' })
            });

            // Test
            try {
                await api.request({ url: '/nonexistent' });
                fail('Should have thrown an error');
            } catch (error) {
                // Assert
                expect(error.message).toContain('API error: 404 Not Found');
                expect(api.error.value).toContain('API error: 404 Not Found');
                expect(api.isLoading.value).toBe(false);
            }
        });

        test('should handle network errors', async () => {
            // Setup
            const api = useApi({
                onError: jest.fn()
            });

            // Mock network error
            const networkError = new Error('Network error');
            global.fetch.mockRejectedValueOnce(networkError);

            // Test
            try {
                await api.request({ url: '/test' });
                fail('Should have thrown an error');
            } catch (error) {
                // Assert
                expect(error.message).toBe('Network error');
                expect(api.error.value).toBe('Network error');
                expect(api.isLoading.value).toBe(false);
                expect(api.onError).toHaveBeenCalledWith(networkError);
            }
        });

        test('should abort request on timeout', async () => {
            // Setup
            const api = useApi({ timeout: 1000 });

            // Mock a request that never resolves
            global.fetch.mockImplementationOnce(() => new Promise(() => { }));

            // Start request (don't await as it will timeout)
            const requestPromise = api.request({
                url: '/test',
                key: 'timeout-test'
            });

            // Fast-forward time to trigger timeout
            jest.advanceTimersByTime(1500);

            // Assert
            try {
                await requestPromise;
                fail('Should have thrown an error');
            } catch (error) {
                // The request should have been aborted
                expect(AbortController.prototype.abort).toHaveBeenCalled();
            }
        });

        test('should parse JSON response', async () => {
            // Setup
            const api = useApi();
            const responseData = { id: 1, name: 'Test' };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => responseData,
                headers: {
                    get: () => 'application/json'
                }
            });

            // Test
            const result = await api.request({ url: '/test' });

            // Assert
            expect(result).toEqual(responseData);
        });

        test('should parse text response', async () => {
            // Setup
            const api = useApi();

            global.fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => 'Text response',
                headers: {
                    get: () => 'text/plain'
                }
            });

            // Test
            const result = await api.request({ url: '/test' });

            // Assert
            expect(result).toBe('Text response');
        });

        test('should handle blob response', async () => {
            // Setup
            const api = useApi();
            const mockBlob = new Blob(['test'], { type: 'image/png' });

            global.fetch.mockResolvedValueOnce({
                ok: true,
                blob: async () => mockBlob,
                headers: {
                    get: () => 'image/png'
                }
            });

            // Test
            const result = await api.request({ url: '/image' });

            // Assert
            expect(result).toBe(mockBlob);
        });
    });

    describe('convenience methods', () => {
        test('get should call request with GET method', async () => {
            // Setup
            const api = useApi();
            const spy = jest.spyOn(api, 'request');

            // Test
            await api.get('/users', { params: { id: 1 } });

            // Assert
            expect(spy).toHaveBeenCalledWith({
                url: '/users',
                method: 'GET',
                params: { id: 1 }
            });
        });

        test('post should call request with POST method and data', async () => {
            // Setup
            const api = useApi();
            const spy = jest.spyOn(api, 'request');
            const data = { name: 'Test' };

            // Test
            await api.post('/users', data, { headers: { 'X-Test': 'test' } });

            // Assert
            expect(spy).toHaveBeenCalledWith({
                url: '/users',
                method: 'POST',
                data,
                headers: { 'X-Test': 'test' }
            });
        });

        test('put should call request with PUT method and data', async () => {
            // Setup
            const api = useApi();
            const spy = jest.spyOn(api, 'request');
            const data = { id: 1, name: 'Updated' };

            // Test
            await api.put('/users/1', data);

            // Assert
            expect(spy).toHaveBeenCalledWith({
                url: '/users/1',
                method: 'PUT',
                data
            });
        });

        test('patch should call request with PATCH method and data', async () => {
            // Setup
            const api = useApi();
            const spy = jest.spyOn(api, 'request');
            const data = { name: 'Patched' };

            // Test
            await api.patch('/users/1', data);

            // Assert
            expect(spy).toHaveBeenCalledWith({
                url: '/users/1',
                method: 'PATCH',
                data
            });
        });

        test('delete should call request with DELETE method', async () => {
            // Setup
            const api = useApi();
            const spy = jest.spyOn(api, 'request');

            // Test
            await api.delete('/users/1');

            // Assert
            expect(spy).toHaveBeenCalledWith({
                url: '/users/1',
                method: 'DELETE'
            });
        });
    });

    describe('abort methods', () => {
        test('abort should cancel specific request', async () => {
            // Setup
            const api = useApi();

            // Mock request that doesn't resolve
            global.fetch.mockImplementationOnce(() => new Promise(() => { }));

            // Start request (don't await)
            const requestPromise = api.request({
                url: '/test',
                key: 'test-key'
            });

            // Call abort
            api.abort('test-key');

            // Assert
            expect(AbortController.prototype.abort).toHaveBeenCalled();

            // Cleanup - let the promise reject
            try {
                await requestPromise;
            } catch (e) {
                // Expected
            }
        });

        test('abortAll should cancel all requests', async () => {
            // Setup
            const api = useApi();

            // Mock multiple requests that don't resolve
            global.fetch.mockImplementation(() => new Promise(() => { }));

            // Start multiple requests (don't await)
            const promise1 = api.request({ url: '/test1', key: 'key1' });
            const promise2 = api.request({ url: '/test2', key: 'key2' });

            // Call abortAll
            api.abortAll();

            // Assert
            expect(AbortController.prototype.abort).toHaveBeenCalledTimes(2);

            // Cleanup - let the promises reject
            try {
                await Promise.all([promise1, promise2]);
            } catch (e) {
                // Expected
            }
        });
    });
});