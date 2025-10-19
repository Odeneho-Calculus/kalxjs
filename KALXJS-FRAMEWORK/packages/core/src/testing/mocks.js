/**
 * Mock Utilities for Testing
 * Mock router, store, and other dependencies
 *
 * @module @kalxjs/testing/mocks
 */

/**
 * Create mock function
 */
export function createMockFn(implementation) {
    const calls = [];
    const returns = [];

    function mockFn(...args) {
        calls.push(args);

        if (implementation) {
            const result = implementation(...args);
            returns.push(result);
            return result;
        }

        const returnValue = mockFn._returnValue;
        returns.push(returnValue);
        return returnValue;
    }

    mockFn.mock = {
        calls,
        returns,
        get callCount() {
            return calls.length;
        },
    };

    mockFn._returnValue = undefined;

    mockFn.mockReturnValue = (value) => {
        mockFn._returnValue = value;
        return mockFn;
    };

    mockFn.mockReturnValueOnce = (value) => {
        const currentImpl = implementation;
        let called = false;

        implementation = (...args) => {
            if (!called) {
                called = true;
                return value;
            }
            return currentImpl ? currentImpl(...args) : mockFn._returnValue;
        };

        return mockFn;
    };

    mockFn.mockResolvedValue = (value) => {
        mockFn._returnValue = Promise.resolve(value);
        return mockFn;
    };

    mockFn.mockRejectedValue = (error) => {
        mockFn._returnValue = Promise.reject(error);
        return mockFn;
    };

    mockFn.mockImplementation = (fn) => {
        implementation = fn;
        return mockFn;
    };

    mockFn.mockClear = () => {
        calls.length = 0;
        returns.length = 0;
        return mockFn;
    };

    mockFn.mockReset = () => {
        mockFn.mockClear();
        implementation = null;
        mockFn._returnValue = undefined;
        return mockFn;
    };

    return mockFn;
}

/**
 * Create spy function
 */
export function createSpy(object, method) {
    const original = object[method];
    const mockFn = createMockFn(original.bind(object));

    object[method] = mockFn;

    mockFn.mockRestore = () => {
        object[method] = original;
    };

    return mockFn;
}

/**
 * Mock Router
 */
export function createMockRouter(options = {}) {
    const {
        currentRoute = {
            path: '/',
            query: {},
            params: {},
            name: null,
            meta: {},
        },
        routes = [],
    } = options;

    const router = {
        currentRoute: { ...currentRoute },
        routes,
        history: [currentRoute.path],

        push: createMockFn((to) => {
            const path = typeof to === 'string' ? to : to.path;
            router.currentRoute = {
                path,
                query: to.query || {},
                params: to.params || {},
                name: to.name || null,
                meta: to.meta || {},
            };
            router.history.push(path);
            return Promise.resolve();
        }),

        replace: createMockFn((to) => {
            const path = typeof to === 'string' ? to : to.path;
            router.currentRoute = {
                path,
                query: to.query || {},
                params: to.params || {},
                name: to.name || null,
                meta: to.meta || {},
            };
            router.history[router.history.length - 1] = path;
            return Promise.resolve();
        }),

        go: createMockFn((delta) => {
            // Simplified implementation
            const newIndex = Math.max(0, router.history.length - 1 + delta);
            router.currentRoute.path = router.history[newIndex];
        }),

        back: createMockFn(() => {
            router.go(-1);
        }),

        forward: createMockFn(() => {
            router.go(1);
        }),

        beforeEach: createMockFn(),
        afterEach: createMockFn(),
        onError: createMockFn(),
    };

    return router;
}

/**
 * Mock Store
 */
export function createMockStore(options = {}) {
    const {
        state = {},
        getters = {},
        mutations = {},
        actions = {},
        modules = {},
    } = options;

    const store = {
        state: { ...state },
        getters: {},
        _mutations: { ...mutations },
        _actions: { ...actions },
        _modules: { ...modules },
        _subscribers: [],

        commit: createMockFn((type, payload) => {
            if (store._mutations[type]) {
                store._mutations[type](store.state, payload);
                store._subscribers.forEach(sub => sub({ type, payload }, store.state));
            }
        }),

        dispatch: createMockFn((type, payload) => {
            if (store._actions[type]) {
                return Promise.resolve(store._actions[type]({
                    state: store.state,
                    commit: store.commit,
                    dispatch: store.dispatch,
                    getters: store.getters,
                }, payload));
            }
            return Promise.resolve();
        }),

        subscribe: createMockFn((fn) => {
            store._subscribers.push(fn);
            return () => {
                const index = store._subscribers.indexOf(fn);
                if (index > -1) {
                    store._subscribers.splice(index, 1);
                }
            };
        }),

        replaceState: createMockFn((newState) => {
            store.state = { ...newState };
        }),
    };

    // Setup getters
    Object.keys(getters).forEach(key => {
        Object.defineProperty(store.getters, key, {
            get: () => getters[key](store.state, store.getters),
            enumerable: true,
        });
    });

    return store;
}

