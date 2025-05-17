// @kalxjs/core - Plugin system

/**
 * Creates a plugin for KalxJS
 * @param {Object} options - Plugin options
 * @returns {Object} Plugin object
 */
export function createPlugin(options) {
    const { name, install, version = '1.0.0' } = options;

    if (!name) {
        console.warn('Plugin name is required');
    }

    if (typeof install !== 'function') {
        console.warn('Plugin install method is required');
    }

    return {
        name,
        version,
        install
    };
}

/**
 * Plugin manager for KalxJS
 */
export class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.app = null;
    }

    /**
     * Sets the application instance
     * @param {Object} app - Application instance
     */
    setApp(app) {
        this.app = app;
    }

    /**
     * Installs a plugin
     * @param {Object} plugin - Plugin object
     * @param {Object} options - Plugin options
     * @returns {PluginManager} Plugin manager instance for chaining
     */
    use(plugin, options = {}) {
        if (!plugin) {
            console.warn('Plugin is required');
            return this;
        }

        const { name } = plugin;

        // Skip if plugin is already installed
        if (name && this.plugins.has(name)) {
            console.warn(`Plugin "${name}" is already installed`);
            return this;
        }

        // Install the plugin
        if (typeof plugin.install === 'function') {
            plugin.install(this.app, options);
        } else if (typeof plugin === 'function') {
            plugin(this.app, options);
        } else {
            console.warn('Invalid plugin format');
            return this;
        }

        // Store the plugin
        if (name) {
            this.plugins.set(name, plugin);
        }

        return this;
    }

    /**
     * Checks if a plugin is installed
     * @param {string} name - Plugin name
     * @returns {boolean} Whether the plugin is installed
     */
    has(name) {
        return this.plugins.has(name);
    }

    /**
     * Gets a plugin by name
     * @param {string} name - Plugin name
     * @returns {Object} Plugin object
     */
    get(name) {
        return this.plugins.get(name);
    }

    /**
     * Uninstalls a plugin
     * @param {string} name - Plugin name
     * @returns {boolean} Whether the plugin was uninstalled
     */
    uninstall(name) {
        const plugin = this.plugins.get(name);

        if (!plugin) {
            console.warn(`Plugin "${name}" is not installed`);
            return false;
        }

        // Call uninstall method if it exists
        if (typeof plugin.uninstall === 'function') {
            plugin.uninstall(this.app);
        }

        // Remove the plugin
        return this.plugins.delete(name);
    }
}