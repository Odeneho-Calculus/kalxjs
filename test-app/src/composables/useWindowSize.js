import { ref } from '@kalxjs/core';
import { onMounted, onUnmounted } from '@kalxjs/composition';

/**
 * Composable for tracking window size
 * @returns {Object} Window size state and utilities
 */
export function useWindowSize() {
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);

  // Computed breakpoints
  const isMobile = ref(width.value < 768);
  const isTablet = ref(width.value >= 768 && width.value < 1024);
  const isDesktop = ref(width.value >= 1024);

  function updateSize() {
    width.value = window.innerWidth;
    height.value = window.innerHeight;

    // Update breakpoints
    isMobile.value = width.value < 768;
    isTablet.value = width.value >= 768 && width.value < 1024;
    isDesktop.value = width.value >= 1024;
  }

  onMounted(() => {
    window.addEventListener('resize', updateSize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateSize);
  });

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop
  };
}