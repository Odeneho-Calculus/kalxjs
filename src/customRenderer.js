// src/customRenderer.js

/**
 * KalxJS Custom Renderer
 * 
 * This file provides a custom rendering implementation that can be used
 * as a fallback when the standard rendering pipeline fails.
 */

/**
 * Creates a DOM element from a virtual DOM node
 * @param {Object} vnode - Virtual DOM node
 * @returns {HTMLElement} DOM element
 */
export function createElement(vnode) {
    // Handle primitive values (string, number, etc.)
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return document.createTextNode(String(vnode));
    }

    // Handle null or undefined
    if (!vnode) {
        console.warn('Attempted to create element from null/undefined vnode');
        const fallbackElement = document.createElement('div');
        fallbackElement.className = 'custom-renderer-fallback';
        fallbackElement.innerHTML = `
      <div style="padding: 10px; border: 1px solid #f0ad4e; background-color: #fcf8e3; color: #8a6d3b; border-radius: 4px;">
        <h4 style="margin-top: 0;">Custom Renderer Notice</h4>
        <p>The custom renderer received empty content to render.</p>
      </div>
    `;
        return fallbackElement;
    }

    // Handle case where vnode might be a function (component)
    if (typeof vnode === 'function') {
        try {
            console.log('Custom renderer: Rendering component function');
            const result = vnode({});
            return createElement(result);
        } catch (error) {
            console.error('Custom renderer: Error rendering component function:', error);
            const errorElement = document.createElement('div');
            errorElement.className = 'custom-renderer-error';
            errorElement.innerHTML = `
        <div style="padding: 10px; border: 1px solid #d9534f; background-color: #f2dede; color: #a94442; border-radius: 4px;">
          <h4 style="margin-top: 0;">Component Error</h4>
          <p>${error.message}</p>
        </div>
      `;
            return errorElement;
        }
    }

    // Handle case where vnode might not be a proper virtual node object
    if (!vnode.tag) {
        console.warn('Custom renderer: Invalid vnode (missing tag):', vnode);
        const errorElement = document.createElement('div');
        errorElement.className = 'custom-renderer-invalid-vnode';
        errorElement.innerHTML = `
      <div style="padding: 10px; border: 1px solid #d9534f; background-color: #f2dede; color: #a94442; border-radius: 4px;">
        <h4 style="margin-top: 0;">Invalid Virtual DOM Node</h4>
        <p>A virtual DOM node is missing the required 'tag' property</p>
      </div>
    `;
        return errorElement;
    }

    // Create the DOM element
    let element;
    try {
        element = document.createElement(vnode.tag);
    } catch (error) {
        console.error(`Custom renderer: Error creating element with tag "${vnode.tag}":`, error);
        const errorElement = document.createElement('div');
        errorElement.className = 'custom-renderer-invalid-tag';
        errorElement.innerHTML = `
      <div style="padding: 10px; border: 1px solid #d9534f; background-color: #f2dede; color: #a94442; border-radius: 4px;">
        <h4 style="margin-top: 0;">Invalid Tag</h4>
        <p>Cannot create element with tag: ${vnode.tag}</p>
      </div>
    `;
        return errorElement;
    }

    // Set properties
    try {
        for (const [key, value] of Object.entries(vnode.props || {})) {
            if (value === undefined || value === null) {
                continue; // Skip null/undefined props
            }

            if (key.startsWith('on')) {
                // Handle event handlers
                const eventName = key.slice(2).toLowerCase();
                if (typeof value === 'function') {
                    element.addEventListener(eventName, value);
                }
            } else if (key === 'style' && typeof value === 'object') {
                // Handle style objects
                Object.assign(element.style, value);
            } else if (key === 'class' || key === 'className') {
                // Handle class names
                element.className = value;
            } else if (key === 'dangerouslySetInnerHTML') {
                // Handle innerHTML
                if (value && value.__html !== undefined) {
                    element.innerHTML = value.__html;
                }
            } else {
                // Handle regular attributes
                element.setAttribute(key, value);
            }
        }
    } catch (error) {
        console.error('Custom renderer: Error setting properties:', error);
        // Continue despite property errors
    }

    // Create and append children
    const children = Array.isArray(vnode.children) ? vnode.children : (vnode.children ? [vnode.children] : []);
    children.forEach(child => {
        if (child !== null && child !== undefined) {
            try {
                const childElement = createElement(child);
                if (childElement) {
                    element.appendChild(childElement);
                }
            } catch (error) {
                console.error('Custom renderer: Error creating child element:', error);
                const errorComment = document.createComment(`Error creating child: ${error.message}`);
                element.appendChild(errorComment);
            }
        }
    });

    return element;
}

/**
 * Renders a virtual DOM node to a DOM container
 * @param {Object} vnode - Virtual DOM node
 * @param {HTMLElement} container - DOM container
 */
export function renderToDOM(vnode, container) {
    // Clear the container
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // Create a DOM element from the virtual node
    try {
        const element = createElement(vnode);
        if (element) {
            container.appendChild(element);
            console.log('Custom renderer: Rendering successful');
        } else {
            throw new Error('createElement returned null or undefined');
        }
    } catch (error) {
        console.error('Custom renderer: Error in rendering:', error);

        // Fallback to direct HTML if createElement fails
        container.innerHTML = `
      <div style="padding: 20px; border: 1px solid #d9534f; background-color: #f2dede; color: #a94442; border-radius: 4px; margin: 20px;">
        <h3>Custom Renderer Fallback</h3>
        <p>The custom renderer encountered an issue while rendering content.</p>
        <p>This is a fallback message to ensure you see something instead of a blank page.</p>
        <div style="margin-top: 15px; padding: 10px; background: #f8f8f8; border-radius: 4px;">
          <h4>Error Details:</h4>
          <pre style="overflow: auto; max-height: 200px;">${error.message}</pre>
        </div>
      </div>
    `;
    }
}

/**
 * Creates a simple component with the given content
 * @param {string} title - Component title
 * @param {string} message - Component message
 * @returns {Object} Virtual DOM node
 */
export function createSimpleComponent(title, message) {
    return {
        tag: 'div',
        props: { class: 'custom-renderer-component' },
        children: [
            {
                tag: 'h2',
                props: { style: 'color: #42b883; margin-bottom: 16px;' },
                children: [title]
            },
            {
                tag: 'p',
                props: {},
                children: [message]
            }
        ]
    };
}