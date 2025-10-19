/**
 * Push Notifications for PWA
 * Web Push API integration
 *
 * @module @kalxjs/pwa/push-notifications
 */

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('[PWA] Notifications not supported');
        return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
}

/**
 * Check notification permission
 */
export function getNotificationPermission() {
    if (!('Notification' in window)) {
        return 'denied';
    }

    return Notification.permission;
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported() {
    return 'Notification' in window;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(registration, vapidPublicKey) {
    if (!registration) {
        throw new Error('Service Worker registration required');
    }

    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
        throw new Error('Notification permission denied');
    }

    try {
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        return subscription;
    } catch (error) {
        console.error('[PWA] Push subscription failed:', error);
        throw error;
    }
}

/**
 * Get push subscription
 */
export async function getPushSubscription(registration) {
    if (!registration) {
        return null;
    }

    try {
        return await registration.pushManager.getSubscription();
    } catch (error) {
        console.error('[PWA] Failed to get push subscription:', error);
        return null;
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(registration) {
    const subscription = await getPushSubscription(registration);

    if (!subscription) {
        return false;
    }

    try {
        return await subscription.unsubscribe();
    } catch (error) {
        console.error('[PWA] Failed to unsubscribe:', error);
        return false;
    }
}

/**
 * Show notification
 */
export async function showNotification(title, options = {}) {
    const permission = getNotificationPermission();

    if (permission !== 'granted') {
        console.warn('[PWA] Notification permission not granted');
        return null;
    }

    const defaultOptions = {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [200, 100, 200],
        ...options,
    };

    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return registration.showNotification(title, defaultOptions);
    }

    return new Notification(title, defaultOptions);
}

/**
 * Create notification with actions
 */
export async function showActionNotification(title, options = {}) {
    const {
        body = '',
        icon = '/icon-192x192.png',
        badge = '/badge-72x72.png',
        actions = [],
        data = {},
        tag = '',
        requireInteraction = false,
    } = options;

    return showNotification(title, {
        body,
        icon,
        badge,
        actions,
        data,
        tag,
        requireInteraction,
    });
}

/**
 * Close notification by tag
 */
export async function closeNotification(tag) {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    const notifications = await registration.getNotifications({ tag });

    notifications.forEach(notification => notification.close());
}

/**
 * Get active notifications
 */
export async function getNotifications(options = {}) {
    if (!('serviceWorker' in navigator)) {
        return [];
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        return await registration.getNotifications(options);
    } catch (error) {
        console.error('[PWA] Failed to get notifications:', error);
        return [];
    }
}

/**
 * Convert VAPID key
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

/**
 * Create notification manager
 */
export class NotificationManager {
    constructor(options = {}) {
        this.defaultIcon = options.icon || '/icon-192x192.png';
        this.defaultBadge = options.badge || '/badge-72x72.png';
        this.vapidPublicKey = options.vapidPublicKey;
        this.registration = null;
    }

    async init(registration) {
        this.registration = registration;
        return this;
    }

    async requestPermission() {
        return requestNotificationPermission();
    }

    async subscribe() {
        if (!this.vapidPublicKey) {
            throw new Error('VAPID public key required');
        }

        return subscribeToPush(this.registration, this.vapidPublicKey);
    }

    async unsubscribe() {
        return unsubscribeFromPush(this.registration);
    }

    async getSubscription() {
        return getPushSubscription(this.registration);
    }

    async show(title, options = {}) {
        return showNotification(title, {
            icon: this.defaultIcon,
            badge: this.defaultBadge,
            ...options,
        });
    }

    async showWithActions(title, body, actions = []) {
        return showActionNotification(title, {
            body,
            icon: this.defaultIcon,
            badge: this.defaultBadge,
            actions,
        });
    }

    async close(tag) {
        return closeNotification(tag);
    }

    async getAll(options) {
        return getNotifications(options);
    }
}

/**
 * Create notification scheduler
 */
export class NotificationScheduler {
    constructor() {
        this.scheduled = new Map();
    }

    schedule(id, title, options = {}, delay = 0) {
        const timeoutId = setTimeout(() => {
            showNotification(title, options);
            this.scheduled.delete(id);
        }, delay);

        this.scheduled.set(id, timeoutId);
    }

    cancel(id) {
        const timeoutId = this.scheduled.get(id);

        if (timeoutId) {
            clearTimeout(timeoutId);
            this.scheduled.delete(id);
            return true;
        }

        return false;
    }

    cancelAll() {
        this.scheduled.forEach(timeoutId => clearTimeout(timeoutId));
        this.scheduled.clear();
    }
}