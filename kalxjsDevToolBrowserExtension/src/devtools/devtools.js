/**
 * KALXJS DevTools Page
 * Entry point for DevTools integration and panel creation
 */

import { MESSAGE_ORIGINS, MESSAGE_TYPES, PANEL_CONFIG } from '../shared/constants.js';
import { createLogger, generateId } from '../shared/utils.js';
import { createBridge } from '../shared/bridge.js';

const logger = createLogger('DevTools');

class KalxjsDevTools {
    constructor() {
        this.bridge = createBridge(MESSAGE_ORIGINS.DEVTOOLS);
        this.panelWindow = null;
        this.panelId = generateId('devtools-panel');
        this.isFrameworkDetected = false;
        this.tabId = chrome.devtools.inspectedWindow.tabId;

        this._initialize();
    }

    /**
     * Initialize DevTools
     */
    async _initialize() {
        logger.info('KALXJS DevTools initializing...');

        try {
            // Verify chrome.devtools API is available
            if (!chrome.devtools || !chrome.devtools.panels) {
                throw new Error('chrome.devtools API not available - extension may not be properly loaded');
            }

            logger.debug('Chrome DevTools API verified');

            // Setup bridge communication
            this.bridge.connect();

            // Setup message handlers
            this._setupMessageHandlers();

            // Always create panel - it will show appropriate state based on framework detection
            await this._createPanel();

            // Check if KALXJS is already detected after panel creation
            await this._checkFrameworkPresence();

            // Setup framework detection listener
            this._waitForFrameworkDetection();

            logger.info(`DevTools initialized for tab ${this.tabId}`);

        } catch (error) {
            logger.error('DevTools initialization failed:', error);
            this._showError('Failed to initialize KALXJS DevTools: ' + error.message);
        }
    }

    /**
     * Setup message handlers
     */
    _setupMessageHandlers() {
        // Framework detection
        this.bridge.on(MESSAGE_TYPES.FRAMEWORK_DETECTED, (data) => {
            logger.info('Framework detected:', data);
            this._handleFrameworkDetected(data);
            // Relay to panel
            this._relayToPanel(MESSAGE_TYPES.FRAMEWORK_DETECTED, data);
        });

        this.bridge.on(MESSAGE_TYPES.FRAMEWORK_UNDETECTED, (data) => {
            logger.info('Framework undetected:', data);
            this._handleFrameworkUndetected(data);
            // Relay to panel
            this._relayToPanel(MESSAGE_TYPES.FRAMEWORK_UNDETECTED, data);
        });

        // Bridge connection
        this.bridge.on('bridge-connected', (data) => {
            logger.debug('Bridge connected:', data);
        });

        // Component messages
        this.bridge.on(MESSAGE_TYPES.COMPONENT_REGISTERED, (data) => {
            logger.debug('Component registered:', data);
            this._relayToPanel(MESSAGE_TYPES.COMPONENT_REGISTERED, data);
        });

        this.bridge.on(MESSAGE_TYPES.COMPONENT_UPDATED, (data) => {
            logger.debug('Component updated:', data);
            this._relayToPanel(MESSAGE_TYPES.COMPONENT_UPDATED, data);
        });

        this.bridge.on(MESSAGE_TYPES.STATE_CHANGED, (data) => {
            logger.debug('State changed:', data);
            this._relayToPanel(MESSAGE_TYPES.STATE_CHANGED, data);
        });

        this.bridge.on(MESSAGE_TYPES.EVENT_EMITTED, (data) => {
            logger.debug('Event emitted:', data);
            this._relayToPanel(MESSAGE_TYPES.EVENT_EMITTED, data);
        });

        this.bridge.on(MESSAGE_TYPES.PERFORMANCE_MARK, (data) => {
            logger.debug('Performance mark:', data);
            this._relayToPanel(MESSAGE_TYPES.PERFORMANCE_MARK, data);
        });

        logger.debug('Message handlers setup complete');
    }

    /**
     * Relay message to panel
     */
    _relayToPanel(type, data) {
        if (!this.panelWindow) {
            logger.debug('Cannot relay message to panel - panel not shown yet');
            return;
        }

        try {
            this.panelWindow.postMessage({
                source: 'kalxjs-devtools-panel',
                type,
                data,
                timestamp: Date.now()
            }, '*');
        } catch (error) {
            logger.warn('Failed to relay message to panel:', error);
        }
    }

