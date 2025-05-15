export default {
    presets: [
        ['@babel/preset-env', {
            targets: { node: 'current' },
            modules: 'auto'  // Handle both CJS and ESM
        }]
    ]
};