/**
 * Button Component
 * Accessible button with variants and sizes
 *
 * @module @kalxjs/ui/components/Button
 */

import { setAriaPressed, setAriaExpanded, setAriaLabel } from '@kalxjs/a11y';

/**
 * Button component
 */
export function Button(props, { slots }) {
    const {
        variant = 'primary',
        size = 'md',
        disabled = false,
        loading = false,
        fullWidth = false,
        icon = null,
        iconPosition = 'left',
        type = 'button',
        pressed = undefined,
        expanded = undefined,
        ariaLabel = null,
        onClick,
        ...attrs
    } = props;

    // Get button classes
    const classes = getButtonClasses({ variant, size, disabled, loading, fullWidth });

    // Render button
    return {
        tag: 'button',
        props: {
            type,
            class: classes,
            disabled: disabled || loading,
            'aria-disabled': disabled || loading,
            'aria-busy': loading,
            'aria-pressed': pressed,
            'aria-expanded': expanded,
            'aria-label': ariaLabel,
            ...attrs,
        },
        on: {
            click: (e) => {
                if (!disabled && !loading && onClick) {
                    onClick(e);
                }
            },
        },
        children: [
            // Loading spinner
            loading && createLoadingSpinner(size),

            // Icon before
            icon && iconPosition === 'left' && createIcon(icon, size),

            // Button content
            slots.default?.(),

            // Icon after
            icon && iconPosition === 'right' && createIcon(icon, size),
        ].filter(Boolean),
    };
}

/**
 * Get button CSS classes
 */
function getButtonClasses({ variant, size, disabled, loading, fullWidth }) {
    const baseClasses = 'kalx-button';
    const variantClass = `kalx-button--${variant}`;
    const sizeClass = `kalx-button--${size}`;
    const stateClasses = [];

    if (disabled) stateClasses.push('kalx-button--disabled');
    if (loading) stateClasses.push('kalx-button--loading');
    if (fullWidth) stateClasses.push('kalx-button--full-width');

    return [baseClasses, variantClass, sizeClass, ...stateClasses].join(' ');
}

/**
 * Create loading spinner
 */
function createLoadingSpinner(size) {
    return {
        tag: 'span',
        props: {
            class: `kalx-button__spinner kalx-button__spinner--${size}`,
            'aria-hidden': 'true',
        },
        children: [
            {
                tag: 'span',
                props: { class: 'kalx-spinner' },
            },
        ],
    };
}

/**
 * Create icon element
 */
function createIcon(icon, size) {
    return {
        tag: 'span',
        props: {
            class: `kalx-button__icon kalx-button__icon--${size}`,
            'aria-hidden': 'true',
        },
        children: [icon],
    };
}

/**
 * Button styles (CSS-in-JS or external CSS)
 */
export const buttonStyles = `
.kalx-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    font-family: var(--font-sans);
    font-weight: var(--font-weight-medium);
    line-height: var(--leading-none);
    text-align: center;
    text-decoration: none;
    white-space: nowrap;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
}

.kalx-button:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-primary);
}

/* Variants */
.kalx-button--primary {
    background-color: var(--color-primary-500);
    color: white;
}

.kalx-button--primary:hover:not(:disabled) {
    background-color: var(--color-primary-600);
}

.kalx-button--secondary {
    background-color: var(--color-secondary-500);
    color: white;
}

.kalx-button--secondary:hover:not(:disabled) {
    background-color: var(--color-secondary-600);
}

.kalx-button--success {
    background-color: var(--color-success-500);
    color: white;
}

.kalx-button--danger {
    background-color: var(--color-danger-500);
    color: white;
}

.kalx-button--outline {
    background-color: transparent;
    border-color: var(--color-border-primary);
    color: var(--color-text-primary);
}

.kalx-button--ghost {
    background-color: transparent;
    color: var(--color-text-primary);
}

.kalx-button--link {
    background-color: transparent;
    color: var(--color-primary-500);
    text-decoration: underline;
}

/* Sizes */
.kalx-button--xs {
    padding: var(--spacing-1) var(--spacing-2);
    font-size: var(--text-xs);
}

.kalx-button--sm {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--text-sm);
}

.kalx-button--md {
    padding: var(--spacing-3) var(--spacing-4);
    font-size: var(--text-base);
}

.kalx-button--lg {
    padding: var(--spacing-4) var(--spacing-6);
    font-size: var(--text-lg);
}

.kalx-button--xl {
    padding: var(--spacing-5) var(--spacing-8);
    font-size: var(--text-xl);
}

/* States */
.kalx-button--disabled,
.kalx-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.kalx-button--loading {
    position: relative;
    color: transparent;
    pointer-events: none;
}

.kalx-button--full-width {
    width: 100%;
}

/* Spinner */
.kalx-button__spinner {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

.kalx-spinner {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
`;

/**
 * Export button component
 */
export default Button;