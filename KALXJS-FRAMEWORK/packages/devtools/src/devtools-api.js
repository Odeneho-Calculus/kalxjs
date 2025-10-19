/**
 * KALXJS DevTools API
 * Core API for browser extension integration
 *
 * @module @kalxjs/devtools/api
 */

/**
 * DevTools Hook - Injected into window for extension communication
 */
export class DevToolsHook {
    constructor() {
        this.apps = new Map();
        this.events = new Map();
        this.componentInstances = new Map();
        this._buffer = [];
        this.connected = false;
    }

    /**
     * Register a KALXJS application
     */
    registerApp(app, options = {}) {
        const id = options.id || `app-${this.apps.size + 1}`;

        this.apps.set(id, {
            app,
            id,
            name: options.name || 'KALXJS App',
            version: options.version || '2.2.8',
            rootComponent: app._rootComponent,
            created: Date.now()
        });

        this.emit('app:registered', { id, app });

        return id;
    }

    /**
     * Unregister application
     */
    unregisterApp(id) {
        const appInfo = this.apps.get(id);
        if (appInfo) {
            this.apps.delete(id);
            this.emit('app:unregistered', { id });
        }
    }

    /**
     * Register component instance
     */
    registerComponent(instance, appId) {
        const id = instance._uid || `component-${this.componentInstances.size + 1}`;

        this.componentInstances.set(id, {
            instance,
            id,
            appId,
            name: instance.$options?.name || 'Anonymous',
            type: instance.$options?.type || 'component',
            parent: instance.$parent?._uid,
            children: [],
            state: this.extractState(instance),
            props: instance.$props,
            created: Date.now()
        });

        // Update parent's children array
        if (instance.$parent) {
            const parent = this.componentInstances.get(instance.$parent._uid);
            if (parent) {
                parent.children.push(id);
            }
        }

        this.emit('component:registered', { id, instance });

        return id;
    }

    /**
     * Update component state
     */
    updateComponent(id, updates) {
        const componentInfo = this.componentInstances.get(id);
        if (componentInfo) {
            Object.assign(componentInfo.state, updates);
            this.emit('component:updated', { id, updates });
        }
    }

    /**
     * Extract state from component instance
     */
    extractState(instance) {
        const state = {};

        // Extract data
        if (instance.$data) {
            Object.keys(instance.$data).forEach(key => {
                state[key] = instance.$data[key];
            });
        }

        // Extract refs
        if (instance.$refs) {
            state._refs = instance.$refs;
        }

        // Extract computed
        if (instance.$options?.computed) {
            state._computed = {};
            Object.keys(instance.$options.computed).forEach(key => {
                state._computed[key] = instance[key];
            });
        }

        return state;
    }

    /**
     * Get component tree
     */
    getComponentTree(appId) {
        const appInfo = this.apps.get(appId);
        if (!appInfo) return null;

        const buildTree = (componentId) => {
            const component = this.componentInstances.get(componentId);
            if (!component) return null;

            return {
                id: component.id,
                name: component.name,
                type: component.type,
                state: component.state,
                props: component.props,
                children: component.children.map(buildTree).filter(Boolean)
            };
        };

        // Find root component
        const rootComponents = Array.from(this.componentInstances.values())
            .filter(c => c.appId === appId && !c.parent);

        return rootComponents.map(root => buildTree(root.id));
    }

    /**
     * Emit event
     */
    emit(event, data) {
        if (!this.connected) {
            this._buffer.push({ event, data, timestamp: Date.now() });
            return;
        }

        const listeners = this.events.get(event) || [];
        listeners.forEach(listener => listener(data));

        // Also send to devtools extension
        if (window.postMessage) {
            window.postMessage({
                source: 'kalxjs-devtools-hook',
                event,
                data
            }, '*');
        }
    }

    /**
     * Listen to events
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);

        return () => this.off(event, callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        const listeners = this.events.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Connect devtools
     */
    connect() {
        this.connected = true;

        // Flush buffered events
        this._buffer.forEach(({ event, data }) => {
            this.emit(event, data);
        });
        this._buffer = [];

        this.emit('devtools:connected', { timestamp: Date.now() });
    }

    /**
     * Disconnect devtools
     */
    disconnect() {
        this.connected = false;
        this.emit('devtools:disconnected', { timestamp: Date.now() });
    }

    /**
     * Get all applications
     */
    getApps() {
        return Array.from(this.apps.values());
    }

    /**
     * Get all components
     */
    getComponents(appId) {
        return Array.from(this.componentInstances.values())
            .filter(c => !appId || c.appId === appId);
    }
}

/**
 * Initialize DevTools Hook
 */
export function initDevTools() {
    if (typeof window === 'undefined') {
        return null;
    }

    // Check if already initialized
    if (window.__KALXJS_DEVTOOLS_HOOK__) {
        return window.__KALXJS_DEVTOOLS_HOOK__;
    }

    // Create hook
    const hook = new DevToolsHook();
    window.__KALXJS_DEVTOOLS_HOOK__ = hook;

    // Announce presence to extension
    window.postMessage({
        source: 'kalxjs-devtools-hook',
        event: 'init',
        version: '2.2.8'
    }, '*');

    return hook;
}

/**
 * Get existing devtools hook
 */
export function getDevToolsHook() {
    return typeof window !== 'undefined'
        ? window.__KALXJS_DEVTOOLS_HOOK__
        : null;
}

export default { DevToolsHook, initDevTools, getDevToolsHook };