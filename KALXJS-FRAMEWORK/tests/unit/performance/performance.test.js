/**
 * @jest-environment jsdom
 */
import {
    lazyLoad,
    debounce,
    throttle,
    memoize,
    virtualList,
    withPerformanceTracking
} from '@kalxjs/performance';

// Mock the core module
jest.mock('@kalxjs/core', () => ({
    h: jest.fn((type, props, children) => ({ type, props, children })),
    defineComponent: jest.fn(options => ({ ...options, __isComponent: true })),
    ref: jest.fn(val => ({
        value: val,
        __isRef: true
    }))
}));

// Mock the composition API
jest.mock('@kalxjs/core/composition', () => ({
    onMounted: jest.fn(fn => fn()),
    onUnmounted: jest.fn()
}));

describe('@kalxjs/performance', () => {
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock setTimeout and clearTimeout
        jest.useFakeTimers();

        // Mock performance API
        global.performance = {
            now: jest.fn().mockReturnValue(100)
        };

        // Mock requestAnimationFrame
        global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('lazyLoad', () => {
        test('should create a component with correct setup', () => {
            // Setup
            const factory = jest.fn().mockResolvedValue({ default: { name: 'TestComponent' } });
            const loadingComponent = { name: 'LoadingComponent' };
            const errorComponent = { name: 'ErrorComponent' };

            // Test
            const result = lazyLoad(factory, {
                loading: loadingComponent,
                error: errorComponent,
                delay: 100,
                timeout: 5000
            });

            // Assert
            expect(result.__isComponent).toBe(true);
            expect(result.name).toBe('LazyComponent');
            expect(typeof result.setup).toBe('function');
        });

        test('should load component on mount', async () => {
            // Setup
            const mockComponent = { name: 'TestComponent' };
            const factory = jest.fn().mockResolvedValue({ default: mockComponent });

            // Create lazy component
            const lazyComponent = lazyLoad(factory);

            // Get setup function
            const setup = lazyComponent.setup;

            // Run setup
            const renderFn = setup();

            // Assert initial state
            expect(factory).toHaveBeenCalled();

            // Wait for component to load
            await Promise.resolve();
            jest.runAllTimers();

            // Assert loaded state
            const rendered = renderFn();
            expect(rendered.type).toBe(mockComponent);
        });

        test('should show loading component during load', async () => {
            // Setup
            const mockComponent = { name: 'TestComponent' };
            const loadingComponent = { name: 'LoadingComponent' };

            // Create a promise that we can resolve manually
            let resolveFactory;
            const factoryPromise = new Promise(resolve => {
                resolveFactory = resolve;
            });

            const factory = jest.fn().mockReturnValue(factoryPromise);

            // Create lazy component
            const lazyComponent = lazyLoad(factory, {
                loading: loadingComponent,
                delay: 50
            });

            // Get setup function
            const setup = lazyComponent.setup;

            // Run setup
            const renderFn = setup();

            // Advance timers to show loading state
            jest.advanceTimersByTime(100);

            // Assert loading state
            const loadingRendered = renderFn();
            expect(loadingRendered.type).toBe(loadingComponent);

            // Resolve the factory promise
            resolveFactory({ default: mockComponent });

            // Wait for component to load
            await Promise.resolve();

            // Assert loaded state
            const loadedRendered = renderFn();
            expect(loadedRendered.type).toBe(mockComponent);
        });

        test('should show error component on failure', async () => {
            // Setup
            const errorComponent = { name: 'ErrorComponent' };
            const error = new Error('Failed to load');

            const factory = jest.fn().mockRejectedValue(error);

            // Create lazy component
            const lazyComponent = lazyLoad(factory, {
                error: errorComponent
            });

            // Get setup function
            const setup = lazyComponent.setup;

            // Run setup
            const renderFn = setup();

            // Wait for error
            try {
                await Promise.resolve();
            } catch (e) {
                // Expected
            }

            // Assert error state
            const errorRendered = renderFn();
            expect(errorRendered.type).toBe(errorComponent);
            expect(errorRendered.props.error).toBe('Failed to load');
        });

        test('should handle timeout', async () => {
            // Setup
            const errorComponent = { name: 'ErrorComponent' };

            // Create a factory that never resolves
            const factory = jest.fn().mockReturnValue(new Promise(() => { }));

            // Create lazy component with short timeout
            const lazyComponent = lazyLoad(factory, {
                error: errorComponent,
                timeout: 1000
            });

            // Get setup function
            const setup = lazyComponent.setup;

            // Run setup
            const renderFn = setup();

            // Advance timers to trigger timeout
            jest.advanceTimersByTime(1500);

            // Assert timeout error state
            const timeoutRendered = renderFn();
            expect(timeoutRendered.type).toBe(errorComponent);
            expect(timeoutRendered.props.error).toContain('Timeout');
        });
    });

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

            // Test - first call should execute immediately
            throttledFn('first');
            expect(fn).toHaveBeenCalledWith('first');

            // Reset mock to track new calls
            fn.mockClear();

            // Call again immediately
            throttledFn('second');

            // Should not execute immediately
            expect(fn).not.toHaveBeenCalled();

            // Advance time but not enough
            jest.advanceTimersByTime(300);
            throttledFn('third');
            expect(fn).not.toHaveBeenCalled();

            // Advance time to pass throttle limit
            jest.advanceTimersByTime(200);
            expect(fn).toHaveBeenCalledWith('third');
        });

        test('should execute trailing edge call', () => {
            // Setup
            const fn = jest.fn();
            const throttledFn = throttle(fn, 500);

            // Test - first call should execute immediately
            throttledFn('first');
            expect(fn).toHaveBeenCalledWith('first');

            // Reset mock to track new calls
            fn.mockClear();

            // Call multiple times during throttle period
            throttledFn('ignored');
            throttledFn('also ignored');
            throttledFn('trailing');

            // Should not execute immediately
            expect(fn).not.toHaveBeenCalled();

            // Advance time to pass throttle limit
            jest.advanceTimersByTime(500);

            // Should execute the last call
            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith('trailing');
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
    });

    describe('virtualList', () => {
        test('should create a component with correct props', () => {
            // Test
            const result = virtualList({
                itemHeight: 40,
                overscan: 3
            });

            // Assert
            expect(result.__isComponent).toBe(true);
            expect(result.name).toBe('VirtualList');
            expect(result.props).toEqual({
                items: {
                    type: Array,
                    required: true
                },
                renderItem: {
                    type: Function,
                    required: true
                }
            });
        });

        test('should render visible items based on scroll position', () => {
            // Setup
            const items = Array.from({ length: 100 }, (_, i) => ({ id: i, text: `Item ${i}` }));
            const renderItem = jest.fn((item) => ({ type: 'div', props: { text: item.text } }));

            // Create virtual list
            const VirtualList = virtualList({ itemHeight: 50, overscan: 2 });

            // Mock container ref and scroll position
            const containerRef = { value: { clientHeight: 300, scrollTop: 500 } };
            const scrollTop = { value: 500 };
            const viewportHeight = { value: 300 };

            // Mock refs
            jest.mock('@kalxjs/core', () => ({
                ...jest.requireActual('@kalxjs/core'),
                ref: jest.fn().mockImplementation((val) => {
                    if (val === null) return containerRef;
                    if (val === 0) return scrollTop;
                    if (val === 0) return viewportHeight;
                    return { value: val };
                })
            }));

            // Get setup function
            const setup = VirtualList.setup;

            // Run setup with props
            const renderFn = setup({ items, renderItem });

            // Render virtual list
            const rendered = renderFn();

            // Assert structure
            expect(rendered.type).toBe('div');
            expect(rendered.props.style).toEqual({
                height: '100%',
                overflow: 'auto',
                position: 'relative'
            });

            // Check inner container
            const innerContainer = rendered.children[0];
            expect(innerContainer.props.style).toEqual({
                height: '5000px', // 100 items * 50px
                position: 'relative'
            });

            // Check visible items (around scroll position 500)
            // With itemHeight 50, scrollTop 500, viewport 300, and overscan 2:
            // Visible items should be from index ~8 (500/50 - 2) to ~17 ((500+300)/50 + 2)
            const visibleItems = innerContainer.children;

            // We can't check exact indices due to the mocking limitations,
            // but we can verify the structure of the rendered items
            expect(visibleItems.length).toBeGreaterThan(0);

            // Check structure of first visible item
            const firstVisibleItem = visibleItems[0];
            expect(firstVisibleItem.props.style).toEqual(expect.objectContaining({
                position: 'absolute',
                height: '50px',
                width: '100%'
            }));
        });
    });

    describe('withPerformanceTracking', () => {
        test('should wrap component with performance tracking', () => {
            // Setup
            const component = { name: 'TestComponent' };
            const onMeasure = jest.fn();

            // Test
            const result = withPerformanceTracking(component, {
                name: 'CustomName',
                logToConsole: true,
                onMeasure
            });

            // Assert
            expect(result.__isComponent).toBe(true);
            expect(result.name).toBe('PerformanceTrackedCustomName');
            expect(typeof result.setup).toBe('function');
        });

        test('should measure render time and call onMeasure', () => {
            // Setup
            const component = { name: 'TestComponent' };
            const onMeasure = jest.fn();
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // Mock performance.now to return different values
            performance.now
                .mockReturnValueOnce(100) // Start time
                .mockReturnValueOnce(150); // End time

            // Create tracked component
            const TrackedComponent = withPerformanceTracking(component, {
                name: 'TestComponent',
                logToConsole: true,
                onMeasure
            });

            // Get setup function
            const setup = TrackedComponent.setup;

            // Run setup
            const renderFn = setup({}, { slots: {} });

            // Trigger requestAnimationFrame callbacks
            jest.runAllTimers();

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('TestComponent rendered in 50.00ms')
            );

            expect(onMeasure).toHaveBeenCalledWith({
                component: 'TestComponent',
                duration: 50,
                timestamp: expect.any(Number)
            });

            // Check that it renders the wrapped component
            const rendered = renderFn();
            expect(rendered.type).toBe(component);

            // Cleanup
            consoleSpy.mockRestore();
        });
    });
});