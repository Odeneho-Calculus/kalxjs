// @kalxjs/devtools - Enhanced Developer Tools
// Advanced debugging and development experience tools

import { signal, derived, createEffect } from '../../core/src/reactivity/signals.js';

/**
 * Enhanced KalxJS Developer Tools
 */
export class EnhancedDevTools {
    constructor() {
        this.isEnabled = signal(false);
        this.components = new Map();
        this.performanceMetrics = new Map();
        this.errorLog = signal([]);
        this.warningLog = signal([]);
        this.reactivityGraph = new Map();
        this.renderingStats = signal({
            totalRenders: 0,
            averageRenderTime: 0,
            slowestRender: 0,
            fastestRender: Infinity
        });

        this.setupGlobalHooks();
        this.initializeUI();
    }

    /**
     * Enables developer tools
     */
    enable() {
        this.isEnabled(true);
        console.log('🚀 KalxJS Enhanced DevTools enabled');
        this.injectDevToolsUI();
    }

    /**
     * Disables developer tools
     */
    disable() {
        this.isEnabled(false);
        this.removeDevToolsUI();
    }

    /**
     * Sets up global hooks for component tracking
     */
    setupGlobalHooks() {
        if (typeof window !== 'undefined') {
            window.__KALX_ENHANCED_DEVTOOLS__ = this;
            this.setupConsoleHooks();
            this.setupErrorHandling();
            this.setupPerformanceMonitoring();
        }
    }

    /**
     * Registers a component with the devtools
     */
    registerComponent(component) {
        const id = component._uid || this.generateComponentId();
        const componentInfo = {
            id,
            name: component.$options?.name || 'Anonymous',
            instance: component,
            props: component.props || {},
            state: this.extractComponentState(component),
            renderCount: 0,
            lastRenderTime: 0,
            averageRenderTime: 0,
            children: new Set(),
            parent: null,
            isActive: true,
            createdAt: Date.now()
        };

        this.components.set(id, componentInfo);
        this.trackComponentRenders(component, componentInfo);

        return id;
    }

    /**
     * Tracks component renders for performance analysis
     */
    trackComponentRenders(component, componentInfo) {
        const originalRender = component.render;

        component.render = (...args) => {
            const startTime = performance.now();

            try {
                const result = originalRender.apply(component, args);

                const endTime = performance.now();
                const renderTime = endTime - startTime;

                // Update component stats
                componentInfo.renderCount++;
                componentInfo.lastRenderTime = renderTime;
                componentInfo.averageRenderTime =
                    (componentInfo.averageRenderTime * (componentInfo.renderCount - 1) + renderTime) /
                    componentInfo.renderCount;

                // Update global stats
                this.updateRenderingStats(renderTime);

                // Log slow renders
                if (renderTime > 16) {
                    this.logWarning(`Slow render detected in ${componentInfo.name}: ${renderTime.toFixed(2)}ms`);
                }

                return result;
            } catch (error) {
                this.logError(`Render error in ${componentInfo.name}:`, error);
                throw error;
            }
        };
    }

    /**
     * Extracts component state for inspection
     */
    extractComponentState(component) {
        const state = {};

        if (component.$data) {
            Object.keys(component.$data).forEach(key => {
                state[key] = {
                    value: component.$data[key],
                    type: 'data',
                    reactive: true
                };
            });
        }

        return state;
    }

    /**
     * Updates rendering statistics
     */
    updateRenderingStats(renderTime) {
        const stats = this.renderingStats();
        const newStats = {
            totalRenders: stats.totalRenders + 1,
            averageRenderTime: (stats.averageRenderTime * stats.totalRenders + renderTime) / (stats.totalRenders + 1),
            slowestRender: Math.max(stats.slowestRender, renderTime),
            fastestRender: Math.min(stats.fastestRender, renderTime)
        };

        this.renderingStats(newStats);
    }

    /**
     * Sets up console hooks to capture logs
     */
    setupConsoleHooks() {
        const originalConsole = {
            warn: console.warn,
            error: console.error
        };

        console.warn = (...args) => {
            this.logWarning(args.join(' '));
            originalConsole.warn.apply(console, args);
        };

        console.error = (...args) => {
            this.logError(args.join(' '));
            originalConsole.error.apply(console, args);
        };
    }

