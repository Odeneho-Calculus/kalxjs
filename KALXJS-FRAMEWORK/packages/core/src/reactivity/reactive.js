// packages/core/src/reactivity/reactive.js

// Current active effect
let activeEffect = null;

/**
 * Creates a reactive object
 * @param {Object} target - Object to make reactive
 * @returns {Proxy} Reactive object
 */
export function reactive(target) {
    if (!target || typeof target !== 'object') {
        return target;
    }

    // Check if target is already a reactive object
    if (target.__isReactive) {
        return target;
    }

    const handlers = {
        get(target, key, receiver) {
            // Special case to detect reactive objects
            if (key === '__isReactive') {
                return true;
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

            // For arrays, we need to trigger on length changes too
            if (Array.isArray(target) && key === 'length') {
                trigger(target, 'length');
            }

            if (oldValue !== value) {
                trigger(target, key);
            }
            return result;
        },
        deleteProperty(target, key) {
            const hadKey = key in target;
            const result = Reflect.deleteProperty(target, key);
            if (hadKey) {
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
    // Make objects reactive when they're stored in a ref
    const _value = value && typeof value === 'object' ? reactive(value) : value;

    const r = {
        _value,
        get value() {
            track(r, 'value');
            return this._value;
        },
        set value(newValue) {
            if (this._value !== newValue) {
                // Make new value reactive if it's an object
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
 * @param {Function|Object} getterOrOptions - Getter function or options with get/set
 * @returns {Object} Computed property
 */
export function computed(getterOrOptions) {
    let getter, setter;

    if (typeof getterOrOptions === 'function') {
        getter = getterOrOptions;
        setter = () => {
            console.warn('Write operation failed: computed value is readonly');
        };
    } else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }

    // Create a ref to store the computed value
    const result = ref(undefined);

    // Use an effect to update the ref whenever dependencies change
    const runner = effect(() => {
        result.value = getter();
    }, {
        lazy: false // Run immediately to compute initial value
    });

    // Create a computed ref object with custom getter/setter
    const computedRef = {
        get value() {
            // Track this computed property as a dependency
            track(computedRef, 'value');
            return result.value;
        },
        set value(newValue) {
            setter(newValue);
        }
    };

    return computedRef;
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

    // Add a stop method to the effect
    effect.stop = () => {
        if (effect.active) {
            cleanup(effect);
            effect.active = false;
        }
    };

    return effect;
}

// Internal helpers
const targetMap = new WeakMap();

function track(target, key) {
    // Only track if we have an active effect and a valid target
    if (activeEffect && activeEffect.active && target) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = new Set()));
        }

        // Add this dependency to the effect
        if (!dep.has(activeEffect)) {
            dep.add(activeEffect);
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
        const effectsToRun = new Set();

        // Only add active effects to the set of effects to run
        effects.forEach(effect => {
            if (effect.active) {
                effectsToRun.add(effect);
            }
        });

        effectsToRun.forEach(effect => {
            if (effect.scheduler) {
                effect.scheduler();
            } else {
                effect();
            }
        });
    }
}

function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        // If the effect is not active, just return the result without tracking
        if (!effect.active) return fn();

        if (!effectStack.includes(effect)) {
            // Clean up dependencies before running the effect
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

    effect.active = true;
    effect.deps = [];
    effect.options = options;
    return effect;
}

const effectStack = [];

function cleanup(effect) {
    const { deps } = effect;
    if (deps.length) {
        for (let i = 0; i < deps.length; i++) {
            deps[i].delete(effect);
        }
        deps.length = 0;
    }
}