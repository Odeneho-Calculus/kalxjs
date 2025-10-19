/**
 * Screen Reader Optimizations
 * Live region announcements and screen reader utilities
 *
 * @module @kalxjs/a11y/screen-reader
 */

/**
 * Live region priorities
 */
export const LivePriority = {
    OFF: 'off',
    POLITE: 'polite',
    ASSERTIVE: 'assertive',
};

/**
 * Create live region announcer
 */
export function createAnnouncer(options = {}) {
    const {
        id = 'kalxjs-announcer',
        priority = LivePriority.POLITE,
    } = options;

    let element = document.getElementById(id);

    // Create announcer element if it doesn't exist
    if (!element) {
        element = document.createElement('div');
        element.id = id;
        element.setAttribute('role', 'status');
        element.setAttribute('aria-live', priority);
        element.setAttribute('aria-atomic', 'true');
        element.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
        document.body.appendChild(element);
    }

    function announce(message, customPriority) {
        if (!message) return;

        // Update priority if specified
        if (customPriority && customPriority !== priority) {
            element.setAttribute('aria-live', customPriority);
        }

        // Clear and set message
        element.textContent = '';

        // Use setTimeout to ensure screen readers detect the change
        setTimeout(() => {
            element.textContent = message;
        }, 100);
    }

    function clear() {
        element.textContent = '';
    }

    function destroy() {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    return {
        announce,
        clear,
        destroy,
        element,
    };
}

/**
 * Global announcer instance
 */
let globalAnnouncer = null;

export function getGlobalAnnouncer() {
    if (!globalAnnouncer) {
        globalAnnouncer = createAnnouncer();
    }
    return globalAnnouncer;
}

/**
 * Announce message to screen readers
 */
export function announce(message, priority = LivePriority.POLITE) {
    const announcer = getGlobalAnnouncer();
    announcer.announce(message, priority);
}

/**
 * Announce assertively (interrupts screen reader)
 */
export function announceAssertive(message) {
    announce(message, LivePriority.ASSERTIVE);
}

/**
 * Announce politely (waits for screen reader to finish)
 */
export function announcePolite(message) {
    announce(message, LivePriority.POLITE);
}

/**
 * Create status message component
 */
export function createStatusMessage(message, options = {}) {
    const {
        priority = LivePriority.POLITE,
        role = 'status',
        timeout = null,
    } = options;

    const element = document.createElement('div');
    element.setAttribute('role', role);
    element.setAttribute('aria-live', priority);
    element.setAttribute('aria-atomic', 'true');
    element.textContent = message;

    if (timeout) {
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, timeout);
    }

    return element;
}

/**
 * Visually hidden but accessible to screen readers
 */
export function createVisuallyHidden(content) {
    const element = document.createElement('span');
    element.className = 'sr-only';
    element.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  `;

    if (typeof content === 'string') {
        element.textContent = content;
    } else {
        element.appendChild(content);
    }

    return element;
}

/**
 * Create loading announcer
 */
export function createLoadingAnnouncer(options = {}) {
    const {
        loadingMessage = 'Loading...',
        completeMessage = 'Loading complete',
        errorMessage = 'Loading failed',
    } = options;

    const announcer = createAnnouncer({ priority: LivePriority.POLITE });

    return {
        start() {
            announcer.announce(loadingMessage);
        },
        complete() {
            announcer.announce(completeMessage);
        },
        error(error) {
            announcer.announce(errorMessage);
        },
        destroy() {
            announcer.destroy();
        },
    };
}

/**
 * Create progress announcer
 */
export function createProgressAnnouncer(options = {}) {
    const {
        interval = 10, // Announce every 10%
        formatter = (percent) => `${percent}% complete`,
    } = options;

    const announcer = createAnnouncer({ priority: LivePriority.POLITE });
    let lastAnnounced = 0;

    function update(percent) {
        const rounded = Math.floor(percent / interval) * interval;

        if (rounded !== lastAnnounced && rounded >= 0 && rounded <= 100) {
            announcer.announce(formatter(rounded));
            lastAnnounced = rounded;
        }
    }

    function complete() {
        announcer.announce(formatter(100));
    }

    function destroy() {
        announcer.destroy();
    }

    return {
        update,
        complete,
        destroy,
    };
}

/**
 * Check if screen reader is active (heuristic)
 */
export function isScreenReaderActive() {
    // This is a heuristic and may not be 100% accurate
    // Check for common screen reader indicators
    return (
        // Check for NVDA or JAWS
        window.navigator.userAgent.includes('NVDA') ||
        window.navigator.userAgent.includes('JAWS') ||
        // Check for VoiceOver (Mac/iOS)
        (window.navigator.vendor.includes('Apple') &&
            window.navigator.maxTouchPoints > 0)
    );
}

/**
 * Add screen reader only text
 */
export function addScreenReaderText(element, text) {
    const srElement = createVisuallyHidden(text);
    element.appendChild(srElement);
    return srElement;
}

/**
 * Create alert component
 */
export function createAlert(message, options = {}) {
    const { type = 'info', timeout = 5000 } = options;

    const alert = document.createElement('div');
    alert.setAttribute('role', 'alert');
    alert.setAttribute('aria-live', 'assertive');
    alert.setAttribute('aria-atomic', 'true');
    alert.setAttribute('data-alert-type', type);
    alert.textContent = message;

    if (timeout) {
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, timeout);
    }

    return alert;
}