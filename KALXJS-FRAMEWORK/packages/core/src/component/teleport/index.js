/**
 * Teleport - Export teleport functionality
 */

export { Teleport } from './teleport.js';

/**
 * Composition API hook for imperative portal creation
 * @param {string|Element} target - Target selector or element
 * @returns {Object} Portal controller
 */
import { ref } from '../../reactivity/reactive.js';

export function usePortal(target) {
    const isActive = ref(false);
    const container = ref(null);

    const open = (content) => {
        const targetElement = typeof target === 'string'
            ? document.querySelector(target)
            : target;

        if (!targetElement) {
            console.warn(`[KALXJS Portal] Target not found`);
            return;
        }

        if (!container.value) {
            container.value = document.createElement('div');
            container.value.setAttribute('data-kalxjs-portal', '');
        }

        container.value.innerHTML = '';

        if (typeof content === 'string') {
            container.value.innerHTML = content;
        } else if (content instanceof Element) {
            container.value.appendChild(content);
        }

        targetElement.appendChild(container.value);
        isActive.value = true;
    };

    const close = () => {
        if (container.value && container.value.parentNode) {
            container.value.parentNode.removeChild(container.value);
        }
        isActive.value = false;
    };

    const toggle = (content) => {
        if (isActive.value) {
            close();
        } else {
            open(content);
        }
    };

    return {
        isActive,
        open,
        close,
        toggle
    };
}