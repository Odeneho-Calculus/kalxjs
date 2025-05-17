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