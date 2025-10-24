/**
 * KALXJS Framework Detector
 * Detects KALXJS framework presence and version on web pages
 */

import { KALXJS_HOOK_NAME, KALXJS_DETECTOR_NAME, DETECTION_PATTERNS, MESSAGE_TYPES } from '../shared/constants.js';
import { createLogger, debounce } from '../shared/utils.js';

const logger = createLogger('Detector');

/**
 * KALXJS Framework Detector
 */
export class FrameworkDetector {
    constructor(bridge) {
        this.bridge = bridge;
        this.detected = false;
        this.framework = null;
        this.detectionMethods = [];
        this.observerInstances = [];

        // Debounced detection to avoid excessive checks
        this.debouncedDetection = debounce(this._performDetection.bind(this), 300);

        this._initialize();
    }

    /**
     * Initialize detector
     */
    _initialize() {
        logger.info('KALXJS Framework Detector initializing...');

        // Install detector hook
        this._installDetectorHook();

        // Start detection
        this.startDetection();

        logger.info('Framework Detector initialized');
    }

    /**
     * Install detector hook in page context
     */
    _installDetectorHook() {
        if (typeof window !== 'undefined') {
            window[KALXJS_DETECTOR_NAME] = {
                version: '1.0.0',
                detected: false,
                framework: null,
                notifyDetection: (framework) => {
                    this._handleFrameworkDetected(framework);
                },
                notifyUndetection: () => {
                    this._handleFrameworkUndetected();
                }
            };
        }
    }

    /**
     * Start framework detection
     */
    startDetection() {
        logger.debug('Starting framework detection...');

        // Immediate detection
        this._performDetection();

        // Set up observers for dynamic detection
        this._setupObservers();

        // Periodic detection fallback
        this._setupPeriodicDetection();
    }

    /**
     * Stop framework detection
     */
    stopDetection() {
        logger.debug('Stopping framework detection...');

        // Clear observers
        this.observerInstances.forEach(observer => {
            if (observer.disconnect) observer.disconnect();
            if (observer.clear) observer.clear();
        });
        this.observerInstances = [];

        // Clear periodic detection
        if (this._detectionInterval) {
            clearInterval(this._detectionInterval);
            this._detectionInterval = null;
        }
    }

    /**
     * Perform comprehensive framework detection
     */
    _performDetection() {
        const detectionResult = {
            detected: false,
            framework: null,
            methods: [],
            timestamp: Date.now()
        };

        try {
            // Method 1: Check for KALXJS DevTools hook
            const hookResult = this._detectViaHook();
            if (hookResult.detected) {
                detectionResult.detected = true;
                detectionResult.framework = hookResult.framework;
                detectionResult.methods.push('hook');
            }

            // Method 2: Check for global KALXJS objects
            if (!detectionResult.detected) {
                const globalResult = this._detectViaGlobal();
                if (globalResult.detected) {
                    detectionResult.detected = true;
                    detectionResult.framework = globalResult.framework;
                    detectionResult.methods.push('global');
                }
            }

            // Method 3: Check DOM for KALXJS attributes/components
            if (!detectionResult.detected) {
                const domResult = this._detectViaDom();
                if (domResult.detected) {
                    detectionResult.detected = true;
                    detectionResult.framework = domResult.framework;
                    detectionResult.methods.push('dom');
                }
            }

            // Method 4: Check script tags for KALXJS imports/CDN
            if (!detectionResult.detected) {
                const scriptResult = this._detectViaScripts();
                if (scriptResult.detected) {
                    detectionResult.detected = true;
                    detectionResult.framework = scriptResult.framework;
                    detectionResult.methods.push('script');
                }
            }

            // Update detection state
            this._updateDetectionState(detectionResult);

        } catch (error) {
            logger.error('Detection failed:', error);
        }
    }

    /**
     * Detect via DevTools hook
     */
    _detectViaHook() {
        try {
            const hook = window[KALXJS_HOOK_NAME];

            if (hook && typeof hook === 'object') {
                logger.debug('KALXJS hook found:', hook);

                const apps = hook.getApps ? hook.getApps() : [];

                return {
                    detected: true,
                    framework: {
                        name: 'KALXJS',
                        version: this._extractVersionFromHook(hook),
                        type: 'framework',
                        apps: apps.length,
                        hook: true,
                        features: this._detectFeatures(hook),
                        detectedAt: Date.now()
                    }
                };
            }
        } catch (error) {
            logger.warn('Hook detection failed:', error);
        }

        return { detected: false };
    }

