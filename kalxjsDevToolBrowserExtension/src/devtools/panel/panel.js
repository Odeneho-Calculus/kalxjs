/**
 * KALXJS DevTools Panel Controller
 * Main controller for the DevTools panel interface
 */

import { MESSAGE_ORIGINS, MESSAGE_TYPES } from '../../shared/constants.js';
import { createLogger, generateId, debounce } from '../../shared/utils.js';
import { createBridge } from '../../shared/bridge.js';
import { EventLogger } from './components/EventLogger.js';
import { PerformanceProfiler } from './components/PerformanceProfiler.js';
import { TimeTravel } from './components/TimeTravel.js';
import { NetworkIntegration } from './components/NetworkIntegration.js';
import { DataExporter } from './components/DataExporter.js';

const logger = createLogger('Panel');

class KalxjsDevToolsPanel {
    constructor() {
        this.bridge = createBridge(MESSAGE_ORIGINS.PANEL);
        this.panelId = generateId('panel');
        this.currentTab = 'components';
        this.isConnected = false;
        this.frameworkData = null;

        // Component tree data
        this.componentTree = [];
        this.selectedComponent = null;
        this.componentFilter = 'all';

        // Legacy data (maintained for compatibility)
        this.eventHistory = [];
        this.eventsPaused = false;
        this.performanceData = [];
        this.isProfilering = false;

        // Advanced component instances (Phase 3 & 4)
        this.eventLogger = null;
        this.performanceProfiler = null;
        this.timeTravel = null;
        this.networkIntegration = null;
        this.dataExporter = null;

        this._initialize();
    }

