<!-- kalxjs/docs/api/vdom.md -->
# Virtual DOM API

kalxjs uses a virtual DOM (Document Object Model) system to efficiently update the actual DOM when your application's state changes.

## h()

Creates virtual DOM nodes using a JSX-compatible syntax.

```javascript
import { h } from 'kalxjs';

// Create a simple element
const vnode = h('div', { class: 'container' }, 'Hello World');

// Create a more complex element with children
const vnode2 = h('div', { class: 'container' }, [
  h('h1', 'Title'),
  h('p', 'Paragraph content'),
  h('button', { onClick: () => alert('Clicked!') }, 'Click Me')
]);

// Use with components
const vnode3 = h(MyComponent, { prop1: 'value', prop2: 123 });
```

### Arguments

- `{string|Function} tag` - HTML tag name or component
- `{Object} props` - Properties/attributes to apply to the element
- `{Array|string} children` - Child elements or text content

### Returns

- `{Object}` - Virtual DOM node

## createElement()

Low-level API to create virtual DOM nodes.

```javascript
import { createElement } from 'kalxjs';

const vnode = createElement('div', 
  { class: 'container', style: { color: 'red' } },
  [
    createElement('span', null, ['Text content'])
  ]
);
```

### Arguments

- `{string} tag` - HTML tag name
- `{Object} props` - Element properties
- `{Array} children` - Child elements

### Returns

- `{Object}` - Virtual DOM node

## createDOMElement()

Creates an actual DOM element from a virtual node.

```javascript
import { createElement, createDOMElement } from 'kalxjs';

const vnode = createElement('div', { class: 'container' }, ['Hello']);
const domElement = createDOMElement(vnode);

// Append to DOM
document.body.appendChild(domElement);
```

### Arguments

- `{Object} vnode` - Virtual DOM node

### Returns

- `{HTMLElement}` - Real DOM element

## updateElement()

Updates an existing DOM element to match a new virtual node.

```javascript
import { createElement, createDOMElement, updateElement } from 'kalxjs';

// Create initial element
const vnode1 = createElement('div', { class: 'container' }, ['Initial text']);
const domElement = createDOMElement(vnode1);
document.body.appendChild(domElement);

// Update element later
const vnode2 = createElement('div', { class: 'container active' }, ['Updated text']);
updateElement(domElement.parentNode, vnode1, vnode2, 0);
```

### Arguments

- `{HTMLElement} parent` - Parent DOM element
- `{Object} oldVNode` - Previous virtual node
- `{Object} newVNode` - New virtual node
- `{number} index` - Index of the element among its siblings

### Notes

- The virtual DOM system is primarily used internally by the framework
- Understanding this API can be helpful for advanced use cases or creating custom renderers