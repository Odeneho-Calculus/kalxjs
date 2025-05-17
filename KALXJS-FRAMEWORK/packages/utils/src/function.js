// packages/utils/src/function.js

/**
 * Creates a debounced function that delays invoking `fn` until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} fn The function to debounce
 * @param {number} wait The number of milliseconds to delay
 * @param {boolean} immediate Specify invoking on the leading edge of the timeout
 * @returns {Function} The debounced function
 */
export function debounce(fn, wait = 300, immediate = false) {
  let timeout;
  
  return function(...args) {
    const context = this;
    const later = function() {
      timeout = null;
      if (!immediate) fn.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) fn.apply(context, args);
  };
}

/**
 * Creates a throttled function that only invokes `fn` at most once per
 * every `wait` milliseconds.
 * 
 * @param {Function} fn The function to throttle
 * @param {number} wait The number of milliseconds to throttle invocations to
 * @param {Object} options The options object
 * @param {boolean} options.leading Specify invoking on the leading edge of the timeout
 * @param {boolean} options.trailing Specify invoking on the trailing edge of the timeout
 * @returns {Function} The throttled function
 */
export function throttle(fn, wait = 300, options = {}) {
  let context, args, result;
  let timeout = null;
  let previous = 0;
  
  if (!options) options = {};
  
  const later = function() {
    previous = options.leading === false ? 0 : Date.now();
    timeout = null;
    result = fn.apply(context, args);
    if (!timeout) context = args = null;
  };
  
  return function(...params) {
    const now = Date.now();
    if (!previous && options.leading === false) previous = now;
    
    const remaining = wait - (now - previous);
    context = this;
    args = params;
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      
      previous = now;
      result = fn.apply(context, args);
      
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    
    return result;
  };
}

/**
 * Creates a function that is restricted to be called only once.
 * Repeat calls to the function return the value of the first invocation.
 * 
 * @param {Function} fn The function to restrict
 * @returns {Function} The restricted function
 */
export function once(fn) {
  let called = false;
  let result;
  
  return function(...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    
    return result;
  };
}

/**
 * Creates a memoized function that caches the result of `fn` based on the arguments provided.
 * 
 * @param {Function} fn The function to memoize
 * @param {Function} resolver The function to resolve the cache key
 * @returns {Function} The memoized function
 */
export function memoize(fn, resolver) {
  const memoized = function(...args) {
    const key = resolver ? resolver.apply(this, args) : args[0];
    const cache = memoized.cache;
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  
  memoized.cache = new Map();
  return memoized;
}

/**
 * Creates a function that negates the result of the predicate `fn`.
 * 
 * @param {Function} fn The predicate to negate
 * @returns {Function} The negated function
 */
export function negate(fn) {
  return function(...args) {
    return !fn.apply(this, args);
  };
}