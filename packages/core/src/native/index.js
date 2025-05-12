// @kalxjs/core - Native mobile bridge

/**
 * Native platform types
 */
export const NATIVE_PLATFORMS = {
    IOS: 'ios',
    ANDROID: 'android',
    WEB: 'web'
};

/**
 * Native feature capabilities
 */
export const NATIVE_FEATURES = {
    CAMERA: 'camera',
    LOCATION: 'location',
    NOTIFICATIONS: 'notifications',
    STORAGE: 'storage',
    BIOMETRICS: 'biometrics',
    CONTACTS: 'contacts',
    CALENDAR: 'calendar',
    ACCELEROMETER: 'accelerometer',
    GYROSCOPE: 'gyroscope',
    BLUETOOTH: 'bluetooth',
    NFC: 'nfc',
    HAPTICS: 'haptics',
    SHARE: 'share',
    NETWORK: 'network',
    BATTERY: 'battery',
    DEVICE_INFO: 'deviceInfo',
    APP_INFO: 'appInfo',
    FILE_SYSTEM: 'fileSystem',
    MEDIA: 'media',
    SPEECH: 'speech',
    BARCODE: 'barcode',
    AR: 'ar',
    HEALTH_KIT: 'healthKit',
    GOOGLE_FIT: 'googleFit'
};

/**
 * Detects the current native platform
 * @returns {string} Platform type
 */
function detectPlatform() {
    if (typeof window === 'undefined') {
        return NATIVE_PLATFORMS.WEB;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
        return NATIVE_PLATFORMS.IOS;
    } else if (/android/.test(userAgent)) {
        return NATIVE_PLATFORMS.ANDROID;
    }

    return NATIVE_PLATFORMS.WEB;
}

/**
 * Creates a native bridge for KalxJS
 * @param {Object} options - Native bridge options
 * @returns {Object} Native bridge
 */
