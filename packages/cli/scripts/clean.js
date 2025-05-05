const { rimraf } = require('rimraf');
const path = require('path');
const { glob } = require('glob');

async function clean() {
    const rootDir = path.resolve(__dirname, '..');
    const patterns = [
        'templates/**/node_modules',
        'templates/**/dist',
        'dist'
    ].map(pattern => path.join(rootDir, pattern));

    try {
        // Use glob to safely get paths
        const matches = await glob(patterns);

        // Delete each matched path
        for (const match of matches) {
            await rimraf(match);
        }

        console.log('Cleanup completed successfully!');
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

clean();
