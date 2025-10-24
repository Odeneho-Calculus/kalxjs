/**
 * KALXJS DevTools Content Script
 * Bridge between web page and extension contexts
 */

import { MESSAGE_ORIGINS } from '../shared/constants.js';
import { createLogger } from '../shared/utils.js';
import { createBridge } from '../shared/bridge.js';
import { FrameworkDetector } from './detector.js';

const logger = createLogger('ContentScript');

class KalxjsContentScript {
    constructor() {
        this.bridge = createBridge(MESSAGE_ORIGINS.CONTENT_SCRIPT);
        this.detector = null;
        this.injectedScript = null;
        this.isInitialized = false;

        this._initialize();
    }

    /**
     * Initialize content script
     */
    _initialize() {
        logger.info('KALXJS DevTools Content Script starting...');

        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this._setupContentScript();
                });
            } else {
                this._setupContentScript();
            }

        } catch (error) {
            logger.error('Content script initialization failed:', error);
        }
    }

    /**
     * Setup content script components
     */
    _setupContentScript() {
        if (this.isInitialized) return;

        logger.debug('Setting up content script...');

        // Connect bridge
        this.bridge.connect();

        // Inject script into page context
        this._injectPageScript();

        // Initialize framework detector
        this._initializeDetector();

        // Setup message handlers
        this._setupMessageHandlers();

        // Setup page monitoring
        this._setupPageMonitoring();

        this.isInitialized = true;
        logger.info('Content script initialized successfully');
    }

    /**
     * Inject script into page context for direct DOM access
     */
    _injectPageScript() {
        try {
            // Create script element
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('content-script/injected.js');
            script.type = 'module';
            script.async = false;

            // Add script identifier
            script.setAttribute('data-kalxjs-devtools', 'injected');

            // Inject into document
            const target = document.head || document.documentElement;
            if (target) {
                target.appendChild(script);

                // Remove script after injection to clean up DOM
                script.onload = () => {
                    script.remove();
                };

                logger.debug('Injected script loaded');
            } else {
                logger.warn('Failed to inject script: no suitable target element');
            }

        } catch (error) {
            logger.error('Script injection failed:', error);
        }
    }

    /**
     * Initialize framework detector
     */
    _initializeDetector() {
        this.detector = new FrameworkDetector(this.bridge);
        logger.debug('Framework detector initialized');
    }

    /**
     * Setup message handlers
     */
    _setupMessageHandlers() {
        // Handle messages from injected script
        window.addEventListener('message', (event) => {
            // Validate message origin
            if (event.source !== window) return;

            const message = event.data;
            if (!message || !message.source || !message.source.startsWith('kalxjs-devtools-injected')) {
                return;
            }

            this._handleInjectedMessage(message);
        });

        // Handle messages from extension
        this.bridge.on('*', (data, sender) => {
            this._handleExtensionMessage(data, sender);
        });

        // Handle bridge connection messages
        this.bridge.on('BRIDGE_CONNECT', () => {
            logger.debug('Bridge connection established');
        });

        logger.debug('Message handlers setup complete');
    }

    /**
     * Setup page monitoring
     */
    _setupPageMonitoring() {
        // Monitor page navigation
        let currentUrl = window.location.href;

        const checkUrlChange = () => {
            if (window.location.href !== currentUrl) {
                const oldUrl = currentUrl;
                currentUrl = window.location.href;

                logger.info('Page navigation detected:', { from: oldUrl, to: currentUrl });

                // Restart detection on navigation
                if (this.detector) {
                    this.detector.stopDetection();
                    setTimeout(() => {
                        this.detector.startDetection();
                    }, 500);
                }
            }
        };

        // Use multiple methods to detect navigation
        if (typeof window.history !== 'undefined') {
            // Override pushState and replaceState
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;

            history.pushState = function (...args) {
                originalPushState.apply(this, args);
                setTimeout(checkUrlChange, 0);
            };

            history.replaceState = function (...args) {
                originalReplaceState.apply(this, args);
                setTimeout(checkUrlChange, 0);
            };

            // Listen for popstate
            window.addEventListener('popstate', checkUrlChange);
        }

        // Fallback: periodic URL check
        setInterval(checkUrlChange, 1000);

        // Monitor visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.detector) {
                // Page became visible, recheck framework
                setTimeout(() => {
                    this.detector._performDetection();
                }, 100);
            }
        });

        logger.debug('Page monitoring setup complete');
    }

    /**
     * Handle messages from injected script
     */
    _handleInjectedMessage(message) {
        logger.debug('Message from injected script:', message);

        const { type, data } = message;

        try {
            switch (type) {
                case 'framework-hook-ready':
                    logger.info('Framework hook ready in page context');
                    // Notify detector to re-check
                    if (this.detector) {
                        this.detector.debouncedDetection();
                    }
                    break;

                case 'framework-detected':
                    logger.info('Framework detected by injected script:', data);
                    // Forward to background script for DevTools panel creation
                    this.bridge.send('background', 'framework-detected', {
                        ...data,
                        source: 'injected-script',
                        url: window.location.href,
                        timestamp: Date.now()
                    });
                    break;

                case 'component-registered':
                case 'component-updated':
                case 'component-unmounted':
                case 'state-changed':
                case 'event-emitted':
                case 'performance-mark':
                    // Forward framework messages to background
                    this.bridge.send('background', type, {
                        ...data,
                        source: 'injected-script',
                        url: window.location.href,
                        timestamp: Date.now()
                    });
                    break;

                default:
                    logger.warn(`Unhandled injected message type: ${type}`);
            }

        } catch (error) {
            logger.error('Failed to handle injected message:', error);
        }
    }

    /**
     * Handle messages from extension
     */
    _handleExtensionMessage(data, sender) {
        logger.debug('Message from extension:', data, sender);

        // Forward relevant messages to injected script
        const forwardableTypes = [
            'component-inspect',
            'state-update',
            'performance-start',
            'performance-stop'
        ];

        if (forwardableTypes.includes(data.type)) {
            this._sendToInjectedScript(data.type, data);
        }
    }

    /**
     * Send message to injected script
     */
    _sendToInjectedScript(type, data) {
        try {
            window.postMessage({
                source: 'kalxjs-devtools-content',
                type,
                data,
                timestamp: Date.now()
            }, '*');
        } catch (error) {
            logger.error('Failed to send message to injected script:', error);
        }
    }

    /**
     * Get content script status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            detector: this.detector ? this.detector.getDetectionStatus() : null,
            bridge: this.bridge.getStats(),
            url: window.location.href,
            title: document.title,
            timestamp: Date.now()
        };
    }

    /**
     * Cleanup content script
     */
    cleanup() {
        logger.info('Cleaning up content script...');

        if (this.detector) {
            this.detector.stopDetection();
            this.detector = null;
        }

        if (this.bridge) {
            this.bridge.disconnect();
        }

        this.isInitialized = false;
        logger.info('Content script cleanup complete');
    }
}

// Initialize content script
let contentScript;

try {
    contentScript = new KalxjsContentScript();

    // Expose for debugging in development
    if (process.env.NODE_ENV === 'development') {
        window.__KALXJS_DEVTOOLS_CONTENT_SCRIPT__ = contentScript;
    }

} catch (error) {
    console.error('KALXJS DevTools Content Script failed to initialize:', error);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (contentScript) {
        contentScript.cleanup();
    }
});

logger.info('KALXJS DevTools Content Script loaded');