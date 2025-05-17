// @kalxjs/core - Server-side rendering with hydration

/**
 * Creates a server renderer for KalxJS
 * @param {Object} options - Server renderer options
 * @returns {Object} Server renderer
 */
export function createServerRenderer(options = {}) {
    const {
        template = '<!DOCTYPE html><html><head></head><body><!--kalxjs-ssr-outlet--></body></html>',
        inject = true,
        clientManifest = null,
        runInNewContext = false,
        basedir = process.cwd(),
        cache = new Map(),
        maxCacheSize = 1000,
        directives = {},
        serializer = JSON.stringify,
        deserializer = JSON.parse
    } = options;

    // Find the outlet placeholder in the template
    const outlet = '<!--kalxjs-ssr-outlet-->';
    const outletIndex = template.indexOf(outlet);

    if (outletIndex < 0) {
        throw new Error('Invalid SSR template: missing outlet placeholder <!--kalxjs-ssr-outlet-->');
    }

    // Split the template into head and tail
    const head = template.slice(0, outletIndex);
    const tail = template.slice(outletIndex + outlet.length);

    /**
     * Renders a component to HTML
     * @param {Object} app - KalxJS app
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderToString = async (app, context = {}) => {
        // Check cache first
        const cacheKey = getCacheKey(app, context);

        if (cacheKey && cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }

        // Create a new context for rendering
        const renderContext = {
            ...context,
            _styles: new Set(),
            _scripts: new Set(),
            _links: new Set(),
            _metas: new Set(),
            _hydrationState: {},
            _teleports: {},
            _ssrContext: true
        };

        try {
            // Render the app to a string
            const appHtml = await renderComponentToString(app, renderContext);

            // Generate the full HTML
            let html = head + appHtml + tail;

            // Inject styles, scripts, links, and metas
            if (inject) {
                html = injectResources(html, renderContext);
            }

            // Inject hydration state
            html = injectHydrationState(html, renderContext);

            // Cache the result
            if (cacheKey) {
                // Implement LRU cache behavior
                if (cache.size >= maxCacheSize) {
                    const firstKey = cache.keys().next().value;
                    cache.delete(firstKey);
                }

                cache.set(cacheKey, html);
            }

            return html;
        } catch (error) {
            console.error('Error rendering to string:', error);
            throw error;
        }
    };

    /**
     * Renders a component to a stream
     * @param {Object} app - KalxJS app
     * @param {Object} context - Render context
     * @returns {ReadableStream} Rendered stream
     */
    const renderToStream = (app, context = {}) => {
        // Create a new context for rendering
        const renderContext = {
            ...context,
            _styles: new Set(),
            _scripts: new Set(),
            _links: new Set(),
            _metas: new Set(),
            _hydrationState: {},
            _teleports: {},
            _ssrContext: true
        };

        // Create a readable stream
        const { Readable } = require('stream');
        const stream = new Readable({
            read() { }
        });

        // Write the head
        stream.push(head);

        // Render the app to a stream
        const appStream = renderComponentToStream(app, renderContext);

        appStream.on('data', (chunk) => {
            stream.push(chunk);
        });

        appStream.on('end', () => {
            // Inject styles, scripts, links, and metas
            let tailHtml = tail;

            if (inject) {
                tailHtml = injectResources(tailHtml, renderContext);
            }

            // Inject hydration state
            tailHtml = injectHydrationState(tailHtml, renderContext);

            // Write the tail
            stream.push(tailHtml);
            stream.push(null);
        });

        appStream.on('error', (error) => {
            console.error('Error rendering to stream:', error);
            stream.emit('error', error);
        });

        return stream;
    };

    /**
     * Renders a component to a string
     * @param {Object} component - Component to render
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderComponentToString = async (component, context) => {
        // Create a virtual DOM tree
        const vnode = createVNode(component, context);

        // Render the virtual DOM tree to a string
        return renderVNodeToString(vnode, context);
    };

    /**
     * Renders a component to a stream
     * @param {Object} component - Component to render
     * @param {Object} context - Render context
     * @returns {ReadableStream} Rendered stream
     */
    const renderComponentToStream = (component, context) => {
        // Create a virtual DOM tree
        const vnode = createVNode(component, context);

        // Render the virtual DOM tree to a stream
        return renderVNodeToStream(vnode, context);
    };

    /**
     * Creates a virtual DOM node
     * @param {Object} component - Component to render
     * @param {Object} context - Render context
     * @returns {Object} Virtual DOM node
     */
    const createVNode = (component, context) => {
        // If component is an app instance, get the root component
        if (component.$options && component.$options._component) {
            return h(component.$options._component, context);
        }

        // If component is a component definition, create a vnode
        return h(component, context);
    };

    /**
     * Renders a virtual DOM node to a string
     * @param {Object} vnode - Virtual DOM node
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderVNodeToString = async (vnode, context) => {
        // If vnode is null or undefined, return empty string
        if (!vnode) {
            return '';
        }

        // If vnode is a string, return it
        if (typeof vnode === 'string') {
            return escapeHtml(vnode);
        }

        // If vnode is a number, return it as a string
        if (typeof vnode === 'number') {
            return String(vnode);
        }

        // If vnode is a component, render it
        if (vnode.type && typeof vnode.type === 'object') {
            return renderComponentVNodeToString(vnode, context);
        }

        // If vnode is an element, render it
        if (vnode.type && typeof vnode.type === 'string') {
            return renderElementVNodeToString(vnode, context);
        }

        // If vnode is a fragment, render its children
        if (vnode.type === Symbol.for('fragment')) {
            return renderFragmentVNodeToString(vnode, context);
        }

        // If vnode is a teleport, render it
        if (vnode.type === Symbol.for('teleport')) {
            return renderTeleportVNodeToString(vnode, context);
        }

        // If vnode is a suspense, render it
        if (vnode.type === Symbol.for('suspense')) {
            return renderSuspenseVNodeToString(vnode, context);
        }

        // If vnode is a function, call it and render the result
        if (typeof vnode.type === 'function') {
            const result = vnode.type(vnode.props || {});
            return renderVNodeToString(result, context);
        }

        // If vnode is an array, render each item
        if (Array.isArray(vnode)) {
            let html = '';

            for (const child of vnode) {
                html += await renderVNodeToString(child, context);
            }

            return html;
        }

        // If vnode is an object with a render function, call it and render the result
        if (vnode.render) {
            const result = vnode.render();
            return renderVNodeToString(result, context);
        }

        // If vnode is an object with a template function, call it and render the result
        if (vnode.template) {
            const result = vnode.template();
            return renderVNodeToString(result, context);
        }

        // If vnode is an object with a toString method, call it
        if (vnode.toString && vnode.toString !== Object.prototype.toString) {
            return escapeHtml(vnode.toString());
        }

        // If vnode is an object, render it as JSON
        return escapeHtml(JSON.stringify(vnode));
    };

    /**
     * Renders a virtual DOM node to a stream
     * @param {Object} vnode - Virtual DOM node
     * @param {Object} context - Render context
     * @returns {ReadableStream} Rendered stream
     */
    const renderVNodeToStream = (vnode, context) => {
        // Create a readable stream
        const { Readable } = require('stream');
        const stream = new Readable({
            read() { }
        });

        // Render the vnode to a string
        renderVNodeToString(vnode, context)
            .then((html) => {
                stream.push(html);
                stream.push(null);
            })
            .catch((error) => {
                stream.emit('error', error);
            });

        return stream;
    };

    /**
     * Renders a component virtual DOM node to a string
     * @param {Object} vnode - Virtual DOM node
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderComponentVNodeToString = async (vnode, context) => {
        const component = vnode.type;
        const props = vnode.props || {};

        // Create a new component instance
        const instance = createComponentInstance(component, props, context);

        // Set up the component
        setupComponent(instance);

        // Add the component state to the hydration state
        if (instance.state) {
            context._hydrationState[instance._uid] = serializeState(instance.state);
        }

        // Render the component
        const result = instance.render ? instance.render() : null;

        // Render the result
        return renderVNodeToString(result, context);
    };

    /**
     * Renders an element virtual DOM node to a string
     * @param {Object} vnode - Virtual DOM node
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderElementVNodeToString = async (vnode, context) => {
        const { type, props = {}, children = [] } = vnode;

        // Special handling for style and script tags
        if (type === 'style' && props.children) {
            context._styles.add(props.children);
            return '';
        }

        if (type === 'script' && props.src) {
            context._scripts.add(props.src);
            return '';
        }

        if (type === 'link' && props.rel === 'stylesheet' && props.href) {
            context._links.add(props.href);
            return '';
        }

        if (type === 'meta' && props.name && props.content) {
            context._metas.add({ name: props.name, content: props.content });
            return '';
        }

        // Start tag
        let html = `<${type}`;

        // Add attributes
        for (const [key, value] of Object.entries(props)) {
            // Skip children and event handlers
            if (key === 'children' || key.startsWith('on')) {
                continue;
            }

            // Handle boolean attributes
            if (value === true) {
                html += ` ${key}`;
                continue;
            }

            // Skip false boolean attributes
            if (value === false) {
                continue;
            }

            // Handle directives
            if (key.startsWith('v-') && directives[key]) {
                const directiveHtml = directives[key](value, vnode, context);
                if (directiveHtml) {
                    html += directiveHtml;
                }
                continue;
            }

            // Handle regular attributes
            html += ` ${key}="${escapeHtml(String(value))}"`;
        }

        // Self-closing tags
        const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

        if (selfClosingTags.includes(type)) {
            return `${html} />`;
        }

        // Close the start tag
        html += '>';

        // Add children
        if (children) {
            if (Array.isArray(children)) {
                for (const child of children) {
                    html += await renderVNodeToString(child, context);
                }
            } else {
                html += await renderVNodeToString(children, context);
            }
        }

        // End tag
        html += `</${type}>`;

        return html;
    };

    /**
     * Renders a fragment virtual DOM node to a string
     * @param {Object} vnode - Virtual DOM node
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderFragmentVNodeToString = async (vnode, context) => {
        const { children = [] } = vnode;

        let html = '';

        if (Array.isArray(children)) {
            for (const child of children) {
                html += await renderVNodeToString(child, context);
            }
        } else {
            html += await renderVNodeToString(children, context);
        }

        return html;
    };

    /**
     * Renders a teleport virtual DOM node to a string
     * @param {Object} vnode - Virtual DOM node
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderTeleportVNodeToString = async (vnode, context) => {
        const { props = {}, children = [] } = vnode;
        const { to } = props;

        if (!to) {
            return '';
        }

        // Render the children
        let html = '';

        if (Array.isArray(children)) {
            for (const child of children) {
                html += await renderVNodeToString(child, context);
            }
        } else {
            html += await renderVNodeToString(children, context);
        }

        // Store the teleport content
        context._teleports[to] = html;

        return '';
    };

    /**
     * Renders a suspense virtual DOM node to a string
     * @param {Object} vnode - Virtual DOM node
     * @param {Object} context - Render context
     * @returns {Promise<string>} Rendered HTML
     */
    const renderSuspenseVNodeToString = async (vnode, context) => {
        const { props = {}, children = [] } = vnode;
        const { fallback } = props;

        try {
            // Try to render the children
            let html = '';

            if (Array.isArray(children)) {
                for (const child of children) {
                    html += await renderVNodeToString(child, context);
                }
            } else {
                html += await renderVNodeToString(children, context);
            }

            return html;
        } catch (error) {
            // If an error occurs, render the fallback
            return renderVNodeToString(fallback, context);
        }
    };

    /**
     * Creates a component instance
     * @param {Object} component - Component definition
     * @param {Object} props - Component props
     * @param {Object} context - Render context
     * @returns {Object} Component instance
     */
    const createComponentInstance = (component, props, context) => {
        // Create a unique ID for the component
        const uid = generateUid();

        // Create the instance
        const instance = {
            _uid: uid,
            _component: component,
            _props: props,
            _context: context,
            _isMounted: false,
            _isUnmounted: false,
            _isSetup: false,
            state: null,
            props: { ...props },
            attrs: { ...props },
            slots: {},
            refs: {},
            emit: () => { },
            render: null
        };

        return instance;
    };

    /**
     * Sets up a component instance
     * @param {Object} instance - Component instance
     */
    const setupComponent = (instance) => {
        const { _component: component, props } = instance;

        // Skip if already set up
        if (instance._isSetup) {
            return;
        }

        // Mark as set up
        instance._isSetup = true;

        // Call setup function if available
        if (component.setup) {
            const setupResult = component.setup(props, {
                attrs: instance.attrs,
                slots: instance.slots,
                emit: instance.emit,
                expose: () => { }
            });

            // If setup returns a render function, use it
            if (typeof setupResult === 'function') {
                instance.render = setupResult;
            } else if (setupResult && typeof setupResult === 'object') {
                // If setup returns an object, use it as the instance state
                instance.state = setupResult;
            }
        }

        // Use render function from component if available
        if (!instance.render && component.render) {
            instance.render = () => component.render.call(instance);
        }

        // Use template function from component if available
        if (!instance.render && component.template) {
            instance.render = () => component.template.call(instance);
        }
    };

    /**
     * Generates a unique ID
     * @returns {string} Unique ID
     */
    const generateUid = () => {
        return Math.random().toString(36).substring(2, 15);
    };

    /**
     * Escapes HTML special characters
     * @param {string} html - HTML string
     * @returns {string} Escaped HTML
     */
    const escapeHtml = (html) => {
        return String(html)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    /**
     * Injects resources into HTML
     * @param {string} html - HTML string
     * @param {Object} context - Render context
     * @returns {string} HTML with injected resources
     */
    const injectResources = (html, context) => {
        const { _styles, _scripts, _links, _metas } = context;

        // Inject styles
        if (_styles.size > 0) {
            const styleHtml = Array.from(_styles)
                .map(style => `<style>${style}</style>`)
                .join('');

            html = html.replace('</head>', `${styleHtml}</head>`);
        }

        // Inject links
        if (_links.size > 0) {
            const linkHtml = Array.from(_links)
                .map(href => `<link rel="stylesheet" href="${href}">`)
                .join('');

            html = html.replace('</head>', `${linkHtml}</head>`);
        }

        // Inject metas
        if (_metas.size > 0) {
            const metaHtml = Array.from(_metas)
                .map(meta => `<meta name="${meta.name}" content="${meta.content}">`)
                .join('');

            html = html.replace('</head>', `${metaHtml}</head>`);
        }

        // Inject scripts
        if (_scripts.size > 0) {
            const scriptHtml = Array.from(_scripts)
                .map(src => `<script src="${src}"></script>`)
                .join('');

            html = html.replace('</body>', `${scriptHtml}</body>`);
        }

        // Inject teleports
        for (const [to, content] of Object.entries(context._teleports)) {
            const teleportTarget = `<div id="${to}"></div>`;
            const teleportReplacement = `<div id="${to}">${content}</div>`;

            html = html.replace(teleportTarget, teleportReplacement);
        }

        return html;
    };

    /**
     * Injects hydration state into HTML
     * @param {string} html - HTML string
     * @param {Object} context - Render context
     * @returns {string} HTML with injected hydration state
     */
    const injectHydrationState = (html, context) => {
        const { _hydrationState } = context;

        if (Object.keys(_hydrationState).length > 0) {
            const stateJson = serializer(_hydrationState);
            const stateScript = `<script>window.__KALXJS_INITIAL_STATE__ = ${stateJson};</script>`;

            html = html.replace('</body>', `${stateScript}</body>`);
        }

        return html;
    };

    /**
     * Serializes component state
     * @param {Object} state - Component state
     * @returns {Object} Serialized state
     */
    const serializeState = (state) => {
        const serialized = {};

        for (const [key, value] of Object.entries(state)) {
            // Handle ref objects
            if (value && typeof value === 'object' && 'value' in value) {
                serialized[key] = value.value;
            } else {
                serialized[key] = value;
            }
        }

        return serialized;
    };

    /**
     * Gets a cache key for a render
     * @param {Object} app - KalxJS app
     * @param {Object} context - Render context
     * @returns {string|null} Cache key
     */
    const getCacheKey = (app, context) => {
        if (!context.cacheable) {
            return null;
        }

        const { url, query, params } = context;

        return `${url || ''}:${JSON.stringify(query || {})}:${JSON.stringify(params || {})}`;
    };

    return {
        renderToString,
        renderToStream,
        renderComponentToString,
        renderComponentToStream,
        clearCache: () => cache.clear()
    };
}

/**
 * Creates a client hydration function
 * @param {Object} options - Hydration options
 * @returns {Function} Hydration function
 */
export function createClientHydration(options = {}) {
    const {
        deserializer = JSON.parse
    } = options;

    /**
     * Hydrates a server-rendered app
     * @param {Object} app - KalxJS app
     * @param {string|Element} container - Container element or selector
     * @returns {Object} Hydrated app
     */
    return function hydrate(app, container) {
        // Get the container element
        const containerElement = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!containerElement) {
            throw new Error(`Container element not found: ${container}`);
        }

        // Get the initial state
        const initialState = window.__KALXJS_INITIAL_STATE__ || {};

        // Add hydration flag to the app
        app._hydrate = true;

        // Add initial state to the app
        app._initialState = deserializer(JSON.stringify(initialState));

        // Mount the app
        return app.mount(containerElement);
    };
}

/**
 * Creates an SSR plugin for KalxJS
 * @param {Object} options - SSR plugin options
 * @returns {Object} SSR plugin
 */
export function createSSRPlugin(options = {}) {
    return {
        name: 'ssr',
        install(app) {
            // Create server renderer
            const serverRenderer = createServerRenderer(options);

            // Create client hydration
            const clientHydration = createClientHydration(options);

            // Add SSR utilities to the app
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};
            app.config.globalProperties.$ssr = {
                renderToString: serverRenderer.renderToString,
                renderToStream: serverRenderer.renderToStream,
                hydrate: clientHydration
            };

            // Add SSR flag to the app
            app._isSSR = typeof window === 'undefined';

            // Add hydrate method to the app
            app.hydrate = (container) => clientHydration(app, container);

            // Add SSR utilities to the window
            if (typeof window !== 'undefined') {
                window.$kalxjs = window.$kalxjs || {};
                window.$kalxjs.ssr = {
                    hydrate: clientHydration
                };
            }
        }
    };
}