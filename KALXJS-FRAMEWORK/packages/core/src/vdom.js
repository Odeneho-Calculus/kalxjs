// Virtual DOM implementation

// Create virtual DOM element
function h(tag, props = {}, children = []) {
    return {
        tag,
        props: props || {},
        children: children.map(child =>
            typeof child === 'string' || typeof child === 'number'
                ? createTextElement(child)
                : child
        )
    };
}

// Alias h as createElement for compatibility
const createElement = h;

// Create text element
function createTextElement(text) {
    return {
        tag: 'TEXT_ELEMENT',
        props: { nodeValue: text },
        children: []
    };
}

// Create actual DOM from virtual DOM
function createDOMElement(vnode) {
    if (vnode.tag === 'TEXT_ELEMENT') {
        return document.createTextNode(vnode.props.nodeValue);
    }

    const element = document.createElement(vnode.tag);

    // Set properties
    for (const key in vnode.props) {
        if (key === 'children') continue;

        if (key.startsWith('on')) {
            // Handle events
            const eventType = key.toLowerCase().substring(2);
            element.addEventListener(eventType, vnode.props[key]);
        } else if (key === 'style' && typeof vnode.props[key] === 'object') {
            // Handle style object
            const styleObj = vnode.props[key];
            for (const styleKey in styleObj) {
                element.style[styleKey] = styleObj[styleKey];
            }
        } else {
            // Handle regular props
            element[key] = vnode.props[key];
        }
    }

    // Create and append children
    vnode.children.forEach(child => {
        element.appendChild(createDOMElement(child));
    });

    return element;
}

export { h, createElement, createTextElement, createDOMElement };
