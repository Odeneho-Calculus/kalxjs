import { createApp } from '@kalxjs/core';

/**
 * Plugin system for extending application functionality
 */
export const plugins = {
  _registry: new Map(),
  _hooks: new Map(),

  /**
   * Register a plugin
   * @param {string} name - Plugin name
   * @param {Object} plugin - Plugin object
   * @param {Object} options - Plugin options
   */
  register(name, plugin, options = {}) {
    if (this._registry.has(name)) {
      console.warn(`Plugin "${name}" is already registered. It will be overwritten.`);
    }

    this._registry.set(name, { plugin, options });

    // Initialize plugin if it has an install method
    if (plugin.install && typeof plugin.install === 'function') {
      plugin.install(options);
    }

    return this;
  },

  /**
   * Get a registered plugin
   * @param {string} name - Plugin name
   * @returns {Object|null} Plugin object or null if not found
   */
  get(name) {
    const entry = this._registry.get(name);
    return entry ? entry.plugin : null;
  },

  /**
   * Check if a plugin is registered
   * @param {string} name - Plugin name
   * @returns {boolean} True if plugin is registered
   */
  has(name) {
    return this._registry.has(name);
  },

  /**
   * Unregister a plugin
   * @param {string} name - Plugin name
   */
  unregister(name) {
    const entry = this._registry.get(name);

    if (entry && entry.plugin.uninstall && typeof entry.plugin.uninstall === 'function') {
      entry.plugin.uninstall();
    }

    this._registry.delete(name);
    return this;
  },

  /**
   * Register a hook
   * @param {string} name - Hook name
   * @param {Function} callback - Hook callback
   * @param {Object} options - Hook options
   */
  hook(name, callback, options = {}) {
    if (!this._hooks.has(name)) {
      this._hooks.set(name, []);
    }

    this._hooks.get(name).push({ callback, options });
    return this;
  },

  /**
   * Execute a hook
   * @param {string} name - Hook name
   * @param {...any} args - Arguments to pass to hook callbacks
   * @returns {Promise<Array>} Results from hook callbacks
   */
  async executeHook(name, ...args) {
    if (!this._hooks.has(name)) {
      return [];
    }

    const hooks = this._hooks.get(name);
    const results = [];

    for (const hook of hooks) {
      try {
        const result = await hook.callback(...args);
        results.push(result);
      } catch (error) {
        console.error(`Error executing hook "${name}":`, error);
        if (hook.options.throwError) {
          throw error;
        }
      }
    }

    return results;
  },

  /**
   * Apply all plugins to an app instance
   * @param {Object} app - App instance
   */
  applyToApp(app) {
    for (const [name, entry] of this._registry.entries()) {
      if (entry.plugin.applyToApp && typeof entry.plugin.applyToApp === 'function') {
        entry.plugin.applyToApp(app, entry.options);
      }
    }

    return app;
  }
};

/**
 * Create a plugin
 * @param {Object} options - Plugin configuration
 * @returns {Object} Plugin object
 */
export function createPlugin(options) {
  const {
    name,
    install,
    uninstall,
    applyToApp,
    hooks = {},
    ...rest
  } = options;

  const plugin = {
    name,
    install,
    uninstall,
    applyToApp,
    ...rest
  };

  // Register hooks
  Object.entries(hooks).forEach(([hookName, callback]) => {
    plugins.hook(hookName, callback);
  });

  return plugin;
}