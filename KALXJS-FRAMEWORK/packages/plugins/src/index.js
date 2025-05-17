/**
 * Plugin system for KalxJS
 */

/**
 * Create a plugin with lifecycle hooks and functionality
 * @param {Object} options - Plugin options
 * @returns {Object} Plugin object
 */
export function createPlugin(options = {}) {
    const {
        name,
        install,
        beforeCreate,
        created,
        beforeMount,
        mounted,
        beforeUpdate,
        updated,
        beforeUnmount,
        unmounted,
        errorCaptured,
        exposed = {}
    } = options;

    if (!name) {
        console.warn('Plugin created without a name. Consider adding a name for debugging purposes.');
    }

    if (!install || typeof install !== 'function') {
        throw new Error('Plugin must have an install function');
    }

    return {
        name,
        install,
        hooks: {
            beforeCreate,
            created,
            beforeMount,
            mounted,
            beforeUpdate,
            updated,
            beforeUnmount,
            unmounted,
            errorCaptured
        },
        exposed
    };
}

/**
 * Plugin manager for KalxJS applications
 */
export class PluginManager {
    constructor(app) {
        this.app = app;
        this.plugins = new Map();
        this.hooks = {
            beforeCreate: [],
            created: [],
            beforeMount: [],
            mounted: [],
            beforeUpdate: [],
            updated: [],
            beforeUnmount: [],
            unmounted: [],
            errorCaptured: []
        };
        this.exposed = {};
    }

    /**
     * Register a plugin with the application
     * @param {Object} plugin - Plugin to register
     * @param {Object} options - Plugin options
     * @returns {PluginManager} Plugin manager instance for chaining
     */
    use(plugin, options = {}) {
        if (!plugin || typeof plugin.install !== 'function') {
            console.error('Invalid plugin. Plugin must have an install function.');
            return this;
        }

        const pluginName = plugin.name || 'anonymous-plugin';

        if (this.plugins.has(pluginName)) {
            console.warn(`Plugin "${pluginName}" is already registered. Skipping.`);
            return this;
        }

        // Register plugin
        this.plugins.set(pluginName, plugin);

        // Register hooks
        if (plugin.hooks) {
            Object.entries(plugin.hooks).forEach(([hookName, hookFn]) => {
                if (hookFn && typeof hookFn === 'function' && this.hooks[hookName]) {
                    this.hooks[hookName].push(hookFn);
                }
            });
        }

        // Register exposed methods and properties
        if (plugin.exposed) {
            Object.entries(plugin.exposed).forEach(([key, value]) => {
                if (this.exposed[key]) {
                    console.warn(`Plugin "${pluginName}" is overriding existing exposed property "${key}".`);
                }
                this.exposed[key] = value;
            });
        }

        // Install plugin
        try {
            plugin.install(this.app, options, this);
        } catch (error) {
            console.error(`Error installing plugin "${pluginName}":`, error);
        }

        return this;
    }

    /**
     * Call a specific lifecycle hook
     * @param {string} hookName - Name of the hook to call
     * @param {...any} args - Arguments to pass to the hook
     */
    callHook(hookName, ...args) {
        if (!this.hooks[hookName]) {
            return;
        }

        for (const hook of this.hooks[hookName]) {
            try {
                hook(...args);
            } catch (error) {
                console.error(`Error in "${hookName}" hook:`, error);
                this.callHook('errorCaptured', error, hookName);
            }
        }
    }

    /**
     * Get a plugin by name
     * @param {string} name - Plugin name
     * @returns {Object|undefined} Plugin or undefined if not found
     */
    getPlugin(name) {
        return this.plugins.get(name);
    }

    /**
     * Check if a plugin is registered
     * @param {string} name - Plugin name
     * @returns {boolean} True if plugin is registered
     */
    hasPlugin(name) {
        return this.plugins.has(name);
    }

    /**
     * Get all registered plugins
     * @returns {Map} Map of registered plugins
     */
    getPlugins() {
        return this.plugins;
    }

    /**
     * Get exposed methods and properties
     * @returns {Object} Exposed methods and properties
     */
    getExposed() {
        return this.exposed;
    }
}

/**
 * Create a logger plugin
 * @param {Object} options - Logger options
 * @returns {Object} Logger plugin
 */
