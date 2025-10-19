/**
 * Offline Support for PWA
 * Detect and handle offline state
 *
 * @module @kalxjs/pwa/offline
 */

/**
 * Check if browser is online
 */
export function isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Check if browser is offline
 */
export function isOffline() {
    return !isOnline();
}

/**
 * Listen for online/offline events
 */
export function onNetworkChange(callback) {
    if (typeof window === 'undefined') {
        return () => { };
    }

    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}

/**
 * Wait for online connection
 */
export function waitForOnline(timeout = 0) {
    if (isOnline()) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const handleOnline = () => {
            cleanup();
            resolve();
        };

        const cleanup = onNetworkChange((online) => {
            if (online) {
                handleOnline();
            }
        });

        if (timeout > 0) {
            setTimeout(() => {
                cleanup();
                reject(new Error('Timeout waiting for online connection'));
            }, timeout);
        }
    });
}

/**
 * Offline indicator component
 */
export function createOfflineIndicator(options = {}) {
    if (typeof document === 'undefined') {
        return null;
    }

    const {
        message = 'You are offline',
        position = 'top',
        className = 'offline-indicator',
        style = {},
    } = options;

    const indicator = document.createElement('div');
    indicator.className = className;
    indicator.textContent = message;
    indicator.style.display = 'none';

    // Apply default styles
    Object.assign(indicator.style, {
        position: 'fixed',
        left: '0',
        right: '0',
        padding: '12px',
        backgroundColor: '#f44336',
        color: '#fff',
        textAlign: 'center',
        zIndex: '9999',
        transition: 'transform 0.3s ease',
        ...(position === 'top' ? { top: '0' } : { bottom: '0' }),
        ...style,
    });

    document.body.appendChild(indicator);

    // Show/hide based on network status
    const cleanup = onNetworkChange((online) => {
        if (online) {
            indicator.style.display = 'none';
        } else {
            indicator.style.display = 'block';
        }
    });

    // Initial state
    if (isOffline()) {
        indicator.style.display = 'block';
    }

    return {
        element: indicator,
        cleanup,
        show() {
            indicator.style.display = 'block';
        },
        hide() {
            indicator.style.display = 'none';
        },
        destroy() {
            cleanup();
            indicator.remove();
        },
    };
}

/**
 * Offline storage manager
 */
export class OfflineStorage {
    constructor(storeName = 'offline-data') {
        this.storeName = storeName;
    }

    async set(key, value) {
        if (typeof localStorage === 'undefined') {
            return false;
        }

        try {
            const data = await this.getAll();
            data[key] = {
                value,
                timestamp: Date.now(),
            };
            localStorage.setItem(this.storeName, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('[PWA] Failed to save offline data:', error);
            return false;
        }
    }

    async get(key) {
        if (typeof localStorage === 'undefined') {
            return null;
        }

        try {
            const data = await this.getAll();
            const entry = data[key];
            return entry ? entry.value : null;
        } catch (error) {
            console.error('[PWA] Failed to get offline data:', error);
            return null;
        }
    }

    async has(key) {
        const data = await this.getAll();
        return key in data;
    }

    async remove(key) {
        if (typeof localStorage === 'undefined') {
            return false;
        }

        try {
            const data = await this.getAll();
            delete data[key];
            localStorage.setItem(this.storeName, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('[PWA] Failed to remove offline data:', error);
            return false;
        }
    }

    async getAll() {
        if (typeof localStorage === 'undefined') {
            return {};
        }

        try {
            const stored = localStorage.getItem(this.storeName);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('[PWA] Failed to get all offline data:', error);
            return {};
        }
    }

    async clear() {
        if (typeof localStorage === 'undefined') {
            return false;
        }

        try {
            localStorage.removeItem(this.storeName);
            return true;
        } catch (error) {
            console.error('[PWA] Failed to clear offline data:', error);
            return false;
        }
    }

    async size() {
        const data = await this.getAll();
        return Object.keys(data).length;
    }
}

/**
 * Create offline-first fetch wrapper
 */
export function createOfflineFetch(options = {}) {
    const { timeout = 5000, retries = 3 } = options;

    return async function offlineFetch(url, fetchOptions = {}) {
        // Try network first
        if (isOnline()) {
            try {
                const response = await fetchWithTimeout(url, fetchOptions, timeout);

                if (response.ok) {
                    // Cache response
                    await cacheResponse(url, response.clone());
                    return response;
                }
            } catch (error) {
                console.warn('[PWA] Network request failed, trying cache:', error);
            }
        }

        // Fallback to cache
        const cached = await getCachedResponse(url);

        if (cached) {
            return cached;
        }

        throw new Error('No cached response available');
    };
}

/**
 * Fetch with timeout
 */
function fetchWithTimeout(url, options, timeout) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        ),
    ]);
}

/**
 * Cache response
 */
async function cacheResponse(url, response) {
    if (!('caches' in window)) {
        return;
    }

    try {
        const cache = await caches.open('offline-responses');
        await cache.put(url, response);
    } catch (error) {
        console.error('[PWA] Failed to cache response:', error);
    }
}

/**
 * Get cached response
 */
async function getCachedResponse(url) {
    if (!('caches' in window)) {
        return null;
    }

    try {
        return await caches.match(url);
    } catch (error) {
        console.error('[PWA] Failed to get cached response:', error);
        return null;
    }
}

/**
 * Create network status monitor
 */
export function createNetworkMonitor(options = {}) {
    const {
        onOnline,
        onOffline,
        checkInterval = 30000, // 30 seconds
        checkUrl = '/ping',
    } = options;

    let intervalId = null;
    let currentStatus = isOnline();

    const checkConnection = async () => {
        try {
            const response = await fetch(checkUrl, {
                method: 'HEAD',
                cache: 'no-cache',
            });

            const newStatus = response.ok;

            if (newStatus !== currentStatus) {
                currentStatus = newStatus;

                if (newStatus && onOnline) {
                    onOnline();
                } else if (!newStatus && onOffline) {
                    onOffline();
                }
            }
        } catch (error) {
            if (currentStatus) {
                currentStatus = false;
                if (onOffline) {
                    onOffline();
                }
            }
        }
    };

    const start = () => {
        if (intervalId) return;
        intervalId = setInterval(checkConnection, checkInterval);
        checkConnection(); // Initial check
    };

    const stop = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    return {
        start,
        stop,
        getStatus: () => currentStatus,
    };
}