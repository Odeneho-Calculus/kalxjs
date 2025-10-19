/**
 * Plugin system for KalxJS
 */
import { provide } from './reactivity.js';

/**
 * Creates a plugin installer
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