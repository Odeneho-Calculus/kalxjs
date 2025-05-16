/**
 * @jest-environment jsdom
 */
import {
    version,
    debounce,
    throttle,
    once,
    memoize,
    negate
} from '@kalxjs/utils';

describe('@kalxjs/utils', () => {
    beforeEach(() => {
        // Mock setTimeout and clearTimeout
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should export version', () => {
        expect(version).toBeDefined();
        expect(typeof version).toBe('string');
    });

    describe('function utilities', () => {
        describe('debounce', () => {
            test('should delay function execution', () => {
                // Setup
                const fn = jest.fn();
                const debouncedFn = debounce(fn, 500);

                // Test
                debouncedFn('arg1', 'arg2');

                // Function should not be called immediately
                expect(fn).not.toHaveBeenCalled();

                // Advance time but not enough
                jest.advanceTimersByTime(300);
                expect(fn).not.toHaveBeenCalled();

                // Advance time to trigger call
                jest.advanceTimersByTime(200);
                expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
            });

            test('should reset timer on subsequent calls', () => {
                // Setup
                const fn = jest.fn();
                const debouncedFn = debounce(fn, 500);

                // Test
                debouncedFn('first call');

                // Advance time but not enough
                jest.advanceTimersByTime(300);

                // Call again
                debouncedFn('second call');

                // Advance time but not enough for second call
                jest.advanceTimersByTime(300);
                expect(fn).not.toHaveBeenCalled();

                // Advance time to trigger second call
                jest.advanceTimersByTime(200);
                expect(fn).toHaveBeenCalledTimes(1);
                expect(fn).toHaveBeenCalledWith('second call');
            });

            test('should execute immediately with immediate flag', () => {
                // Setup
                const fn = jest.fn();
                const debouncedFn = debounce(fn, 500, true);

                // Test
                debouncedFn('immediate');

                // Function should be called immediately
                expect(fn).toHaveBeenCalledWith('immediate');

                // Call again immediately
                debouncedFn('second immediate');

                // Should not call again immediately
                expect(fn).toHaveBeenCalledTimes(1);

                // Advance time past debounce period
                jest.advanceTimersByTime(600);

                // Call again
                debouncedFn('after wait');

                // Should call again
                expect(fn).toHaveBeenCalledTimes(2);
                expect(fn).toHaveBeenLastCalledWith('after wait');
            });
        });

        describe('throttle', () => {
            test('should limit function execution frequency', () => {
                // Setup
                const fn = jest.fn();
                const throttledFn = throttle(fn, 500);

                // Mock Date.now to control time precisely
                const originalDateNow = Date.now;
                let currentTime = 0;
                Date.now = jest.fn(() => currentTime);

                // Test - first call should execute immediately
                throttledFn('first');
                expect(fn).toHaveBeenCalledWith('first');

                // Reset mock to track new calls
                fn.mockClear();

                // Advance time a bit
                currentTime = 100;

                // Call again - this should be throttled
                throttledFn('second');

                // Check if the function was called at all
                expect(fn).not.toHaveBeenCalled();

                // Advance time but not enough
                currentTime = 300;
                throttledFn('third');
                expect(fn).not.toHaveBeenCalled();

                // Advance time to pass throttle limit
                currentTime = 501;
                throttledFn('fourth');
                
                // Run any pending timers
                jest.runAllTimers();
                
                // Now the function should have been called with the latest args
                expect(fn).toHaveBeenCalledWith('fourth');

                // Restore Date.now
                Date.now = originalDateNow;
            });

            test('should respect leading option', () => {
                // Setup
                const fn = jest.fn();
                const throttledFn = throttle(fn, 500, { leading: false });

                // Mock Date.now
                const originalDateNow = Date.now;
                let currentTime = 0;
                Date.now = jest.fn(() => currentTime);

                // Test - first call should NOT execute immediately with leading: false
                throttledFn('first');
                expect(fn).not.toHaveBeenCalled();

                // Advance time past throttle limit
                currentTime = 501;

                // This should trigger the execution
                jest.runAllTimers();
                expect(fn).toHaveBeenCalledWith('first');

                // Restore Date.now
                Date.now = originalDateNow;
            });

            test('should respect trailing option', () => {
                // Setup
                const fn = jest.fn();
                const throttledFn = throttle(fn, 500, { trailing: false });

                // Mock Date.now
                const originalDateNow = Date.now;
                let currentTime = 0;
                Date.now = jest.fn(() => currentTime);

                // Test - first call should execute immediately
                throttledFn('first');
                expect(fn).toHaveBeenCalledWith('first');

                // Reset mock
                fn.mockClear();

                // Call during throttle period
                currentTime = 100;
                throttledFn('second');

                // Check if the function was called at all
                expect(fn).not.toHaveBeenCalled();

                // Advance time past throttle limit
                currentTime = 501;

                // With trailing: false, no additional calls should happen
                jest.runAllTimers();

                // Restore Date.now
                Date.now = originalDateNow;
            });
        });

        describe('once', () => {
            test('should execute function only once', () => {
                // Setup
                const fn = jest.fn().mockReturnValue('result');
                const onceFn = once(fn);

                // Test
                const result1 = onceFn('arg1', 'arg2');
                const result2 = onceFn('different', 'args');
                const result3 = onceFn();

                // Assert
                expect(fn).toHaveBeenCalledTimes(1);
                expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
                expect(result1).toBe('result');
                expect(result2).toBe('result');
                expect(result3).toBe('result');
            });

            test('should preserve this context', () => {
                // Setup
                const obj = {
                    value: 42,
                    method: function () {
                        return this.value;
                    }
                };

                obj.onceMethod = once(obj.method);

                // Test
                const result1 = obj.onceMethod();
                const result2 = obj.onceMethod();

                // Assert
                expect(result1).toBe(42);
                expect(result2).toBe(42);
            });
        });

        describe('memoize', () => {
            test('should cache function results', () => {
                // Setup
                const fn = jest.fn(x => x * 2);
                const memoizedFn = memoize(fn);

                // Test
                const result1 = memoizedFn(5);
                expect(result1).toBe(10);
                expect(fn).toHaveBeenCalledTimes(1);

                // Call again with same argument
                const result2 = memoizedFn(5);
                expect(result2).toBe(10);

                // Should use cached result
                expect(fn).toHaveBeenCalledTimes(1);

                // Call with different argument
                const result3 = memoizedFn(10);
                expect(result3).toBe(20);
                expect(fn).toHaveBeenCalledTimes(2);
            });

            test('should use custom resolver', () => {
                // Setup
                const fn = jest.fn((a, b) => a + b);
                const resolver = jest.fn((a, b) => `${a}-${b}`);
                const memoizedFn = memoize(fn, resolver);

                // Test
                memoizedFn(1, 2);
                expect(resolver).toHaveBeenCalledWith(1, 2);

                // Reset mocks
                fn.mockClear();
                resolver.mockClear();

                // Call again with same arguments
                memoizedFn(1, 2);
                expect(resolver).toHaveBeenCalledWith(1, 2);
                expect(fn).not.toHaveBeenCalled(); // Should use cached result

                // Call with different arguments
                memoizedFn(2, 3);
                expect(fn).toHaveBeenCalledWith(2, 3);
            });

            test('should use first argument as key by default', () => {
                // Setup
                const fn = jest.fn((a, b) => a + b);
                const memoizedFn = memoize(fn);

                // Test
                memoizedFn(1, 2);
                fn.mockClear();

                // Same first argument, different second argument
                memoizedFn(1, 3);

                // Should use cached result despite different second argument
                expect(fn).not.toHaveBeenCalled();
            });
        });

        describe('negate', () => {
            test('should negate predicate result', () => {
                // Setup
                const isEven = x => x % 2 === 0;
                const isOdd = negate(isEven);

                // Test
                expect(isOdd(1)).toBe(true);
                expect(isOdd(2)).toBe(false);
                expect(isOdd(3)).toBe(true);
                expect(isOdd(4)).toBe(false);
            });

            test('should preserve this context and arguments', () => {
                // Setup
                const obj = {
                    threshold: 10,
                    isAboveThreshold: function (value) {
                        return value > this.threshold;
                    }
                };

                obj.isBelowOrEqualThreshold = negate(obj.isAboveThreshold);

                // Test
                expect(obj.isBelowOrEqualThreshold(5)).toBe(true);
                expect(obj.isBelowOrEqualThreshold(15)).toBe(false);
            });
        });
    });

    // Additional tests for other utility modules would go here
    // For brevity, we're focusing on function utilities in this example
});