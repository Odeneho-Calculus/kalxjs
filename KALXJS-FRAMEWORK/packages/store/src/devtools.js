/**
 * KALXJS Store DevTools Integration
 * Redux DevTools Protocol implementation
 *
 * @module @kalxjs/store/devtools
 */

/**
 * Redux DevTools extension integration
 */
export class DevToolsConnector {
    constructor(options = {}) {
        this.options = {
            name: options.name || 'KALXJS Store',
            maxAge: options.maxAge || 50,
            features: {
                pause: true,
                lock: true,
                persist: true,
                export: true,
                import: 'custom',
                jump: true,
                skip: true,
                reorder: true,
                dispatch: true,
                test: true,
            },
            ...options,
        };

        this.devtools = null;
        this.isConnected = false;
        this.actionId = 0;

        this.connect();
    }

    /**
     * Connect to Redux DevTools
     */
    connect() {
        if (typeof window === 'undefined' || !window.__REDUX_DEVTOOLS_EXTENSION__) {
            console.warn('Redux DevTools Extension not found');
            return false;
        }

        try {
            this.devtools = window.__REDUX_DEVTOOLS_EXTENSION__.connect(this.options);
            this.isConnected = true;

            // Subscribe to DevTools actions
            this.devtools.subscribe(this.handleDevToolsAction.bind(this));

            return true;
        } catch (error) {
            console.error('Failed to connect to Redux DevTools:', error);
            return false;
        }
    }

    /**
     * Send action to DevTools
     *
     * @param {Object} action - Action object
     * @param {Object} state - Current state
     */
    send(action, state) {
        if (!this.isConnected || !this.devtools) {
            return;
        }

        try {
            this.devtools.send(
                {
                    type: action.type || 'UPDATE',
                    payload: action.payload,
                    id: ++this.actionId,
                },
                state
            );
        } catch (error) {
            console.error('Failed to send to DevTools:', error);
        }
    }

    /**
     * Initialize state in DevTools
     *
     * @param {Object} state - Initial state
     */
    init(state) {
        if (!this.isConnected || !this.devtools) {
            return;
        }

        try {
            this.devtools.init(state);
        } catch (error) {
            console.error('Failed to initialize DevTools:', error);
        }
    }

    /**
     * Handle actions from DevTools
     *
     * @param {Object} message - DevTools message
     */
    handleDevToolsAction(message) {
        if (message.type === 'DISPATCH') {
            this.handleDispatch(message);
        } else if (message.type === 'ACTION') {
            this.handleAction(message);
        }
    }

    /**
     * Handle dispatch from DevTools
     *
     * @param {Object} message - Dispatch message
     */
    handleDispatch(message) {
        const { payload } = message;

        switch (payload.type) {
            case 'RESET':
                this.emit('reset');
                break;
            case 'COMMIT':
                this.emit('commit');
                break;
            case 'ROLLBACK':
                this.emit('rollback', payload.state);
                break;
            case 'JUMP_TO_STATE':
            case 'JUMP_TO_ACTION':
                this.emit('timetravel', JSON.parse(payload.state));
                break;
            case 'IMPORT_STATE':
                this.emit('import', payload.nextLiftedState);
                break;
        }
    }

    /**
     * Handle custom action from DevTools
     *
     * @param {Object} message - Action message
     */
    handleAction(message) {
        try {
            const action = JSON.parse(message.payload);
            this.emit('action', action);
        } catch (error) {
            console.error('Failed to parse DevTools action:', error);
        }
    }

    /**
     * Event emitter
     */
    listeners = new Map();

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        return () => {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    emit(event, ...args) {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(callback => callback(...args));
    }

    /**
     * Disconnect from DevTools
     */
    disconnect() {
        if (this.devtools) {
            try {
                this.devtools.unsubscribe();
            } catch (error) {
                // Ignore errors on disconnect
            }
            this.devtools = null;
            this.isConnected = false;
        }
    }
}

/**
 * Create DevTools plugin for stores
 *
 * @param {Object} options - Plugin options
 * @returns {Function} Plugin function
 */
export function createDevToolsPlugin(options = {}) {
    const connector = new DevToolsConnector(options);

    if (!connector.isConnected) {
        return () => { }; // No-op if not connected
    }

    return ({ store, pinia }) => {
        // Initialize with current state
        connector.init(getStoresState(pinia));

        // Subscribe to store changes
        store.$subscribe((mutation, state) => {
            const action = {
                type: `[${store.$id}] ${mutation.type}`,
                payload: mutation.payload,
                storeId: store.$id,
            };

            connector.send(action, getStoresState(pinia));
        });

        // Handle DevTools actions
        connector.on('timetravel', (state) => {
            // Restore state from DevTools
            if (state && state[store.$id]) {
                store.$patch(state[store.$id]);
            }
        });

        connector.on('reset', () => {
            store.$reset();
        });
    };
}

/**
 * Get state from all stores
 * @private
 */
function getStoresState(pinia) {
    const state = {};

    if (pinia && pinia._stores) {
        pinia._stores.forEach((store, id) => {
            state[id] = store.$state;
        });
    }

    return state;
}