/**
 * KALXJS DevTools Background Message Handler
 * Centralized message routing and processing system
 */

import { MESSAGE_TYPES, MESSAGE_ORIGINS, ERROR_CODES } from '../shared/constants.js';
import { createLogger, createError, performanceMonitor } from '../shared/utils.js';

const logger = createLogger('MessageHandler');

/**
 * Message Handler for background service worker
 */
export class MessageHandler {
    constructor(bridge) {
        this.bridge = bridge;
        this.messageQueue = [];
        this.processingQueue = false;
        this.messageStats = {
            processed: 0,
            errors: 0,
            avgProcessingTime: 0,
            lastProcessedAt: null
        };

        logger.info('Message Handler initialized');
    }

    /**
     * Handle port messages (long-lived connections)
     */
    async handlePortMessage(message, port) {
        const markName = `port-message-${Date.now()}`;
        performanceMonitor.mark(markName);

        try {
            logger.debug('Port message received:', { message, portName: port.name });

            // Validate message format
            if (!this._validateMessage(message)) {
                throw createError(ERROR_CODES.INVALID_MESSAGE_FORMAT, 'Invalid port message format');
            }

            // Route message based on type
            await this._routeMessage(message, { port, source: 'port' });

            // Update stats
            this._updateStats(markName, true);

        } catch (error) {
            logger.error('Port message handling failed:', error);
            this._updateStats(markName, false);

            // Send error response if possible
            if (port && port.postMessage) {
                port.postMessage({
                    type: MESSAGE_TYPES.BRIDGE_MESSAGE,
                    origin: MESSAGE_ORIGINS.BACKGROUND,
                    data: {
                        error: {
                            code: error.code || ERROR_CODES.COMMUNICATION_FAILED,
                            message: error.message
                        }
                    },
                    timestamp: Date.now()
                });
            }
        }
    }

    /**
     * Handle runtime messages
     */
    async handleRuntimeMessage(message, sender) {
        const markName = `runtime-message-${Date.now()}`;
        performanceMonitor.mark(markName);

        try {
            logger.debug('Runtime message received:', { message, sender });

            // Validate message
            if (!this._validateMessage(message)) {
                throw createError(ERROR_CODES.INVALID_MESSAGE_FORMAT, 'Invalid runtime message format');
            }

            // Route message
            const result = await this._routeMessage(message, { sender, source: 'runtime' });

            // Update stats
            this._updateStats(markName, true);

            return result;

        } catch (error) {
            logger.error('Runtime message handling failed:', error);
            this._updateStats(markName, false);
            throw error;
        }
    }

    /**
     * Route message to appropriate handler
     */
    async _routeMessage(message, context) {
        const { type, data, origin } = message;

        switch (type) {
            case MESSAGE_TYPES.FRAMEWORK_DETECTED:
                return this._handleFrameworkDetected(data, context);

            case MESSAGE_TYPES.FRAMEWORK_UNDETECTED:
                return this._handleFrameworkUndetected(data, context);

            case MESSAGE_TYPES.DEVTOOLS_INIT:
                return this._handleDevToolsInit(data, context);

            case MESSAGE_TYPES.COMPONENT_REGISTERED:
                return this._handleComponentMessage(type, data, context);

            case MESSAGE_TYPES.COMPONENT_UPDATED:
                return this._handleComponentMessage(type, data, context);

            case MESSAGE_TYPES.STATE_CHANGED:
                return this._handleStateMessage(type, data, context);

            case MESSAGE_TYPES.EVENT_EMITTED:
                return this._handleEventMessage(type, data, context);

            case MESSAGE_TYPES.PERFORMANCE_START:
            case MESSAGE_TYPES.PERFORMANCE_END:
                return this._handlePerformanceMessage(type, data, context);

            case MESSAGE_TYPES.BRIDGE_CONNECT:
                return this._handleBridgeConnect(data, context);

            case MESSAGE_TYPES.BRIDGE_DISCONNECT:
                return this._handleBridgeDisconnect(data, context);

            default:
                logger.warn(`Unhandled message type: ${type}`);
                throw createError(ERROR_CODES.COMMUNICATION_FAILED, `Unknown message type: ${type}`);
        }
    }

    /**
     * Handle framework detection messages
     */
    async _handleFrameworkDetected(data, context) {
        logger.info('Framework detected:', data);

        // Broadcast to all interested parties
        await this.bridge.broadcast(MESSAGE_TYPES.FRAMEWORK_DETECTED, {
            ...data,
            tabId: context.sender?.tab?.id,
            timestamp: Date.now()
        });

        return { success: true, message: 'Framework detection broadcasted' };
    }

