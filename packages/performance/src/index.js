import { h, defineComponent, onMounted, onUnmounted, ref } from '@kalxjs/core';

/**
 * Lazy load a component only when it's needed
 * @param {Function} factory - Factory function that returns a Promise resolving to a component
 * @param {Object} options - Lazy loading options
 * @returns {Object} Lazy loaded component
 */
export function lazyLoad(factory, options = {}) {
    const {
        loading = null,
        error = null,
        delay = 200,
        timeout = 30000
    } = options;

    return defineComponent({
        name: 'LazyComponent',
        setup() {
            const component = ref(null);
            const isLoading = ref(false);
            const isError = ref(false);
            const errorMessage = ref('');
            let timeoutId = null;
            let delayId = null;

            onMounted(async () => {
                // Set loading after delay
                delayId = setTimeout(() => {
                    isLoading.value = true;
                }, delay);

                // Set timeout
                timeoutId = setTimeout(() => {
                    isLoading.value = false;
                    isError.value = true;
                    errorMessage.value = `Timeout (${timeout}ms) exceeded while loading component`;
                }, timeout);

                try {
                    // Load component
                    const loadedComponent = await factory();
                    component.value = loadedComponent.default || loadedComponent;
                } catch (err) {
                    isError.value = true;
                    errorMessage.value = err.message || 'Failed to load component';
                } finally {
                    isLoading.value = false;
                    clearTimeout(delayId);
                    clearTimeout(timeoutId);
                }
            });

            onUnmounted(() => {
                clearTimeout(delayId);
                clearTimeout(timeoutId);
            });

            return () => {
                if (isError.value && error) {
                    return h(error, { error: errorMessage.value });
                }

                if (isLoading.value && loading) {
                    return h(loading);
                }

                return component.value ? h(component.value) : null;
            };
        }
    });
}

/**
 * Debounce a function to limit how often it can be called
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @param {boolean} immediate - Whether to call immediately on the leading edge
 * @returns {Function} Debounced function
 */
export function debounce(fn, wait = 300, immediate = false) {
    let timeout;

    return function (...args) {
        const context = this;

        const later = function () {
            timeout = null;
            if (!immediate) fn.apply(context, args);
        };

        const callNow = immediate && !timeout;

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) fn.apply(context, args);
    };
}

/**
 * Throttle a function to limit how often it can be called
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Milliseconds to limit calls
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit = 300) {
    let inThrottle;
    let lastFunc;
    let lastRan;

    return function (...args) {
        const context = this;

        if (!inThrottle) {
            fn.apply(context, args);
            lastRan = Date.now();
            inThrottle = true;
        } else {
            clearTimeout(lastFunc);

            lastFunc = setTimeout(function () {
                if (Date.now() - lastRan >= limit) {
                    fn.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

/**
 * Memoize a function to cache its results
 * @param {Function} fn - Function to memoize
 * @param {Function} keyResolver - Function to generate cache key from arguments
 * @returns {Function} Memoized function
 */
export function memoize(fn, keyResolver = (...args) => JSON.stringify(args)) {
    const cache = new Map();

    return function (...args) {
        const key = keyResolver(...args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn.apply(this, args);
        cache.set(key, result);

        return result;
    };
}

/**
 * Create a virtualized list for efficient rendering of large lists
 * @param {Object} options - Virtualization options
 * @returns {Object} Virtualized list component
 */
export function virtualList(options = {}) {
    const {
        itemHeight = 50,
        overscan = 5,
        getKey = (item, index) => index
    } = options;

    return defineComponent({
        name: 'VirtualList',
        props: {
            items: {
                type: Array,
                required: true
            },
            renderItem: {
                type: Function,
                required: true
            }
        },
        setup(props) {
            const containerRef = ref(null);
            const scrollTop = ref(0);
            const viewportHeight = ref(0);

            const updateViewportHeight = () => {
                if (containerRef.value) {
                    viewportHeight.value = containerRef.value.clientHeight;
                }
            };

            const handleScroll = debounce(() => {
                if (containerRef.value) {
                    scrollTop.value = containerRef.value.scrollTop;
                }
            }, 10);

            onMounted(() => {
                updateViewportHeight();
                window.addEventListener('resize', updateViewportHeight);
                if (containerRef.value) {
                    containerRef.value.addEventListener('scroll', handleScroll);
                }
            });

            onUnmounted(() => {
                window.removeEventListener('resize', updateViewportHeight);
                if (containerRef.value) {
                    containerRef.value.removeEventListener('scroll', handleScroll);
                }
            });

            return () => {
                const totalHeight = props.items.length * itemHeight;
                const startIndex = Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan);
                const endIndex = Math.min(
                    props.items.length - 1,
                    Math.ceil((scrollTop.value + viewportHeight.value) / itemHeight) + overscan
                );

                const visibleItems = [];

                for (let i = startIndex; i <= endIndex; i++) {
                    const item = props.items[i];
                    const key = getKey(item, i);
                    const top = i * itemHeight;

                    visibleItems.push(
                        h('div', {
                            key,
                            style: {
                                position: 'absolute',
                                top: `${top}px`,
                                height: `${itemHeight}px`,
                                width: '100%'
                            }
                        }, props.renderItem(item, i))
                    );
                }

                return h('div', {
                    ref: containerRef,
                    style: {
                        height: '100%',
                        overflow: 'auto',
                        position: 'relative'
                    }
                }, [
                    h('div', {
                        style: {
                            height: `${totalHeight}px`,
                            position: 'relative'
                        }
                    }, visibleItems)
                ]);
            };
        }
    });
}

/**
 * Measure component render performance
 * @param {Object} component - Component to measure
 * @param {Object} options - Measurement options
 * @returns {Object} Wrapped component with performance measurement
 */
export function withPerformanceTracking(component, options = {}) {
    const {
        name = component.name || 'Component',
        logToConsole = true,
        onMeasure = null
    } = options;

    return defineComponent({
        name: `PerformanceTracked${name}`,
        setup(props, { slots }) {
            let startTime;
            let endTime;

            onMounted(() => {
                startTime = performance.now();

                // Use requestAnimationFrame to measure after the browser has painted
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        endTime = performance.now();
                        const duration = endTime - startTime;

                        if (logToConsole) {
                            console.log(`[Performance] ${name} rendered in ${duration.toFixed(2)}ms`);
                        }

                        if (onMeasure && typeof onMeasure === 'function') {
                            onMeasure({
                                component: name,
                                duration,
                                timestamp: Date.now()
                            });
                        }
                    });
                });
            });

            return () => h(component, props, slots);
        }
    });
}