    /**
     * Sets up global error handling
     */
    setupErrorHandling() {
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.logError('Global Error:', event.error);
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.logError('Unhandled Promise Rejection:', event.reason);
            });
        }
    }

    /**
     * Sets up performance monitoring
     */
    setupPerformanceMonitoring() {
        if (typeof window !== 'undefined' && window.PerformanceObserver) {
            try {
                const longTaskObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.duration > 50) {
                            this.logWarning(`Long task detected: ${entry.duration.toFixed(2)}ms`);
                        }
                    });
                });

                longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                // Long task API not supported
            }
        }
    }

    /**
     * Logs an error
     */
    logError(message, error = null) {
        const errorEntry = {
            id: Date.now(),
            type: 'error',
            message,
            error,
            timestamp: new Date().toISOString(),
            stack: error?.stack
        };

        const currentErrors = this.errorLog();
        this.errorLog([...currentErrors, errorEntry]);
    }

    /**
     * Logs a warning
     */
    logWarning(message) {
        const warningEntry = {
            id: Date.now(),
            type: 'warning',
            message,
            timestamp: new Date().toISOString()
        };

        const currentWarnings = this.warningLog();
        this.warningLog([...currentWarnings, warningEntry]);
    }

    /**
     * Generates a unique component ID
     */
    generateComponentId() {
        return `kalx-component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Initializes the DevTools UI
     */
    initializeUI() {
        if (typeof window === 'undefined') return;
        this.createDevToolsPanel();
        this.setupKeyboardShortcuts();
    }

    /**
     * Creates the DevTools panel
     */
    createDevToolsPanel() {
        const panel = document.createElement('div');
        panel.id = 'kalx-enhanced-devtools-panel';
        panel.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            width: 400px;
            height: 100vh;
            background: #1e1e1e;
            color: #ffffff;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 12px;
            z-index: 999999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border-left: 1px solid #333;
        `;

        panel.innerHTML = this.generatePanelHTML();
        document.body.appendChild(panel);

        this.devToolsPanel = panel;
        this.setupPanelInteractions();
    }

    /**
     * Generates the HTML for the DevTools panel
     */
    generatePanelHTML() {
        return `
            <div class="kalx-devtools-header" style="
                background: #2d2d2d;
                padding: 10px;
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h3 style="margin: 0; color: #61dafb;">KalxJS Enhanced DevTools</h3>
                <button id="kalx-devtools-close" style="
                    background: none;
                    border: none;
                    color: #ffffff;
                    cursor: pointer;
                    font-size: 16px;
                ">×</button>
            </div>

            <div class="kalx-devtools-tabs" style="
                display: flex;
                background: #2d2d2d;
                border-bottom: 1px solid #333;
            ">
                <button class="kalx-tab active" data-tab="components" style="
                    background: none;
                    border: none;
                    color: #ffffff;
                    padding: 10px 15px;
                    cursor: pointer;
                    border-bottom: 2px solid #61dafb;
                ">Components</button>
                <button class="kalx-tab" data-tab="performance" style="
                    background: none;
                    border: none;
                    color: #888;
                    padding: 10px 15px;
                    cursor: pointer;
                ">Performance</button>
                <button class="kalx-tab" data-tab="console" style="
                    background: none;
                    border: none;
                    color: #888;
                    padding: 10px 15px;
                    cursor: pointer;
                ">Console</button>
            </div>

            <div class="kalx-devtools-content" style="
                flex: 1;
                overflow-y: auto;
                padding: 10px;
            ">
                <div id="kalx-tab-components" class="kalx-tab-content">
                    <div id="kalx-component-tree"></div>
                </div>
                <div id="kalx-tab-performance" class="kalx-tab-content" style="display: none;">
                    <div id="kalx-performance-stats"></div>
                </div>
                <div id="kalx-tab-console" class="kalx-tab-content" style="display: none;">
                    <div id="kalx-console-logs"></div>
                </div>
            </div>
        `;
    }

    /**
     * Sets up panel interactions
     */
    setupPanelInteractions() {
        const panel = this.devToolsPanel;

        // Close button
        const closeBtn = panel.querySelector('#kalx-devtools-close');
        closeBtn.addEventListener('click', () => this.hidePanel());

        // Tab switching
        const tabs = panel.querySelectorAll('.kalx-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Update content reactively
        createEffect(() => {
            this.updatePanelContent();
        });
    }

    /**
     * Switches between tabs
     */
    switchTab(tabName) {
        const panel = this.devToolsPanel;

        // Update tab buttons
        panel.querySelectorAll('.kalx-tab').forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
                tab.style.color = '#ffffff';
                tab.style.borderBottom = '2px solid #61dafb';
            } else {
                tab.classList.remove('active');
                tab.style.color = '#888';
                tab.style.borderBottom = 'none';
            }
        });

        // Update content
        panel.querySelectorAll('.kalx-tab-content').forEach(content => {
            content.style.display = content.id === `kalx-tab-${tabName}` ? 'block' : 'none';
        });

        this.updateTabContent(tabName);
    }

    /**
     * Updates tab content
     */
    updateTabContent(tabName) {
        switch (tabName) {
            case 'components':
                this.updateComponentsTab();
                break;
            case 'performance':
                this.updatePerformanceTab();
                break;
            case 'console':
                this.updateConsoleTab();
                break;
        }
    }

    /**
     * Updates the components tab
     */
    updateComponentsTab() {
        const container = this.devToolsPanel.querySelector('#kalx-component-tree');
        const components = Array.from(this.components.values()).filter(c => c.isActive);

        container.innerHTML = components.map(component => `
            <div class="kalx-component-item" style="
                margin-bottom: 10px;
                padding: 8px;
                background: #2d2d2d;
                border-radius: 4px;
                cursor: pointer;
            " data-component-id="${component.id}">
                <div style="font-weight: bold; color: #61dafb;">
                    ${component.name}
                </div>
                <div style="font-size: 11px; color: #888; margin-top: 4px;">
                    Renders: ${component.renderCount} |
                    Avg: ${component.averageRenderTime.toFixed(2)}ms
                </div>
                <div style="font-size: 11px; color: #888;">
                    Props: ${Object.keys(component.props).length} |
                    State: ${Object.keys(component.state).length}
                </div>
            </div>
        `).join('');
    }

    /**
     * Updates the performance tab
     */
    updatePerformanceTab() {
        const container = this.devToolsPanel.querySelector('#kalx-performance-stats');
        const stats = this.renderingStats();

        container.innerHTML = `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #61dafb;">Rendering Performance</h4>
                <div style="margin-bottom: 5px;">
                    Total Renders: <span style="color: #ffffff;">${stats.totalRenders}</span>
                </div>
                <div style="margin-bottom: 5px;">
                    Average Time: <span style="color: #ffffff;">${stats.averageRenderTime.toFixed(2)}ms</span>
                </div>
                <div style="margin-bottom: 5px;">
                    Fastest: <span style="color: #4caf50;">${stats.fastestRender === Infinity ? 'N/A' : stats.fastestRender.toFixed(2) + 'ms'}</span>
                </div>
                <div style="margin-bottom: 5px;">
                    Slowest: <span style="color: #f44336;">${stats.slowestRender.toFixed(2)}ms</span>
                </div>
            </div>
        `;
    }

    /**
     * Updates the console tab
     */
    updateConsoleTab() {
        const container = this.devToolsPanel.querySelector('#kalx-console-logs');
        const errors = this.errorLog();
        const warnings = this.warningLog();
        const allLogs = [...errors, ...warnings].sort((a, b) => b.id - a.id);

        container.innerHTML = allLogs.map(log => `
            <div style="
                margin-bottom: 8px;
                padding: 6px;
                background: ${log.type === 'error' ? '#4a1a1a' : '#4a3a1a'};
                border-left: 3px solid ${log.type === 'error' ? '#f44336' : '#ff9800'};
                border-radius: 3px;
                font-size: 11px;
            ">
                <div style="color: ${log.type === 'error' ? '#f44336' : '#ff9800'}; font-weight: bold;">
                    ${log.type.toUpperCase()}
                </div>
                <div style="color: #ffffff; margin-top: 4px;">
                    ${log.message}
                </div>
                <div style="color: #888; margin-top: 4px; font-size: 10px;">
                    ${new Date(log.timestamp).toLocaleTimeString()}
                </div>
            </div>
        `).join('');
    }

    /**
     * Updates panel content
     */
    updatePanelContent() {
        if (!this.devToolsPanel || !this.isEnabled()) return;

        const activeTab = this.devToolsPanel.querySelector('.kalx-tab.active');
        if (activeTab) {
            this.updateTabContent(activeTab.dataset.tab);
        }
    }

    /**
     * Sets up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        if (typeof window === 'undefined') return;

        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + Shift + D to toggle devtools
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
                event.preventDefault();
                this.toggle();
            }
        });
    }

    /**
     * Toggles the DevTools panel
     */
    toggle() {
        if (this.isEnabled()) {
            if (this.isPanelVisible()) {
                this.hidePanel();
            } else {
                this.showPanel();
            }
        } else {
            this.enable();
            this.showPanel();
        }
    }

    /**
     * Shows the DevTools panel
     */
    showPanel() {
        if (this.devToolsPanel) {
            this.devToolsPanel.style.transform = 'translateX(0)';
        }
    }

    /**
     * Hides the DevTools panel
     */
    hidePanel() {
        if (this.devToolsPanel) {
            this.devToolsPanel.style.transform = 'translateX(100%)';
        }
    }

    /**
     * Checks if panel is visible
     */
    isPanelVisible() {
        return this.devToolsPanel &&
            this.devToolsPanel.style.transform === 'translateX(0px)';
    }

    /**
     * Injects DevTools UI
     */
    injectDevToolsUI() {
        if (!this.devToolsPanel) {
            this.createDevToolsPanel();
        }
    }

    /**
     * Removes DevTools UI
     */
    removeDevToolsUI() {
        if (this.devToolsPanel) {
            this.devToolsPanel.remove();
            this.devToolsPanel = null;
        }
    }
}

