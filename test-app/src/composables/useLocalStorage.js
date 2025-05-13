import { ref } from '@kalxjs/core';
import { watch } from '@kalxjs/composition';

/**
 * Composable for using localStorage with reactivity
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {Object} Reactive value and utilities
 */
export function useLocalStorage(key, defaultValue = null) {
  // Get initial value from localStorage or use default
  const getStoredValue = () => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  };

  const storedValue = ref(getStoredValue());

  // Update localStorage when value changes
  watch(storedValue, (newValue) => {
    try {
      if (newValue === null || newValue === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      }
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  });

  // Handle storage events from other tabs/windows
  const handleStorageChange = (event) => {
    if (event.key === key) {
      storedValue.value = event.newValue ? JSON.parse(event.newValue) : defaultValue;
    }
  };

  // Add event listener for storage events
  window.addEventListener('storage', handleStorageChange);

  // Remove event listener on cleanup
  const clear = () => {
    window.removeEventListener('storage', handleStorageChange);
  };

  return {
    value: storedValue,
    clear,
    remove: () => {
      window.localStorage.removeItem(key);
      storedValue.value = defaultValue;
    }
  };
}