/**
 * Time Travel Debugging Component
 * Advanced state history navigation and replay functionality
 */

import { createLogger, formatTimestamp, debounce } from '../../../shared/utils.js';

const logger = createLogger('TimeTravel');

export class TimeTravel {
    constructor(bridge) {
        this.bridge = bridge;
        this.stateHistory = [];
        this.currentStateIndex = -1;
        this.maxHistorySize = 1000;
        this.isRecording = true;
        this.isReplaying = false;
        this.replaySpeed = 1; // 1x speed
        this.replayTimer = null;
        this.snapshots = new Map();
        this.actionHistory = [];
        this.bookmarks = [];
        this.diffViewer = null;
    }

    /**
     * Initialize time travel debugger
     */
    initialize() {
        this._setupEventHandlers();
        this._initializeDiffViewer();
        this._loadStoredHistory();
        this._startRecording();
        logger.info('Time Travel Debugger initialized');
    }

    /**
     * Setup event handlers
     */
    _setupEventHandlers() {
        // Recording controls
        const recordBtn = document.getElementById('toggle-recording');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => this.toggleRecording());
        }

        const clearHistoryBtn = document.getElementById('clear-history');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }

        // Navigation controls
        const prevBtn = document.getElementById('previous-state');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigateToPreviousState());
        }

        const nextBtn = document.getElementById('next-state');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateToNextState());
        }

        const currentBtn = document.getElementById('goto-current');
        if (currentBtn) {
            currentBtn.addEventListener('click', () => this.goToCurrentState());
        }

        // Timeline scrubber
        const timeline = document.getElementById('timeline-scrubber');
        if (timeline) {
            timeline.addEventListener('input', (e) => {
                const index = parseInt(e.target.value);
                this.navigateToState(index);
            });
        }

        // Replay controls
        const playBtn = document.getElementById('play-replay');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.startReplay());
        }

        const pauseBtn = document.getElementById('pause-replay');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pauseReplay());
        }

        const stopBtn = document.getElementById('stop-replay');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopReplay());
        }

        // Speed control
        const speedSelect = document.getElementById('replay-speed');
        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                this.replaySpeed = parseFloat(e.target.value);
            });
        }

        // Bookmark controls
        const bookmarkBtn = document.getElementById('add-bookmark');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => this.addBookmark());
        }

        // Export controls
        const exportHistoryBtn = document.getElementById('export-history');
        if (exportHistoryBtn) {
            exportHistoryBtn.addEventListener('click', () => this.exportHistory());
        }

        const importHistoryBtn = document.getElementById('import-history');
        if (importHistoryBtn) {
            importHistoryBtn.addEventListener('change', (e) => this.importHistory(e.target.files[0]));
        }

        // State comparison
        const compareBtn = document.getElementById('compare-states');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => this.showStateComparison());
        }

        // Search functionality
        const searchInput = document.getElementById('history-search');
        if (searchInput) {
            const debouncedSearch = debounce((query) => {
                this._filterHistory(query);
            }, 300);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
    }

    /**
     * Initialize diff viewer
     */
    _initializeDiffViewer() {
        this.diffViewer = {
            container: document.getElementById('state-diff'),
            currentView: 'side-by-side' // or 'unified'
        };
    }

    /**
     * Start recording state changes
     */
    _startRecording() {
        this.isRecording = true;
        this._updateRecordingUI();

        // Listen for state changes from KALXJS
        if (window.__KALXJS_DEVTOOLS_HOOK__) {
            window.__KALXJS_DEVTOOLS_HOOK__.onStateChange = (stateData) => {
                this.recordStateChange(stateData);
            };

            window.__KALXJS_DEVTOOLS_HOOK__.onAction = (actionData) => {
                this.recordAction(actionData);
            };
        }

        logger.info('State recording started');
    }

    /**
     * Stop recording state changes
     */
    _stopRecording() {
        this.isRecording = false;
        this._updateRecordingUI();

        // Remove listeners
        if (window.__KALXJS_DEVTOOLS_HOOK__) {
            window.__KALXJS_DEVTOOLS_HOOK__.onStateChange = null;
            window.__KALXJS_DEVTOOLS_HOOK__.onAction = null;
        }

        logger.info('State recording stopped');
    }

    /**
     * Toggle recording state
     */
    toggleRecording() {
        if (this.isRecording) {
            this._stopRecording();
        } else {
            this._startRecording();
        }
    }

    /**
     * Record state change
     */
    recordStateChange(stateData) {
        if (!this.isRecording) return;

        const stateSnapshot = {
            id: `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            type: 'state-change',
            component: stateData.component,
            previousState: this._deepClone(stateData.previousState),
            currentState: this._deepClone(stateData.currentState),
            action: stateData.action || null,
            diff: this._calculateStateDiff(stateData.previousState, stateData.currentState),
            callStack: this._getCallStack(),
            performanceData: {
                renderTime: stateData.renderTime || 0,
                memoryUsage: this._getMemoryUsage()
            }
        };

        this.stateHistory.push(stateSnapshot);
        this.currentStateIndex = this.stateHistory.length - 1;

        // Maintain history size limit
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory = this.stateHistory.slice(-this.maxHistorySize);
            this.currentStateIndex = this.stateHistory.length - 1;
        }

        // Update UI
        this._updateHistoryUI();
        this._updateTimelineUI();

        // Store for persistence
        this._storeHistory();

        logger.debug('State change recorded:', stateSnapshot);
    }

    /**
     * Record action
     */
    recordAction(actionData) {
        if (!this.isRecording) return;

        const actionSnapshot = {
            id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            type: 'action',
            name: actionData.name,
            payload: this._deepClone(actionData.payload),
            component: actionData.component || 'Unknown',
            stateIndex: this.currentStateIndex,
            metadata: {
                userAgent: navigator.userAgent,
                url: window.location.href
            }
        };

        this.actionHistory.push(actionSnapshot);

        // Link action to current state
        if (this.stateHistory[this.currentStateIndex]) {
            this.stateHistory[this.currentStateIndex].relatedAction = actionSnapshot;
        }

        this._updateHistoryUI();
    }

    /**
     * Navigate to specific state by index
     */
    navigateToState(index) {
        if (index < 0 || index >= this.stateHistory.length) {
            logger.warn('Invalid state index:', index);
            return;
        }

        const targetState = this.stateHistory[index];
        this.currentStateIndex = index;

        // Apply state to application
        this._applyState(targetState);

        // Update UI
        this._updateNavigationUI();
        this._showStateDetails(targetState);

        logger.info(`Navigated to state ${index}:`, targetState);
    }

    /**
     * Navigate to previous state
     */
    navigateToPreviousState() {
        if (this.currentStateIndex > 0) {
            this.navigateToState(this.currentStateIndex - 1);
        }
    }

    /**
     * Navigate to next state
     */
    navigateToNextState() {
        if (this.currentStateIndex < this.stateHistory.length - 1) {
            this.navigateToState(this.currentStateIndex + 1);
        }
    }

    /**
     * Go to current (latest) state
     */
    goToCurrentState() {
        if (this.stateHistory.length > 0) {
            this.navigateToState(this.stateHistory.length - 1);
        }
    }

    /**
     * Start replay from current position
     */
    startReplay() {
        if (this.isReplaying) return;

        this.isReplaying = true;
        this._updateReplayUI();

        const startIndex = this.currentStateIndex + 1;
        const endIndex = this.stateHistory.length - 1;

        if (startIndex <= endIndex) {
            this._runReplay(startIndex, endIndex);
        }

        logger.info('Replay started');
    }

    /**
     * Pause replay
     */
    pauseReplay() {
        if (!this.isReplaying) return;

        this.isReplaying = false;
        if (this.replayTimer) {
            clearTimeout(this.replayTimer);
            this.replayTimer = null;
        }

        this._updateReplayUI();
        logger.info('Replay paused');
    }

    /**
     * Stop replay
     */
    stopReplay() {
        this.pauseReplay();
        this.goToCurrentState();
        logger.info('Replay stopped');
    }

    /**
     * Run replay sequence
     */
    _runReplay(startIndex, endIndex) {
        if (!this.isReplaying || startIndex > endIndex) {
            this.stopReplay();
            return;
        }

        this.navigateToState(startIndex);

        // Calculate delay based on original timing and replay speed
        let delay = 500; // Default delay
        if (startIndex < this.stateHistory.length - 1) {
            const currentState = this.stateHistory[startIndex];
            const nextState = this.stateHistory[startIndex + 1];
            const originalDelay = nextState.timestamp - currentState.timestamp;
            delay = Math.max(100, originalDelay / this.replaySpeed); // Minimum 100ms delay
        }

        this.replayTimer = setTimeout(() => {
            this._runReplay(startIndex + 1, endIndex);
        }, delay);
    }

    /**
     * Apply state to application
     */
    _applyState(stateSnapshot) {
        if (!window.__KALXJS_DEVTOOLS_HOOK__) {
            logger.warn('KALXJS DevTools hook not available');
            return;
        }

        try {
            // Send state update to application
            window.__KALXJS_DEVTOOLS_HOOK__.setState({
                component: stateSnapshot.component,
                state: stateSnapshot.currentState,
                timeTravel: true
            });

            logger.debug('State applied:', stateSnapshot);
        } catch (error) {
            logger.error('Failed to apply state:', error);
        }
    }

    /**
     * Calculate difference between two states
     */
    _calculateStateDiff(oldState, newState) {
        const diff = {
            added: {},
            removed: {},
            changed: {},
            unchanged: {}
        };

        const oldKeys = new Set(Object.keys(oldState || {}));
        const newKeys = new Set(Object.keys(newState || {}));

        // Find added keys
        for (const key of newKeys) {
            if (!oldKeys.has(key)) {
                diff.added[key] = newState[key];
            }
        }

        // Find removed keys
        for (const key of oldKeys) {
            if (!newKeys.has(key)) {
                diff.removed[key] = oldState[key];
            }
        }

        // Find changed/unchanged keys
        for (const key of newKeys) {
            if (oldKeys.has(key)) {
                if (JSON.stringify(oldState[key]) !== JSON.stringify(newState[key])) {
                    diff.changed[key] = {
                        old: oldState[key],
                        new: newState[key]
                    };
                } else {
                    diff.unchanged[key] = newState[key];
                }
            }
        }

        return diff;
    }

    /**
     * Add bookmark at current state
     */
    addBookmark() {
        if (this.currentStateIndex < 0) {
            logger.warn('No current state to bookmark');
            return;
        }

        const bookmark = {
            id: `bookmark-${Date.now()}`,
            stateIndex: this.currentStateIndex,
            timestamp: Date.now(),
            name: prompt('Enter bookmark name:') || `Bookmark ${this.bookmarks.length + 1}`,
            description: prompt('Enter description (optional):') || '',
            state: this.stateHistory[this.currentStateIndex]
        };

        this.bookmarks.push(bookmark);
        this._updateBookmarksUI();
        this._storeBookmarks();

        logger.info('Bookmark added:', bookmark);
    }

    /**
     * Clear all history
     */
    clearHistory() {
        if (confirm('Are you sure you want to clear all state history?')) {
            this.stateHistory = [];
            this.actionHistory = [];
            this.bookmarks = [];
            this.currentStateIndex = -1;
            this._updateHistoryUI();
            this._updateTimelineUI();
            this._updateBookmarksUI();
            this._storeHistory();
            this._storeBookmarks();
            logger.info('History cleared');
        }
    }

    /**
     * Show state comparison view
     */
    showStateComparison() {
        // Implementation for comparing two states
        const modal = document.getElementById('state-comparison-modal');
        if (modal) {
            modal.style.display = 'block';
            this._renderStateComparison();
        }
    }

    /**
     * Export history data
     */
    exportHistory() {
        const data = {
            timestamp: Date.now(),
            stateHistory: this.stateHistory,
            actionHistory: this.actionHistory,
            bookmarks: this.bookmarks,
            currentStateIndex: this.currentStateIndex,
            metadata: {
                totalStates: this.stateHistory.length,
                totalActions: this.actionHistory.length,
                url: window.location.href,
                userAgent: navigator.userAgent
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `kalxjs-state-history-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        a.click();

        URL.revokeObjectURL(url);
        logger.info('History exported');
    }

    /**
     * Import history data
     */
    importHistory(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (confirm('This will replace current history. Continue?')) {
                    this.stateHistory = data.stateHistory || [];
                    this.actionHistory = data.actionHistory || [];
                    this.bookmarks = data.bookmarks || [];
                    this.currentStateIndex = data.currentStateIndex || -1;

                    this._updateHistoryUI();
                    this._updateTimelineUI();
                    this._updateBookmarksUI();
                    this._storeHistory();
                    this._storeBookmarks();

                    logger.info('History imported:', data.metadata);
                }
            } catch (error) {
                logger.error('Failed to import history:', error);
                alert('Failed to import history file');
            }
        };

        reader.readAsText(file);
    }

    /**
     * Update history UI
     */
    _updateHistoryUI() {
        const container = document.getElementById('history-list');
        if (!container) return;

        if (this.stateHistory.length === 0) {
            container.innerHTML = '<div class="history-empty">No state history available</div>';
            return;
        }

        const historyHTML = this.stateHistory.map((state, index) => {
            const isActive = index === this.currentStateIndex;
            const diffCount = Object.keys(state.diff?.changed || {}).length +
                Object.keys(state.diff?.added || {}).length +
                Object.keys(state.diff?.removed || {}).length;

            return `
                <div class="history-item ${isActive ? 'active' : ''}" data-index="${index}">
                    <div class="history-header">
                        <span class="history-timestamp">${formatTimestamp(state.timestamp)}</span>
                        <span class="history-component">${state.component}</span>
                        <span class="history-diff-count">${diffCount} changes</span>
                    </div>
                    <div class="history-action">
                        ${state.action ? state.action.type || 'Unknown Action' : 'Direct State Change'}
                    </div>
                    <div class="history-controls">
                        <button onclick="timeTravel.navigateToState(${index})" class="btn-small">Go To</button>
                        <button onclick="timeTravel._showStateDiff(${index})" class="btn-small">Diff</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = historyHTML;
    }

    /**
     * Update timeline UI
     */
    _updateTimelineUI() {
        const timeline = document.getElementById('timeline-scrubber');
        if (timeline) {
            timeline.max = Math.max(0, this.stateHistory.length - 1);
            timeline.value = this.currentStateIndex;
        }

        const positionDisplay = document.getElementById('timeline-position');
        if (positionDisplay) {
            positionDisplay.textContent = `${this.currentStateIndex + 1} / ${this.stateHistory.length}`;
        }
    }

    /**
     * Update navigation UI
     */
    _updateNavigationUI() {
        const prevBtn = document.getElementById('previous-state');
        const nextBtn = document.getElementById('next-state');

        if (prevBtn) {
            prevBtn.disabled = this.currentStateIndex <= 0;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentStateIndex >= this.stateHistory.length - 1;
        }
    }

    /**
     * Update recording UI
     */
    _updateRecordingUI() {
        const recordBtn = document.getElementById('toggle-recording');
        if (recordBtn) {
            recordBtn.textContent = this.isRecording ? 'Stop Recording' : 'Start Recording';
            recordBtn.className = this.isRecording ? 'button-stop' : 'button-start';
        }

        const indicator = document.getElementById('recording-indicator');
        if (indicator) {
            indicator.style.display = this.isRecording ? 'block' : 'none';
        }
    }

    /**
     * Update replay UI
     */
    _updateReplayUI() {
        const playBtn = document.getElementById('play-replay');
        const pauseBtn = document.getElementById('pause-replay');

        if (playBtn) {
            playBtn.disabled = this.isReplaying;
        }

        if (pauseBtn) {
            pauseBtn.disabled = !this.isReplaying;
        }
    }

    /**
     * Update bookmarks UI
     */
    _updateBookmarksUI() {
        const container = document.getElementById('bookmarks-list');
        if (!container) return;

        if (this.bookmarks.length === 0) {
            container.innerHTML = '<div class="bookmarks-empty">No bookmarks saved</div>';
            return;
        }

        const bookmarksHTML = this.bookmarks.map(bookmark => `
            <div class="bookmark-item">
                <div class="bookmark-header">
                    <span class="bookmark-name">${bookmark.name}</span>
                    <span class="bookmark-time">${formatTimestamp(bookmark.timestamp)}</span>
                </div>
                ${bookmark.description ? `<div class="bookmark-description">${bookmark.description}</div>` : ''}
                <div class="bookmark-controls">
                    <button onclick="timeTravel.navigateToState(${bookmark.stateIndex})" class="btn-small">Go To</button>
                    <button onclick="timeTravel._deleteBookmark('${bookmark.id}')" class="btn-small btn-danger">Delete</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = bookmarksHTML;
    }

    /**
     * Show state details
     */
    _showStateDetails(state) {
        const container = document.getElementById('state-details');
        if (!container) return;

        const diffSummary = this._getDiffSummary(state.diff);

        container.innerHTML = `
            <div class="state-details-content">
                <div class="state-basic-info">
                    <h4>State Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Component:</label>
                            <span>${state.component}</span>
                        </div>
                        <div class="info-item">
                            <label>Timestamp:</label>
                            <span>${new Date(state.timestamp).toISOString()}</span>
                        </div>
                        <div class="info-item">
                            <label>Render Time:</label>
                            <span>${state.performanceData?.renderTime || 0}ms</span>
                        </div>
                    </div>
                </div>

                <div class="state-diff-summary">
                    <h4>Changes Summary</h4>
                    <div class="diff-summary">
                        ${diffSummary}
                    </div>
                </div>

                <div class="state-data">
                    <h4>Current State</h4>
                    <pre class="state-json">${JSON.stringify(state.currentState, null, 2)}</pre>
                </div>
            </div>
        `;
    }

    /**
     * Get diff summary
     */
    _getDiffSummary(diff) {
        if (!diff) return '<span>No changes</span>';

        const addedCount = Object.keys(diff.added || {}).length;
        const removedCount = Object.keys(diff.removed || {}).length;
        const changedCount = Object.keys(diff.changed || {}).length;

        return `
            <div class="diff-stats">
                <span class="diff-added">+${addedCount} added</span>
                <span class="diff-removed">-${removedCount} removed</span>
                <span class="diff-changed">${changedCount} changed</span>
            </div>
        `;
    }

    /**
     * Show state diff
     */
    _showStateDiff(index) {
        if (index < 0 || index >= this.stateHistory.length) return;

        const state = this.stateHistory[index];
        const modal = document.getElementById('state-diff-modal');

        if (modal) {
            this._renderStateDiff(state);
            modal.style.display = 'block';
        }
    }

    /**
     * Render state diff
     */
    _renderStateDiff(state) {
        const container = document.getElementById('diff-content');
        if (!container) return;

        const { diff } = state;

        container.innerHTML = `
            <div class="diff-viewer">
                <h3>State Changes for ${state.component}</h3>

                ${Object.keys(diff.added || {}).length > 0 ? `
                    <div class="diff-section added">
                        <h4>Added Properties</h4>
                        <pre>${JSON.stringify(diff.added, null, 2)}</pre>
                    </div>
                ` : ''}

                ${Object.keys(diff.removed || {}).length > 0 ? `
                    <div class="diff-section removed">
                        <h4>Removed Properties</h4>
                        <pre>${JSON.stringify(diff.removed, null, 2)}</pre>
                    </div>
                ` : ''}

                ${Object.keys(diff.changed || {}).length > 0 ? `
                    <div class="diff-section changed">
                        <h4>Changed Properties</h4>
                        ${Object.entries(diff.changed).map(([key, change]) => `
                            <div class="diff-property">
                                <strong>${key}:</strong>
                                <div class="diff-old">- ${JSON.stringify(change.old, null, 2)}</div>
                                <div class="diff-new">+ ${JSON.stringify(change.new, null, 2)}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render state comparison
     */
    _renderStateComparison() {
        // Implementation for comparing multiple states
        console.log('Render state comparison');
    }

    /**
     * Filter history by search query
     */
    _filterHistory(query) {
        // Implementation for filtering history
        console.log('Filter history:', query);
    }

    /**
     * Delete bookmark
     */
    _deleteBookmark(bookmarkId) {
        this.bookmarks = this.bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
        this._updateBookmarksUI();
        this._storeBookmarks();
        logger.info('Bookmark deleted:', bookmarkId);
    }

    /**
     * Deep clone object
     */
    _deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this._deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this._deepClone(obj[key]);
                }
            }
            return cloned;
        }
    }

    /**
     * Get call stack
     */
    _getCallStack() {
        try {
            throw new Error();
        } catch (e) {
            return e.stack.split('\n').slice(2, 8);
        }
    }

    /**
     * Get memory usage
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
     * Store history in localStorage
     */
    _storeHistory() {
        try {
            const data = {
                stateHistory: this.stateHistory.slice(-100), // Store last 100 states
                actionHistory: this.actionHistory.slice(-100),
                currentStateIndex: this.currentStateIndex
            };
            localStorage.setItem('kalxjs-devtools-timetravel', JSON.stringify(data));
        } catch (error) {
            logger.warn('Failed to store time travel history:', error);
        }
    }

    /**
     * Load stored history
     */
    _loadStoredHistory() {
        try {
            const stored = localStorage.getItem('kalxjs-devtools-timetravel');
            if (stored) {
                const data = JSON.parse(stored);
                this.stateHistory = data.stateHistory || [];
                this.actionHistory = data.actionHistory || [];
                this.currentStateIndex = data.currentStateIndex || -1;
                this._updateHistoryUI();
                this._updateTimelineUI();
                logger.info('Loaded time travel history');
            }
        } catch (error) {
            logger.warn('Failed to load time travel history:', error);
        }
    }

    /**
     * Store bookmarks in localStorage
     */
    _storeBookmarks() {
        try {
            localStorage.setItem('kalxjs-devtools-bookmarks', JSON.stringify(this.bookmarks));
        } catch (error) {
            logger.warn('Failed to store bookmarks:', error);
        }
    }

    /**
     * Get time travel statistics
     */
    getStatistics() {
        return {
            totalStates: this.stateHistory.length,
            totalActions: this.actionHistory.length,
            bookmarks: this.bookmarks.length,
            currentPosition: this.currentStateIndex + 1,
            isRecording: this.isRecording,
            isReplaying: this.isReplaying,
            memoryUsage: this.stateHistory.reduce((acc, state) => acc + JSON.stringify(state).length, 0)
        };
    }
}