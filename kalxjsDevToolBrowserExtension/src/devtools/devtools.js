/**
 * KALXJS DevTools Page
 * Entry point for DevTools integration and panel creation
 */

import { MESSAGE_ORIGINS, PANEL_CONFIG } from '../shared/constants.js';
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
            // Setup bridge communication
            this.bridge.connect();

            // Setup message handlers
            this._setupMessageHandlers();

            // Check if KALXJS is already detected
            await this._checkFrameworkPresence();

            // Create DevTools panel conditionally
            if (this.isFrameworkDetected) {
                await this._createPanel();
            } else {
                // Wait for framework detection
                this._waitForFrameworkDetection();
            }

            logger.info(`DevTools initialized for tab ${this.tabId}`);

        } catch (error) {
            logger.error('DevTools initialization failed:', error);
            this._showError('Failed to initialize KALXJS DevTools');
        }
    }

    /**
     * Setup message handlers
     */
    _setupMessageHandlers() {
        // Framework detection
        this.bridge.on('framework-detected', (data) => {
            logger.info('Framework detected:', data);
            this._handleFrameworkDetected(data);
        });

        this.bridge.on('framework-undetected', (data) => {
            logger.info('Framework undetected:', data);
            this._handleFrameworkUndetected(data);
        });

        // Bridge connection
        this.bridge.on('bridge-connected', (data) => {
            logger.debug('Bridge connected:', data);
        });

        logger.debug('Message handlers setup complete');
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
                await this.bridge.send('background', 'framework-detected', {
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
        logger.info('Waiting for KALXJS framework detection...');

        // Set a timeout for detection
        const detectionTimeout = setTimeout(() => {
            if (!this.isFrameworkDetected) {
                logger.warn('Framework detection timeout - creating panel anyway');
                this._createPanel();
            }
        }, 10000); // 10 second timeout

        // Clear timeout when framework is detected
        this.bridge.on('framework-detected', () => {
            clearTimeout(detectionTimeout);
        });
    }

    /**
     * Handle framework detection
     */
    async _handleFrameworkDetected(data) {
        if (this.isFrameworkDetected) return;

        this.isFrameworkDetected = true;

        // Create DevTools panel
        await this._createPanel();

        // Update panel with framework data
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
            const panel = await new Promise((resolve, reject) => {
                // Try to create panel with icon first, fallback without icon if needed
                chrome.devtools.panels.create(
                    PANEL_CONFIG.NAME,
                    PANEL_CONFIG.ICON_PATH,
                    'panel/panel.html',
                    (panel) => {
                        if (chrome.runtime.lastError) {
                            // Retry without icon if icon loading fails
                            chrome.devtools.panels.create(
                                PANEL_CONFIG.NAME,
                                '', // No icon
                                'panel/panel.html',
                                (retryPanel) => {
                                    if (chrome.runtime.lastError) {
                                        reject(new Error(chrome.runtime.lastError.message));
                                    } else {
                                        logger.warn('Panel created without icon due to icon loading failure');
                                        resolve(retryPanel);
                                    }
                                }
                            );
                        } else {
                            resolve(panel);
                        }
                    }
                );
            });

            // Setup panel event handlers
            panel.onShown.addListener(this._handlePanelShown.bind(this));
            panel.onHidden.addListener(this._handlePanelHidden.bind(this));

            logger.info('DevTools panel created successfully');

        } catch (error) {
            logger.error('Failed to create DevTools panel:', error);
            this._showError('Failed to create KALXJS DevTools panel');
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
        if (!this.panelWindow) return;

        logger.debug('Initializing panel communication...');

        // Setup message listener for panel readiness (avoid cross-origin access)
        const messageListener = (event) => {
            try {
                // Validate message source and format
                if (!event.data ||
                    event.data.source !== 'kalxjs-devtools-panel' ||
                    event.data.type !== 'panel-ready') {
                    return;
                }

                logger.debug('Panel is ready for communication');

                // Send DevTools ready message
                this._sendToPanelWindow('devtools-ready', {
                    panelId: this.panelId,
                    tabId: this.tabId,
                    frameworkDetected: this.isFrameworkDetected
                });

                // Send initial data to panel
                this._sendInitialDataToPanel();

                // Remove listener after first ready message
                window.removeEventListener('message', messageListener);

            } catch (error) {
                logger.error('Error handling panel ready message:', error);
            }
        };

        // Add listener with error handling
        window.addEventListener('message', messageListener);

        // Send initial ping to establish communication with retry logic
        const sendPing = () => {
            try {
                this._sendToPanelWindow('devtools-ping', {
                    timestamp: Date.now()
                });
            } catch (error) {
                logger.warn('Failed to send ping to panel:', error);
                // Retry after a short delay
                setTimeout(sendPing, 500);
            }
        };

        sendPing();
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
            return;
        }

        try {
            this.panelWindow.postMessage({
                source: 'kalxjs-devtools',
                type,
                data,
                timestamp: Date.now()
            }, '*');
        } catch (error) {
            logger.error('Failed to send message to panel window:', error);
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

// Initialize DevTools
let kalxjsDevTools;

try {
    kalxjsDevTools = new KalxjsDevTools();

    // Expose for debugging
    if (process.env.NODE_ENV === 'development') {
        window.__KALXJS_DEVTOOLS_INSTANCE__ = kalxjsDevTools;
    }

} catch (error) {
    console.error('KALXJS DevTools failed to initialize:', error);
}

logger.info('KALXJS DevTools page loaded');