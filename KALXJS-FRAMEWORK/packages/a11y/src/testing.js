/**
 * Accessibility Testing Utilities
 * Tools for testing accessibility in components
 *
 * @module @kalxjs/a11y/testing
 */

/**
 * Check if element has accessible name
 */
export function hasAccessibleName(element) {
    const name = getAccessibleName(element);
    return name && name.trim().length > 0;
}

/**
 * Get accessible name of element
 */
export function getAccessibleName(element) {
    if (!element) return '';

    // Check aria-label
    if (element.hasAttribute('aria-label')) {
        return element.getAttribute('aria-label');
    }

    // Check aria-labelledby
    if (element.hasAttribute('aria-labelledby')) {
        const ids = element.getAttribute('aria-labelledby').split(' ');
        return ids
            .map(id => {
                const el = document.getElementById(id);
                return el ? el.textContent : '';
            })
            .join(' ');
    }

    // Check label element
    if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) {
            return label.textContent;
        }
    }

    // Check title attribute
    if (element.hasAttribute('title')) {
        return element.getAttribute('title');
    }

    // Check alt attribute (for images)
    if (element.hasAttribute('alt')) {
        return element.getAttribute('alt');
    }

    // Check text content
    return element.textContent || '';
}

/**
 * Check if element is focusable
 */
export function isFocusable(element) {
    if (!element) return false;

    // Check if element is disabled
    if (element.disabled || element.hasAttribute('disabled')) {
        return false;
    }

    // Check tabindex
    const tabindex = element.getAttribute('tabindex');
    if (tabindex === '-1') {
        return false;
    }

    // Check if element is naturally focusable
    const focusableTags = ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'];
    if (focusableTags.includes(element.tagName)) {
        return true;
    }

    // Check if tabindex is set
    return tabindex !== null;
}

/**
 * Check if element has proper role
 */
export function hasRole(element, role) {
    return element && element.getAttribute('role') === role;
}

/**
 * Get all accessibility violations
 */
export function getA11yViolations(element) {
    const violations = [];

    // Check for missing labels on form controls
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
        if (!hasAccessibleName(element)) {
            violations.push({
                type: 'missing-label',
                message: 'Form control is missing an accessible label',
                element,
            });
        }
    }

    // Check for missing alt on images
    if (element.tagName === 'IMG' && !element.hasAttribute('alt')) {
        violations.push({
            type: 'missing-alt',
            message: 'Image is missing alt attribute',
            element,
        });
    }

    // Check for empty links
    if (element.tagName === 'A' && !hasAccessibleName(element)) {
        violations.push({
            type: 'empty-link',
            message: 'Link has no accessible name',
            element,
        });
    }

    // Check for empty buttons
    if (element.tagName === 'BUTTON' && !hasAccessibleName(element)) {
        violations.push({
            type: 'empty-button',
            message: 'Button has no accessible name',
            element,
        });
    }

    // Check for proper heading hierarchy
    if (element.tagName.match(/^H[1-6]$/)) {
        const level = parseInt(element.tagName[1]);
        const previousHeadings = Array.from(
            document.querySelectorAll('h1, h2, h3, h4, h5, h6')
        )
            .filter(h => h.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING)
            .map(h => parseInt(h.tagName[1]));

        const lastLevel = previousHeadings[previousHeadings.length - 1] || 0;
        if (level > lastLevel + 1) {
            violations.push({
                type: 'heading-hierarchy',
                message: `Heading skips from h${lastLevel} to h${level}`,
                element,
            });
        }
    }

    // Check ARIA attributes
    const ariaAttributes = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('aria-'));

    ariaAttributes.forEach(attr => {
        // Check for invalid ARIA values
        if (attr.name === 'aria-hidden' && attr.value !== 'true' && attr.value !== 'false') {
            violations.push({
                type: 'invalid-aria',
                message: `Invalid value for ${attr.name}: ${attr.value}`,
                element,
            });
        }
    });

    return violations;
}

/**
 * Run accessibility audit on container
 */
export function auditA11y(container = document.body) {
    const allViolations = [];
    const elements = container.querySelectorAll('*');

    elements.forEach(element => {
        const violations = getA11yViolations(element);
        allViolations.push(...violations);
    });

    return {
        violations: allViolations,
        passed: allViolations.length === 0,
        summary: {
            total: allViolations.length,
            byType: allViolations.reduce((acc, v) => {
                acc[v.type] = (acc[v.type] || 0) + 1;
                return acc;
            }, {}),
        },
    };
}

/**
 * Assert accessibility (for testing)
 */
export function assertAccessible(element) {
    const violations = getA11yViolations(element);

    if (violations.length > 0) {
        const message = violations
            .map(v => `${v.type}: ${v.message}`)
            .join('\n');
        throw new Error(`Accessibility violations found:\n${message}`);
    }
}

/**
 * Create accessibility test helpers
 */
export function createA11yTestHelpers() {
    return {
        hasLabel: (element) => hasAccessibleName(element),
        isFocusable: (element) => isFocusable(element),
        hasRole: (element, role) => hasRole(element, role),
        getViolations: (element) => getA11yViolations(element),
        audit: (container) => auditA11y(container),
        assert: (element) => assertAccessible(element),
    };
}

/**
 * Check color contrast (simplified)
 */
export function checkColorContrast(foreground, background) {
    // This is a simplified version
    // For production, use a library like color-contrast-checker

    function parseColor(color) {
        const el = document.createElement('div');
        el.style.color = color;
        document.body.appendChild(el);
        const computed = window.getComputedStyle(el).color;
        document.body.removeChild(el);

        const match = computed.match(/\d+/g);
        return match ? match.map(Number) : [0, 0, 0];
    }

    function getLuminance([r, g, b]) {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    const fg = parseColor(foreground);
    const bg = parseColor(background);

    const l1 = getLuminance(fg);
    const l2 = getLuminance(bg);

    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
        ratio,
        passAA: ratio >= 4.5,
        passAAA: ratio >= 7,
        passAALarge: ratio >= 3,
    };
}