/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation.
 *
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - The options object
 * @param {boolean} options.leading - Specify invoking on the leading edge of the timeout
 * @param {boolean} options.trailing - Specify invoking on the trailing edge of the timeout
 * @returns {Function} The debounced function
 */
export function debounce(func, wait = 300, options = {}) {
  const { leading = false, trailing = true } = options;

  let timeout;
  let result;
  let lastArgs;
  let lastThis;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let isInvoking = false;

  // Convert wait to number if it's not already
  const waitTime = +wait || 0;

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    isInvoking = true;

    result = func.apply(thisArg, args);
    isInvoking = false;

    return result;
  }

  function leadingEdge(time) {
    lastInvokeTime = time;
    // Schedule a trailing edge call
    timeout = setTimeout(timerExpired, waitTime);
    // Invoke the leading edge
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = waitTime - timeSinceLastCall;

    return trailing ? Math.min(timeWaiting, waitTime - timeSinceLastInvoke) : timeWaiting;
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined || // First call
      timeSinceLastCall >= waitTime || // Wait time elapsed
      timeSinceLastCall < 0 || // System time adjusted
      (trailing && timeSinceLastInvoke >= waitTime) // Trailing edge case
    );
  }

  function timerExpired() {
    const time = Date.now();

    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }

    // Restart the timer
    timeout = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timeout = undefined;

    // Only invoke if we have lastArgs, which means func has been called at least once
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }

    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }

    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeout = undefined;
  }

  function flush() {
    return timeout === undefined ? result : trailingEdge(Date.now());
  }

  function pending() {
    return timeout !== undefined;
  }

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeout === undefined) {
        return leadingEdge(lastCallTime);
      }

      if (isInvoking) {
        // Handle invocations in a tight loop
        clearTimeout(timeout);
        timeout = setTimeout(timerExpired, waitTime);
        return invokeFunc(lastCallTime);
      }
    }

    if (timeout === undefined) {
      timeout = setTimeout(timerExpired, waitTime);
    }

    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}