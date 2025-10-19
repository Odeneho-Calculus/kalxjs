/**
 * Edge-Optimized SSR Renderer
 * Minimal, fast rendering for edge environments
 */

import { detectRuntime, EdgeRuntime } from './runtime-detector.js';

/**
 * Edge Renderer configuration
 */
const config = {
    minifyOutput: true,
    streamResponse: true,
    cacheControl: 'public, max-age=3600',
    enableCompression: true
};

/**
 * Configure edge renderer
 * @param {Object} options - Configuration options
 */
export function configure(options = {}) {
    Object.assign(config, options);
}

/**
 * Render component to string (edge-optimized)
 * @param {Function} component - Component to render
 * @param {Object} props - Component props
 * @param {Object} options - Render options
 * @returns {Promise<string>} Rendered HTML
 */
export async function renderToString(component, props = {}, options = {}) {
    const startTime = performance.now();

    try {
        // Simplified rendering for edge (no heavy operations)
        let html = '';

        if (typeof component === 'function') {
            const result = component(props);
            html = renderVNode(result);
        } else {
            html = String(component);
        }

        // Add minimal hydration script
        if (options.addHydration !== false) {
            html += generateHydrationScript(props);
        }

        // Minify if enabled
        if (config.minifyOutput && options.minify !== false) {
            html = minifyHTML(html);
        }

        const renderTime = performance.now() - startTime;

        // Add performance headers
        if (options.includeMetrics) {
            return {
                html,
                metrics: {
                    renderTime,
                    size: new Blob([html]).size,
                    runtime: detectRuntime()
                }
            };
        }

        return html;
    } catch (error) {
        console.error('Edge render error:', error);
        return generateErrorHTML(error, options);
    }
}

/**
 * Render component to stream (edge-optimized)
 * @param {Function} component - Component to render
 * @param {Object} props - Component props
 * @returns {ReadableStream} HTML stream
 */
export function renderToStream(component, props = {}) {
    const runtime = detectRuntime();

    // Cloudflare Workers and other edge runtimes support Web Streams API
    return new ReadableStream({
        async start(controller) {
            try {
                // Send opening HTML
                controller.enqueue(new TextEncoder().encode('<!DOCTYPE html><html><head>'));
                controller.enqueue(new TextEncoder().encode('<meta charset="utf-8">'));
                controller.enqueue(new TextEncoder().encode('</head><body>'));

                // Render component
                const html = await renderToString(component, props, { addHydration: false });
                controller.enqueue(new TextEncoder().encode(html));

                // Send hydration script
                controller.enqueue(new TextEncoder().encode(generateHydrationScript(props)));

                // Close HTML
                controller.enqueue(new TextEncoder().encode('</body></html>'));

                controller.close();
            } catch (error) {
                controller.error(error);
            }
        }
    });
}

/**
 * Render VNode to HTML string
 * @param {Object} vnode - Virtual node
 * @returns {string} HTML
 */
function renderVNode(vnode) {
    if (vnode === null || vnode === undefined || typeof vnode === 'boolean') {
        return '';
    }

    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return escapeHTML(String(vnode));
    }

    if (Array.isArray(vnode)) {
        return vnode.map(renderVNode).join('');
    }

    if (typeof vnode === 'object') {
        const { type, props = {}, children = [] } = vnode;

        if (typeof type === 'string') {
            // HTML element
            const attrs = Object.entries(props)
                .filter(([key]) => key !== 'children')
                .map(([key, value]) => `${key}="${escapeHTML(String(value))}"`)
                .join(' ');

            const opening = attrs ? `<${type} ${attrs}>` : `<${type}>`;
            const content = Array.isArray(children)
                ? children.map(renderVNode).join('')
                : renderVNode(children);

            // Self-closing tags
            if (['img', 'br', 'hr', 'input', 'meta', 'link'].includes(type)) {
                return attrs ? `<${type} ${attrs} />` : `<${type} />`;
            }

            return `${opening}${content}</${type}>`;
        } else if (typeof type === 'function') {
            // Component
            const result = type(props);
            return renderVNode(result);
        }
    }

    return '';
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Minify HTML (basic minification)
 * @param {string} html - HTML to minify
 * @returns {string} Minified HTML
 */
function minifyHTML(html) {
    return html
        .replace(/>\s+</g, '><') // Remove whitespace between tags
        .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
        .trim();
}

/**
 * Generate hydration script
 * @param {Object} props - Initial props
 * @returns {string} Script tag
 */
function generateHydrationScript(props) {
    const serialized = JSON.stringify(props);
    return `<script>window.__KALXJS_INITIAL_STATE__=${serialized};(function(){/* Minimal hydration */})();</script>`;
}

/**
 * Generate error HTML
 * @param {Error} error - Error object
 * @param {Object} options - Options
 * @returns {string} Error HTML
 */
function generateErrorHTML(error, options = {}) {
    if (options.production) {
        return '<html><body><h1>500 - Internal Server Error</h1></body></html>';
    }

    return `
    <html>
      <body>
        <h1>Render Error</h1>
        <pre>${escapeHTML(error.stack || error.message)}</pre>
      </body>
    </html>
  `;
}

/**
 * Create Response with optimal headers
 * @param {string} html - HTML content
 * @param {Object} options - Response options
 * @returns {Response} Response object
 */
export function createHTMLResponse(html, options = {}) {
    const headers = new Headers({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': options.cacheControl || config.cacheControl,
        'X-Content-Type-Options': 'nosniff',
        ...options.headers
    });

    // Add compression hint
    if (config.enableCompression) {
        headers.set('Content-Encoding', 'gzip');
    }

    return new Response(html, {
        status: options.status || 200,
        headers
    });
}

/**
 * Create streaming Response
 * @param {ReadableStream} stream - HTML stream
 * @param {Object} options - Response options
 * @returns {Response} Response object
 */
export function createStreamResponse(stream, options = {}) {
    const headers = new Headers({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': options.cacheControl || 'no-cache',
        'Transfer-Encoding': 'chunked',
        ...options.headers
    });

    return new Response(stream, {
        status: options.status || 200,
        headers
    });
}

export default {
    configure,
    renderToString,
    renderToStream,
    createHTMLResponse,
    createStreamResponse
};