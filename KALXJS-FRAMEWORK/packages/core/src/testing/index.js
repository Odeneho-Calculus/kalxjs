// @kalxjs/core - Built-in testing framework

/**
 * Test suite types
 */
export const TEST_TYPES = {
    UNIT: 'unit',
    COMPONENT: 'component',
    E2E: 'e2e',
    INTEGRATION: 'integration',
    PERFORMANCE: 'performance'
};

// Export enhanced testing utilities
export * from './component-testing.js';
export * from './mocks.js';
export * from './user-events.js';
export * from './async-utilities.js';
export * from './snapshot.js';
export * from './test-presets.js';

/**
 * Creates a test suite
 * @param {string} name - Test suite name
 * @param {Function} fn - Test suite function
 * @returns {Object} Test suite
 */
export function describe(name, fn) {
    const suite = {
        name,
        tests: [],
        beforeEach: null,
        afterEach: null,
        beforeAll: null,
        afterAll: null
    };

    const context = {
        test: (testName, testFn) => {
            suite.tests.push({
                name: testName,
                fn: testFn,
                skip: false,
                only: false
            });

            return context;
        },

        it: (testName, testFn) => context.test(testName, testFn),

        beforeEach: (fn) => {
            suite.beforeEach = fn;
            return context;
        },

        afterEach: (fn) => {
            suite.afterEach = fn;
            return context;
        },

        beforeAll: (fn) => {
            suite.beforeAll = fn;
            return context;
        },

        afterAll: (fn) => {
            suite.afterAll = fn;
            return context;
        },

        skip: (testName, testFn) => {
            suite.tests.push({
                name: testName,
                fn: testFn,
                skip: true,
                only: false
            });

            return context;
        },

        only: (testName, testFn) => {
            suite.tests.push({
                name: testName,
                fn: testFn,
                skip: false,
                only: true
            });

            return context;
        }
    };

    // Aliases
    context.it.skip = context.skip;
    context.it.only = context.only;

    // Execute the suite function
    fn(context);

    return suite;
}

/**
 * Creates a test
 * @param {string} name - Test name
 * @param {Function} fn - Test function
 * @returns {Object} Test
 */
export function test(name, fn) {
    return {
        name,
        fn,
        skip: false,
        only: false
    };
}

/**
 * Alias for test
 */
export const it = test;

/**
 * Creates a skipped test
 * @param {string} name - Test name
 * @param {Function} fn - Test function
 * @returns {Object} Test
 */
export function skip(name, fn) {
    return {
        name,
        fn,
        skip: true,
        only: false
    };
}

/**
 * Creates a test that will be run exclusively
 * @param {string} name - Test name
 * @param {Function} fn - Test function
 * @returns {Object} Test
 */
export function only(name, fn) {
    return {
        name,
        fn,
        skip: false,
        only: true
    };
}

// Add skip and only to test and it
test.skip = skip;
test.only = only;
it.skip = skip;
it.only = only;

/**
 * Creates a test runner
 * @param {Object} options - Test runner options
 * @returns {Object} Test runner
 */
