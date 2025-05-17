import { compile } from '@kalxjs/compiler';

/**
 * Webpack loader for KalxJS single-file components
 * @param {string} source - Source code
 * @returns {string} Compiled code
 */
export function loader(source) {
    const callback = this.async();
    const options = this.getOptions() || {};
    const filename = this.resourcePath;

    try {
        const result = compile(source, {
            filename,
            ...options
        });

        callback(null, result.code);
    } catch (err) {
        callback(err);
    }
}

/**
 * Webpack plugin for KalxJS single-file components
 */
export class WebpackPlugin {
    constructor(options = {}) {
        this.options = options;
    }

    apply(compiler) {
        compiler.hooks.beforeCompile.tap('KalxJSWebpackPlugin', () => {
            // Register the loader
            const rules = compiler.options.module.rules;
            const klxRule = rules.find(rule =>
                rule.test && rule.test.toString().includes('.klx')
            );

            if (!klxRule) {
                rules.push({
                    test: /\.klx$/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                presets: ['@babel/preset-env']
                            }
                        },
                        {
                            loader: require.resolve('./loader.js'),
                            options: this.options
                        }
                    ]
                });
            }
        });
    }
}

/**
 * Rollup plugin for KalxJS single-file components
 * @param {Object} options - Plugin options
 * @returns {Object} Rollup plugin
 */
export function rollupPlugin(options = {}) {
    return {
        name: 'kalxjs',
        transform(code, id) {
            if (!id.endsWith('.klx')) return null;

            try {
                const result = compile(code, {
                    filename: id,
                    ...options
                });

                return {
                    code: result.code,
                    map: result.map
                };
            } catch (err) {
                this.error(err);
                return null;
            }
        }
    };
}

// Export a default plugin factory function
export default function createPlugin(options = {}) {
    return {
        webpack: new WebpackPlugin(options),
        rollup: rollupPlugin(options)
    };
}