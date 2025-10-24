/**
 * KALXJS DevTools Background Service Worker
 * Manages extension lifecycle, tab communication, and DevTools panel registration
 */

import { MESSAGE_TYPES, MESSAGE_ORIGINS, PANEL_CONFIG } from '../shared/constants.js';
import { createLogger, generateId } from '../shared/utils.js';
import { createBridge } from '../shared/bridge.js';
import { MessageHandler } from './message-handler.js';

const logger = createLogger('ServiceWorker');

class KalxjsDevToolsServiceWorker {
    constructor() {
        this.bridge = createBridge(MESSAGE_ORIGINS.BACKGROUND);
        this.messageHandler = new MessageHandler(this.bridge);
        this.connectedTabs = new Map();
        this.devtoolsPanels = new Map();
        this.extensionId = generateId('ext');

        this._initializeServiceWorker();
    }

    /**
     * Initialize service worker
     */
    _initializeServiceWorker() {
        logger.info('KALXJS DevTools Service Worker starting...');

        // Setup message listeners
        this._setupMessageHandlers();

        // Setup extension event listeners
        this._setupExtensionEvents();

        // Connect bridge (service worker only needs runtime connection)
        this.bridge.connected = true;

        logger.info(`Service Worker initialized with ID: ${this.extensionId}`);
    }

    /**
     * Setup message event handlers
     */
    _setupMessageHandlers() {
        // Framework detection
        this.bridge.on(MESSAGE_TYPES.FRAMEWORK_DETECTED, async (data, sender) => {
            logger.info('KALXJS framework detected:', data);
            await this._handleFrameworkDetected(data, sender);
        });

        this.bridge.on(MESSAGE_TYPES.FRAMEWORK_UNDETECTED, async (data, sender) => {
            logger.info('KALXJS framework undetected:', data);
            await this._handleFrameworkUndetected(data, sender);
        });

        // DevTools communication
        this.bridge.on(MESSAGE_TYPES.DEVTOOLS_INIT, async (data, sender) => {
            logger.info('DevTools initialization requested:', data);
            await this._handleDevToolsInit(data, sender);
        });

        this.bridge.on(MESSAGE_TYPES.BRIDGE_CONNECT, async (data, sender) => {
            logger.debug('Bridge connection from:', data.origin);
            await this._handleBridgeConnect(data, sender);
        });

        this.bridge.on(MESSAGE_TYPES.BRIDGE_DISCONNECT, async (data, sender) => {
            logger.debug('Bridge disconnection from:', data.origin);
            await this._handleBridgeDisconnect(data, sender);
        });
    }

    /**
     * Setup Chrome extension event listeners
     */
    _setupExtensionEvents() {
        // Tab events
        if (chrome.tabs) {
            chrome.tabs.onActivated.addListener(this._handleTabActivated.bind(this));
            chrome.tabs.onRemoved.addListener(this._handleTabRemoved.bind(this));
            chrome.tabs.onUpdated.addListener(this._handleTabUpdated.bind(this));
        }

        // Extension lifecycle
        chrome.runtime.onStartup.addListener(this._handleStartup.bind(this));
        chrome.runtime.onInstalled.addListener(this._handleInstalled.bind(this));
        chrome.runtime.onSuspend.addListener(this._handleSuspend.bind(this));

        // Connection events
        chrome.runtime.onConnect.addListener(this._handleConnection.bind(this));
    }

    /**
     * Handle framework detection
     */
    async _handleFrameworkDetected(data, sender) {
        const tabId = sender.tab?.id;
        if (!tabId) return;

        // Store tab information
        this.connectedTabs.set(tabId, {
            id: tabId,
            url: sender.tab.url,
            title: sender.tab.title,
            framework: data,
            connected: true,
            connectedAt: Date.now()
        });

        // Notify all DevTools panels
        await this._notifyDevToolsPanels(MESSAGE_TYPES.FRAMEWORK_DETECTED, {
            tabId,
            framework: data,
            tab: this.connectedTabs.get(tabId)
        });

        logger.info(`Framework detected on tab ${tabId}:`, data);
    }

    /**
     * Handle framework undetection
     */
    async _handleFrameworkUndetected(data, sender) {
        const tabId = sender.tab?.id;
        if (!tabId) return;

        // Update tab information
        const tabInfo = this.connectedTabs.get(tabId);
        if (tabInfo) {
            tabInfo.connected = false;
            tabInfo.disconnectedAt = Date.now();
        }

        // Notify DevTools panels
        await this._notifyDevToolsPanels(MESSAGE_TYPES.FRAMEWORK_UNDETECTED, {
            tabId,
            tab: tabInfo
        });

        logger.info(`Framework undetected on tab ${tabId}`);
    }

    /**
     * Handle DevTools initialization
     */
    async _handleDevToolsInit(data, sender) {
        const { tabId, panelId } = data;

        // Store panel information
        this.devtoolsPanels.set(panelId, {
            id: panelId,
            tabId,
            connected: true,
            connectedAt: Date.now(),
            port: sender.port
        });

        // Send initial data to panel
        const tabInfo = this.connectedTabs.get(tabId);
        await this.bridge.send('runtime', MESSAGE_TYPES.DEVTOOLS_READY, {
            panelId,
            tabInfo,
            extensionId: this.extensionId
        });

        logger.info(`DevTools panel initialized: ${panelId} for tab ${tabId}`);
    }

