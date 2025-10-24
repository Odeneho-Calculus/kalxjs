/**
 * Event Logger Component
 * Advanced event tracking and timeline visualization
 */

import { createLogger, formatTimestamp, debounce } from '../../../shared/utils.js';

const logger = createLogger('EventLogger');

export class EventLogger {
    constructor(bridge) {
        this.bridge = bridge;
        this.events = [];
        this.filteredEvents = [];
        this.isPaused = false;
        this.maxEvents = 1000;
        this.filters = {
            type: 'all',
            component: 'all',
            level: 'all'
        };
        this.timeline = null;
        this.selectedEvent = null;
        this.performanceThresholds = {
            warning: 16, // ms
            error: 100   // ms
        };
    }

    /**
     * Initialize event logger
     */
    initialize() {
        this._setupEventHandlers();
        this._initializeTimeline();
        this._loadStoredEvents();
        logger.info('Event Logger initialized');
    }

    /**
     * Log new event
     */
    logEvent(eventData) {
        if (this.isPaused) return;

        const event = {
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            type: eventData.type,
            component: eventData.component || 'Unknown',
            data: eventData.data || {},
            level: this._determineEventLevel(eventData),
            duration: eventData.duration || null,
            performanceImpact: this._calculatePerformanceImpact(eventData),
            stackTrace: eventData.stackTrace || null,
            metadata: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                frameId: eventData.frameId || null
            }
        };

        // Add to events array
        this.events.unshift(event);

