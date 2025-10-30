/**
 * Extension Testing Utilities
 * Helpers for common extension testing operations
 */

/**
 * Wait for extension to be fully loaded
 */
async function waitForExtensionLoad(page, timeout = 5000) {
    return page.evaluate(
        ({ timeoutMs }) => {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();

                const checkExtension = () => {
                    if (typeof window.__KALXJS__ !== 'undefined') {
                        resolve(window.__KALXJS__);
                    } else if (Date.now() - startTime > timeoutMs) {
                        reject(new Error('Extension load timeout'));
                    } else {
                        setTimeout(checkExtension, 100);
                    }
                };

                checkExtension();
            });
        },
        { timeoutMs: timeout }
    );
}

/**
 * Get framework info from page
 */
async function getFrameworkInfo(page) {
    return page.evaluate(() => ({
        version: window.__KALXJS__?.version,
        ready: window.__KALXJS__?.ready,
        componentCount: window.__KALXJS__?.components?.size || 0,
        hasHooks: window.__KALXJS__?.hooks instanceof Map,
        hasState: window.__KALXJS__?.state instanceof Map
    }));
}

/**
 * Get all components from page
 */
async function getComponents(page) {
    return page.evaluate(() => {
        const components = [];
        for (const [id, component] of window.__KALXJS__.components) {
            components.push({
                id,
                name: component.name,
                props: component.props || {},
                state: component.state || {},
                children: component.children?.length || 0
            });
        }
        return components;
    });
}

/**
 * Trigger state change on component
 */
async function updateComponentState(page, componentId, newState) {
    return page.evaluate(
        ({ id, state }) => {
            const component = window.__KALXJS__.components.get(id);
            if (component) {
                component.updateState(state);
                return true;
            }
            return false;
        },
        { id: componentId, state: newState }
    );
}

/**
 * Listen for specific event from page
 */
async function listenForEvent(page, eventName, timeout = 5000) {
    return page.evaluate(
        ({ name, timeoutMs }) => {
            return new Promise((resolve) => {
                const timeoutId = setTimeout(() => resolve(null), timeoutMs);

                window.addEventListener(name, (event) => {
                    clearTimeout(timeoutId);
                    resolve(event.detail);
                }, { once: true });
            });
        },
        { name: eventName, timeoutMs: timeout }
    );
}

/**
 * Get DevTools panel status
 */
async function getDevToolsStatus(context) {
    // Get all pages in context
    const pages = context.pages();

    for (const page of pages) {
        try {
            const url = page.url();
            if (url.includes('devtools://') || url.includes('chrome-extension://')) {
                const title = await page.title();
                return {
                    isOpen: true,
                    url,
                    title
                };
            }
        } catch (e) {
            // Page might be closed
        }
    }

    return { isOpen: false };
}

/**
 * Wait for console message
 */
async function waitForConsoleMessage(page, pattern, timeout = 5000) {
    return new Promise((resolve) => {
        const timeoutId = setTimeout(() => resolve(null), timeout);

        const handleMessage = (msg) => {
            if (msg.type() !== 'log' && msg.type() !== 'error') return;

            if (typeof pattern === 'string') {
                if (msg.text().includes(pattern)) {
                    clearTimeout(timeoutId);
                    page.off('console', handleMessage);
                    resolve(msg.text());
                }
            } else if (pattern instanceof RegExp) {
                if (pattern.test(msg.text())) {
                    clearTimeout(timeoutId);
                    page.off('console', handleMessage);
                    resolve(msg.text());
                }
            }
        };

        page.on('console', handleMessage);
    });
}

/**
 * Verify no console errors
 */
async function verifyNoErrors(page) {
    const errors = [];

    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });

    return {
        hasErrors: errors.length > 0,
        errors
    };
}

/**
 * Get extension network requests
 */
async function getNetworkRequests(page, resourceType = 'fetch') {
    const requests = [];

    page.on('request', (request) => {
        if (request.resourceType() === resourceType) {
            requests.push({
                url: request.url(),
                method: request.method(),
                postData: request.postData()
            });
        }
    });

    return requests;
}

export {
    waitForExtensionLoad,
    getFrameworkInfo,
    getComponents,
    updateComponentState,
    listenForEvent,
    getDevToolsStatus,
    waitForConsoleMessage,
    verifyNoErrors,
    getNetworkRequests
};