/**
 * useMediaQuery Composable
 * React to media query changes
 *
 * @module @kalxjs/ui/composables/use-media-query
 */

import { ref, onMounted, onUnmounted } from '@kalxjs/core';

/**
 * Use media query composable
 */
export function useMediaQuery(query) {
    const matches = ref(false);
    let mediaQuery = null;

    const updateMatches = (e) => {
        matches.value = e.matches;
    };

    onMounted(() => {
        if (typeof window !== 'undefined' && 'matchMedia' in window) {
            mediaQuery = window.matchMedia(query);
            matches.value = mediaQuery.matches;

            // Modern browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', updateMatches);
            } else {
                // Legacy browsers
                mediaQuery.addListener(updateMatches);
            }
        }
    });

    onUnmounted(() => {
        if (mediaQuery) {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', updateMatches);
            } else {
                mediaQuery.removeListener(updateMatches);
            }
        }
    });

    return matches;
}

/**
 * Common breakpoint composables
 */
export function useIsMobile() {
    return useMediaQuery('(max-width: 767px)');
}

export function useIsTablet() {
    return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop() {
    return useMediaQuery('(min-width: 1024px)');
}

export function usePrefersDark() {
    return useMediaQuery('(prefers-color-scheme: dark)');
}

export function usePrefersReducedMotion() {
    return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Export default
 */
export default useMediaQuery;