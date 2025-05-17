// @kalxjs/core - Lifecycle hooks for Composition API

import { getCurrentInstance } from './instance.js';

/**
 * Runs a callback when the component is created
 * @param {Function} callback - Callback function
 */
export function onCreated(callback) {
    const instance = getCurrentInstance();
    if (!instance.created) {
        instance.created = [];
    }
    instance.created.push(callback);
}

/**
 * Runs a callback before the component is mounted
 * @param {Function} callback - Callback function
 */
export function onBeforeMount(callback) {
    const instance = getCurrentInstance();
    if (!instance.beforeMount) {
        instance.beforeMount = [];
    }
    instance.beforeMount.push(callback);
}

/**
 * Runs a callback when the component is mounted
 * @param {Function} callback - Callback function
 */
export function onMounted(callback) {
    const instance = getCurrentInstance();
    if (!instance.mounted) {
        instance.mounted = [];
    }
    instance.mounted.push(callback);
}

/**
 * Runs a callback before the component is updated
 * @param {Function} callback - Callback function
 */
export function onBeforeUpdate(callback) {
    const instance = getCurrentInstance();
    if (!instance.beforeUpdate) {
        instance.beforeUpdate = [];
    }
    instance.beforeUpdate.push(callback);
}

/**
 * Runs a callback when the component is updated
 * @param {Function} callback - Callback function
 */
export function onUpdated(callback) {
    const instance = getCurrentInstance();
    if (!instance.updated) {
        instance.updated = [];
    }
    instance.updated.push(callback);
}

/**
 * Runs a callback before the component is unmounted
 * @param {Function} callback - Callback function
 */
export function onBeforeUnmount(callback) {
    const instance = getCurrentInstance();
    if (!instance.beforeUnmount) {
        instance.beforeUnmount = [];
    }
    instance.beforeUnmount.push(callback);
}

/**
 * Runs a callback when the component is unmounted
 * @param {Function} callback - Callback function
 */
export function onUnmounted(callback) {
    const instance = getCurrentInstance();
    if (!instance.unmounted) {
        instance.unmounted = [];
    }
    instance.unmounted.push(callback);
}

/**
 * Runs a callback when an error occurs in the component
 * @param {Function} callback - Callback function
 */
export function onErrorCaptured(callback) {
    const instance = getCurrentInstance();
    if (!instance.errorCaptured) {
        instance.errorCaptured = [];
    }
    instance.errorCaptured.push(callback);
}