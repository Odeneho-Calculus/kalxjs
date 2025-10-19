/**
 * Test Framework Presets
 * Jest and Vitest configuration presets
 *
 * @module @kalxjs/testing/test-presets
 */

/**
 * Jest preset for KALXJS
 */
export const jestPreset = {
    testEnvironment: 'jsdom',
    testMatch: [
        '**/__tests__/**/*.(test|spec).[jt]s?(x)',
        '**/?(*.)+(test|spec).[jt]s?(x)',
    ],
    transform: {
        '^.+\\.klx$': '<rootDir>/node_modules/@kalxjs/jest-transformer',
        '^.+\\.[jt]sx?$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'klx', 'json'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx,klx}',
        '!src/**/*.d.ts',
        '!src/**/*.spec.{js,jsx,ts,tsx}',
        '!src/**/*.test.{js,jsx,ts,tsx}',
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
    globals: {
        __DEV__: true,
    },
};

/**
 * Vitest preset for KALXJS
 */
export const vitestPreset = {
    test: {
        environment: 'jsdom',
        include: [
            '**/__tests__/**/*.(test|spec).[jt]s?(x)',
            '**/?(*.)+(test|spec).[jt]s?(x)',
        ],
        globals: true,
        setupFiles: ['./vitest.setup.js'],
        coverage: {
            provider: 'c8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.{js,jsx,ts,tsx,klx}'],
            exclude: [
                'src/**/*.d.ts',
                'src/**/*.spec.{js,jsx,ts,tsx}',
                'src/**/*.test.{js,jsx,ts,tsx}',
            ],
            thresholds: {
                branches: 70,
                functions: 70,
                lines: 70,
                statements: 70,
            },
        },
    },
    resolve: {
        alias: {
            '@': './src',
        },
    },
};

/**
 * Create Jest setup file content
 */
export function createJestSetup() {
    return `
// Jest setup for KALXJS
import '@testing-library/jest-dom';
import { enableAutoUnmount } from '@kalxjs/core/testing';

// Auto unmount components after each test
enableAutoUnmount(afterEach);

// Mock browser APIs
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = jest.fn();

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  // Filter out expected warnings
  const message = args[0];
  if (typeof message === 'string' && message.includes('act()')) {
    return;
  }
  originalWarn(...args);
};
`.trim();
}

/**
 * Create Vitest setup file content
 */
export function createVitestSetup() {
    return `
// Vitest setup for KALXJS
import { expect } from 'vitest';
import { enableAutoUnmount } from '@kalxjs/core/testing';

// Auto unmount components after each test
enableAutoUnmount(afterEach);

// Mock browser APIs
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = vi.fn();
`.trim();
}

/**
 * Create test utilities helper file
 */
export function createTestUtils() {
    return `
/**
 * Test utilities for KALXJS applications
 */
import {
  mount,
  shallowMount,
  nextTick,
  flushPromises,
} from '@kalxjs/core/testing';

import {
  createMockRouter,
  createMockStore,
  createMockAPI,
  createMockFn,
} from '@kalxjs/core/testing/mocks';

import {
  click,
  type,
  clear,
  selectOptions,
  hover,
  keyboard,
  tab,
} from '@kalxjs/core/testing/user-events';

import {
  waitFor,
  waitForElement,
  waitForElementToBeRemoved,
  waitForDOMUpdate,
  act,
} from '@kalxjs/core/testing/async-utilities';

// Re-export everything
export {
  // Component testing
  mount,
  shallowMount,
  nextTick,
  flushPromises,

  // Mocks
  createMockRouter,
  createMockStore,
  createMockAPI,
  createMockFn,

  // User events
  click,
  type,
  clear,
  selectOptions,
  hover,
  keyboard,
  tab,

  // Async utilities
  waitFor,
  waitForElement,
  waitForElementToBeRemoved,
  waitForDOMUpdate,
  act,
};

/**
 * Create test wrapper with common utilities
 */
export function createTestWrapper(options = {}) {
  const {
    router = createMockRouter(),
    store = createMockStore(),
    api = createMockAPI(),
  } = options;

  return {
    router,
    store,
    api,
    mount: (component, mountOptions = {}) => {
      return mount(component, {
        ...mountOptions,
        global: {
          ...mountOptions.global,
          plugins: [
            ...(mountOptions.global?.plugins || []),
            { install: (app) => {
              app.config.globalProperties.$router = router;
              app.config.globalProperties.$store = store;
              app.config.globalProperties.$api = api;
            }},
          ],
        },
      });
    },
  };
}

/**
 * Create test component with common setup
 */
export function setupTest(component, options = {}) {
  const wrapper = createTestWrapper(options);
  const mounted = wrapper.mount(component, options.mountOptions);

  return {
    ...wrapper,
    wrapper: mounted,
    unmount: () => mounted.unmount(),
  };
}
`.trim();
}

/**
 * E2E testing configuration
 */
export const e2ePresets = {
    playwright: {
        use: {
            baseURL: 'http://localhost:3000',
            screenshot: 'only-on-failure',
            video: 'retain-on-failure',
        },
        webServer: {
            command: 'npm run dev',
            port: 3000,
            reuseExistingServer: true,
        },
    },

    cypress: {
        baseUrl: 'http://localhost:3000',
        viewportWidth: 1280,
        viewportHeight: 720,
        video: false,
        screenshotOnRunFailure: true,
        defaultCommandTimeout: 10000,
        requestTimeout: 10000,
        responseTimeout: 10000,
    },
};

/**
 * Coverage configuration
 */
export const coverageConfig = {
    statements: 70,
    branches: 70,
    functions: 70,
    lines: 70,
    exclude: [
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
    ],
};