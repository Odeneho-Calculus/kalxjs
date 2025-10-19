/**
 * Background Sync for PWA
 * Queue and sync data when online
 *
 * @module @kalxjs/pwa/background-sync
 */

/**
 * Check if Background Sync is supported
 */
export function isBackgroundSyncSupported() {
    return 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype;
}

/**
 * Register background sync
 */
export async function registerBackgroundSync(tag, registration = null) {
    if (!isBackgroundSyncSupported()) {
        console.warn('[PWA] Background Sync not supported');
        return false;
    }

    try {
        const reg = registration || await navigator.serviceWorker.ready;
        await reg.sync.register(tag);
        return true;
    } catch (error) {
        console.error('[PWA] Background Sync registration failed:', error);
        return false;
    }
}

/**
 * Get sync tags
 */
export async function getSyncTags(registration = null) {
    if (!isBackgroundSyncSupported()) {
        return [];
    }

    try {
        const reg = registration || await navigator.serviceWorker.ready;
        return await reg.sync.getTags();
    } catch (error) {
        console.error('[PWA] Failed to get sync tags:', error);
        return [];
    }
}

/**
 * Check if Periodic Background Sync is supported
 */
export function isPeriodicSyncSupported() {
    return 'serviceWorker' in navigator && 'periodicSync' in ServiceWorkerRegistration.prototype;
}

/**
 * Register periodic background sync
 */
export async function registerPeriodicSync(tag, options = {}, registration = null) {
    if (!isPeriodicSyncSupported()) {
        console.warn('[PWA] Periodic Background Sync not supported');
        return false;
    }

    const { minInterval = 24 * 60 * 60 * 1000 } = options; // 24 hours default

    try {
        const reg = registration || await navigator.serviceWorker.ready;
        await reg.periodicSync.register(tag, { minInterval });
        return true;
    } catch (error) {
        console.error('[PWA] Periodic sync registration failed:', error);
        return false;
    }
}

/**
 * Unregister periodic background sync
 */
export async function unregisterPeriodicSync(tag, registration = null) {
    if (!isPeriodicSyncSupported()) {
        return false;
    }

    try {
        const reg = registration || await navigator.serviceWorker.ready;
        await reg.periodicSync.unregister(tag);
        return true;
    } catch (error) {
        console.error('[PWA] Periodic sync unregistration failed:', error);
        return false;
    }
}

/**
 * Get periodic sync tags
 */
export async function getPeriodicSyncTags(registration = null) {
    if (!isPeriodicSyncSupported()) {
        return [];
    }

    try {
        const reg = registration || await navigator.serviceWorker.ready;
        return await reg.periodicSync.getTags();
    } catch (error) {
        console.error('[PWA] Failed to get periodic sync tags:', error);
        return [];
    }
}

/**
 * Sync Queue Manager
 * Manages offline requests for background sync
 */
export class SyncQueue {
    constructor(queueName = 'default-sync-queue') {
        this.queueName = queueName;
        this.storeName = `sync-queue-${queueName}`;
    }

    async add(request, options = {}) {
        const queue = await this.getQueue();

        const entry = {
            id: Date.now() + Math.random(),
            url: typeof request === 'string' ? request : request.url,
            method: request.method || 'GET',
            headers: this.serializeHeaders(request.headers),
            body: await this.serializeBody(request),
            timestamp: Date.now(),
            retries: 0,
            maxRetries: options.maxRetries || 3,
            ...options,
        };

        queue.push(entry);
        await this.saveQueue(queue);

        // Register background sync
        await registerBackgroundSync(this.queueName);

        return entry.id;
    }

    async remove(id) {
        const queue = await this.getQueue();
        const filtered = queue.filter(entry => entry.id !== id);
        await this.saveQueue(filtered);
    }

    async getQueue() {
        if (typeof localStorage === 'undefined') {
            return [];
        }

        const stored = localStorage.getItem(this.storeName);
        return stored ? JSON.parse(stored) : [];
    }

    async saveQueue(queue) {
        if (typeof localStorage === 'undefined') {
            return;
        }

        localStorage.setItem(this.storeName, JSON.stringify(queue));
    }

    async clear() {
        await this.saveQueue([]);
    }

    async size() {
        const queue = await this.getQueue();
        return queue.length;
    }

    serializeHeaders(headers) {
        if (!headers) return {};

        const serialized = {};

        if (headers instanceof Headers) {
            headers.forEach((value, key) => {
                serialized[key] = value;
            });
        } else {
            Object.assign(serialized, headers);
        }

        return serialized;
    }

    async serializeBody(request) {
        if (!request || !request.body) {
            return null;
        }

        try {
            if (typeof request.body === 'string') {
                return request.body;
            }

            const cloned = request.clone();
            const text = await cloned.text();
            return text;
        } catch (error) {
            console.error('[PWA] Failed to serialize body:', error);
            return null;
        }
    }

    async processQueue() {
        const queue = await this.getQueue();
        const processed = [];
        const failed = [];

        for (const entry of queue) {
            try {
                const response = await fetch(entry.url, {
                    method: entry.method,
                    headers: entry.headers,
                    body: entry.body,
                });

                if (response.ok) {
                    processed.push(entry.id);
                } else {
                    entry.retries++;

                    if (entry.retries >= entry.maxRetries) {
                        failed.push(entry.id);
                    }
                }
            } catch (error) {
                entry.retries++;

                if (entry.retries >= entry.maxRetries) {
                    failed.push(entry.id);
                }
            }
        }

        // Remove processed and failed entries
        const remaining = queue.filter(
            entry => !processed.includes(entry.id) && !failed.includes(entry.id)
        );

        await this.saveQueue(remaining);

        return {
            processed: processed.length,
            failed: failed.length,
            remaining: remaining.length,
        };
    }
}

/**
 * Create sync manager
 */
export function createSyncManager(options = {}) {
    const { queueName = 'default-sync-queue' } = options;
    const queue = new SyncQueue(queueName);

    return {
        queue,

        async add(request, options) {
            return queue.add(request, options);
        },

        async sync() {
            return queue.processQueue();
        },

        async getQueueSize() {
            return queue.size();
        },

        async clearQueue() {
            return queue.clear();
        },

        async registerSync() {
            return registerBackgroundSync(queueName);
        },

        async getSyncTags() {
            return getSyncTags();
        },
    };
}

/**
 * Auto-sync on online
 */
export function setupAutoSync(syncManager) {
    if (typeof window === 'undefined') {
        return () => { };
    }

    const handleOnline = async () => {
        const size = await syncManager.getQueueSize();

        if (size > 0) {
            await syncManager.sync();
        }
    };

    window.addEventListener('online', handleOnline);

    return () => {
        window.removeEventListener('online', handleOnline);
    };
}