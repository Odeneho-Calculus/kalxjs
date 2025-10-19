/**
 * Keyboard Navigation Support
 * Utilities for keyboard shortcuts and navigation
 *
 * @module @kalxjs/a11y/keyboard-navigation
 */

/**
 * Keyboard keys constants
 */
export const Keys = {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
    DELETE: 'Delete',
    BACKSPACE: 'Backspace',
};

/**
 * Check if key matches
 */
export function isKey(event, key) {
    return event.key === key;
}

/**
 * Check if modifier keys are pressed
 */
export function hasModifier(event, modifier) {
    switch (modifier) {
        case 'ctrl':
        case 'control':
            return event.ctrlKey || event.metaKey;
        case 'shift':
            return event.shiftKey;
        case 'alt':
            return event.altKey;
        case 'meta':
            return event.metaKey;
        default:
            return false;
    }
}

/**
 * Create keyboard shortcut handler
 */
export function createShortcut(keys, handler, options = {}) {
    const { preventDefault = true, stopPropagation = false } = options;

    // Parse shortcut string (e.g., "ctrl+shift+s")
    const parts = keys.toLowerCase().split('+');
    const modifiers = {
        ctrl: parts.includes('ctrl') || parts.includes('control'),
        shift: parts.includes('shift'),
        alt: parts.includes('alt'),
        meta: parts.includes('meta'),
    };
    const key = parts[parts.length - 1];

    return function handleKeyEvent(event) {
        // Check if key matches
        if (event.key.toLowerCase() !== key) return;

        // Check modifiers
        if (modifiers.ctrl && !event.ctrlKey && !event.metaKey) return;
        if (modifiers.shift && !event.shiftKey) return;
        if (modifiers.alt && !event.altKey) return;
        if (modifiers.meta && !event.metaKey) return;

        // Check inverse - no extra modifiers pressed
        if (!modifiers.ctrl && (event.ctrlKey || event.metaKey)) return;
        if (!modifiers.shift && event.shiftKey) return;
        if (!modifiers.alt && event.altKey) return;

        // Execute handler
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();

        handler(event);
    };
}

/**
 * Keyboard shortcut manager
 */
export function createShortcutManager() {
    const shortcuts = new Map();

    function register(id, keys, handler, options) {
        const shortcutHandler = createShortcut(keys, handler, options);
        shortcuts.set(id, { keys, handler: shortcutHandler, options });

        document.addEventListener('keydown', shortcutHandler);

        return () => unregister(id);
    }

    function unregister(id) {
        const shortcut = shortcuts.get(id);
        if (shortcut) {
            document.removeEventListener('keydown', shortcut.handler);
            shortcuts.delete(id);
        }
    }

    function clear() {
        shortcuts.forEach((shortcut, id) => unregister(id));
    }

    function getAll() {
        return Array.from(shortcuts.entries()).map(([id, { keys, options }]) => ({
            id,
            keys,
            ...options,
        }));
    }

    return {
        register,
        unregister,
        clear,
        getAll,
    };
}

/**
 * Arrow key navigation for lists
 */
export function createArrowNavigation(container, options = {}) {
    const {
        orientation = 'vertical',
        loop = true,
        itemSelector = '[role="option"], [role="menuitem"], [role="tab"]',
    } = options;

    const isVertical = orientation === 'vertical';
    const nextKey = isVertical ? Keys.ARROW_DOWN : Keys.ARROW_RIGHT;
    const prevKey = isVertical ? Keys.ARROW_UP : Keys.ARROW_LEFT;

    function getItems() {
        return Array.from(container.querySelectorAll(itemSelector));
    }

    function getCurrentIndex() {
        const items = getItems();
        return items.indexOf(document.activeElement);
    }

    function focusItem(index) {
        const items = getItems();
        if (items[index]) {
            items[index].focus();
            return true;
        }
        return false;
    }

    function handleKeyDown(event) {
        const items = getItems();
        if (items.length === 0) return;

        const currentIndex = getCurrentIndex();
        if (currentIndex === -1) return;

        let handled = false;

        switch (event.key) {
            case nextKey:
                {
                    const nextIndex = currentIndex + 1;
                    if (nextIndex < items.length) {
                        focusItem(nextIndex);
                    } else if (loop) {
                        focusItem(0);
                    }
                    handled = true;
                }
                break;

            case prevKey:
                {
                    const prevIndex = currentIndex - 1;
                    if (prevIndex >= 0) {
                        focusItem(prevIndex);
                    } else if (loop) {
                        focusItem(items.length - 1);
                    }
                    handled = true;
                }
                break;

            case Keys.HOME:
                focusItem(0);
                handled = true;
                break;

            case Keys.END:
                focusItem(items.length - 1);
                handled = true;
                break;
        }

        if (handled) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    function enable() {
        container.addEventListener('keydown', handleKeyDown);
    }

    function disable() {
        container.removeEventListener('keydown', handleKeyDown);
    }

    return {
        enable,
        disable,
        focusFirst: () => focusItem(0),
        focusLast: () => focusItem(getItems().length - 1),
        focusNext: () => {
            const current = getCurrentIndex();
            focusItem(current + 1 < getItems().length ? current + 1 : loop ? 0 : current);
        },
        focusPrev: () => {
            const current = getCurrentIndex();
            focusItem(current - 1 >= 0 ? current - 1 : loop ? getItems().length - 1 : current);
        },
    };
}

/**
 * Create roving tabindex manager
 */
export function createRovingTabindex(container, options = {}) {
    const { itemSelector = '[role="option"], [role="menuitem"]' } = options;

    function updateTabindex(activeElement) {
        const items = Array.from(container.querySelectorAll(itemSelector));

        items.forEach(item => {
            if (item === activeElement) {
                item.setAttribute('tabindex', '0');
            } else {
                item.setAttribute('tabindex', '-1');
            }
        });
    }

    function handleFocus(event) {
        const target = event.target.closest(itemSelector);
        if (target) {
            updateTabindex(target);
        }
    }

    function enable() {
        container.addEventListener('focus', handleFocus, true);

        // Initialize first item as focusable
        const firstItem = container.querySelector(itemSelector);
        if (firstItem) {
            updateTabindex(firstItem);
        }
    }

    function disable() {
        container.removeEventListener('focus', handleFocus, true);
    }

    return {
        enable,
        disable,
        setActive: updateTabindex,
    };
}

/**
 * Make element keyboard accessible
 */
export function makeKeyboardAccessible(element, handler, options = {}) {
    const { keys = [Keys.ENTER, Keys.SPACE] } = options;

    function handleKeyDown(event) {
        if (keys.includes(event.key)) {
            event.preventDefault();
            handler(event);
        }
    }

    element.addEventListener('keydown', handleKeyDown);

    return () => {
        element.removeEventListener('keydown', handleKeyDown);
    };
}