    /**
     * Check if framework is already present
     */
    async _checkFrameworkPresence() {
        try {
            // Execute detection script in inspected window
            const result = await new Promise((resolve) => {
                chrome.devtools.inspectedWindow.eval(`
          (() => {
            const hasKalxjsHook = typeof window.__KALXJS_DEVTOOLS_HOOK__ !== 'undefined';
            const hasKalxjsGlobal = typeof window.KALXJS !== 'undefined' || typeof window.__KALXJS__ !== 'undefined';
            const hasKalxjsElements = document.querySelector('[data-kalxjs], [kalx-app], [k-app]') !== null;

            return {
              detected: hasKalxjsHook || hasKalxjsGlobal || hasKalxjsElements,
              hook: hasKalxjsHook,
              global: hasKalxjsGlobal,
              elements: hasKalxjsElements,
              hookData: hasKalxjsHook ? {
                version: window.__KALXJS_DEVTOOLS_HOOK__.version,
                apps: window.__KALXJS_DEVTOOLS_HOOK__.getApps ? window.__KALXJS_DEVTOOLS_HOOK__.getApps().length : 0
              } : null
            };
          })()
        `, (result, isException) => {
                    resolve(isException ? { detected: false } : result);
                });
            });

            if (result.detected) {
                this.isFrameworkDetected = true;
                logger.info('KALXJS framework already present:', result);

                // Notify framework detection
                await this.bridge.send('background', MESSAGE_TYPES.FRAMEWORK_DETECTED, {
                    framework: {
                        name: 'KALXJS',
                        version: result.hookData?.version || 'unknown',
                        apps: result.hookData?.apps || 0,
                        detected: true
                    },
                    tabId: this.tabId
                });
            } else {
                logger.info('KALXJS framework not detected on page load');
            }

        } catch (error) {
            logger.error('Framework presence check failed:', error);
        }
    }

    /**
     * Wait for framework detection with timeout
     */
    _waitForFrameworkDetection() {
        logger.info('Setting up framework detection listener...');

        // Just setup the listener - no timeout since panel is already created
        // The panel will update its UI based on framework detection status
        this.bridge.on(MESSAGE_TYPES.FRAMEWORK_DETECTED, (data) => {
            if (!this.isFrameworkDetected) {
                logger.info('Framework detected after panel creation:', data);
                this._handleFrameworkDetected(data);
            }
        });
    }

    /**
     * Handle framework detection
     */
    async _handleFrameworkDetected(data) {
        if (this.isFrameworkDetected) return;

        this.isFrameworkDetected = true;
        logger.info('KALXJS framework detected, updating panel...');

        // Update panel with framework data (panel already exists)
        if (this.panelWindow) {
            this._sendToPanelWindow('framework-detected', data);
        }
    }

    /**
     * Handle framework undetection
     */
    _handleFrameworkUndetected(data) {
        this.isFrameworkDetected = false;

        // Update panel
        if (this.panelWindow) {
            this._sendToPanelWindow('framework-undetected', data);
        }

        logger.info('Framework undetected, panel will show disconnected state');
    }

    /**
     * Create DevTools panel
     */
    async _createPanel() {
        logger.info('Creating KALXJS DevTools panel...');

        try {
            // Verify chrome.devtools.panels is available
            if (!chrome.devtools.panels || typeof chrome.devtools.panels.create !== 'function') {
                throw new Error('chrome.devtools.panels.create is not available');
            }

            const panel = await new Promise((resolve, reject) => {
                try {
                    // Create panel without icon to avoid issues
                    chrome.devtools.panels.create(
                        PANEL_CONFIG.NAME,
                        '', // No icon to avoid loading issues
                        'panel/panel.html',
                        (createdPanel) => {
                            // Check for runtime errors
                            if (chrome.runtime.lastError) {
                                logger.error('Panel creation error from callback:', chrome.runtime.lastError);
                                reject(new Error(chrome.runtime.lastError.message));
                                return;
                            }

                            if (!createdPanel) {
                                logger.error('Panel creation callback received null panel');
                                reject(new Error('Panel creation returned null'));
                                return;
                            }

                            logger.info('DevTools panel created successfully');
                            resolve(createdPanel);
                        }
                    );
                } catch (syncError) {
                    logger.error('Synchronous error during panel creation:', syncError);
                    reject(syncError);
                }
            });

            // Setup panel event handlers with error handling
            panel.onShown.addListener((panelWindow) => {
                try {
                    this._handlePanelShown(panelWindow);
                } catch (error) {
                    logger.error('Panel shown handler error:', error);
                }
            });

            panel.onHidden.addListener(() => {
                try {
                    this._handlePanelHidden();
                } catch (error) {
                    logger.error('Panel hidden handler error:', error);
                }
            });

        } catch (error) {
            logger.error('Failed to create DevTools panel:', error);
            throw error; // Re-throw to be handled by caller
        }
    }

    /**
     * Handle panel shown event
     */
    _handlePanelShown(panelWindow) {
        logger.debug('DevTools panel shown');

        this.panelWindow = panelWindow;

        // Initialize panel communication
        this._initializePanelCommunication();

        // Send initial data to panel
        this._sendInitialDataToPanel();
    }

    /**
     * Handle panel hidden event
     */
    _handlePanelHidden() {
        logger.debug('DevTools panel hidden');
    }

