/**
 * Component Testing Utilities
 * Enhanced component testing for KALXJS
 *
 * @module @kalxjs/testing/component-testing
 */

/**
 * Mount component for testing
 */
export function mount(component, options = {}) {
    const {
        props = {},
        slots = {},
        global = {},
        attachTo = null,
    } = options;

    // Create container
    const container = attachTo || document.createElement('div');
    if (!attachTo) {
        document.body.appendChild(container);
    }

    // Create component instance
    const instance = {
        component,
        props,
        slots,
        container,
        isMounted: false,
        unmounted: false,
    };

    // Mock component methods
    instance.setProps = async (newProps) => {
        Object.assign(instance.props, newProps);
        await instance.update();
    };

    instance.update = async () => {
        // Trigger component re-render
        if (instance.isMounted && typeof component.render === 'function') {
            const vnode = component.render(instance.props);
            // Re-render logic here
        }
    };

    instance.unmount = () => {
        if (!instance.unmounted) {
            container.remove();
            instance.unmounted = true;
            instance.isMounted = false;
        }
    };

    instance.html = () => {
        return container.innerHTML;
    };

    instance.text = () => {
        return container.textContent;
    };

    instance.find = (selector) => {
        return container.querySelector(selector);
    };

    instance.findAll = (selector) => {
        return Array.from(container.querySelectorAll(selector));
    };

    instance.exists = () => {
        return !instance.unmounted && container.parentElement !== null;
    };

    instance.trigger = async (event, target = container, options = {}) => {
        const element = typeof target === 'string' ? container.querySelector(target) : target;

        if (!element) {
            throw new Error(`Element not found: ${target}`);
        }

        const evt = new Event(event, { bubbles: true, cancelable: true, ...options });
        element.dispatchEvent(evt);

        await nextTick();
    };

    instance.emitted = () => {
        return instance._emitted || {};
    };

    // Initialize emitted events tracker
    instance._emitted = {};

    // Mount the component
    if (typeof component.render === 'function') {
        const vnode = component.render(props);
        container.appendChild(createElementFromVNode(vnode));
        instance.isMounted = true;
    }

    return instance;
}

/**
 * Shallow mount (don't render children)
 */
export function shallowMount(component, options = {}) {
    const originalComponents = component.components || {};

    // Replace child components with stubs
    const stubbed = {
        ...component,
        components: Object.keys(originalComponents).reduce((acc, key) => {
            acc[key] = createStubComponent(key);
            return acc;
        }, {}),
    };

    return mount(stubbed, options);
}

/**
 * Create a stub component
 */
function createStubComponent(name) {
    return {
        name: `${name}-stub`,
        render() {
            return { tag: name.toLowerCase(), props: {}, children: [] };
        },
    };
}

/**
 * Create element from VNode (simplified)
 */
function createElementFromVNode(vnode) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return document.createTextNode(String(vnode));
    }

    const element = document.createElement(vnode.tag || 'div');

    // Apply props/attributes
    if (vnode.props) {
        Object.entries(vnode.props).forEach(([key, value]) => {
            if (key.startsWith('on')) {
                const event = key.slice(2).toLowerCase();
                element.addEventListener(event, value);
            } else {
                element.setAttribute(key, value);
            }
        });
    }

    // Append children
    if (vnode.children) {
        vnode.children.forEach(child => {
            element.appendChild(createElementFromVNode(child));
        });
    }

    return element;
}

/**
 * Wait for next tick
 */
export function nextTick() {
    return new Promise(resolve => {
        if (typeof queueMicrotask !== 'undefined') {
            queueMicrotask(resolve);
        } else {
            Promise.resolve().then(resolve);
        }
    });
}

/**
 * Flush promises
 */
export async function flushPromises() {
    await new Promise(resolve => setImmediate(() => resolve()));
}

/**
 * Create wrapper utilities
 */
export function createWrapper(element) {
    return {
        element,

        html() {
            return element.innerHTML;
        },

        text() {
            return element.textContent;
        },

        find(selector) {
            return element.querySelector(selector);
        },

        findAll(selector) {
            return Array.from(element.querySelectorAll(selector));
        },

        classes() {
            return Array.from(element.classList);
        },

        attributes() {
            const attrs = {};
            for (const attr of element.attributes) {
                attrs[attr.name] = attr.value;
            }
            return attrs;
        },

        trigger(event, options = {}) {
            const evt = new Event(event, { bubbles: true, cancelable: true, ...options });
            element.dispatchEvent(evt);
            return nextTick();
        },

        setValue(value) {
            element.value = value;
            return this.trigger('input');
        },

        setChecked(checked = true) {
            element.checked = checked;
            return this.trigger('change');
        },

        exists() {
            return document.body.contains(element);
        },
    };
}

/**
 * Enable auto-unmount for all tests
 */
export function enableAutoUnmount(hook) {
    const mountedComponents = [];

    const originalMount = mount;
    const wrappedMount = (...args) => {
        const wrapper = originalMount(...args);
        mountedComponents.push(wrapper);
        return wrapper;
    };

    hook(() => {
        mountedComponents.forEach(wrapper => {
            if (!wrapper.unmounted) {
                wrapper.unmount();
            }
        });
        mountedComponents.length = 0;
    });

    return wrappedMount;
}

/**
 * Create test component
 */
export function createTestComponent(options = {}) {
    const {
        template = '<div></div>',
        props = {},
        data = () => ({}),
        methods = {},
        computed = {},
        mounted = () => { },
    } = options;

    return {
        name: 'TestComponent',
        template,
        props,
        data,
        methods,
        computed,
        mounted,
    };
}