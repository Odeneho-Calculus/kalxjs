// packages/devtools/src/index.js
/**
 * kalxjs DevTools - Developer tools for debugging and inspecting kalxjs applications
 */

// Export package version
export const version = '1.0.0';

/**
 * Setup development tools for KALXJS applications
 * @param {Object} app - The KALXJS application instance
 * @param {Object} options - Configuration options for devtools
 * @param {boolean} [options.logLifecycleEvents=false] - Whether to log component lifecycle events
 * @param {boolean} [options.performanceMonitoring=false] - Whether to enable performance monitoring
 */
export function setupDevTools(app, options = {}) {
    const defaultOptions = {
        logLifecycleEvents: false,
        performanceMonitoring: false
    };

    const mergedOptions = { ...defaultOptions, ...options };

    console.log('🛠️ KALXJS DevTools initialized with options:', mergedOptions);

    // Create global devtools object
    window.__KALXJS_DEVTOOLS__ = {
        app,
        options: mergedOptions,
        enabled: true,
        version
    };

    return window.__KALXJS_DEVTOOLS__;
}

/**
 * Create a new DevTools instance
 * @param {Object} app - kalxjs application instance
 * @returns {Object} DevTools instance
 */
export function createDevTools(app) {
    let enabled = false;
    let appInstance = app;

    // Store component events for timeline
    const events = [];
    // Track components for component tree
    const components = new Map();

    const devtools = {
        /**
         * Initialize DevTools
         * @returns {Object} DevTools instance
         */
        init() {
            if (!window) {
                console.warn('kalxjs DevTools can only be used in browser environment');
                return this;
            }

            // Add global access
            window.__kalxjs_DEVTOOLS__ = this;

            // Initialize in all environments, as we don't have access to process.env in browser
            // We'll use a different approach to detect development mode
            const isDevelopment = window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.includes('.local');

            if (isDevelopment) {
                this.enable();
            }

            return this;
        },

        /**
         * Enable DevTools
         */
        enable() {
            if (enabled) return;

            enabled = true;
            console.log('kalxjs DevTools enabled');

            // Initialize UI
            this._initializeUI();

            // Setup hooks for component tracking
            this._setupComponentHooks();
        },

        /**
         * Disable DevTools
         */
        disable() {
            if (!enabled) return;

            enabled = false;
            console.log('kalxjs DevTools disabled');

            // Remove UI
            this._removeUI();

            // Clean up hooks
            this._cleanupHooks();
        },

        /**
         * Log component update event
         * @param {Object} component - Component instance
         * @param {string} eventType - Event type
         */
        logEvent(component, eventType) {
            if (!enabled) return;

            events.push({
                component: component.$options.name || 'Anonymous Component',
                eventType,
                timestamp: Date.now()
            });

            // Update UI
            this._updateTimeline();
        },

        /**
         * Track a component instance
         * @param {Object} component - Component instance
         */
        trackComponent(component) {
            if (!enabled) return;

            const id = component._uid || Date.now().toString();
            components.set(id, component);

            // Update UI
            this._updateComponentTree();
        },

        /**
         * Remove a component from tracking
         * @param {Object} component - Component instance
         */
        untrackComponent(component) {
            if (!enabled) return;

            const id = component._uid || '';
            components.delete(id);

            // Update UI
            this._updateComponentTree();
        },

        /**
         * Inspect data of a component
         * @param {string} componentId - Component ID
         * @returns {Object} Component data
         */
        inspectComponent(componentId) {
            if (!enabled) return null;

            const component = components.get(componentId);
            if (!component) return null;

            return {
                name: component.$options.name || 'Anonymous Component',
                data: { ...component.$data },
                props: { ...component.$props }
            };
        },

        /**
         * Initialize DevTools UI
         * @private
         */
        _initializeUI() {
            console.log('This is a placeholder for DevTools UI initialization');
            // In a real implementation, this would create and inject the DevTools panel
        },

        /**
         * Remove DevTools UI
         * @private
         */
        _removeUI() {
            console.log('This is a placeholder for DevTools UI removal');
            // In a real implementation, this would remove the DevTools panel
        },

        /**
         * Setup hooks to monitor component lifecycle
         * @private
         */
        _setupComponentHooks() {
            if (!appInstance) return;

            // This is a simplified version - in a real implementation,
            // we would hook into component lifecycle methods to track components
            console.log('This is a placeholder for setting up component hooks');
        },

        /**
         * Clean up component monitoring hooks
         * @private
         */
        _cleanupHooks() {
            console.log('This is a placeholder for cleaning up component hooks');
        },

        /**
         * Update timeline view
         * @private
         */
        _updateTimeline() {
            console.log('This is a placeholder for updating timeline UI');
            // In a real implementation, this would update the timeline UI
        },

        /**
         * Update component tree view
         * @private
         */
        _updateComponentTree() {
            console.log('This is a placeholder for updating component tree UI');
            // In a real implementation, this would update the component tree UI
        }
    };

    return devtools;
}

// Developer tools plugin for kalxjs
export const DevToolsPlugin = {
    /**
     * Install DevTools plugin
     * @param {Object} app - kalxjs application instance
     * @param {Object} options - Plugin options
     */
    install(app, options = {}) {
        const devtools = createDevTools(app);

        // Add DevTools instance to app context
        app.provide('devtools', devtools);

        // Initialize DevTools if autoEnable is true
        if (options.autoEnable !== false) {
            devtools.init();
        }
    }
};

// Extension for Chrome DevTools
export function createBrowserExtension() {
    console.log('This is a placeholder for Chrome DevTools extension');
    // In a real implementation, this would create a browser extension
    // that connects to the kalxjs DevTools API
}