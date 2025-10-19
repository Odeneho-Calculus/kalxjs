/**
 * Alert Component
 * Feedback messages with variants
 *
 * @module @kalxjs/ui/components/Alert
 */

import { ref } from '@kalxjs/core';

/**
 * Alert component
 */
export function Alert(props, { slots, emit }) {
    const {
        variant = 'info',
        title = '',
        closable = false,
        icon = true,
        ...attrs
    } = props;

    // Internal state
    const isVisible = ref(true);

    // Event handlers
    const handleClose = () => {
        isVisible.value = false;
        emit('close');
    };

    // Don't render if closed
    if (!isVisible.value) {
        return null;
    }

    // Get alert classes
    const classes = getAlertClasses({ variant });

    // Get icon for variant
    const alertIcon = icon ? getAlertIcon(variant) : null;

    // Render alert
    return {
        tag: 'div',
        props: {
            class: classes,
            role: variant === 'danger' || variant === 'warning' ? 'alert' : 'status',
            'aria-live': 'polite',
            ...attrs,
        },
        children: [
            // Icon
            alertIcon && {
                tag: 'div',
                props: { class: 'kalx-alert-icon', 'aria-hidden': 'true' },
                children: [alertIcon],
            },

            // Content
            {
                tag: 'div',
                props: { class: 'kalx-alert-content' },
                children: [
                    // Title
                    title && {
                        tag: 'div',
                        props: { class: 'kalx-alert-title' },
                        children: [title],
                    },

                    // Body
                    {
                        tag: 'div',
                        props: { class: 'kalx-alert-body' },
                        children: [slots.default?.()],
                    },
                ].filter(Boolean),
            },

            // Close button
            closable && {
                tag: 'button',
                props: {
                    type: 'button',
                    class: 'kalx-alert-close',
                    'aria-label': 'Close alert',
                },
                on: { click: handleClose },
                children: ['×'],
            },
        ].filter(Boolean),
    };
}

/**
 * Get alert CSS classes
 */
function getAlertClasses({ variant }) {
    return ['kalx-alert', `kalx-alert--${variant}`].join(' ');
}

/**
 * Get icon for alert variant
 */
function getAlertIcon(variant) {
    const icons = {
        success: '✓',
        info: 'ℹ',
        warning: '⚠',
        danger: '✕',
    };
    return icons[variant] || icons.info;
}

/**
 * Alert styles
 */
export const alertStyles = `
.kalx-alert {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
    border-left: 4px solid;
    font-size: var(--text-sm);
}

/* Variants */
.kalx-alert--success {
    background-color: rgba(34, 197, 94, 0.1);
    border-color: var(--color-success-500);
    color: var(--color-success-700);
}

.kalx-alert--info {
    background-color: rgba(59, 130, 246, 0.1);
    border-color: var(--color-info-500);
    color: var(--color-info-700);
}

.kalx-alert--warning {
    background-color: rgba(245, 158, 11, 0.1);
    border-color: var(--color-warning-500);
    color: var(--color-warning-700);
}

.kalx-alert--danger {
    background-color: rgba(239, 68, 68, 0.1);
    border-color: var(--color-danger-500);
    color: var(--color-danger-700);
}

.kalx-alert-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
}

.kalx-alert-content {
    flex: 1;
}

.kalx-alert-title {
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-1);
}

.kalx-alert-body {
    line-height: var(--leading-relaxed);
}

.kalx-alert-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    font-size: var(--text-xl);
    line-height: 1;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s ease;
}

.kalx-alert-close:hover {
    opacity: 1;
}

.kalx-alert-close:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-primary);
}
`;

/**
 * Export alert component
 */
export default Alert;