/**
 * Translation Loader
 * Lazy loading and dynamic import of translations
 *
 * @module @kalxjs/i18n/loader
 */

/**
 * Create translation loader
 */
export function createTranslationLoader(i18n, options = {}) {
    const {
        loadPath = './locales/{locale}.json',
        cache = true,
    } = options;

    const loading = new Map();
    const loaded = new Set();

    /**
     * Load translations for locale
     */
    async function load(locale) {
        // Check if already loaded
        if (loaded.has(locale)) {
            return true;
        }

        // Check if already loading
        if (loading.has(locale)) {
            return loading.get(locale);
        }

        // Start loading
        const promise = loadLocale(locale);
        loading.set(locale, promise);

        try {
            const messages = await promise;
            i18n.mergeMessages(locale, messages);
            loaded.add(locale);
            loading.delete(locale);
            return true;
        } catch (error) {
            loading.delete(locale);
            console.error(`[i18n] Failed to load locale "${locale}":`, error);
            return false;
        }
    }

    /**
     * Load locale file
     */
    async function loadLocale(locale) {
        const path = loadPath.replace('{locale}', locale);

        try {
            // Try dynamic import first
            const module = await import(/* @vite-ignore */ path);
            return module.default || module;
        } catch (e) {
            // Fallback to fetch
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        }
    }

    /**
     * Preload translations for locale
     */
    function preload(locale) {
        return load(locale);
    }

    /**
     * Preload multiple locales
     */
    async function preloadAll(locales) {
        const results = await Promise.allSettled(
            locales.map(locale => load(locale))
        );

        return results.map((result, index) => ({
            locale: locales[index],
            success: result.status === 'fulfilled' && result.value,
            error: result.status === 'rejected' ? result.reason : null,
        }));
    }

    /**
     * Check if locale is loaded
     */
    function isLoaded(locale) {
        return loaded.has(locale);
    }

    /**
     * Check if locale is loading
     */
    function isLoading(locale) {
        return loading.has(locale);
    }

    /**
     * Clear cache
     */
    function clearCache() {
        loaded.clear();
        loading.clear();
    }

    /**
     * Get loaded locales
     */
    function getLoadedLocales() {
        return Array.from(loaded);
    }

    return {
        load,
        preload,
        preloadAll,
        isLoaded,
        isLoading,
        clearCache,
        getLoadedLocales,
    };
}

/**
 * Create lazy locale loader
 */
export function createLazyLocaleLoader(localeMap) {
    const loaded = new Map();

    async function loadLocale(locale) {
        if (loaded.has(locale)) {
            return loaded.get(locale);
        }

        const loader = localeMap[locale];
        if (!loader) {
            throw new Error(`Locale "${locale}" not found`);
        }

        try {
            const messages = await loader();
            const data = messages.default || messages;
            loaded.set(locale, data);
            return data;
        } catch (error) {
            console.error(`Failed to load locale "${locale}":`, error);
            throw error;
        }
    }

    return {
        loadLocale,
        hasLocale: (locale) => locale in localeMap,
        getLoadedLocales: () => Array.from(loaded.keys()),
    };
}

/**
 * Create namespace loader
 */
export function createNamespaceLoader(options = {}) {
    const {
        loadPath = './locales/{locale}/{namespace}.json',
    } = options;

    const loaded = new Map();

    async function loadNamespace(locale, namespace) {
        const key = `${locale}:${namespace}`;

        if (loaded.has(key)) {
            return loaded.get(key);
        }

        const path = loadPath
            .replace('{locale}', locale)
            .replace('{namespace}', namespace);

        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const messages = await response.json();
            loaded.set(key, messages);
            return messages;
        } catch (error) {
            console.error(`Failed to load namespace "${namespace}" for locale "${locale}":`, error);
            throw error;
        }
    }

    function isLoaded(locale, namespace) {
        return loaded.has(`${locale}:${namespace}`);
    }

    return {
        loadNamespace,
        isLoaded,
    };
}

/**
 * Auto-load translations when switching locale
 */
export function setupAutoLoad(i18n, loader, options = {}) {
    const { preloadLocales = [] } = options;

    // Preload specified locales
    preloadLocales.forEach(locale => {
        loader.preload(locale);
    });

    // Watch locale changes
    let unwatch;

    if (i18n.locale && i18n.locale.value !== undefined) {
        // It's a ref/reactive
        unwatch = watchLocale(i18n, async (newLocale) => {
            if (!loader.isLoaded(newLocale)) {
                await loader.load(newLocale);
            }
        });
    }

    return () => {
        if (unwatch) unwatch();
    };
}

/**
 * Watch locale changes
 */
function watchLocale(i18n, callback) {
    // Simple implementation - in real scenario, use Vue's watch
    let currentLocale = i18n.locale.value;

    const interval = setInterval(() => {
        if (i18n.locale.value !== currentLocale) {
            currentLocale = i18n.locale.value;
            callback(currentLocale);
        }
    }, 100);

    return () => clearInterval(interval);
}