    /**
     * Initialize communication with panel window
     */
    _initializePanelCommunication() {
        if (!this.panelWindow) {
            logger.warn('Cannot initialize panel communication - no panel window');
            return;
        }

        logger.debug('Initializing panel communication...');

        try {
            // Use simple communication approach that avoids cross-origin issues
            // Send initial data immediately when panel is shown
            setTimeout(() => {
                this._sendInitialDataToPanel();
            }, 100);

            // Setup periodic communication check
            let communicationRetries = 0;
            const maxRetries = 5;

            const establishCommunication = () => {
                try {
                    this._sendToPanelWindow('devtools-ready', {
                        panelId: this.panelId,
                        tabId: this.tabId,
                        frameworkDetected: this.isFrameworkDetected,
                        timestamp: Date.now()
                    });

                    logger.debug('DevTools ready message sent to panel');

                } catch (error) {
                    communicationRetries++;
                    if (communicationRetries < maxRetries) {
                        logger.warn(`Panel communication retry ${communicationRetries}/${maxRetries}:`, error);
                        setTimeout(establishCommunication, 1000 * communicationRetries);
                    } else {
                        logger.error('Failed to establish panel communication after retries:', error);
                    }
                }
            };

            establishCommunication();

        } catch (error) {
            logger.error('Panel communication initialization failed:', error);
        }
    }

    /**
     * Send initial data to panel
     */
    async _sendInitialDataToPanel() {
        if (!this.panelWindow) return;

        try {
            // Get current tab information
            const tabInfo = await this._getTabInfo();

            // Send initialization data
            this._sendToPanelWindow('initialize', {
                panelId: this.panelId,
                tabId: this.tabId,
                tabInfo,
                frameworkDetected: this.isFrameworkDetected,
                timestamp: Date.now()
            });

        } catch (error) {
            logger.error('Failed to send initial data to panel:', error);
        }
    }

    /**
     * Get current tab information
     */
    async _getTabInfo() {
        return new Promise((resolve) => {
            chrome.devtools.inspectedWindow.eval(`
        ({
          url: window.location.href,
          title: document.title,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      `, (result, isException) => {
                resolve(isException ? {} : result);
            });
        });
    }

    /**
     * Send message to panel window
     */
    _sendToPanelWindow(type, data) {
        if (!this.panelWindow) {
            logger.warn('Cannot send message to panel - panel window not available');
            return false;
        }

        try {
            // Check if panel window is still valid
            if (this.panelWindow.closed) {
                logger.warn('Panel window is closed, cannot send message');
                this.panelWindow = null;
                return false;
            }

            this.panelWindow.postMessage({
                source: 'kalxjs-devtools',
                type,
                data,
                timestamp: Date.now()
            }, '*');

            return true;

        } catch (error) {
            logger.error('Failed to send message to panel window:', error);

            // If it's a security or closed window error, clear the reference
            if (error.name === 'SecurityError' || error.message.includes('closed')) {
                this.panelWindow = null;
            }

            return false;
        }
    }

    /**
     * Show error message
     */
    _showError(message) {
        const errorElement = document.createElement('div');
        errorElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff4444;
      color: white;
      padding: 16px 24px;
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
        errorElement.textContent = message;

        document.body.appendChild(errorElement);

        // Remove after 5 seconds
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, 5000);
    }

    /**
     * Get DevTools status
     */
    getStatus() {
        return {
            panelId: this.panelId,
            tabId: this.tabId,
            frameworkDetected: this.isFrameworkDetected,
            panelCreated: !!this.panelWindow,
            bridge: this.bridge.getStats(),
            timestamp: Date.now()
        };
    }
}

// Initialize DevTools with retry logic
let kalxjsDevTools;
let initializationRetries = 0;
const maxRetries = 10;

function initializeDevTools() {
    try {
        // Verify chrome.devtools is available
        if (!chrome || !chrome.devtools) {
            throw new Error('chrome.devtools not yet available');
        }

        logger.debug('Initializing KALXJS DevTools...');
        kalxjsDevTools = new KalxjsDevTools();

        // Expose for debugging
        if (process.env.NODE_ENV === 'development') {
            window.__KALXJS_DEVTOOLS_INSTANCE__ = kalxjsDevTools;
        }

        logger.info('KALXJS DevTools initialized successfully');
        return true;

    } catch (error) {
        initializationRetries++;

        if (initializationRetries < maxRetries) {
            logger.debug(`DevTools initialization retry ${initializationRetries}/${maxRetries}:`, error.message);
            setTimeout(initializeDevTools, 100 * initializationRetries);
            return false;
        } else {
            console.error('KALXJS DevTools failed to initialize after retries:', error);
            logger.error('Initialization failed:', error);
            return false;
        }
    }
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDevTools);
} else {
    initializeDevTools();
}

logger.info('KALXJS DevTools page loader initialized');