export function createNativeBridge(options = {}) {
    const {
        debug = false,
        mockMode = false,
        mockImplementations = {},
        customBridge = null
    } = options;

    // Detect platform
    const platform = options.platform || detectPlatform();

    // Available features
    const availableFeatures = new Set();

    // Native bridge implementations
    const nativeBridgeImpl = customBridge || {};

    // Mock implementations for testing
    const mockImpl = {
        ...mockImplementations
    };

    /**
     * Logs debug information if debug mode is enabled
     * @param {string} message - Debug message
     * @param {any} data - Additional data to log
     */
    const logDebug = (message, data) => {
        if (debug) {
            console.log(`[KalxJS Native] ${message}`, data);
        }
    };

    /**
     * Checks if a feature is available
     * @param {string} feature - Feature to check
     * @returns {boolean} Whether the feature is available
     */
    const isFeatureAvailable = (feature) => {
        return availableFeatures.has(feature);
    };

    /**
     * Calls a native method
     * @param {string} feature - Feature to use
     * @param {string} method - Method to call
     * @param {any} params - Method parameters
     * @returns {Promise} Method promise
     */
    const callNative = async (feature, method, params = {}) => {
        if (!isFeatureAvailable(feature)) {
            throw new Error(`Native feature not available: ${feature}`);
        }

        logDebug(`Calling native method: ${feature}.${method}`, params);

        // Use mock implementation in mock mode
        if (mockMode && mockImpl[feature] && mockImpl[feature][method]) {
            logDebug(`Using mock implementation for ${feature}.${method}`);
            return mockImpl[feature][method](params);
        }

        // Use custom bridge implementation
        if (nativeBridgeImpl[feature] && nativeBridgeImpl[feature][method]) {
            return nativeBridgeImpl[feature][method](params);
        }

        // Use platform-specific implementation
        switch (platform) {
            case NATIVE_PLATFORMS.IOS:
                return callIOS(feature, method, params);

            case NATIVE_PLATFORMS.ANDROID:
                return callAndroid(feature, method, params);

            default:
                throw new Error(`Unsupported platform for native feature: ${platform}`);
        }
    };

    /**
     * Calls an iOS native method
     * @param {string} feature - Feature to use
     * @param {string} method - Method to call
     * @param {any} params - Method parameters
     * @returns {Promise} Method promise
     */
    const callIOS = async (feature, method, params) => {
        // Check if webkit message handlers are available
        if (window.webkit && window.webkit.messageHandlers) {
            const handler = window.webkit.messageHandlers[feature];

            if (handler && typeof handler.postMessage === 'function') {
                return new Promise((resolve, reject) => {
                    // Create a unique callback ID
                    const callbackId = `${feature}_${method}_${Date.now()}`;

                    // Register callback
                    window[`${callbackId}_success`] = (result) => {
                        resolve(result);
                        delete window[`${callbackId}_success`];
                        delete window[`${callbackId}_error`];
                    };

                    window[`${callbackId}_error`] = (error) => {
                        reject(new Error(error));
                        delete window[`${callbackId}_success`];
                        delete window[`${callbackId}_error`];
                    };

                    // Call native method
                    handler.postMessage({
                        method,
                        params,
                        callbackId
                    });
                });
            }
        }

        throw new Error(`iOS native method not available: ${feature}.${method}`);
    };

    /**
     * Calls an Android native method
     * @param {string} feature - Feature to use
     * @param {string} method - Method to call
     * @param {any} params - Method parameters
     * @returns {Promise} Method promise
     */
    const callAndroid = async (feature, method, params) => {
        // Check if Android interface is available
        if (window.KalxJSNative) {
            const androidInterface = window.KalxJSNative[feature];

            if (androidInterface && typeof androidInterface[method] === 'function') {
                return new Promise((resolve, reject) => {
                    try {
                        // Android interface methods are synchronous
                        const result = androidInterface[method](JSON.stringify(params));
                        resolve(JSON.parse(result));
                    } catch (error) {
                        reject(new Error(error.toString()));
                    }
                });
            }
        }

        throw new Error(`Android native method not available: ${feature}.${method}`);
    };

    /**
     * Initializes the native bridge
     * @returns {Promise} Initialization promise
     */
    const initialize = async () => {
        logDebug('Initializing native bridge', { platform });

        // In mock mode, all features are available
        if (mockMode) {
            Object.keys(NATIVE_FEATURES).forEach(key => {
                availableFeatures.add(NATIVE_FEATURES[key]);
            });

            logDebug('Mock mode enabled, all features available');
            return;
        }

        // Check available features
        try {
            switch (platform) {
                case NATIVE_PLATFORMS.IOS:
                    if (window.webkit && window.webkit.messageHandlers) {
                        for (const feature of Object.values(NATIVE_FEATURES)) {
                            if (window.webkit.messageHandlers[feature]) {
                                availableFeatures.add(feature);
                            }
                        }
                    }
                    break;

                case NATIVE_PLATFORMS.ANDROID:
                    if (window.KalxJSNative) {
                        for (const feature of Object.values(NATIVE_FEATURES)) {
                            if (window.KalxJSNative[feature]) {
                                availableFeatures.add(feature);
                            }
                        }
                    }
                    break;
            }

            logDebug('Available native features', Array.from(availableFeatures));
        } catch (error) {
            logDebug('Error initializing native bridge', error);
        }
    };

    // Initialize the bridge
    initialize();

    // Create feature-specific APIs
    const camera = {
        takePicture: async (options = {}) => {
            return callNative(NATIVE_FEATURES.CAMERA, 'takePicture', options);
        },

        startVideoRecording: async (options = {}) => {
            return callNative(NATIVE_FEATURES.CAMERA, 'startVideoRecording', options);
        },

        stopVideoRecording: async () => {
            return callNative(NATIVE_FEATURES.CAMERA, 'stopVideoRecording');
        },

        getPhotos: async (options = {}) => {
            return callNative(NATIVE_FEATURES.CAMERA, 'getPhotos', options);
        }
    };

    const location = {
        getCurrentPosition: async (options = {}) => {
            return callNative(NATIVE_FEATURES.LOCATION, 'getCurrentPosition', options);
        },

        watchPosition: async (options = {}) => {
            return callNative(NATIVE_FEATURES.LOCATION, 'watchPosition', options);
        },

        clearWatch: async (watchId) => {
            return callNative(NATIVE_FEATURES.LOCATION, 'clearWatch', { watchId });
        },

        getAddressFromCoordinates: async (coords) => {
            return callNative(NATIVE_FEATURES.LOCATION, 'getAddressFromCoordinates', coords);
        }
    };

    const notifications = {
        requestPermission: async () => {
            return callNative(NATIVE_FEATURES.NOTIFICATIONS, 'requestPermission');
        },

        scheduleLocalNotification: async (notification) => {
            return callNative(NATIVE_FEATURES.NOTIFICATIONS, 'scheduleLocalNotification', notification);
        },

        cancelLocalNotification: async (id) => {
            return callNative(NATIVE_FEATURES.NOTIFICATIONS, 'cancelLocalNotification', { id });
        },

        cancelAllLocalNotifications: async () => {
            return callNative(NATIVE_FEATURES.NOTIFICATIONS, 'cancelAllLocalNotifications');
        },

        getScheduledLocalNotifications: async () => {
            return callNative(NATIVE_FEATURES.NOTIFICATIONS, 'getScheduledLocalNotifications');
        },

        registerForPushNotifications: async () => {
            return callNative(NATIVE_FEATURES.NOTIFICATIONS, 'registerForPushNotifications');
        }
    };

    const storage = {
        setItem: async (key, value) => {
            return callNative(NATIVE_FEATURES.STORAGE, 'setItem', { key, value });
        },

        getItem: async (key) => {
            return callNative(NATIVE_FEATURES.STORAGE, 'getItem', { key });
        },

        removeItem: async (key) => {
            return callNative(NATIVE_FEATURES.STORAGE, 'removeItem', { key });
        },

        clear: async () => {
            return callNative(NATIVE_FEATURES.STORAGE, 'clear');
        },

        getAllKeys: async () => {
            return callNative(NATIVE_FEATURES.STORAGE, 'getAllKeys');
        }
    };

    const biometrics = {
        isFaceIDAvailable: async () => {
            return callNative(NATIVE_FEATURES.BIOMETRICS, 'isFaceIDAvailable');
        },

        isTouchIDAvailable: async () => {
            return callNative(NATIVE_FEATURES.BIOMETRICS, 'isTouchIDAvailable');
        },

        authenticate: async (options = {}) => {
            return callNative(NATIVE_FEATURES.BIOMETRICS, 'authenticate', options);
        }
    };

    const share = {
        shareText: async (text, options = {}) => {
            return callNative(NATIVE_FEATURES.SHARE, 'shareText', { text, ...options });
        },

        shareImage: async (imageUrl, options = {}) => {
            return callNative(NATIVE_FEATURES.SHARE, 'shareImage', { imageUrl, ...options });
        },

        shareUrl: async (url, options = {}) => {
            return callNative(NATIVE_FEATURES.SHARE, 'shareUrl', { url, ...options });
        },

        shareFiles: async (files, options = {}) => {
            return callNative(NATIVE_FEATURES.SHARE, 'shareFiles', { files, ...options });
        }
    };

    const deviceInfo = {
        getDeviceInfo: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getDeviceInfo');
        },

        getUniqueId: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getUniqueId');
        },

        getBatteryLevel: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getBatteryLevel');
        },

        isEmulator: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'isEmulator');
        },

        getIPAddress: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getIPAddress');
        },

        getMACAddress: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getMACAddress');
        },

        getCarrier: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getCarrier');
        },

        getTotalMemory: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getTotalMemory');
        },

        getUsedMemory: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getUsedMemory');
        },

        getTotalDiskCapacity: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getTotalDiskCapacity');
        },

        getFreeDiskStorage: async () => {
            return callNative(NATIVE_FEATURES.DEVICE_INFO, 'getFreeDiskStorage');
        }
    };

    const haptics = {
        vibrate: async (pattern = []) => {
            return callNative(NATIVE_FEATURES.HAPTICS, 'vibrate', { pattern });
        },

        impact: async (style = 'medium') => {
            return callNative(NATIVE_FEATURES.HAPTICS, 'impact', { style });
        },

        notification: async (type = 'success') => {
            return callNative(NATIVE_FEATURES.HAPTICS, 'notification', { type });
        },

        selection: async () => {
            return callNative(NATIVE_FEATURES.HAPTICS, 'selection');
        }
    };

    return {
        platform,
        isFeatureAvailable,
        callNative,
        initialize,

        // Feature-specific APIs
        camera,
        location,
        notifications,
        storage,
        biometrics,
        share,
        deviceInfo,
        haptics
    };
}

