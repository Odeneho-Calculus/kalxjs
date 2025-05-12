// packages/core/src/reactivity/reactive.js

// Current active effect
let activeEffect = null;

/**
 * Creates a reactive object
 * @param {Object} target - Object to make reactive
 * @returns {Proxy} Reactive object
 */
export function reactive(target) {
    const handlers = {
        get(target, key, receiver) {
            const result = Reflect.get(target, key, receiver);
            track(target, key);
            return result;
        },
        set(target, key, value, receiver) {
            const oldValue = target[key];
            const result = Reflect.set(target, key, value, receiver);
            if (oldValue !== value) {
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
    const r = {
        _value: value,
        get value() {
            track(r, 'value');
            return this._value;
        },
        set value(newValue) {
            if (this._value !== newValue) {
                this._value = newValue;
                trigger(r, 'value');
            }
        }
    };
    return r;
}

/**
 * Creates a computed property
 * @param {Function} getter - Getter function
 * @returns {Object} Computed property
 */
export function computed(getter) {
    let value;
    let dirty = true;

    const runner = effect(getter, {
        lazy: true,
        scheduler: () => {
            if (!dirty) {
                dirty = true;
                trigger(computedRef, 'value');
            }
        }
    });

    const computedRef = {
        get value() {
            if (dirty) {
                value = runner();
                dirty = false;
            }
            track(computedRef, 'value');
            return value;
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
        dep.add(activeEffect);
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

function createReactiveEffect(fn, options) {
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