/**
 * KALXJS Advanced Router - Scroll Behavior
 * Automatic scroll management for route navigation
 *
 * @module @kalxjs/router/advanced/scroll-behavior
 */

/**
 * Scroll position storage
 */
const scrollPositions = new Map();

/**
 * Get saved scroll position for a route
 *
 * @param {string} key - Route key
 * @returns {Object|null} Saved position {x, y}
 */
export function getSavedPosition(key) {
    return scrollPositions.get(key) || null;
}

/**
 * Save scroll position for a route
 *
 * @param {string} key - Route key
 * @param {Object} position - Position {x, y}
 */
export function savePosition(key, position) {
    scrollPositions.set(key, position);
}

/**
 * Get current scroll position
 *
 * @returns {Object} Current position {x, y}
 */
export function getCurrentPosition() {
    return {
        x: window.pageXOffset || document.documentElement.scrollLeft,
        y: window.pageYOffset || document.documentElement.scrollTop,
    };
}

/**
 * Scroll to position
 *
 * @param {Object} position - Position {x, y}
 * @param {Object} options - Scroll options
 */
export function scrollToPosition(position, options = {}) {
    const { behavior = 'auto', offset = { x: 0, y: 0 } } = options;

    if (!position) {
        return;
    }

    window.scrollTo({
        left: position.x + offset.x,
        top: position.y + offset.y,
        behavior,
    });
}

/**
 * Scroll to element
 *
 * @param {string|Element} selector - Element or selector
 * @param {Object} options - Scroll options
 */
export function scrollToElement(selector, options = {}) {
    const {
        behavior = 'smooth',
        offset = { x: 0, y: 0 },
        block = 'start',
    } = options;

    const element = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;

    if (!element) {
        return;
    }

    if (offset.x === 0 && offset.y === 0) {
        element.scrollIntoView({ behavior, block });
    } else {
        const rect = element.getBoundingClientRect();
        window.scrollTo({
            left: rect.left + window.pageXOffset + offset.x,
            top: rect.top + window.pageYOffset + offset.y,
            behavior,
        });
    }
}

/**
 * Handle scroll behavior for navigation
 *
 * @param {Object} to - Target route
 * @param {Object} from - Current route
 * @param {Object} savedPosition - Saved scroll position
 * @returns {Object|boolean} Scroll position or false
 */
export function handleScrollBehavior(to, from, savedPosition) {
    // If going back/forward, use saved position
    if (savedPosition) {
        return savedPosition;
    }

    // If route has hash, scroll to element
    if (to.hash) {
        return {
            el: to.hash,
            behavior: 'smooth',
        };
    }

    // Check route meta for scroll behavior
    if (to.meta && to.meta.scrollBehavior) {
        const behavior = to.meta.scrollBehavior;

        if (typeof behavior === 'function') {
            return behavior(to, from, savedPosition);
        }

        return behavior;
    }

    // Default: scroll to top
    return { x: 0, y: 0 };
}

/**
 * Apply scroll behavior
 *
 * @param {Object} position - Position to scroll to
 * @param {Object} options - Scroll options
 * @returns {Promise}
 */
export async function applyScrollBehavior(position, options = {}) {
    const { delay = 0, smooth = true } = options;

    if (!position) {
        return;
    }

    // Wait for delay
    if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Handle different position types
    if (position.el) {
        // Scroll to element
        scrollToElement(position.el, {
            behavior: smooth ? 'smooth' : 'auto',
            offset: position.offset,
        });
    } else if (typeof position.x === 'number' || typeof position.y === 'number') {
        // Scroll to coordinates
        scrollToPosition(
            { x: position.x || 0, y: position.y || 0 },
            { behavior: smooth ? 'smooth' : 'auto' }
        );
    }
}

/**
 * Create scroll behavior handler
 *
 * @param {Object} router - Router instance
 * @param {Object} options - Configuration options
 */
export function setupScrollBehavior(router, options = {}) {
    const {
        behavior = handleScrollBehavior,
        smooth = true,
        delay = 0,
        savePosition: shouldSave = true,
    } = options;

    // Save scroll position before navigation
    if (shouldSave) {
        router.beforeEach((to, from) => {
            const key = from.fullPath || from.path;
            const position = getCurrentPosition();
            savePosition(key, position);
        });
    }

    // Apply scroll behavior after navigation
    router.afterEach((to, from) => {
        const savedKey = to.fullPath || to.path;
        const savedPosition = getSavedPosition(savedKey);

        const position = typeof behavior === 'function'
            ? behavior(to, from, savedPosition)
            : behavior;

        if (position !== false) {
            applyScrollBehavior(position, { smooth, delay });
        }
    });
}

/**
 * Scroll behavior presets
 */
export const ScrollBehaviorPresets = {
    /**
     * Always scroll to top
     */
    scrollToTop: () => ({ x: 0, y: 0 }),

    /**
     * Save and restore position
     */
    savePosition: (to, from, savedPosition) => {
        if (savedPosition) {
            return savedPosition;
        }
        return { x: 0, y: 0 };
    },

    /**
     * Scroll to hash or top
     */
    hashOrTop: (to) => {
        if (to.hash) {
            return { el: to.hash };
        }
        return { x: 0, y: 0 };
    },

    /**
     * No scroll (keep current position)
     */
    noScroll: () => false,

    /**
     * Smooth scroll to top with delay
     */
    smoothTop: (to, from, savedPosition) => {
        if (savedPosition) {
            return savedPosition;
        }
        return { x: 0, y: 0, smooth: true };
    },
};