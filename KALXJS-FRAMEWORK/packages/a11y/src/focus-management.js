/**
 * Focus Management Utilities
 * Manage focus states and focus trapping
 *
 * @module @kalxjs/a11y/focus-management
 */

/**
 * Focusable elements selector
 */
const FOCUSABLE_ELEMENTS = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]',
    'audio[controls]',
    'video[controls]',
].join(',');

/**
 * Get all focusable elements within container
 */
export function getFocusableElements(container = document) {
    return Array.from(container.querySelectorAll(FOCUSABLE_ELEMENTS))
        .filter(el => {
            // Check if element is visible and not hidden
            return el.offsetWidth > 0 &&
                el.offsetHeight > 0 &&
                !el.hasAttribute('hidden') &&
                window.getComputedStyle(el).visibility !== 'hidden';
        });
}

/**
 * Get first focusable element
 */
export function getFirstFocusable(container = document) {
    const elements = getFocusableElements(container);
    return elements[0] || null;
}

/**
 * Get last focusable element
 */
export function getLastFocusable(container = document) {
    const elements = getFocusableElements(container);
    return elements[elements.length - 1] || null;
}

/**
 * Focus element with optional scroll prevention
 */
export function focusElement(element, options = {}) {
    if (!element) return false;

    const { preventScroll = false } = options;

    try {
        element.focus({ preventScroll });
        return document.activeElement === element;
    } catch (e) {
        return false;
    }
}

/**
 * Focus first element in container
 */
export function focusFirst(container = document) {
    const first = getFirstFocusable(container);
    return focusElement(first);
}

/**
 * Focus last element in container
 */
export function focusLast(container = document) {
    const last = getLastFocusable(container);
    return focusElement(last);
}

/**
 * Create focus trap
 */
export function createFocusTrap(container, options = {}) {
    const {
        initialFocus,
        returnFocus = true,
        escapeDeactivates = true,
        allowOutsideClick = false,
    } = options;

    let previousFocus = document.activeElement;
    let isActive = false;

    function handleKeyDown(event) {
        if (!isActive) return;

        // Handle Escape key
        if (escapeDeactivates && event.key === 'Escape') {
            deactivate();
            return;
        }

        // Handle Tab key
        if (event.key === 'Tab') {
            const focusables = getFocusableElements(container);
            if (focusables.length === 0) {
                event.preventDefault();
                return;
            }

            const firstFocusable = focusables[0];
            const lastFocusable = focusables[focusables.length - 1];

            if (event.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstFocusable) {
                    event.preventDefault();
                    focusElement(lastFocusable);
                }
            } else {
                // Tab
                if (document.activeElement === lastFocusable) {
                    event.preventDefault();
                    focusElement(firstFocusable);
                }
            }
        }
    }

    function handleClick(event) {
        if (!isActive || allowOutsideClick) return;

        if (!container.contains(event.target)) {
            event.preventDefault();
            event.stopPropagation();
            focusFirst(container);
        }
    }

    function activate() {
        if (isActive) return;

        previousFocus = document.activeElement;
        isActive = true;

        // Add event listeners
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('click', handleClick, true);

        // Focus initial element
        if (initialFocus) {
            focusElement(initialFocus);
        } else {
            focusFirst(container);
        }
    }

    function deactivate() {
        if (!isActive) return;

        isActive = false;

        // Remove event listeners
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('click', handleClick, true);

        // Return focus
        if (returnFocus && previousFocus) {
            focusElement(previousFocus);
        }
    }

    return {
        activate,
        deactivate,
        isActive: () => isActive,
    };
}

/**
 * Save and restore focus
 */
export function createFocusStore() {
    let savedFocus = null;

    return {
        save() {
            savedFocus = document.activeElement;
        },
        restore() {
            if (savedFocus && savedFocus.focus) {
                focusElement(savedFocus);
            }
            savedFocus = null;
        },
        clear() {
            savedFocus = null;
        },
    };
}

/**
 * Create focus scope (like React's FocusScope)
 */
export function createFocusScope(container, options = {}) {
    const { autoFocus = true, restoreFocus = true, contain = true } = options;

    const focusStore = createFocusStore();
    let focusTrap = null;

    function enter() {
        if (restoreFocus) {
            focusStore.save();
        }

        if (contain) {
            focusTrap = createFocusTrap(container, {
                returnFocus: false,
                ...options,
            });
            focusTrap.activate();
        } else if (autoFocus) {
            focusFirst(container);
        }
    }

    function exit() {
        if (focusTrap) {
            focusTrap.deactivate();
            focusTrap = null;
        }

        if (restoreFocus) {
            focusStore.restore();
        }
    }

    return { enter, exit };
}

/**
 * Make element focusable
 */
export function makeFocusable(element, focusable = true) {
    if (!element) return;

    if (focusable) {
        if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }
    } else {
        element.setAttribute('tabindex', '-1');
    }
}

/**
 * Check if element is focused
 */
export function isFocused(element) {
    return document.activeElement === element;
}

/**
 * Check if focus is within container
 */
export function isFocusWithin(container) {
    return container.contains(document.activeElement);
}

/**
 * Wait for focus change
 */
export function waitForFocus(element, timeout = 5000) {
    return new Promise((resolve, reject) => {
        if (isFocused(element)) {
            resolve(element);
            return;
        }

        const timer = setTimeout(() => {
            cleanup();
            reject(new Error('Focus timeout'));
        }, timeout);

        function handleFocus() {
            cleanup();
            resolve(element);
        }

        function cleanup() {
            clearTimeout(timer);
            element.removeEventListener('focus', handleFocus);
        }

        element.addEventListener('focus', handleFocus);
    });
}