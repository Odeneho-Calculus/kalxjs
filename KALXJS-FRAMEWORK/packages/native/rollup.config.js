import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const external = ['@kalxjs/core', 'electron', '@tauri-apps/api'];

const createConfig = (input, outputFile) => ({
    input,
    output: [
        {
            file: `dist/${outputFile}.cjs.js`,
            format: 'cjs',
            exports: 'named'
        },
        {
            file: `dist/${outputFile}.esm.js`,
            format: 'es'
        }
    ],
    external,
    plugins: [
        resolve(),
        commonjs()
    ]
});

export default [
    createConfig('src/index.js', 'index'),
    createConfig('src/electron/index.js', 'electron'),
    createConfig('src/tauri/index.js', 'tauri'),
    createConfig('src/mobile/index.js', 'mobile')
];