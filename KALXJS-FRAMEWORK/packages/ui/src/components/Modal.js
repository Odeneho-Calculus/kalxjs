/**
 * Modal Component
 * Accessible modal dialog with focus trap
 *
 * @module @kalxjs/ui/components/Modal
 */

import { ref, watch, onMounted, onUnmounted, Teleport } from '@kalxjs/core';
import { createFocusTrap } from '@kalxjs/a11y';

/**
 * Modal component
 */
export function Modal(props, { slots, emit }) {
    const {
        modelValue = false,
        title = '',
        size = 'md',
        closeOnOverlay = true,
        closeOnEsc = true,
        showClose = true,
        persistent = false,
        fullscreen = false,
        centered = true,
        scrollable = true,
        ariaLabel = null,
        ariaDescribedBy = null,
    } = props;

    // Internal state
    const modalRef = ref(null);
    const focusTrap = ref(null);
    const previousActiveElement = ref(null);

    // Computed classes
    const modalClasses = computed(() => {
        const classes = ['kalx-modal'];
        if (size) classes.push(`kalx-modal--${size}`);
        if (fullscreen) classes.push('kalx-modal--fullscreen');
        if (centered) classes.push('kalx-modal--centered');
        if (scrollable) classes.push('kalx-modal--scrollable');
        return classes.join(' ');
    });

    // Event handlers
    const handleClose = () => {
        if (!persistent) {
            emit('update:modelValue', false);
            emit('close');
        }
    };

    const handleOverlayClick = (e) => {
        if (closeOnOverlay && e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleEscapeKey = (e) => {
        if (closeOnEsc && e.key === 'Escape') {
            handleClose();
        }
    };

    // Lifecycle
    watch(() => modelValue, (isOpen) => {
        if (isOpen) {
            // Save current active element
            previousActiveElement.value = document.activeElement;

            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Create focus trap
            if (modalRef.value) {
                focusTrap.value = createFocusTrap(modalRef.value);
                focusTrap.value.activate();
            }

            // Add escape key listener
            if (closeOnEsc) {
                document.addEventListener('keydown', handleEscapeKey);
            }

            emit('open');
        } else {
            // Restore body scroll
            document.body.style.overflow = '';

            // Deactivate focus trap
            if (focusTrap.value) {
                focusTrap.value.deactivate();
                focusTrap.value = null;
            }

            // Remove escape key listener
            document.removeEventListener('keydown', handleEscapeKey);

            // Restore focus
            if (previousActiveElement.value) {
                previousActiveElement.value.focus();
                previousActiveElement.value = null;
            }
        }
    }, { immediate: true });

    onUnmounted(() => {
        // Cleanup on unmount
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscapeKey);
        if (focusTrap.value) {
            focusTrap.value.deactivate();
        }
    });

    // Don't render if not open
    if (!modelValue) {
        return null;
    }

    // Render modal
    return {
        tag: Teleport,
        props: { to: 'body' },
        children: [
            {
                tag: 'div',
                props: { class: 'kalx-modal-overlay' },
                on: { click: handleOverlayClick },
                children: [
                    {
                        tag: 'div',
                        ref: modalRef,
                        props: {
                            class: modalClasses.value,
                            role: 'dialog',
                            'aria-modal': 'true',
                            'aria-label': ariaLabel || title,
                            'aria-describedby': ariaDescribedBy,
                        },
                        children: [
                            // Header
                            (title || slots.header || showClose) && {
                                tag: 'div',
                                props: { class: 'kalx-modal-header' },
                                children: [
                                    // Custom header or title
                                    slots.header?.() || {
                                        tag: 'h2',
                                        props: { class: 'kalx-modal-title' },
                                        children: [title],
                                    },

                                    // Close button
                                    showClose && {
                                        tag: 'button',
                                        props: {
                                            type: 'button',
                                            class: 'kalx-modal-close',
                                            'aria-label': 'Close modal',
                                        },
                                        on: { click: handleClose },
                                        children: ['×'],
                                    },
                                ].filter(Boolean),
                            },

                            // Body
                            {
                                tag: 'div',
                                props: { class: 'kalx-modal-body' },
                                children: [slots.default?.()],
                            },

                            // Footer
                            slots.footer && {
                                tag: 'div',
                                props: { class: 'kalx-modal-footer' },
                                children: [slots.footer()],
                            },
                        ].filter(Boolean),
                    },
                ],
            },
        ],
    };
}

/**
 * Modal styles
 */
export const modalStyles = `
.kalx-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: var(--spacing-4);
    background-color: var(--color-surface-overlay);
    overflow-y: auto;
    animation: kalx-fade-in 0.2s ease;
}

.kalx-modal-overlay--centered {
    align-items: center;
}

.kalx-modal {
    position: relative;
    width: 100%;
    background-color: var(--color-background-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-2xl);
    animation: kalx-scale-in 0.2s ease;
}

/* Sizes */
.kalx-modal--sm {
    max-width: 400px;
}

.kalx-modal--md {
    max-width: 600px;
}

.kalx-modal--lg {
    max-width: 800px;
}

.kalx-modal--xl {
    max-width: 1200px;
}

.kalx-modal--fullscreen {
    max-width: none;
    width: 100%;
    height: 100%;
    border-radius: 0;
}

.kalx-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-6);
    border-bottom: 1px solid var(--color-border-primary);
}

.kalx-modal-title {
    margin: 0;
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

.kalx-modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-3xl);
    line-height: 1;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
}

.kalx-modal-close:hover {
    background-color: var(--color-background-secondary);
    color: var(--color-text-primary);
}

.kalx-modal-close:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-primary);
}

.kalx-modal-body {
    padding: var(--spacing-6);
    color: var(--color-text-primary);
}

.kalx-modal--scrollable .kalx-modal-body {
    max-height: 60vh;
    overflow-y: auto;
}

.kalx-modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-3);
    padding: var(--spacing-6);
    border-top: 1px solid var(--color-border-primary);
}

/* Animations */
@keyframes kalx-fade-in {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes kalx-scale-in {
    from {
        transform: scale(0.95);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}
`;

/**
 * Export modal component
 */
export default Modal;