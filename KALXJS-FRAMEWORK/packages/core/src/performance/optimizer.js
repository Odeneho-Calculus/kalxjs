// @kalxjs/core - Performance Optimization System
// Advanced performance optimizations inspired by modern frameworks

import { signal, derived, createEffect } from '../reactivity/signals.js';
import { ConcurrentAPI } from '../renderer/concurrent.js';

/**
 * Performance Optimizer for KalxJS applications
 * Provides automatic and manual optimization strategies
 */
export class PerformanceOptimizer {
    constructor() {
        this.metrics = new Map();
        this.optimizations = new Map();
        this.thresholds = {
            renderTime: 16, // 60fps threshold
            memoryUsage: 50 * 1024 * 1024, // 50MB
            componentCount: 1000,
            updateFrequency: 100 // updates per second
        };

        this.isEnabled = signal(true);
        this.autoOptimize = signal(true);
        this.optimizationLevel = signal('balanced'); // 'aggressive', 'balanced', 'conservative'

        this.setupPerformanceMonitoring();
    }

    /**
     * Sets up performance monitoring
     */
    setupPerformanceMonitoring() {
        if (typeof window !== 'undefined') {
            // Monitor frame rate
            this.setupFrameRateMonitoring();

            // Monitor memory usage
            this.setupMemoryMonitoring();

            // Monitor long tasks
            this.setupLongTaskMonitoring();

            // Monitor layout shifts
            this.setupLayoutShiftMonitoring();
        }
    }

    /**
     * Monitors frame rate and render performance
     */
    setupFrameRateMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        let fps = 60;

