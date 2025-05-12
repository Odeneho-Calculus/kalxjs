// Logger Plugin for KalxJS
import { createPlugin } from '@kalxjs/core';

// Create a simple logger plugin
export const LoggerPlugin = createPlugin({
    name: 'logger',
    version: '1.0.0',
    install(app, options = {}) {
        const { level = 'info', prefix = '[KalxJS]' } = options;

        // Define log levels
        const levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };

        // Create logger methods
        const logger = {
            debug(...args) {
                if (levels[level] <= levels.debug) {
                    console.debug(prefix, ...args);
                }
            },

            info(...args) {
                if (levels[level] <= levels.info) {
                    console.info(prefix, ...args);
                }
            },

            warn(...args) {
                if (levels[level] <= levels.warn) {
                    console.warn(prefix, ...args);
                }
            },

            error(...args) {
                if (levels[level] <= levels.error) {
                    console.error(prefix, ...args);
                }
            }
        };

        // Add logger to the app
        app.logger = logger;

        // Add logger to all components
        app.mixin({
            created() {
                this.$logger = logger;
            }
        });

        // Log app creation
        logger.info('App created');
    }
});

// Usage example:
// import { createApp } from '@kalxjs/core';
// import { LoggerPlugin } from './logger-plugin';
//
// const app = createApp({...});
// app.use(LoggerPlugin, { level: 'debug', prefix: '[MyApp]' });
// app.mount('#app');