/**
 * Network Integration Component
 * Integration with DevTools Network panel and API monitoring
 */

import { createLogger, formatDuration, formatBytes } from '../../../shared/utils.js';

const logger = createLogger('NetworkIntegration');

export class NetworkIntegration {
    constructor(bridge) {
        this.bridge = bridge;
        this.networkRequests = [];
        this.apiCalls = [];
        this.webSocketConnections = [];
        this.isMonitoring = false;
        this.performanceMetrics = {};
        this.filters = {
            type: 'all',
            status: 'all',
            method: 'all'
        };
        this.originalFetch = null;
        this.originalXHR = null;
        this.originalWebSocket = null;
    }

    /**
     * Initialize network integration
     */
    initialize() {
        this._setupEventHandlers();
        this._hookNetworkAPIs();
        this._loadStoredData();
        this.startMonitoring();
        logger.info('Network Integration initialized');
    }

    /**
     * Setup event handlers
     */
    _setupEventHandlers() {
        // Monitoring controls
        const startBtn = document.getElementById('start-network-monitoring');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.toggleMonitoring());
        }

        const clearBtn = document.getElementById('clear-network-data');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearNetworkData());
        }

        // Export controls
        const exportBtn = document.getElementById('export-network-report');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportNetworkReport());
        }

        // Filter controls
        const typeFilter = document.getElementById('network-type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this._updateNetworkList();
            });
        }

        const statusFilter = document.getElementById('network-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this._updateNetworkList();
            });
        }

        const methodFilter = document.getElementById('network-method-filter');
        if (methodFilter) {
            methodFilter.addEventListener('change', (e) => {
                this.filters.method = e.target.value;
                this._updateNetworkList();
            });
        }

        // Performance analysis
        const analyzeBtn = document.getElementById('analyze-network-performance');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeNetworkPerformance());
        }
    }

    /**
     * Hook into native network APIs
     */
    _hookNetworkAPIs() {
        this._hookFetch();
        this._hookXHR();
        this._hookWebSocket();
        logger.info('Network APIs hooked');
    }

    /**
     * Hook fetch API
     */
    _hookFetch() {
        if (!window.fetch) return;

        this.originalFetch = window.fetch;
        const networkIntegration = this;

        window.fetch = function (...args) {
            const startTime = performance.now();
            const url = typeof args[0] === 'string' ? args[0] : args[0].url;
            const options = args[1] || {};

            const requestData = {
                id: `fetch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'fetch',
                url: url,
                method: options.method || 'GET',
                startTime: startTime,
                headers: options.headers || {},
                body: options.body || null,
                kalxjsContext: networkIntegration._getKALXJSContext()
            };

            if (networkIntegration.isMonitoring) {
                networkIntegration._recordRequestStart(requestData);
            }

            return networkIntegration.originalFetch.apply(this, args)
                .then(response => {
                    const endTime = performance.now();
                    const responseData = {
                        ...requestData,
                        endTime: endTime,
                        duration: endTime - startTime,
                        status: response.status,
                        statusText: response.statusText,
                        responseHeaders: networkIntegration._headersToObject(response.headers),
                        size: parseInt(response.headers.get('content-length')) || 0,
                        success: response.ok
                    };

                    if (networkIntegration.isMonitoring) {
                        networkIntegration._recordRequestEnd(responseData);
                    }

                    return response;
                })
                .catch(error => {
                    const endTime = performance.now();
                    const errorData = {
                        ...requestData,
                        endTime: endTime,
                        duration: endTime - startTime,
                        error: error.message,
                        success: false
                    };

                    if (networkIntegration.isMonitoring) {
                        networkIntegration._recordRequestEnd(errorData);
                    }

                    throw error;
                });
        };
    }

    /**
     * Hook XMLHttpRequest
     */
    _hookXHR() {
        if (!window.XMLHttpRequest) return;

        this.originalXHR = window.XMLHttpRequest;
        const networkIntegration = this;

        window.XMLHttpRequest = function () {
            const xhr = new networkIntegration.originalXHR();
            const startTime = performance.now();
            let requestData = null;

            const originalOpen = xhr.open;
            xhr.open = function (method, url, ...args) {
                requestData = {
                    id: `xhr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'xhr',
                    method: method,
                    url: url,
                    startTime: startTime,
                    kalxjsContext: networkIntegration._getKALXJSContext()
                };

                return originalOpen.call(this, method, url, ...args);
            };

            const originalSend = xhr.send;
            xhr.send = function (body) {
                if (requestData) {
                    requestData.body = body;
                    requestData.headers = networkIntegration._getXHRHeaders(xhr);

                    if (networkIntegration.isMonitoring) {
                        networkIntegration._recordRequestStart(requestData);
                    }
                }

                xhr.addEventListener('loadend', () => {
                    if (requestData && networkIntegration.isMonitoring) {
                        const endTime = performance.now();
                        const responseData = {
                            ...requestData,
                            endTime: endTime,
                            duration: endTime - startTime,
                            status: xhr.status,
                            statusText: xhr.statusText,
                            responseHeaders: networkIntegration._parseResponseHeaders(xhr.getAllResponseHeaders()),
                            size: xhr.responseText ? xhr.responseText.length : 0,
                            success: xhr.status >= 200 && xhr.status < 300
                        };

                        networkIntegration._recordRequestEnd(responseData);
                    }
                });

                return originalSend.call(this, body);
            };

            return xhr;
        };
    }

    /**
     * Hook WebSocket API
     */
    _hookWebSocket() {
        if (!window.WebSocket) return;

        this.originalWebSocket = window.WebSocket;
        const networkIntegration = this;

        window.WebSocket = function (url, protocols) {
            const ws = new networkIntegration.originalWebSocket(url, protocols);
            const startTime = performance.now();

            const connectionData = {
                id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'websocket',
                url: url,
                protocols: protocols,
                startTime: startTime,
                messages: [],
                kalxjsContext: networkIntegration._getKALXJSContext()
            };

            if (networkIntegration.isMonitoring) {
                networkIntegration._recordWebSocketConnection(connectionData);
            }

            // Hook WebSocket events
            const originalSend = ws.send;
            ws.send = function (data) {
                if (networkIntegration.isMonitoring) {
                    networkIntegration._recordWebSocketMessage(connectionData.id, 'sent', data);
                }
                return originalSend.call(this, data);
            };

            ws.addEventListener('message', (event) => {
                if (networkIntegration.isMonitoring) {
                    networkIntegration._recordWebSocketMessage(connectionData.id, 'received', event.data);
                }
            });

            ws.addEventListener('open', () => {
                connectionData.connected = true;
                connectionData.connectTime = performance.now() - startTime;
            });

            ws.addEventListener('close', (event) => {
                connectionData.closed = true;
                connectionData.closeCode = event.code;
                connectionData.closeReason = event.reason;
                connectionData.totalTime = performance.now() - startTime;
            });

            return ws;
        };
    }

    /**
     * Start monitoring network activity
     */
    startMonitoring() {
        this.isMonitoring = true;
        this._updateMonitoringUI();
        logger.info('Network monitoring started');
    }

    /**
     * Stop monitoring network activity
     */
    stopMonitoring() {
        this.isMonitoring = false;
        this._updateMonitoringUI();
        logger.info('Network monitoring stopped');
    }

    /**
     * Toggle monitoring state
     */
    toggleMonitoring() {
        if (this.isMonitoring) {
            this.stopMonitoring();
        } else {
            this.startMonitoring();
        }
    }

    /**
     * Record request start
     */
    _recordRequestStart(requestData) {
        this.networkRequests.push({
            ...requestData,
            status: 'pending'
        });

        this._updateNetworkList();
    }

    /**
     * Record request completion
     */
    _recordRequestEnd(responseData) {
        const index = this.networkRequests.findIndex(req => req.id === responseData.id);
        if (index !== -1) {
            this.networkRequests[index] = {
                ...this.networkRequests[index],
                ...responseData,
                status: 'completed'
            };

            // Track API calls separately
            if (this._isAPICall(responseData.url)) {
                this._recordAPICall(responseData);
            }

            this._updateNetworkList();
            this._updatePerformanceMetrics();
            this._storeData();
        }
    }

    /**
     * Record WebSocket connection
     */
    _recordWebSocketConnection(connectionData) {
        this.webSocketConnections.push(connectionData);
        this._updateWebSocketList();
    }

    /**
     * Record WebSocket message
     */
    _recordWebSocketMessage(connectionId, direction, data) {
        const connection = this.webSocketConnections.find(conn => conn.id === connectionId);
        if (connection) {
            connection.messages.push({
                timestamp: performance.now(),
                direction: direction,
                data: data,
                size: typeof data === 'string' ? data.length : JSON.stringify(data).length
            });
            this._updateWebSocketList();
        }
    }

    /**
     * Record API call
     */
    _recordAPICall(responseData) {
        const apiCall = {
            ...responseData,
            endpoint: this._extractEndpoint(responseData.url),
            component: responseData.kalxjsContext?.component || 'Unknown',
            state: responseData.kalxjsContext?.state || {},
            cached: this._isCachedResponse(responseData),
            retries: this._getRetryCount(responseData.url)
        };

        this.apiCalls.push(apiCall);
        this._analyzeAPIPerformance(apiCall);
    }

    /**
     * Update network requests list
     */
    _updateNetworkList() {
        const container = document.getElementById('network-requests-list');
        if (!container) return;

        const filteredRequests = this._filterRequests(this.networkRequests);

        if (filteredRequests.length === 0) {
            container.innerHTML = '<div class="network-empty">No network requests recorded</div>';
            return;
        }

        const requestsHTML = filteredRequests.map(request => {
            const statusClass = this._getStatusClass(request.status, request.success);
            const durationText = request.duration ? formatDuration(request.duration) : 'Pending...';
            const sizeText = request.size ? formatBytes(request.size) : '-';

            return `
                <div class="network-request ${statusClass}" data-request-id="${request.id}">
                    <div class="request-header">
                        <span class="request-method ${request.method.toLowerCase()}">${request.method}</span>
                        <span class="request-url" title="${request.url}">${this._truncateUrl(request.url)}</span>
                        <span class="request-status">${request.status || 'Pending'}</span>
                        <span class="request-duration">${durationText}</span>
                        <span class="request-size">${sizeText}</span>
                    </div>
                    <div class="request-details" style="display: none;">
                        <div class="request-timing">
                            <div class="timing-bar" style="width: ${this._calculateTimingBarWidth(request)}%"></div>
                        </div>
                        <div class="request-context">
                            ${request.kalxjsContext?.component ? `
                                <div class="context-item">
                                    <label>Component:</label>
                                    <span>${request.kalxjsContext.component}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = requestsHTML;

        // Add click handlers to show/hide details
        container.querySelectorAll('.network-request').forEach(element => {
            element.addEventListener('click', () => {
                const details = element.querySelector('.request-details');
                details.style.display = details.style.display === 'none' ? 'block' : 'none';
            });
        });
    }

    /**
     * Update WebSocket connections list
     */
    _updateWebSocketList() {
        const container = document.getElementById('websocket-connections-list');
        if (!container) return;

        if (this.webSocketConnections.length === 0) {
            container.innerHTML = '<div class="websocket-empty">No WebSocket connections</div>';
            return;
        }

        const connectionsHTML = this.webSocketConnections.map(connection => {
            const statusClass = connection.closed ? 'closed' : connection.connected ? 'connected' : 'connecting';
            const messageCount = connection.messages.length;
            const totalSize = connection.messages.reduce((sum, msg) => sum + msg.size, 0);

            return `
                <div class="websocket-connection ${statusClass}">
                    <div class="connection-header">
                        <span class="connection-url">${connection.url}</span>
                        <span class="connection-status ${statusClass}">${statusClass}</span>
                        <span class="message-count">${messageCount} messages</span>
                        <span class="total-size">${formatBytes(totalSize)}</span>
                    </div>
                    <div class="connection-messages">
                        ${connection.messages.slice(-5).map(msg => `
                            <div class="message ${msg.direction}">
                                <span class="message-direction">${msg.direction}</span>
                                <span class="message-data">${this._truncateMessage(msg.data)}</span>
                                <span class="message-size">${formatBytes(msg.size)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = connectionsHTML;
    }

    /**
     * Analyze network performance
     */
    analyzeNetworkPerformance() {
        const analysis = {
            totalRequests: this.networkRequests.length,
            successfulRequests: this.networkRequests.filter(req => req.success).length,
            failedRequests: this.networkRequests.filter(req => !req.success).length,
            averageResponseTime: this._calculateAverageResponseTime(),
            slowestRequests: this._getSlowRequests(),
            largestRequests: this._getLargeRequests(),
            apiCallAnalysis: this._analyzeAPICalls(),
            recommendations: this._generateNetworkRecommendations()
        };

        this._displayNetworkAnalysis(analysis);
        logger.info('Network performance analysis completed:', analysis);
    }

    /**
     * Calculate average response time
     */
    _calculateAverageResponseTime() {
        const completedRequests = this.networkRequests.filter(req => req.duration);
        if (completedRequests.length === 0) return 0;

        const totalTime = completedRequests.reduce((sum, req) => sum + req.duration, 0);
        return totalTime / completedRequests.length;
    }

    /**
     * Get slow requests
     */
    _getSlowRequests() {
        return this.networkRequests
            .filter(req => req.duration && req.duration > 1000) // > 1 second
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10);
    }

    /**
     * Get large requests
     */
    _getLargeRequests() {
        return this.networkRequests
            .filter(req => req.size && req.size > 100000) // > 100KB
            .sort((a, b) => b.size - a.size)
            .slice(0, 10);
    }

    /**
     * Analyze API calls
     */
    _analyzeAPICalls() {
        const apiAnalysis = {
            totalCalls: this.apiCalls.length,
            uniqueEndpoints: new Set(this.apiCalls.map(call => call.endpoint)).size,
            cachedCalls: this.apiCalls.filter(call => call.cached).length,
            averageResponseTime: 0,
            errorRate: 0,
            endpointStats: {}
        };

        if (this.apiCalls.length > 0) {
            apiAnalysis.averageResponseTime = this.apiCalls
                .reduce((sum, call) => sum + call.duration, 0) / this.apiCalls.length;

            apiAnalysis.errorRate = (this.apiCalls.filter(call => !call.success).length / this.apiCalls.length) * 100;

            // Endpoint statistics
            this.apiCalls.forEach(call => {
                const endpoint = call.endpoint;
                if (!apiAnalysis.endpointStats[endpoint]) {
                    apiAnalysis.endpointStats[endpoint] = {
                        calls: 0,
                        errors: 0,
                        totalTime: 0,
                        averageTime: 0
                    };
                }

                const stats = apiAnalysis.endpointStats[endpoint];
                stats.calls++;
                stats.totalTime += call.duration;
                stats.averageTime = stats.totalTime / stats.calls;

                if (!call.success) {
                    stats.errors++;
                }
            });
        }

        return apiAnalysis;
    }

    /**
     * Generate network recommendations
     */
    _generateNetworkRecommendations() {
        const recommendations = [];
        const slowRequests = this._getSlowRequests();
        const largeRequests = this._getLargeRequests();
        const errorRate = (this.networkRequests.filter(req => !req.success).length / this.networkRequests.length) * 100;

        if (slowRequests.length > 0) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                title: 'Slow Network Requests Detected',
                description: `${slowRequests.length} requests taking longer than 1 second`,
                action: 'Consider optimizing API responses, implementing caching, or adding loading indicators'
            });
        }

        if (largeRequests.length > 0) {
            recommendations.push({
                type: 'optimization',
                priority: 'medium',
                title: 'Large Network Payloads',
                description: `${largeRequests.length} requests larger than 100KB`,
                action: 'Implement pagination, compression, or optimize payload structure'
            });
        }

        if (errorRate > 10) {
            recommendations.push({
                type: 'reliability',
                priority: 'high',
                title: 'High Error Rate',
                description: `${errorRate.toFixed(1)}% of requests are failing`,
                action: 'Implement retry logic and better error handling'
            });
        }

        const uncachedAPICalls = this.apiCalls.filter(call => !call.cached);
        if (uncachedAPICalls.length > this.apiCalls.length * 0.8) {
            recommendations.push({
                type: 'caching',
                priority: 'medium',
                title: 'Low Cache Hit Rate',
                description: 'Most API calls are not being cached',
                action: 'Implement API response caching to improve performance'
            });
        }

        return recommendations;
    }

    /**
     * Display network analysis
     */
    _displayNetworkAnalysis(analysis) {
        const modal = document.getElementById('network-analysis-modal');
        const container = document.getElementById('network-analysis-content');

        if (!modal || !container) return;

        container.innerHTML = `
            <div class="analysis-summary">
                <h3>Network Performance Analysis</h3>
                <div class="analysis-stats">
                    <div class="stat-item">
                        <label>Total Requests:</label>
                        <span>${analysis.totalRequests}</span>
                    </div>
                    <div class="stat-item">
                        <label>Success Rate:</label>
                        <span>${((analysis.successfulRequests / analysis.totalRequests) * 100).toFixed(1)}%</span>
                    </div>
                    <div class="stat-item">
                        <label>Average Response Time:</label>
                        <span>${formatDuration(analysis.averageResponseTime)}</span>
                    </div>
                </div>
            </div>

            ${analysis.slowestRequests.length > 0 ? `
                <div class="analysis-section">
                    <h4>Slowest Requests</h4>
                    <div class="requests-list">
                        ${analysis.slowestRequests.map(req => `
                            <div class="request-item">
                                <span class="request-url">${req.url}</span>
                                <span class="request-duration">${formatDuration(req.duration)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${analysis.recommendations.length > 0 ? `
                <div class="analysis-section">
                    <h4>Recommendations</h4>
                    <div class="recommendations-list">
                        ${analysis.recommendations.map(rec => `
                            <div class="recommendation ${rec.priority}">
                                <div class="rec-title">${rec.title}</div>
                                <div class="rec-description">${rec.description}</div>
                                <div class="rec-action">${rec.action}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        modal.style.display = 'block';
    }

    /**
     * Clear network data
     */
    clearNetworkData() {
        this.networkRequests = [];
        this.apiCalls = [];
        this.webSocketConnections = [];
        this.performanceMetrics = {};

        this._updateNetworkList();
        this._updateWebSocketList();
        this._storeData();

        logger.info('Network data cleared');
    }

    /**
     * Export network report
     */
    exportNetworkReport() {
        const report = {
            timestamp: Date.now(),
            summary: {
                totalRequests: this.networkRequests.length,
                totalAPICalls: this.apiCalls.length,
                totalWebSocketConnections: this.webSocketConnections.length,
                averageResponseTime: this._calculateAverageResponseTime(),
                errorRate: (this.networkRequests.filter(req => !req.success).length / this.networkRequests.length) * 100
            },
            networkRequests: this.networkRequests,
            apiCalls: this.apiCalls,
            webSocketConnections: this.webSocketConnections,
            performanceMetrics: this.performanceMetrics,
            analysis: {
                slowRequests: this._getSlowRequests(),
                largeRequests: this._getLargeRequests(),
                apiAnalysis: this._analyzeAPICalls(),
                recommendations: this._generateNetworkRecommendations()
            }
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `kalxjs-network-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        a.click();

        URL.revokeObjectURL(url);
        logger.info('Network report exported');
    }

    /**
     * Update monitoring UI
     */
    _updateMonitoringUI() {
        const button = document.getElementById('start-network-monitoring');
        if (button) {
            button.textContent = this.isMonitoring ? 'Stop Monitoring' : 'Start Monitoring';
            button.className = this.isMonitoring ? 'button-stop' : 'button-start';
        }

        const indicator = document.getElementById('network-monitoring-indicator');
        if (indicator) {
            indicator.style.display = this.isMonitoring ? 'block' : 'none';
        }
    }

    /**
     * Helper methods
     */
    _getKALXJSContext() {
        if (!window.__KALXJS_DEVTOOLS_HOOK__) return null;

        return {
            component: window.__KALXJS_DEVTOOLS_HOOK__.currentComponent || 'Unknown',
            state: window.__KALXJS_DEVTOOLS_HOOK__.currentState || {}
        };
    }

    _headersToObject(headers) {
        const obj = {};
        for (const [key, value] of headers.entries()) {
            obj[key] = value;
        }
        return obj;
    }

    _getXHRHeaders(xhr) {
        // XMLHttpRequest doesn't expose request headers easily
        return {};
    }

    _parseResponseHeaders(headersString) {
        const headers = {};
        if (headersString) {
            headersString.split('\r\n').forEach(line => {
                const [key, value] = line.split(': ');
                if (key && value) {
                    headers[key] = value;
                }
            });
        }
        return headers;
    }

    _isAPICall(url) {
        return url.includes('/api/') || url.includes('.json') || url.includes('graphql');
    }

    _extractEndpoint(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname.replace(/\/\d+/g, '/:id'); // Replace IDs with :id
        } catch {
            return url;
        }
    }

    _isCachedResponse(responseData) {
        return responseData.responseHeaders?.['x-cache'] === 'HIT' ||
            responseData.responseHeaders?.['cache-control']?.includes('max-age');
    }

    _getRetryCount(url) {
        return this.networkRequests.filter(req => req.url === url).length - 1;
    }

    _filterRequests(requests) {
        return requests.filter(request => {
            if (this.filters.type !== 'all' && request.type !== this.filters.type) {
                return false;
            }
            if (this.filters.method !== 'all' && request.method !== this.filters.method) {
                return false;
            }
            if (this.filters.status !== 'all') {
                if (this.filters.status === 'success' && !request.success) return false;
                if (this.filters.status === 'error' && request.success) return false;
            }
            return true;
        });
    }

    _getStatusClass(status, success) {
        if (!status) return 'pending';
        if (success) return 'success';
        return 'error';
    }

    _truncateUrl(url) {
        if (url.length > 60) {
            return url.substring(0, 57) + '...';
        }
        return url;
    }

    _truncateMessage(message) {
        const str = typeof message === 'string' ? message : JSON.stringify(message);
        if (str.length > 100) {
            return str.substring(0, 97) + '...';
        }
        return str;
    }

    _calculateTimingBarWidth(request) {
        if (!request.duration) return 0;
        const maxDuration = Math.max(...this.networkRequests.filter(r => r.duration).map(r => r.duration));
        return (request.duration / maxDuration) * 100;
    }

    _updatePerformanceMetrics() {
        // Calculate and store performance metrics
        const completedRequests = this.networkRequests.filter(req => req.duration);

        this.performanceMetrics = {
            totalRequests: this.networkRequests.length,
            averageResponseTime: this._calculateAverageResponseTime(),
            p95ResponseTime: this._calculatePercentile(completedRequests.map(r => r.duration), 95),
            errorRate: (this.networkRequests.filter(req => !req.success).length / this.networkRequests.length) * 100,
            lastUpdated: Date.now()
        };
    }

    _calculatePercentile(values, percentile) {
        if (values.length === 0) return 0;
        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }

    _analyzeAPIPerformance(apiCall) {
        // Analyze individual API call performance
        if (apiCall.duration > 2000) { // > 2 seconds
            logger.warn('Slow API call detected:', apiCall);
        }
    }

    _storeData() {
        try {
            const data = {
                networkRequests: this.networkRequests.slice(-100), // Store last 100
                apiCalls: this.apiCalls.slice(-50), // Store last 50
                webSocketConnections: this.webSocketConnections.slice(-10), // Store last 10
                performanceMetrics: this.performanceMetrics
            };
            localStorage.setItem('kalxjs-devtools-network', JSON.stringify(data));
        } catch (error) {
            logger.warn('Failed to store network data:', error);
        }
    }

    _loadStoredData() {
        try {
            const stored = localStorage.getItem('kalxjs-devtools-network');
            if (stored) {
                const data = JSON.parse(stored);
                this.networkRequests = data.networkRequests || [];
                this.apiCalls = data.apiCalls || [];
                this.webSocketConnections = data.webSocketConnections || [];
                this.performanceMetrics = data.performanceMetrics || {};

                this._updateNetworkList();
                this._updateWebSocketList();

                logger.info('Network data loaded from storage');
            }
        } catch (error) {
            logger.warn('Failed to load network data:', error);
        }
    }
}