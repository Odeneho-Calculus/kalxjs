/**
 * KALXJS Store Time Travel Debugging
 * Undo/redo functionality and state history
 *
 * @module @kalxjs/store/time-travel
 */

import { ref, reactive } from '@kalxjs/core';

/**
 * Time travel manager
 */
export class TimeTravelManager {
    constructor(options = {}) {
        this.options = {
            maxHistory: options.maxHistory || 50,
            enabled: options.enabled !== false,
        };

        this.history = [];
        this.currentIndex = -1;
        this.stores = new Map();

        // Reactive state
        this.state = reactive({
            canUndo: false,
            canRedo: false,
            historyLength: 0,
            currentIndex: -1,
        });
    }

    /**
     * Register store for time travel
     *
     * @param {Object} store - Store instance
     */
    register(store) {
        if (!this.options.enabled) return;

        this.stores.set(store.$id, store);

        // Subscribe to store changes
        store.$subscribe((mutation, state) => {
            this.recordState(store.$id, state, mutation);
        });

        // Record initial state
        this.recordState(store.$id, store.$state, { type: 'init' });
    }

    /**
     * Record state in history
     *
     * @param {string} storeId - Store ID
     * @param {Object} state - State snapshot
     * @param {Object} mutation - Mutation info
     */
    recordState(storeId, state, mutation) {
        // Remove future history if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add new state to history
        const snapshot = {
            storeId,
            state: this.cloneState(state),
            mutation,
            timestamp: Date.now(),
        };

        this.history.push(snapshot);

        // Limit history size
        if (this.history.length > this.options.maxHistory) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }

        this.updateState();
    }

    /**
     * Undo last change
     *
     * @returns {boolean} Success
     */
    undo() {
        if (!this.canUndo()) {
            return false;
        }

        this.currentIndex--;
        this.restoreState(this.currentIndex);
        this.updateState();

        return true;
    }

    /**
     * Redo next change
     *
     * @returns {boolean} Success
     */
    redo() {
        if (!this.canRedo()) {
            return false;
        }

        this.currentIndex++;
        this.restoreState(this.currentIndex);
        this.updateState();

        return true;
    }

    /**
     * Jump to specific history index
     *
     * @param {number} index - History index
     */
    jumpTo(index) {
        if (index < 0 || index >= this.history.length) {
            return false;
        }

        this.currentIndex = index;
        this.restoreState(index);
        this.updateState();

        return true;
    }

    /**
     * Check if can undo
     */
    canUndo() {
        return this.currentIndex > 0;
    }

    /**
     * Check if can redo
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Restore state from history
     *
     * @param {number} index - History index
     */
    restoreState(index) {
        const snapshot = this.history[index];
        if (!snapshot) return;

        const store = this.stores.get(snapshot.storeId);
        if (!store) return;

        // Temporarily disable recording
        const tempEnabled = this.options.enabled;
        this.options.enabled = false;

        // Restore state
        store.$patch(snapshot.state);

        // Re-enable recording
        this.options.enabled = tempEnabled;
    }

    /**
     * Update reactive state
     */
    updateState() {
        this.state.canUndo = this.canUndo();
        this.state.canRedo = this.canRedo();
        this.state.historyLength = this.history.length;
        this.state.currentIndex = this.currentIndex;
    }

    /**
     * Get history
     *
     * @returns {Array} History snapshots
     */
    getHistory() {
        return this.history.map((snapshot, index) => ({
            index,
            storeId: snapshot.storeId,
            mutation: snapshot.mutation,
            timestamp: snapshot.timestamp,
            isCurrent: index === this.currentIndex,
        }));
    }

    /**
     * Clear history
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.updateState();
    }

    /**
     * Clone state (deep copy)
     * @private
     */
    cloneState(state) {
        return JSON.parse(JSON.stringify(state));
    }

    /**
     * Export history
     *
     * @returns {string} JSON string
     */
    export() {
        return JSON.stringify({
            history: this.history,
            currentIndex: this.currentIndex,
            timestamp: Date.now(),
        }, null, 2);
    }

    /**
     * Import history
     *
     * @param {string} data - JSON string
     */
    import(data) {
        try {
            const parsed = JSON.parse(data);
            this.history = parsed.history || [];
            this.currentIndex = parsed.currentIndex || -1;
            this.updateState();

            // Restore current state
            if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
                this.restoreState(this.currentIndex);
            }

            return true;
        } catch (error) {
            console.error('Failed to import history:', error);
            return false;
        }
    }
}

/**
 * Create time travel plugin
 *
 * @param {Object} options - Plugin options
 * @returns {Function} Plugin function
 */
export function createTimeTravelPlugin(options = {}) {
    const manager = new TimeTravelManager(options);

    return ({ store }) => {
        manager.register(store);

        // Add time travel methods to store
        store.$timeTravel = {
            undo: () => manager.undo(),
            redo: () => manager.redo(),
            jumpTo: (index) => manager.jumpTo(index),
            canUndo: () => manager.canUndo(),
            canRedo: () => manager.canRedo(),
            getHistory: () => manager.getHistory(),
            clear: () => manager.clear(),
            export: () => manager.export(),
            import: (data) => manager.import(data),
            state: manager.state,
        };
    };
}

/**
 * Composition API hook for time travel
 *
 * @param {Object} store - Store instance
 * @returns {Object} Time travel helpers
 */
export function useTimeTravel(store) {
    if (!store.$timeTravel) {
        console.warn('Time travel plugin not installed');
        return null;
    }

    return {
        undo: store.$timeTravel.undo,
        redo: store.$timeTravel.redo,
        jumpTo: store.$timeTravel.jumpTo,
        canUndo: store.$timeTravel.canUndo,
        canRedo: store.$timeTravel.canRedo,
        history: store.$timeTravel.getHistory,
        state: store.$timeTravel.state,
    };
}