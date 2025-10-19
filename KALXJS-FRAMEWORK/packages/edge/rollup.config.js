import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const external = ['@kalxjs/core'];

const createConfig = (input, outputFile, formats = ['cjs', 'es']) => {
    const outputs = [];

    if (formats.includes('cjs')) {
        outputs.push({
            file: `dist/${outputFile}.cjs.js`,
            format: 'cjs',
            exports: 'named'
        });
    }

    if (formats.includes('es')) {
        outputs.push({
            file: `dist/${outputFile}.esm.js`,
            format: 'es'
        });
    }

    return {
        input,
        output: outputs,
        external,
        plugins: [
            resolve(),
            commonjs()
        ]
    };
};

export default [
    createConfig('src/index.js', 'index'),
    createConfig('src/cloudflare/index.js', 'cloudflare'),
    createConfig('src/deno/index.js', 'deno', ['es']), // Deno only supports ES modules
    createConfig('src/vercel/index.js', 'vercel')
];