/**
 * Web App Manifest Generation
 * Create and manage PWA manifest
 *
 * @module @kalxjs/pwa/manifest
 */

/**
 * Default manifest configuration
 */
export const DEFAULT_MANIFEST = {
    name: '',
    short_name: '',
    description: '',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'any',
    icons: [],
};

/**
 * Create manifest object
 */
export function createManifest(options = {}) {
    const manifest = {
        ...DEFAULT_MANIFEST,
        ...options,
    };

    // Validate required fields
    if (!manifest.name) {
        console.warn('[PWA] Manifest missing required field: name');
    }

    return manifest;
}

/**
 * Generate manifest.json file
 */
export function generateManifest(options = {}) {
    const manifest = createManifest(options);
    return JSON.stringify(manifest, null, 2);
}

/**
 * Create manifest link element
 */
export function injectManifest(manifest, linkId = 'app-manifest') {
    if (typeof document === 'undefined') {
        return null;
    }

    // Remove existing manifest link
    const existing = document.getElementById(linkId);
    if (existing) {
        existing.remove();
    }

    // Create manifest blob
    const manifestJSON = typeof manifest === 'string'
        ? manifest
        : generateManifest(manifest);

    const blob = new Blob([manifestJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create link element
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'manifest';
    link.href = url;

    // Inject into head
    document.head.appendChild(link);

    return link;
}

/**
 * Create app icon configuration
 */
export function createIcon(src, sizes, type = 'image/png', purpose = 'any') {
    return { src, sizes, type, purpose };
}

/**
 * Generate icon sizes
 */
export function generateIconSizes(basePath, sizes = [192, 512]) {
    return sizes.map(size =>
        createIcon(
            `${basePath}/icon-${size}x${size}.png`,
            `${size}x${size}`,
            'image/png'
        )
    );
}

/**
 * Add maskable icon
 */
export function addMaskableIcon(icons, src, size = '512x512') {
    return [
        ...icons,
        createIcon(src, size, 'image/png', 'maskable'),
    ];
}

/**
 * Set theme color
 */
export function setThemeColor(color) {
    if (typeof document === 'undefined') {
        return;
    }

    let meta = document.querySelector('meta[name="theme-color"]');

    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
    }

    meta.content = color;
}

/**
 * Create iOS meta tags for PWA
 */
export function createIOSMetaTags(options = {}) {
    if (typeof document === 'undefined') {
        return [];
    }

    const {
        appTitle = '',
        themeColor = '#000000',
        statusBarStyle = 'default', // default, black, black-translucent
        icon = '/icon-192x192.png',
    } = options;

    const tags = [];

    // Apple mobile web app capable
    const capable = createMetaTag('apple-mobile-web-app-capable', 'yes');
    tags.push(capable);

    // Status bar style
    const statusBar = createMetaTag('apple-mobile-web-app-status-bar-style', statusBarStyle);
    tags.push(statusBar);

    // App title
    if (appTitle) {
        const title = createMetaTag('apple-mobile-web-app-title', appTitle);
        tags.push(title);
    }

    // Apple touch icon
    const touchIcon = document.createElement('link');
    touchIcon.rel = 'apple-touch-icon';
    touchIcon.href = icon;
    document.head.appendChild(touchIcon);
    tags.push(touchIcon);

    return tags;
}

/**
 * Create meta tag
 */
function createMetaTag(name, content) {
    if (typeof document === 'undefined') {
        return null;
    }

    let meta = document.querySelector(`meta[name="${name}"]`);

    if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
    }

    meta.content = content;
    return meta;
}

/**
 * Detect if app is running as PWA
 */
export function isRunningAsPWA() {
    if (typeof window === 'undefined') {
        return false;
    }

    // Check display mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Check iOS standalone mode
    const isIOSStandalone = 'standalone' in window.navigator && window.navigator.standalone;

    return isStandalone || isIOSStandalone;
}

/**
 * Get display mode
 */
export function getDisplayMode() {
    if (typeof window === 'undefined') {
        return 'browser';
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
        return 'standalone';
    }

    if (window.matchMedia('(display-mode: fullscreen)').matches) {
        return 'fullscreen';
    }

    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
        return 'minimal-ui';
    }

    return 'browser';
}

/**
 * Listen for display mode changes
 */
export function onDisplayModeChange(callback) {
    if (typeof window === 'undefined') {
        return () => { };
    }

    const modes = ['standalone', 'fullscreen', 'minimal-ui'];
    const listeners = [];

    modes.forEach(mode => {
        const mediaQuery = window.matchMedia(`(display-mode: ${mode})`);
        const listener = (e) => {
            if (e.matches) {
                callback(mode);
            }
        };

        mediaQuery.addEventListener('change', listener);
        listeners.push({ mediaQuery, listener });
    });

    // Return cleanup function
    return () => {
        listeners.forEach(({ mediaQuery, listener }) => {
            mediaQuery.removeEventListener('change', listener);
        });
    };
}

/**
 * Create manifest with recommended settings
 */
export function createRecommendedManifest(appInfo = {}) {
    const {
        name = 'My App',
        shortName = name,
        description = '',
        startUrl = '/',
        themeColor = '#000000',
        backgroundColor = '#ffffff',
        iconBasePath = '/icons',
    } = appInfo;

    return createManifest({
        name,
        short_name: shortName,
        description,
        start_url: startUrl,
        display: 'standalone',
        background_color: backgroundColor,
        theme_color: themeColor,
        orientation: 'any',
        icons: [
            ...generateIconSizes(iconBasePath, [72, 96, 128, 144, 152, 192, 384, 512]),
            createIcon(`${iconBasePath}/icon-512x512-maskable.png`, '512x512', 'image/png', 'maskable'),
        ],
        categories: [],
        screenshots: [],
    });
}