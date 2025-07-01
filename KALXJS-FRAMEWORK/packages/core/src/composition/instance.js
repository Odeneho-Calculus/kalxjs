// @kalxjs/core - Component instance management for Composition API

// Current component instance
let currentInstance = null;

/**
 * Sets the current component instance
 * @param {Object} instance - Component instance
 */
export function setCurrentInstance(instance) {
    currentInstance = instance;
}

/**
 * Gets the current component instance
 * @returns {Object} Current component instance
 */
export function getCurrentInstance() {
    if (!currentInstance) {
        console.warn('getCurrentInstance() can only be used inside setup()');
        return {};
    }
    return currentInstance;
}

const providesMap = new WeakMap();

export function provide(key, value) {
    const instance = getCurrentInstance();
    if (!instance) {
        console.warn('provide() called without active component instance.');
        return;
    }
    let provides = providesMap.get(instance);
    if (!provides) {
        provides = Object.create(null);
        providesMap.set(instance, provides);
    }
    provides[key] = value;
}

export function inject(key, defaultValue) {
    const instance = getCurrentInstance();
    if (!instance) {
        console.warn('inject() called without active component instance.');
        return defaultValue;
    }
    const provides = providesMap.get(instance);
    if (provides && key in provides) {
        return provides[key];
    }
    return defaultValue;
}
