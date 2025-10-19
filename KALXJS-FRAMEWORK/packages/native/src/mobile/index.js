/**
 * Mobile-specific APIs
 * Additional APIs for mobile platforms (iOS, Android)
 */

import { Platform } from '../platform.js';

/**
 * Camera API
 */
export const Camera = {
    /**
     * Check if camera is available
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
            return false;
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some(device => device.kind === 'videoinput');
        } catch {
            return false;
        }
    },

    /**
     * Request camera access
     * @param {Object} options - Camera options
     * @returns {Promise<MediaStream>}
     */
    async requestAccess(options = {}) {
        const {
            facingMode = 'user', // 'user' or 'environment'
            video = true,
            audio = false
        } = options;

        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
            throw new Error('Camera not available');
        }

        return await navigator.mediaDevices.getUserMedia({
            video: video ? { facingMode } : false,
            audio
        });
    },

    /**
     * Take photo
     * @param {MediaStream} stream - Camera stream
     * @returns {Promise<string>} Base64 image data
     */
    async takePhoto(stream) {
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        return canvas.toDataURL('image/jpeg');
    }
};

/**
 * Geolocation API
 */
export const Geolocation = {
    /**
     * Get current position
     * @param {Object} options - Position options
     * @returns {Promise<Object>} Position
     */
    async getCurrentPosition(options = {}) {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            throw new Error('Geolocation not available');
        }

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve({
                    coords: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        altitude: position.coords.altitude,
                        accuracy: position.coords.accuracy,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed
                    },
                    timestamp: position.timestamp
                }),
                reject,
                options
            );
        });
    },

    /**
     * Watch position changes
     * @param {Function} callback - Position callback
     * @param {Object} options - Watch options
     * @returns {number} Watch ID
     */
    watchPosition(callback, options = {}) {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            return -1;
        }

        return navigator.geolocation.watchPosition(
            (position) => callback({
                coords: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    altitude: position.coords.altitude,
                    accuracy: position.coords.accuracy,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed
                },
                timestamp: position.timestamp
            }),
            (error) => console.error('Geolocation error:', error),
            options
        );
    },

    /**
     * Clear position watch
     * @param {number} watchId - Watch ID
     */
    clearWatch(watchId) {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.clearWatch(watchId);
        }
    }
};

/**
 * StatusBar API (mobile-specific)
 */
export const StatusBar = {
    /**
     * Set status bar color
     * @param {string} color - Color value
     */
    setBackgroundColor(color) {
        if (!Platform.isMobile) return;

        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', color);
        } else {
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = color;
            document.head.appendChild(meta);
        }
    },

    /**
     * Set status bar style
     * @param {string} style - 'light-content' or 'dark-content'
     */
    setStyle(style) {
        if (!Platform.isMobile) return;

        const meta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        const content = style === 'light-content' ? 'black-translucent' : 'default';

        if (meta) {
            meta.setAttribute('content', content);
        } else {
            const newMeta = document.createElement('meta');
            newMeta.name = 'apple-mobile-web-app-status-bar-style';
            newMeta.content = content;
            document.head.appendChild(newMeta);
        }
    },

    /**
     * Hide status bar
     */
    hide() {
        // Implemented via CSS
        if (typeof document !== 'undefined') {
            document.body.classList.add('status-bar-hidden');
        }
    },

    /**
     * Show status bar
     */
    show() {
        if (typeof document !== 'undefined') {
            document.body.classList.remove('status-bar-hidden');
        }
    }
};

/**
 * Share API
 */
export const Share = {
    /**
     * Share content
     * @param {Object} options - Share options
     * @returns {Promise<void>}
     */
    async share(options) {
        const { title, text, url, files } = options;

        if (typeof navigator === 'undefined' || !navigator.share) {
            throw new Error('Share API not available');
        }

        const shareData = {};
        if (title) shareData.title = title;
        if (text) shareData.text = text;
        if (url) shareData.url = url;
        if (files) shareData.files = files;

        return await navigator.share(shareData);
    },

    /**
     * Check if sharing is available
     * @returns {boolean}
     */
    isAvailable() {
        return typeof navigator !== 'undefined' && !!navigator.share;
    }
};

/**
 * Permissions API
 */
export const Permissions = {
    /**
     * Check permission
     * @param {string} name - Permission name
     * @returns {Promise<string>} Permission status
     */
    async check(name) {
        if (typeof navigator === 'undefined' || !navigator.permissions) {
            return 'denied';
        }

        try {
            const result = await navigator.permissions.query({ name });
            return result.state;
        } catch {
            return 'denied';
        }
    },

    /**
     * Request permission
     * @param {string} name - Permission name
     * @returns {Promise<string>} Permission status
     */
    async request(name) {
        // Permission requests are typically done via API usage
        return await this.check(name);
    }
};

export default {
    Camera,
    Geolocation,
    StatusBar,
    Share,
    Permissions
};