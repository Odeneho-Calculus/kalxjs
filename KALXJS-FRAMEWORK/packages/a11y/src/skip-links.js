/**
 * Skip Links Component
 * Skip navigation links for keyboard users
 *
 * @module @kalxjs/a11y/skip-links
 */

/**
 * Create skip link element
 */
export function createSkipLink(text, targetId, options = {}) {
    const {
        className = 'skip-link',
        position = 'top-left',
    } = options;

    const link = document.createElement('a');
    link.href = `#${targetId}`;
    link.className = className;
    link.textContent = text;
    link.setAttribute('data-position', position);

    // Apply default styles
    applySkipLinkStyles(link);

    // Handle click
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);

        if (target) {
            // Make target focusable if it's not
            if (!target.hasAttribute('tabindex')) {
                target.setAttribute('tabindex', '-1');
            }

            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    return link;
}

/**
 * Apply default skip link styles
 */
function applySkipLinkStyles(link) {
    // Hidden by default, visible on focus
    Object.assign(link.style, {
        position: 'absolute',
        left: '-9999px',
        zIndex: '9999',
        padding: '1rem',
        backgroundColor: '#000',
        color: '#fff',
        textDecoration: 'none',
        fontSize: '1rem',
        fontWeight: 'bold',
    });

    // Show on focus
    link.addEventListener('focus', () => {
        const position = link.getAttribute('data-position') || 'top-left';

        Object.assign(link.style, {
            left: position.includes('left') ? '0' : 'auto',
            right: position.includes('right') ? '0' : 'auto',
            top: position.includes('top') ? '0' : 'auto',
            bottom: position.includes('bottom') ? '0' : 'auto',
        });
    });

    link.addEventListener('blur', () => {
        link.style.left = '-9999px';
    });
}

/**
 * Create skip links container
 */
export function createSkipLinks(links = [], options = {}) {
    const {
        containerId = 'skip-links',
        className = 'skip-links-container',
    } = options;

    const container = document.createElement('nav');
    container.id = containerId;
    container.className = className;
    container.setAttribute('aria-label', 'Skip links');

    // Add links
    links.forEach(({ text, targetId, ...linkOptions }) => {
        const link = createSkipLink(text, targetId, linkOptions);
        container.appendChild(link);
    });

    return container;
}

/**
 * Install skip links at the beginning of body
 */
export function installSkipLinks(links, options) {
    const container = createSkipLinks(links, options);

    // Insert at the beginning of body
    if (document.body.firstChild) {
        document.body.insertBefore(container, document.body.firstChild);
    } else {
        document.body.appendChild(container);
    }

    return container;
}

/**
 * Common skip link configurations
 */
export const SkipLinkPresets = {
    /**
     * Standard skip links for typical web page
     */
    standard() {
        return [
            { text: 'Skip to main content', targetId: 'main' },
            { text: 'Skip to navigation', targetId: 'navigation' },
            { text: 'Skip to footer', targetId: 'footer' },
        ];
    },

    /**
     * Minimal skip link (just main content)
     */
    minimal() {
        return [
            { text: 'Skip to main content', targetId: 'main' },
        ];
    },

    /**
     * Extended skip links for complex pages
     */
    extended() {
        return [
            { text: 'Skip to main content', targetId: 'main' },
            { text: 'Skip to navigation', targetId: 'navigation' },
            { text: 'Skip to search', targetId: 'search' },
            { text: 'Skip to sidebar', targetId: 'sidebar' },
            { text: 'Skip to footer', targetId: 'footer' },
        ];
    },
};

/**
 * Create skip link for dynamic content
 */
export function createDynamicSkipLink(text, selector, options = {}) {
    const link = document.createElement('a');
    link.href = '#';
    link.className = options.className || 'skip-link';
    link.textContent = text;

    applySkipLinkStyles(link);

    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(selector);

        if (target) {
            if (!target.hasAttribute('tabindex')) {
                target.setAttribute('tabindex', '-1');
            }

            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    return link;
}

/**
 * Create skip link group for sections
 */
export function createSkipLinkGroup(sections, options = {}) {
    const {
        groupLabel = 'Skip to section',
        className = 'skip-link-group',
    } = options;

    const group = document.createElement('div');
    group.className = className;
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', groupLabel);

    sections.forEach(({ text, targetId, selector }) => {
        const link = targetId
            ? createSkipLink(text, targetId)
            : createDynamicSkipLink(text, selector);

        group.appendChild(link);
    });

    return group;
}