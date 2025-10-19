/**
 * Hash-based history implementation
 */

/**
 * Creates a hash history
 * @param {Object} options - History options
 * @returns {Object} History implementation
 */
export function createWebHashHistory(options = {}) {
    const { hashPrefix = '#' } = options;

    // Get the current path from the hash
    const getCurrentPath = () => {
        const hash = window.location.hash;
        const path = hash.replace(new RegExp(`^${hashPrefix}/?`), '/');
        return path || '/';
    };

    // Push a new path to the history
    const push = (path) => {
        const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
        window.location.hash = `${hashPrefix}/${normalizedPath}`;
    };

    // Replace the current path
    const replace = (path) => {
        const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
        window.location.replace(`${window.location.pathname}${window.location.search}#${hashPrefix}/${normalizedPath}`);
    };

    // Go back/forward in history
    const go = (delta) => {
        window.history.go(delta);
    };

    // Listen for changes
    const listen = (callback) => {
        const handleHashChange = () => {
            const path = getCurrentPath();
            callback(path);
        };

        window.addEventListener('hashchange', handleHashChange);

        // Return cleanup function
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
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