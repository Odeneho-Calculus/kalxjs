# @kalxjs/devtools

> Developer Tools for KalxJS Framework — Real-time component inspection, state debugging, and performance profiling.

[![npm version](https://img.shields.io/npm/v/@kalxjs/devtools)](https://www.npmjs.com/package/@kalxjs/devtools)
[![license](https://img.shields.io/npm/l/@kalxjs/devtools)](LICENSE)

## Overview

`@kalxjs/devtools` is a comprehensive developer toolkit for KalxJS applications. It provides runtime component inspection, real-time state editing, component tree visualization, and performance profiling — enabling developers to debug and optimize applications efficiently.

### Key Features

- **Component Inspector**: Inspect component state, props, and lifecycle in real-time
- **Component Tree Visualization**: View complete component hierarchy and relationships
- **State Editing**: Modify component state directly and see changes reflected instantly
- **Component Highlighting**: Visually locate components on the page
- **Performance Profiling**: Track render times, component updates, and identify performance bottlenecks
- **Event System**: Listen to lifecycle events and state changes
- **Browser Extension Support**: Integrate with the KALXJS DevTools browser extension
- **Zero Overhead in Production**: Disabled by default in production environments

---

## Installation

### NPM

```bash
npm install @kalxjs/devtools
```

### Yarn

```bash
yarn add @kalxjs/devtools
```

### PNPM

```bash
pnpm add @kalxjs/devtools
```

---

## Quick Start

### Basic Setup

Initialize DevTools in your main application file:

```javascript
import { createDevTools } from '@kalxjs/devtools';
import App from './App.js';

// Initialize DevTools (auto-disabled in production)
const devtools = createDevTools({
  enabled: process.env.NODE_ENV !== 'production',
  inspector: true,
  profiler: true
});

// Create your KALXJS application
const app = createApp(App);

// Register app with DevTools
const hook = devtools.hook;
hook.registerApp(app, {
  id: 'my-app',
  name: 'My App',
  version: '1.0.0'
});

app.mount('#app');
```

### Registering Components

Register components with DevTools for inspection:

```javascript
import { getDevToolsHook } from '@kalxjs/devtools';

export default {
  name: 'Counter',
  template: `<div>{{ count }}</div>`,
  data() {
    return {
      count: 0
    };
  },
  mounted() {
    const hook = getDevToolsHook();
    if (hook) {
      hook.registerComponent(this, 'my-app');
    }
  }
};
```

---

## API Reference

### DevTools Hook

The DevTools Hook is the core API that manages app registration, component lifecycle, and event communication.

#### `initDevTools()`

Initialize the DevTools Hook globally.

```javascript
import { initDevTools } from '@kalxjs/devtools';

const hook = initDevTools();
// Returns: DevToolsHook instance or null (SSR environments)
```

**Returns**: `DevToolsHook | null`

---

#### `getDevToolsHook()`

Retrieve the initialized DevTools Hook globally.

```javascript
import { getDevToolsHook } from '@kalxjs/devtools';

const hook = getDevToolsHook();
if (hook) {
  hook.registerComponent(component, 'app-id');
}
```

**Returns**: `DevToolsHook | null` (null if not initialized or in non-browser environment)

---

#### `hook.registerApp(app, options)`

Register a KALXJS application instance.

```javascript
const appId = hook.registerApp(app, {
  id: 'my-app',           // Optional: custom app ID
  name: 'My Application', // App display name
  version: '1.0.0'        // App version
});
```

**Parameters**:
- `app` (Object): KALXJS application instance
- `options` (Object):
  - `id` (String, optional): Custom application ID
  - `name` (String, optional): Application display name (default: 'KALXJS App')
  - `version` (String, optional): Application version

**Returns**: String - Generated or provided application ID

**Events**: Emits `app:registered` with app metadata

---

#### `hook.unregisterApp(id)`

Unregister an application instance.

```javascript
hook.unregisterApp('my-app');
```

**Parameters**:
- `id` (String): Application ID to unregister

**Events**: Emits `app:unregistered` when successful

---

#### `hook.registerComponent(instance, appId)`

Register a component instance for inspection.

```javascript
hook.registerComponent(this, 'my-app');
```

**Parameters**:
- `instance` (Object): Component instance
- `appId` (String): Parent application ID

**Returns**: String - Component ID

**Events**: Emits `component:registered` with component metadata

**Extracted Component Metadata**:
- Component name, type, and file location
- Parent-child relationships
- Reactive state (`$data`)
- Props and computed properties
- Refs and lifecycle hooks

---

#### `hook.updateComponent(id, updates)`

Update component state and emit change event.

```javascript
hook.updateComponent(componentId, { count: 5 });
```

**Parameters**:
- `id` (String): Component ID
- `updates` (Object): State updates to apply

**Events**: Emits `component:updated` with ID and update details

---

#### `hook.getComponentTree(appId)`

Retrieve the complete component tree for an application.

```javascript
const tree = hook.getComponentTree('my-app');
// Returns: [
//   {
//     id: 'component-1',
//     name: 'App',
//     type: 'component',
//     state: { /* component state */ },
//     props: { /* component props */ },
//     children: [ /* nested components */ ]
//   }
// ]
```

**Parameters**:
- `appId` (String): Application ID

**Returns**: Array of root component trees or `null` if app not found

---

#### `hook.getApps()`

Get all registered applications.

```javascript
const apps = hook.getApps();
// Returns: [
//   { id, name, version, app, rootComponent, created }
// ]
```

**Returns**: Array of application metadata objects

---

#### `hook.getComponents(appId?)`

Get all registered components (optionally filtered by app).

```javascript
// Get all components
const allComponents = hook.getComponents();

// Get components for specific app
const appComponents = hook.getComponents('my-app');
```

**Parameters**:
- `appId` (String, optional): Filter components by application ID

**Returns**: Array of component metadata objects

---

#### `hook.on(event, callback)`

Subscribe to DevTools events.

```javascript
const unsubscribe = hook.on('component:registered', (data) => {
  console.log('Component registered:', data.id);
});

// Unsubscribe later
unsubscribe();
```

**Parameters**:
- `event` (String): Event name
- `callback` (Function): Event handler

**Returns**: Function - Unsubscribe function

**Available Events**:
- `app:registered` - App registered
- `app:unregistered` - App unregistered
- `component:registered` - Component registered
- `component:updated` - Component state updated
- `inspector:component-selected` - Component selected in inspector
- `profiler:started` - Performance recording started
- `profiler:stopped` - Performance recording stopped
- `devtools:connected` - DevTools connected to extension
- `devtools:disconnected` - DevTools disconnected from extension

---

#### `hook.emit(event, data)`

Emit a custom event to listeners and DevTools extension.

```javascript
hook.emit('custom:event', { message: 'Hello' });
```

**Parameters**:
- `event` (String): Event name
- `data` (any): Event data payload

---

#### `hook.connect()`

Connect DevTools to the browser extension.

```javascript
hook.connect();
```

Flushes buffered events and begins sending events to the extension in real-time.

**Events**: Emits `devtools:connected`

---

#### `hook.disconnect()`

Disconnect DevTools from the browser extension.

```javascript
hook.disconnect();
```

**Events**: Emits `devtools:disconnected`

---

### Component Inspector

The Component Inspector provides real-time component state inspection and editing.

#### `createInspector()`

Create a new Component Inspector instance.

```javascript
import { createInspector } from '@kalxjs/devtools';

const inspector = createInspector();
```

**Returns**: `ComponentInspector | null` (null if hook not initialized)

---

#### `inspector.selectComponent(componentId)`

Select a component for detailed inspection.

```javascript
const details = inspector.selectComponent('component-1');
// Returns: { id, name, type, file, state, props, computed, ... }
```

**Parameters**:
- `componentId` (String): Component ID to inspect

**Returns**: Component details object or `null` if not found

**Events**: Emits `inspector:component-selected`

---

#### `inspector.getComponentDetails(componentId)`

Get complete component metadata and state information.

```javascript
const details = inspector.getComponentDetails('component-1');
// Returns: {
//   id: 'component-1',
//   name: 'Counter',
//   type: 'component',
//   file: '/src/components/Counter.js',
//   state: {
//     count: { type: 'number', value: 5, editable: true, raw: 5 }
//   },
//   props: { /* serialized props */ },
//   computed: { /* computed properties */ },
//   lifecycle: { mounted: true, destroyed: false, hooks: {...} },
//   parent: 'component-0',
//   children: ['component-2', 'component-3'],
//   created: 1234567890,
//   renderCount: 42,
//   updateCount: 128
// }
```

**Parameters**:
- `componentId` (String): Component ID

**Returns**: Component details object or `null` if not found

---

#### `inspector.serializeState(state)`

Serialize component state for inspection with type and editability information.

```javascript
const serialized = inspector.serializeState({ count: 5, name: 'Test' });
// Returns: {
//   count: { type: 'number', value: '5', editable: true, raw: 5 },
//   name: { type: 'string', value: 'Test', editable: true, raw: 'Test' }
// }
```

**Parameters**:
- `state` (Object): State object to serialize

**Returns**: Serialized state with type, value, and editability info

---

#### `inspector.editState(componentId, path, value)`

Edit component state directly.

```javascript
// Edit simple property
const success = inspector.editState('component-1', 'count', 10);

// Edit nested property
const success = inspector.editState('component-1', 'user.name', 'John');
```

**Parameters**:
- `componentId` (String): Component ID
- `path` (String): State path using dot notation (e.g., 'user.name')
- `value` (any): New value (must be editable type: string, number, boolean, null)

**Returns**: Boolean - `true` if successful, `false` if failed

**Events**: Emits `component:updated` on success

**Supported Types for Editing**: string, number, boolean, null

---

#### `inspector.highlightComponent(componentId)`

Visually highlight a component on the page with an overlay.

```javascript
inspector.highlightComponent('component-1');
```

**Parameters**:
- `componentId` (String): Component ID to highlight

**Visual Effect**: Green border and semi-transparent overlay with fixed positioning

---

#### `inspector.unhighlightComponent()`

Remove the component highlight overlay.

```javascript
inspector.unhighlightComponent();
```

---

#### `inspector.getPerformanceMetrics(componentId)`

Get performance metrics for a specific component.

```javascript
const metrics = inspector.getPerformanceMetrics('component-1');
// Returns: {
//   renderCount: 42,
//   updateCount: 128,
//   renderTime: 2.5,
//   created: 1234567890,
//   lastUpdate: 1234567905
// }
```

**Parameters**:
- `componentId` (String): Component ID

**Returns**: Metrics object or `null` if not found

---

#### `inspector.getValueType(value)`

Detect the type of a value for serialization.

```javascript
inspector.getValueType(5);        // 'number'
inspector.getValueType('test');   // 'string'
inspector.getValueType([1, 2]);   // 'array'
inspector.getValueType(new Date()); // 'date'
```

**Supported Types**: string, number, boolean, null, undefined, array, object, function, symbol, date, regexp, map, set

---

#### `inspector.isEditable(value)`

Check if a value can be edited.

```javascript
inspector.isEditable(5);        // true
inspector.isEditable('test');   // true
inspector.isEditable([1, 2]);   // false
inspector.isEditable({a: 1});   // false
```

**Editable Types**: string, number, boolean, null

---

### Performance Profiler

The Performance Profiler tracks component renders and updates, identifies bottlenecks, and analyzes performance issues.

#### `createProfiler()`

Create a new Performance Profiler instance.

```javascript
import { createProfiler } from '@kalxjs/devtools';

const profiler = createProfiler();
```

**Returns**: `PerformanceProfiler | null` (null if hook not initialized)

---

#### `profiler.startRecording(options)`

Start recording performance metrics.

```javascript
profiler.startRecording({
  label: 'User Interaction',
  metadata: { action: 'form-submit' }
});
```

**Parameters**:
- `options` (Object, optional): Recording metadata

**Returns**: void

**Events**: Emits `profiler:started` with recording info

---

#### `profiler.stopRecording()`

Stop recording and calculate metrics.

```javascript
const recording = profiler.stopRecording();
// Returns: {
//   id: 'recording-1234567890',
//   started: 1000.5,
//   ended: 2500.3,
//   duration: 1499.8,
//   events: [ /* recorded events */ ],
//   metrics: { /* calculated metrics */ }
// }
```

**Returns**: Recording object or `null` if not recording

**Events**: Emits `profiler:stopped` with recording info

---

#### `profiler.recordRender(componentId, duration)`

Record a component render event.

```javascript
const startTime = performance.now();
// ... render operation
const duration = performance.now() - startTime;
profiler.recordRender('component-1', duration);
```

**Parameters**:
- `componentId` (String): Component ID
- `duration` (Number): Render duration in milliseconds

---

#### `profiler.getComponentMetrics(componentId)`

Get metrics for a specific component.

```javascript
const metrics = profiler.getComponentMetrics('component-1');
// Returns: {
//   renders: 42,
//   totalTime: 125.5,
//   minTime: 2.1,
//   maxTime: 8.3,
//   avgTime: 2.99
// }
```

**Parameters**:
- `componentId` (String): Component ID

**Returns**: Metrics object or `null` if no data

---

#### `profiler.getAllMetrics()`

Get metrics for all components.

```javascript
const allMetrics = profiler.getAllMetrics();
// Returns: {
//   'component-1': { renders: 42, totalTime: 125.5, ... },
//   'component-2': { renders: 18, totalTime: 45.2, ... }
// }
```

**Returns**: Object mapping component IDs to metrics

---

#### `profiler.getRecordings()`

Get all recorded performance sessions.

```javascript
const recordings = profiler.getRecordings();
// Returns: Array of recording objects
```

**Returns**: Array of all recordings

---

#### `profiler.clearRecordings()`

Clear all recorded sessions and metrics.

```javascript
profiler.clearRecordings();
```

---

#### `profiler.exportRecording(recordingId)`

Export a recording as JSON.

```javascript
const json = profiler.exportRecording('recording-1234567890');
```

**Parameters**:
- `recordingId` (String): Recording ID

**Returns**: JSON string or `null` if not found

---

#### `profiler.analyzePerformance(recording)`

Analyze a recording for performance issues.

```javascript
const issues = profiler.analyzePerformance(recording);
// Returns: [
//   {
//     severity: 'warning',
//     type: 'slow-render',
//     message: 'Slow render detected: 18.5ms (target: <16ms)',
//     details: [{ componentId, totalTime }]
//   },
//   {
//     severity: 'warning',
//     type: 'excessive-updates',
//     message: 'High update frequency: 256 updates for 12 components',
//     ratio: 21.3
//   }
// ]
```

**Parameters**:
- `recording` (Object): Recording object

**Returns**: Array of issue objects with severity, type, and message

**Thresholds**:
- Slow render: > 16ms
- Excessive updates: > 5x components ratio
- Memory concern: > 80% components still mounted

---

### Factory Function

#### `createDevTools(options)`

Initialize all DevTools features with a single call.

```javascript
const devtools = createDevTools({
  enabled: process.env.NODE_ENV !== 'production',
  inspector: true,
  profiler: true
});

// Returns: {
//   hook: DevToolsHook,
//   inspector: ComponentInspector,
//   profiler: PerformanceProfiler
// }
```

**Parameters**:
- `options` (Object, optional):
  - `enabled` (Boolean, default: `!production`): Enable/disable DevTools
  - `inspector` (Boolean, default: true): Enable component inspector
  - `profiler` (Boolean, default: true): Enable performance profiler

**Returns**: DevTools object with hook, inspector, and profiler instances

**Auto-connects** the hook to the browser extension if enabled.

---

## Examples

### Example 1: Basic Component Inspection

```javascript
import { createDevTools } from '@kalxjs/devtools';

// Initialize DevTools
const devtools = createDevTools();
const hook = devtools.hook;
const inspector = devtools.inspector;

// Register app and component
hook.registerApp(app, { name: 'My App' });
hook.registerComponent(componentInstance, 'app-1');

// Inspect component
const details = inspector.selectComponent('component-1');
console.log(details.state);

// Edit state
inspector.editState('component-1', 'count', 10);
```

### Example 2: Performance Profiling

```javascript
const { profiler } = devtools;

// Start recording
profiler.startRecording({ label: 'Form Submission' });

// ... perform user actions ...

// Stop and analyze
const recording = profiler.stopRecording();
const issues = profiler.analyzePerformance(recording);

if (issues.length > 0) {
  console.warn('Performance issues found:', issues);
}

// Export for analysis
const json = profiler.exportRecording(recording.id);
```

### Example 3: Component Highlighting

```javascript
// Highlight a component
inspector.highlightComponent('component-1');

// After inspection, remove highlight
inspector.unhighlightComponent();
```

### Example 4: Event Monitoring

```javascript
// Listen to component registration
hook.on('component:registered', (data) => {
  console.log('Registered:', data.id);
});

// Listen to state changes
hook.on('component:updated', (data) => {
  console.log('Updated:', data.id, data.updates);
});

// Listen to profiler events
hook.on('profiler:started', (data) => {
  console.log('Profiling started:', data.recording.id);
});
```

---

## Best Practices

### 1. Conditional Initialization

Always check the environment to avoid overhead in production:

```javascript
const devtools = createDevTools({
  enabled: process.env.NODE_ENV !== 'production'
});
```

### 2. Register Components in Lifecycle Hooks

Register components in the `mounted` lifecycle hook:

```javascript
export default {
  name: 'MyComponent',
  mounted() {
    const hook = getDevToolsHook();
    if (hook) {
      hook.registerComponent(this, 'app-id');
    }
  }
};
```

### 3. Use Descriptive Component Names

Set clear component names for easier identification:

```javascript
export default {
  name: 'UserProfileCard',
  // ...
};
```

### 4. Record Performance During Development

Use profiling to identify bottlenecks early:

```javascript
if (process.env.NODE_ENV !== 'production') {
  profiler.startRecording({ label: 'Page Load' });
  // ... wait for load ...
  const recording = profiler.stopRecording();
  console.log(profiler.analyzePerformance(recording));
}
```

### 5. Avoid Editing Complex State in Production Scenarios

Only edit primitive values (strings, numbers, booleans) for reliable behavior:

```javascript
// ✓ Good
inspector.editState(id, 'name', 'John');
inspector.editState(id, 'count', 42);

// ✗ Problematic
inspector.editState(id, 'user', { name: 'John' }); // Use API instead
```

### 6. Unsubscribe from Events

Clean up event listeners to prevent memory leaks:

```javascript
const unsubscribe = hook.on('component:registered', handler);

// Later...
unsubscribe();
```

---

## Browser Extension Integration

The DevTools Hook communicates with the KALXJS DevTools Browser Extension via `postMessage`.

### Hook Announcement

When initialized, the hook announces its presence:

```javascript
window.postMessage({
  source: 'kalxjs-devtools-hook',
  event: 'init',
  version: '2.2.8'
}, '*');
```

### Event Broadcasting

When connected, events are broadcast to the extension:

```javascript
window.postMessage({
  source: 'kalxjs-devtools-hook',
  event: 'component:registered',
  data: { /* component data */ }
}, '*');
```

### Global Hook Access

The hook is always available globally:

```javascript
const hook = window.__KALXJS_DEVTOOLS_HOOK__;
```

---

## Troubleshooting

### DevTools Hook Not Found

**Problem**: `getDevToolsHook()` returns `null`

**Solutions**:
1. Ensure `initDevTools()` or `createDevTools()` was called before accessing
2. Verify you're in a browser environment (not Node.js/SSR)
3. Check that DevTools is not disabled in options

```javascript
const devtools = createDevTools({ enabled: true }); // Explicitly enable
```

### Component State Not Updating

**Problem**: State changes don't reflect in component

**Solutions**:
1. Verify component is properly registered
2. Only edit primitive values (string, number, boolean, null)
3. Use dot notation for nested properties: `user.name` not `user['name']`

```javascript
inspector.editState(id, 'count', 5);      // ✓ Works
inspector.editState(id, 'user.name', 'John'); // ✓ Works
```

### Performance Metrics Missing

**Problem**: `getComponentMetrics()` returns `null`

**Solutions**:
1. Ensure profiler was recording when component rendered
2. Call `recordRender()` explicitly if not using integration
3. Verify component ID is correct

```javascript
const metrics = profiler.getComponentMetrics(correctComponentId);
```

### Extension Not Receiving Events

**Problem**: Browser extension doesn't see DevTools events

**Solutions**:
1. Verify hook is connected: `hook.connected === true`
2. Call `hook.connect()` explicitly if needed
3. Check browser console for blocked messages
4. Ensure extension background script is listening to `postMessage`

```javascript
hook.connect(); // Manually connect if needed
```

---

## Performance Characteristics

| Operation | Typical Duration |
|-----------|------------------|
| Hook initialization | < 1ms |
| App registration | < 0.5ms |
| Component registration | < 2ms |
| Component update | < 1ms |
| State serialization | < 5ms (100 properties) |
| Event emission | < 0.5ms |

---

## License

MIT © [KalxJS Team](https://github.com/Odeneho-Calculus/kalxjs)

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Support

- [GitHub Issues](https://github.com/Odeneho-Calculus/kalxjs/issues)
- [Documentation](https://kalxjs.dev)
- [Examples](../examples)
