/**
 * KALXJS Progressive Web App (PWA) Module
 * Complete PWA features for modern web applications
 *
 * @module @kalxjs/pwa
 */

// Service Worker
export {
    registerServiceWorker,
    unregisterServiceWorker,
    getRegistration,
    isRegistered,
    checkForUpdates,
    skipWaiting,
    claimClients,
    messageServiceWorker,
    getCacheNames,
    clearCaches,
    getCacheSize,
} from './service-worker.js';

// Cache Strategies
export {
    cacheFirst,
    networkFirst,
    cacheOnly,
    networkOnly,
    staleWhileRevalidate,
    cacheWithUpdate,
    createCacheStrategy,
    CacheStrategyRouter,
} from './cache-strategies.js';

// Manifest
export {
    createManifest,
    generateManifest,
    injectManifest,
    createIcon,
    generateIconSizes,
    addMaskableIcon,
    setThemeColor,
    createIOSMetaTags,
    isRunningAsPWA,
    getDisplayMode,
    onDisplayModeChange,
    createRecommendedManifest,
} from './manifest.js';

// Push Notifications
export {
    requestNotificationPermission,
    getNotificationPermission,
    isNotificationSupported,
    subscribeToPush,
    getPushSubscription,
    unsubscribeFromPush,
    showNotification,
    showActionNotification,
    closeNotification,
    getNotifications,
    NotificationManager,
    NotificationScheduler,
} from './push-notifications.js';

// Background Sync
export {
    isBackgroundSyncSupported,
    registerBackgroundSync,
    getSyncTags,
    isPeriodicSyncSupported,
    registerPeriodicSync,
    unregisterPeriodicSync,
    getPeriodicSyncTags,
    SyncQueue,
    createSyncManager,
    setupAutoSync,
} from './background-sync.js';

// Offline Support
export {
    isOnline,
    isOffline,
    onNetworkChange,
    waitForOnline,
    createOfflineIndicator,
    OfflineStorage,
    createOfflineFetch,
    createNetworkMonitor,
} from './offline.js';

// Install Prompt
export {
    InstallPromptManager,
    createInstallButton,
    createInstallBanner,
    canInstall,
    getInstallSource,
} from './install-prompt.js';

/**
 * Setup PWA with default configuration
 */
export async function setupPWA(options = {}) {
    const {
        serviceWorker = '/sw.js',
        manifest,
        installPrompt = false,
        offlineIndicator = false,
        notifications = false,
        backgroundSync = false,
        onRegistered,
        onUpdated,
        onOffline,
        onOnline,
    } = options;

    const pwa = {
        registration: null,
        syncManager: null,
        notificationManager: null,
        installPrompt: null,
        offlineIndicator: null,
    };

    // Register service worker
    if (serviceWorker) {
        const { registerServiceWorker } = await import('./service-worker.js');

        pwa.registration = await registerServiceWorker(serviceWorker, {
            onRegistered,
            onUpdated,
            onOffline,
            onOnline,
        });
    }

    // Inject manifest
    if (manifest) {
        const { injectManifest } = await import('./manifest.js');
        injectManifest(manifest);
    }

    // Setup install prompt
    if (installPrompt && typeof document !== 'undefined') {
        const { createInstallBanner } = await import('./install-prompt.js');
        pwa.installPrompt = createInstallBanner(
            typeof installPrompt === 'object' ? installPrompt : {}
        );
        document.body.appendChild(pwa.installPrompt.element);
    }

    // Setup offline indicator
    if (offlineIndicator && typeof document !== 'undefined') {
        const { createOfflineIndicator } = await import('./offline.js');
        pwa.offlineIndicator = createOfflineIndicator(
            typeof offlineIndicator === 'object' ? offlineIndicator : {}
        );
    }

    // Setup background sync
    if (backgroundSync) {
        const { createSyncManager, setupAutoSync } = await import('./background-sync.js');
        pwa.syncManager = createSyncManager(
            typeof backgroundSync === 'object' ? backgroundSync : {}
        );
        setupAutoSync(pwa.syncManager);
    }

    // Setup notifications
    if (notifications && pwa.registration) {
        const { NotificationManager } = await import('./push-notifications.js');
        pwa.notificationManager = new NotificationManager(
            typeof notifications === 'object' ? notifications : {}
        );
        await pwa.notificationManager.init(pwa.registration);
    }

    return pwa;
}

/**
 * Install PWA plugin for KALXJS
 */
export function installPWA(app, options = {}) {
    // Store PWA instance globally
    let pwaInstance = null;

    // Setup PWA on mount
    if (typeof window !== 'undefined') {
        setupPWA(options).then((pwa) => {
            pwaInstance = pwa;
            app.config.globalProperties.$pwa = pwa;
        });
    }

    // Provide PWA utilities
    app.provide('pwa', pwaInstance);

    return {
        name: 'KalxjsPWA',
        version: '1.0.0',
    };
}

/**
 * PWA composable for KALXJS
 */
export function usePWA() {
    if (typeof window === 'undefined') {
        return null;
    }

    // In KALXJS, you would use inject here
    // For now, return a mock implementation
    return {
        isOnline: isOnline(),
        canInstall: canInstall(),
        isInstalled: isRunningAsPWA(),
    };
}

/**
 * Default export
 */
export default {
    setupPWA,
    install: installPWA,
};