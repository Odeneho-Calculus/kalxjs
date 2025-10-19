/**
 * KalxJS Virtual DOM
 */
import { runMountedHooks, runUnmountedHooks, provide } from './reactivity.js';
import { installPlugin, provideToApp } from './plugin.js';

/**
 * Creates a virtual node
 * @param {String|Object} tag - The tag name or component
 * @param {Object} props - The props
 * @param {Array} children - The children
 * @returns {Object} Virtual node
 */
export function h(tag, props = {}, children = []) {
    return {
        tag,
        props: props || {},
        children: Array.isArray(children) ? children : [children]
    };
}

/**
 * Creates an application instance
 * @param {Object} rootComponent - The root component
 * @returns {Object} Application instance
 */
export function createApp(rootComponent) {
    const app = {
        component: rootComponent,
        config: {
            globalProperties: {}
        },
        mount(selector) {
            const container = typeof selector === 'string'
                ? document.querySelector(selector)
                : selector;

            if (!container) {
                console.error(`Target container not found: ${selector}`);
                return;
            }

            console.log('Found container:', container);

            // Clear the container
            container.innerHTML = '';

            // Render the component
            const renderer = defaultRenderer;
            console.log('Using default renderer');

            // Mount the component
            renderer(app.component, container);

            return app;
        },
        use(plugin, options) {
            installPlugin(app, plugin, options);
            return app;
        },
        provide(key, value) {
            provideToApp(app, key, value);
            return app;
        }
    };

    return app;
}

/**
 * Default renderer
 * @param {Object} component - The component to render
 * @param {Element} container - The container element
 */
function defaultRenderer(component, container) {
    console.log('Using default renderer');

    // Check component type
    const type = typeof component;
    console.log('Component type:', type);

    if (type === 'object') {
        console.log('Creating component with options:', component);

        // Call setup function
        const setupResult = component.setup ? component.setup() : null;

        if (typeof setupResult === 'function') {
            // Render function
            const renderResult = setupResult();
            console.log('Component render result:', renderResult);

            // Create DOM element
            const element = createElement(renderResult);
            console.log('DOM element created and appended:', element);

            // Append to container
            container.appendChild(element);

            // Run mounted hooks
            runMountedHooks();
        } else {
            console.error('Component setup must return a render function');
        }
    } else {
        console.error('Invalid component type');
    }

    console.log('Application successfully mounted with default renderer');
}

/**
 * Creates a DOM element from a virtual node
 * @param {Object} vnode - The virtual node
 * @returns {Element} DOM element
 */
function createElement(vnode) {
    if (!vnode) return null;

    // Handle text nodes
    if (typeof vnode === 'string') {
        return document.createTextNode(vnode);
    }

    // Handle component nodes
    if (typeof vnode.tag === 'object' || typeof vnode.tag === 'function') {
        const component = vnode.tag;
        const props = vnode.props || {};

        // Call setup function
        const setupResult = component.setup ? component.setup(props) : null;

        if (typeof setupResult === 'function') {
            // Render function
            const renderResult = setupResult();

            // Create DOM element
            return createElement(renderResult);
        }

        return document.createComment('Component placeholder');
    }

    // Create element
    const element = document.createElement(vnode.tag || 'div');

    // Add properties
    if (vnode.props) {
        for (const key in vnode.props) {
            if (key === 'class' || key === 'className') {
                element.className = vnode.props[key];
            } else if (key === 'style') {
                const styles = vnode.props[key];
                for (const styleName in styles) {
                    element.style[styleName] = styles[styleName];
                }
            } else if (key.startsWith('on')) {
                const eventName = key.slice(2).toLowerCase();
                element.addEventListener(eventName, vnode.props[key]);
            } else {
                element.setAttribute(key, vnode.props[key]);
            }
        }
    }

    // Add children
    if (vnode.children) {
        vnode.children.forEach(child => {
            if (child != null) {
                const childElement = createElement(child);
                if (childElement) {
                    element.appendChild(childElement);
                }
            }
        });
    }

    return element;
}