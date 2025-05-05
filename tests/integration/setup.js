/**
 * Setup file for kalxjs integration tests
 */

// Create a mock DOM environment for testing
if (typeof document === 'undefined') {
    global.document = {
        createElement: (tag) => ({
            tag,
            style: {},
            attributes: {},
            children: [],
            appendChild(child) {
                this.children.push(child);
            },
            addEventListener(event, handler) {
                this[`on${event}`] = handler;
            },
            removeEventListener(event) {
                this[`on${event}`] = null;
            },
            setAttribute(name, value) {
                this.attributes[name] = value;
            }
        }),
        createTextNode: (text) => ({
            nodeValue: text,
            textContent: text
        }),
        querySelector: (selector) => ({
            tag: 'div',
            id: selector.startsWith('#') ? selector.slice(1) : '',
            innerHTML: '',
            style: {},
            children: [],
            appendChild(child) {
                this.children.push(child);
            }
        })
    };

    global.window = {
        location: {
            hash: '#/',
            pathname: '/',
            href: 'http://localhost/',
            replace(url) {
                this.href = url;
            }
        },
        history: {
            pushState(state, title, url) {
                window.location.pathname = url;
            },
            replaceState(state, title, url) {
                window.location.pathname = url;
            },
            go() { }
        },
        addEventListener(event, handler) {
            this[`on${event}`] = handler;
        }
    };
}

// Utility function to reset DOM between tests
export function resetDOM() {
    document.body = document.createElement('body');
    // Don't try to set document.head directly
    // Instead, modify its content if needed
    document.head.innerHTML = '';
    // Add elements to head if needed
    const meta = document.createElement('meta');
    document.head.appendChild(meta);

    window.location.hash = '#/';
    window.location.pathname = '/';
}

// Helper to wait for next event loop tick
export function nextTick() {
    return new Promise(resolve => setTimeout(resolve, 0));
}