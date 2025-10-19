/**
 * Native API Bridge
 * Cross-platform APIs for native functionality
 */

import { Platform } from './platform.js';

/**
 * Device information API
 */
export const Device = {
    /**
     * Get device information
     * @returns {Object} Device info
     */
    getInfo() {
        return {
            platform: Platform.OS,
            version: Platform.Version,
            isPhysicalDevice: !this.isEmulator(),
            model: this.getModel(),
            manufacturer: this.getManufacturer()
        };
    },

    /**
     * Check if running on emulator/simulator
     * @returns {boolean}
     */
    isEmulator() {
        if (Platform.isWeb) return false;
        // Simplified detection - can be enhanced
        return false;
    },

    /**
     * Get device model
     * @returns {string}
     */
    getModel() {
        if (typeof navigator === 'undefined') return 'unknown';
        return navigator.platform || 'unknown';
    },

    /**
     * Get device manufacturer
     * @returns {string}
     */
    getManufacturer() {
        if (typeof navigator === 'undefined') return 'unknown';
        const userAgent = navigator.userAgent;
        if (/iPhone|iPad|iPod/.test(userAgent)) return 'Apple';
        if (/Android/.test(userAgent)) {
            const match = userAgent.match(/;\s*([^;)]+)\s+Build/);
            return match ? match[1] : 'Android';
        }
        return 'unknown';
    }
};

/**
 * Storage API - Async storage for data persistence
 */
export const Storage = {
    /**
     * Get item from storage
     * @param {string} key - Storage key
     * @returns {Promise<string|null>}
     */
    async getItem(key) {
        try {
            if (typeof localStorage !== 'undefined') {
                return localStorage.getItem(key);
            }
            return null;
        } catch (error) {
            console.error('Storage getItem error:', error);
            return null;
        }
    },

    /**
     * Set item in storage
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {Promise<void>}
     */
    async setItem(key, value) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, value);
            }
        } catch (error) {
            console.error('Storage setItem error:', error);
        }
    },

    /**
     * Remove item from storage
     * @param {string} key - Storage key
     * @returns {Promise<void>}
     */
    async removeItem(key) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.error('Storage removeItem error:', error);
        }
    },

    /**
     * Clear all storage
     * @returns {Promise<void>}
     */
    async clear() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.clear();
            }
        } catch (error) {
            console.error('Storage clear error:', error);
        }
    }
};

/**
 * Linking API - Open URLs and deep links
 */
export const Linking = {
    /**
     * Open URL
     * @param {string} url - URL to open
     * @returns {Promise<void>}
     */
    async openURL(url) {
        if (typeof window !== 'undefined') {
            window.open(url, '_blank');
        }
    },

    /**
     * Check if URL can be opened
     * @param {string} url - URL to check
     * @returns {Promise<boolean>}
     */
    async canOpenURL(url) {
        return typeof window !== 'undefined';
    },

    /**
     * Get initial URL (for deep linking)
     * @returns {Promise<string|null>}
     */
    async getInitialURL() {
        if (typeof window !== 'undefined') {
            return window.location.href;
        }
        return null;
    }
};

/**
 * Clipboard API
 */
export const Clipboard = {
    /**
     * Get clipboard content
     * @returns {Promise<string>}
     */
    async getString() {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            return await navigator.clipboard.readText();
        }
        return '';
    },

    /**
     * Set clipboard content
     * @param {string} content - Content to copy
     * @returns {Promise<void>}
     */
    async setString(content) {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(content);
        }
    }
};

/**
 * Vibration API
 */
export const Vibration = {
    /**
     * Trigger vibration
     * @param {number|Array} pattern - Duration or pattern in ms
     */
    vibrate(pattern = 400) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    },

    /**
     * Cancel vibration
     */
    cancel() {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(0);
        }
    }
};

/**
 * Dimensions API - Get screen dimensions
 */
export const Dimensions = {
    /**
     * Get window dimensions
     * @returns {Object} Width and height
     */
    get(type = 'window') {
        if (typeof window === 'undefined') {
            return { width: 0, height: 0 };
        }

        if (type === 'screen') {
            return {
                width: window.screen.width,
                height: window.screen.height,
                scale: window.devicePixelRatio || 1
            };
        }

        return {
            width: window.innerWidth,
            height: window.innerHeight,
            scale: window.devicePixelRatio || 1
        };
    },

    /**
     * Add change listener
     * @param {Function} handler - Change handler
     * @returns {Object} Subscription
     */
    addEventListener(type, handler) {
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', handler);
            return {
                remove() {
                    window.removeEventListener('resize', handler);
                }
            };
        }
        return { remove() { } };
    }
};

/**
 * Appearance API - Theme and appearance
 */
export const Appearance = {
    /**
     * Get color scheme
     * @returns {string} 'light', 'dark', or 'no-preference'
     */
    getColorScheme() {
        if (typeof window === 'undefined') return 'light';

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    },

    /**
     * Add change listener
     * @param {Function} handler - Change handler
     * @returns {Object} Subscription
     */
    addChangeListener(handler) {
        if (typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const listener = (e) => handler({ colorScheme: e.matches ? 'dark' : 'light' });
            mediaQuery.addEventListener('change', listener);

            return {
                remove() {
                    mediaQuery.removeEventListener('change', listener);
                }
            };
        }
        return { remove() { } };
    }
};

export default {
    Device,
    Storage,
    Linking,
    Clipboard,
    Vibration,
    Dimensions,
    Appearance
};