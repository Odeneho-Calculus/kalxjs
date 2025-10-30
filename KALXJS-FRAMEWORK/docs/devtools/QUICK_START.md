# DevTools Quick Start

Get up and running with KALXJS DevTools in 5 minutes.

## 1. Installation (30 seconds)

```bash
npm install @kalxjs/devtools
```

## 2. Initialize (1 minute)

Add to your main application file:

```javascript
// main.js
import { createApp } from '@kalxjs/core';
import { initDevTools } from '@kalxjs/devtools';
import App from './App.js';

const app = createApp(App);

// Initialize DevTools
const hook = initDevTools();
if (hook) {
  hook.registerApp(app, {
    name: 'My App',
    version: '1.0.0'
  });
}

app.mount('#app');
```

## 3. Register Components (1 minute)

Optionally register components for inspection:

```javascript
// MyComponent.js
import { getDevToolsHook } from '@kalxjs/devtools';

export default {
  name: 'MyComponent',
  data() {
    return {
      count: 0,
      message: 'Hello'
    };
  },
  mounted() {
    const hook = getDevToolsHook();
    if (hook) {
      hook.registerComponent(this, 'my-app');
    }
  },
  methods: {
    increment() {
      this.count++;
    }
  }
};
```

## 4. Verify in Browser (1 minute)

Open your browser console and check:

```javascript
// ✓ DevTools should be initialized
window.__KALXJS_DEVTOOLS_HOOK__

// ✓ Should see your app registered
window.__KALXJS_DEVTOOLS_HOOK__.getApps()

// ✓ Should see registered components
window.__KALXJS_DEVTOOLS_HOOK__.getComponents()
```

## 5. Inspect State (1 minute)

Use the browser console to inspect component state:

```javascript
const hook = window.__KALXJS_DEVTOOLS_HOOK__;
const components = hook.getComponents();

// Get first component's state
if (components.length > 0) {
  console.log(components[0].state);
}
```

## Basic Examples

### Example 1: Track Component Updates

```javascript
const hook = window.__KALXJS_DEVTOOLS_HOOK__;

// Listen for all component updates
hook.on('component:updated', (data) => {
  console.log('Component updated:', data.id);
  console.log('Changes:', data.updates);
});
```

### Example 2: Edit Component State

```javascript
const hook = window.__KALXJS_DEVTOOLS_HOOK__;
const components = hook.getComponents();
const myComponent = components[0];

// Edit a state value (must be primitive)
hook.editState(myComponent.id, 'count', 100);

// This will emit component:updated event
```

### Example 3: Inspect Component Tree

```javascript
const hook = window.__KALXJS_DEVTOOLS_HOOK__;

// Get component hierarchy
const tree = hook.getComponentTree('my-app');
console.log(tree);

// tree = [
//   {
//     id: 'component-1',
//     name: 'App',
//     state: {...},
//     children: [...]
//   }
// ]
```

### Example 4: Performance Profiling

```javascript
const hook = window.__KALXJS_DEVTOOLS_HOOK__;

if (hook.profiler) {
  // Start recording
  hook.profiler.startRecording();

  // ... perform user actions ...

  // Stop and analyze
  hook.profiler.stopRecording();
  const analysis = hook.profiler.analyzePerformance();

  console.log('Slow renders:', analysis.slowRenders);
  console.log('Excessive updates:', analysis.excessiveUpdates);
}
```

## Common Tasks

### Register App with Custom ID

```javascript
const hook = initDevTools();
if (hook) {
  hook.registerApp(app, {
    id: 'my-custom-id',
    name: 'My App',
    version: '1.0.0'
  });
}
```

### Monitor Component Registration

```javascript
const hook = getDevToolsHook();
if (hook) {
  hook.on('component:registered', (data) => {
    console.log('New component:', data.id);
  });
}
```

### Export Performance Metrics

```javascript
const hook = window.__KALXJS_DEVTOOLS_HOOK__;

if (hook.profiler) {
  const metrics = hook.profiler.exportMetrics('json');
  console.log(JSON.stringify(metrics, null, 2));
}
```

### Conditional Development-Only Setup

```javascript
if (process.env.NODE_ENV === 'development') {
  const hook = initDevTools();
  if (hook) {
    hook.registerApp(app, { name: 'My App' });

    // Auto-register important components
    const myComponent = app._rootComponent;
    if (myComponent) {
      hook.registerComponent(myComponent, 'main-app');
    }
  }
}
```

## Browser DevTools Extension

For a visual UI, install the official Chrome DevTools extension:

1. Go to Chrome Web Store
2. Search for "KALXJS DevTools"
3. Click Install
4. Reload your app
5. Open DevTools (F12) → Look for KALXJS tab

The extension automatically discovers the hook and shows:
- Component tree visualization
- Real-time state inspection
- State editing interface
- Performance profiling dashboard

## Keyboard Shortcuts

When using the extension:

- **F12** - Open browser DevTools
- **Ctrl+Shift+I** - Toggle DevTools
- **Ctrl+Shift+C** - Element inspector
- Click on component in tree to select/highlight

## State Editing Restrictions

Only primitive types can be edited:

```javascript
// ✓ Can edit
hook.editState(componentId, 'count', 42);
hook.editState(componentId, 'name', 'John');
hook.editState(componentId, 'active', true);
hook.editState(componentId, 'data', null);

// ✗ Cannot edit (complex types)
hook.editState(componentId, 'user', { name: 'John' });
hook.editState(componentId, 'items', [1, 2, 3]);
```

## Performance Tips

- DevTools overhead is minimal (~5-10ms per operation)
- Register only key components in production-like environments
- Use `NODE_ENV === 'development'` to disable in production
- Event listeners are automatically cleaned up on app unregister

## What's Next?

- **[Usage Guide](./USAGE_GUIDE.md)** - Learn advanced patterns
- **[API Reference](./API.md)** - Complete API documentation
- **[Installation Guide](./INSTALLATION.md)** - Detailed setup options
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues

## Need Help?

- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
- See [Complete API Reference](./API.md)
- Read [Usage Guide](./USAGE_GUIDE.md) for advanced patterns
- Open an issue on [GitHub](https://github.com/kalxjs/kalxjs)