    /**
     * Handle framework undetection messages
     */
    async _handleFrameworkUndetected(data, context) {
        logger.info('Framework undetected:', data);

        await this.bridge.broadcast(MESSAGE_TYPES.FRAMEWORK_UNDETECTED, {
            ...data,
            tabId: context.sender?.tab?.id,
            timestamp: Date.now()
        });

        return { success: true, message: 'Framework undetection broadcasted' };
    }

    /**
     * Handle DevTools initialization
     */
    async _handleDevToolsInit(data, context) {
        logger.info('DevTools init requested:', data);

        // Forward to appropriate handlers
        await this.bridge.send('runtime', MESSAGE_TYPES.DEVTOOLS_READY, {
            ...data,
            extensionInfo: {
                version: chrome.runtime.getManifest().version,
                id: chrome.runtime.id
            },
            timestamp: Date.now()
        });

        return { success: true, message: 'DevTools initialization processed' };
    }

    /**
     * Handle component-related messages
     */
    async _handleComponentMessage(type, data, context) {
        logger.debug(`Component message (${type}):`, data);

        // Add metadata
        const enrichedData = {
            ...data,
            tabId: context.sender?.tab?.id,
            timestamp: Date.now(),
            messageType: type
        };

        // Forward to DevTools panels
        await this.bridge.broadcast(type, enrichedData);

        return { success: true, message: `Component message (${type}) processed` };
    }

    /**
     * Handle state-related messages
     */
    async _handleStateMessage(type, data, context) {
        logger.debug(`State message (${type}):`, data);

        // Add context information
        const enrichedData = {
            ...data,
            tabId: context.sender?.tab?.id,
            timestamp: Date.now(),
            source: context.source
        };

        // Broadcast state changes
        await this.bridge.broadcast(type, enrichedData);

        return { success: true, message: `State message (${type}) processed` };
    }

    /**
     * Handle event-related messages
     */
    async _handleEventMessage(type, data, context) {
        logger.debug(`Event message (${type}):`, data);

        const enrichedData = {
            ...data,
            tabId: context.sender?.tab?.id,
            timestamp: Date.now(),
            context: {
                url: context.sender?.tab?.url,
                title: context.sender?.tab?.title
            }
        };

        await this.bridge.broadcast(type, enrichedData);

        return { success: true, message: `Event message (${type}) processed` };
    }

    /**
     * Handle performance-related messages
     */
    async _handlePerformanceMessage(type, data, context) {
        logger.debug(`Performance message (${type}):`, data);

        const enrichedData = {
            ...data,
            tabId: context.sender?.tab?.id,
            timestamp: Date.now(),
            messageType: type
        };

        // Store performance data and forward to panels
        await this.bridge.broadcast(type, enrichedData);

        return { success: true, message: `Performance message (${type}) processed` };
    }

    /**
     * Handle bridge connection messages
     */
    async _handleBridgeConnect(data, context) {
        logger.info('Bridge connection:', data);

        return {
            success: true,
            message: 'Bridge connected',
            connectionId: `conn-${Date.now()}`,
            timestamp: Date.now()
        };
    }

    /**
     * Handle bridge disconnection messages
     */
    async _handleBridgeDisconnect(data, context) {
        logger.info('Bridge disconnection:', data);

        return {
            success: true,
            message: 'Bridge disconnected',
            timestamp: Date.now()
        };
    }

    /**
     * Validate message format
     */
    _validateMessage(message) {
        if (!message || typeof message !== 'object') {
            return false;
        }

        const requiredFields = ['type', 'origin'];
        return requiredFields.every(field => field in message);
    }

    /**
     * Update processing statistics
     */
    _updateStats(markName, success) {
        const processingTime = performanceMonitor.mark(`${markName}-end`) -
            performanceMonitor.mark(markName);

        this.messageStats.processed++;
        if (!success) this.messageStats.errors++;

        // Update average processing time
        this.messageStats.avgProcessingTime =
            (this.messageStats.avgProcessingTime * (this.messageStats.processed - 1) + processingTime) /
            this.messageStats.processed;

        this.messageStats.lastProcessedAt = Date.now();

        // Log performance warning if processing is slow
        if (processingTime > 100) { // 100ms threshold
            logger.warn(`Slow message processing: ${processingTime}ms`);
        }
    }

    /**
     * Get message handling statistics
     */
    getStats() {
        return {
            ...this.messageStats,
            queueSize: this.messageQueue.length,
            processingQueue: this.processingQueue
        };
    }

    /**
     * Clear statistics
     */
    clearStats() {
        this.messageStats = {
            processed: 0,
            errors: 0,
            avgProcessingTime: 0,
            lastProcessedAt: null
        };

        logger.info('Message handler statistics cleared');
    }
}

export default MessageHandler;