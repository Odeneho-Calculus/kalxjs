import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to read package.json
const readPackageJson = (pkgPath) => {
    const content = readFileSync(path.join(__dirname, pkgPath, 'package.json'), 'utf8');
    return JSON.parse(content);
};

// Common config for all packages
const createConfig = (pkgPath) => {
    const pkg = readPackageJson(pkgPath);
    const input = path.join(__dirname, pkgPath, 'src/index.js');

    return {
        input,
        output: [
            {
                file: path.join(__dirname, pkgPath, pkg.main || 'dist/index.cjs.js'),
                format: 'cjs',
                exports: 'auto'
            },
            {
                file: path.join(__dirname, pkgPath, pkg.module || 'dist/index.esm.js'),
                format: 'es'
            }
        ],
        plugins: [
            nodeResolve(),
            terser()
        ],
        external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
        onwarn(warning, warn) {
            // Suppress circular dependency warnings
            if (warning.code === 'CIRCULAR_DEPENDENCY') return;
            warn(warning);
        }
    };
};

export default [
    'packages/core',
    'packages/router',
    'packages/state',
    'packages/devtools',
    'packages/compiler',
    'packages/ai',
    'packages/api',
    'packages/composition',
    'packages/performance',
    'packages/plugins'
].map(pkgPath => createConfig(pkgPath));