    /**
     * Detect via global objects
     */
    _detectViaGlobal() {
        const globalVariables = ['__KALXJS__', 'KALXJS', 'KalxJS'];

        for (const varName of globalVariables) {
            try {
                const globalObj = window[varName];

                if (globalObj && typeof globalObj === 'object') {
                    logger.debug(`Global KALXJS object found: ${varName}`, globalObj);

                    return {
                        detected: true,
                        framework: {
                            name: 'KALXJS',
                            version: globalObj.version || 'unknown',
                            type: 'framework',
                            global: varName,
                            features: this._detectFeaturesFromGlobal(globalObj),
                            detectedAt: Date.now()
                        }
                    };
                }
            } catch (error) {
                logger.warn(`Global detection failed for ${varName}:`, error);
            }
        }

        return { detected: false };
    }

    /**
     * Detect via DOM inspection
     */
    _detectViaDom() {
        try {
            // Check for KALXJS-specific attributes
            const kalxjsElements = document.querySelectorAll('[data-kalxjs], [kalx-app], [k-app]');

            if (kalxjsElements.length > 0) {
                logger.debug(`KALXJS DOM elements found: ${kalxjsElements.length}`);

                return {
                    detected: true,
                    framework: {
                        name: 'KALXJS',
                        version: 'unknown',
                        type: 'framework',
                        elements: kalxjsElements.length,
                        attributes: this._extractAttributeInfo(kalxjsElements),
                        detectedAt: Date.now()
                    }
                };
            }

            // Check for component classes or patterns
            const componentElements = document.querySelectorAll('[class*="kalxjs"], [class*="kalx-"]');

            if (componentElements.length > 0) {
                logger.debug(`KALXJS component elements found: ${componentElements.length}`);

                return {
                    detected: true,
                    framework: {
                        name: 'KALXJS',
                        version: 'unknown',
                        type: 'framework',
                        components: componentElements.length,
                        detectedAt: Date.now()
                    }
                };
            }
        } catch (error) {
            logger.warn('DOM detection failed:', error);
        }

        return { detected: false };
    }

    /**
     * Detect via script tags
     */
    _detectViaScripts() {
        try {
            const scripts = document.querySelectorAll('script');
            const scriptContents = [];

            scripts.forEach(script => {
                // Check script src for KALXJS
                if (script.src && DETECTION_PATTERNS.KALXJS_CDN.test(script.src)) {
                    logger.debug('KALXJS CDN script found:', script.src);
                    scriptContents.push({ type: 'cdn', src: script.src });
                }

                // Check inline scripts
                if (script.textContent) {
                    if (DETECTION_PATTERNS.KALXJS_IMPORT.test(script.textContent) ||
                        DETECTION_PATTERNS.KALXJS_REQUIRE.test(script.textContent) ||
                        DETECTION_PATTERNS.KALXJS_COMMENT.test(script.textContent)) {
                        scriptContents.push({ type: 'inline', content: script.textContent.substring(0, 200) });
                    }
                }
            });

            if (scriptContents.length > 0) {
                return {
                    detected: true,
                    framework: {
                        name: 'KALXJS',
                        version: 'unknown',
                        type: 'framework',
                        scripts: scriptContents,
                        detectedAt: Date.now()
                    }
                };
            }
        } catch (error) {
            logger.warn('Script detection failed:', error);
        }

        return { detected: false };
    }

    /**
     * Setup observers for dynamic detection
     */
    _setupObservers() {
        // DOM mutation observer
        if (typeof MutationObserver !== 'undefined') {
            const mutationObserver = new MutationObserver((mutations) => {
                let shouldRedetect = false;

                mutations.forEach((mutation) => {
                    // Check for added nodes
                    if (mutation.addedNodes) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // Check if added node has KALXJS attributes
                                if (node.hasAttribute && (
                                    node.hasAttribute('data-kalxjs') ||
                                    node.hasAttribute('kalx-app') ||
                                    node.hasAttribute('k-app')
                                )) {
                                    shouldRedetect = true;
                                }

                                // Check if it's a script tag
                                if (node.tagName === 'SCRIPT') {
                                    shouldRedetect = true;
                                }
                            }
                        });
                    }
                });

