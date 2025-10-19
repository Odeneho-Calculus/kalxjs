/**
 * Teleport Component - Render content in a different DOM location
 * Perfect for modals, tooltips, notifications
 */

import { ref } from '../../reactivity/reactive.js';
import { watch, onMounted, onUnmounted, onUpdated } from '../../composition.js';

/**
 * Teleport component for portal rendering
 * @param {Object} props - Component props
 * @param {Object} context - Component context
 * @returns {null} Returns null as content is rendered elsewhere
 */
export function Teleport(props, context) {
    const { to, disabled = false } = props;
    const { slots } = context;

    const targetElement = ref(null);
    const contentContainer = ref(null);
    const isMounted = ref(false);

    /**
     * Resolve target element from selector or element
     */
    const resolveTarget = () => {
        if (disabled) {
            return null;
        }

        if (typeof to === 'string') {
            return document.querySelector(to);
        }

        if (to instanceof Element) {
            return to;
        }

        return null;
    };

    /**
     * Mount content to target
     */
    const mountContent = () => {
        const target = resolveTarget();

        if (!target) {
            console.warn(`[KALXJS Teleport] Target "${to}" not found`);
            return;
        }

        targetElement.value = target;

        // Create container for teleported content
        if (!contentContainer.value) {
            contentContainer.value = document.createElement('div');
            contentContainer.value.setAttribute('data-kalxjs-teleport', '');
        }

        // Render content into container
        if (slots.default) {
            const content = slots.default();
            renderToContainer(content);
        }

        // Append to target
        target.appendChild(contentContainer.value);
        isMounted.value = true;
    };

    /**
     * Unmount content from target
     */
    const unmountContent = () => {
        if (contentContainer.value && targetElement.value) {
            try {
                targetElement.value.removeChild(contentContainer.value);
            } catch (e) {
                // Element might already be removed
            }
        }
        isMounted.value = false;
    };

    /**
     * Render content to container
     */
    const renderToContainer = (vnode) => {
        if (!contentContainer.value) return;

        // Clear existing content
        contentContainer.value.innerHTML = '';

        if (!vnode) return;

        // Convert vnode to DOM and append
        const element = vnodeToDom(vnode);
        if (element) {
            contentContainer.value.appendChild(element);
        }
    };

    /**
     * Simple vnode to DOM conversion
     */
    const vnodeToDom = (vnode) => {
        if (!vnode) return null;

        if (typeof vnode === 'string' || typeof vnode === 'number') {
            return document.createTextNode(String(vnode));
        }

        if (Array.isArray(vnode)) {
            const fragment = document.createDocumentFragment();
            vnode.forEach(child => {
                const childElement = vnodeToDom(child);
                if (childElement) {
                    fragment.appendChild(childElement);
                }
            });
            return fragment;
        }

        if (vnode.tag) {
            const element = document.createElement(vnode.tag);

            // Apply props
            if (vnode.props) {
                Object.entries(vnode.props).forEach(([key, value]) => {
                    if (key.startsWith('on')) {
                        const eventName = key.slice(2).toLowerCase();
                        element.addEventListener(eventName, value);
                    } else if (key === 'style' && typeof value === 'object') {
                        Object.assign(element.style, value);
                    } else if (key !== 'children') {
                        element.setAttribute(key, value);
                    }
                });
            }

            // Render children
            if (vnode.children) {
                const children = Array.isArray(vnode.children)
                    ? vnode.children
                    : [vnode.children];

                children.forEach(child => {
                    const childElement = vnodeToDom(child);
                    if (childElement) {
                        element.appendChild(childElement);
                    }
                });
            }

            return element;
        }

        return null;
    };

    // Lifecycle hooks
    onMounted(() => {
        if (!disabled) {
            mountContent();
        }
    });

    onUpdated(() => {
        if (disabled && isMounted.value) {
            unmountContent();
        } else if (!disabled && !isMounted.value) {
            mountContent();
        } else if (!disabled && isMounted.value) {
            // Update content
            if (slots.default) {
                const content = slots.default();
                renderToContainer(content);
            }
        }
    });

    onUnmounted(() => {
        unmountContent();
    });

    // Watch for changes to 'to' prop
    watch(() => to, () => {
        if (!disabled) {
            unmountContent();
            mountContent();
        }
    });

    // Return null - content is rendered elsewhere
    return disabled && slots.default ? slots.default() : null;
}

// Mark as internal component
Teleport.__isTeleport = true;