import { createPlugin } from './index';

/**
 * Logger plugin for application-wide logging
 */
export const loggerPlugin = createPlugin({
  name: 'logger',

  // Plugin state
  _config: {
    level: 'info',
    prefix: '[App]',
    enabled: true,
    console: true,
    custom: null
  },

  // Log levels
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  },

  /**
   * Install the plugin
   * @param {Object} options - Plugin options
   */
  install(options = {}) {
    this._config = { ...this._config, ...options };

    // Register global error handler if enabled
    if (this._config.catchErrors) {
      window.addEventListener('error', (event) => {
        this.error('Uncaught error:', event.error);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection:', event.reason);
      });
    }
  },

  /**
   * Apply plugin to app instance
   * @param {Object} app - App instance
   * @param {Object} options - Plugin options
   */
  applyToApp(app, options = {}) {
    // Add logger to app instance
    app.logger = this;

    // Add logger to app context
    app.provide('logger', this);
  },

  /**
   * Check if a log level is enabled
   * @param {string} level - Log level
   * @returns {boolean} True if level is enabled
   */
  isLevelEnabled(level) {
    return this._config.enabled &&
           this.levels[level] >= this.levels[this._config.level];
  },

  /**
   * Format log message
   * @param {string} level - Log level
   * @param {Array} args - Log arguments
   * @returns {Array} Formatted log arguments
   */
  formatLog(level, args) {
    const timestamp = new Date().toISOString();
    const prefix = this._config.prefix;
    return [`${prefix} [${timestamp}] [${level.toUpperCase()}]`, ...args];
  },

  /**
   * Log a message
   * @param {string} level - Log level
   * @param {...any} args - Log arguments
   */
  log(level, ...args) {
    if (!this.isLevelEnabled(level)) return;

    const formattedArgs = this.formatLog(level, args);

    // Console logging
    if (this._config.console) {
      switch (level) {
        case 'debug':
          console.debug(...formattedArgs);
          break;
        case 'info':
          console.info(...formattedArgs);
          break;
        case 'warn':
          console.warn(...formattedArgs);
          break;
        case 'error':
          console.error(...formattedArgs);
          break;
        default:
          console.log(...formattedArgs);
      }
    }

    // Custom logger
    if (this._config.custom && typeof this._config.custom === 'function') {
      this._config.custom(level, formattedArgs);
    }
  },

  // Convenience methods
  debug(...args) { this.log('debug', ...args); },
  info(...args) { this.log('info', ...args); },
  warn(...args) { this.log('warn', ...args); },
  error(...args) { this.log('error', ...args); },

  /**
   * Set log level
   * @param {string} level - Log level
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this._config.level = level;
    }
  },

  /**
   * Enable or disable logging
   * @param {boolean} enabled - Whether logging is enabled
   */
  setEnabled(enabled) {
    this._config.enabled = !!enabled;
  }
});