        // Maintain max events limit
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(0, this.maxEvents);
        }

        // Update filtered events
        this._updateFilteredEvents();

        // Update UI
        this._renderEventsList();
        this._updateTimeline();

        // Store events for persistence
        this._storeEvents();

        logger.debug('Event logged:', event);
    }

    /**
     * Setup event handlers
     */
    _setupEventHandlers() {
        // Clear events button
        const clearBtn = document.getElementById('clear-events');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearEvents());
        }

        // Pause/resume toggle
        const pauseBtn = document.getElementById('pause-events');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        // Event type filter
        const typeFilter = document.getElementById('event-type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this._updateFilteredEvents();
                this._renderEventsList();
            });
        }

        // Component filter
        const componentFilter = document.getElementById('event-component-filter');
        if (componentFilter) {
            componentFilter.addEventListener('change', (e) => {
                this.filters.component = e.target.value;
                this._updateFilteredEvents();
                this._renderEventsList();
            });
        }

        // Level filter
        const levelFilter = document.getElementById('event-level-filter');
        if (levelFilter) {
            levelFilter.addEventListener('change', (e) => {
                this.filters.level = e.target.value;
                this._updateFilteredEvents();
                this._renderEventsList();
            });
        }

        // Search input
        const searchInput = document.getElementById('event-search');
        if (searchInput) {
            const debouncedSearch = debounce((query) => {
                this._filterEventsBySearch(query);
            }, 300);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }

        // Export events button
        const exportBtn = document.getElementById('export-events');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportEvents());
        }
    }

    /**
     * Initialize timeline visualization
     */
    _initializeTimeline() {
        const timelineContainer = document.getElementById('event-timeline');
        if (!timelineContainer) return;

        this.timeline = {
            container: timelineContainer,
            width: timelineContainer.clientWidth,
            height: 200,
            margin: { top: 20, right: 20, bottom: 30, left: 50 }
        };

        this._renderTimeline();
    }

    /**
     * Render timeline visualization
     */
    _renderTimeline() {
        if (!this.timeline) return;

        const { container, width, height, margin } = this.timeline;

        // Clear existing content
        container.innerHTML = '';

        if (this.filteredEvents.length === 0) {
            container.innerHTML = '<div class="timeline-empty">No events to display</div>';
            return;
        }

        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.className = 'timeline-svg';

        // Calculate time range
        const timeRange = this._getTimeRange();
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Time scale
        const timeScale = (timestamp) => {
            return ((timestamp - timeRange.start) / (timeRange.end - timeRange.start)) * innerWidth;
        };

        // Draw events
        this.filteredEvents.forEach((event, index) => {
            const x = timeScale(event.timestamp) + margin.left;
            const y = margin.top + (index % 5) * 30; // Stack events

            // Event dot
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 4);
            circle.setAttribute('class', `event-dot event-${event.level}`);
            circle.setAttribute('data-event-id', event.id);

            // Event tooltip
            circle.addEventListener('mouseenter', (e) => {
                this._showEventTooltip(e, event);
            });

            circle.addEventListener('mouseleave', () => {
                this._hideEventTooltip();
            });

            circle.addEventListener('click', () => {
                this._selectEvent(event);
            });

            svg.appendChild(circle);
        });

        // Add time axis
        this._addTimeAxis(svg, timeScale, timeRange, innerWidth, height - margin.bottom);

        container.appendChild(svg);
    }

    /**
     * Add time axis to timeline
     */
    _addTimeAxis(svg, timeScale, timeRange, width, y) {
        const axisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        axisGroup.setAttribute('class', 'time-axis');

        // Axis line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', this.timeline.margin.left);
        line.setAttribute('y1', y);
        line.setAttribute('x2', this.timeline.margin.left + width);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#ccc');
        axisGroup.appendChild(line);

        // Time labels
        const duration = timeRange.end - timeRange.start;
        const tickCount = Math.min(5, this.filteredEvents.length);

        for (let i = 0; i <= tickCount; i++) {
            const timestamp = timeRange.start + (duration / tickCount) * i;
            const x = timeScale(timestamp) + this.timeline.margin.left;

            // Tick line
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', x);
            tick.setAttribute('y1', y);
            tick.setAttribute('x2', x);
            tick.setAttribute('y2', y + 5);
            tick.setAttribute('stroke', '#ccc');
            axisGroup.appendChild(tick);

            // Tick label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', y + 18);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('class', 'tick-label');
            label.textContent = formatTimestamp(timestamp, 'short');
            axisGroup.appendChild(label);
        }

        svg.appendChild(axisGroup);
    }

    /**
     * Render events list
     */
    _renderEventsList() {
        const container = document.getElementById('events-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.filteredEvents.length === 0) {
            container.innerHTML = '<div class="events-empty">No events match current filters</div>';
            return;
        }

        this.filteredEvents.forEach(event => {
            const eventElement = this._createEventElement(event);
            container.appendChild(eventElement);
        });

        // Update event counter
        this._updateEventCounter();
    }

    /**
     * Create event element
     */
    _createEventElement(event) {
        const eventDiv = document.createElement('div');
        eventDiv.className = `event-item ${event.level} ${this.selectedEvent?.id === event.id ? 'selected' : ''}`;
        eventDiv.setAttribute('data-event-id', event.id);

        const performanceClass = event.performanceImpact > this.performanceThresholds.error
            ? 'performance-error'
            : event.performanceImpact > this.performanceThresholds.warning
                ? 'performance-warning'
                : '';

        eventDiv.innerHTML = `
            <div class="event-header">
                <span class="event-type">${event.type}</span>
                <span class="event-component">${event.component}</span>
                <span class="event-timestamp">${formatTimestamp(event.timestamp)}</span>
                ${event.duration ? `<span class="event-duration ${performanceClass}">${event.duration}ms</span>` : ''}
            </div>
            <div class="event-data" ${Object.keys(event.data).length === 0 ? 'style="display: none;"' : ''}>
                <pre>${JSON.stringify(event.data, null, 2)}</pre>
            </div>
            ${event.performanceImpact > 0 ? `<div class="event-performance">Performance impact: ${event.performanceImpact.toFixed(2)}ms</div>` : ''}
        `;

        // Click to expand/collapse
        eventDiv.addEventListener('click', () => {
            this._selectEvent(event);
            this._toggleEventDetails(eventDiv);
        });

        return eventDiv;
    }

    /**
     * Update filtered events based on current filters
     */
    _updateFilteredEvents() {
        this.filteredEvents = this.events.filter(event => {
            if (this.filters.type !== 'all' && event.type !== this.filters.type) {
                return false;
            }
            if (this.filters.component !== 'all' && event.component !== this.filters.component) {
                return false;
            }
            if (this.filters.level !== 'all' && event.level !== this.filters.level) {
                return false;
            }
            return true;
        });
    }

    /**
     * Determine event level based on event data
     */
    _determineEventLevel(eventData) {
        if (eventData.level) return eventData.level;

        if (eventData.type.includes('error') || eventData.type.includes('failure')) {
            return 'error';
        }
        if (eventData.type.includes('warn') || eventData.duration > this.performanceThresholds.error) {
            return 'warning';
        }
        if (eventData.type.includes('debug') || eventData.type.includes('trace')) {
            return 'debug';
        }
        return 'info';
    }

    /**
     * Calculate performance impact
     */
    _calculatePerformanceImpact(eventData) {
        if (eventData.duration) return eventData.duration;
        if (eventData.performanceImpact) return eventData.performanceImpact;

        // Estimate based on event type
        const impactMap = {
            'component-render': 2,
            'state-change': 1,
            'event-dispatch': 0.5,
            'component-mount': 5,
            'component-unmount': 2
        };

        return impactMap[eventData.type] || 0;
    }

    /**
     * Get time range for timeline
     */
    _getTimeRange() {
        if (this.filteredEvents.length === 0) {
            return { start: Date.now() - 60000, end: Date.now() };
        }

        const timestamps = this.filteredEvents.map(e => e.timestamp);
        return {
            start: Math.min(...timestamps) - 1000, // Add 1s padding
            end: Math.max(...timestamps) + 1000
        };
    }

    /**
     * Show event tooltip
     */
    _showEventTooltip(e, event) {
        // Implementation for tooltip display
        console.log('Show tooltip for event:', event);
    }

    /**
     * Hide event tooltip
     */
    _hideEventTooltip() {
        // Implementation for tooltip hiding
    }

    /**
     * Select event for detailed view
     */
    _selectEvent(event) {
        this.selectedEvent = event;
        this._renderEventsList();
        this._showEventDetails(event);
    }

    /**
     * Show detailed event information
     */
    _showEventDetails(event) {
        const detailsContainer = document.getElementById('event-details');
        if (!detailsContainer) return;

        detailsContainer.innerHTML = `
            <div class="event-details-header">
                <h3>Event Details</h3>
                <button class="close-details" onclick="this.parentElement.parentElement.style.display='none'">×</button>
            </div>
            <div class="event-details-content">
                <div class="detail-section">
                    <h4>Basic Information</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Type:</label>
                            <span>${event.type}</span>
                        </div>
                        <div class="detail-item">
                            <label>Component:</label>
                            <span>${event.component}</span>
                        </div>
                        <div class="detail-item">
                            <label>Timestamp:</label>
                            <span>${new Date(event.timestamp).toISOString()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Level:</label>
                            <span class="level-${event.level}">${event.level}</span>
                        </div>
                    </div>
                </div>

                ${event.duration ? `
                <div class="detail-section">
                    <h4>Performance</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Duration:</label>
                            <span>${event.duration}ms</span>
                        </div>
                        <div class="detail-item">
                            <label>Performance Impact:</label>
                            <span>${event.performanceImpact.toFixed(2)}ms</span>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="detail-section">
                    <h4>Event Data</h4>
                    <pre class="event-data-json">${JSON.stringify(event.data, null, 2)}</pre>
                </div>

                ${event.stackTrace ? `
                <div class="detail-section">
                    <h4>Stack Trace</h4>
                    <pre class="stack-trace">${event.stackTrace}</pre>
                </div>
                ` : ''}

                <div class="detail-section">
                    <h4>Metadata</h4>
                    <pre class="metadata-json">${JSON.stringify(event.metadata, null, 2)}</pre>
                </div>
            </div>
        `;

        detailsContainer.style.display = 'block';
    }

    /**
     * Toggle event details visibility
     */
    _toggleEventDetails(eventElement) {
        const details = eventElement.querySelector('.event-data');
        if (details) {
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Clear all events
     */
    clearEvents() {
        this.events = [];
        this.filteredEvents = [];
        this.selectedEvent = null;
        this._renderEventsList();
        this._renderTimeline();
        this._storeEvents();
        logger.info('Events cleared');
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;

        const pauseBtn = document.getElementById('pause-events');
        if (pauseBtn) {
            pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
            pauseBtn.className = this.isPaused ? 'button-resume' : 'button-pause';
        }

        logger.info(this.isPaused ? 'Event logging paused' : 'Event logging resumed');
    }

    /**
     * Export events data
     */
    exportEvents() {
        const data = {
            timestamp: Date.now(),
            totalEvents: this.events.length,
            filteredEvents: this.filteredEvents.length,
            filters: this.filters,
            events: this.filteredEvents
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `kalxjs-events-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        a.click();

        URL.revokeObjectURL(url);
        logger.info('Events exported');
    }

    /**
     * Filter events by search query
     */
    _filterEventsBySearch(query) {
        if (!query.trim()) {
            this._updateFilteredEvents();
            this._renderEventsList();
            return;
        }

        const searchTerm = query.toLowerCase();
        this.filteredEvents = this.events.filter(event => {
            return event.type.toLowerCase().includes(searchTerm) ||
                event.component.toLowerCase().includes(searchTerm) ||
                JSON.stringify(event.data).toLowerCase().includes(searchTerm);
        });

        this._renderEventsList();
    }

    /**
     * Update event counter display
     */
    _updateEventCounter() {
        const counter = document.getElementById('event-counter');
        if (counter) {
            counter.textContent = `${this.filteredEvents.length} of ${this.events.length} events`;
        }
    }

    /**
     * Store events in localStorage for persistence
     */
    _storeEvents() {
        try {
            // Only store recent events to avoid localStorage limits
            const recentEvents = this.events.slice(0, 100);
            localStorage.setItem('kalxjs-devtools-events', JSON.stringify(recentEvents));
        } catch (error) {
            logger.warn('Failed to store events:', error);
        }
    }

    /**
     * Load stored events from localStorage
     */
    _loadStoredEvents() {
        try {
            const stored = localStorage.getItem('kalxjs-devtools-events');
            if (stored) {
                this.events = JSON.parse(stored);
                this._updateFilteredEvents();
                this._renderEventsList();
                logger.info(`Loaded ${this.events.length} stored events`);
            }
        } catch (error) {
            logger.warn('Failed to load stored events:', error);
        }
    }

    /**
     * Update timeline visualization
     */
    _updateTimeline() {
        if (this.timeline) {
            this._renderTimeline();
        }
    }

    /**
     * Get event statistics
     */
    getEventStatistics() {
        const stats = {
            total: this.events.length,
            byType: {},
            byLevel: {},
            byComponent: {},
            averagePerformanceImpact: 0,
            timeRange: this._getTimeRange()
        };

        this.events.forEach(event => {
            // By type
            stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;

            // By level
            stats.byLevel[event.level] = (stats.byLevel[event.level] || 0) + 1;

            // By component
            stats.byComponent[event.component] = (stats.byComponent[event.component] || 0) + 1;

            // Performance impact
            stats.averagePerformanceImpact += event.performanceImpact;
        });

        if (this.events.length > 0) {
            stats.averagePerformanceImpact /= this.events.length;
        }

        return stats;
    }
}