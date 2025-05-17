import { compile } from '@kalxjs/compiler';

/**
 * Webpack loader for KalxJS single-file components
 * @param {string} source - Source code
 * @returns {string} Compiled code
 */
export default function loader(source) {
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