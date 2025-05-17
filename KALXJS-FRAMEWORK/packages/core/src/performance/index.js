// @kalxjs/core - Performance optimizations

/**
 * Memoizes a function to cache its results
 * @param {Function} fn - Function to memoize
 * @param {Function} keyFn - Function to generate cache key
 * @returns {Function} Memoized function
 */
export function memoize(fn, keyFn = JSON.stringify) {
    const cache = new Map();

    return function (...args) {
        const key = keyFn(args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn.apply(this, args);
        cache.set(key, result);

        return result;
    };
}

/**
 * Creates a component that only re-renders when its props change
 * @param {Object} component - Component definition
 * @returns {Object} Memoized component
 */
export function memo(component) {
    // Add a custom shouldUpdate function
    const originalSetup = component.setup;

    component.setup = function (props, context) {
        // Store previous props
        let prevProps = JSON.stringify(props);

        // Add shouldUpdate method
        context.shouldUpdate = (newProps) => {
            const newPropsStr = JSON.stringify(newProps);
            const shouldUpdate = prevProps !== newPropsStr;

            // Update previous props
            prevProps = newPropsStr;

            return shouldUpdate;
        };

        // Call original setup
        return originalSetup.call(this, props, context);
    };

    return component;
}

/**
 * Creates a lazy-loaded component
 * @param {Function} factory - Factory function that returns a component
 * @returns {Object} Lazy-loaded component
 */
export function lazy(factory) {
    let component = null;
    let loading = false;
    let error = null;

    // Create a placeholder component
    return {
        name: 'LazyComponent',
        setup(props, context) {
            // Load the component if not already loaded
            if (!component && !loading) {
                loading = true;

                factory()
                    .then(comp => {
                        component = comp;
                        loading = false;
                    })
                    .catch(err => {
                        error = err;
                        loading = false;
                        console.error('Failed to load lazy component:', err);
                    });
            }

            return () => {
                if (component) {
                    // Render the loaded component
                    return h(component, props, context.slots);
                } else if (error) {
                    // Render error state
                    return h('div', { class: 'lazy-error' }, [
                        'Failed to load component: ' + error.message
                    ]);
                } else {
                    // Render loading state
                    return h('div', { class: 'lazy-loading' }, [
                        'Loading...'
                    ]);
                }
            };
        }
    };
}

/**
 * Creates a component that only renders when visible in the viewport
 * @param {Object} component - Component definition
 * @param {Object} options - Options for the intersection observer
 * @returns {Object} Deferred component
 */
export function deferRender(component, options = {}) {
    const {
        root = null,
        rootMargin = '0px',
        threshold = 0,
        once = true
    } = options;

    return {
        name: 'DeferredComponent',
        setup(props, context) {
            const visible = ref(false);
            const containerRef = ref(null);

            onMounted(() => {
                if (!containerRef.value) return;

                const observer = new IntersectionObserver(
                    (entries) => {
                        const entry = entries[0];

                        if (entry.isIntersecting) {
                            visible.value = true;

                            if (once) {
                                observer.disconnect();
                            }
                        } else if (!once) {
                            visible.value = false;
                        }
                    },
                    { root, rootMargin, threshold }
                );

                observer.observe(containerRef.value);

                onUnmounted(() => {
                    observer.disconnect();
                });
            });

            return () => {
                return h('div', { ref: containerRef }, [
                    visible.value
                        ? h(component, props, context.slots)
                        : h('div', { class: 'deferred-placeholder', style: 'min-height: 20px;' })
                ]);
            };
        }
    };
}

/**
 * Creates a virtualized list component
 * @param {Object} options - Virtualized list options
 * @returns {Object} Virtualized list component
 */
export function createVirtualList(options = {}) {
    const {
        itemHeight = 50,
        overscan = 5,
        getKey = (item, index) => index
    } = options;

    return {
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
            const containerHeight = ref(0);

            // Calculate visible items
            const visibleItems = computed(() => {
                if (!props.items.length) return [];

                const totalHeight = props.items.length * itemHeight;
                const startIndex = Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan);
                const endIndex = Math.min(
                    props.items.length - 1,
                    Math.ceil((scrollTop.value + containerHeight.value) / itemHeight) + overscan
                );

                const items = [];

                for (let i = startIndex; i <= endIndex; i++) {
                    items.push({
                        index: i,
                        item: props.items[i],
                        style: {
                            position: 'absolute',
                            top: `${i * itemHeight}px`,
                            height: `${itemHeight}px`,
                            left: 0,
                            right: 0
                        }
                    });
                }

                return items;
            });

            // Handle scroll events
            const handleScroll = () => {
                if (containerRef.value) {
                    scrollTop.value = containerRef.value.scrollTop;
                }
            };

            // Update container height on resize
            const updateContainerHeight = () => {
                if (containerRef.value) {
                    containerHeight.value = containerRef.value.clientHeight;
                }
            };

            onMounted(() => {
                updateContainerHeight();

                if (containerRef.value) {
                    containerRef.value.addEventListener('scroll', handleScroll);

                    const resizeObserver = new ResizeObserver(updateContainerHeight);
                    resizeObserver.observe(containerRef.value);

                    onUnmounted(() => {
                        containerRef.value.removeEventListener('scroll', handleScroll);
                        resizeObserver.disconnect();
                    });
                }
            });

            return () => {
                const totalHeight = props.items.length * itemHeight;

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
                    },
                        visibleItems.value.map(({ index, item, style }) => {
                            return h('div', {
                                key: getKey(item, index),
                                style
                            }, [props.renderItem(item, index)]);
                        }))
                ]);
            };
        }
    };
}

/**
 * Creates a performance plugin for KalxJS
 * @returns {Object} Performance plugin
 */
export function createPerformancePlugin() {
    return {
        name: 'performance',
        install(app) {
            // Add performance utilities to the app
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};

            app.config.globalProperties.$perf = {
                memoize,
                memo,
                lazy,
                deferRender,
                createVirtualList
            };

            // Add performance utilities to the app
            app.memoize = memoize;
            app.memo = memo;
            app.lazy = lazy;
            app.deferRender = deferRender;
            app.createVirtualList = createVirtualList;
        }
    };
}