    /**
     * Initialize panel
     */
    _initialize() {
        logger.info('KALXJS DevTools Panel initializing...');

        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this._setupPanel();
                });
            } else {
                this._setupPanel();
            }

        } catch (error) {
            logger.error('Panel initialization failed:', error);
            this._showErrorState('Initialization failed: ' + error.message);
        }
    }

    /**
     * Setup panel components
     */
    _setupPanel() {
        logger.debug('Setting up panel components...');

        // Setup bridge communication
        this._setupCommunication();

        // Setup UI event handlers
        this._setupEventHandlers();

        // Setup tab system
        this._setupTabSystem();

        // Initialize advanced components (Phase 3 & 4)
        this._initializeAdvancedComponents();

        // Initialize panel state
        this._initializePanelState();

        // Mark panel as ready and notify parent (avoid cross-origin issues)
        window.panelInstance = this; // Global reference for components

        // Send panel ready message to parent DevTools page
        if (window.parent !== window) {
            window.parent.postMessage({
                source: 'kalxjs-devtools-panel',
                type: 'panel-ready',
                timestamp: Date.now()
            }, '*');
        }

        logger.info('Panel setup complete');
    }

    /**
     * Setup communication with DevTools
     */
    _setupCommunication() {
        logger.debug('Setting up panel communication...');

        // Listen for messages from DevTools page (parent window)
        window.addEventListener('message', (event) => {
            if (event.source === window.parent) {
                if (event.data.source === 'kalxjs-devtools') {
                    this._handleDevToolsMessage(event.data);
                } else if (event.data.source === 'kalxjs-devtools-panel') {
                    // Relay messages from panel bridge
                    this._handleBridgeMessage(event.data);
                }
            }
        });

        // Don't connect bridge directly - communicate via parent window
        logger.debug('Panel communication setup complete (using postMessage)');
    }

    /**
     * Setup message handlers
     */
    _setupMessageHandlers() {
        // Messages are now handled via _handleBridgeMessage
        logger.debug('Bridge message handlers registered (via postMessage relay)');
    }

    /**
     * Handle bridge messages relayed from DevTools page
     */
    _handleBridgeMessage(message) {
        const { type, data } = message;

        if (type === MESSAGE_TYPES.FRAMEWORK_DETECTED) {
            this._handleFrameworkDetected(data);
        } else if (type === MESSAGE_TYPES.FRAMEWORK_UNDETECTED) {
            this._handleFrameworkUndetected(data);
        } else if (type === MESSAGE_TYPES.COMPONENT_REGISTERED) {
            this._handleComponentRegistered(data);
        } else if (type === MESSAGE_TYPES.COMPONENT_UPDATED) {
            this._handleComponentUpdated(data);
        } else if (type === MESSAGE_TYPES.STATE_CHANGED) {
            this._handleStateChanged(data);
        } else if (type === MESSAGE_TYPES.EVENT_EMITTED) {
            this._handleEventEmitted(data);
        } else if (type === MESSAGE_TYPES.PERFORMANCE_MARK) {
            this._handlePerformanceMark(data);
        }
    }

    /**
     * Setup UI event handlers
     */
    _setupEventHandlers() {
        // Retry detection button
        const retryBtn = document.getElementById('retry-detection');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this._retryDetection();
            });
        }

        // Manual setup button
        const manualSetupBtn = document.getElementById('manual-setup');
        if (manualSetupBtn) {
            manualSetupBtn.addEventListener('click', () => {
                this._showSetupGuide();
            });
        }

        // Retry connection button
        const retryConnectionBtn = document.getElementById('retry-connection');
        if (retryConnectionBtn) {
            retryConnectionBtn.addEventListener('click', () => {
                this._retryConnection();
            });
        }

        // Header actions
        this._setupHeaderActions();

        // Component search
        this._setupComponentSearch();

        // Event controls
        this._setupEventControls();

        // Performance controls
        this._setupPerformanceControls();

        // Footer actions
        this._setupFooterActions();

        logger.debug('UI event handlers setup complete');
    }

    /**
     * Setup header actions
     */
    _setupHeaderActions() {
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this._refreshData();
            });
        }

        const settingsBtn = document.getElementById('settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this._openSettings();
            });
        }
    }

    /**
     * Setup component search
     */
    _setupComponentSearch() {
        const searchInput = document.getElementById('component-search');
        if (searchInput) {
            const debouncedSearch = debounce((query) => {
                this._filterComponents(query);
            }, 300);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }

        const filterSelect = document.getElementById('component-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.componentFilter = e.target.value;
                this._updateComponentTree();
            });
        }
    }

    /**
     * Setup event controls
     */
    _setupEventControls() {
        const clearEventsBtn = document.getElementById('clear-events');
        if (clearEventsBtn) {
            clearEventsBtn.addEventListener('click', () => {
                this._clearEvents();
            });
        }

        const pauseEventsBtn = document.getElementById('pause-events');
        if (pauseEventsBtn) {
            pauseEventsBtn.addEventListener('click', () => {
                this._toggleEventsPause();
            });
        }
    }

    /**
     * Setup performance controls
     */
    _setupPerformanceControls() {
        const startProfilingBtn = document.getElementById('start-profiling');
        if (startProfilingBtn) {
            startProfilingBtn.addEventListener('click', () => {
                this._toggleProfiling();
            });
        }

        const clearPerformanceBtn = document.getElementById('clear-performance');
        if (clearPerformanceBtn) {
            clearPerformanceBtn.addEventListener('click', () => {
                this._clearPerformanceData();
            });
        }
    }

    /**
     * Setup footer actions
     */
    _setupFooterActions() {
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this._exportData();
            });
        }

        const helpBtn = document.getElementById('help');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this._openHelp();
            });
        }
    }

    /**
     * Setup tab system
     */
    _setupTabSystem() {
        const tabButtons = document.querySelectorAll('.tab-button');

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.currentTarget.getAttribute('data-tab');
                this._switchTab(tabId);
            });
        });

        logger.debug('Tab system setup complete');
    }

    /**
     * Initialize advanced components (Phase 3 & 4)
     */
    _initializeAdvancedComponents() {
        try {
            // Phase 3: Advanced Debugging Features

            // Event Logger - comprehensive event tracking
            this.eventLogger = new EventLogger(this.bridge);
            this.eventLogger.initialize();
            window.eventLoggerInstance = this.eventLogger;

            // Performance Profiler - advanced performance monitoring
            this.performanceProfiler = new PerformanceProfiler(this.bridge);
            this.performanceProfiler.initialize();
            window.performanceProfilerInstance = this.performanceProfiler;

            // Time Travel Debugger - state history and replay
            this.timeTravel = new TimeTravel(this.bridge);
            this.timeTravel.initialize();
            window.timeTravelInstance = this.timeTravel;

            // Phase 4: Professional Features

            // Network Integration - API monitoring and DevTools integration
            this.networkIntegration = new NetworkIntegration(this.bridge);
            this.networkIntegration.initialize();
            window.networkIntegrationInstance = this.networkIntegration;

            // Data Exporter - comprehensive reporting and export
            this.dataExporter = new DataExporter(this.bridge);
            this.dataExporter.initialize();
            window.dataExporterInstance = this.dataExporter;

            logger.info('Advanced components initialized successfully');

        } catch (error) {
            logger.error('Failed to initialize advanced components:', error);
            // Continue with basic functionality even if advanced features fail
        }
    }

    /**
     * Switch active tab
     */
    _switchTab(tabId) {
        if (this.currentTab === tabId) return;

        // Update button states
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update panel visibility
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');

        this.currentTab = tabId;

        // Load tab-specific data
        this._loadTabData(tabId);

        logger.debug(`Switched to tab: ${tabId}`);
    }

    /**
     * Initialize panel state
     */
    _initializePanelState() {
        // Show loading state initially
        this._showState('loading');

        // Start detection timeout
        this._startDetectionTimeout();

        logger.debug('Panel state initialized');
    }

    /**
     * Start detection timeout
     */
    _startDetectionTimeout() {
        setTimeout(() => {
            if (!this.isConnected) {
                logger.warn('Framework detection timeout');
                this._showState('not-detected');
            }
        }, 10000); // 10 second timeout
    }

    /**
     * Handle DevTools messages
     */
    _handleDevToolsMessage(message) {
        const { type, data } = message;

        switch (type) {
            case 'devtools-ping':
                // Respond to DevTools ping with panel ready
                if (window.parent !== window) {
                    window.parent.postMessage({
                        source: 'kalxjs-devtools-panel',
                        type: 'panel-ready',
                        timestamp: Date.now()
                    }, '*');
                }
                break;
            case 'initialize':
                this._handleInitialize(data);
                break;
            case 'framework-detected':
                this._handleFrameworkDetected(data);
                break;
            case 'framework-undetected':
                this._handleFrameworkUndetected(data);
                break;
            case 'devtools-ready':
                this._handleDevToolsReady(data);
                break;
            default:
                logger.debug(`Unhandled DevTools message: ${type}`);
        }
    }

    /**
     * Handle panel initialization
     */
    _handleInitialize(data) {
        logger.info('Panel initialized:', data);

        this.panelId = data.panelId;

        if (data.frameworkDetected) {
            this._showState('connected');
            this.isConnected = true;
        }
    }

    /**
     * Handle framework detection
     */
    _handleFrameworkDetected(data) {
        logger.info('Framework detected:', data);

        this.frameworkData = data.framework;
        this.isConnected = true;

        // Update UI
        this._showState('connected');
        this._updateFrameworkInfo(data.framework);

        // Load initial data
        this._loadInitialData();
    }

    /**
     * Handle framework undetection
     */
    _handleFrameworkUndetected(data) {
        logger.info('Framework undetected:', data);

        this.isConnected = false;
        this._showState('not-detected');
    }

    /**
     * Handle DevTools ready
     */
    _handleDevToolsReady(data) {
        logger.info('DevTools ready:', data);

        if (data.frameworkDetected) {
            this._showState('connected');
        }
    }

    /**
     * Handle component registration
     */
    _handleComponentRegistered(data) {
        logger.debug('Component registered:', data);

        this._addComponentToTree(data.component);
        this._updateComponentStats();
    }

    /**
     * Handle component update
     */
    _handleComponentUpdated(data) {
        logger.debug('Component updated:', data);

        this._updateComponentInTree(data);
        this._updateComponentStats();
    }

    /**
     * Handle state change
     */
    _handleStateChanged(data) {
        logger.debug('State changed:', data);

        if (this.selectedComponent && this.selectedComponent.id === data.componentId) {
            this._updateStateInspector(data);
        }
    }

    /**
     * Handle event emission
     */
    _handleEventEmitted(data) {
        if (this.eventsPaused) return;

        logger.debug('Event emitted:', data);

        // Legacy support
        this.eventHistory.unshift(data);
        if (this.eventHistory.length > 1000) {
            this.eventHistory = this.eventHistory.slice(0, 1000);
        }

        // Forward to advanced event logger (Phase 3)
        if (this.eventLogger) {
            this.eventLogger.logEvent(data);
        }

        // Forward to time travel debugger for state changes (Phase 3)
        if (this.timeTravel && data.stateChange) {
            this.timeTravel.recordStateChange(data.stateChange);
        }

        if (this.currentTab === 'events') {
            this._updateEventList();
        }
    }

    /**
     * Handle performance mark
     */
    _handlePerformanceMark(data) {
        logger.debug('Performance mark:', data);

        // Legacy support
        this.performanceData.push(data);

        // Forward to advanced performance profiler (Phase 3)
        if (this.performanceProfiler) {
            if (data.type === 'component-render') {
                this.performanceProfiler._trackComponentRender(data);
            } else if (data.type === 'state-change') {
                this.performanceProfiler._trackStateChange(data);
            }
        }

        if (this.currentTab === 'performance') {
            this._updatePerformanceChart();
        }
    }

    /**
     * Show specific state
     */
    _showState(stateName) {
        const states = ['loading', 'not-detected', 'connected', 'error'];

        states.forEach(state => {
            const element = document.getElementById(`${state}-state`);
            if (element) {
                element.style.display = state === stateName ? 'flex' : 'none';
            }
        });

        logger.debug(`Showing state: ${stateName}`);
    }

    /**
     * Show error state with message
     */
    _showErrorState(message) {
        this._showState('error');

        const errorDetails = document.getElementById('error-details');
        if (errorDetails) {
            errorDetails.textContent = message;
        }
    }

    /**
     * Update framework information in UI
     */
    _updateFrameworkInfo(framework) {
        const versionBadge = document.getElementById('framework-version');
        const appCount = document.getElementById('app-count');
        const statusBadge = document.getElementById('connection-status');

        if (versionBadge) {
            versionBadge.textContent = `v${framework.version || 'unknown'}`;
        }

        if (appCount) {
            const count = framework.apps || 1;
            appCount.textContent = `${count} app${count === 1 ? '' : 's'}`;
        }

        if (statusBadge) {
            statusBadge.textContent = 'Connected';
            statusBadge.className = 'status-badge connected';
        }
    }

    /**
     * Load initial data after connection
     */
    async _loadInitialData() {
        try {
            // Load component tree
            await this._refreshComponentTree();

            // Load current tab data
            this._loadTabData(this.currentTab);

        } catch (error) {
            logger.error('Failed to load initial data:', error);
        }
    }

    /**
     * Load data for specific tab
     */
    _loadTabData(tabId) {
        switch (tabId) {
            case 'components':
                this._updateComponentTree();
                break;
            case 'state':
                this._updateStateInspector();
                break;
            case 'events':
                this._updateEventList();
                break;
            case 'performance':
                this._updatePerformanceChart();
                break;
        }
    }

    /**
     * Refresh all data
     */
    async _refreshData() {
        if (!this.isConnected) return;

        try {
            await this._refreshComponentTree();
            this._loadTabData(this.currentTab);

            logger.info('Data refreshed');

        } catch (error) {
            logger.error('Data refresh failed:', error);
        }
    }

    /**
     * Refresh component tree
     */
    async _refreshComponentTree() {
        // This would request component tree from the framework
        // For now, we'll use placeholder data
        this._updateComponentTree();
    }

    /**
     * Update component tree display
     */
    _updateComponentTree() {
        const treeContainer = document.getElementById('component-tree');
        if (!treeContainer) return;

        if (this.componentTree.length === 0) {
            treeContainer.innerHTML = `
        <div class="tree-placeholder">
          <div class="placeholder-icon">📦</div>
          <div class="placeholder-text">No components found</div>
        </div>
      `;
        } else {
            // Render component tree
            // This would be a more complex tree rendering implementation
            treeContainer.innerHTML = '<div class="tree-placeholder"><div class="placeholder-text">Component tree rendering...</div></div>';
        }
    }

    /**
     * Update state inspector
     */
    _updateStateInspector() {
        const inspector = document.querySelector('.state-inspector');
        if (!inspector) return;

        if (!this.selectedComponent) {
            inspector.innerHTML = `
        <div class="inspector-placeholder">
          <div class="placeholder-icon">🔍</div>
          <div class="placeholder-text">Select a component to inspect its state</div>
        </div>
      `;
        } else {
            // Render state inspector
            inspector.innerHTML = '<div class="inspector-placeholder"><div class="placeholder-text">State inspector rendering...</div></div>';
        }
    }

    /**
     * Update event list
     */
    _updateEventList() {
        const eventList = document.getElementById('event-list');
        if (!eventList) return;

        if (this.eventHistory.length === 0) {
            eventList.innerHTML = `
        <div class="list-placeholder">
          <div class="placeholder-icon">⚡</div>
          <div class="placeholder-text">No events logged yet</div>
        </div>
      `;
        } else {
            // Render event list
            eventList.innerHTML = '<div class="list-placeholder"><div class="placeholder-text">Event list rendering...</div></div>';
        }
    }

    /**
     * Update performance chart
     */
    _updatePerformanceChart() {
        const chart = document.getElementById('performance-chart');
        if (!chart) return;

        if (this.performanceData.length === 0) {
            chart.innerHTML = `
        <div class="chart-placeholder">
          <div class="placeholder-icon">📊</div>
          <div class="placeholder-text">No performance data available</div>
        </div>
      `;
        } else {
            // Render performance chart
            chart.innerHTML = '<div class="chart-placeholder"><div class="placeholder-text">Performance chart rendering...</div></div>';
        }
    }

    /**
     * Update component statistics
     */
    _updateComponentStats() {
        const componentCount = document.getElementById('component-count');
        if (componentCount) {
            const count = this.componentTree.length;
            componentCount.textContent = `${count} component${count === 1 ? '' : 's'}`;
        }
    }

    /**
     * Placeholder methods for UI actions
     */
    _retryDetection() {
        this._showState('loading');
        // Retry detection logic
    }

    _showSetupGuide() {
        window.open('https://kalxjs.dev/devtools', '_blank');
    }

    _retryConnection() {
        location.reload();
    }

    _openSettings() {
        // Open settings modal
    }

    _filterComponents(query) {
        // Filter component tree by query
    }

    _clearEvents() {
        this.eventHistory = [];
        this._updateEventList();
    }

    _toggleEventsPause() {
        this.eventsPaused = !this.eventsPaused;
        const btn = document.getElementById('pause-events');
        if (btn) {
            btn.textContent = this.eventsPaused ? 'Resume' : 'Pause';
        }
    }

    _toggleProfiling() {
        this.isProfilering = !this.isProfilering;
        const btn = document.getElementById('start-profiling');
        if (btn) {
            btn.textContent = this.isProfilering ? 'Stop Profiling' : 'Start Profiling';
            btn.className = this.isProfilering ? 'btn btn-secondary' : 'btn btn-primary';
        }
    }

    _clearPerformanceData() {
        this.performanceData = [];
        this._updatePerformanceChart();
    }

    _exportData() {
        const data = {
            framework: this.frameworkData,
            components: this.componentTree,
            events: this.eventHistory,
            performance: this.performanceData,
            timestamp: Date.now()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kalxjs-devtools-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    _openHelp() {
        window.open('https://kalxjs.dev/devtools/help', '_blank');
    }

    _addComponentToTree(component) {
        // Add component to tree structure
        this.componentTree.push(component);
    }

    _updateComponentInTree(componentData) {
        // Update existing component in tree
        const index = this.componentTree.findIndex(c => c.id === componentData.id);
        if (index > -1) {
            this.componentTree[index] = { ...this.componentTree[index], ...componentData };
        }
    }

    /**
     * Get panel status
     */
    getStatus() {
        return {
            panelId: this.panelId,
            currentTab: this.currentTab,
            connected: this.isConnected,
            componentCount: this.componentTree.length,
            eventCount: this.eventHistory.length,
            performanceDataCount: this.performanceData.length,
            bridge: this.bridge.getStats()
        };
    }
}

// Initialize panel
let kalxjsPanel;

try {
    kalxjsPanel = new KalxjsDevToolsPanel();

    // Expose for debugging
    if (process.env.NODE_ENV === 'development') {
        window.__KALXJS_DEVTOOLS_PANEL__ = kalxjsPanel;
    }

} catch (error) {
    console.error('KALXJS DevTools Panel failed to initialize:', error);
}

logger.info('KALXJS DevTools Panel loaded');