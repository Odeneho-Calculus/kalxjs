/**
 * Global Error Handler - Centralized error handling
 */

const errorHandlers = new Set();
const errorHistory = [];
const MAX_HISTORY = 50;

/**
 * Global error handler configuration
 */
export const errorConfig = {
    silent: false,
    logErrors: true,
    throwUnhandled: false
};

/**
 * Registers a global error handler
 * @param {Function} handler - Error handler function
 * @returns {Function} Unregister function
 */
export function registerErrorHandler(handler) {
    errorHandlers.add(handler);

    return () => {
        errorHandlers.delete(handler);
    };
}

/**
 * Handles an error through all registered handlers
 * @param {Error} error - Error object
 * @param {Object} context - Error context
 */
export function handleError(error, context = {}) {
    // Add to history
    errorHistory.push({
        error,
        context,
        timestamp: new Date()
    });

    // Trim history
    if (errorHistory.length > MAX_HISTORY) {
        errorHistory.shift();
    }

    // Log error if configured
    if (errorConfig.logErrors && !errorConfig.silent) {
        console.error('[KALXJS Error]', error);
        if (context.info) {
            console.error('Context:', context);
        }
    }

    // Call all handlers
    let handled = false;
    errorHandlers.forEach(handler => {
        try {
            const result = handler(error, context);
            if (result === true) {
                handled = true;
            }
        } catch (handlerError) {
            console.error('[KALXJS] Error in error handler:', handlerError);
        }
    });

    // Throw if unhandled and configured
    if (!handled && errorConfig.throwUnhandled) {
        throw error;
    }

    return handled;
}

/**
 * Gets error history
 * @param {number} limit - Max number of errors to return
 * @returns {Array} Error history
 */
export function getErrorHistory(limit = 10) {
    return errorHistory.slice(-limit);
}

/**
 * Clears error history
 */
export function clearErrorHistory() {
    errorHistory.length = 0;
}

/**
 * Configures global error handling
 * @param {Object} config - Configuration object
 */
export function configureErrorHandling(config) {
    Object.assign(errorConfig, config);
}