                if (shouldRedetect) {
                    this.debouncedDetection();
                }
            });

            mutationObserver.observe(document, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['data-kalxjs', 'kalx-app', 'k-app', 'class']
            });

            this.observerInstances.push(mutationObserver);
        }

        // Window object changes
        if (typeof window !== 'undefined') {
            const originalDefineProperty = Object.defineProperty;

            Object.defineProperty = function (obj, prop, descriptor) {
                if (obj === window && (prop === KALXJS_HOOK_NAME || prop.includes('KALXJS'))) {
                    setTimeout(() => this.debouncedDetection(), 100);
                }
                return originalDefineProperty.call(this, obj, prop, descriptor);
            }.bind(this);
        }
    }

    /**
     * Setup periodic detection as fallback
     */
    _setupPeriodicDetection() {
        this._detectionInterval = setInterval(() => {
            if (!this.detected) {
                this._performDetection();
            }
        }, 5000); // Check every 5 seconds if not detected
    }

    /**
     * Update detection state and notify
     */
    _updateDetectionState(detectionResult) {
        const wasDetected = this.detected;
        const previousFramework = this.framework;

        this.detected = detectionResult.detected;
        this.framework = detectionResult.framework;
        this.detectionMethods = detectionResult.methods;

        // Notify if state changed
        if (!wasDetected && this.detected) {
            this._handleFrameworkDetected(this.framework);
        } else if (wasDetected && !this.detected) {
            this._handleFrameworkUndetected();
        } else if (this.detected && this.framework && previousFramework &&
            this.framework.version !== previousFramework.version) {
            // Framework updated
            this._handleFrameworkUpdated(this.framework, previousFramework);
        }
    }

    /**
     * Handle framework detection
     */
    _handleFrameworkDetected(framework) {
        logger.info('KALXJS framework detected:', framework);

        // Update detector hook
        if (window[KALXJS_DETECTOR_NAME]) {
            window[KALXJS_DETECTOR_NAME].detected = true;
            window[KALXJS_DETECTOR_NAME].framework = framework;
        }

        // Notify bridge
        this.bridge.send('background', MESSAGE_TYPES.FRAMEWORK_DETECTED, {
            framework,
            detectionMethods: this.detectionMethods,
            url: window.location.href,
            title: document.title,
            timestamp: Date.now()
        }).catch(error => {
            logger.error('Failed to notify framework detection:', error);
        });
    }

    /**
     * Handle framework undetection
     */
    _handleFrameworkUndetected() {
        logger.info('KALXJS framework undetected');

        // Update detector hook
        if (window[KALXJS_DETECTOR_NAME]) {
            window[KALXJS_DETECTOR_NAME].detected = false;
            window[KALXJS_DETECTOR_NAME].framework = null;
        }

        // Notify bridge
        this.bridge.send('background', MESSAGE_TYPES.FRAMEWORK_UNDETECTED, {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now()
        }).catch(error => {
            logger.error('Failed to notify framework undetection:', error);
        });
    }

    /**
     * Handle framework update
     */
    _handleFrameworkUpdated(newFramework, oldFramework) {
        logger.info('KALXJS framework updated:', { old: oldFramework, new: newFramework });

        // Treat as new detection
        this._handleFrameworkDetected(newFramework);
    }

    /**
     * Extract version from DevTools hook
     */
    _extractVersionFromHook(hook) {
        if (hook.version) return hook.version;

        // Try to get version from apps
        const apps = hook.getApps ? hook.getApps() : [];
        if (apps.length > 0 && apps[0].version) {
            return apps[0].version;
        }

        return 'unknown';
    }

    /**
     * Detect available features from hook
     */
    _detectFeatures(hook) {
        const features = [];

        if (hook.getApps) features.push('app-registry');
        if (hook.getComponents) features.push('component-registry');
        if (hook.registerComponent) features.push('component-registration');
        if (hook.emit) features.push('event-system');
        if (hook.on) features.push('event-listeners');
        if (hook.getComponentTree) features.push('component-tree');
        if (hook.extractState) features.push('state-extraction');

        return features;
    }

    /**
     * Detect features from global object
     */
    _detectFeaturesFromGlobal(globalObj) {
        const features = [];

        if (globalObj.createApp) features.push('app-creation');
        if (globalObj.component) features.push('component-definition');
        if (globalObj.directive) features.push('directive-system');
        if (globalObj.router) features.push('routing');
        if (globalObj.store) features.push('state-management');

        return features;
    }

    /**
     * Extract attribute information from elements
     */
    _extractAttributeInfo(elements) {
        const attributes = new Set();

        elements.forEach(element => {
            Array.from(element.attributes).forEach(attr => {
                if (attr.name.startsWith('data-kalxjs') ||
                    attr.name.startsWith('kalx-') ||
                    attr.name.startsWith('k-')) {
                    attributes.add(attr.name);
                }
            });
        });

        return Array.from(attributes);
    }

    /**
     * Get current detection status
     */
    getDetectionStatus() {
        return {
            detected: this.detected,
            framework: this.framework,
            methods: this.detectionMethods,
            timestamp: Date.now()
        };
    }
}

export default FrameworkDetector;