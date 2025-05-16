// packages/core/src/reactivity/reactive.js

// Current active effect
let activeEffect = null;
const effectStack = [];

/**
 * Creates a reactive object
 * @param {Object} target - Object to make reactive
 * @returns {Proxy} Reactive object
 */
export function reactive(target) {
    if (!target || typeof target !== 'object') {
        return target;
    }

    const handlers = {
        get(target, key, receiver) {
            // Special handling for array methods that modify the array
            if (Array.isArray(target) && typeof Array.prototype[key] === 'function') {
                // Handle array mutation methods
                if (['push', 'pop', 'shift', 'unshift', 'splice'].includes(key)) {
                    track(target, 'length');

                    // Return a wrapped function that triggers updates
                    return function (...args) {
                        const result = Array.prototype[key].apply(target, args);
                        trigger(target, 'length');
                        return result;
                    };
                }
            }

            const result = Reflect.get(target, key, receiver);
            track(target, key);

            // Make nested objects reactive too
            if (result && typeof result === 'object') {
                return reactive(result);
            }

            return result;
        },
        set(target, key, value, receiver) {
            const oldValue = target[key];
            const result = Reflect.set(target, key, value, receiver);

            if (oldValue !== value) {
                // Make the internal value reactive if it's an object
                value = value && typeof value === 'object' ? reactive(value) : value;
                trigger(target, key);

                // If we're modifying an array length, trigger for the array itself
                if (Array.isArray(target) && key === 'length') {
                    trigger(target, 'length');
                }
            }
            return result;
        },
        deleteProperty(target, key) {
            const hadKey = key in target;
            const result = Reflect.deleteProperty(target, key);
            if (hadKey && result) {
                trigger(target, key);
            }
            return result;
        }
    };

    return new Proxy(target, handlers);
}

/**
 * Creates a reactive reference
 * @param {any} value - Initial value
 * @returns {Object} Reactive reference
 */
export function ref(value) {
    // Make the internal value reactive if it's an object
    const _value = value && typeof value === 'object' ? reactive(value) : value;

    const r = {
        _value,
        get value() {
            track(r, 'value');
            return this._value;
        },
        set value(newValue) {
            if (this._value !== newValue) {
                // Make the new value reactive if it's an object
                this._value = newValue && typeof newValue === 'object'
                    ? reactive(newValue)
                    : newValue;
                trigger(r, 'value');
            }
        }
    };
    return r;
}

/**
 * Creates a computed property
 * @param {Function|Object} options - Getter function or options object with get/set
 * @returns {Object} Computed property
 */
export function computed(options) {
    let getter, setter;

    // Handle both function and object with get/set
    if (typeof options === 'function') {
        getter = options;
        setter = () => console.warn('Write operation failed: computed value is readonly');
    } else {
        getter = options.get;
        setter = options.set;
    }

    // Create a ref to store the computed value
    const result = ref();

    // Create an effect that updates the ref's value
    effect(() => {
        result.value = getter();
    });

    // Return a read-only version of the ref
    return {
        get value() {
            return result.value;
        },
        set value(newValue) {
            setter(newValue);
        }
    };
}

/**
 * Creates a reactive effect
 * @param {Function} fn - Effect function
 * @param {Object} options - Effect options
 * @returns {Function} Effect runner
 */
export function effect(fn, options = {}) {
    const effect = createReactiveEffect(fn, options);

    if (!options.lazy) {
        effect();
    }

    return effect;
}

// Internal helpers
const targetMap = new WeakMap();

function track(target, key) {
    // Only track if we have an active effect and a valid target
    if (activeEffect && target) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = new Set()));
        }

        // Skip if the dependency is already tracked
        if (!dep.has(activeEffect)) {
            dep.add(activeEffect);
            // Keep track of the dependency for cleanup
            activeEffect.deps.push(dep);
        }
    }
}

function trigger(target, key) {
    // Check if target is valid
    if (!target) return;

    const depsMap = targetMap.get(target);
    if (!depsMap) return;

    const effects = depsMap.get(key);
    if (effects) {
        // Create a new set to avoid infinite loops if an effect triggers itself
        const effectsToRun = new Set(effects);
        effectsToRun.forEach(effect => {
            if (effect.scheduler) {
                effect.scheduler();
            } else {
                effect();
            }
        });
    }
}

function createReactiveEffect(fn, options = {}) {
    const effect = function reactiveEffect() {
        if (!effect.active) return fn();
        if (!effectStack.includes(effect)) {
            cleanup(effect);
            try {
                effectStack.push(effect);
                activeEffect = effect;
                return fn();
            } finally {
                effectStack.pop();
                // Set activeEffect to the previous effect in the stack or null if empty
                activeEffect = effectStack.length > 0 ? effectStack[effectStack.length - 1] : null;
            }
        }
    };

    effect.deps = [];
    effect.options = options;

    // Add a setter for the active property to handle cleanup
    Object.defineProperty(effect, 'active', {
        get: () => effect._active,
        set: (value) => {
            if (effect._active !== value) {
                effect._active = value;
                if (!value) {
                    // Clean up dependencies when deactivated
                    cleanup(effect);
                }
            }
        }
    });

    effect._active = true;

    return effect;
}

function cleanup(effect) {
    const { deps } = effect;
    if (deps.length) {
        for (let i = 0; i < deps.length; i++) {
            deps[i].delete(effect);
        }
        deps.length = 0;
    }
}