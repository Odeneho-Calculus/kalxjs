/**
 * @kalxjs/compiler - CSS Preprocessor Support
 * Supports SCSS, Less, and Stylus preprocessors for .klx files
 *
 * Features:
 * - SCSS/SASS compilation
 * - Less compilation
 * - Stylus compilation
 * - Auto-detection based on lang attribute
 *
 * @module @kalxjs/compiler/css/preprocessors
 */

/**
 * Process CSS with preprocessor
 * @param {string} css - CSS/preprocessor code
 * @param {object} options - Processing options
 * @returns {Promise<object>} - Processed CSS
 */
export async function processWithPreprocessor(css, options = {}) {
    const {
        lang = 'css',
        filename = 'anonymous.css',
        sourceMap = false
    } = options;

    console.log(`[preprocessors] Processing ${lang} code`);

    try {
        switch (lang) {
            case 'scss':
            case 'sass':
                return await compileSCSS(css, { filename, sourceMap, indentedSyntax: lang === 'sass' });

            case 'less':
                return await compileLess(css, { filename, sourceMap });

            case 'stylus':
            case 'styl':
                return await compileStylus(css, { filename, sourceMap });

            default:
                // Plain CSS
                return { css, map: null };
        }
    } catch (error) {
        console.error(`[preprocessors] Error processing ${lang}:`, error);
        throw new Error(`Failed to process ${lang} in ${filename}: ${error.message}`);
    }
}

/**
 * Compile SCSS/SASS to CSS
 */
async function compileSCSS(scss, options = {}) {
    const { filename, sourceMap, indentedSyntax = false } = options;

    try {
        // Try to import sass (must be installed by user)
        const sass = await import('sass').catch(() => null);

        if (!sass) {
            console.warn('[preprocessors] sass package not installed, skipping SCSS compilation');
            return { css: scss, map: null };
        }

        const result = sass.default.compileString(scss, {
            syntax: indentedSyntax ? 'indented' : 'scss',
            sourceMap: sourceMap,
            url: new URL(`file://${filename}`)
        });

        console.log('[preprocessors] SCSS compilation successful');

        return {
            css: result.css.toString(),
            map: sourceMap && result.sourceMap ? result.sourceMap : null
        };

    } catch (error) {
        throw new Error(`SCSS compilation error: ${error.message}`);
    }
}

/**
 * Compile Less to CSS
 */
async function compileLess(less, options = {}) {
    const { filename, sourceMap } = options;

    try {
        // Try to import less (must be installed by user)
        const lessModule = await import('less').catch(() => null);

        if (!lessModule) {
            console.warn('[preprocessors] less package not installed, skipping Less compilation');
            return { css: less, map: null };
        }

        const result = await lessModule.default.render(less, {
            filename,
            sourceMap: sourceMap ? {} : false
        });

        console.log('[preprocessors] Less compilation successful');

        return {
            css: result.css,
            map: sourceMap && result.map ? JSON.parse(result.map) : null
        };

    } catch (error) {
        throw new Error(`Less compilation error: ${error.message}`);
    }
}

/**
 * Compile Stylus to CSS
 */
async function compileStylus(stylus, options = {}) {
    const { filename, sourceMap } = options;

    try {
        // Try to import stylus (must be installed by user)
        const stylusModule = await import('stylus').catch(() => null);

        if (!stylusModule) {
            console.warn('[preprocessors] stylus package not installed, skipping Stylus compilation');
            return { css: stylus, map: null };
        }

        const renderer = stylusModule.default(stylus)
            .set('filename', filename)
            .set('sourcemap', sourceMap ? {} : false);

        const result = await new Promise((resolve, reject) => {
            renderer.render((err, css) => {
                if (err) reject(err);
                else resolve({ css, map: renderer.sourcemap });
            });
        });

        console.log('[preprocessors] Stylus compilation successful');

        return {
            css: result.css,
            map: sourceMap && result.map ? result.map : null
        };

    } catch (error) {
        throw new Error(`Stylus compilation error: ${error.message}`);
    }
}

/**
 * Detect preprocessor from lang attribute
 */
export function detectPreprocessor(attrs = {}) {
    const lang = attrs.lang || 'css';
    return ['scss', 'sass', 'less', 'stylus', 'styl'].includes(lang) ? lang : null;
}

/**
 * Get required peer dependencies for preprocessor
 */
export function getPreprocessorDependency(lang) {
    const deps = {
        scss: 'sass',
        sass: 'sass',
        less: 'less',
        stylus: 'stylus',
        styl: 'stylus'
    };

    return deps[lang] || null;
}

export default {
    processWithPreprocessor,
    detectPreprocessor,
    getPreprocessorDependency
};