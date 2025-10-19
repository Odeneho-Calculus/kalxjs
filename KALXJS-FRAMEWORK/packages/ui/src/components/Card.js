/**
 * Card Component
 * Container component with elevation and padding
 *
 * @module @kalxjs/ui/components/Card
 */

/**
 * Card component
 */
export function Card(props, { slots }) {
    const {
        variant = 'elevated',
        padding = 'md',
        hoverable = false,
        clickable = false,
        bordered = false,
        onClick,
        ...attrs
    } = props;

    // Get card classes
    const classes = getCardClasses({ variant, padding, hoverable, clickable, bordered });

    // Determine tag
    const tag = clickable || onClick ? 'button' : 'div';

    // Render card
    return {
        tag,
        props: {
            class: classes,
            type: tag === 'button' ? 'button' : undefined,
            tabindex: clickable ? 0 : undefined,
            ...attrs,
        },
        on: onClick ? { click: onClick } : {},
        children: [
            // Header
            slots.header && {
                tag: 'div',
                props: { class: 'kalx-card-header' },
                children: [slots.header()],
            },

            // Image
            slots.image && {
                tag: 'div',
                props: { class: 'kalx-card-image' },
                children: [slots.image()],
            },

            // Body
            {
                tag: 'div',
                props: { class: 'kalx-card-body' },
                children: [slots.default?.()],
            },

            // Footer
            slots.footer && {
                tag: 'div',
                props: { class: 'kalx-card-footer' },
                children: [slots.footer()],
            },
        ].filter(Boolean),
    };
}

/**
 * Get card CSS classes
 */
function getCardClasses({ variant, padding, hoverable, clickable, bordered }) {
    const baseClass = 'kalx-card';
    const variantClass = `kalx-card--${variant}`;
    const paddingClass = `kalx-card--padding-${padding}`;
    const stateClasses = [];

    if (hoverable) stateClasses.push('kalx-card--hoverable');
    if (clickable) stateClasses.push('kalx-card--clickable');
    if (bordered) stateClasses.push('kalx-card--bordered');

    return [baseClass, variantClass, paddingClass, ...stateClasses].join(' ');
}

/**
 * Card styles
 */
export const cardStyles = `
.kalx-card {
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface-primary);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all 0.2s ease;
}

/* Variants */
.kalx-card--elevated {
    box-shadow: var(--shadow-md);
}

.kalx-card--flat {
    box-shadow: none;
}

.kalx-card--outlined {
    box-shadow: none;
    border: 1px solid var(--color-border-primary);
}

.kalx-card--bordered {
    border: 1px solid var(--color-border-primary);
}

/* Padding */
.kalx-card--padding-none .kalx-card-body {
    padding: 0;
}

.kalx-card--padding-sm .kalx-card-body {
    padding: var(--spacing-4);
}

.kalx-card--padding-md .kalx-card-body {
    padding: var(--spacing-6);
}

.kalx-card--padding-lg .kalx-card-body {
    padding: var(--spacing-8);
}

/* States */
.kalx-card--hoverable:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
}

.kalx-card--clickable {
    cursor: pointer;
    border: none;
    text-align: left;
    width: 100%;
}

.kalx-card--clickable:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring-primary);
}

.kalx-card--clickable:active {
    transform: scale(0.98);
}

/* Card sections */
.kalx-card-header {
    padding: var(--spacing-6);
    border-bottom: 1px solid var(--color-border-primary);
}

.kalx-card-image {
    width: 100%;
    overflow: hidden;
}

.kalx-card-image img {
    width: 100%;
    height: auto;
    display: block;
}

.kalx-card-body {
    flex: 1;
}

.kalx-card-footer {
    padding: var(--spacing-6);
    border-top: 1px solid var(--color-border-primary);
}
`;

/**
 * Export card component
 */
export default Card;