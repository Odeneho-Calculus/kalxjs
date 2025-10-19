// router-patch.js
// Enhanced router reactivity using the KalxJS reactive system
import { ref, reactive, watch } from '@kalxjs/core';

/**
 * Enhances the router with better reactivity using the KalxJS reactive system
 * @param {Object} router - The router instance to enhance
 * @returns {Object} The enhanced router instance
 */
export function patchRouter(router) {
    console.log('Enhancing router with reactive system');

    // Create a reactive reference to the current route
    const currentRouteRef = ref({ ...router.currentRoute });

    // Make the router's currentRoute reactive
    Object.defineProperty(router, 'currentRoute', {
        get() {
            return currentRouteRef.value;
        },
        set(newValue) {
            currentRouteRef.value = { ...newValue };
        }
    });

    // Store the original _onRouteChange method
    const originalOnRouteChange = router._onRouteChange;

    // Override the _onRouteChange method to update the reactive reference
    router._onRouteChange = function () {
        console.log('Enhanced _onRouteChange called');

        // Call the original method
        const result = originalOnRouteChange.apply(this, arguments);

        // Update the reactive reference
        currentRouteRef.value = { ...this.currentRoute };

        // Dispatch a custom event for components that might not be using the reactive system
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('kalroute', {
                detail: { route: { ...this.currentRoute } }
            });
            window.dispatchEvent(event);
        }

        return result;
    };

    // Add a method to force a route update
    router.forceUpdate = function () {
        console.log('Forcing router update with reactive system');
        this._onRouteChange();
    };

    // Set up a watcher to log route changes
    if (process.env.NODE_ENV !== 'production') {
        watch(currentRouteRef, (newRoute, oldRoute) => {
            console.log('Route changed:', {
                from: oldRoute?.path,
                to: newRoute?.path
            });
        });
    }

    return router;
}

/**
 * Sets up global listeners for route changes
 * This helps components that aren't directly using the reactive system
 */
export function setupGlobalRouteListener() {
    console.log('Setting up global route listeners');

    if (typeof window === 'undefined') return;

    // Listen for custom route change events
    window.addEventListener('kalroute', (event) => {
        console.log('Global kalroute event received:', event.detail);
        updateRouterViews();
    });

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
        console.log('Hash changed, updating router');
        if (window.__KAL_ROUTER__) {
            setTimeout(() => {
                window.__KAL_ROUTER__._onRouteChange();
            }, 10);
        }
    });
}

/**
 * Updates all router view components in the DOM
 */
function updateRouterViews() {
    if (typeof document === 'undefined') return;

    // Find all router view containers
    const routerViewContainers = document.querySelectorAll('.kal-router-view-container');
    console.log('Found', routerViewContainers.length, 'router view containers to update');

    // Update each container
    routerViewContainers.forEach(container => {
        if (container._update && typeof container._update === 'function') {
            container._update();
        }
    });
}