/**
 * Hot Module Replacement (HMR) Manager
 */
export class HMRManager {
    constructor() {
        this.componentRegistry = new Map();
        this.updateQueue = [];
        this.isUpdating = false;
    }

    /**
     * Registers a component for HMR
     */
    register(id, component) {
        this.componentRegistry.set(id, {
            component,
            instances: new Set(),
            lastUpdate: Date.now()
        });
    }

    /**
     * Updates a component
     */
    update(id, newComponent) {
        const entry = this.componentRegistry.get(id);
        if (!entry) return;

        entry.component = newComponent;
        entry.lastUpdate = Date.now();

        // Queue update for all instances
        entry.instances.forEach(instance => {
            this.queueUpdate(instance, newComponent);
        });

        this.processUpdateQueue();
    }

    /**
     * Queues an instance update
     */
    queueUpdate(instance, newComponent) {
        this.updateQueue.push({ instance, newComponent });
    }

    /**
     * Processes the update queue
     */
    async processUpdateQueue() {
        if (this.isUpdating) return;
        this.isUpdating = true;

        try {
            while (this.updateQueue.length > 0) {
                const { instance, newComponent } = this.updateQueue.shift();
                await this.updateInstance(instance, newComponent);
            }
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Updates a component instance
     */
    async updateInstance(instance, newComponent) {
        try {
            // Preserve state
            const oldState = this.extractState(instance);

            // Update component definition
            Object.assign(instance.$options, newComponent);

            // Re-run setup if it exists
            if (newComponent.setup) {
                const newSetupResult = newComponent.setup(instance.props, instance);
                Object.assign(instance, newSetupResult);
            }

            // Restore state
            this.restoreState(instance, oldState);

            // Trigger re-render
            if (instance.$update) {
                instance.$update();
            }

            console.log(`🔥 HMR: Updated component ${newComponent.name || 'Anonymous'}`);
        } catch (error) {
            console.error('HMR update failed:', error);
        }
    }

    /**
     * Extracts component state
     */
    extractState(instance) {
        const state = {};

        if (instance.$data) {
            Object.assign(state, instance.$data);
        }

        return state;
    }

    /**
     * Restores component state
     */
    restoreState(instance, state) {
        if (instance.$data) {
            Object.assign(instance.$data, state);
        }
    }
}

// Global instances
let enhancedDevTools = null;
let hmrManager = null;

/**
 * Initializes Enhanced KalxJS DevTools
 */
export function initEnhancedDevTools(options = {}) {
    if (!enhancedDevTools) {
        enhancedDevTools = new EnhancedDevTools();
        hmrManager = new HMRManager();

        if (options.autoEnable !== false) {
            enhancedDevTools.enable();
        }
    }

    return enhancedDevTools;
}

/**
 * Gets the Enhanced DevTools instance
 */
export function getEnhancedDevTools() {
    return enhancedDevTools;
}

/**
 * Gets the HMR manager
 */
export function getHMRManager() {
    return hmrManager;
}

// Auto-initialize in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    initEnhancedDevTools();
}