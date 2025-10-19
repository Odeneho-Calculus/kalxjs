/**
 * Signal - Fine-grained reactive primitive
 * Inspired by Solid.js and Angular Signals
 * Provides direct DOM updates without Virtual DOM overhead
 */

let currentListener = null;
const listenerStack = [];

/**
 * Creates a reactive signal
 * @param {*} initialValue - Initial value
 * @returns {Function} Signal accessor/setter
 */
export function signal(initialValue) {
    let value = initialValue;
    const subscribers = new Set();

    const read = () => {
        if (currentListener) {
            subscribers.add(currentListener);
        }
        return value;
    };

    const write = (nextValue) => {
        const newValue = typeof nextValue === 'function'
            ? nextValue(value)
            : nextValue;

        if (!Object.is(value, newValue)) {
            value = newValue;
            // Notify all subscribers
            subscribers.forEach(sub => sub.execute());
        }
    };

    read.set = write;
    read.update = (fn) => write(fn(value));
    read.subscribers = subscribers;
    read[Symbol.toStringTag] = 'Signal';

    return read;
}

/**
 * Creates a computed signal (derived value)
 * @param {Function} computation - Computation function
 * @returns {Function} Computed signal accessor
 */
export function computed(computation) {
    const sig = signal(undefined);

    effect(() => {
        sig.set(computation());
    });

    return sig;
}

/**
 * Creates an effect that automatically tracks signal dependencies
 * @param {Function} fn - Effect function
 * @returns {Object} Effect controller
 */
export function effect(fn) {
    const execute = () => {
        cleanup();
        listenerStack.push(currentListener);
        currentListener = effectInstance;

        try {
            return fn();
        } finally {
            currentListener = listenerStack.pop();
        }
    };

    const cleanup = () => {
        effectInstance.dependencies.forEach(dep => {
            dep.delete(effectInstance);
        });
        effectInstance.dependencies.clear();
    };

    const effectInstance = {
        execute,
        cleanup,
        dependencies: new Set()
    };

    execute();

    return {
        dispose: cleanup,
        run: execute
    };
}

/**
 * Returns current listener (for debugging)
 */
export function getCurrentListener() {
    return currentListener;
}