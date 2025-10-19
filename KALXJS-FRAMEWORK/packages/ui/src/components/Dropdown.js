/**
 * Dropdown Component
 * Accessible dropdown menu with keyboard navigation
 *
 * @module @kalxjs/ui/components/Dropdown
 */

import { ref, computed, onMounted, onUnmounted } from '@kalxjs/core';

/**
 * Dropdown component
 */
export function Dropdown(props, { slots, emit }) {
    const {
        placement = 'bottom-start',
        trigger = 'click',
        disabled = false,
        closeOnSelect = true,
        ...attrs
    } = props;

    // Internal state
    const isOpen = ref(false);
    const triggerRef = ref(null);
    const menuRef = ref(null);
    const focusedIndex = ref(-1);

    // Computed
    const menuClasses = computed(() => {
        const classes = ['kalx-dropdown-menu', `kalx-dropdown-menu--${placement}`];
        if (isOpen.value) classes.push('kalx-dropdown-menu--open');
        return classes.join(' ');
    });

    // Event handlers
    const openMenu = () => {
        if (!disabled) {
            isOpen.value = true;
            focusedIndex.value = -1;
            emit('open');
        }
    };

    const closeMenu = () => {
        isOpen.value = false;
        focusedIndex.value = -1;
        emit('close');
    };

    const toggleMenu = () => {
        if (isOpen.value) {
            closeMenu();
        } else {
            openMenu();
        }
    };

    const handleSelect = (item) => {
        emit('select', item);
        if (closeOnSelect) {
            closeMenu();
        }
    };

    const handleClickOutside = (e) => {
        if (
            isOpen.value &&
            triggerRef.value &&
            menuRef.value &&
            !triggerRef.value.contains(e.target) &&
            !menuRef.value.contains(e.target)
        ) {
            closeMenu();
        }
    };

    const handleKeydown = (e) => {
        if (!isOpen.value) return;

        const menuItems = menuRef.value?.querySelectorAll('[role="menuitem"]');
        if (!menuItems || menuItems.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                focusedIndex.value = Math.min(focusedIndex.value + 1, menuItems.length - 1);
                menuItems[focusedIndex.value]?.focus();
                break;
            case 'ArrowUp':
                e.preventDefault();
                focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
                menuItems[focusedIndex.value]?.focus();
                break;
            case 'Home':
                e.preventDefault();
                focusedIndex.value = 0;
                menuItems[0]?.focus();
                break;
            case 'End':
                e.preventDefault();
                focusedIndex.value = menuItems.length - 1;
                menuItems[menuItems.length - 1]?.focus();
                break;
            case 'Escape':
                e.preventDefault();
                closeMenu();
                triggerRef.value?.focus();
                break;
        }
    };

    // Lifecycle
    onMounted(() => {
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleKeydown);
    });

    onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleKeydown);
    });

    // Get trigger handlers
    const triggerHandlers = computed(() => {
        if (trigger === 'hover') {
            return {
                onMouseenter: openMenu,
                onMouseleave: closeMenu,
            };
        } else if (trigger === 'click') {
            return {
                onClick: toggleMenu,
            };
        }
        return {};
    });

    // Render
    return {
        tag: 'div',
        props: {
            class: 'kalx-dropdown',
            ...attrs,
        },
        children: [
            // Trigger
            {
                tag: 'div',
                ref: triggerRef,
                props: {
                    class: 'kalx-dropdown-trigger',
                    'aria-haspopup': 'true',
                    'aria-expanded': isOpen.value,
                    tabindex: disabled ? -1 : 0,
                    ...triggerHandlers.value,
                },
                children: [slots.trigger?.()],
            },

            // Menu
            {
                tag: 'div',
                ref: menuRef,
                props: {
                    class: menuClasses.value,
                    role: 'menu',
                    'aria-hidden': !isOpen.value,
                },
                children: [slots.default?.({ close: closeMenu, select: handleSelect })],
            },
        ],
    };
}

/**
 * Dropdown item component
 */
export function DropdownItem(props, { slots, emit }) {
    const {
        value,
        disabled = false,
        divider = false,
        onClick,
        ...attrs
    } = props;

    if (divider) {
        return {
            tag: 'div',
            props: {
                class: 'kalx-dropdown-divider',
                role: 'separator',
            },
        };
    }

    const handleClick = (e) => {
        if (!disabled) {
            onClick?.(e);
            emit('click', value);
        }
    };

    return {
        tag: 'button',
        props: {
            type: 'button',
            class: `kalx-dropdown-item ${disabled ? 'kalx-dropdown-item--disabled' : ''}`,
            role: 'menuitem',
            disabled,
            tabindex: disabled ? -1 : 0,
            ...attrs,
        },
        on: { click: handleClick },
        children: [slots.default?.()],
    };
}

/**
 * Dropdown styles
 */
export const dropdownStyles = `
.kalx-dropdown {
    position: relative;
    display: inline-flex;
}

.kalx-dropdown-trigger {
    cursor: pointer;
}

.kalx-dropdown-trigger:focus-visible {
    outline: none;
}

.kalx-dropdown-menu {
    position: absolute;
    z-index: 1000;
    min-width: 160px;
    max-height: 400px;
    margin-top: var(--spacing-2);
    overflow-y: auto;
    background-color: var(--color-surface-primary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-8px);
    transition: all 0.2s ease;
}

.kalx-dropdown-menu--open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

/* Placement */
.kalx-dropdown-menu--bottom-start {
    top: 100%;
    left: 0;
}

.kalx-dropdown-menu--bottom-end {
    top: 100%;
    right: 0;
}

.kalx-dropdown-menu--top-start {
    bottom: 100%;
    left: 0;
    margin-bottom: var(--spacing-2);
}

.kalx-dropdown-menu--top-end {
    bottom: 100%;
    right: 0;
    margin-bottom: var(--spacing-2);
}

.kalx-dropdown-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.kalx-dropdown-item:hover:not(:disabled) {
    background-color: var(--color-background-secondary);
}

.kalx-dropdown-item:focus-visible {
    outline: none;
    background-color: var(--color-background-secondary);
}

.kalx-dropdown-item--disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.kalx-dropdown-divider {
    height: 1px;
    margin: var(--spacing-2) 0;
    background-color: var(--color-border-primary);
}
`;

/**
 * Export dropdown components
 */
export default Dropdown;
export { DropdownItem };