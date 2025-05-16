export default {
    // Only include extensions that aren't automatically inferred
    extensionsToTreatAsEsm: ['.jsx'],

    // Transform JS files with Babel
    transform: {
        '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.js' }]
    },

    // Updated moduleNameMapper using plain strings instead of regex
    moduleNameMapper: {
        // Map package names to their source directories
        '@kalxjs/ai/(.*)$': '<rootDir>/packages/ai/src/$1',
        '@kalxjs/api/(.*)$': '<rootDir>/packages/api/src/$1',
        '@kalxjs/cli/(.*)$': '<rootDir>/packages/cli/src/$1',
        '@kalxjs/compiler/(.*)$': '<rootDir>/packages/compiler/src/$1',
        '@kalxjs/compiler-plugin/(.*)$': '<rootDir>/packages/compiler-plugin/src/$1',
        '@kalxjs/composition/(.*)$': '<rootDir>/packages/composition/src/$1',
        '@kalxjs/core/(.*)$': '<rootDir>/packages/core/src/$1',
        '@kalxjs/devtools/(.*)$': '<rootDir>/packages/devtools/src/$1',
        '@kalxjs/performance/(.*)$': '<rootDir>/packages/performance/src/$1',
        '@kalxjs/plugins/(.*)$': '<rootDir>/packages/plugins/src/$1',
        '@kalxjs/router/(.*)$': '<rootDir>/packages/router/src/$1',
        '@kalxjs/state/(.*)$': '<rootDir>/packages/state/src/$1',
        '@kalxjs/store/(.*)$': '<rootDir>/packages/store/src/$1',
        '@kalxjs/utils/(.*)$': '<rootDir>/packages/utils/src/$1',

        // Also add entries for direct module imports
        '@kalxjs/ai': '<rootDir>/packages/ai/src/index',
        '@kalxjs/api': '<rootDir>/packages/api/src/index',
        '@kalxjs/cli': '<rootDir>/packages/cli/src/index',
        '@kalxjs/compiler': '<rootDir>/packages/compiler/src/index',
        '@kalxjs/compiler-plugin': '<rootDir>/packages/compiler-plugin/src/index',
        '@kalxjs/composition': '<rootDir>/packages/composition/src/index',
        '@kalxjs/core': '<rootDir>/packages/core/src/index',
        '@kalxjs/devtools': '<rootDir>/packages/devtools/src/index',
        '@kalxjs/performance': '<rootDir>/packages/performance/src/index',
        '@kalxjs/plugins': '<rootDir>/packages/plugins/src/index',
        '@kalxjs/router': '<rootDir>/packages/router/src/index',
        '@kalxjs/state': '<rootDir>/packages/state/src/index',
        '@kalxjs/store': '<rootDir>/packages/store/src/index',
        '@kalxjs/utils': '<rootDir>/packages/utils/src/index'
    },

    // Configure test environment
    testEnvironment: 'jsdom',

    // Set up Jest globals
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // Don't ignore our packages
    transformIgnorePatterns: [
        '/node_modules/(?!(@kalxjs)/)'
    ],

    // Verbose output for debugging
    verbose: true,

    // Export test results to a file
    reporters: [
        'default',
        ['./jest-reporter.js', {}]
    ]
};