/**
 * Creates a composable for using native features in components
 * @param {string} feature - Native feature to use
 * @param {Object} options - Options for the feature
 * @returns {Object} Native feature composable
 */
export function useNative(feature, options = {}) {
    const instance = getCurrentInstance();

    if (!instance) {
        console.warn('[KalxJS Native] useNative() must be called within setup()');
        return null;
    }

    const nativeBridge = instance.appContext.config.globalProperties.$native ||
        window.$kalxjs?.native;

    if (!nativeBridge) {
        console.warn('[KalxJS Native] Native bridge not found. Make sure to use the Native plugin.');
        return null;
    }

    if (!nativeBridge.isFeatureAvailable(feature)) {
        console.warn(`[KalxJS Native] Native feature not available: ${feature}`);
        return null;
    }

    // Create reactive state
    const isAvailable = ref(nativeBridge.isFeatureAvailable(feature));
    const error = ref(null);

    // Return feature-specific API
    switch (feature) {
        case NATIVE_FEATURES.CAMERA:
            return {
                isAvailable,
                error,
                takePicture: async (opts = {}) => {
                    try {
                        return await nativeBridge.camera.takePicture({ ...options, ...opts });
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                },
                startVideoRecording: async (opts = {}) => {
                    try {
                        return await nativeBridge.camera.startVideoRecording({ ...options, ...opts });
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                },
                stopVideoRecording: async () => {
                    try {
                        return await nativeBridge.camera.stopVideoRecording();
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                },
                getPhotos: async (opts = {}) => {
                    try {
                        return await nativeBridge.camera.getPhotos({ ...options, ...opts });
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                }
            };

        case NATIVE_FEATURES.LOCATION:
            return {
                isAvailable,
                error,
                getCurrentPosition: async (opts = {}) => {
                    try {
                        return await nativeBridge.location.getCurrentPosition({ ...options, ...opts });
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                },
                watchPosition: async (opts = {}) => {
                    try {
                        return await nativeBridge.location.watchPosition({ ...options, ...opts });
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                },
                clearWatch: async (watchId) => {
                    try {
                        return await nativeBridge.location.clearWatch(watchId);
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                },
                getAddressFromCoordinates: async (coords) => {
                    try {
                        return await nativeBridge.location.getAddressFromCoordinates(coords);
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                }
            };

        // Add other features as needed

        default:
            // Generic API for any feature
            return {
                isAvailable,
                error,
                callMethod: async (method, params = {}) => {
                    try {
                        return await nativeBridge.callNative(feature, method, params);
                    } catch (err) {
                        error.value = err.message;
                        throw err;
                    }
                }
            };
    }
}

/**
 * Creates a native plugin for KalxJS
 * @param {Object} options - Native plugin options
 * @returns {Object} Native plugin
 */
export function createNativePlugin(options = {}) {
    return {
        name: 'native',
        install(app) {
            // Create native bridge
            const nativeBridge = createNativeBridge(options);

            // Add native bridge to the app
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};
            app.config.globalProperties.$native = nativeBridge;

            // Add native bridge to the window for useNative
            if (typeof window !== 'undefined') {
                window.$kalxjs = window.$kalxjs || {};
                window.$kalxjs.native = nativeBridge;
            }

            // Add useNative to the app
            app.useNative = useNative;

            // Register native components
            app.component('NativeCamera', {
                props: {
                    mode: {
                        type: String,
                        default: 'photo', // 'photo', 'video'
                        validator: value => ['photo', 'video'].includes(value)
                    },
                    quality: {
                        type: Number,
                        default: 0.8,
                        validator: value => value >= 0 && value <= 1
                    },
                    maxWidth: Number,
                    maxHeight: Number,
                    includeBase64: {
                        type: Boolean,
                        default: false
                    }
                },
                setup(props, { slots, emit }) {
                    const camera = useNative(NATIVE_FEATURES.CAMERA);
                    const imageUrl = ref('');
                    const videoUrl = ref('');
                    const isCapturing = ref(false);
                    const isRecording = ref(false);
                    const error = ref(null);

                    const takePicture = async () => {
                        if (!camera || isCapturing.value) return;

                        isCapturing.value = true;
                        error.value = null;

                        try {
                            const result = await camera.takePicture({
                                quality: props.quality,
                                maxWidth: props.maxWidth,
                                maxHeight: props.maxHeight,
                                includeBase64: props.includeBase64
                            });

                            imageUrl.value = result.uri;
                            emit('capture', result);
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        } finally {
                            isCapturing.value = false;
                        }
                    };

                    const startRecording = async () => {
                        if (!camera || isRecording.value) return;

                        isRecording.value = true;
                        error.value = null;

                        try {
                            await camera.startVideoRecording({
                                quality: props.quality,
                                maxDuration: props.maxDuration
                            });

                            emit('recording-start');
                        } catch (err) {
                            isRecording.value = false;
                            error.value = err.message;
                            emit('error', err);
                        }
                    };

                    const stopRecording = async () => {
                        if (!camera || !isRecording.value) return;

                        try {
                            const result = await camera.stopVideoRecording();

                            videoUrl.value = result.uri;
                            emit('recording-stop', result);
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        } finally {
                            isRecording.value = false;
                        }
                    };

                    return () => {
                        // Default slot with state
                        if (slots.default) {
                            return slots.default({
                                imageUrl: imageUrl.value,
                                videoUrl: videoUrl.value,
                                isCapturing: isCapturing.value,
                                isRecording: isRecording.value,
                                error: error.value,
                                takePicture,
                                startRecording,
                                stopRecording
                            });
                        }

                        // Default rendering
                        return h('div', { class: 'native-camera' }, [
                            error.value ? h('div', { class: 'native-error' }, [error.value]) : null,
                            props.mode === 'photo' ? [
                                h('button', {
                                    class: 'native-camera-button',
                                    onClick: takePicture,
                                    disabled: isCapturing.value
                                }, [isCapturing.value ? 'Capturing...' : 'Take Photo']),
                                imageUrl.value ? h('img', { class: 'native-camera-preview', src: imageUrl.value }) : null
                            ] : [
                                h('button', {
                                    class: 'native-camera-button',
                                    onClick: isRecording.value ? stopRecording : startRecording,
                                    disabled: isCapturing.value
                                }, [isRecording.value ? 'Stop Recording' : 'Start Recording']),
                                videoUrl.value ? h('video', {
                                    class: 'native-camera-preview',
                                    src: videoUrl.value,
                                    controls: true
                                }) : null
                            ]
                        ]);
                    };
                }
            });

            app.component('NativeLocation', {
                props: {
                    watch: {
                        type: Boolean,
                        default: false
                    },
                    highAccuracy: {
                        type: Boolean,
                        default: false
                    },
                    timeout: {
                        type: Number,
                        default: 10000
                    },
                    maximumAge: {
                        type: Number,
                        default: 0
                    }
                },
                setup(props, { slots, emit }) {
                    const location = useNative(NATIVE_FEATURES.LOCATION);
                    const position = ref(null);
                    const address = ref(null);
                    const isLoading = ref(false);
                    const error = ref(null);
                    let watchId = null;

                    const getPosition = async () => {
                        if (!location) return;

                        isLoading.value = true;
                        error.value = null;

                        try {
                            const result = await location.getCurrentPosition({
                                highAccuracy: props.highAccuracy,
                                timeout: props.timeout,
                                maximumAge: props.maximumAge
                            });

                            position.value = result;
                            emit('position', result);
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        } finally {
                            isLoading.value = false;
                        }
                    };

                    const getAddress = async () => {
                        if (!location || !position.value) return;

                        isLoading.value = true;
                        error.value = null;

                        try {
                            const result = await location.getAddressFromCoordinates({
                                latitude: position.value.coords.latitude,
                                longitude: position.value.coords.longitude
                            });

                            address.value = result;
                            emit('address', result);
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        } finally {
                            isLoading.value = false;
                        }
                    };

                    const startWatching = async () => {
                        if (!location) return;

                        try {
                            watchId = await location.watchPosition({
                                highAccuracy: props.highAccuracy,
                                timeout: props.timeout,
                                maximumAge: props.maximumAge,
                                onUpdate: (result) => {
                                    position.value = result;
                                    emit('position', result);
                                },
                                onError: (err) => {
                                    error.value = err.message;
                                    emit('error', err);
                                }
                            });
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        }
                    };

                    const stopWatching = async () => {
                        if (!location || !watchId) return;

                        try {
                            await location.clearWatch(watchId);
                            watchId = null;
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        }
                    };

                    // Start watching if enabled
                    onMounted(() => {
                        if (props.watch) {
                            startWatching();
                        } else {
                            getPosition();
                        }
                    });

                    // Clean up on unmount
                    onUnmounted(() => {
                        if (watchId) {
                            stopWatching();
                        }
                    });

                    return () => {
                        // Default slot with state
                        if (slots.default) {
                            return slots.default({
                                position: position.value,
                                address: address.value,
                                isLoading: isLoading.value,
                                error: error.value,
                                getPosition,
                                getAddress,
                                startWatching,
                                stopWatching
                            });
                        }

                        // Default rendering
                        return h('div', { class: 'native-location' }, [
                            error.value ? h('div', { class: 'native-error' }, [error.value]) : null,
                            isLoading.value ? h('div', { class: 'native-loading' }, ['Loading location...']) : null,
                            position.value ? h('div', { class: 'native-location-position' }, [
                                h('p', {}, [`Latitude: ${position.value.coords.latitude}`]),
                                h('p', {}, [`Longitude: ${position.value.coords.longitude}`]),
                                h('p', {}, [`Accuracy: ${position.value.coords.accuracy} meters`])
                            ]) : null,
                            address.value ? h('div', { class: 'native-location-address' }, [
                                h('p', {}, [address.value.formattedAddress])
                            ]) : null,
                            h('div', { class: 'native-location-actions' }, [
                                h('button', {
                                    class: 'native-location-button',
                                    onClick: getPosition,
                                    disabled: isLoading.value
                                }, ['Get Position']),
                                position.value ? h('button', {
                                    class: 'native-location-button',
                                    onClick: getAddress,
                                    disabled: isLoading.value
                                }, ['Get Address']) : null,
                                props.watch ? h('button', {
                                    class: 'native-location-button',
                                    onClick: watchId ? stopWatching : startWatching,
                                    disabled: isLoading.value
                                }, [watchId ? 'Stop Watching' : 'Start Watching']) : null
                            ])
                        ]);
                    };
                }
            });
        }
    };
}