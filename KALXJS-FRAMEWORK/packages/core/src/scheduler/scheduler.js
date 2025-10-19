/**
 * KALXJS Concurrent Scheduler
 * React 19-inspired concurrent rendering with time-slicing and priority-based rendering
 *
 * Features:
 * - Time-slicing for long renders
 * - Priority-based task scheduling
 * - Interruptible rendering
 * - Automatic batching
 * - Work loop with frame budget
 *
 * @module @kalxjs/core/scheduler
 */

// Priority levels (higher number = higher priority)
export const Priority = {
    IMMEDIATE: 99,      // Must run immediately (user input, animations)
    USER_BLOCKING: 98,  // User interaction results
    NORMAL: 97,         // Default priority
    LOW: 96,            // Prefetching, analytics
    IDLE: 95,           // Background tasks
};

// Frame budget in milliseconds (target 60fps = 16.67ms per frame)
const FRAME_BUDGET = 5; // Leave time for browser work
const IDLE_CALLBACK_TIMEOUT = 1000;

// Task queue structure
class Task {
    constructor(callback, priority, options = {}) {
        this.id = Task.nextId++;
        this.callback = callback;
        this.priority = priority;
        this.expirationTime = options.timeout ? Date.now() + options.timeout : Infinity;
        this.cancelled = false;
    }

    static nextId = 0;
}

class Scheduler {
    constructor() {
        this.taskQueue = [];
        this.isPerformingWork = false;
        this.currentTask = null;
        this.frameDeadline = 0;
        this.isMessageLoopRunning = false;
        this.scheduledCallback = null;

        // Bind methods
        this.performWorkUntilDeadline = this.performWorkUntilDeadline.bind(this);
        this.flushWork = this.flushWork.bind(this);
    }

    /**
     * Schedule a callback with priority
     * @param {Function} callback - Work to perform
     * @param {number} priority - Task priority
     * @param {Object} options - Optional configuration
     * @returns {Task} The scheduled task
     */
    scheduleCallback(callback, priority = Priority.NORMAL, options = {}) {
        const task = new Task(callback, priority, options);

        // Insert task into queue sorted by priority and expiration
        this.insertTask(task);

        // Request work if not already scheduled
        this.requestWork();

        return task;
    }

    /**
     * Cancel a scheduled task
     * @param {Task} task - Task to cancel
     */
    cancelCallback(task) {
        if (task) {
            task.cancelled = true;
        }
    }

    /**
     * Insert task into priority queue
     * @private
     */
    insertTask(task) {
        // Binary insertion based on priority (and expiration as tiebreaker)
        let start = 0;
        let end = this.taskQueue.length;

        while (start < end) {
            const mid = Math.floor((start + end) / 2);
            const midTask = this.taskQueue[mid];

            // Compare by priority first, then expiration
            if (task.priority > midTask.priority ||
                (task.priority === midTask.priority && task.expirationTime < midTask.expirationTime)) {
                end = mid;
            } else {
                start = mid + 1;
            }
        }

        this.taskQueue.splice(start, 0, task);
    }

    /**
     * Request work to be scheduled
     * @private
     */
    requestWork() {
        if (this.isMessageLoopRunning) {
            return;
        }

        this.isMessageLoopRunning = true;

        // Use different scheduling strategies based on priority
        const nextTask = this.taskQueue[0];

        if (!nextTask) {
            this.isMessageLoopRunning = false;
            return;
        }

        if (nextTask.priority >= Priority.USER_BLOCKING) {
            // High priority - use MessageChannel for immediate scheduling
            this.scheduleImmediateTask();
        } else if (nextTask.priority === Priority.IDLE) {
            // Low priority - use requestIdleCallback
            this.scheduleIdleTask();
        } else {
            // Normal priority - use requestAnimationFrame + MessageChannel
            this.scheduleNormalTask();
        }
    }

