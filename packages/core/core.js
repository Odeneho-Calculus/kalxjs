/**
 * KalxJS Core - All-in-one file
 * A lightweight and efficient JavaScript framework
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
// Create a hierarchical structure for provides
const provides = {};
// Track the current component for provide/inject
let currentComponent = null;
// Component hierarchy for injection
const componentHierarchy = [];

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
    // Store the value in the global provides object
    provides[key] = value;
    console.log(`Provided "${key}" with value:`, value);
}

/**
 * Injects a provided value
 * @param {String} key - The key to inject
 * @param {*} defaultValue - Default value if not provided
 * @returns {*} The injected value
 */
export function inject(key, defaultValue) {
    // Check if the key exists in the provides object
    if (key in provides) {
        console.log(`Injected "${key}" with value:`, provides[key]);
        return provides[key];
    }

    // Return default value if provided
    if (arguments.length > 1) {
        console.log(`Injection "${key}" not found, using default value:`, defaultValue);
        return defaultValue;
    }

    // Log warning and return undefined
    console.warn(`Injection "${key}" not found and no default value provided.`);
    return undefined;
}

/**
 * Creates a virtual node
 * @param {String|Object} tag - The tag name or component
 * @param {Object} props - The props
 * @param {Array} children - The children
 * @returns {Object} Virtual node
 */
export function h(tag, props = {}, children = []) {
    return {
        tag,
        props: props || {},
        children: Array.isArray(children) ? children : [children]
    };
}

/**
 * Creates a plugin
 * @param {Function} install - Plugin installation function
 * @returns {Object} Plugin object
 */
export function createPlugin(install) {
    return {
        install
    };
}

/**
 * Installs a plugin in the app
 * @param {Object} app - The app instance
 * @param {Object} plugin - The plugin to install
 * @param {Object} options - Plugin options
 */
export function installPlugin(app, plugin, options) {
    if (typeof plugin === 'function') {
        plugin(app, options);
    } else if (plugin && typeof plugin.install === 'function') {
        plugin.install(app, options);
    } else {
        console.warn('Invalid plugin. Plugin must be a function or an object with an install method.');
    }
}

/**
 * Provides a value to all components in the app
 * @param {Object} app - The app instance
 * @param {String} key - The key to provide
 * @param {*} value - The value to provide
 */
export function provideToApp(app, key, value) {
    provide(key, value);
}

/**
 * Creates an application instance
 * @param {Object} rootComponent - The root component
 * @returns {Object} Application instance
 */
export function createApp(rootComponent) {
    const app = {
        component: rootComponent,
        config: {
            globalProperties: {}
        },
        mount(selector) {
            const container = typeof selector === 'string'
                ? document.querySelector(selector)
                : selector;

            if (!container) {
                console.error(`Target container not found: ${selector}`);
                return;
            }

            console.log('Found container:', container);

            // Clear the container
            container.innerHTML = '';

            // Mount the component
            defaultRenderer(app.component, container);

            return app;
        },
        use(plugin, options) {
            installPlugin(app, plugin, options);
            return app;
        },
        provide(key, value) {
            provideToApp(app, key, value);
            return app;
        }
    };

    return app;
}

/**
 * Default renderer
 * @param {Object} component - The component to render
 * @param {Element} container - The container element
 */
function defaultRenderer(component, container) {
    console.log('Using default renderer');

    // Check component type
    const type = typeof component;
    console.log('Component type:', type);

    if (type === 'object') {
        console.log('Creating component with options:', component);

        // Call setup function
        const setupResult = component.setup ? component.setup() : null;

        if (typeof setupResult === 'function') {
            // Render function
            const renderResult = setupResult();
            console.log('Component render result:', renderResult);

            // Create DOM element
            const element = createElement(renderResult);
            console.log('DOM element created and appended:', element);

            // Append to container
            container.appendChild(element);

            // Run mounted hooks
            runMountedHooks();
        } else {
            console.error('Component setup must return a render function');
        }
    } else {
        console.error('Invalid component type');
    }

    console.log('Application successfully mounted with default renderer');
}

/**
 * Creates a DOM element from a virtual node
 * @param {Object} vnode - The virtual node
 * @returns {Element} DOM element
 */
function createElement(vnode) {
    if (!vnode) return null;

    // Handle text nodes
    if (typeof vnode === 'string') {
        return document.createTextNode(vnode);
    }

    // Handle component nodes
    if (typeof vnode.tag === 'object' || typeof vnode.tag === 'function') {
        const component = vnode.tag;
        const props = vnode.props || {};

        // Call setup function
        const setupResult = component.setup ? component.setup(props) : null;

        if (typeof setupResult === 'function') {
            // Render function
            const renderResult = setupResult();

            // Create DOM element
            return createElement(renderResult);
        }

        return document.createComment('Component placeholder');
    }

    // Create element
    const element = document.createElement(vnode.tag || 'div');

    // Add properties
    if (vnode.props) {
        for (const key in vnode.props) {
            if (key === 'class' || key === 'className') {
                element.className = vnode.props[key];
            } else if (key === 'style') {
                const styles = vnode.props[key];
                for (const styleName in styles) {
                    element.style[styleName] = styles[styleName];
                }
            } else if (key.startsWith('on')) {
                const eventName = key.slice(2).toLowerCase();
                element.addEventListener(eventName, vnode.props[key]);
            } else {
                element.setAttribute(key, vnode.props[key]);
            }
        }
    }

    // Add children
    if (vnode.children) {
        vnode.children.forEach(child => {
            if (child != null) {
                const childElement = createElement(child);
                if (childElement) {
                    element.appendChild(childElement);
                }
            }
        });
    }

    return element;
}