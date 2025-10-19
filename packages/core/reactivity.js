/**
 * KalxJS Reactivity System
 */

// Global state for dependency tracking
let activeEffect = null;
const effectStack = [];
const targetMap = new WeakMap();

// Lifecycle hooks
const lifecycleHooks = {
    mounted: [],
    unmounted: []
};

// Dependency injection
const provides = {};

/**
 * Creates a reactive reference
 * @param {*} initialValue - The initial value
 * @returns {Object} Reactive reference
 */
export function ref(initialValue) {
    const r = {
        _isRef: true,
        _value: initialValue,
        get value() {
            track(r, 'value');
            return r._value;
        },
        set value(newValue) {
            r._value = newValue;
            trigger(r, 'value');
        }
    };
    return r;
}

/**
 * Creates a reactive object
 * @param {Object} target - The object to make reactive
 * @returns {Proxy} Reactive object
 */
export function reactive(target) {
    if (typeof target !== 'object' || target === null) {
        console.warn('reactive() expects an object');
        return target;
    }

    return new Proxy(target, {
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
        },
        deleteProperty(target, key) {
            const hadKey = key in target;
            const result = Reflect.deleteProperty(target, key);
            if (hadKey) {
                trigger(target, key);
            }
            return result;
        }
    });
}

/**
 * Creates a computed property
 * @param {Function} getter - The getter function
 * @returns {Object} Computed property
 */
export function computed(getter) {
    const result = ref(undefined);
    const effect = () => {
        result.value = getter();
    };

    watchEffect(effect);
    return result;
}

/**
 * Watches for changes in a reactive source
 * @param {Function|Object} source - The source to watch
 * @param {Function} callback - The callback to run when the source changes
 * @param {Object} options - Watch options
 */
export function watch(source, callback, options = {}) {
    const { immediate = false } = options;

    const getter = typeof source === 'function'
        ? source
        : () => source.value;

    let oldValue;

    const job = () => {
        const newValue = getter();
        callback(newValue, oldValue);
        oldValue = newValue;
    };

    const effect = watchEffect(() => {
        const value = getter();
        return value;
    }, () => job());

    if (immediate) {
        job();
    }

    return () => {
        effect.stop();
    };
}

/**
 * Creates a watch effect
 * @param {Function} fn - The effect function
 * @param {Function} scheduler - Optional scheduler
 * @returns {Object} Effect object
 */
export function watchEffect(fn, scheduler) {
    const effect = {
        fn,
        scheduler,
        deps: [],
        active: true,
        run() {
            if (!effect.active) return;

            try {
                activeEffect = effect;
                effectStack.push(effect);
                return fn();
            } finally {
                effectStack.pop();
                activeEffect = effectStack[effectStack.length - 1] || null;
            }
        },
        stop() {
            if (effect.active) {
                effect.active = false;
                effect.deps.forEach(dep => dep.delete(effect));
                effect.deps.length = 0;
            }
        }
    };

    effect.run();

    return effect;
}

/**
 * Tracks dependencies
 * @param {Object} target - The target object
 * @param {String|Symbol} key - The key to track
 */
function track(target, key) {
    if (!activeEffect) return;

    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }

    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }

    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
    }
}

/**
 * Triggers effects
 * @param {Object} target - The target object
 * @param {String|Symbol} key - The key that changed
 */
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;

    const effects = new Set();

    const add = (effectsToAdd) => {
        if (effectsToAdd) {
            effectsToAdd.forEach(effect => {
                if (effect !== activeEffect) {
                    effects.add(effect);
                }
            });
        }
    };

    add(depsMap.get(key));

    effects.forEach(effect => {
        if (effect.scheduler) {
            effect.scheduler();
        } else {
            effect.run();
        }
    });
}

/**
 * Registers a mounted hook
 * @param {Function} hook - The hook function
 */
export function onMounted(hook) {
    if (typeof hook === 'function') {
        lifecycleHooks.mounted.push(hook);
    }
}

/**
 * Registers an unmounted hook
 * @param {Function} hook - The hook function
 */
export function onUnmounted(hook) {
    if (typeof hook === 'function') {
        lifecycleHooks.unmounted.push(hook);
    }
}

/**
 * Runs mounted hooks
 */
export function runMountedHooks() {
    lifecycleHooks.mounted.forEach(hook => hook());
    lifecycleHooks.mounted = [];
}

/**
 * Runs unmounted hooks
 */
export function runUnmountedHooks() {
    lifecycleHooks.unmounted.forEach(hook => hook());
    lifecycleHooks.unmounted = [];
}

/**
 * Provides a value to child components
 * @param {String} key - The key to provide
 * @param {*} value - The value to provide
 */
export function provide(key, value) {
    provides[key] = value;
}

/**
 * Injects a provided value
 * @param {String} key - The key to inject
 * @param {*} defaultValue - Default value if not provided
 * @returns {*} The injected value
 */
export function inject(key, defaultValue) {
    if (key in provides) {
        return provides[key];
    }

    if (arguments.length > 1) {
        return defaultValue;
    }

    console.warn(`Injection "${key}" not found.`);
    return undefined;
}