    /**
     * Schedule immediate task (for high priority work)
     * @private
     */
    scheduleImmediateTask() {
        if (typeof setImmediate === 'function') {
            setImmediate(this.flushWork);
        } else {
            Promise.resolve().then(this.flushWork);
        }
    }

    /**
     * Schedule normal priority task
     * @private
     */
    scheduleNormalTask() {
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame((timestamp) => {
                this.frameDeadline = timestamp + FRAME_BUDGET;
                this.performWorkUntilDeadline();
            });
        } else {
            setTimeout(this.performWorkUntilDeadline, 0);
        }
    }

    /**
     * Schedule idle task (for low priority work)
     * @private
     */
    scheduleIdleTask() {
        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(this.flushWork, { timeout: IDLE_CALLBACK_TIMEOUT });
        } else {
            setTimeout(this.flushWork, IDLE_CALLBACK_TIMEOUT);
        }
    }

    /**
     * Perform work until frame deadline
     * @private
     */
    performWorkUntilDeadline() {
        if (!this.isMessageLoopRunning) {
            return;
        }

        const currentTime = Date.now();
        this.frameDeadline = currentTime + FRAME_BUDGET;

        const hasMoreWork = this.flushWork();

        if (hasMoreWork) {
            // More work to do - schedule next frame
            this.requestWork();
        } else {
            this.isMessageLoopRunning = false;
        }
    }

    /**
     * Flush work queue
     * @private
     * @returns {boolean} True if more work remains
     */
    flushWork() {
        if (this.isPerformingWork) {
            return true;
        }

        this.isPerformingWork = true;

        try {
            const currentTime = Date.now();

            while (this.taskQueue.length > 0) {
                const task = this.taskQueue[0];

                // Skip cancelled tasks
                if (task.cancelled) {
                    this.taskQueue.shift();
                    continue;
                }

                // Check if task has expired (must run now)
                const hasExpired = task.expirationTime <= currentTime;

                // Check if we have time budget remaining
                const hasTimeRemaining = this.shouldYield() === false;

                if (!hasExpired && !hasTimeRemaining) {
                    // No time left and task hasn't expired - yield to browser
                    break;
                }

                // Perform work
                this.currentTask = task;

                try {
                    const continuationCallback = task.callback();

                    if (typeof continuationCallback === 'function') {
                        // Task wants to continue - update callback and re-insert
                        task.callback = continuationCallback;
                    } else {
                        // Task completed - remove from queue
                        this.taskQueue.shift();
                    }
                } catch (error) {
                    // Remove failed task and rethrow
                    this.taskQueue.shift();
                    throw error;
                }

                this.currentTask = null;
            }

            return this.taskQueue.length > 0;
        } finally {
            this.isPerformingWork = false;
        }
    }

    /**
     * Check if we should yield to browser
     * @private
     */
    shouldYield() {
        if (this.frameDeadline === 0) {
            return false;
        }
        return Date.now() >= this.frameDeadline;
    }

    /**
     * Get current priority
     */
    getCurrentPriority() {
        return this.currentTask ? this.currentTask.priority : Priority.NORMAL;
    }

    /**
     * Check if currently rendering
     */
    isRendering() {
        return this.isPerformingWork;
    }

    /**
     * Clear all scheduled work (for testing/debugging)
     */
    clearWork() {
        this.taskQueue = [];
        this.isMessageLoopRunning = false;
        this.currentTask = null;
    }
}

// Singleton scheduler instance
const scheduler = new Scheduler();

// Public API
export {
    scheduler,
    Scheduler,
};

/**
 * Schedule callback with priority
 */
export function scheduleCallback(callback, priority = Priority.NORMAL, options = {}) {
    return scheduler.scheduleCallback(callback, priority, options);
}

/**
 * Cancel scheduled callback
 */
export function cancelCallback(task) {
    scheduler.cancelCallback(task);
}

/**
 * Get current priority level
 */
export function getCurrentPriority() {
    return scheduler.getCurrentPriority();
}

/**
 * Check if should yield to browser
 */
export function shouldYield() {
    return scheduler.shouldYield();
}