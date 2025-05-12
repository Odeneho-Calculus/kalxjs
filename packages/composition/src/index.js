import { ref, reactive, computed } from '@kalxjs/core';
import { onMounted, onUnmounted, watch } from '@kalxjs/core/composition';

/**
 * Composition API hook for tracking window size
 * @returns {Object} Window size state and utilities
 */
export function useWindowSize() {
    const width = ref(typeof window !== 'undefined' ? window.innerWidth : 0);
    const height = ref(typeof window !== 'undefined' ? window.innerHeight : 0);

    const updateSize = () => {
        width.value = window.innerWidth;
        height.value = window.innerHeight;
    };

    onMounted(() => {
        window.addEventListener('resize', updateSize);
    });

    onUnmounted(() => {
        window.removeEventListener('resize', updateSize);
    });

    // Computed properties for common breakpoints
    const breakpoints = reactive({
        isMobile: computed(() => width.value < 768),
        isTablet: computed(() => width.value >= 768 && width.value < 1024),
        isDesktop: computed(() => width.value >= 1024),
        isLargeDesktop: computed(() => width.value >= 1440)
    });

    return {
        width,
        height,
        breakpoints
    };
}

/**
 * Composition API hook for local storage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {Object} Storage state and methods
 */
export function useLocalStorage(key, defaultValue = null) {
    // Get initial value from localStorage or use default
    const getStoredValue = () => {
        if (typeof window === 'undefined') return defaultValue;

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
    const setValue = (value) => {
        try {
            // Allow value to be a function for same API as useState
            const valueToStore = value instanceof Function ? value(storedValue.value) : value;

            // Save state
            storedValue.value = valueToStore;

            // Save to localStorage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    // Remove item from localStorage
    const removeItem = () => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
                storedValue.value = defaultValue;
            }
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    };

    return {
        value: storedValue,
        setValue,
        removeItem
    };
}

/**
 * Composition API hook for mouse position
 * @returns {Object} Mouse position state
 */
export function useMouse() {
    const x = ref(0);
    const y = ref(0);

    const update = (event) => {
        x.value = event.pageX;
        y.value = event.pageY;
    };

    onMounted(() => {
        window.addEventListener('mousemove', update);
    });

    onUnmounted(() => {
        window.removeEventListener('mousemove', update);
    });

    return { x, y };
}

/**
 * Composition API hook for handling forms
 * @param {Object} initialValues - Initial form values
 * @param {Function} validateFn - Validation function
 * @param {Function} onSubmit - Submit handler
 * @returns {Object} Form state and methods
 */
export function useForm(initialValues = {}, validateFn = null, onSubmit = null) {
    const values = reactive({ ...initialValues });
    const errors = reactive({});
    const touched = reactive({});
    const isSubmitting = ref(false);
    const isValid = computed(() => Object.keys(errors).length === 0);

    // Reset form to initial values
    const reset = () => {
        Object.keys(values).forEach(key => {
            values[key] = initialValues[key];
        });
        Object.keys(errors).forEach(key => {
            delete errors[key];
        });
        Object.keys(touched).forEach(key => {
            touched[key] = false;
        });
        isSubmitting.value = false;
    };

    // Set a single form value
    const setValue = (field, value) => {
        values[field] = value;
        touched[field] = true;

        if (validateFn) {
            const newErrors = validateFn(values);
            Object.keys(errors).forEach(key => {
                delete errors[key];
            });
            Object.entries(newErrors).forEach(([key, value]) => {
                errors[key] = value;
            });
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Mark all fields as touched
        Object.keys(values).forEach(key => {
            touched[key] = true;
        });

        // Validate form
        if (validateFn) {
            const newErrors = validateFn(values);
            Object.keys(errors).forEach(key => {
                delete errors[key];
            });
            Object.entries(newErrors).forEach(([key, value]) => {
                errors[key] = value;
            });

            if (Object.keys(newErrors).length > 0) {
                return;
            }
        }

        // Submit form
        if (onSubmit) {
            isSubmitting.value = true;
            try {
                await onSubmit(values);
            } finally {
                isSubmitting.value = false;
            }
        }
    };

    return {
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        setValue,
        reset,
        handleSubmit
    };
}

/**
 * Composition API hook for debounced values
 * @param {Ref} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Ref} Debounced value
 */
export function useDebounce(value, delay = 300) {
    const debouncedValue = ref(value.value);
    let timeout = null;

    watch(value, (newValue) => {
        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            debouncedValue.value = newValue;
        }, delay);
    });

    onUnmounted(() => {
        if (timeout) {
            clearTimeout(timeout);
        }
    });

    return debouncedValue;
}

/**
 * Composition API hook for async operations
 * @param {Function} asyncFunction - Async function to execute
 * @returns {Object} Async state and methods
 */
export function useAsync(asyncFunction) {
    const isLoading = ref(false);
    const error = ref(null);
    const data = ref(null);

    const execute = async (...args) => {
        isLoading.value = true;
        error.value = null;

        try {
            const result = await asyncFunction(...args);
            data.value = result;
            return result;
        } catch (err) {
            error.value = err;
            throw err;
        } finally {
            isLoading.value = false;
        }
    };

    return {
        isLoading,
        error,
        data,
        execute
    };
}