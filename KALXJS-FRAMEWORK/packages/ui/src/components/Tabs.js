/**
 * Tabs Component
 * Accessible tabs with keyboard navigation
 *
 * @module @kalxjs/ui/components/Tabs
 */

import { ref, computed, provide, inject } from '@kalxjs/core';

const TabsSymbol = Symbol('tabs');

/**
 * Tabs component
 */
export function Tabs(props, { slots, emit }) {
    const {
        modelValue,
        variant = 'default',
        ...attrs
    } = props;

    // Internal state
    const activeTab = ref(modelValue || null);

    // Watch for external changes
    watch(() => modelValue, (newValue) => {
        activeTab.value = newValue;
    });

    // Methods
    const selectTab = (value) => {
        activeTab.value = value;
        emit('update:modelValue', value);
        emit('change', value);
    };

    // Provide to children
    provide(TabsSymbol, {
        activeTab,
        selectTab,
        variant,
    });

    // Render
    return {
        tag: 'div',
        props: {
            class: `kalx-tabs kalx-tabs--${variant}`,
            ...attrs,
        },
        children: [slots.default?.()],
    };
}

/**
 * TabList component
 */
export function TabList(props, { slots }) {
    const {
        ariaLabel = 'Tabs',
        ...attrs
    } = props;

    return {
        tag: 'div',
        props: {
            class: 'kalx-tab-list',
            role: 'tablist',
            'aria-label': ariaLabel,
            ...attrs,
        },
        children: [slots.default?.()],
    };
}

/**
 * Tab component
 */
export function Tab(props, { slots }) {
    const {
        value,
        disabled = false,
        icon = null,
        ...attrs
    } = props;

    const tabsContext = inject(TabsSymbol);
    if (!tabsContext) {
        console.warn('Tab must be used within Tabs component');
        return null;
    }

    const { activeTab, selectTab } = tabsContext;
    const isActive = computed(() => activeTab.value === value);
    const tabId = `tab-${value}`;
    const panelId = `panel-${value}`;

    const handleClick = () => {
        if (!disabled) {
            selectTab(value);
        }
    };

    const handleKeydown = (e) => {
        if (disabled) return;

        // Get all tab buttons
        const tabList = e.currentTarget.parentElement;
        const tabs = Array.from(tabList.querySelectorAll('[role="tab"]:not([disabled])'));
        const currentIndex = tabs.indexOf(e.currentTarget);

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % tabs.length;
                tabs[nextIndex]?.focus();
                tabs[nextIndex]?.click();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                tabs[prevIndex]?.focus();
                tabs[prevIndex]?.click();
                break;
            case 'Home':
                e.preventDefault();
                tabs[0]?.focus();
                tabs[0]?.click();
                break;
            case 'End':
                e.preventDefault();
                tabs[tabs.length - 1]?.focus();
                tabs[tabs.length - 1]?.click();
                break;
        }
    };

    const tabClasses = computed(() => {
        const classes = ['kalx-tab'];
        if (isActive.value) classes.push('kalx-tab--active');
        if (disabled) classes.push('kalx-tab--disabled');
        return classes.join(' ');
    });

    return {
        tag: 'button',
        props: {
            id: tabId,
            type: 'button',
            class: tabClasses.value,
            role: 'tab',
            'aria-selected': isActive.value,
            'aria-controls': panelId,
            tabindex: isActive.value ? 0 : -1,
            disabled,
            ...attrs,
        },
        on: {
            click: handleClick,
            keydown: handleKeydown,
        },
        children: [
            icon && {
                tag: 'span',
                props: { class: 'kalx-tab-icon' },
                children: [icon],
            },
            slots.default?.(),
        ].filter(Boolean),
    };
}

/**
 * TabPanels component
 */
export function TabPanels(props, { slots }) {
    return {
        tag: 'div',
        props: {
            class: 'kalx-tab-panels',
        },
        children: [slots.default?.()],
    };
}

/**
 * TabPanel component
 */
export function TabPanel(props, { slots }) {
    const { value, ...attrs } = props;

    const tabsContext = inject(TabsSymbol);
    if (!tabsContext) {
        console.warn('TabPanel must be used within Tabs component');
        return null;
    }

    const { activeTab } = tabsContext;
    const isActive = computed(() => activeTab.value === value);
    const tabId = `tab-${value}`;
    const panelId = `panel-${value}`;

    if (!isActive.value) {
        return null;
    }

    return {
        tag: 'div',
        props: {
            id: panelId,
            class: 'kalx-tab-panel',
            role: 'tabpanel',
            'aria-labelledby': tabId,
            tabindex: 0,
            ...attrs,
        },
        children: [slots.default?.()],
    };
}

/**
 * Tabs styles
 */
export const tabsStyles = `
.kalx-tabs {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.kalx-tab-list {
    display: flex;
    gap: var(--spacing-2);
    border-bottom: 2px solid var(--color-border-primary);
}

.kalx-tabs--pills .kalx-tab-list {
    border-bottom: none;
}

.kalx-tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-4);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
}

.kalx-tab:hover:not(:disabled) {
    color: var(--color-text-primary);
    background-color: var(--color-background-secondary);
}

.kalx-tab:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-primary);
}

.kalx-tab--active {
    color: var(--color-primary-500);
    border-bottom-color: var(--color-primary-500);
}

.kalx-tab--disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Pills variant */
.kalx-tabs--pills .kalx-tab {
    border-radius: var(--radius-md);
    border-bottom: none;
}

.kalx-tabs--pills .kalx-tab--active {
    background-color: var(--color-primary-500);
    color: white;
}

.kalx-tab-icon {
    display: flex;
    font-size: var(--text-lg);
}

.kalx-tab-panels {
    flex: 1;
}

.kalx-tab-panel {
    outline: none;
    animation: kalx-fade-in 0.2s ease;
}

@keyframes kalx-fade-in {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;

/**
 * Export tabs components
 */
export default Tabs;
export { TabList, Tab, TabPanels, TabPanel };