/**
 * Mock API calls
 */
export function createMockAPI() {
    const responses = new Map();
    const calls = [];

    const api = {
        get: createMockFn((url, config) => {
            calls.push({ method: 'GET', url, config });
            return Promise.resolve(responses.get(`GET:${url}`) || { data: {} });
        }),

        post: createMockFn((url, data, config) => {
            calls.push({ method: 'POST', url, data, config });
            return Promise.resolve(responses.get(`POST:${url}`) || { data: {} });
        }),

        put: createMockFn((url, data, config) => {
            calls.push({ method: 'PUT', url, data, config });
            return Promise.resolve(responses.get(`PUT:${url}`) || { data: {} });
        }),

        delete: createMockFn((url, config) => {
            calls.push({ method: 'DELETE', url, config });
            return Promise.resolve(responses.get(`DELETE:${url}`) || { data: {} });
        }),

        mockResponse: (method, url, response) => {
            responses.set(`${method}:${url}`, response);
        },

        getCalls: () => [...calls],

        clearCalls: () => {
            calls.length = 0;
        },
    };

    return api;
}

/**
 * Mock LocalStorage
 */
export function createMockStorage() {
    const storage = new Map();

    return {
        getItem: createMockFn((key) => {
            return storage.get(key) || null;
        }),

        setItem: createMockFn((key, value) => {
            storage.set(key, String(value));
        }),

        removeItem: createMockFn((key) => {
            storage.delete(key);
        }),

        clear: createMockFn(() => {
            storage.clear();
        }),

        get length() {
            return storage.size;
        },

        key: createMockFn((index) => {
            return Array.from(storage.keys())[index] || null;
        }),
    };
}

/**
 * Mock timers
 */
export function useFakeTimers() {
    const timers = [];
    let now = Date.now();

    const originalSetTimeout = global.setTimeout;
    const originalSetInterval = global.setInterval;
    const originalClearTimeout = global.clearTimeout;
    const originalClearInterval = global.clearInterval;
    const originalDateNow = Date.now;

    global.setTimeout = (fn, delay, ...args) => {
        const id = timers.length;
        timers.push({
            id,
            type: 'timeout',
            fn,
            delay,
            args,
            time: now + delay,
        });
        return id;
    };

    global.setInterval = (fn, delay, ...args) => {
        const id = timers.length;
        timers.push({
            id,
            type: 'interval',
            fn,
            delay,
            args,
            time: now + delay,
        });
        return id;
    };

    global.clearTimeout = (id) => {
        const index = timers.findIndex(t => t.id === id);
        if (index > -1) {
            timers.splice(index, 1);
        }
    };

    global.clearInterval = global.clearTimeout;

    Date.now = () => now;

    return {
        tick: (ms) => {
            now += ms;
            const toRun = timers.filter(t => t.time <= now);

            toRun.forEach(timer => {
                timer.fn(...timer.args);

                if (timer.type === 'interval') {
                    timer.time = now + timer.delay;
                } else {
                    const index = timers.indexOf(timer);
                    if (index > -1) {
                        timers.splice(index, 1);
                    }
                }
            });
        },

        runAll: () => {
            while (timers.length > 0) {
                const next = timers.reduce((a, b) => a.time < b.time ? a : b);
                now = next.time;
                next.fn(...next.args);

                if (next.type === 'timeout') {
                    const index = timers.indexOf(next);
                    if (index > -1) {
                        timers.splice(index, 1);
                    }
                } else {
                    next.time = now + next.delay;
                }
            }
        },

        restore: () => {
            global.setTimeout = originalSetTimeout;
            global.setInterval = originalSetInterval;
            global.clearTimeout = originalClearTimeout;
            global.clearInterval = originalClearInterval;
            Date.now = originalDateNow;
        },
    };
}