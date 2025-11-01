/**
 * Phase 8: Scroll Position Management
 * Automatic scroll position preservation and restoration
 *
 * Features:
 * - Save/restore scroll position per route
 * - Scroll to element by hash
 * - Customizable scroll behavior
 * - Smooth scrolling support
 */

/**
 * Create scroll position manager
 * @param {Object} config
 * @param {Object} config.router - Router instance
 * @param {Function} config.scrollBehavior - Custom scroll behavior function
 * @returns {Object} Scroll management API
 */
export function createScrollManager(config = {}) {
    const { router, scrollBehavior } = config;

    // Store scroll positions by route path
    const scrollPositions = new Map();

    /**
     * Save current scroll position for a route
     * @param {string} path - Route path to save position for
     */
    function saveScrollPosition(path) {
        if (!path) {
            console.warn('saveScrollPosition requires a path');
            return;
        }

        const position = {
            x: window.scrollX || window.pageXOffset || 0,
            y: window.scrollY || window.pageYOffset || 0,
            timestamp: Date.now()
        };

        scrollPositions.set(path, position);
    }

    /**
     * Restore scroll position for a route
     * @param {string} path - Route path
     * @param {boolean} smooth - Use smooth scrolling
     */
    function restoreScrollPosition(path, smooth = false) {
        const position = scrollPositions.get(path);

        if (!position) {
            // Default to top
            scrollTo(0, 0, smooth);
            return;
        }

        scrollTo(position.x, position.y, smooth);
    }

    /**
     * Scroll to a specific position
     * @param {number} x - Horizontal position
     * @param {number} y - Vertical position
     * @param {boolean} smooth - Use smooth scrolling
     */
    function scrollTo(x, y, smooth = false) {
        if (!window) return;

        if (smooth) {
            window.scrollTo({
                left: x,
                top: y,
                behavior: 'smooth'
            });
        } else {
            window.scrollX = x;
            window.scrollY = y;
        }
    }

    /**
     * Scroll to element by selector
     * @param {string} selector - CSS selector or element ID
     * @param {Object} options
     * @param {number} options.offset - Offset in pixels
     * @param {boolean} options.smooth - Use smooth scrolling
     */
    function scrollToElement(selector, options = {}) {
        const { offset = 0, smooth = false } = options;

        if (!window) return;

        let element = null;

        // Try as ID first (without #)
        if (!selector.startsWith('#')) {
            element = document.getElementById(selector);
        }

        // Try as selector
        if (!element) {
            element = document.querySelector(selector);
        }

        if (!element) {
            console.warn(`Element not found for scroll: ${selector}`);
            return;
        }

        const rect = element.getBoundingClientRect();
        const absoluteElementTop = rect.top + window.pageYOffset;
        const elementPosition = absoluteElementTop - offset;

        scrollTo(0, elementPosition, smooth);
    }

    /**
     * Clear saved scroll position
     * @param {string|null} path - Route path or null to clear all
     */
    function clearScrollPosition(path = null) {
        if (path) {
            scrollPositions.delete(path);
        } else {
            scrollPositions.clear();
        }
    }

    /**
     * Handle scroll on navigation
     * @param {Object} to - Target route
     * @param {Object} from - Source route
     * @param {Object} savedPosition - Saved position if going back
     */
    function handleNavigation(to, from, savedPosition) {
        // Use custom scroll behavior if provided
        if (scrollBehavior) {
            const behavior = scrollBehavior(to, from, savedPosition);
            if (behavior) {
                if (behavior.selector) {
                    scrollToElement(behavior.selector, { smooth: behavior.smooth });
                } else if (behavior.x !== undefined && behavior.y !== undefined) {
                    scrollTo(behavior.x, behavior.y, behavior.smooth);
                }
                return;
            }
        }

        // Default scroll behavior
        if (savedPosition) {
            restoreScrollPosition(from?.path, false);
        } else if (to.hash) {
            // Scroll to hash
            setTimeout(() => {
                scrollToElement(to.hash, { smooth: true });
            }, 0);
        } else {
            // Scroll to top
            scrollTo(0, 0, false);
        }
    }

    /**
     * Create composable for use in components
     * @param {Object} currentRoute - Current route object
     * @returns {Object} Scroll composable API
     */
    function createScrollComposable(currentRoute) {
        return {
            /**
             * Save current scroll position
             */
            save() {
                saveScrollPosition(currentRoute?.path);
            },

            /**
             * Restore scroll position
             * @param {boolean} smooth - Use smooth scrolling
             */
            restore(smooth = false) {
                restoreScrollPosition(currentRoute?.path, smooth);
            },

            /**
             * Scroll to element
             * @param {string} selector - CSS selector or ID
             * @param {Object} options
             */
            scrollToElement(selector, options = {}) {
                scrollToElement(selector, options);
            },

            /**
             * Scroll to position
             * @param {number} x - Horizontal position
             * @param {number} y - Vertical position
             * @param {boolean} smooth - Use smooth scrolling
             */
            scrollTo(x, y, smooth = false) {
                scrollTo(x, y, smooth);
            },

            /**
             * Scroll to top
             * @param {boolean} smooth - Use smooth scrolling
             */
            scrollToTop(smooth = false) {
                scrollTo(0, 0, smooth);
            }
        };
    }

    return {
        saveScrollPosition,
        restoreScrollPosition,
        scrollTo,
        scrollToElement,
        clearScrollPosition,
        handleNavigation,
        createScrollComposable,
        scrollPositions
    };
}

/**
 * Create useScroll composable
 * @param {Object} config
 * @returns {Function} useScroll hook
 */
export function createUseScroll(config = {}) {
    const { scrollManager, currentRoute } = config;

    return function useScroll() {
        if (!scrollManager) {
            console.warn('Scroll manager not initialized');
            return {};
        }

        return scrollManager.createScrollComposable(currentRoute?.value || currentRoute);
    };
}

/**
 * Integrate scroll management into router
 * @param {Object} router - Router instance
 * @param {Object} scrollBehavior - Scroll behavior function
 */
export function integrateScrollManagement(router, scrollBehavior) {
    const scrollManager = createScrollManager({ router, scrollBehavior });

    // Hook into afterEach to save scroll position
    router.afterEach?.((to, from) => {
        // Save current position before leaving
        if (from?.path) {
            scrollManager.saveScrollPosition(from.path);
        }
    });

    // Hook into beforeEach to restore scroll position
    router.beforeEach?.((to, from, next) => {
        // Check if going back (via browser back button or history)
        const savedPosition = scrollManager.scrollPositions.get(to?.path);

        scrollManager.handleNavigation(to, from, savedPosition);
        next();
    });

    return scrollManager;
}

export default createScrollManager;