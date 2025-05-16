/**
 * @jest-environment jsdom
 */
import { 
  onMounted, 
  onUnmounted, 
  watch, 
  useWindowSize, 
  useLocalStorage, 
  useMouse, 
  useForm, 
  useDebounce, 
  useAsync 
} from '@kalxjs/composition';
import { ref, reactive, computed } from '@kalxjs/core';

// Mock the core module
jest.mock('@kalxjs/core', () => ({
  ref: jest.fn(val => ({
    value: val,
    __isRef: true
  })),
  reactive: jest.fn(obj => ({
    ...obj,
    __isReactive: true
  })),
  computed: jest.fn(fn => ({
    value: fn(),
    __isComputed: true
  }))
}));

describe('@kalxjs/composition', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset document.readyState
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get() { return 'complete'; }
    });
    
    // Mock setTimeout
    jest.useFakeTimers();
    
    // Mock window event listeners
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('onMounted', () => {
    test('should execute callback immediately if document is ready', () => {
      // Setup
      const callback = jest.fn();
      
      // Test
      onMounted(callback);
      jest.runAllTimers();
      
      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should add event listener if document is not ready', () => {
      // Setup
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get() { return 'loading'; }
      });
      
      const callback = jest.fn();
      
      // Test
      onMounted(callback);
      
      // Assert
      expect(document.addEventListener).toHaveBeenCalledWith(
        'DOMContentLoaded',
        callback,
        { once: true }
      );
    });

    test('should do nothing if callback is not provided', () => {
      // Test
      onMounted();
      jest.runAllTimers();
      
      // Assert
      expect(setTimeout).not.toHaveBeenCalled();
      expect(document.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('onUnmounted', () => {
    test('should add beforeunload event listener', () => {
      // Setup
      const callback = jest.fn();
      
      // Test
      onUnmounted(callback);
      
      // Assert
      expect(window.addEventListener).toHaveBeenCalledWith(
        'beforeunload',
        callback,
        { once: true }
      );
    });

    test('should do nothing if callback is not provided', () => {
      // Test
      onUnmounted();
      
      // Assert
      expect(window.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('watch', () => {
    test('should watch function source and call callback on change', () => {
      // Setup
      let value = 1;
      const source = () => value;
      const callback = jest.fn();
      
      // Test
      const stop = watch(source, callback);
      
      // No change yet
      jest.advanceTimersByTime(200);
      expect(callback).not.toHaveBeenCalled();
      
      // Change value
      value = 2;
      jest.advanceTimersByTime(200);
      
      // Assert
      expect(callback).toHaveBeenCalledWith(2, 1);
      
      // Cleanup
      stop();
    });

    test('should watch ref object and call callback on change', () => {
      // Setup
      const source = { value: 1 };
      const callback = jest.fn();
      
      // Test
      const stop = watch(source, callback);
      
      // No change yet
      jest.advanceTimersByTime(200);
      expect(callback).not.toHaveBeenCalled();
      
      // Change value
      source.value = 2;
      jest.advanceTimersByTime(200);
      
      // Assert
      expect(callback).toHaveBeenCalledWith(2, 1);
      
      // Cleanup
      stop();
    });

    test('should return cleanup function that clears interval', () => {
      // Setup
      const source = { value: 1 };
      const callback = jest.fn();
      
      // Test
      const stop = watch(source, callback);
      
      // Assert
      expect(typeof stop).toBe('function');
      
      // Call cleanup
      stop();
      
      // Change value after cleanup
      source.value = 2;
      jest.advanceTimersByTime(200);
      
      // Callback should not be called after cleanup
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('useWindowSize', () => {
    test('should return width, height and breakpoints', () => {
      // Setup - mock window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      Object.defineProperty(window, 'innerHeight', { value: 768 });
      
      // Test
      const { width, height, breakpoints } = useWindowSize();
      
      // Assert
      expect(width.value).toBe(1024);
      expect(height.value).toBe(768);
      expect(breakpoints.isMobile.value).toBe(false);
      expect(breakpoints.isTablet.value).toBe(false);
      expect(breakpoints.isDesktop.value).toBe(true);
      expect(breakpoints.isLargeDesktop.value).toBe(false);
    });

    test('should add resize event listener on mount', () => {
      // Test
      useWindowSize();
      
      // Assert
      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    test('should remove resize event listener on unmount', () => {
      // Test
      useWindowSize();
      
      // Get the updateSize function that was registered
      const updateSize = window.addEventListener.mock.calls[0][1];
      
      // Assert
      expect(window.removeEventListener).toHaveBeenCalledWith('resize', updateSize);
    });
  });

  describe('useLocalStorage', () => {
    beforeEach(() => {
      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    });

    test('should get initial value from localStorage', () => {
      // Setup
      window.localStorage.getItem.mockReturnValueOnce(JSON.stringify('stored value'));
      
      // Test
      const { value } = useLocalStorage('test-key', 'default value');
      
      // Assert
      expect(window.localStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(value.value).toBe('stored value');
    });

    test('should use default value if localStorage key does not exist', () => {
      // Setup
      window.localStorage.getItem.mockReturnValueOnce(null);
      
      // Test
      const { value } = useLocalStorage('test-key', 'default value');
      
      // Assert
      expect(value.value).toBe('default value');
    });

    test('should update localStorage when value is set', () => {
      // Setup
      const { value, setValue } = useLocalStorage('test-key', 'default value');
      
      // Test
      setValue('new value');
      
      // Assert
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify('new value')
      );
      expect(value.value).toBe('new value');
    });

    test('should handle function updater', () => {
      // Setup
      const { value, setValue } = useLocalStorage('test-key', 'default value');
      
      // Test
      setValue(prev => prev + ' updated');
      
      // Assert
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify('default value updated')
      );
      expect(value.value).toBe('default value updated');
    });

    test('should remove item from localStorage', () => {
      // Setup
      const { removeItem } = useLocalStorage('test-key', 'default value');
      
      // Test
      removeItem();
      
      // Assert
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    test('should handle localStorage errors', () => {
      // Setup
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      window.localStorage.getItem.mockImplementationOnce(() => {
        throw new Error('localStorage error');
      });
      
      // Test
      const { value } = useLocalStorage('test-key', 'default value');
      
      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      expect(value.value).toBe('default value');
      
      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('useMouse', () => {
    test('should return x and y coordinates', () => {
      // Test
      const { x, y } = useMouse();
      
      // Assert
      expect(x.value).toBe(0);
      expect(y.value).toBe(0);
    });

    test('should add mousemove event listener on mount', () => {
      // Test
      useMouse();
      
      // Assert
      expect(window.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    });

    test('should remove mousemove event listener on unmount', () => {
      // Test
      useMouse();
      
      // Get the update function that was registered
      const update = window.addEventListener.mock.calls[0][1];
      
      // Assert
      expect(window.removeEventListener).toHaveBeenCalledWith('mousemove', update);
    });

    test('should update coordinates on mousemove', () => {
      // Setup
      const { x, y } = useMouse();
      
      // Get the update function that was registered
      const update = window.addEventListener.mock.calls[0][1];
      
      // Test - simulate mousemove event
      update({ pageX: 100, pageY: 200 });
      
      // Assert
      expect(x.value).toBe(100);
      expect(y.value).toBe(200);
    });
  });

  describe('useForm', () => {
    test('should initialize with initial values', () => {
      // Setup
      const initialValues = { name: 'John', email: 'john@example.com' };
      
      // Test
      const { values } = useForm(initialValues);
      
      // Assert
      expect(values).toEqual(expect.objectContaining(initialValues));
    });

    test('should update value and mark as touched', () => {
      // Setup
      const initialValues = { name: '', email: '' };
      const { values, setValue, touched } = useForm(initialValues);
      
      // Test
      setValue('name', 'John');
      
      // Assert
      expect(values.name).toBe('John');
      expect(touched.name).toBe(true);
    });

    test('should validate on setValue if validateFn provided', () => {
      // Setup
      const initialValues = { name: '', email: '' };
      const validateFn = jest.fn().mockReturnValue({ name: 'Name is required' });
      
      const { setValue, errors } = useForm(initialValues, validateFn);
      
      // Test
      setValue('name', '');
      
      // Assert
      expect(validateFn).toHaveBeenCalledWith(expect.objectContaining(initialValues));
      expect(errors.name).toBe('Name is required');
    });

    test('should reset form to initial values', () => {
      // Setup
      const initialValues = { name: 'John', email: 'john@example.com' };
      const { values, setValue, reset, touched, errors } = useForm(initialValues);
      
      // Modify form
      setValue('name', 'Jane');
      errors.name = 'Some error';
      
      // Test
      reset();
      
      // Assert
      expect(values.name).toBe('John');
      expect(touched.name).toBe(false);
      expect(errors.name).toBeUndefined();
    });

    test('should handle form submission', async () => {
      // Setup
      const initialValues = { name: 'John' };
      const onSubmit = jest.fn().mockResolvedValue();
      
      const { handleSubmit, isSubmitting } = useForm(initialValues, null, onSubmit);
      
      // Test
      const submitPromise = handleSubmit();
      
      // Assert - during submission
      expect(isSubmitting.value).toBe(true);
      
      // Wait for submission to complete
      await submitPromise;
      
      // Assert - after submission
      expect(onSubmit).toHaveBeenCalledWith(initialValues);
      expect(isSubmitting.value).toBe(false);
    });

    test('should validate before submission', async () => {
      // Setup
      const initialValues = { name: '' };
      const validateFn = jest.fn().mockReturnValue({ name: 'Name is required' });
      const onSubmit = jest.fn();
      
      const { handleSubmit } = useForm(initialValues, validateFn, onSubmit);
      
      // Test
      await handleSubmit();
      
      // Assert
      expect(validateFn).toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled(); // Should not submit if validation fails
    });

    test('should mark all fields as touched on submission', async () => {
      // Setup
      const initialValues = { name: 'John', email: 'john@example.com' };
      const { handleSubmit, touched } = useForm(initialValues);
      
      // Test
      await handleSubmit();
      
      // Assert
      expect(touched.name).toBe(true);
      expect(touched.email).toBe(true);
    });
  });

  describe('useDebounce', () => {
    test('should debounce value changes', () => {
      // Setup
      const value = { value: 'initial' };
      
      // Test
      const debouncedValue = useDebounce(value, 500);
      
      // Initial value should be set immediately
      expect(debouncedValue.value).toBe('initial');
      
      // Change value
      value.value = 'changed';
      
      // Value should not change immediately
      expect(debouncedValue.value).toBe('initial');
      
      // Advance time but not enough to trigger update
      jest.advanceTimersByTime(300);
      expect(debouncedValue.value).toBe('initial');
      
      // Advance time to trigger update
      jest.advanceTimersByTime(200);
      expect(debouncedValue.value).toBe('changed');
    });

    test('should clear timeout on unmount', () => {
      // Setup
      const value = { value: 'initial' };
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      // Test
      useDebounce(value, 500);
      
      // Change value to set up timeout
      value.value = 'changed';
      
      // Simulate unmount
      const unmountCallback = window.addEventListener.mock.calls.find(
        call => call[0] === 'beforeunload'
      )[1];
      
      unmountCallback();
      
      // Assert
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('useAsync', () => {
    test('should execute async function and track loading state', async () => {
      // Setup
      const asyncFn = jest.fn().mockResolvedValue('result');
      
      // Test
      const { execute, isLoading, data, error } = useAsync(asyncFn);
      
      // Initial state
      expect(isLoading.value).toBe(false);
      expect(data.value).toBe(null);
      expect(error.value).toBe(null);
      
      // Start execution
      const promise = execute('arg1', 'arg2');
      
      // During execution
      expect(isLoading.value).toBe(true);
      expect(asyncFn).toHaveBeenCalledWith('arg1', 'arg2');
      
      // After execution
      await promise;
      expect(isLoading.value).toBe(false);
      expect(data.value).toBe('result');
      expect(error.value).toBe(null);
    });

    test('should handle errors', async () => {
      // Setup
      const testError = new Error('Test error');
      const asyncFn = jest.fn().mockRejectedValue(testError);
      
      // Test
      const { execute, isLoading, data, error } = useAsync(asyncFn);
      
      // Start execution
      try {
        await execute();
        fail('Should have thrown an error');
      } catch (err) {
        // Assert
        expect(err).toBe(testError);
        expect(isLoading.value).toBe(false);
        expect(data.value).toBe(null);
        expect(error.value).toBe(testError);
      }
    });
  });
});