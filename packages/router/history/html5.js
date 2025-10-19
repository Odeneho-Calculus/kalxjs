/**
 * HTML5 History API based history implementation
 */

/**
 * Creates a HTML5 history
 * @param {Object} options - History options
 * @returns {Object} History implementation
 */
export function createWebHistory(options = {}) {
    const { base = '' } = options;

    // Normalize base path
    const normalizedBase = base
        ? base.startsWith('/') ? base : `/${base}`
        : '';

    // Get the current path
    const getCurrentPath = () => {
        const path = window.location.pathname;
        const normalizedPath = normalizedBase
            ? path.replace(new RegExp(`^${normalizedBase}`), '') || '/'
            : path;

        const search = window.location.search;
        return `${normalizedPath}${search}`;
    };

    // Push a new path to the history
    const push = (path) => {
        const url = normalizedBase + (path.startsWith('/') ? path : `/${path}`);
        window.history.pushState({}, '', url);
        window.dispatchEvent(new Event('popstate'));
    };

    // Replace the current path
    const replace = (path) => {
        const url = normalizedBase + (path.startsWith('/') ? path : `/${path}`);
        window.history.replaceState({}, '', url);
        window.dispatchEvent(new Event('popstate'));
    };

    // Go back/forward in history
    const go = (delta) => {
        window.history.go(delta);
    };

    // Listen for changes
    const listen = (callback) => {
        const handlePopState = () => {
            const path = getCurrentPath();
            callback(path);
        };

        window.addEventListener('popstate', handlePopState);

        // Return cleanup function
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    };

    return {
        getCurrentPath,
        push,
        replace,
        go,
        listen
    };
}