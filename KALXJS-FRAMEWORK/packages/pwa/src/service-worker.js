/**
 * Service Worker Management
 * Registration and lifecycle management
 *
 * @module @kalxjs/pwa/service-worker
 */

/**
 * Register service worker
 */
export async function registerServiceWorker(path = '/sw.js', options = {}) {
    if (!('serviceWorker' in navigator)) {
        console.warn('[PWA] Service Worker not supported');
        return null;
    }

    const {
        scope = '/',
        updateViaCache = 'imports',
        onRegistered,
        onUpdated,
        onOffline,
        onOnline,
        onError,
    } = options;

    try {
        const registration = await navigator.serviceWorker.register(path, {
            scope,
            updateViaCache,
        });

        // Handle registration lifecycle
        setupLifecycleHandlers(registration, {
            onRegistered,
            onUpdated,
            onError,
        });

        // Handle online/offline events
        setupNetworkHandlers({ onOffline, onOnline });

        // Check for updates
        checkForUpdates(registration);

        if (onRegistered) {
            onRegistered(registration);
        }

        return registration;
    } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
        if (onError) {
            onError(error);
        }
        return null;
    }
}

/**
 * Setup lifecycle event handlers
 */
function setupLifecycleHandlers(registration, handlers) {
    const { onUpdated, onError } = handlers;

    // Listen for updates
    registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                if (onUpdated) {
                    onUpdated(registration, newWorker);
                }
            }
        });
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });

    // Listen for errors
    navigator.serviceWorker.addEventListener('error', (error) => {
        console.error('[PWA] Service Worker error:', error);
        if (onError) {
            onError(error);
        }
    });
}

/**
 * Setup network event handlers
 */
function setupNetworkHandlers(handlers) {
    const { onOffline, onOnline } = handlers;

    if (onOffline) {
        window.addEventListener('offline', () => {
            onOffline();
        });
    }

    if (onOnline) {
        window.addEventListener('online', () => {
            onOnline();
        });
    }
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates(registration) {
    if (!registration) return;

    try {
        await registration.update();
    } catch (error) {
        console.error('[PWA] Update check failed:', error);
    }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const success = await registration.unregister();
        return success;
    } catch (error) {
        console.error('[PWA] Service Worker unregistration failed:', error);
        return false;
    }
}

/**
 * Get service worker registration
 */
export async function getRegistration() {
    if (!('serviceWorker' in navigator)) {
        return null;
    }

    try {
        return await navigator.serviceWorker.ready;
    } catch (error) {
        return null;
    }
}

/**
 * Check if service worker is registered
 */
export async function isRegistered() {
    const registration = await getRegistration();
    return registration !== null;
}

/**
 * Skip waiting (activate new service worker immediately)
 */
export function skipWaiting(registration) {
    const waiting = registration.waiting;

    if (waiting) {
        waiting.postMessage({ type: 'SKIP_WAITING' });
    }
}

/**
 * Claim clients (take control immediately)
 */
export async function claimClients() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    const active = registration.active;

    if (active) {
        active.postMessage({ type: 'CLAIM_CLIENTS' });
    }
}

/**
 * Send message to service worker
 */
export async function messageServiceWorker(message) {
    if (!('serviceWorker' in navigator)) {
        return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const controller = navigator.serviceWorker.controller;

    if (!controller) {
        return null;
    }

    return new Promise((resolve) => {
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
            resolve(event.data);
        };

        controller.postMessage(message, [messageChannel.port2]);
    });
}

/**
 * Get cache names
 */
export async function getCacheNames() {
    if (!('caches' in window)) {
        return [];
    }

    return await caches.keys();
}

/**
 * Clear all caches
 */
export async function clearCaches() {
    if (!('caches' in window)) {
        return;
    }

    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
}

/**
 * Get cache size
 */
export async function getCacheSize() {
    if (!('caches' in window)) {
        return 0;
    }

    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();

        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }

    return totalSize;
}