export function createTestRunner(options = {}) {
    const {
        reporter = 'console',
        timeout = 5000,
        bail = false,
        grep = null,
        verbose = false
    } = options;

    // Test suites
    const suites = [];

    // Test results
    const results = {
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0,
        duration: 0,
        suites: []
    };

    /**
     * Adds a test suite
     * @param {Object} suite - Test suite
     */
    const addSuite = (suite) => {
        suites.push(suite);
    };

    /**
     * Runs all test suites
     * @returns {Promise} Test results
     */
    const runAll = async () => {
        const startTime = Date.now();

        // Check if any tests are marked as "only"
        const hasOnly = suites.some(suite =>
            suite.tests.some(test => test.only)
        );

        // Run each suite
        for (const suite of suites) {
            const suiteResult = {
                name: suite.name,
                passed: 0,
                failed: 0,
                skipped: 0,
                total: suite.tests.length,
                duration: 0,
                tests: []
            };

            // Run beforeAll hook
            if (suite.beforeAll) {
                try {
                    await suite.beforeAll();
                } catch (error) {
                    console.error(`Error in beforeAll hook for suite "${suite.name}":`, error);

                    // Mark all tests as failed
                    for (const test of suite.tests) {
                        suiteResult.tests.push({
                            name: test.name,
                            status: 'failed',
                            error: new Error(`beforeAll hook failed: ${error.message}`),
                            duration: 0
                        });

                        suiteResult.failed++;
                    }

                    results.suites.push(suiteResult);
                    continue;
                }
            }

            // Run each test
            for (const test of suite.tests) {
                // Skip tests if not matching grep pattern
                if (grep && !test.name.match(grep)) {
                    suiteResult.tests.push({
                        name: test.name,
                        status: 'skipped',
                        duration: 0
                    });

                    suiteResult.skipped++;
                    continue;
                }

                // Skip tests if marked as skip or if other tests are marked as only
                if (test.skip || (hasOnly && !test.only)) {
                    suiteResult.tests.push({
                        name: test.name,
                        status: 'skipped',
                        duration: 0
                    });

                    suiteResult.skipped++;
                    continue;
                }

                // Run the test
                const testResult = {
                    name: test.name,
                    status: 'passed',
                    duration: 0
                };

                const testStartTime = Date.now();

                try {
                    // Run beforeEach hook
                    if (suite.beforeEach) {
                        await suite.beforeEach();
                    }

                    // Run the test with timeout
                    await Promise.race([
                        test.fn(),
                        new Promise((_, reject) => {
                            setTimeout(() => {
                                reject(new Error(`Test timed out after ${timeout}ms`));
                            }, timeout);
                        })
                    ]);

                    // Run afterEach hook
                    if (suite.afterEach) {
                        await suite.afterEach();
                    }

                    testResult.status = 'passed';
                    suiteResult.passed++;
                } catch (error) {
                    testResult.status = 'failed';
                    testResult.error = error;
                    suiteResult.failed++;

                    // Bail if configured
                    if (bail) {
                        break;
                    }
                }

                testResult.duration = Date.now() - testStartTime;
                suiteResult.tests.push(testResult);
            }

            // Run afterAll hook
            if (suite.afterAll) {
                try {
                    await suite.afterAll();
                } catch (error) {
                    console.error(`Error in afterAll hook for suite "${suite.name}":`, error);
                }
            }

            suiteResult.duration = Date.now() - startTime;
            results.suites.push(suiteResult);
        }

        // Update overall results
        results.passed = results.suites.reduce((sum, suite) => sum + suite.passed, 0);
        results.failed = results.suites.reduce((sum, suite) => sum + suite.failed, 0);
        results.skipped = results.suites.reduce((sum, suite) => sum + suite.skipped, 0);
        results.total = results.passed + results.failed + results.skipped;
        results.duration = Date.now() - startTime;

        // Report results
        reportResults(results);

        return results;
    };

    /**
     * Reports test results
     * @param {Object} results - Test results
     */
    const reportResults = (results) => {
        switch (reporter) {
            case 'console':
                reportToConsole(results);
                break;

            case 'json':
                reportToJSON(results);
                break;

            default:
                if (typeof reporter === 'function') {
                    reporter(results);
                } else {
                    reportToConsole(results);
                }
        }
    };

    /**
     * Reports test results to the console
     * @param {Object} results - Test results
     */
    const reportToConsole = (results) => {
        console.log('\n=== Test Results ===');
        console.log(`Total: ${results.total}, Passed: ${results.passed}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
        console.log(`Duration: ${results.duration}ms`);

        if (verbose || results.failed > 0) {
            console.log('\n=== Test Details ===');

            for (const suite of results.suites) {
                console.log(`\nSuite: ${suite.name}`);
                console.log(`  Passed: ${suite.passed}, Failed: ${suite.failed}, Skipped: ${suite.skipped}`);

                for (const test of suite.tests) {
                    const icon = test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '-';
                    console.log(`  ${icon} ${test.name} (${test.duration}ms)`);

                    if (test.status === 'failed' && test.error) {
                        console.error(`    Error: ${test.error.message}`);
                        if (test.error.stack) {
                            console.error(`    Stack: ${test.error.stack.split('\n').slice(1).join('\n      ')}`);
                        }
                    }
                }
            }
        }

        console.log('\n=== End of Test Results ===\n');
    };

    /**
     * Reports test results as JSON
     * @param {Object} results - Test results
     */
    const reportToJSON = (results) => {
        console.log(JSON.stringify(results, null, 2));
    };

    return {
        describe: (name, fn) => {
            const suite = describe(name, fn);
            addSuite(suite);
            return suite;
        },

        test,
        it,
        skip,
        only,

        run: runAll
    };
}

/**
 * Creates a component test utility
 * @param {Object} options - Component test options
 * @returns {Object} Component test utility
 */
export function createComponentTest(options = {}) {
    const {
        plugins = [],
        global = {},
        mocks = {}
    } = options;

    /**
     * Mounts a component for testing
     * @param {Object} component - Component to mount
     * @param {Object} options - Mount options
     * @returns {Object} Mounted component
     */
    const mount = (component, options = {}) => {
        const {
            props = {},
            slots = {},
            attrs = {},
            listeners = {},
            provide = {},
            shallow = false
        } = options;

        // Create a test app
        const app = createApp({
            render() {
                return h(component, {
                    ...props,
                    ...attrs,
                    ...Object.entries(listeners).reduce((acc, [event, handler]) => {
                        acc[`on${event.charAt(0).toUpperCase() + event.slice(1)}`] = handler;
                        return acc;
                    }, {})
                }, slots);
            }
        });

        // Apply plugins
        plugins.forEach(plugin => {
            if (Array.isArray(plugin)) {
                app.use(plugin[0], plugin[1]);
            } else {
                app.use(plugin);
            }
        });

        // Apply global mocks
        Object.entries(global).forEach(([key, value]) => {
            app.config.globalProperties[key] = value;
        });

        // Apply provide values
        Object.entries(provide).forEach(([key, value]) => {
            app.provide(key, value);
        });

        // Create a container
        const container = document.createElement('div');
        document.body.appendChild(container);

        // Mount the app
        app.mount(container);

        // Create wrapper with testing utilities
        const wrapper = {
            app,
            container,
            component,

            // Find elements
            find: (selector) => container.querySelector(selector),
            findAll: (selector) => container.querySelectorAll(selector),

            // Get text content
            text: () => container.textContent,

            // Get HTML content
            html: () => container.innerHTML,

            // Check if element exists
            exists: (selector) => !!container.querySelector(selector),

            // Trigger events
            trigger: async (selector, event, options = {}) => {
                const element = typeof selector === 'string' ? container.querySelector(selector) : selector;

                if (!element) {
                    throw new Error(`Element not found: ${selector}`);
                }

                const eventObj = new Event(event, {
                    bubbles: true,
                    cancelable: true,
                    ...options
                });

                element.dispatchEvent(eventObj);

                // Wait for the next tick
                await nextTick();

                return wrapper;
            },

            // Set input value
            setValue: async (selector, value) => {
                const element = typeof selector === 'string' ? container.querySelector(selector) : selector;

                if (!element) {
                    throw new Error(`Element not found: ${selector}`);
                }

                if (element.tagName === 'SELECT') {
                    element.value = value;
                    await wrapper.trigger(element, 'change');
                } else if (element.tagName === 'INPUT') {
                    if (element.type === 'checkbox') {
                        element.checked = value;
                        await wrapper.trigger(element, 'change');
                    } else if (element.type === 'radio') {
                        element.checked = value;
                        await wrapper.trigger(element, 'change');
                    } else {
                        element.value = value;
                        await wrapper.trigger(element, 'input');
                    }
                } else if (element.tagName === 'TEXTAREA') {
                    element.value = value;
                    await wrapper.trigger(element, 'input');
                }

                return wrapper;
            },

            // Unmount the component
            unmount: () => {
                app.unmount();
                container.remove();
            }
        };

        return wrapper;
    };

    /**
     * Shallowly mounts a component for testing
     * @param {Object} component - Component to mount
     * @param {Object} options - Mount options
     * @returns {Object} Mounted component
     */
    const shallowMount = (component, options = {}) => {
        return mount(component, { ...options, shallow: true });
    };

    return {
        mount,
        shallowMount
    };
}

/**
 * Creates assertions for testing
 * @returns {Object} Assertions
 */
export function createAssertions() {
    /**
     * Asserts that a condition is true
     * @param {boolean} condition - Condition to check
     * @param {string} message - Error message
     */
    const assert = (condition, message = 'Assertion failed') => {
        if (!condition) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that two values are equal
     * @param {any} actual - Actual value
     * @param {any} expected - Expected value
     * @param {string} message - Error message
     */
    const assertEqual = (actual, expected, message = 'Values are not equal') => {
        if (actual !== expected) {
            throw new Error(`${message}: ${actual} !== ${expected}`);
        }
    };

    /**
     * Asserts that two values are not equal
     * @param {any} actual - Actual value
     * @param {any} expected - Expected value
     * @param {string} message - Error message
     */
    const assertNotEqual = (actual, expected, message = 'Values are equal') => {
        if (actual === expected) {
            throw new Error(`${message}: ${actual} === ${expected}`);
        }
    };

    /**
     * Asserts that a value is truthy
     * @param {any} value - Value to check
     * @param {string} message - Error message
     */
    const assertTruthy = (value, message = 'Value is not truthy') => {
        if (!value) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that a value is falsy
     * @param {any} value - Value to check
     * @param {string} message - Error message
     */
    const assertFalsy = (value, message = 'Value is not falsy') => {
        if (value) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that a value is null
     * @param {any} value - Value to check
     * @param {string} message - Error message
     */
    const assertNull = (value, message = 'Value is not null') => {
        if (value !== null) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that a value is not null
     * @param {any} value - Value to check
     * @param {string} message - Error message
     */
    const assertNotNull = (value, message = 'Value is null') => {
        if (value === null) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that a value is undefined
     * @param {any} value - Value to check
     * @param {string} message - Error message
     */
    const assertUndefined = (value, message = 'Value is not undefined') => {
        if (value !== undefined) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that a value is not undefined
     * @param {any} value - Value to check
     * @param {string} message - Error message
     */
    const assertDefined = (value, message = 'Value is undefined') => {
        if (value === undefined) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that a value is an instance of a class
     * @param {any} value - Value to check
     * @param {Function} constructor - Constructor to check against
     * @param {string} message - Error message
     */
    const assertInstanceOf = (value, constructor, message = 'Value is not an instance of the expected constructor') => {
        if (!(value instanceof constructor)) {
            throw new Error(message);
        }
    };

    /**
     * Asserts that a function throws an error
     * @param {Function} fn - Function to check
     * @param {RegExp|string|Function} expected - Expected error
     * @param {string} message - Error message
     */
    const assertThrows = (fn, expected, message = 'Function did not throw an error') => {
        try {
            fn();
            throw new Error(message);
        } catch (error) {
            if (expected instanceof RegExp) {
                if (!expected.test(error.message)) {
                    throw new Error(`${message}: ${error.message} does not match ${expected}`);
                }
            } else if (typeof expected === 'function') {
                if (!(error instanceof expected)) {
                    throw new Error(`${message}: ${error.constructor.name} is not an instance of ${expected.name}`);
                }
            } else if (typeof expected === 'string') {
                if (error.message !== expected) {
                    throw new Error(`${message}: ${error.message} !== ${expected}`);
                }
            }
        }
    };

    /**
     * Asserts that a function does not throw an error
     * @param {Function} fn - Function to check
     * @param {string} message - Error message
     */
    const assertDoesNotThrow = (fn, message = 'Function threw an error') => {
        try {
            fn();
        } catch (error) {
            throw new Error(`${message}: ${error.message}`);
        }
    };

    /**
     * Asserts that a value is close to another value
     * @param {number} actual - Actual value
     * @param {number} expected - Expected value
     * @param {number} delta - Maximum difference
     * @param {string} message - Error message
     */
    const assertCloseTo = (actual, expected, delta = 0.001, message = 'Values are not close') => {
        if (Math.abs(actual - expected) > delta) {
            throw new Error(`${message}: ${actual} is not close to ${expected} (delta: ${delta})`);
        }
    };

    return {
        assert,
        assertEqual,
        assertNotEqual,
        assertTruthy,
        assertFalsy,
        assertNull,
        assertNotNull,
        assertUndefined,
        assertDefined,
        assertInstanceOf,
        assertThrows,
        assertDoesNotThrow,
        assertCloseTo
    };
}

/**
 * Creates a testing plugin for KalxJS
 * @param {Object} options - Testing plugin options
 * @returns {Object} Testing plugin
 */
export function createTestingPlugin(options = {}) {
    return {
        name: 'testing',
        install(app) {
            // Create test runner
            const testRunner = createTestRunner(options);

            // Create component test utility
            const componentTest = createComponentTest({
                plugins: options.plugins || []
            });

            // Create assertions
            const assertions = createAssertions();

            // Add testing utilities to the app
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};
            app.config.globalProperties.$testing = {
                testRunner,
                componentTest,
                assertions
            };

            // Add testing utilities to the window
            if (typeof window !== 'undefined') {
                window.$kalxjs = window.$kalxjs || {};
                window.$kalxjs.testing = {
                    testRunner,
                    componentTest,
                    assertions
                };
            }
        }
    };
}