export function createLoggerPlugin(options = {}) {
    const {
        level = 'info',
        prefix = '[KalxJS]',
        enabled = true,
        logTime = true,
        logToConsole = true,
        customLogger = null
    } = options;

    const levels = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    };

    const currentLevelValue = levels[level] || 1;

    const shouldLog = (msgLevel) => {
        return enabled && (levels[msgLevel] >= currentLevelValue);
    };

    const formatMessage = (msg) => {
        let formattedMsg = `${prefix} `;
        if (logTime) {
            formattedMsg += `[${new Date().toISOString()}] `;
        }
        return formattedMsg + msg;
    };

    const logger = {
        debug: (msg, ...args) => {
            if (shouldLog('debug')) {
                if (customLogger && typeof customLogger.debug === 'function') {
                    customLogger.debug(formatMessage(msg), ...args);
                } else if (logToConsole) {
                    console.debug(formatMessage(msg), ...args);
                }
            }
        },
        info: (msg, ...args) => {
            if (shouldLog('info')) {
                if (customLogger && typeof customLogger.info === 'function') {
                    customLogger.info(formatMessage(msg), ...args);
                } else if (logToConsole) {
                    console.info(formatMessage(msg), ...args);
                }
            }
        },
        warn: (msg, ...args) => {
            if (shouldLog('warn')) {
                if (customLogger && typeof customLogger.warn === 'function') {
                    customLogger.warn(formatMessage(msg), ...args);
                } else if (logToConsole) {
                    console.warn(formatMessage(msg), ...args);
                }
            }
        },
        error: (msg, ...args) => {
            if (shouldLog('error')) {
                if (customLogger && typeof customLogger.error === 'function') {
                    customLogger.error(formatMessage(msg), ...args);
                } else if (logToConsole) {
                    console.error(formatMessage(msg), ...args);
                }
            }
        }
    };

    return createPlugin({
        name: 'logger',
        install: (app) => {
            app.logger = logger;
        },
        mounted: () => {
            logger.info('Application mounted');
        },
        errorCaptured: (err) => {
            logger.error('Error captured:', err);
        },
        exposed: {
            logger
        }
    });
}

/**
 * Create a state persistence plugin
 * @param {Object} options - Persistence options
 * @returns {Object} Persistence plugin
 */
export function createPersistencePlugin(options = {}) {
    const {
        key = 'kalxjs-state',
        storage = localStorage,
        paths = null,
        saveOnChange = true,
        restoreOnStart = true,
        serialize = JSON.stringify,
        deserialize = JSON.parse
    } = options;

    let state = null;

    const saveState = () => {
        if (!state) return;

        try {
            let stateToSave = state;

            // If paths are specified, only save those paths
            if (paths && Array.isArray(paths) && paths.length > 0) {
                stateToSave = {};
                paths.forEach(path => {
                    const parts = path.split('.');
                    let value = state;
                    let valid = true;

                    for (const part of parts) {
                        if (value === undefined || value === null) {
                            valid = false;
                            break;
                        }
                        value = value[part];
                    }

                    if (valid) {
                        let target = stateToSave;
                        for (let i = 0; i < parts.length - 1; i++) {
                            const part = parts[i];
                            if (!target[part]) {
                                target[part] = {};
                            }
                            target = target[part];
                        }
                        target[parts[parts.length - 1]] = value;
                    }
                });
            }

            storage.setItem(key, serialize(stateToSave));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    };

    const restoreState = () => {
        try {
            const savedState = storage.getItem(key);
            if (savedState) {
                const parsed = deserialize(savedState);

                // If paths are specified, only restore those paths
                if (paths && Array.isArray(paths) && paths.length > 0) {
                    paths.forEach(path => {
                        const parts = path.split('.');
                        let source = parsed;
                        let target = state;
                        let valid = true;

                        // Navigate to the correct location in the source
                        for (let i = 0; i < parts.length - 1; i++) {
                            if (source === undefined || source === null) {
                                valid = false;
                                break;
                            }
                            source = source[parts[i]];

                            // Create path in target if it doesn't exist
                            if (!target[parts[i]]) {
                                target[parts[i]] = {};
                            }
                            target = target[parts[i]];
                        }

                        // Set the value if the path is valid
                        const lastPart = parts[parts.length - 1];
                        if (valid && source !== undefined && source !== null && source[lastPart] !== undefined) {
                            target[lastPart] = source[lastPart];
                        }
                    });
                } else {
                    // Restore entire state
                    Object.assign(state, parsed);
                }
            }
        } catch (error) {
            console.error('Error restoring state:', error);
        }
    };

    return createPlugin({
        name: 'persistence',
        install: (app, _, pluginManager) => {
            // Get state from the app
            if (app.state) {
                state = app.state;
            } else if (pluginManager && pluginManager.getPlugin('state')) {
                const statePlugin = pluginManager.getPlugin('state');
                if (statePlugin.exposed && statePlugin.exposed.state) {
                    state = statePlugin.exposed.state;
                }
            }

            if (!state) {
                console.warn('Persistence plugin: No state found to persist');
                return;
            }

            // Restore state on start
            if (restoreOnStart) {
                restoreState();
            }

            // Save state on change
            if (saveOnChange && state) {
                // Use a proxy to detect changes if available
                if (typeof Proxy !== 'undefined') {
                    const handler = {
                        set(target, prop, value) {
                            target[prop] = value;
                            saveState();
                            return true;
                        }
                    };

                    app.state = new Proxy(state, handler);
                } else {
                    // Fallback: save on beforeUnmount
                    pluginManager.hooks.beforeUnmount.push(saveState);
                }
            }

            // Expose methods
            app.saveState = saveState;
            app.restoreState = restoreState;
        },
        beforeUnmount: () => {
            if (!saveOnChange) {
                saveState();
            }
        },
        exposed: {
            saveState,
            restoreState
        }
    });
}