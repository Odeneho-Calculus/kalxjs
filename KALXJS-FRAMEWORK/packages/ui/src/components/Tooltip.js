/**
 * Tooltip Component
 * Accessible tooltip with positioning
 *
 * @module @kalxjs/ui/components/Tooltip
 */

import { ref, computed } from '@kalxjs/core';

/**
 * Tooltip component
 */
export function Tooltip(props, { slots }) {
    const {
        content = '',
        placement = 'top',
        trigger = 'hover',
        delay = 0,
        disabled = false,
        arrow = true,
        ...attrs
    } = props;

    // Internal state
    const isVisible = ref(false);
    const tooltipId = `kalx-tooltip-${Math.random().toString(36).slice(2, 11)}`;
    let showTimeout = null;

    // Event handlers
    const showTooltip = () => {
        if (disabled) return;

        if (delay > 0) {
            showTimeout = setTimeout(() => {
                isVisible.value = true;
            }, delay);
        } else {
            isVisible.value = true;
        }
    };

    const hideTooltip = () => {
        if (showTimeout) {
            clearTimeout(showTimeout);
            showTimeout = null;
        }
        isVisible.value = false;
    };

    const toggleTooltip = () => {
        if (isVisible.value) {
            hideTooltip();
        } else {
            showTooltip();
        }
    };

    // Get trigger handlers
    const triggerHandlers = computed(() => {
        if (trigger === 'hover') {
            return {
                onMouseenter: showTooltip,
                onMouseleave: hideTooltip,
                onFocus: showTooltip,
                onBlur: hideTooltip,
            };
        } else if (trigger === 'click') {
            return {
                onClick: toggleTooltip,
            };
        } else if (trigger === 'focus') {
            return {
                onFocus: showTooltip,
                onBlur: hideTooltip,
            };
        }
        return {};
    });

    // Get tooltip classes
    const tooltipClasses = computed(() => {
        const classes = ['kalx-tooltip', `kalx-tooltip--${placement}`];
        if (isVisible.value) classes.push('kalx-tooltip--visible');
        if (arrow) classes.push('kalx-tooltip--arrow');
        return classes.join(' ');
    });

    // Render
    return {
        tag: 'div',
        props: {
            class: 'kalx-tooltip-wrapper',
            ...attrs,
        },
        children: [
            // Trigger element
            {
                tag: 'div',
                props: {
                    class: 'kalx-tooltip-trigger',
                    'aria-describedby': isVisible.value ? tooltipId : null,
                    ...triggerHandlers.value,
                },
                children: [slots.default?.()],
            },

            // Tooltip
            {
                tag: 'div',
                props: {
                    id: tooltipId,
                    class: tooltipClasses.value,
                    role: 'tooltip',
                    'aria-hidden': !isVisible.value,
                },
                children: [
                    content || slots.content?.(),

                    // Arrow
                    arrow && {
                        tag: 'div',
                        props: { class: 'kalx-tooltip-arrow' },
                    },
                ].filter(Boolean),
            },
        ],
    };
}

/**
 * Tooltip styles
 */
export const tooltipStyles = `
.kalx-tooltip-wrapper {
    position: relative;
    display: inline-flex;
}

.kalx-tooltip-trigger {
    display: inline-flex;
}

.kalx-tooltip {
    position: absolute;
    z-index: 1000;
    max-width: 250px;
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
    color: white;
    background-color: var(--color-neutral-900);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
}

.kalx-tooltip--visible {
    opacity: 1;
}

/* Placement */
.kalx-tooltip--top {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-8px);
}

.kalx-tooltip--bottom {
    top: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(8px);
}

.kalx-tooltip--left {
    right: 100%;
    top: 50%;
    transform: translateY(-50%) translateX(-8px);
}

.kalx-tooltip--right {
    left: 100%;
    top: 50%;
    transform: translateY(-50%) translateX(8px);
}

/* Arrow */
.kalx-tooltip-arrow {
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: var(--color-neutral-900);
    transform: rotate(45deg);
}

.kalx-tooltip--top .kalx-tooltip-arrow {
    bottom: -4px;
    left: 50%;
    margin-left: -4px;
}

.kalx-tooltip--bottom .kalx-tooltip-arrow {
    top: -4px;
    left: 50%;
    margin-left: -4px;
}

.kalx-tooltip--left .kalx-tooltip-arrow {
    right: -4px;
    top: 50%;
    margin-top: -4px;
}

.kalx-tooltip--right .kalx-tooltip-arrow {
    left: -4px;
    top: 50%;
    margin-top: -4px;
}
`;

/**
 * Export tooltip component
 */
export default Tooltip;