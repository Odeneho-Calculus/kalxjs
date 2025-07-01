// @kalxjs/core - Concurrent Rendering System
// Inspired by React 19's concurrent features for better performance and user experience

/**
 * Priority levels for concurrent rendering
 */
export const Priority = {
    IMMEDIATE: 1,      // User input, animations
    NORMAL: 2,         // Default updates
    LOW: 3,            // Background updates
    IDLE: 4            // Cleanup, prefetching
};

/**
 * Time slicing configuration
 */
const TIME_SLICE = 5; // 5ms time slices
const FRAME_DEADLINE = 16.67; // ~60fps

/**
 * Global scheduler state
 */
let isSchedulerRunning = false;
let currentTask = null;
let taskQueue = [];
let timerQueue = [];
let currentTime = 0;

/**
 * Gets the current time in milliseconds
 */
function getCurrentTime() {
    return performance.now();
}

/**
 * Checks if we should yield to the browser
 */
function shouldYield() {
    return getCurrentTime() - currentTime >= TIME_SLICE;
}

/**
 * Task scheduler for concurrent rendering
 */
class TaskScheduler {
    constructor() {
        this.taskIdCounter = 1;
        this.isMessageLoopRunning = false;
    }

    /**
     * Schedules a task with given priority
     * @param {Function} callback - Task callback
     * @param {number} priority - Task priority
     * @param {Object} options - Additional options
     * @returns {Object} Task object
     */
    scheduleTask(callback, priority = Priority.NORMAL, options = {}) {
        const currentTime = getCurrentTime();
        const { delay = 0, timeout } = options;

        const task = {
            id: this.taskIdCounter++,
            callback,
            priority,
            startTime: currentTime + delay,
            expirationTime: timeout ? currentTime + timeout : this.getExpirationTime(priority),
            sortIndex: -1
        };

        if (delay > 0) {
            // Delayed task
            task.sortIndex = task.startTime;
            this.push(timerQueue, task);

            if (this.peek(timerQueue) === task) {
                this.requestHostTimeout(this.handleTimeout, delay);
            }
        } else {
            // Immediate task
            task.sortIndex = task.expirationTime;
            this.push(taskQueue, task);

            if (!isSchedulerRunning) {
                this.requestHostCallback(this.flushWork);
            }
        }

        return task;
    }

    /**
     * Cancels a scheduled task
     * @param {Object} task - Task to cancel
     */
    cancelTask(task) {
        task.callback = null;
    }

    /**
     * Gets expiration time based on priority
     * @param {number} priority - Task priority
     * @returns {number} Expiration time
     */
    getExpirationTime(priority) {
        const currentTime = getCurrentTime();

        switch (priority) {
            case Priority.IMMEDIATE:
                return currentTime + 250; // 250ms
            case Priority.NORMAL:
                return currentTime + 5000; // 5s
            case Priority.LOW:
                return currentTime + 10000; // 10s
            case Priority.IDLE:
                return currentTime + 1073741823; // Never expires
            default:
                return currentTime + 5000;
        }
    }

    /**
     * Main work loop
     */
    flushWork = (hasTimeRemaining, initialTime) => {
        isSchedulerRunning = true;

        try {
            return this.workLoop(hasTimeRemaining, initialTime);
        } finally {
            currentTask = null;
            isSchedulerRunning = false;
        }
    }

