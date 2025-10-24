/**
 * KALXJS DevTools Injected Script
 * Runs in page context to directly access KALXJS framework
 */

(() => {
    'use strict';

    // Avoid multiple injections
    if (window.__KALXJS_DEVTOOLS_INJECTED__) {
        return;
    }

    const KALXJS_HOOK_NAME = '__KALXJS_DEVTOOLS_HOOK__';
    const logger = {
        debug: (msg, ...args) => console.debug(`[KALXJS DevTools Injected] ${msg}`, ...args),
        info: (msg, ...args) => console.info(`[KALXJS DevTools Injected] ${msg}`, ...args),
        warn: (msg, ...args) => console.warn(`[KALXJS DevTools Injected] ${msg}`, ...args),
        error: (msg, ...args) => console.error(`[KALXJS DevTools Injected] ${msg}`, ...args)
    };

    /**
     * Injected Script Handler
     */
    class InjectedScriptHandler {
        constructor() {
            this.hookInstalled = false;
            this.originalHook = null;
            this.messageQueue = [];
            this.isProcessingQueue = false;

            this._initialize();
        }

        /**
         * Initialize injected script
         */
        _initialize() {
            logger.info('Initializing injected script...');

            // Install or enhance existing hook
            this._setupDevToolsHook();

            // Setup message handlers
            this._setupMessageHandlers();

            // Setup periodic checks
            this._setupPeriodicChecks();

            // Mark as injected
            window.__KALXJS_DEVTOOLS_INJECTED__ = {
                version: '1.0.0',
                initialized: true,
                timestamp: Date.now()
            };

            logger.info('Injected script initialized successfully');
        }

        /**
         * Setup or enhance KALXJS DevTools hook
         */
        _setupDevToolsHook() {
            // Check if hook already exists
            if (window[KALXJS_HOOK_NAME]) {
                logger.info('Existing KALXJS hook found, enhancing...');
                this.originalHook = window[KALXJS_HOOK_NAME];
                this._enhanceExistingHook();
            } else {
                logger.info('Creating new KALXJS DevTools hook...');
                this._createDevToolsHook();
            }

            this.hookInstalled = true;
            this._notifyHookReady();
        }

        /**
         * Create new DevTools hook
         */
        _createDevToolsHook() {
            const hook = {
                // Core properties
                version: '1.0.0',
                apps: new Map(),
                events: new Map(),
                componentInstances: new Map(),
                _buffer: [],
                connected: false,

                // Enhanced tracking
                _injectedEnhancer: this,
                _performanceData: new Map(),
                _eventHistory: [],
                _stateHistory: [],

                /**
                 * Register application
                 */
                registerApp: (app, options = {}) => {
                    const id = options.id || `app-${hook.apps.size + 1}`;

                    const appInfo = {
                        app,
                        id,
                        name: options.name || 'KALXJS App',
                        version: options.version || '2.2.8',
                        rootComponent: app._rootComponent,
                        created: Date.now()
                    };

                    hook.apps.set(id, appInfo);

                    // Enhanced tracking
                    this._trackAppRegistration(appInfo);

                    hook.emit('app:registered', { id, app: appInfo });
                    return id;
                },

                /**
                 * Register component with enhanced tracking
                 */
                registerComponent: (instance, appId) => {
                    const id = instance._uid || `component-${hook.componentInstances.size + 1}`;

                    const componentInfo = {
                        instance,
                        id,
                        appId,
                        name: instance.$options?.name || 'Anonymous',
                        type: instance.$options?.type || 'component',
                        parent: instance.$parent?._uid,
                        children: [],
                        state: this._extractComponentState(instance),
                        props: instance.$props,
                        created: Date.now(),
                        renderCount: 0,
                        lastRenderTime: null
                    };

                    hook.componentInstances.set(id, componentInfo);

                    // Update parent's children
                    if (instance.$parent) {
                        const parent = hook.componentInstances.get(instance.$parent._uid);
                        if (parent) {
                            parent.children.push(id);
                        }
                    }

                    // Enhanced tracking
                    this._trackComponentRegistration(componentInfo);

                    hook.emit('component:registered', { id, component: componentInfo });
                    return id;
                },

                /**
                 * Enhanced component update tracking
                 */
                updateComponent: (id, updates) => {
                    const componentInfo = hook.componentInstances.get(id);
                    if (componentInfo) {
                        const oldState = { ...componentInfo.state };

                        Object.assign(componentInfo.state, updates);
                        componentInfo.renderCount++;
                        componentInfo.lastRenderTime = Date.now();

                        // Track state changes
                        this._trackStateChange(id, oldState, componentInfo.state);

                        hook.emit('component:updated', {
                            id,
                            updates,
                            oldState,
                            newState: componentInfo.state,
                            renderCount: componentInfo.renderCount
                        });
                    }
                },

                /**
                 * Enhanced event emission with tracking
                 */
                emit: (event, data) => {
                    const eventInfo = {
                        event,
                        data,
                        timestamp: Date.now(),
                        stack: new Error().stack
                    };

                    // Add to history
                    hook._eventHistory.push(eventInfo);

                    // Limit history size
                    if (hook._eventHistory.length > 1000) {
                        hook._eventHistory.shift();
                    }

                    // Track event
                    this._trackEvent(eventInfo);

                    // Original emission logic
                    if (!hook.connected) {
                        hook._buffer.push({ event, data, timestamp: Date.now() });
                        return;
                    }

                    const listeners = hook.events.get(event) || [];
                    listeners.forEach(listener => listener(data));

                    // Send to content script
                    this._sendToContentScript('event-emitted', eventInfo);
                },

                /**
                 * Get component tree with enhanced data
                 */
                getComponentTree: (appId) => {
                    const appInfo = hook.apps.get(appId);
                    if (!appInfo) return null;

                    const buildTree = (componentId) => {
                        const component = hook.componentInstances.get(componentId);
                        if (!component) return null;

                        return {
                            id: component.id,
                            name: component.name,
                            type: component.type,
                            state: component.state,
                            props: component.props,
                            renderCount: component.renderCount,
                            lastRenderTime: component.lastRenderTime,
                            performance: this._getComponentPerformance(componentId),
                            children: component.children.map(buildTree).filter(Boolean)
                        };
                    };

                    const rootComponents = Array.from(hook.componentInstances.values())
                        .filter(c => c.appId === appId && !c.parent);

                    return rootComponents.map(root => buildTree(root.id));
                },

                // Standard hook methods
                on: (event, callback) => {
                    if (!hook.events.has(event)) {
                        hook.events.set(event, []);
                    }
                    hook.events.get(event).push(callback);
                    return () => hook.off(event, callback);
                },

                off: (event, callback) => {
                    const listeners = hook.events.get(event);
                    if (listeners) {
                        const index = listeners.indexOf(callback);
                        if (index > -1) {
                            listeners.splice(index, 1);
                        }
                    }
                },

                connect: () => {
                    hook.connected = true;
                    hook._buffer.forEach(({ event, data }) => {
                        hook.emit(event, data);
                    });
                    hook._buffer = [];
                    hook.emit('devtools:connected', { timestamp: Date.now() });
                },

                disconnect: () => {
                    hook.connected = false;
                    hook.emit('devtools:disconnected', { timestamp: Date.now() });
                },

                getApps: () => Array.from(hook.apps.values()),
                getComponents: (appId) => Array.from(hook.componentInstances.values())
                    .filter(c => !appId || c.appId === appId)
            };

            window[KALXJS_HOOK_NAME] = hook;
            logger.info('KALXJS DevTools hook created');
        }

        /**
         * Enhance existing hook with additional functionality
         */
        _enhanceExistingHook() {
            const hook = this.originalHook;

            // Add enhanced tracking if not present
            if (!hook._injectedEnhancer) {
                hook._injectedEnhancer = this;
                hook._performanceData = hook._performanceData || new Map();
                hook._eventHistory = hook._eventHistory || [];
                hook._stateHistory = hook._stateHistory || [];

                // Wrap existing methods with enhanced tracking
                const originalEmit = hook.emit;
                hook.emit = (event, data) => {
                    this._trackEvent({ event, data, timestamp: Date.now() });
                    return originalEmit.call(hook, event, data);
                };

                const originalRegisterComponent = hook.registerComponent;
                if (originalRegisterComponent) {
                    hook.registerComponent = (instance, appId) => {
                        const result = originalRegisterComponent.call(hook, instance, appId);
                        this._trackComponentRegistration(hook.componentInstances.get(result));
                        return result;
                    };
                }

                logger.info('Existing KALXJS hook enhanced');
            }
        }

        /**
         * Setup message handlers
         */
        _setupMessageHandlers() {
            window.addEventListener('message', (event) => {
                if (event.source !== window) return;

                const message = event.data;
                if (!message.source || message.source !== 'kalxjs-devtools-content') return;

                this._handleContentScriptMessage(message);
            });
        }

        /**
         * Handle messages from content script
         */
        _handleContentScriptMessage(message) {
            const { type, data } = message;

            switch (type) {
                case 'component-inspect':
                    this._handleComponentInspect(data);
                    break;
                case 'state-update':
                    this._handleStateUpdate(data);
                    break;
                case 'performance-start':
                    this._handlePerformanceStart(data);
                    break;
                case 'performance-stop':
                    this._handlePerformanceStop(data);
                    break;
                default:
                    logger.warn(`Unhandled content script message: ${type}`);
            }
        }

        /**
         * Setup periodic checks for framework detection
         */
        _setupPeriodicChecks() {
            // Check for KALXJS framework periodically
            const checkInterval = setInterval(() => {
                if (this._isKalxjsFrameworkPresent()) {
                    this._notifyFrameworkDetected();
                    clearInterval(checkInterval);
                }
            }, 1000);

            // Clear after 30 seconds to avoid infinite checking
            setTimeout(() => clearInterval(checkInterval), 30000);
        }

        /**
         * Check if KALXJS framework is present
         */
        _isKalxjsFrameworkPresent() {
            return !!(
                window.KALXJS ||
                window.__KALXJS__ ||
                window[KALXJS_HOOK_NAME] ||
                document.querySelector('[data-kalxjs]') ||
                document.querySelector('[kalx-app]')
            );
        }

        /**
         * Track application registration
         */
        _trackAppRegistration(appInfo) {
            this._sendToContentScript('app-registered', {
                app: {
                    id: appInfo.id,
                    name: appInfo.name,
                    version: appInfo.version,
                    created: appInfo.created
                }
            });
        }

        /**
         * Track component registration
         */
        _trackComponentRegistration(componentInfo) {
            this._sendToContentScript('component-registered', {
                component: {
                    id: componentInfo.id,
                    name: componentInfo.name,
                    type: componentInfo.type,
                    appId: componentInfo.appId,
                    parent: componentInfo.parent,
                    created: componentInfo.created
                }
            });
        }

        /**
         * Track state changes
         */
        _trackStateChange(componentId, oldState, newState) {
            const hook = window[KALXJS_HOOK_NAME];
            if (hook) {
                const stateChange = {
                    componentId,
                    oldState: this._deepClone(oldState),
                    newState: this._deepClone(newState),
                    timestamp: Date.now()
                };

                hook._stateHistory.push(stateChange);

                // Limit history
                if (hook._stateHistory.length > 500) {
                    hook._stateHistory.shift();
                }

                this._sendToContentScript('state-changed', stateChange);
            }
        }

        /**
         * Track events
         */
        _trackEvent(eventInfo) {
            this._sendToContentScript('event-emitted', eventInfo);
        }

        /**
         * Handle component inspection
         */
        _handleComponentInspect(data) {
            const hook = window[KALXJS_HOOK_NAME];
            if (!hook) return;

            const component = hook.componentInstances.get(data.componentId);
            if (component) {
                this._sendToContentScript('component-inspect-result', {
                    component: {
                        ...component,
                        state: this._extractComponentState(component.instance),
                        performance: this._getComponentPerformance(data.componentId)
                    }
                });
            }
        }

        /**
         * Handle state updates
         */
        _handleStateUpdate(data) {
            const hook = window[KALXJS_HOOK_NAME];
            if (!hook) return;

            const component = hook.componentInstances.get(data.componentId);
            if (component && component.instance) {
                try {
                    // Update component state
                    Object.assign(component.instance.$data, data.newState);

                    // Trigger reactivity if available
                    if (component.instance.$forceUpdate) {
                        component.instance.$forceUpdate();
                    }

                    hook.updateComponent(data.componentId, data.newState);

                } catch (error) {
                    logger.error('State update failed:', error);
                }
            }
        }

        /**
         * Handle performance tracking start
         */
        _handlePerformanceStart(data) {
            const hook = window[KALXJS_HOOK_NAME];
            if (!hook) return;

            hook._performanceData.set(data.markId, {
                start: performance.now(),
                component: data.componentId,
                operation: data.operation
            });
        }

        /**
         * Handle performance tracking stop
         */
        _handlePerformanceStop(data) {
            const hook = window[KALXJS_HOOK_NAME];
            if (!hook) return;

            const perfData = hook._performanceData.get(data.markId);
            if (perfData) {
                perfData.end = performance.now();
                perfData.duration = perfData.end - perfData.start;

                this._sendToContentScript('performance-mark', {
                    markId: data.markId,
                    ...perfData
                });
            }
        }

        /**
         * Extract component state safely
         */
        _extractComponentState(instance) {
            const state = {};

            try {
                if (instance.$data) {
                    Object.keys(instance.$data).forEach(key => {
                        state[key] = this._safeStringify(instance.$data[key]);
                    });
                }

                if (instance.$refs) {
                    state._refs = Object.keys(instance.$refs);
                }

                if (instance.$options?.computed) {
                    state._computed = {};
                    Object.keys(instance.$options.computed).forEach(key => {
                        state._computed[key] = this._safeStringify(instance[key]);
                    });
                }
            } catch (error) {
                logger.warn('State extraction failed:', error);
                state._error = error.message;
            }

            return state;
        }

        /**
         * Get component performance data
         */
        _getComponentPerformance(componentId) {
            const hook = window[KALXJS_HOOK_NAME];
            if (!hook) return null;

            const perfEntries = Array.from(hook._performanceData.values())
                .filter(entry => entry.component === componentId);

            return {
                totalRenders: perfEntries.length,
                averageRenderTime: perfEntries.reduce((sum, entry) =>
                    sum + (entry.duration || 0), 0) / perfEntries.length || 0,
                lastRenderTime: Math.max(...perfEntries.map(entry => entry.end || 0))
            };
        }

        /**
         * Safe stringify with circular reference handling
         */
        _safeStringify(obj) {
            try {
                return JSON.parse(JSON.stringify(obj));
            } catch (error) {
                return '[Circular or Non-serializable]';
            }
        }

        /**
         * Deep clone utility
         */
        _deepClone(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(item => this._deepClone(item));

            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this._deepClone(obj[key]);
            });
            return cloned;
        }

        /**
         * Send message to content script
         */
        _sendToContentScript(type, data) {
            try {
                window.postMessage({
                    source: 'kalxjs-devtools-injected',
                    origin: 'injected-script',
                    type,
                    data,
                    timestamp: Date.now()
                }, '*');
            } catch (error) {
                logger.error('Failed to send message to content script:', error);
            }
        }

        /**
         * Notify that hook is ready
         */
        _notifyHookReady() {
            this._sendToContentScript('framework-hook-ready', {
                hookVersion: '1.0.0',
                enhanced: !!this.originalHook,
                timestamp: Date.now()
            });
        }

        /**
         * Notify framework detection
         */
        _notifyFrameworkDetected() {
            this._sendToContentScript('framework-detected', {
                framework: 'KALXJS',
                version: this._detectFrameworkVersion(),
                features: this._detectFrameworkFeatures(),
                timestamp: Date.now()
            });
        }

        /**
         * Detect framework version
         */
        _detectFrameworkVersion() {
            if (window.KALXJS?.version) return window.KALXJS.version;
            if (window.__KALXJS__?.version) return window.__KALXJS__.version;

            const hook = window[KALXJS_HOOK_NAME];
            if (hook?.version) return hook.version;

            return 'unknown';
        }

        /**
         * Detect framework features
         */
        _detectFrameworkFeatures() {
            const features = [];

            if (window.KALXJS) features.push('global-api');
            if (window[KALXJS_HOOK_NAME]) features.push('devtools-hook');
            if (document.querySelector('[data-kalxjs]')) features.push('component-attributes');

            return features;
        }
    }

    // Initialize injected script handler
    try {
        new InjectedScriptHandler();
        logger.info('KALXJS DevTools injected script loaded successfully');
    } catch (error) {
        logger.error('Failed to initialize injected script:', error);
    }

})();