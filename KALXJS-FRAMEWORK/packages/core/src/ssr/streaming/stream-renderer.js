/**
 * Streaming SSR - Render HTML in chunks for faster TTFB
 * Supports progressive HTML delivery
 */

import { Readable } from 'stream';

/**
 * Creates a streaming renderer
 * @param {Object} app - Application instance
 * @param {Object} options - Rendering options
 * @returns {Readable} Readable stream
 */
export function createStreamRenderer(app, options = {}) {
    const {
        onError,
        onShellReady,
        onAllReady,
        bootstrapScripts = [],
        bootstrapModules = []
    } = options;

    let hasError = false;
    let shellReady = false;
    let allReady = false;

    const chunks = [];
    let controller = null;

    /**
     * Stream implementation
     */
    const stream = new Readable({
        read() {
            // Stream chunks when requested
            if (chunks.length > 0) {
                const chunk = chunks.shift();
                this.push(chunk);
            }
        }
    });

    /**
     * Pushes HTML chunk to stream
     */
    const pushChunk = (html) => {
        if (hasError) return;

        const chunk = Buffer.from(html, 'utf8');
        chunks.push(chunk);
        stream.read();
    };

    /**
     * Pushes error chunk
     */
    const pushError = (error) => {
        hasError = true;

        if (onError) {
            onError(error);
        }

        const errorHtml = `
            <div data-kalxjs-error="true">
                <!-- Error occurred during rendering -->
            </div>
        `;

        pushChunk(errorHtml);
        stream.push(null); // End stream
    };

    /**
     * Renders the application in streaming mode
     */
    const render = async () => {
        try {
            // 1. Push initial HTML shell
            const shellHtml = renderShell(bootstrapScripts, bootstrapModules);
            pushChunk(shellHtml);

            shellReady = true;
            if (onShellReady) {
                onShellReady();
            }

            // 2. Render application content
            const appHtml = await renderApp(app);
            pushChunk(appHtml);

            // 3. Push closing HTML
            const closingHtml = renderClosing();
            pushChunk(closingHtml);

            allReady = true;
            if (onAllReady) {
                onAllReady();
            }

            // End stream
            stream.push(null);

        } catch (error) {
            pushError(error);
        }
    };

    // Start rendering
    setImmediate(render);

    return stream;
}

/**
 * Renders initial HTML shell
 */
function renderShell(scripts, modules) {
    const scriptTags = scripts.map(src =>
        `<script src="${src}"></script>`
    ).join('\n');

    const moduleTags = modules.map(src =>
        `<script type="module" src="${src}"></script>`
    ).join('\n');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${scriptTags}
            ${moduleTags}
        </head>
        <body>
            <div id="app">
    `;
}

/**
 * Renders application content
 */
async function renderApp(app) {
    // TODO: Implement actual app rendering
    // This should use the SSR renderer to convert components to HTML
    return `<div>App Content</div>`;
}

/**
 * Renders closing HTML
 */
function renderClosing() {
    return `
            </div>
        </body>
        </html>
    `;
}

/**
 * Renders to a Web Stream (for modern environments)
 */
export function renderToWebStream(app, options = {}) {
    const encoder = new TextEncoder();

    return new ReadableStream({
        async start(controller) {
            try {
                // Shell
                const shellHtml = renderShell(
                    options.bootstrapScripts || [],
                    options.bootstrapModules || []
                );
                controller.enqueue(encoder.encode(shellHtml));

                // App content
                const appHtml = await renderApp(app);
                controller.enqueue(encoder.encode(appHtml));

                // Closing
                const closingHtml = renderClosing();
                controller.enqueue(encoder.encode(closingHtml));

                controller.close();

            } catch (error) {
                if (options.onError) {
                    options.onError(error);
                }
                controller.error(error);
            }
        }
    });
}