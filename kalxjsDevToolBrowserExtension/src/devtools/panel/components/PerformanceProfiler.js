/**
 * Performance Profiler Component
 * Advanced performance monitoring and analysis
 */

import { createLogger, formatDuration, debounce } from '../../../shared/utils.js';

const logger = createLogger('PerformanceProfiler');

export class PerformanceProfiler {
    constructor(bridge) {
        this.bridge = bridge;
        this.isProfilering = false;
        this.performanceData = [];
        this.memorySnapshots = [];
        this.renderMetrics = new Map();
        this.bundleMetrics = {};
        this.recommendations = [];
        this.thresholds = {
            render: {
                good: 16,
                warning: 50,
                critical: 100
            },
            memory: {
                good: 50 * 1024 * 1024, // 50MB
                warning: 100 * 1024 * 1024, // 100MB
                critical: 200 * 1024 * 1024 // 200MB
            }
        };
        this.profilingSession = null;
        this.observer = null;
    }

    /**
     * Initialize performance profiler
     */
    initialize() {
        this._setupEventHandlers();
        this._initializeObservers();
        this._loadStoredMetrics();
        this._startMemoryMonitoring();
        logger.info('Performance Profiler initialized');
    }

    /**
     * Setup event handlers
     */
    _setupEventHandlers() {
        // Start/stop profiling button
        const profilingBtn = document.getElementById('start-profiling');
        if (profilingBtn) {
            profilingBtn.addEventListener('click', () => this.toggleProfiling());
        }

        // Clear performance data button
        const clearBtn = document.getElementById('clear-performance');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearPerformanceData());
        }

        // Export performance report button
        const exportBtn = document.getElementById('export-performance');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportPerformanceReport());
        }

        // Memory snapshot button
        const snapshotBtn = document.getElementById('take-memory-snapshot');
        if (snapshotBtn) {
            snapshotBtn.addEventListener('click', () => this.takeMemorySnapshot());
        }

        // Performance settings
        const settingsBtn = document.getElementById('performance-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        // Component filter
        const componentFilter = document.getElementById('performance-component-filter');
        if (componentFilter) {
            componentFilter.addEventListener('change', (e) => {
                this._filterPerformanceData(e.target.value);
            });
        }

        // Time range selector
        const timeRangeSelect = document.getElementById('performance-time-range');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', (e) => {
                this._updateTimeRange(e.target.value);
            });
        }
    }

    /**
     * Initialize performance observers
     */
    _initializeObservers() {
        // Performance Observer for various metrics
        if ('PerformanceObserver' in window) {
            try {
                this.observer = new PerformanceObserver((list) => {
                    this._processPerformanceEntries(list.getEntries());
                });

                // Observe multiple types of performance entries
                this.observer.observe({
                    entryTypes: ['navigation', 'resource', 'measure', 'mark']
                });
            } catch (error) {
                logger.warn('PerformanceObserver not fully supported:', error);
            }
        }

        // ResizeObserver for layout performance
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver((entries) => {
                this._trackLayoutChanges(entries);
            });
        }

        // Intersection Observer for visibility tracking
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver((entries) => {
                this._trackVisibilityChanges(entries);
            });
        }
    }

    /**
     * Start profiling session
     */
    startProfiling() {
        if (this.isProfilering) return;

        this.isProfilering = true;
        this.profilingSession = {
            id: `session-${Date.now()}`,
            startTime: performance.now(),
            startMemory: this._getMemoryUsage(),
            metrics: []
        };

        // Clear previous data
        this.performanceData = [];
        this.renderMetrics.clear();

        // Start monitoring
        this._startPerformanceMonitoring();

        // Update UI
        this._updateProfilingUI(true);

        logger.info('Performance profiling started');
    }

    /**
     * Stop profiling session
     */
    stopProfiling() {
        if (!this.isProfilering) return;

        this.isProfilering = false;

        if (this.profilingSession) {
            this.profilingSession.endTime = performance.now();
            this.profilingSession.duration = this.profilingSession.endTime - this.profilingSession.startTime;
            this.profilingSession.endMemory = this._getMemoryUsage();
        }

        // Stop monitoring
        this._stopPerformanceMonitoring();

        // Generate recommendations
        this._generateRecommendations();

        // Update UI
        this._updateProfilingUI(false);
        this._renderPerformanceData();

        logger.info('Performance profiling stopped', this.profilingSession);
    }

    /**
     * Toggle profiling state
     */
    toggleProfiling() {
        if (this.isProfilering) {
            this.stopProfiling();
        } else {
            this.startProfiling();
        }
    }

    /**
     * Start performance monitoring
     */
    _startPerformanceMonitoring() {
        // Hook into KALXJS component lifecycle
        if (window.__KALXJS_DEVTOOLS_HOOK__) {
            window.__KALXJS_DEVTOOLS_HOOK__.onComponentRender = (componentData) => {
                this._trackComponentRender(componentData);
            };

            window.__KALXJS_DEVTOOLS_HOOK__.onStateChange = (stateData) => {
                this._trackStateChange(stateData);
            };
        }

        // Start frame rate monitoring
        this._startFrameRateMonitoring();

        // Monitor network requests
        this._monitorNetworkRequests();
    }

    /**
     * Stop performance monitoring
     */
    _stopPerformanceMonitoring() {
        // Unhook from KALXJS lifecycle
        if (window.__KALXJS_DEVTOOLS_HOOK__) {
            window.__KALXJS_DEVTOOLS_HOOK__.onComponentRender = null;
            window.__KALXJS_DEVTOOLS_HOOK__.onStateChange = null;
        }

        // Stop frame rate monitoring
        this._stopFrameRateMonitoring();
    }

    /**
     * Track component render performance
     */
    _trackComponentRender(componentData) {
        if (!this.isProfilering) return;

        const renderTime = performance.now();
        const renderMetric = {
            id: `render-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: renderTime,
            component: componentData.name,
            type: 'component-render',
            duration: componentData.renderTime || 0,
            props: componentData.props,
            state: componentData.state,
            children: componentData.children?.length || 0,
            memoryUsage: this._getMemoryUsage(),
            callStack: this._getCallStack()
        };

        this.performanceData.push(renderMetric);
        this.renderMetrics.set(componentData.name, {
            ...(this.renderMetrics.get(componentData.name) || { count: 0, totalTime: 0 }),
            count: (this.renderMetrics.get(componentData.name)?.count || 0) + 1,
            totalTime: (this.renderMetrics.get(componentData.name)?.totalTime || 0) + renderMetric.duration,
            lastRender: renderMetric
        });

        // Real-time updates
        if (this.performanceData.length % 10 === 0) {
            this._renderPerformanceData();
        }
    }

    /**
     * Track state change performance
     */
    _trackStateChange(stateData) {
        if (!this.isProfilering) return;

        const stateMetric = {
            id: `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: performance.now(),
            component: stateData.component,
            type: 'state-change',
            duration: stateData.duration || 0,
            changeType: stateData.changeType,
            affectedComponents: stateData.affectedComponents || [],
            memoryUsage: this._getMemoryUsage()
        };

        this.performanceData.push(stateMetric);
    }

    /**
     * Start frame rate monitoring
     */
    _startFrameRateMonitoring() {
        let frames = 0;
        let lastTime = performance.now();

        const measureFPS = () => {
            if (!this.isProfilering) return;

            frames++;
            const currentTime = performance.now();

            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frames * 1000) / (currentTime - lastTime));

                this.performanceData.push({
                    id: `fps-${Date.now()}`,
                    timestamp: currentTime,
                    type: 'frame-rate',
                    fps: fps,
                    memoryUsage: this._getMemoryUsage()
                });

                frames = 0;
                lastTime = currentTime;
            }

            this.frameRateRAF = requestAnimationFrame(measureFPS);
        };

        this.frameRateRAF = requestAnimationFrame(measureFPS);
    }

    /**
     * Stop frame rate monitoring
     */
    _stopFrameRateMonitoring() {
        if (this.frameRateRAF) {
            cancelAnimationFrame(this.frameRateRAF);
            this.frameRateRAF = null;
        }
    }

    /**
     * Monitor network requests
     */
    _monitorNetworkRequests() {
        // Hook into fetch and XMLHttpRequest
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            const start = performance.now();
            return originalFetch.apply(window, args).then(response => {
                if (this.isProfilering) {
                    this._trackNetworkRequest(args[0], response, performance.now() - start);
                }
                return response;
            });
        };
    }

    /**
     * Track network request
     */
    _trackNetworkRequest(url, response, duration) {
        const networkMetric = {
            id: `network-${Date.now()}`,
            timestamp: performance.now(),
            type: 'network-request',
            url: typeof url === 'string' ? url : url.url,
            method: typeof url === 'object' ? url.method : 'GET',
            duration: duration,
            status: response.status,
            size: parseInt(response.headers.get('content-length')) || 0
        };

        this.performanceData.push(networkMetric);
    }

    /**
     * Process performance entries from PerformanceObserver
     */
    _processPerformanceEntries(entries) {
        if (!this.isProfilering) return;

        entries.forEach(entry => {
            const performanceEntry = {
                id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: entry.startTime,
                type: 'performance-entry',
                entryType: entry.entryType,
                name: entry.name,
                duration: entry.duration,
                data: this._extractEntryData(entry)
            };

            this.performanceData.push(performanceEntry);
        });
    }

    /**
     * Extract relevant data from performance entry
     */
    _extractEntryData(entry) {
        const data = {};

        switch (entry.entryType) {
            case 'navigation':
                data.loadEventEnd = entry.loadEventEnd;
                data.domContentLoadedEventEnd = entry.domContentLoadedEventEnd;
                data.responseEnd = entry.responseEnd;
                break;
            case 'resource':
                data.transferSize = entry.transferSize;
                data.encodedBodySize = entry.encodedBodySize;
                data.decodedBodySize = entry.decodedBodySize;
                break;
            case 'measure':
                data.detail = entry.detail;
                break;
        }

        return data;
    }

    /**
     * Take memory snapshot
     */
    takeMemorySnapshot() {
        const snapshot = {
            id: `snapshot-${Date.now()}`,
            timestamp: performance.now(),
            memoryUsage: this._getMemoryUsage(),
            componentCount: this._getComponentCount(),
            eventListeners: this._getEventListenerCount(),
            domNodes: document.querySelectorAll('*').length
        };

        this.memorySnapshots.push(snapshot);
        this._renderMemorySnapshots();

        logger.info('Memory snapshot taken:', snapshot);
    }

    /**
     * Get current memory usage
     */
    _getMemoryUsage() {
        if ('memory' in performance) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    /**
     * Get component count
     */
    _getComponentCount() {
        if (window.__KALXJS_DEVTOOLS_HOOK__) {
            return window.__KALXJS_DEVTOOLS_HOOK__.componentCount || 0;
        }
        return 0;
    }

    /**
     * Get event listener count estimation
     */
    _getEventListenerCount() {
        // This is an approximation since there's no direct way to count all listeners
        return document.querySelectorAll('[onclick], [onchange], [oninput]').length;
    }

    /**
     * Get call stack
     */
    _getCallStack() {
        try {
            throw new Error();
        } catch (e) {
            return e.stack.split('\n').slice(2, 8); // Get first 6 stack frames
        }
    }

    /**
     * Generate performance recommendations
     */
    _generateRecommendations() {
        this.recommendations = [];

        // Analyze render performance
        this._analyzeRenderPerformance();

        // Analyze memory usage
        this._analyzeMemoryUsage();

        // Analyze network performance
        this._analyzeNetworkPerformance();

        // Analyze frame rate
        this._analyzeFrameRate();

        this._renderRecommendations();
    }

    /**
     * Analyze render performance
     */
    _analyzeRenderPerformance() {
        const renderData = this.performanceData.filter(item => item.type === 'component-render');

        if (renderData.length === 0) return;

        // Find slow renders
        const slowRenders = renderData.filter(item => item.duration > this.thresholds.render.warning);
        if (slowRenders.length > 0) {
            this.recommendations.push({
                type: 'performance',
                priority: 'high',
                title: 'Slow Component Renders Detected',
                description: `Found ${slowRenders.length} renders taking longer than ${this.thresholds.render.warning}ms`,
                details: slowRenders.slice(0, 5).map(item => `${item.component}: ${item.duration.toFixed(2)}ms`),
                action: 'Consider optimizing component render logic or using React.memo()',
                category: 'render'
            });
        }

        // Find frequent re-renders
        const componentCounts = {};
        renderData.forEach(item => {
            componentCounts[item.component] = (componentCounts[item.component] || 0) + 1;
        });

        const frequentRerenders = Object.entries(componentCounts)
            .filter(([_, count]) => count > 20)
            .sort((a, b) => b[1] - a[1]);

        if (frequentRerenders.length > 0) {
            this.recommendations.push({
                type: 'performance',
                priority: 'medium',
                title: 'Frequent Re-renders Detected',
                description: `Some components are re-rendering frequently`,
                details: frequentRerenders.slice(0, 3).map(([component, count]) => `${component}: ${count} renders`),
                action: 'Review state management and prop dependencies',
                category: 'render'
            });
        }
    }

    /**
     * Analyze memory usage
     */
    _analyzeMemoryUsage() {
        if (this.memorySnapshots.length < 2) return;

        const latest = this.memorySnapshots[this.memorySnapshots.length - 1];
        const oldest = this.memorySnapshots[0];

        if (latest.memoryUsage && oldest.memoryUsage) {
            const growth = latest.memoryUsage.usedJSHeapSize - oldest.memoryUsage.usedJSHeapSize;
            const growthMB = growth / (1024 * 1024);

            if (growthMB > 10) { // More than 10MB growth
                this.recommendations.push({
                    type: 'memory',
                    priority: 'high',
                    title: 'Memory Usage Growth Detected',
                    description: `Memory usage increased by ${growthMB.toFixed(2)}MB during profiling`,
                    action: 'Check for memory leaks, especially in event listeners and timers',
                    category: 'memory'
                });
            }
        }
    }

    /**
     * Analyze network performance
     */
    _analyzeNetworkPerformance() {
        const networkData = this.performanceData.filter(item => item.type === 'network-request');

        if (networkData.length === 0) return;

        const slowRequests = networkData.filter(item => item.duration > 1000); // > 1 second
        if (slowRequests.length > 0) {
            this.recommendations.push({
                type: 'network',
                priority: 'medium',
                title: 'Slow Network Requests',
                description: `Found ${slowRequests.length} requests taking longer than 1 second`,
                details: slowRequests.slice(0, 3).map(item => `${item.url}: ${item.duration.toFixed(0)}ms`),
                action: 'Consider request optimization, caching, or loading indicators',
                category: 'network'
            });
        }
    }

    /**
     * Analyze frame rate
     */
    _analyzeFrameRate() {
        const fpsData = this.performanceData.filter(item => item.type === 'frame-rate');

        if (fpsData.length === 0) return;

        const avgFPS = fpsData.reduce((sum, item) => sum + item.fps, 0) / fpsData.length;
        const lowFPSCount = fpsData.filter(item => item.fps < 30).length;

        if (avgFPS < 30) {
            this.recommendations.push({
                type: 'performance',
                priority: 'high',
                title: 'Low Frame Rate Detected',
                description: `Average frame rate: ${avgFPS.toFixed(1)} FPS`,
                action: 'Optimize animations and reduce main thread work',
                category: 'fps'
            });
        } else if (lowFPSCount > fpsData.length * 0.2) {
            this.recommendations.push({
                type: 'performance',
                priority: 'medium',
                title: 'Intermittent Frame Drops',
                description: `${((lowFPSCount / fpsData.length) * 100).toFixed(1)}% of frames below 30 FPS`,
                action: 'Identify and optimize performance bottlenecks',
                category: 'fps'
            });
        }
    }

    /**
     * Render performance data
     */
    _renderPerformanceData() {
        this._renderPerformanceOverview();
        this._renderPerformanceChart();
        this._renderComponentMetrics();
        this._renderMemorySnapshots();
    }

    /**
     * Render performance overview
     */
    _renderPerformanceOverview() {
        const container = document.getElementById('performance-overview');
        if (!container) return;

        if (this.performanceData.length === 0) {
            container.innerHTML = '<div class="performance-empty">No performance data available. Start profiling to collect metrics.</div>';
            return;
        }

        const renderData = this.performanceData.filter(item => item.type === 'component-render');
        const avgRenderTime = renderData.length > 0
            ? renderData.reduce((sum, item) => sum + item.duration, 0) / renderData.length
            : 0;

        const memoryData = this.performanceData.find(item => item.memoryUsage);
        const currentMemory = memoryData ? (memoryData.memoryUsage.usedJSHeapSize / (1024 * 1024)).toFixed(2) : 'N/A';

        const fpsData = this.performanceData.filter(item => item.type === 'frame-rate');
        const avgFPS = fpsData.length > 0
            ? (fpsData.reduce((sum, item) => sum + item.fps, 0) / fpsData.length).toFixed(1)
            : 'N/A';

        container.innerHTML = `
            <div class="performance-stats">
                <div class="stat-card">
                    <div class="stat-value">${avgRenderTime.toFixed(2)}ms</div>
                    <div class="stat-label">Avg Render Time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${currentMemory}MB</div>
                    <div class="stat-label">Memory Usage</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${avgFPS}</div>
                    <div class="stat-label">Avg FPS</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${renderData.length}</div>
                    <div class="stat-label">Total Renders</div>
                </div>
            </div>
        `;
    }

    /**
     * Render performance chart
     */
    _renderPerformanceChart() {
        const container = document.getElementById('performance-chart');
        if (!container) return;

        // Simple chart implementation (could be enhanced with Chart.js or D3)
        const renderData = this.performanceData.filter(item => item.type === 'component-render');

        if (renderData.length === 0) {
            container.innerHTML = '<div class="chart-empty">No render data to display</div>';
            return;
        }

        const chartData = renderData.slice(-50); // Show last 50 renders
        const maxDuration = Math.max(...chartData.map(item => item.duration));

        const chartHTML = chartData.map((item, index) => {
            const height = (item.duration / maxDuration) * 100;
            const color = item.duration > this.thresholds.render.critical ? '#ff4444'
                : item.duration > this.thresholds.render.warning ? '#ffaa00'
                    : '#44ff44';

            return `
                <div class="chart-bar" style="height: ${height}%; background-color: ${color};"
                     title="${item.component}: ${item.duration.toFixed(2)}ms" data-index="${index}">
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="chart-container">
                <div class="chart-bars">${chartHTML}</div>
                <div class="chart-labels">
                    <span>Render Performance (Last 50 renders)</span>
                </div>
            </div>
        `;
    }

    /**
     * Render component metrics
     */
    _renderComponentMetrics() {
        const container = document.getElementById('component-metrics');
        if (!container) return;

        if (this.renderMetrics.size === 0) {
            container.innerHTML = '<div class="metrics-empty">No component metrics available</div>';
            return;
        }

        const metrics = Array.from(this.renderMetrics.entries())
            .map(([component, data]) => ({
                component,
                ...data,
                avgTime: data.totalTime / data.count
            }))
            .sort((a, b) => b.avgTime - a.avgTime);

        const metricsHTML = metrics.map(metric => `
            <div class="component-metric">
                <div class="metric-header">
                    <span class="component-name">${metric.component}</span>
                    <span class="render-count">${metric.count} renders</span>
                </div>
                <div class="metric-stats">
                    <div class="metric-stat">
                        <label>Avg Time:</label>
                        <span class="${metric.avgTime > this.thresholds.render.warning ? 'warning' : ''}">${metric.avgTime.toFixed(2)}ms</span>
                    </div>
                    <div class="metric-stat">
                        <label>Total Time:</label>
                        <span>${metric.totalTime.toFixed(2)}ms</span>
                    </div>
                    <div class="metric-stat">
                        <label>Last Render:</label>
                        <span>${metric.lastRender.duration.toFixed(2)}ms</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="component-metrics-list">
                ${metricsHTML}
            </div>
        `;
    }

    /**
     * Render memory snapshots
     */
    _renderMemorySnapshots() {
        const container = document.getElementById('memory-snapshots');
        if (!container) return;

        if (this.memorySnapshots.length === 0) {
            container.innerHTML = '<div class="snapshots-empty">No memory snapshots taken</div>';
            return;
        }

        const snapshotsHTML = this.memorySnapshots.map(snapshot => {
            const memoryUsage = snapshot.memoryUsage ?
                (snapshot.memoryUsage.usedJSHeapSize / (1024 * 1024)).toFixed(2) : 'N/A';

            return `
                <div class="memory-snapshot">
                    <div class="snapshot-header">
                        <span class="snapshot-time">${new Date(snapshot.timestamp).toLocaleTimeString()}</span>
                        <span class="snapshot-memory">${memoryUsage}MB</span>
                    </div>
                    <div class="snapshot-details">
                        <div class="snapshot-stat">Components: ${snapshot.componentCount}</div>
                        <div class="snapshot-stat">DOM Nodes: ${snapshot.domNodes}</div>
                        <div class="snapshot-stat">Event Listeners: ~${snapshot.eventListeners}</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="memory-snapshots-list">
                ${snapshotsHTML}
            </div>
        `;
    }

    /**
     * Render recommendations
     */
    _renderRecommendations() {
        const container = document.getElementById('performance-recommendations');
        if (!container) return;

        if (this.recommendations.length === 0) {
            container.innerHTML = '<div class="recommendations-empty">No performance issues detected</div>';
            return;
        }

        const recommendationsHTML = this.recommendations.map(rec => `
            <div class="recommendation ${rec.priority}">
                <div class="recommendation-header">
                    <span class="recommendation-title">${rec.title}</span>
                    <span class="recommendation-priority ${rec.priority}">${rec.priority.toUpperCase()}</span>
                </div>
                <div class="recommendation-description">${rec.description}</div>
                ${rec.details ? `
                    <div class="recommendation-details">
                        <ul>
                            ${rec.details.map(detail => `<li>${detail}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <div class="recommendation-action">
                    <strong>Action:</strong> ${rec.action}
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="recommendations-list">
                ${recommendationsHTML}
            </div>
        `;
    }

    /**
     * Update profiling UI state
     */
    _updateProfilingUI(isProfilering) {
        const profilingBtn = document.getElementById('start-profiling');
        if (profilingBtn) {
            profilingBtn.textContent = isProfilering ? 'Stop Profiling' : 'Start Profiling';
            profilingBtn.className = isProfilering ? 'button-stop' : 'button-start';
        }

        const indicator = document.getElementById('profiling-indicator');
        if (indicator) {
            indicator.style.display = isProfilering ? 'block' : 'none';
        }
    }

    /**
     * Clear all performance data
     */
    clearPerformanceData() {
        this.performanceData = [];
        this.memorySnapshots = [];
        this.renderMetrics.clear();
        this.recommendations = [];

        if (this.profilingSession) {
            this.profilingSession = null;
        }

        this._renderPerformanceData();
        this._storeMetrics();

        logger.info('Performance data cleared');
    }

    /**
     * Export performance report
     */
    exportPerformanceReport() {
        const report = {
            timestamp: Date.now(),
            session: this.profilingSession,
            performanceData: this.performanceData,
            memorySnapshots: this.memorySnapshots,
            renderMetrics: Object.fromEntries(this.renderMetrics),
            recommendations: this.recommendations,
            thresholds: this.thresholds,
            summary: this._generateSummary()
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `kalxjs-performance-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        a.click();

        URL.revokeObjectURL(url);
        logger.info('Performance report exported');
    }

    /**
     * Generate performance summary
     */
    _generateSummary() {
        const renderData = this.performanceData.filter(item => item.type === 'component-render');

        return {
            totalDataPoints: this.performanceData.length,
            totalRenders: renderData.length,
            avgRenderTime: renderData.length > 0 ?
                renderData.reduce((sum, item) => sum + item.duration, 0) / renderData.length : 0,
            slowRenders: renderData.filter(item => item.duration > this.thresholds.render.warning).length,
            componentCount: this.renderMetrics.size,
            memorySnapshots: this.memorySnapshots.length,
            recommendationCount: this.recommendations.length,
            criticalIssues: this.recommendations.filter(r => r.priority === 'high').length
        };
    }

    /**
     * Store metrics in localStorage
     */
    _storeMetrics() {
        try {
            const data = {
                performanceData: this.performanceData.slice(-100), // Store last 100 entries
                memorySnapshots: this.memorySnapshots.slice(-10), // Store last 10 snapshots
                renderMetrics: Object.fromEntries(this.renderMetrics)
            };
            localStorage.setItem('kalxjs-devtools-performance', JSON.stringify(data));
        } catch (error) {
            logger.warn('Failed to store performance metrics:', error);
        }
    }

    /**
     * Load stored metrics from localStorage
     */
    _loadStoredMetrics() {
        try {
            const stored = localStorage.getItem('kalxjs-devtools-performance');
            if (stored) {
                const data = JSON.parse(stored);
                this.performanceData = data.performanceData || [];
                this.memorySnapshots = data.memorySnapshots || [];
                this.renderMetrics = new Map(Object.entries(data.renderMetrics || {}));
                this._renderPerformanceData();
                logger.info('Loaded stored performance metrics');
            }
        } catch (error) {
            logger.warn('Failed to load stored performance metrics:', error);
        }
    }

    /**
     * Start memory monitoring
     */
    _startMemoryMonitoring() {
        setInterval(() => {
            if (this.isProfilering && this.performanceData.length % 50 === 0) {
                // Take periodic memory snapshots during profiling
                this.takeMemorySnapshot();
            }
        }, 10000); // Every 10 seconds
    }

    /**
     * Filter performance data
     */
    _filterPerformanceData(filter) {
        // Implementation for filtering performance data
        this._renderPerformanceData();
    }

    /**
     * Update time range
     */
    _updateTimeRange(range) {
        // Implementation for time range filtering
        this._renderPerformanceData();
    }

    /**
     * Show settings dialog
     */
    showSettings() {
        // Implementation for settings dialog
        console.log('Show performance settings');
    }

    /**
     * Track layout changes
     */
    _trackLayoutChanges(entries) {
        if (!this.isProfilering) return;

        entries.forEach(entry => {
            const layoutMetric = {
                id: `layout-${Date.now()}`,
                timestamp: performance.now(),
                type: 'layout-change',
                element: entry.target.tagName,
                contentRect: entry.contentRect,
                borderBoxSize: entry.borderBoxSize
            };

            this.performanceData.push(layoutMetric);
        });
    }

    /**
     * Track visibility changes
     */
    _trackVisibilityChanges(entries) {
        if (!this.isProfilering) return;

        entries.forEach(entry => {
            const visibilityMetric = {
                id: `visibility-${Date.now()}`,
                timestamp: performance.now(),
                type: 'visibility-change',
                element: entry.target.tagName,
                isIntersecting: entry.isIntersecting,
                intersectionRatio: entry.intersectionRatio
            };

            this.performanceData.push(visibilityMetric);
        });
    }
}