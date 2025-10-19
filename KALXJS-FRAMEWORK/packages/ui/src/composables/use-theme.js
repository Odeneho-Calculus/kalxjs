/**
 * useTheme Composable
 * Access and manage theme in components
 *
 * @module @kalxjs/ui/composables/use-theme
 */

import { ref, computed, inject } from '@kalxjs/core';
import { createTheme, applyTheme } from '../theme/index.js';

/**
 * Theme context symbol
 */
export const ThemeSymbol = Symbol('theme');

/**
 * Use theme composable
 */
export function useTheme() {
    // Try to get theme from context
    const themeContext = inject(ThemeSymbol, null);

    if (themeContext) {
        return themeContext;
    }

    // Fallback: create local theme instance
    const currentTheme = ref(createTheme());

    const setTheme = (newTheme) => {
        currentTheme.value = typeof newTheme === 'function'
            ? newTheme(currentTheme.value)
            : newTheme;
        applyTheme(currentTheme.value);
    };

    const toggleMode = () => {
        const newMode = currentTheme.value.mode === 'light' ? 'dark' : 'light';
        setTheme(createTheme({ ...currentTheme.value, mode: newMode }));
    };

    const isDark = computed(() => currentTheme.value.mode === 'dark');

    return {
        theme: currentTheme,
        setTheme,
        toggleMode,
        isDark,
    };
}

/**
 * Export default
 */
export default useTheme;