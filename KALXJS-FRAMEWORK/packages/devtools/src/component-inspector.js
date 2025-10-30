/**
 * KALXJS Component Inspector
 * Inspect and modify component state in real-time
 *
 * @module @kalxjs/devtools/component-inspector
 */

import { getDevToolsHook } from './devtools-api.js';

/**
 * Component Inspector API
 */
export class ComponentInspector {
    constructor(hook) {
        this.hook = hook;
        this.selectedComponent = null;
        this.highlight = null;
    }

    /**
     * Select component for inspection
     */
    selectComponent(componentId) {
        const component = this.hook.componentInstances.get(componentId);
        if (!component) {
            console.warn(`Component ${componentId} not found`);
            return null;
        }

        this.selectedComponent = component;
        this.hook.emit('inspector:component-selected', { component });

        return this.getComponentDetails(componentId);
    }

    /**
     * Get component details
     */
    getComponentDetails(componentId) {
        const component = this.hook.componentInstances.get(componentId);
        if (!component) return null;

        return {
            id: component.id,
            name: component.name,
            type: component.type,
            file: component.instance.$options?.__file,

            // State
            state: this.serializeState(component.state),
            props: this.serializeProps(component.props),
            computed: this.getComputedValues(component.instance),

            // Lifecycle
            lifecycle: this.getLifecycleInfo(component.instance),

            // Tree position
            parent: component.parent,
            children: component.children,

            // Metadata
            created: component.created,
            renderCount: component.instance._renderCount || 0,
            updateCount: component.instance._updateCount || 0
        };
    }

    /**
     * Serialize state for display
     */
    serializeState(state) {
        const serialized = {};

        for (const [key, value] of Object.entries(state)) {
            serialized[key] = {
                type: this.getValueType(value),
                value: this.formatValue(value),
                editable: this.isEditable(value),
                raw: value
            };
        }

        return serialized;
    }

    /**
     * Serialize props
     */
    serializeProps(props) {
        return this.serializeState(props);
    }

    /**
     * Get computed values
     */
    getComputedValues(instance) {
        const computed = {};
        const computedOptions = instance.$options?.computed || {};

        for (const key of Object.keys(computedOptions)) {
            computed[key] = {
                type: this.getValueType(instance[key]),
                value: this.formatValue(instance[key]),
                dependencies: this.getComputedDependencies(instance, key)
            };
        }

        return computed;
    }

    /**
     * Get computed dependencies
     */
    getComputedDependencies(instance, key) {
        // This would track reactive dependencies
        // Simplified implementation
        return [];
    }

    /**
     * Get lifecycle info
     */
    getLifecycleInfo(instance) {
        return {
            mounted: !!instance._isMounted,
            destroyed: !!instance._isDestroyed,
            hooks: this.getHooksInfo(instance)
        };
    }

    /**
     * Get hooks information
     */
    getHooksInfo(instance) {
        const hooks = {};
        const lifecycleHooks = [
            'beforeCreate', 'created',
            'beforeMount', 'mounted',
            'beforeUpdate', 'updated',
            'beforeUnmount', 'unmounted'
        ];

        lifecycleHooks.forEach(hook => {
            if (instance.$options[hook]) {
                hooks[hook] = true;
            }
        });

        return hooks;
    }

    /**
     * Get value type
     */
    getValueType(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) return 'array';
        if (value instanceof Date) return 'date';
        if (value instanceof RegExp) return 'regexp';
        if (value instanceof Map) return 'map';
        if (value instanceof Set) return 'set';
        return typeof value;
    }

    /**
     * Format value for display
     */
    formatValue(value, depth = 0) {
        if (depth > 2) return '...';

        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'function') return value.toString().slice(0, 50) + '...';
        if (typeof value === 'symbol') return value.toString();

        if (Array.isArray(value)) {
            if (value.length === 0) return '[]';
            if (value.length > 5) return `Array(${value.length})`;
            return `[${value.map(v => this.formatValue(v, depth + 1)).join(', ')}]`;
        }

        if (value instanceof Date) return value.toISOString();
        if (value instanceof RegExp) return value.toString();

        if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 0) return '{}';
            if (keys.length > 5) return `Object {${keys.length} keys}`;

            const entries = keys.slice(0, 5).map(k =>
                `${k}: ${this.formatValue(value[k], depth + 1)}`
            );
            return `{ ${entries.join(', ')} }`;
        }

        return String(value);
    }

    /**
     * Check if value is editable
     */
    isEditable(value) {
        const type = typeof value;
        return ['string', 'number', 'boolean'].includes(type) || value === null;
    }

    /**
     * Edit component state
     */
    editState(componentId, path, value) {
        const component = this.hook.componentInstances.get(componentId);
        if (!component) return false;

        try {
            // Parse path (e.g., "user.name" -> ["user", "name"])
            const keys = path.split('.');
            let target = component.instance.$data;

            // Navigate to target
            for (let i = 0; i < keys.length - 1; i++) {
                target = target[keys[i]];
            }

            // Set value
            const lastKey = keys[keys.length - 1];
            target[lastKey] = value;

            // Trigger update
            this.hook.updateComponent(componentId, { [path]: value });

            return true;
        } catch (error) {
            console.error('Failed to edit state:', error);
            return false;
        }
    }

    /**
     * Highlight component in page
     */
    highlightComponent(componentId) {
        const component = this.hook.componentInstances.get(componentId);
        if (!component || !component.instance.$el) return;

        const el = component.instance.$el;

        // Create highlight overlay
        if (!this.highlight) {
            this.highlight = document.createElement('div');
            this.highlight.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 999999;
        border: 2px solid #42b883;
        background: rgba(66, 184, 131, 0.1);
        transition: all 0.1s;
      `;
            document.body.appendChild(this.highlight);
        }

        // Position highlight
        const rect = el.getBoundingClientRect();
        this.highlight.style.top = rect.top + 'px';
        this.highlight.style.left = rect.left + 'px';
        this.highlight.style.width = rect.width + 'px';
        this.highlight.style.height = rect.height + 'px';
        this.highlight.style.display = 'block';
    }

    /**
     * Remove highlight
     */
    unhighlightComponent() {
        if (this.highlight) {
            this.highlight.style.display = 'none';
        }
    }

    /**
     * Get component performance metrics
     */
    getPerformanceMetrics(componentId) {
        const component = this.hook.componentInstances.get(componentId);
        if (!component) return null;

        return {
            renderCount: component.instance._renderCount || 0,
            updateCount: component.instance._updateCount || 0,
            renderTime: component.instance._renderTime || 0,
            created: component.created,
            lastUpdate: component.instance._lastUpdate || component.created
        };
    }
}

/**
 * Create component inspector
 */
export function createInspector() {
    const hook = getDevToolsHook();
    if (!hook) {
        console.warn('DevTools hook not found');
        return null;
    }

    return new ComponentInspector(hook);
}

export default { ComponentInspector, createInspector };