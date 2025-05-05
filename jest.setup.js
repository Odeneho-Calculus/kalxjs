// Make Jest globals available
import { jest } from '@jest/globals';
global.jest = jest;

// Set up DOM environment helpers
global.resetDOM = function () {
    document.body.innerHTML = '';
    document.head.innerHTML = '';

    // Add a meta tag to head
    const meta = document.createElement('meta');
    document.head.appendChild(meta);

    // Reset location properties
    window.location.hash = '#/';
    window.location.pathname = '/';

    // Mock history methods for testing
    window.history.pushState = jest.fn();
    window.history.replaceState = jest.fn();
};

// Helper for async testing
global.nextTick = function () {
    return new Promise(resolve => setTimeout(resolve, 0));
};

// Silence the punycode deprecation warning during tests
const originalConsoleWarn = console.warn;
console.warn = function (message) {
    if (message && message.toString().includes('punycode')) {
        return;
    }
    // Keep the original behavior for other warnings
    originalConsoleWarn.apply(console, arguments);
};

// Before each test, set up history mocks
beforeEach(() => {
    // Mock history methods
    window.history.pushState = jest.fn();
    window.history.replaceState = jest.fn();
});

// Ensure the mock is restored after each test
afterEach(() => {
    console.warn = originalConsoleWarn;
});