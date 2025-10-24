/**
 * KALXJS DevTools Cross-Context Communication Bridge
 * Secure and efficient message passing between extension contexts
 */

import { MESSAGE_TYPES, MESSAGE_ORIGINS, ERROR_CODES } from './constants.js';
import { createLogger, validateMessage, generateId, createError } from './utils.js';

const logger = createLogger('Bridge');

/**
 * Message Bridge for cross-context communication
 */
export class MessageBridge {
    constructor(origin, options = {}) {
        this.origin = origin;
        this.options = {
            timeout: 5000,
            retryAttempts: 3,
            enableLogging: process.env.NODE_ENV === 'development',
            ...options
        };

        this.listeners = new Map();
        this.pendingRequests = new Map();
        this.connected = false;

        this._setupMessageHandlers();

        logger.info(`Bridge initialized for origin: ${origin}`);
    }

    /**
     * Setup message handlers based on context
     */
    _setupMessageHandlers() {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            // Extension context
            chrome.runtime.onMessage.addListener(this._handleRuntimeMessage.bind(this));
        }

        if (typeof window !== 'undefined') {
            // Window context (content script/injected script)
            window.addEventListener('message', this._handleWindowMessage.bind(this));
        }
    }

    /**
     * Handle chrome.runtime messages
     */
    _handleRuntimeMessage(message, sender, sendResponse) {
        logger.debug('Runtime message received:', message, sender);

        const validation = validateMessage(message);
        if (!validation.valid) {
            logger.warn('Invalid runtime message:', validation.error);
            if (sendResponse) sendResponse({ error: 'Invalid message format' });
            return false;
        }

        // Only return true for async operations if we actually have a requestId and will send a response
        const hasListeners = this.listeners.has(message.type) && this.listeners.get(message.type).length > 0;
        const willSendAsyncResponse = message.requestId && hasListeners && sendResponse;

        if (willSendAsyncResponse) {
            // Process async and keep channel open
            this._processMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        } else {
            // Process sync or no response needed
            this._processMessage(message, sender, sendResponse);
            return false; // Close message channel immediately
        }
    }

    /**
     * Handle window.postMessage messages
     */
    _handleWindowMessage(event) {
        // Validate origin and source
        if (event.source !== window || !event.data) return;

        const message = event.data;
        if (!message.source || !message.source.startsWith('kalxjs-devtools')) return;

        logger.debug('Window message received:', message);

        const validation = validateMessage(message);
        if (!validation.valid) {
            logger.warn('Invalid window message:', validation.error);
            return;
        }

        this._processMessage(message, { source: event.source }, null);
    }

    /**
     * Process incoming message
     */
    _processMessage(message, sender, sendResponse) {
        const { type, data, requestId, isResponse } = message;

        // Handle response messages
        if (isResponse && requestId) {
            const pendingRequest = this.pendingRequests.get(requestId);
            if (pendingRequest) {
                clearTimeout(pendingRequest.timeout);
                this.pendingRequests.delete(requestId);

                if (data.error) {
                    pendingRequest.reject(createError(data.error.code, data.error.message));
                } else {
                    pendingRequest.resolve(data.result);
                }
            }
            return;
        }

        // Handle request messages
        const listeners = this.listeners.get(type) || [];

        if (listeners.length === 0) {
            logger.warn(`No listeners for message type: ${type}`);
            return;
        }

        // Execute listeners (only first one sends response)
        if (sendResponse && requestId) {
            // Handle async listeners properly for requests
            (async () => {
                let responsesSent = 0;

                for (const listener of listeners) {
                    try {
                        const result = await listener(data, sender);

                        // Only first successful listener sends response
                        if (responsesSent === 0) {
                            responsesSent++;
                            sendResponse({
                                type,
                                origin: this.origin,
                                data: { result },
                                requestId,
                                isResponse: true
                            });
                            break; // Stop after first successful response
                        }
                    } catch (error) {
                        logger.error('Listener error:', error);

                        // Send error response if no successful response was sent
                        if (responsesSent === 0) {
                            responsesSent++;
                            sendResponse({
                                type,
                                origin: this.origin,
                                data: {
                                    error: {
                                        code: error.code || ERROR_CODES.COMMUNICATION_FAILED,
                                        message: error.message
                                    }
                                },
                                requestId,
                                isResponse: true
                            });
                            break; // Stop after sending error response
                        }
                    }
                }
            })();
        } else {
            // For non-request messages, execute listeners without response
            listeners.forEach(listener => {
                try {
                    listener(data, sender);
                } catch (error) {
                    logger.error('Listener error:', error);
                }
            });
        }
    }

    /**
     * Send message to specific target
     */
    async send(target, type, data, options = {}) {
        const message = {
            type,
            origin: this.origin,
            data,
            timestamp: Date.now(),
            requestId: options.expectResponse ? generateId('req') : undefined
        };

        logger.debug(`Sending message to ${target}:`, message);

        try {
            if (target === 'runtime' || target === 'background') {
                return await this._sendRuntimeMessage(message, options);
            } else if (target === 'content-script' || target === 'injected') {
                return await this._sendTabMessage(message, options);
            } else if (target === 'window') {
                return await this._sendWindowMessage(message, options);
            } else {
                throw createError(ERROR_CODES.COMMUNICATION_FAILED, `Unknown target: ${target}`);
            }
        } catch (error) {
            logger.error('Send message failed:', error);
            throw error;
        }
    }

    /**
     * Send chrome.runtime message
     */
    async _sendRuntimeMessage(message, options) {
        if (!chrome.runtime) {
            throw createError(ERROR_CODES.COMMUNICATION_FAILED, 'Chrome runtime not available');
        }

        if (options.expectResponse) {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.pendingRequests.delete(message.requestId);
                    reject(createError(ERROR_CODES.COMMUNICATION_FAILED, 'Request timeout'));
                }, options.timeout || this.options.timeout);

                this.pendingRequests.set(message.requestId, {
                    resolve,
                    reject,
                    timeout
                });

                chrome.runtime.sendMessage(message, (response) => {
                    if (chrome.runtime.lastError) {
                        // Connection error - cleanup and reject
                        clearTimeout(timeout);
                        this.pendingRequests.delete(message.requestId);
                        reject(createError(ERROR_CODES.COMMUNICATION_FAILED,
                            chrome.runtime.lastError.message || 'Connection failed'));
                    }
                    // Response will be handled by _handleRuntimeMessage if successful
                });
            });
        } else {
            chrome.runtime.sendMessage(message, () => {
                // Consume error silently for fire-and-forget messages
                if (chrome.runtime.lastError) {
                    logger.debug('Message send failed (non-critical):', chrome.runtime.lastError.message);
                }
            });
        }
    }

    /**
     * Send message to active tab
     */
    async _sendTabMessage(message, options) {
        if (!chrome.tabs) {
            throw createError(ERROR_CODES.COMMUNICATION_FAILED, 'Chrome tabs API not available');
        }

        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) {
            throw createError(ERROR_CODES.COMMUNICATION_FAILED, 'No active tab found');
        }

        const tabId = tabs[0].id;

        if (options.expectResponse) {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.pendingRequests.delete(message.requestId);
                    reject(createError(ERROR_CODES.COMMUNICATION_FAILED, 'Request timeout'));
                }, options.timeout || this.options.timeout);

                this.pendingRequests.set(message.requestId, {
                    resolve,
                    reject,
                    timeout
                });

                chrome.tabs.sendMessage(tabId, message, (response) => {
                    if (chrome.runtime.lastError) {
                        // Connection error - cleanup and reject
                        clearTimeout(timeout);
                        this.pendingRequests.delete(message.requestId);
                        reject(createError(ERROR_CODES.COMMUNICATION_FAILED,
                            chrome.runtime.lastError.message || 'Tab connection failed'));
                    }
                    // Response will be handled by _handleRuntimeMessage if successful
                });
            });
        } else {
            chrome.tabs.sendMessage(tabId, message, () => {
                // Consume error silently for fire-and-forget messages
                if (chrome.runtime.lastError) {
                    logger.debug('Tab message send failed (non-critical):', chrome.runtime.lastError.message);
                }
            });
        }
    }

    /**
     * Send window.postMessage
     */
    async _sendWindowMessage(message, options) {
        if (typeof window === 'undefined' || this._isServiceWorker()) {
            throw createError(ERROR_CODES.COMMUNICATION_FAILED, 'Window not available in service worker context');
        }

        // Add source identifier for window messages
        message.source = `kalxjs-devtools-${this.origin}`;

        if (options.expectResponse) {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.pendingRequests.delete(message.requestId);
                    reject(createError(ERROR_CODES.COMMUNICATION_FAILED, 'Request timeout'));
                }, options.timeout || this.options.timeout);

                this.pendingRequests.set(message.requestId, {
                    resolve,
                    reject,
                    timeout
                });

                window.postMessage(message, '*');
            });
        } else {
            window.postMessage(message, '*');
        }
    }

    /**
     * Broadcast message to all contexts
     */
    async broadcast(type, data, options = {}) {
        // Determine available targets based on context
        const targets = [];

        // Runtime is always available in service workers and content scripts
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            targets.push('runtime');
        }

        // Window is only available in content scripts and pages (not service workers)
        if (typeof window !== 'undefined' && !this._isServiceWorker()) {
            targets.push('window');
        }

        // If no targets available, log warning and return
        if (targets.length === 0) {
            logger.warn('No broadcast targets available in current context');
            return;
        }

        const promises = targets.map(target =>
            this.send(target, type, data, { ...options, expectResponse: false })
                .catch(error => logger.warn(`Broadcast to ${target} failed:`, error))
        );

        await Promise.allSettled(promises);
    }

    /**
     * Check if running in service worker context
     */
    _isServiceWorker() {
        return typeof importScripts === 'function' &&
            typeof window === 'undefined' &&
            typeof self !== 'undefined';
    }

    /**
     * Listen for specific message type
     */
    on(type, listener) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }

        this.listeners.get(type).push(listener);

        logger.debug(`Listener registered for type: ${type}`);

        // Return unsubscribe function
        return () => this.off(type, listener);
    }

    /**
     * Remove listener for message type
     */
    off(type, listener) {
        const listeners = this.listeners.get(type);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
                logger.debug(`Listener removed for type: ${type}`);
            }
        }
    }

    /**
     * Remove all listeners for a type or all types
     */
    removeAllListeners(type = null) {
        if (type) {
            this.listeners.delete(type);
        } else {
            this.listeners.clear();
        }

        logger.debug(`All listeners removed${type ? ` for type: ${type}` : ''}`);
    }

    /**
     * Connect to bridge
     */
    connect() {
        if (this.connected) return;

        this.connected = true;
        this.broadcast(MESSAGE_TYPES.BRIDGE_CONNECT, { origin: this.origin });

        logger.info('Bridge connected');
    }

    /**
     * Disconnect from bridge
     */
    disconnect() {
        if (!this.connected) return;

        this.connected = false;
        this.broadcast(MESSAGE_TYPES.BRIDGE_DISCONNECT, { origin: this.origin });

        // Clear pending requests
        this.pendingRequests.forEach(request => {
            clearTimeout(request.timeout);
            request.reject(createError(ERROR_CODES.COMMUNICATION_FAILED, 'Bridge disconnected'));
        });
        this.pendingRequests.clear();

        logger.info('Bridge disconnected');
    }

    /**
     * Get connection status
     */
    isConnected() {
        return this.connected;
    }

    /**
     * Get bridge statistics
     */
    getStats() {
        return {
            origin: this.origin,
            connected: this.connected,
            listenerTypes: Array.from(this.listeners.keys()),
            pendingRequests: this.pendingRequests.size,
            totalListeners: Array.from(this.listeners.values())
                .reduce((total, listeners) => total + listeners.length, 0)
        };
    }
}

/**
 * Create bridge instance for specific origin
 */
export function createBridge(origin, options = {}) {
    return new MessageBridge(origin, options);
}

/**
 * Request-response helper for easy async communication
 */
export async function request(bridge, target, type, data, timeout = 5000) {
    return bridge.send(target, type, data, {
        expectResponse: true,
        timeout
    });
}

export default {
    MessageBridge,
    createBridge,
    request
};