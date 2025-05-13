# Custom Renderer API Reference

## Overview

The Custom Renderer API provides a template-based rendering system that works directly with the DOM instead of using a virtual DOM. This API is available in KalxJS 2.1.0 and later.

## Importing

```js
// Import the custom renderer
import { createCustomRenderer } from '@kalxjs/core/renderer';

// Import template component system
import { createTemplateComponent, defineTemplateComponent } from '@kalxjs/core/template';
```

## Core API

### createCustomRenderer

Creates a new custom renderer instance.

```js
const renderer = createCustomRenderer(router, store);
```

**Parameters:**
- `router` (Object): KalxJS router instance
- `store` (Object): KalxJS store instance

**Returns:**
- (Object): Custom renderer instance

### createRenderer

Creates a renderer based on the provided options.

```js
const renderer = createRenderer({
  router,
  store,
  useCustomRenderer: true
});
```

**Parameters:**
- `options` (Object): Renderer options
  - `router` (Object): KalxJS router instance
  - `store` (Object): KalxJS store instance
  - `useCustomRenderer` (boolean): Whether to use the custom renderer (default: true)

**Returns:**
- (Object): Renderer instance (either custom or default)

## CustomRenderer Methods

### init

Initializes the renderer with a container element.

```js
renderer.init('#app');
```

**Parameters:**
- `routerViewSelector` (string|HTMLElement): Selector or element for the router view

### setupRouterListeners

Sets up router event listeners.

```js
renderer.setupRouterListeners();
```

### setupNavigation

Sets up navigation elements.

```js
renderer.setupNavigation();
```

### updateNavigation

Updates navigation elements based on the current route.

```js
renderer.updateNavigation();
```

### renderCurrentRoute

Renders the current route.

```js
renderer.renderCurrentRoute();
```

### renderNamedComponent

Renders a component by name.

```js
renderer.renderNamedComponent('home');
```

**Parameters:**
- `name` (string): Component name

### renderFunctionComponent

Renders a function component.

```js
renderer.renderFunctionComponent(HomeComponent);
```

**Parameters:**
- `component` (Function): Component function

### renderObjectComponent

Renders an object component.

```js
renderer.renderObjectComponent({
  render() {
    return '<div>Hello World</div>';
  }
});
```

**Parameters:**
- `component` (Object): Component object

### setupComponent

Sets up a component.

```js
renderer.setupComponent('counter', content);
```

**Parameters:**
- `name` (string): Component name
- `content` (DocumentFragment): Component content

### renderNotFound

Renders a not found page.

```js
renderer.renderNotFound();
```

### renderError

Renders an error message.

```js
renderer.renderError(new Error('Something went wrong'));
```

**Parameters:**
- `error` (Error): Error object

### cleanup

Cleans up the renderer.

```js
renderer.cleanup();
```

## Template Component API

### createTemplateComponent

Creates a template-based component.

```js
const component = createTemplateComponent({
  template: '<div>{{ message }}</div>',
  data() {
    return {
      message: 'Hello World'
    };
  }
});
```

**Parameters:**
- `options` (Object): Component options
  - `template` (string): HTML template
  - `name` (string): Component name
  - `props` (Object): Component props
  - `data` (Function): Data function
  - `methods` (Object): Component methods
  - `computed` (Object): Computed properties
  - `watch` (Object): Watch handlers
  - `beforeCreate` (Function): Lifecycle hook
  - `created` (Function): Lifecycle hook
  - `beforeMount` (Function): Lifecycle hook
  - `mounted` (Function): Lifecycle hook
  - `beforeUpdate` (Function): Lifecycle hook
  - `updated` (Function): Lifecycle hook
  - `beforeUnmount` (Function): Lifecycle hook
  - `unmounted` (Function): Lifecycle hook

**Returns:**
- (Object): Component instance

### defineTemplateComponent

Defines a template component factory.

```js
const Counter = defineTemplateComponent({
  template: '<div>{{ count }}</div>',
  data() {
    return {
      count: 0
    };
  }
});

// Create an instance
const counter = Counter({ initialCount: 10 });
```

**Parameters:**
- `options` (Object): Component options (same as createTemplateComponent)

**Returns:**
- (Function): Component factory function

## Template Component Instance Methods

### init

Initializes the component.

```js
component.init({ title: 'My Component' });
```

**Parameters:**
- `props` (Object): Component props

**Returns:**
- (Object): Component instance

### mount

Mounts the component to an element.

```js
component.mount('#container');
```

**Parameters:**
- `el` (string|HTMLElement): Element or selector

**Returns:**
- (Object): Component instance

### render

Renders the component.

```js
component.render();
```

**Returns:**
- (Object): Component instance

### setState

Updates the component state.

```js
component.setState({ count: 10 });
```

**Parameters:**
- `newState` (Object): New state

**Returns:**
- (Object): Component instance

### getState

Gets a state value.

```js
const count = component.getState('count');
```

**Parameters:**
- `key` (string): State key

**Returns:**
- (any): State value

### unmount

Unmounts the component.

```js
component.unmount();
```

**Returns:**
- (Object): Component instance

## Application Integration

### useCustomRenderer

Enables or disables the custom renderer for an application.

```js
import { createApp } from '@kalxjs/core';

const app = createApp(App);
app.useCustomRenderer(true);
app.mount('#app');
```

**Parameters:**
- `value` (boolean): Whether to use the custom renderer (default: true)

**Returns:**
- (Object): Application instance