    /**
     * Work loop that processes tasks
     */
    workLoop(hasTimeRemaining, initialTime) {
        let currentTime = initialTime;
        this.advanceTimers(currentTime);
        currentTask = this.peek(taskQueue);

        while (currentTask !== null) {
            if (currentTask.expirationTime > currentTime && (!hasTimeRemaining || shouldYield())) {
                // Task hasn't expired and we should yield
                break;
            }

            const callback = currentTask.callback;
            if (typeof callback === 'function') {
                currentTask.callback = null;
                const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;

                try {
                    const continuationCallback = callback(didUserCallbackTimeout);

                    if (typeof continuationCallback === 'function') {
                        // Task wants to continue
                        currentTask.callback = continuationCallback;
                    } else {
                        // Task is complete
                        if (this.peek(taskQueue) === currentTask) {
                            this.pop(taskQueue);
                        }
                    }
                } catch (error) {
                    // Task threw an error
                    if (this.peek(taskQueue) === currentTask) {
                        this.pop(taskQueue);
                    }
                    throw error;
                }
            } else {
                this.pop(taskQueue);
            }

            currentTask = this.peek(taskQueue);
        }

        if (currentTask !== null) {
            return true; // More work to do
        } else {
            const firstTimer = this.peek(timerQueue);
            if (firstTimer !== null) {
                this.requestHostTimeout(this.handleTimeout, firstTimer.startTime - currentTime);
            }
            return false; // No more work
        }
    }

    /**
     * Advances timers and moves ready tasks to task queue
     */
    advanceTimers(currentTime) {
        let timer = this.peek(timerQueue);

        while (timer !== null) {
            if (timer.callback === null) {
                // Timer was cancelled
                this.pop(timerQueue);
            } else if (timer.startTime <= currentTime) {
                // Timer fired
                this.pop(timerQueue);
                timer.sortIndex = timer.expirationTime;
                this.push(taskQueue, timer);
            } else {
                // Timer hasn't fired yet
                return;
            }
            timer = this.peek(timerQueue);
        }
    }

    /**
     * Handles timeout for delayed tasks
     */
    handleTimeout = (currentTime) => {
        this.advanceTimers(currentTime);

        if (!isSchedulerRunning) {
            if (this.peek(taskQueue) !== null) {
                this.requestHostCallback(this.flushWork);
            } else {
                const firstTimer = this.peek(timerQueue);
                if (firstTimer !== null) {
                    this.requestHostTimeout(this.handleTimeout, firstTimer.startTime - currentTime);
                }
            }
        }
    }

    /**
     * Requests host callback (browser scheduling)
     */
    requestHostCallback(callback) {
        if (typeof MessageChannel !== 'undefined') {
            // Use MessageChannel for better performance
            if (!this.isMessageLoopRunning) {
                this.isMessageLoopRunning = true;
                this.schedulePerformWorkUntilDeadline();
            }
        } else {
            // Fallback to setTimeout
            setTimeout(() => {
                const currentTime = getCurrentTime();
                callback(true, currentTime);
            }, 0);
        }
    }

    /**
     * Requests host timeout
     */
    requestHostTimeout(callback, ms) {
        setTimeout(() => {
            callback(getCurrentTime());
        }, ms);
    }

    /**
     * Schedules work until deadline using MessageChannel
     */
    schedulePerformWorkUntilDeadline() {
        if (!this.channel) {
            this.channel = new MessageChannel();
            this.port1 = this.channel.port1;
            this.port2 = this.channel.port2;

            this.port1.onmessage = () => {
                const currentTime = getCurrentTime();
                const hasTimeRemaining = currentTime < FRAME_DEADLINE;

                try {
                    const hasMoreWork = this.flushWork(hasTimeRemaining, currentTime);

                    if (hasMoreWork) {
                        this.schedulePerformWorkUntilDeadline();
                    } else {
                        this.isMessageLoopRunning = false;
                    }
                } catch (error) {
                    this.isMessageLoopRunning = false;
                    throw error;
                }
            };
        }

        this.port2.postMessage(null);
    }

    // Min-heap utilities
    push(heap, node) {
        const index = heap.length;
        heap.push(node);
        this.siftUp(heap, node, index);
    }

    peek(heap) {
        return heap.length === 0 ? null : heap[0];
    }

    pop(heap) {
        if (heap.length === 0) {
            return null;
        }

        const first = heap[0];
        const last = heap.pop();

        if (last !== first) {
            heap[0] = last;
            this.siftDown(heap, last, 0);
        }

        return first;
    }

