/**
 * Badge Component
 * Small status indicators and labels
 *
 * @module @kalxjs/ui/components/Badge
 */

/**
 * Badge component
 */
export function Badge(props, { slots }) {
    const {
        variant = 'default',
        size = 'md',
        dot = false,
        pill = false,
        outline = false,
        ...attrs
    } = props;

    // Get badge classes
    const classes = getBadgeClasses({ variant, size, dot, pill, outline });

    // Render badge
    return {
        tag: 'span',
        props: {
            class: classes,
            ...attrs,
        },
        children: [
            // Dot indicator
            dot && {
                tag: 'span',
                props: { class: 'kalx-badge-dot', 'aria-hidden': 'true' },
            },

            // Badge content
            !dot && slots.default?.(),
        ].filter(Boolean),
    };
}

/**
 * Get badge CSS classes
 */
function getBadgeClasses({ variant, size, dot, pill, outline }) {
    const baseClass = 'kalx-badge';
    const variantClass = `kalx-badge--${variant}`;
    const sizeClass = `kalx-badge--${size}`;
    const modifiers = [];

    if (dot) modifiers.push('kalx-badge--dot');
    if (pill) modifiers.push('kalx-badge--pill');
    if (outline) modifiers.push('kalx-badge--outline');

    return [baseClass, variantClass, sizeClass, ...modifiers].join(' ');
}

/**
 * Badge styles
 */
export const badgeStyles = `
.kalx-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-1);
    padding: var(--spacing-1) var(--spacing-2);
    font-size: var(--text-xs);
    font-weight: var(--font-weight-medium);
    line-height: 1;
    border-radius: var(--radius-sm);
    white-space: nowrap;
}

/* Variants */
.kalx-badge--default {
    background-color: var(--color-neutral-200);
    color: var(--color-neutral-700);
}

.kalx-badge--primary {
    background-color: var(--color-primary-500);
    color: white;
}

.kalx-badge--secondary {
    background-color: var(--color-secondary-500);
    color: white;
}

.kalx-badge--success {
    background-color: var(--color-success-500);
    color: white;
}

.kalx-badge--warning {
    background-color: var(--color-warning-500);
    color: white;
}

.kalx-badge--danger {
    background-color: var(--color-danger-500);
    color: white;
}

.kalx-badge--info {
    background-color: var(--color-info-500);
    color: white;
}

/* Outline variants */
.kalx-badge--outline {
    background-color: transparent;
    border: 1px solid currentColor;
}

.kalx-badge--outline.kalx-badge--default {
    color: var(--color-neutral-700);
}

.kalx-badge--outline.kalx-badge--primary {
    color: var(--color-primary-500);
}

.kalx-badge--outline.kalx-badge--secondary {
    color: var(--color-secondary-500);
}

.kalx-badge--outline.kalx-badge--success {
    color: var(--color-success-500);
}

.kalx-badge--outline.kalx-badge--warning {
    color: var(--color-warning-500);
}

.kalx-badge--outline.kalx-badge--danger {
    color: var(--color-danger-500);
}

.kalx-badge--outline.kalx-badge--info {
    color: var(--color-info-500);
}

/* Sizes */
.kalx-badge--sm {
    padding: 0 var(--spacing-1);
    font-size: 0.625rem;
}

.kalx-badge--md {
    padding: var(--spacing-1) var(--spacing-2);
    font-size: var(--text-xs);
}

.kalx-badge--lg {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--text-sm);
}

/* Pill shape */
.kalx-badge--pill {
    border-radius: var(--radius-full);
}

/* Dot variant */
.kalx-badge--dot {
    padding: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.kalx-badge--dot.kalx-badge--sm {
    width: 6px;
    height: 6px;
}

.kalx-badge--dot.kalx-badge--lg {
    width: 10px;
    height: 10px;
}

.kalx-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: currentColor;
}
`;

/**
 * Export badge component
 */
export default Badge;