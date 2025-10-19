/**
 * Platform Detection and Utilities
 * Detect and handle different platforms (iOS, Android, Windows, macOS, Linux, Web)
 */

/**
 * Platform information
 */
export const Platform = {
    /**
     * Current platform
     */
    OS: detectOS(),

    /**
     * Platform version
     */
    Version: detectVersion(),

    /**
     * Check if running on iOS
     */
    get isIOS() {
        return this.OS === 'ios';
    },

    /**
     * Check if running on Android
     */
    get isAndroid() {
        return this.OS === 'android';
    },

    /**
     * Check if running on Windows
     */
    get isWindows() {
        return this.OS === 'windows';
    },

    /**
     * Check if running on macOS
     */
    get isMacOS() {
        return this.OS === 'macos';
    },

    /**
     * Check if running on Linux
     */
    get isLinux() {
        return this.OS === 'linux';
    },

    /**
     * Check if running on Web
     */
    get isWeb() {
        return this.OS === 'web';
    },

    /**
     * Check if running on mobile
     */
    get isMobile() {
        return this.isIOS || this.isAndroid;
    },

    /**
     * Check if running on desktop
     */
    get isDesktop() {
        return this.isWindows || this.isMacOS || this.isLinux;
    },

    /**
     * Check if running in Electron
     */
    get isElectron() {
        return typeof process !== 'undefined' &&
            process.versions &&
            !!process.versions.electron;
    },

    /**
     * Check if running in Tauri
     */
    get isTauri() {
        return typeof window !== 'undefined' &&
            window.__TAURI__ !== undefined;
    },

    /**
     * Select value based on platform
     * @param {Object} config - Platform-specific values
     * @returns {any} Value for current platform
     */
    select(config) {
        if (this.isIOS && config.ios) return config.ios;
        if (this.isAndroid && config.android) return config.android;
        if (this.isWindows && config.windows) return config.windows;
        if (this.isMacOS && config.macos) return config.macos;
        if (this.isLinux && config.linux) return config.linux;
        if (this.isWeb && config.web) return config.web;
        return config.default;
    }
};

/**
 * Detect current operating system
 * @returns {string} OS name
 */
function detectOS() {
    if (typeof navigator === 'undefined') {
        // Node.js environment
        if (typeof process !== 'undefined') {
            const platform = process.platform;
            if (platform === 'darwin') return 'macos';
            if (platform === 'win32') return 'windows';
            if (platform === 'linux') return 'linux';
        }
        return 'unknown';
    }

    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // iOS detection
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return 'ios';
    }

    // Android detection
    if (/android/i.test(userAgent)) {
        return 'android';
    }

    // Windows detection
    if (/Win/i.test(userAgent)) {
        return 'windows';
    }

    // macOS detection
    if (/Mac/i.test(userAgent)) {
        return 'macos';
    }

    // Linux detection
    if (/Linux/i.test(userAgent)) {
        return 'linux';
    }

    return 'web';
}

/**
 * Detect platform version
 * @returns {string} Version string
 */
function detectVersion() {
    if (typeof navigator === 'undefined') {
        return typeof process !== 'undefined' ? process.version : 'unknown';
    }

    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(?:Version|OS|Android)[\s/](\d+[\d._]*)/);
    return match ? match[1] : 'unknown';
}

/**
 * Get platform-specific styles
 * @param {Object} styles - Platform-specific style objects
 * @returns {Object} Merged styles for current platform
 */
export function platformStyles(styles) {
    const baseStyles = styles.base || {};
    const platformSpecific = Platform.select({
        ios: styles.ios || {},
        android: styles.android || {},
        windows: styles.windows || {},
        macos: styles.macos || {},
        linux: styles.linux || {},
        web: styles.web || {},
        default: {}
    });

    return { ...baseStyles, ...platformSpecific };
}

/**
 * Execute platform-specific code
 * @param {Object} handlers - Platform-specific handlers
 */
export function platformExecute(handlers) {
    const handler = Platform.select({
        ios: handlers.ios,
        android: handlers.android,
        windows: handlers.windows,
        macos: handlers.macos,
        linux: handlers.linux,
        web: handlers.web,
        default: handlers.default || (() => { })
    });

    if (typeof handler === 'function') {
        return handler();
    }
}

export default Platform;