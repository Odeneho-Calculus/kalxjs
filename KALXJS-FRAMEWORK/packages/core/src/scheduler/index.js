/**
 * KALXJS Scheduler Module
 * Concurrent rendering with time-slicing and priority-based scheduling
 *
 * @module @kalxjs/core/scheduler
 */

export {
    scheduler,
    Scheduler,
    Priority,
    scheduleCallback,
    cancelCallback,
    getCurrentPriority,
    shouldYield,
} from './scheduler.js';

export {
    startTransition,
    useTransition,
    useDeferredValue,
    useThrottledValue,
    isInTransition,
    onTransitionComplete,
    batchTransitions,
} from './transition.js';