    siftUp(heap, node, i) {
        let index = i;

        while (index > 0) {
            const parentIndex = (index - 1) >>> 1;
            const parent = heap[parentIndex];

            if (this.compare(parent, node) > 0) {
                heap[parentIndex] = node;
                heap[index] = parent;
                index = parentIndex;
            } else {
                return;
            }
        }
    }

    siftDown(heap, node, i) {
        let index = i;
        const length = heap.length;
        const halfLength = length >>> 1;

        while (index < halfLength) {
            const leftIndex = (index + 1) * 2 - 1;
            const left = heap[leftIndex];
            const rightIndex = leftIndex + 1;
            const right = heap[rightIndex];

            if (this.compare(left, node) < 0) {
                if (rightIndex < length && this.compare(right, left) < 0) {
                    heap[index] = right;
                    heap[rightIndex] = node;
                    index = rightIndex;
                } else {
                    heap[index] = left;
                    heap[leftIndex] = node;
                    index = leftIndex;
                }
            } else if (rightIndex < length && this.compare(right, node) < 0) {
                heap[index] = right;
                heap[rightIndex] = node;
                index = rightIndex;
            } else {
                return;
            }
        }
    }

    compare(a, b) {
        const diff = a.sortIndex - b.sortIndex;
        return diff !== 0 ? diff : a.id - b.id;
    }
}

// Global scheduler instance
const scheduler = new TaskScheduler();

/**
 * Concurrent renderer for KalxJS components
 */
export class ConcurrentRenderer {
    constructor() {
        this.renderQueue = new Map();
        this.isRendering = false;
    }

    /**
     * Schedules a component update with given priority
     * @param {Object} component - Component to update
     * @param {number} priority - Update priority
     * @param {Object} options - Additional options
     */
    scheduleUpdate(component, priority = Priority.NORMAL, options = {}) {
        const updateId = `${component._uid || 'unknown'}-${Date.now()}`;

        // Cancel previous update if exists
        if (this.renderQueue.has(component)) {
            const prevTask = this.renderQueue.get(component);
            scheduler.cancelTask(prevTask);
        }

        // Schedule new update
        const task = scheduler.scheduleTask(
            (didTimeout) => this.performUpdate(component, didTimeout),
            priority,
            options
        );

        this.renderQueue.set(component, task);
        return task;
    }

    /**
     * Performs the actual component update
     * @param {Object} component - Component to update
     * @param {boolean} didTimeout - Whether the task timed out
     */
    performUpdate(component, didTimeout) {
        try {
            if (!component || !component.render) {
                return null; // Component was unmounted
            }

            // Start time slicing
            const startTime = getCurrentTime();

            // Render the component
            const newVNode = component.render();

            // Check if we should yield during rendering
            if (!didTimeout && shouldYield()) {
                // Continue rendering in next time slice
                return (didTimeout) => this.performUpdate(component, didTimeout);
            }

            // Apply the update to DOM
            this.commitUpdate(component, newVNode);

            // Clean up
            this.renderQueue.delete(component);

            return null; // Update complete
        } catch (error) {
            console.error('Error during concurrent update:', error);
            this.renderQueue.delete(component);
            return null;
        }
    }

    /**
     * Commits the update to the DOM
     * @param {Object} component - Component
     * @param {Object} newVNode - New virtual DOM node
     */
    commitUpdate(component, newVNode) {
        if (component.$el && component._vnode) {
            // Use the existing updateElement function
            const { updateElement } = require('../vdom/vdom.js');
            updateElement(component.$el.parentNode, component._vnode, newVNode, 0);
            component._vnode = newVNode;
        }
    }

    /**
     * Cancels all pending updates for a component
     * @param {Object} component - Component
     */
    cancelUpdates(component) {
        if (this.renderQueue.has(component)) {
            const task = this.renderQueue.get(component);
            scheduler.cancelTask(task);
            this.renderQueue.delete(component);
        }
    }
}

