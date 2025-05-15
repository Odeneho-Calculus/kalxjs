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
        '@kalxjs/core/(.*)$': '<rootDir>/packages/core/src/$1',
        '@kalxjs/router/(.*)$': '<rootDir>/packages/router/src/$1',
        '@kalxjs/state/(.*)$': '<rootDir>/packages/state/src/$1',
        

        // Also add entries for direct module imports
        '@kalxjs/core': '<rootDir>/packages/core/src/index',
        '@kalxjs/router': '<rootDir>/packages/router/src/index',
        '@kalxjs/state': '<rootDir>/packages/state/src/index'
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
    verbose: true
};