import { ref } from '@kalxjs/core';
import { onMounted } from '@kalxjs/composition';

/**
 * Utility for lazy loading components or resources
 * @param {Function} importFn - Dynamic import function
 * @param {Object} options - Configuration options
 * @returns {Object} Lazy loading state and component
 */
export function useLazyLoad(importFn, options = {}) {
  const {
    immediate = false,
    loadingComponent = null,
    errorComponent = null,
    onError = null
  } = options;

  const component = ref(loadingComponent);
  const isLoading = ref(immediate);
  const isLoaded = ref(false);
  const error = ref(null);

  const load = async () => {
    if (isLoaded.value || isLoading.value) return;

    isLoading.value = true;
    error.value = null;

    try {
      const loadedModule = await importFn();
      component.value = loadedModule.default || loadedModule;
      isLoaded.value = true;
    } catch (err) {
      error.value = err;
      component.value = errorComponent;

      if (onError && typeof onError === 'function') {
        onError(err);
      }
    } finally {
      isLoading.value = false;
    }
  };

  if (immediate) {
    // Load immediately if specified
    load();
  }

  onMounted(() => {
    // Check if component should be loaded on mount
    if (!immediate && !isLoaded.value) {
      load();
    }
  });

  return {
    component,
    isLoading,
    isLoaded,
    error,
    load
  };
}