        const measureFPS = (currentTime) => {
            frameCount++;

            if (currentTime - lastTime >= 1000) {
                fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                frameCount = 0;
                lastTime = currentTime;

                this.updateMetric('fps', fps);

                // Auto-optimize if FPS drops below threshold
                if (this.autoOptimize() && fps < 30) {
                    this.optimizeForFrameRate();
                }
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    /**
     * Monitors memory usage
     */
    setupMemoryMonitoring() {
        if (window.performance && window.performance.memory) {
            setInterval(() => {
                const memory = window.performance.memory;
                this.updateMetric('memoryUsage', memory.usedJSHeapSize);

                // Auto-optimize if memory usage is high
                if (this.autoOptimize() && memory.usedJSHeapSize > this.thresholds.memoryUsage) {
                    this.optimizeForMemory();
                }
            }, 5000);
        }
    }

    /**
     * Monitors long tasks that block the main thread
     */
    setupLongTaskMonitoring() {
        if (window.PerformanceObserver) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        this.updateMetric('longTask', {
                            duration: entry.duration,
                            startTime: entry.startTime
                        });

                        // Auto-optimize for long tasks
                        if (this.autoOptimize() && entry.duration > 50) {
                            this.optimizeForResponsiveness();
                        }
                    });
                });

                observer.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                // Long task API not supported
            }
        }
    }

    /**
     * Monitors cumulative layout shift
     */
    setupLayoutShiftMonitoring() {
        if (window.PerformanceObserver) {
            try {
                const observer = new PerformanceObserver((list) => {
                    let cls = 0;

                    list.getEntries().forEach((entry) => {
                        if (!entry.hadRecentInput) {
                            cls += entry.value;
                        }
                    });

                    this.updateMetric('cls', cls);
                });

                observer.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                // Layout shift API not supported
            }
        }
    }

    /**
     * Updates a performance metric
     * @param {string} name - Metric name
     * @param {any} value - Metric value
     */
    updateMetric(name, value) {
        const metric = this.metrics.get(name) || {
            values: [],
            average: 0,
            min: Infinity,
            max: -Infinity,
            lastUpdated: Date.now()
        };

        metric.values.push(value);

        // Keep only last 100 values
        if (metric.values.length > 100) {
            metric.values.shift();
        }

        // Calculate statistics
        const numericValues = metric.values.filter(v => typeof v === 'number');
        if (numericValues.length > 0) {
            metric.average = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
            metric.min = Math.min(...numericValues);
            metric.max = Math.max(...numericValues);
        }

        metric.lastUpdated = Date.now();
        this.metrics.set(name, metric);
    }

    /**
     * Optimizes for better frame rate
     */
    optimizeForFrameRate() {
        console.log('🚀 Optimizing for frame rate...');

        // Enable time slicing for renders
        this.enableTimeSlicing();

        // Reduce render frequency for non-critical components
        this.throttleNonCriticalRenders();

        // Enable component memoization
        this.enableComponentMemoization();

        this.recordOptimization('frameRate', 'Enabled time slicing and render throttling');
    }

    /**
     * Optimizes for memory usage
     */
    optimizeForMemory() {
        console.log('🧠 Optimizing for memory usage...');

        // Enable component recycling
        this.enableComponentRecycling();

        // Clean up unused references
        this.cleanupUnusedReferences();

        // Enable lazy loading for large components
        this.enableLazyLoading();

        this.recordOptimization('memory', 'Enabled component recycling and cleanup');
    }

    /**
     * Optimizes for responsiveness
     */
    optimizeForResponsiveness() {
        console.log('⚡ Optimizing for responsiveness...');

        // Prioritize user interactions
        this.prioritizeUserInteractions();

        // Defer non-critical work
        this.deferNonCriticalWork();

        // Enable concurrent rendering
        this.enableConcurrentRendering();

        this.recordOptimization('responsiveness', 'Enabled concurrent rendering and interaction prioritization');
    }

    /**
     * Enables time slicing for renders
     */
    enableTimeSlicing() {
        // Implementation would integrate with the concurrent renderer
        ConcurrentAPI.batchUpdates(() => {
            // Batch multiple updates together
        });
    }

    /**
     * Throttles renders for non-critical components
     */
    throttleNonCriticalRenders() {
        // Implementation would identify and throttle non-critical components
        const throttleMap = new WeakMap();

        // Override component render methods to add throttling
        this.forEachComponent((component) => {
            if (!this.isCriticalComponent(component)) {
                const originalRender = component.render;
                let lastRender = 0;

                component.render = (...args) => {
                    const now = performance.now();
                    if (now - lastRender < 33) { // Throttle to 30fps for non-critical
                        return component._lastRenderResult || null;
                    }

                    lastRender = now;
                    const result = originalRender.apply(component, args);
                    component._lastRenderResult = result;
                    return result;
                };
            }
        });
    }

    /**
     * Enables component memoization
     */
    enableComponentMemoization() {
        const memoCache = new WeakMap();

        this.forEachComponent((component) => {
            const originalRender = component.render;

            component.render = (...args) => {
                const propsKey = JSON.stringify(component.props);
                const cached = memoCache.get(component);

                if (cached && cached.propsKey === propsKey) {
                    return cached.result;
                }

                const result = originalRender.apply(component, args);
                memoCache.set(component, { propsKey, result });
                return result;
            };
        });
    }

    /**
     * Enables component recycling
     */
    enableComponentRecycling() {
        const componentPool = new Map();

        // Override component creation to use pooling
        const originalCreateComponent = window.createComponent;
        if (originalCreateComponent) {
            window.createComponent = (options) => {
                const componentType = options.name || 'anonymous';
                const pool = componentPool.get(componentType) || [];

                if (pool.length > 0) {
                    const recycled = pool.pop();
                    // Reset component state
                    this.resetComponent(recycled, options);
                    return recycled;
                }

                const component = originalCreateComponent(options);

                // Override unmount to return to pool
                const originalUnmount = component.$unmount;
                component.$unmount = () => {
                    originalUnmount.call(component);

                    // Clean up and return to pool
                    this.cleanupComponent(component);
                    pool.push(component);
                    componentPool.set(componentType, pool);
                };

                return component;
            };
        }
    }

    /**
     * Cleans up unused references
     */
    cleanupUnusedReferences() {
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }

        // Clean up event listeners
        this.cleanupEventListeners();

        // Clean up timers
        this.cleanupTimers();
    }

    /**
     * Enables lazy loading for large components
     */
    enableLazyLoading() {
        // Implementation would identify large components and make them lazy
        this.forEachComponent((component) => {
            if (this.isLargeComponent(component)) {
                this.makeLazy(component);
            }
        });
    }

    /**
     * Prioritizes user interactions
     */
    prioritizeUserInteractions() {
        // Override event handlers to use high priority scheduling
        const interactionEvents = ['click', 'input', 'keydown', 'touchstart'];

        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                // Schedule any resulting updates with high priority
                ConcurrentAPI.scheduleImmediate(event.target);
            }, { capture: true, passive: true });
        });
    }

    /**
     * Defers non-critical work
     */
    deferNonCriticalWork() {
        // Use requestIdleCallback for non-critical work
        const deferWork = (work) => {
            if (window.requestIdleCallback) {
                window.requestIdleCallback(work);
            } else {
                setTimeout(work, 0);
            }
        };

        // Defer analytics, logging, etc.
        this.deferredTasks = this.deferredTasks || [];
        this.deferredTasks.forEach(deferWork);
    }

    /**
     * Enables concurrent rendering
     */
    enableConcurrentRendering() {
        // Enable concurrent features
        this.concurrentMode = true;

        // Use concurrent API for all updates
        this.forEachComponent((component) => {
            const originalUpdate = component.$update;

            component.$update = () => {
                ConcurrentAPI.scheduleUpdate(component);
            };
        });
    }

    /**
     * Records an optimization
     * @param {string} type - Optimization type
     * @param {string} description - Optimization description
     */
    recordOptimization(type, description) {
        const optimization = {
            type,
            description,
            timestamp: Date.now(),
            metrics: this.getCurrentMetrics()
        };

        this.optimizations.set(`${type}-${Date.now()}`, optimization);

        // Keep only last 50 optimizations
        if (this.optimizations.size > 50) {
            const firstKey = this.optimizations.keys().next().value;
            this.optimizations.delete(firstKey);
        }
    }

    /**
     * Gets current performance metrics
     * @returns {Object} Current metrics
     */
    getCurrentMetrics() {
        const metrics = {};

        this.metrics.forEach((value, key) => {
            metrics[key] = {
                current: value.values[value.values.length - 1],
                average: value.average,
                min: value.min,
                max: value.max
            };
        });

        return metrics;
    }

    /**
     * Checks if a component is critical for user experience
     * @param {Object} component - Component to check
     * @returns {boolean} Whether component is critical
     */
    isCriticalComponent(component) {
        // Heuristics to determine if component is critical
        const criticalSelectors = [
            '[data-critical]',
            '.above-fold',
            '.navigation',
            '.header',
            '.main-content'
        ];

        if (component.$el) {
            return criticalSelectors.some(selector =>
                component.$el.matches(selector) ||
                component.$el.querySelector(selector)
            );
        }

        return false;
    }

    /**
     * Checks if a component is large and should be lazy loaded
     * @param {Object} component - Component to check
     * @returns {boolean} Whether component is large
     */
    isLargeComponent(component) {
        // Heuristics to determine component size
        if (component.$el) {
            const elementCount = component.$el.querySelectorAll('*').length;
            const textContent = component.$el.textContent || '';

            return elementCount > 100 || textContent.length > 10000;
        }

        return false;
    }

    /**
     * Makes a component lazy
     * @param {Object} component - Component to make lazy
     */
    makeLazy(component) {
        // Implementation would wrap component in lazy loading logic
        const originalRender = component.render;
        let isVisible = false;

        // Use Intersection Observer to detect visibility
        if (window.IntersectionObserver && component.$el) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        isVisible = true;
                        observer.disconnect();
                        component.$update();
                    }
                });
            });

            observer.observe(component.$el);
        }

        component.render = (...args) => {
            if (!isVisible) {
                return null; // Don't render until visible
            }
            return originalRender.apply(component, args);
        };
    }

    /**
     * Iterates over all components
     * @param {Function} callback - Callback for each component
     */
    forEachComponent(callback) {
        // Implementation would iterate over all registered components
        if (window.__KALX_COMPONENTS__) {
            window.__KALX_COMPONENTS__.forEach(callback);
        }
    }

    /**
     * Resets a component for recycling
     * @param {Object} component - Component to reset
     * @param {Object} options - New component options
     */
    resetComponent(component, options) {
        // Reset component state
        if (component.$data) {
            Object.keys(component.$data).forEach(key => {
                delete component.$data[key];
            });
        }

        // Apply new options
        Object.assign(component.$options, options);

        // Re-initialize if needed
        if (options.setup) {
            const setupResult = options.setup(component.props, component);
            Object.assign(component, setupResult);
        }
    }

    /**
     * Cleans up a component
     * @param {Object} component - Component to clean up
     */
    cleanupComponent(component) {
        // Remove event listeners
        if (component._eventListeners) {
            component._eventListeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
            component._eventListeners = [];
        }

        // Clear timers
        if (component._timers) {
            component._timers.forEach(clearTimeout);
            component._timers = [];
        }

        // Clear refs
        if (component.$refs) {
            Object.keys(component.$refs).forEach(key => {
                delete component.$refs[key];
            });
        }
    }

    /**
     * Cleans up global event listeners
     */
    cleanupEventListeners() {
        // Implementation would track and clean up global event listeners
        if (window.__KALX_EVENT_LISTENERS__) {
            window.__KALX_EVENT_LISTENERS__.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
            window.__KALX_EVENT_LISTENERS__ = [];
        }
    }

    /**
     * Cleans up global timers
     */
    cleanupTimers() {
        // Implementation would track and clean up global timers
        if (window.__KALX_TIMERS__) {
            window.__KALX_TIMERS__.forEach(clearTimeout);
            window.__KALX_TIMERS__ = [];
        }
    }

    /**
     * Gets performance insights and recommendations
     * @returns {Object} Performance insights
     */
    getPerformanceInsights() {
        const metrics = this.getCurrentMetrics();
        const recommendations = [];

        // Analyze FPS
        if (metrics.fps && metrics.fps.average < 30) {
            recommendations.push({
                type: 'performance',
                severity: 'high',
                message: 'Low frame rate detected. Consider enabling time slicing and component memoization.',
                action: 'optimizeForFrameRate'
            });
        }

        // Analyze memory usage
        if (metrics.memoryUsage && metrics.memoryUsage.current > this.thresholds.memoryUsage) {
            recommendations.push({
                type: 'memory',
                severity: 'medium',
                message: 'High memory usage detected. Consider enabling component recycling.',
                action: 'optimizeForMemory'
            });
        }

        // Analyze long tasks
        if (metrics.longTask && metrics.longTask.current && metrics.longTask.current.duration > 50) {
            recommendations.push({
                type: 'responsiveness',
                severity: 'high',
                message: 'Long tasks detected. Consider enabling concurrent rendering.',
                action: 'optimizeForResponsiveness'
            });
        }

        return {
            metrics,
            recommendations,
            optimizations: Array.from(this.optimizations.values()),
            score: this.calculatePerformanceScore(metrics)
        };
    }

    /**
     * Calculates a performance score
     * @param {Object} metrics - Performance metrics
     * @returns {number} Performance score (0-100)
     */
    calculatePerformanceScore(metrics) {
        let score = 100;

        // Deduct points for poor FPS
        if (metrics.fps) {
            if (metrics.fps.average < 30) score -= 30;
            else if (metrics.fps.average < 45) score -= 15;
        }

        // Deduct points for high memory usage
        if (metrics.memoryUsage) {
            const memoryRatio = metrics.memoryUsage.current / this.thresholds.memoryUsage;
            if (memoryRatio > 1) score -= Math.min(30, memoryRatio * 20);
        }

        // Deduct points for layout shifts
        if (metrics.cls && metrics.cls.current > 0.1) {
            score -= Math.min(20, metrics.cls.current * 100);
        }

        return Math.max(0, Math.round(score));
    }

    /**
     * Applies a specific optimization
     * @param {string} optimization - Optimization to apply
     */
    applyOptimization(optimization) {
        switch (optimization) {
            case 'optimizeForFrameRate':
                this.optimizeForFrameRate();
                break;
            case 'optimizeForMemory':
                this.optimizeForMemory();
                break;
            case 'optimizeForResponsiveness':
                this.optimizeForResponsiveness();
                break;
            default:
                console.warn(`Unknown optimization: ${optimization}`);
        }
    }

    /**
     * Enables or disables the optimizer
     * @param {boolean} enabled - Whether to enable the optimizer
     */
    setEnabled(enabled) {
        this.isEnabled(enabled);
    }

    /**
     * Sets the optimization level
     * @param {string} level - Optimization level ('aggressive', 'balanced', 'conservative')
     */
    setOptimizationLevel(level) {
        this.optimizationLevel(level);

        // Adjust thresholds based on level
        switch (level) {
            case 'aggressive':
                this.thresholds.renderTime = 8; // 120fps
                this.thresholds.memoryUsage = 30 * 1024 * 1024; // 30MB
                break;
            case 'balanced':
                this.thresholds.renderTime = 16; // 60fps
                this.thresholds.memoryUsage = 50 * 1024 * 1024; // 50MB
                break;
            case 'conservative':
                this.thresholds.renderTime = 33; // 30fps
                this.thresholds.memoryUsage = 100 * 1024 * 1024; // 100MB
                break;
        }
    }
}

// Global performance optimizer instance
let performanceOptimizer = null;

/**
 * Initializes the performance optimizer
 * @param {Object} options - Optimizer options
 * @returns {PerformanceOptimizer} Optimizer instance
 */
export function initPerformanceOptimizer(options = {}) {
    if (!performanceOptimizer) {
        performanceOptimizer = new PerformanceOptimizer();

        if (options.autoEnable !== false) {
            performanceOptimizer.setEnabled(true);
        }

        if (options.optimizationLevel) {
            performanceOptimizer.setOptimizationLevel(options.optimizationLevel);
        }
    }

    return performanceOptimizer;
}

/**
 * Gets the performance optimizer instance
 * @returns {PerformanceOptimizer} Optimizer instance
 */
export function getPerformanceOptimizer() {
    return performanceOptimizer;
}

// Auto-initialize in production for better performance
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    initPerformanceOptimizer({ optimizationLevel: 'balanced' });
}