<!-- kalxjs/docs/api/vdom.md -->
# Virtual DOM API

kalxjs's Virtual DOM system provides high-performance rendering with intelligent diffing and advanced features like fragments, portals, and suspense boundaries.

## Installation

```bash
# Install latest version
npm install @kalxjs/core@latest
```

Current version: 2.2.3

## Creating Virtual Nodes

### h() - Hyperscript Function

```typescript
import { h, Fragment } from '@kalxjs/core'

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
import { hydrate } from '@kalxjs/core'

// Hydrate server-rendered content
hydrate(vnode, container, (el, vnode) => {
  // Custom hydration hooks
  console.log('Element hydrated:', el)
})
```

### Server Component Integration

```typescript
import { renderToString, renderToStream } from '@kalxjs/server'

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
import { markStatic } from '@kalxjs/core'

// Mark parts of the tree as static
const vnode = h('div', [
  markStatic(h('header', 'Static Header')),
  h('main', 'Dynamic Content')
])
```

## createElement()

Low-level API to create virtual DOM nodes.

```javascript
import { createElement } from '@kalxjs/core';

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
import { createElement, createDOMElement } from '@kalxjs/core';

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
import { createElement, createDOMElement, updateElement } from '@kalxjs/core';

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

## Implementation Details

The kalxjs Virtual DOM system is built on a lightweight implementation that efficiently updates the real DOM:

### Virtual DOM Structure

Each virtual node (vnode) is a JavaScript object with the following structure:

```javascript
// Simplified vnode structure
{
  tag: 'div',           // HTML tag name or component
  props: {              // Element properties
    class: 'container',
    style: { color: 'red' },
    onClick: () => {}   // Event handlers
  },
  children: [           // Child nodes
    { tag: 'span', props: null, children: ['Text content'] }
  ]
}
```

### Diffing Algorithm

The diffing algorithm compares old and new virtual DOM trees to determine the minimal set of DOM operations:

```javascript
// Simplified diff implementation
function diff(oldVNode, newVNode) {
  // Different node types
  if (oldVNode.tag !== newVNode.tag) {
    return { type: 'REPLACE', newVNode };
  }
  
  // Same node type, check for prop changes
  const propChanges = diffProps(oldVNode.props, newVNode.props);
  
  // Check for children changes
  const childChanges = diffChildren(oldVNode.children, newVNode.children);
  
  return {
    type: 'UPDATE',
    propChanges,
    childChanges
  };
}
```

### Patching the DOM

After diffing, the system applies the minimal changes to the real DOM:

```javascript
// Simplified patch implementation
function patch(domElement, diff) {
  if (diff.type === 'REPLACE') {
    const newElement = createDOMElement(diff.newVNode);
    domElement.parentNode.replaceChild(newElement, domElement);
    return newElement;
  }
  
  if (diff.type === 'UPDATE') {
    // Update props
    applyPropChanges(domElement, diff.propChanges);
    
    // Update children
    applyChildChanges(domElement, diff.childChanges);
    
    return domElement;
  }
}
```

### Performance Optimizations

The Virtual DOM system includes several optimizations:

1. **Static Node Hoisting**: Static parts of the tree are hoisted out of render functions
2. **List Reconciliation**: Efficient updates for lists using key-based reconciliation
3. **Event Delegation**: Event handlers are delegated where possible
4. **Batched Updates**: Multiple state changes are batched into a single render cycle

## Version Information

For detailed version history and changes, please refer to the [CHANGELOG.md](https://github.com/Odeneho-Calculus/kalxjs/blob/main/KALXJS-FRAMEWORK/packages/core/CHANGELOG.md) file in the repository.