// Global concurrent renderer instance
const concurrentRenderer = new ConcurrentRenderer();

/**
 * Public API for concurrent rendering
 */
export const ConcurrentAPI = {
    /**
     * Schedules a high-priority update (user input)
     */
    scheduleImmediate(component, options) {
        return concurrentRenderer.scheduleUpdate(component, Priority.IMMEDIATE, options);
    },

    /**
     * Schedules a normal priority update
     */
    scheduleUpdate(component, options) {
        return concurrentRenderer.scheduleUpdate(component, Priority.NORMAL, options);
    },

    /**
     * Schedules a low-priority update (background)
     */
    scheduleLowPriority(component, options) {
        return concurrentRenderer.scheduleUpdate(component, Priority.LOW, options);
    },

    /**
     * Schedules an idle update
     */
    scheduleIdle(component, options) {
        return concurrentRenderer.scheduleUpdate(component, Priority.IDLE, options);
    },

    /**
     * Cancels pending updates
     */
    cancelUpdates(component) {
        concurrentRenderer.cancelUpdates(component);
    },

    /**
     * Batches multiple updates together
     */
    batchUpdates(fn) {
        const updates = [];
        const originalSchedule = concurrentRenderer.scheduleUpdate;

        // Collect updates instead of scheduling them immediately
        concurrentRenderer.scheduleUpdate = (component, priority, options) => {
            updates.push({ component, priority, options });
        };

        try {
            fn();

            // Schedule all collected updates with the highest priority
            const highestPriority = Math.min(...updates.map(u => u.priority));
            updates.forEach(({ component, options }) => {
                originalSchedule.call(concurrentRenderer, component, highestPriority, options);
            });
        } finally {
            concurrentRenderer.scheduleUpdate = originalSchedule;
        }
    }
};

/**
 * Suspense-like functionality for async components
 */
export class Suspense {
    constructor(options = {}) {
        this.fallback = options.fallback || 'Loading...';
        this.timeout = options.timeout || 5000;
        this.pendingPromises = new Set();
    }

    /**
     * Wraps a component with suspense
     * @param {Object} component - Component to wrap
     * @returns {Object} Wrapped component
     */
    wrap(component) {
        return {
            ...component,
            setup(props, context) {
                const isLoading = signal(false);
                const error = signal(null);

                const originalSetup = component.setup;
                let setupResult;

                try {
                    if (originalSetup) {
                        setupResult = originalSetup(props, context);

                        // Check if setup returns a promise
                        if (setupResult && typeof setupResult.then === 'function') {
                            isLoading(true);
                            this.pendingPromises.add(setupResult);

                            setupResult
                                .then(result => {
                                    setupResult = result;
                                    isLoading(false);
                                    this.pendingPromises.delete(setupResult);
                                })
                                .catch(err => {
                                    error(err);
                                    isLoading(false);
                                    this.pendingPromises.delete(setupResult);
                                });
                        }
                    }
                } catch (err) {
                    error(err);
                }

                return {
                    ...setupResult,
                    isLoading: isLoading,
                    error: error
                };
            },

            render() {
                if (this.error()) {
                    return h('div', { class: 'suspense-error' }, [
                        'Error: ' + this.error().message
                    ]);
                }

                if (this.isLoading()) {
                    return h('div', { class: 'suspense-fallback' }, [
                        this.fallback
                    ]);
                }

                return component.render ? component.render.call(this) : null;
            }
        };
    }
}

// Export the scheduler for advanced use cases
export { scheduler as TaskScheduler };

// Performance monitoring
export const ConcurrentMetrics = {
    getScheduledTasksCount() {
        return taskQueue.length + timerQueue.length;
    },

    getCurrentTask() {
        return currentTask;
    },

    isSchedulerBusy() {
        return isSchedulerRunning;
    }
};