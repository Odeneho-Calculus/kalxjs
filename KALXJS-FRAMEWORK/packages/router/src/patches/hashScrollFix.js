/**
 * Hash Scrolling Fix for KALXJS Router
 * 
 * This patch fixes issues with hash scrolling in the router by:
 * 1. Safely handling invalid selectors
 * 2. Providing fallbacks for element selection
 * 3. Adding smooth scrolling behavior
 */

export function applyHashScrollFix(router) {
    if (!router) return;

    // Store the original _onRouteChange method
    const originalOnRouteChange = router._onRouteChange;

    // Override the method with our fixed version
    router._onRouteChange = function (...args) {
        // Call the original method to maintain core functionality
        const result = originalOnRouteChange.apply(this, args);

        // Return a promise that wraps the original result
        return Promise.resolve(result).then(route => {
            // Apply our custom hash scrolling logic
            if (route && route.hash) {
                try {
                    // Skip route paths that are used as hash values
                    // These are not actual element selectors but route paths
                    if (route.hash === '#/' || route.hash.startsWith('#/')) {
                        // This is a route path, not an element selector
                        return route;
                    }
                    
                    // Remove the # character for querySelector
                    const selector = route.hash.replace(/^#/, '');

                    // Only try to scroll if the selector looks valid
                    if (/^[a-zA-Z][\w-:.]*$/.test(selector)) {
                        // Try multiple selector strategies
                        const element =
                            document.getElementById(selector) ||
                            document.querySelector(`[name="${selector}"]`) ||
                            document.querySelector(`[id="${selector}"]`);

                        if (element) {
                            // Use smooth scrolling for better UX
                            element.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                } catch (error) {
                    console.log('Hash scrolling skipped:', error.message);
                }
            }

            return route;
        });
    };

    console.log('Router hash scrolling fix applied');

    return router;
}