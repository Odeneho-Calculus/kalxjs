/**
 * KalxJS Application Configuration
 */
const config = {
    name: '{{projectName}}',
    version: '0.1.0',
    description: 'A powerful KalxJS application',

    // Environment settings
    env: {
        development: {
            apiBaseUrl: 'http://localhost:3000/api',
            debug: true
        },
        production: {
            apiBaseUrl: '/api',
            debug: false
        }
    },

    // Feature flags
    features: {
        router: true,
        state: true,
        scss: true,
        sfc: true,
        api: true,
        composition: true,
        performance: true,
        plugins: true,
        testing: true,
        linting: true,
        customRenderer: true
    }
};

// Support both CommonJS and ES modules
export default config;

// For CommonJS compatibility
if (typeof module !== 'undefined') {
    module.exports = config;
}