    /**
     * Handle bridge connection
     */
    async _handleBridgeConnect(data, sender) {
        // Track connection
        logger.debug(`Bridge connected from ${data.origin}`);

        // Send welcome message with extension info
        await this.bridge.send('runtime', MESSAGE_TYPES.BRIDGE_MESSAGE, {
            message: 'welcome',
            extensionId: this.extensionId,
            timestamp: Date.now()
        });
    }

    /**
     * Handle bridge disconnection
     */
    async _handleBridgeDisconnect(data, sender) {
        logger.debug(`Bridge disconnected from ${data.origin}`);
    }

    /**
     * Notify all DevTools panels
     */
    async _notifyDevToolsPanels(type, data) {
        const notifications = Array.from(this.devtoolsPanels.values()).map(async (panel) => {
            try {
                await this.bridge.send('runtime', type, {
                    ...data,
                    panelId: panel.id
                });
            } catch (error) {
                logger.warn(`Failed to notify panel ${panel.id}:`, error);
            }
        });

        await Promise.allSettled(notifications);
    }

    /**
     * Handle tab activation
     */
    _handleTabActivated(activeInfo) {
        logger.debug('Tab activated:', activeInfo);

        // Update active tab info
        this._notifyDevToolsPanels(MESSAGE_TYPES.BRIDGE_MESSAGE, {
            message: 'tab-activated',
            tabId: activeInfo.tabId
        });
    }

    /**
     * Handle tab removal
     */
    _handleTabRemoved(tabId, removeInfo) {
        logger.debug('Tab removed:', tabId);

        // Clean up tab data
        this.connectedTabs.delete(tabId);

        // Remove associated panels
        for (const [panelId, panel] of this.devtoolsPanels.entries()) {
            if (panel.tabId === tabId) {
                this.devtoolsPanels.delete(panelId);
            }
        }

        this._notifyDevToolsPanels(MESSAGE_TYPES.BRIDGE_MESSAGE, {
            message: 'tab-removed',
            tabId
        });
    }

    /**
     * Handle tab updates
     */
    _handleTabUpdated(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete') {
            logger.debug('Tab updated:', tabId);

            // Update tab info if it exists
            const tabInfo = this.connectedTabs.get(tabId);
            if (tabInfo) {
                tabInfo.url = tab.url;
                tabInfo.title = tab.title;
                tabInfo.updatedAt = Date.now();
            }

            this._notifyDevToolsPanels(MESSAGE_TYPES.BRIDGE_MESSAGE, {
                message: 'tab-updated',
                tabId,
                changeInfo,
                tab: tabInfo
            });
        }
    }

    /**
     * Handle extension startup
     */
    _handleStartup() {
        logger.info('Extension startup');
    }

    /**
     * Handle extension installation
     */
    _handleInstalled(details) {
        logger.info('Extension installed:', details);

        if (details.reason === 'install') {
            // First installation
            logger.info('KALXJS DevTools extension installed for the first time');
        } else if (details.reason === 'update') {
            // Extension update
            logger.info(`Extension updated from ${details.previousVersion} to ${chrome.runtime.getManifest().version}`);
        }
    }

    /**
     * Handle extension suspend
     */
    _handleSuspend() {
        logger.info('Extension suspending');

        // Clean up
        this.bridge.disconnect();
        this.connectedTabs.clear();
        this.devtoolsPanels.clear();
    }

    /**
     * Handle long-lived connections
     */
    _handleConnection(port) {
        logger.info('Long-lived connection established:', port.name);

        port.onMessage.addListener((message) => {
            logger.debug('Port message received:', message);
            this.messageHandler.handlePortMessage(message, port);
        });

        port.onDisconnect.addListener(() => {
            logger.info('Port disconnected:', port.name);

            // Clean up panel if it was a DevTools connection
            if (port.name.startsWith('devtools-panel-')) {
                const panelId = port.name.replace('devtools-panel-', '');
                this.devtoolsPanels.delete(panelId);
            }
        });
    }

    /**
     * Get extension statistics
     */
    getStats() {
        return {
            extensionId: this.extensionId,
            connectedTabs: this.connectedTabs.size,
            devtoolsPanels: this.devtoolsPanels.size,
            bridgeStats: this.bridge.getStats(),
            uptime: Date.now() - (this.startTime || Date.now())
        };
    }
}

// Initialize service worker
const serviceWorker = new KalxjsDevToolsServiceWorker();

// Export for potential access from DevTools
globalThis.__KALXJS_DEVTOOLS_SERVICE_WORKER__ = serviceWorker;

// Keep service worker alive
chrome.runtime.onSuspend.addListener(() => {
    logger.info('Service Worker suspending...');
});

logger.info('KALXJS DevTools Service Worker loaded');