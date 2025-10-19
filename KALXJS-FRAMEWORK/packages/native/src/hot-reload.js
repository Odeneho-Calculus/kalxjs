/**
 * Hot Reload System for Native Development
 * Enables fast refresh and hot module replacement
 */

import { Platform } from './platform.js';

/**
 * Hot Reload Manager
 */
class HotReloadManager {
    constructor() {
        this.enabled = false;
        this.componentRegistry = new Map();
        this.updateHandlers = new Set();
    }

    /**
     * Enable hot reload
     * @param {Object} options - Configuration options
     */
    enable(options = {}) {
        const {
            preserveState = true,
            showNotifications = true,
            onUpdate,
            onError
        } = options;

        this.enabled = true;
        this.preserveState = preserveState;
        this.showNotifications = showNotifications;

        if (onUpdate) {
            this.updateHandlers.add(onUpdate);
        }

        // Setup hot reload listeners based on platform
        if (Platform.isElectron) {
            this.setupElectronHotReload();
        } else if (Platform.isTauri) {
            this.setupTauriHotReload();
        } else if (Platform.isWeb) {
            this.setupWebHotReload();
        }

        if (this.showNotifications) {
            this.showNotification('Hot Reload enabled');
        }
    }

    /**
     * Disable hot reload
     */
    disable() {
        this.enabled = false;
        this.updateHandlers.clear();
    }

    /**
     * Register component for hot reload
     * @param {string} id - Component ID
     * @param {Function} component - Component function
     */
    registerComponent(id, component) {
        this.componentRegistry.set(id, {
            component,
            instances: new Set()
        });
    }

    /**
     * Update component
     * @param {string} id - Component ID
     * @param {Function} newComponent - New component function
     */
    updateComponent(id, newComponent) {
        if (!this.enabled) return;

        const entry = this.componentRegistry.get(id);
        if (!entry) return;

        const oldComponent = entry.component;
        entry.component = newComponent;

        // Notify all update handlers
        this.updateHandlers.forEach(handler => {
            try {
                handler({ id, oldComponent, newComponent });
            } catch (error) {
                console.error('Error in update handler:', error);
            }
        });

        // Re-render all instances
        entry.instances.forEach(instance => {
            try {
                this.reloadInstance(instance);
            } catch (error) {
                console.error('Error reloading instance:', error);
            }
        });

        if (this.showNotifications) {
            this.showNotification(`Updated: ${id}`);
        }
    }

    /**
     * Reload component instance
     * @param {Object} instance - Component instance
     */
    reloadInstance(instance) {
        if (instance && typeof instance.forceUpdate === 'function') {
            instance.forceUpdate();
        }
    }

    /**
     * Setup web hot reload (HMR)
     */
    setupWebHotReload() {
        if (typeof module !== 'undefined' && module.hot) {
            module.hot.accept((err) => {
                if (err) {
                    console.error('HMR Error:', err);
                }
            });

            module.hot.dispose(() => {
                this.componentRegistry.clear();
            });
        }
    }

    /**
     * Setup Electron hot reload
     */
    setupElectronHotReload() {
        if (typeof require !== 'undefined') {
            try {
                const { ipcRenderer } = require('electron');

                ipcRenderer.on('hot-reload', (event, data) => {
                    this.handleHotReload(data);
                });
            } catch (error) {
                console.warn('Could not setup Electron hot reload:', error);
            }
        }
    }

    /**
     * Setup Tauri hot reload
     */
    setupTauriHotReload() {
        if (typeof window !== 'undefined' && window.__TAURI__) {
            // Tauri hot reload via WebSocket or event system
            window.__TAURI__.event.listen('hot-reload', (event) => {
                this.handleHotReload(event.payload);
            });
        }
    }

    /**
     * Handle hot reload event
     * @param {Object} data - Reload data
     */
    handleHotReload(data) {
        const { type, componentId, code } = data;

        if (type === 'component-update') {
            try {
                // Dynamically evaluate new component code
                const newComponent = this.evaluateComponent(code);
                this.updateComponent(componentId, newComponent);
            } catch (error) {
                console.error('Error during hot reload:', error);
                this.showNotification(`Hot Reload Error: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Evaluate component code
     * @param {string} code - Component code
     * @returns {Function} Component function
     */
    evaluateComponent(code) {
        // Safely evaluate component code
        // In production, this should use a more secure method
        return new Function('return ' + code)();
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'info') {
        if (!this.showNotifications) return;

        console.log(`[Hot Reload] ${message}`);

        // Create visual notification for mobile/desktop
        if (typeof document !== 'undefined') {
            const notification = document.createElement('div');
            notification.textContent = message;
            notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? '#ff4444' : '#4CAF50'};
        color: white;
        border-radius: 4px;
        z-index: 10000;
        font-family: sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        animation: slideIn 0.3s;
      `;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
}

/**
 * Global hot reload manager instance
 */
export const hotReloadManager = new HotReloadManager();

/**
 * Enable hot reload (shortcut)
 * @param {Object} options - Configuration options
 */
export function enableHotReload(options) {
    hotReloadManager.enable(options);
}

/**
 * Disable hot reload (shortcut)
 */
export function disableHotReload() {
    hotReloadManager.disable();
}

/**
 * HOC to make component hot-reloadable
 * @param {Function} component - Component to wrap
 * @param {string} id - Component ID
 * @returns {Function} Wrapped component
 */
export function hotReloadable(component, id) {
    hotReloadManager.registerComponent(id, component);
    return component;
}

export default {
    hotReloadManager,
    enableHotReload,
    disableHotReload,
    hotReloadable
};