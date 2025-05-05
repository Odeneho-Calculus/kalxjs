<!-- kalxjs/docs/api/vdom.md -->
# Virtual DOM API

kalxjs's Virtual DOM system provides high-performance rendering with intelligent diffing and advanced features like fragments, portals, and suspense boundaries.

## Creating Virtual Nodes

### h() - Hyperscript Function

```typescript
import { h, Fragment } from '@kalxjs-framework/runtime'

// Basic elements
const vnode = h('div', { class: 'container' }, 'Hello')

// Fragments
const fragment = h(Fragment, null, [
  h('li', null, 'Item 1'),
  h('li', null, 'Item 2')
])

// Portals for rendering outside component tree
const portal = h(Portal, { target: '#modal' }, [
  h('div', { class: 'modal' }, 'Modal Content')
])

// Suspense boundaries
const async = h(Suspense, { fallback: h('div', 'Loading...') }, [
  h(AsyncComponent)
])
```

## Advanced Features

### Hydration API

```typescript
import { hydrate } from '@kalxjs-framework/runtime'

// Hydrate server-rendered content
hydrate(vnode, container, (el, vnode) => {
  // Custom hydration hooks
  console.log('Element hydrated:', el)
})
```

### Server Component Integration

```typescript
import { renderToString, renderToStream } from '@kalxjs-framework/runtime'

// Server-side rendering
const html = await renderToString(vnode)

// Streaming render
const stream = renderToStream(vnode)
```

## Optimization Techniques

### Static Hoisting

```typescript
// Automatically hoists static content
const StaticComponent = defineComponent({
  render() {
    return h('div', [
      // Static content hoisted out of render function
      h('h1', 'Static Title'),
      // Dynamic content properly tracked
      h('p', this.dynamicContent)
    ])
  }
})
```

### Partial Hydration

```typescript
import { markStatic } from '@kalxjs-framework/runtime'

// Mark parts of the tree as static
const vnode = h('div', [
  markStatic(h('header', 'Static Header')),
  h('main', 'Dynamic Content')
])
```

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