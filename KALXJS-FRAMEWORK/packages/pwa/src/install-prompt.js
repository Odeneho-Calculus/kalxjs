/**
 * PWA Install Prompt
 * Handle beforeinstallprompt and app installation
 *
 * @module @kalxjs/pwa/install-prompt
 */

/**
 * Install prompt manager
 */
export class InstallPromptManager {
    constructor() {
        this.deferredPrompt = null;
        this.listeners = [];
        this.setupListener();
    }

    setupListener() {
        if (typeof window === 'undefined') {
            return;
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent default mini-infobar
            e.preventDefault();

            // Store event for later use
            this.deferredPrompt = e;

            // Notify listeners
            this.listeners.forEach(listener => listener(e));
        });

        window.addEventListener('appinstalled', () => {
            // Clear prompt
            this.deferredPrompt = null;
        });
    }

    /**
     * Check if install prompt is available
     */
    canPrompt() {
        return this.deferredPrompt !== null;
    }

    /**
     * Show install prompt
     */
    async prompt() {
        if (!this.deferredPrompt) {
            throw new Error('Install prompt not available');
        }

        // Show prompt
        this.deferredPrompt.prompt();

        // Wait for user response
        const { outcome } = await this.deferredPrompt.userChoice;

        // Clear prompt
        this.deferredPrompt = null;

        return outcome; // 'accepted' or 'dismissed'
    }

    /**
     * Listen for install prompt availability
     */
    onAvailable(callback) {
        this.listeners.push(callback);

        // Return cleanup function
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Check if app is installed
     */
    isInstalled() {
        if (typeof window === 'undefined') {
            return false;
        }

        // Check display mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

        // Check iOS standalone
        const isIOSStandalone = 'standalone' in window.navigator && window.navigator.standalone;

        return isStandalone || isIOSStandalone;
    }
}

/**
 * Create install prompt UI
 */
export function createInstallButton(options = {}) {
    if (typeof document === 'undefined') {
        return null;
    }

    const {
        text = 'Install App',
        className = 'install-button',
        style = {},
        onInstall,
        onDismiss,
    } = options;

    const promptManager = new InstallPromptManager();
    const button = document.createElement('button');

    button.className = className;
    button.textContent = text;
    button.style.display = 'none';

    // Apply default styles
    Object.assign(button.style, {
        padding: '12px 24px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        ...style,
    });

    // Show button when prompt is available
    const cleanup = promptManager.onAvailable(() => {
        if (!promptManager.isInstalled()) {
            button.style.display = 'block';
        }
    });

    // Handle click
    button.addEventListener('click', async () => {
        try {
            const outcome = await promptManager.prompt();

            if (outcome === 'accepted') {
                button.style.display = 'none';
                if (onInstall) {
                    onInstall();
                }
            } else {
                if (onDismiss) {
                    onDismiss();
                }
            }
        } catch (error) {
            console.error('[PWA] Install prompt failed:', error);
        }
    });

    // Hide if already installed
    if (promptManager.isInstalled()) {
        button.style.display = 'none';
    }

    return {
        element: button,
        promptManager,
        cleanup,
        show() {
            button.style.display = 'block';
        },
        hide() {
            button.style.display = 'none';
        },
        destroy() {
            cleanup();
            button.remove();
        },
    };
}

/**
 * Create install banner
 */
export function createInstallBanner(options = {}) {
    if (typeof document === 'undefined') {
        return null;
    }

    const {
        message = 'Install our app for a better experience',
        buttonText = 'Install',
        dismissText = 'Not now',
        className = 'install-banner',
        style = {},
        onInstall,
        onDismiss,
    } = options;

    const promptManager = new InstallPromptManager();
    const banner = document.createElement('div');

    banner.className = className;
    banner.style.display = 'none';

    // Apply default styles
    Object.assign(banner.style, {
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        padding: '16px',
        backgroundColor: '#fff',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        zIndex: '9999',
        ...style,
    });

    // Create message
    const messageEl = document.createElement('span');
    messageEl.textContent = message;
    messageEl.style.flex = '1';

    // Create install button
    const installBtn = document.createElement('button');
    installBtn.textContent = buttonText;
    Object.assign(installBtn.style, {
        padding: '8px 16px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    });

    // Create dismiss button
    const dismissBtn = document.createElement('button');
    dismissBtn.textContent = dismissText;
    Object.assign(dismissBtn.style, {
        padding: '8px 16px',
        backgroundColor: 'transparent',
        color: '#666',
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'pointer',
    });

    banner.appendChild(messageEl);
    banner.appendChild(installBtn);
    banner.appendChild(dismissBtn);

    // Show banner when prompt is available
    const cleanup = promptManager.onAvailable(() => {
        if (!promptManager.isInstalled()) {
            banner.style.display = 'flex';
        }
    });

    // Handle install click
    installBtn.addEventListener('click', async () => {
        try {
            const outcome = await promptManager.prompt();

            if (outcome === 'accepted') {
                banner.style.display = 'none';
                if (onInstall) {
                    onInstall();
                }
            }
        } catch (error) {
            console.error('[PWA] Install prompt failed:', error);
        }
    });

    // Handle dismiss click
    dismissBtn.addEventListener('click', () => {
        banner.style.display = 'none';
        if (onDismiss) {
            onDismiss();
        }
    });

    // Hide if already installed
    if (promptManager.isInstalled()) {
        banner.style.display = 'none';
    }

    return {
        element: banner,
        promptManager,
        cleanup,
        show() {
            banner.style.display = 'flex';
        },
        hide() {
            banner.style.display = 'none';
        },
        destroy() {
            cleanup();
            banner.remove();
        },
    };
}

/**
 * Check if app can be installed
 */
export function canInstall() {
    if (typeof window === 'undefined') {
        return false;
    }

    // Already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return false;
    }

    // iOS standalone
    if ('standalone' in window.navigator && window.navigator.standalone) {
        return false;
    }

    return true;
}

/**
 * Get install source
 */
export function getInstallSource() {
    if (typeof window === 'undefined') {
        return null;
    }

    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('utm_source') || 'direct';
}