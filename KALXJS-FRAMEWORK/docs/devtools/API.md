# @kalxjs/devtools API Reference

Complete technical specification for the KALXJS DevTools API.

---

## Table of Contents

- [Core API](#core-api)
- [Component Inspector API](#component-inspector-api)
- [Performance Profiler API](#performance-profiler-api)
- [Data Structures](#data-structures)
- [Event Reference](#event-reference)
- [Type Reference](#type-reference)

---

## Core API

### Module: `devtools-api.js`

#### `initDevTools()` → `DevToolsHook | null`

Initialize the global DevTools Hook.

**Behavior**:
- Returns singleton instance on subsequent calls
- Returns `null` in non-browser environments (SSR, Node.js)
- Announces presence to window via `postMessage`
- Sets `window.__KALXJS_DEVTOOLS_HOOK__`

**Example**:
```javascript
import { initDevTools } from '@kalxjs/devtools';

const hook = initDevTools();
if (hook) {
  hook.registerApp(app);
}
```

---

#### `getDevToolsHook()` → `DevToolsHook | null`

Retrieve the initialized DevTools Hook.

**Behavior**:
- Returns existing hook if initialized
- Returns `null` if not initialized or in non-browser environment
- Safe to call before initialization

**Example**:
```javascript
import { getDevToolsHook } from '@kalxjs/devtools';

const hook = getDevToolsHook();
// Use hook safely
if (hook) {
  const apps = hook.getApps();
}
```

---

#### `class DevToolsHook`

Core hook for app and component lifecycle management.

##### Constructor

```javascript
new DevToolsHook()
```

**Initial State**:
- `apps`: `Map<string, AppInfo>`
- `componentInstances`: `Map<string, ComponentInfo>`
- `events`: `Map<string, Array<Function>>`
- `connected`: `false`
- `_buffer`: `Array<{event, data, timestamp}>`

---

##### `registerApp(app, options?) → string`

Register a KALXJS application instance.

**Parameters**:
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `app` | Object | required | KALXJS application instance |
| `options.id` | string | auto-generated | Custom application ID |
| `options.name` | string | 'KALXJS App' | Display name |
| `options.version` | string | '2.2.8' | Version string |

**Returns**: Application ID (string)

**Events Emitted**:
- `app:registered` with `{ id, app }`

**Generated App Info**:
```javascript
{
  app,           // Reference to app instance
  id,            // Application ID
  name,          // Display name
  version,       // Version string
  rootComponent, // app._rootComponent
  created        // Registration timestamp (Date.now())
}
```

**Example**:
```javascript
const appId = hook.registerApp(app, {
  id: 'main-app',
  name: 'My Application',
  version: '1.0.0'
});
// appId === 'main-app'
```

---

##### `unregisterApp(id) → void`

Unregister an application.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `id` | string | Application ID |

**Behavior**:
- Removes app from registry
- Does not throw if app not found
- Emits event even if not found

**Events Emitted**:
- `app:unregistered` with `{ id }`

**Example**:
```javascript
hook.unregisterApp('main-app');
```

---

##### `registerComponent(instance, appId) → string`

Register a component instance for inspection.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `instance` | Object | Component instance |
| `appId` | string | Parent application ID |

**Returns**: Component ID (string)

**Extracted Component Metadata**:
```javascript
{
  instance,      // Component instance reference
  id,            // Component ID (from _uid or generated)
  appId,         // Parent app ID
  name,          // From $options.name or 'Anonymous'
  type,          // From $options.type or 'component'
  parent,        // Parent component ID or null
  children,      // Array of child component IDs
  state,         // Extracted via extractState()
  props,         // instance.$props
  created        // Registration timestamp
}
```

**State Extraction** (via `extractState()`):
```javascript
{
  ...dataProperties,     // From $data
  _refs: {...},          // From $refs (if present)
  _computed: {...}       // From $options.computed (if present)
}
```

**Events Emitted**:
- `component:registered` with `{ id, instance }`

**Example**:
```javascript
export default {
  mounted() {
    const hook = getDevToolsHook();
    if (hook) {
      const componentId = hook.registerComponent(this, 'main-app');
    }
  }
};
```

---

##### `updateComponent(id, updates) → void`

Update component state and emit change event.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `id` | string | Component ID |
| `updates` | Object | State updates |

**Behavior**:
- Merges updates into component's stored state
- Does not update actual component instance
- Emits event even if component not found

**Events Emitted**:
- `component:updated` with `{ id, updates }`

**Example**:
```javascript
hook.updateComponent('component-1', { count: 10, name: 'Updated' });
```

---

##### `extractState(instance) → Object`

Extract reactive state from component instance.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `instance` | Object | Component instance |

**Returns**: Extracted state object

**Extraction Logic**:
1. Copy all properties from `instance.$data`
2. Add `_refs` object from `instance.$refs`
3. Add `_computed` object from computed properties

**Example**:
```javascript
const state = hook.extractState(componentInstance);
// {
//   count: 5,
//   name: 'Test',
//   _refs: { inputEl: HTMLElement },
//   _computed: { doubled: 10 }
// }
```

---

##### `getComponentTree(appId) → Array<ComponentNode> | null`

Retrieve the complete component tree for an application.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `appId` | string | Application ID |

**Returns**: Array of root component trees or `null` if app not found

**ComponentNode Structure**:
```javascript
{
  id: string,
  name: string,
  type: string,
  state: Object,
  props: Object,
  children: Array<ComponentNode>
}
```

**Behavior**:
- Finds all root components (parent === null)
- Recursively builds tree from children
- Filters out undefined children

**Example**:
```javascript
const tree = hook.getComponentTree('main-app');
// [
//   {
//     id: 'component-1',
//     name: 'App',
//     type: 'component',
//     state: {...},
//     props: {...},
//     children: [...]
//   }
// ]
```

---

##### `getApps() → Array<AppInfo>`

Get all registered applications.

**Returns**: Array of application info objects

**AppInfo Structure**:
```javascript
{
  app: Object,           // Application instance
  id: string,            // App ID
  name: string,          // Display name
  version: string,       // Version
  rootComponent: Object, // Root component
  created: number        // Timestamp
}
```

**Example**:
```javascript
const apps = hook.getApps();
apps.forEach(app => console.log(app.name, app.version));
```

---

##### `getComponents(appId?) → Array<ComponentInfo>`

Get all or filtered registered components.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `appId` | string (optional) | Filter by app ID |

**Returns**: Array of component info objects

**ComponentInfo Structure**:
```javascript
{
  instance: Object,  // Component instance
  id: string,        // Component ID
  appId: string,     // Parent app ID
  name: string,      // Component name
  type: string,      // Component type
  parent: string,    // Parent component ID
  children: string[],// Child component IDs
  state: Object,     // Component state
  props: Object,     // Component props
  created: number    // Timestamp
}
```

**Example**:
```javascript
// All components
const all = hook.getComponents();

// Filter by app
const appComponents = hook.getComponents('main-app');
```

---

##### `on(event, callback) → Function`

Subscribe to DevTools events.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `event` | string | Event name |
| `callback` | Function | Event handler |

**Returns**: Unsubscribe function

**Behavior**:
- Multiple listeners per event supported
- Returns function to unsubscribe
- Callback called synchronously

**Example**:
```javascript
const unsubscribe = hook.on('component:registered', (data) => {
  console.log('Registered:', data.id);
});

// Later
unsubscribe();
```

---

##### `off(event, callback) → void`

Unsubscribe from event.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `event` | string | Event name |
| `callback` | Function | Handler to remove |

**Behavior**:
- Removes specific listener only
- Does nothing if listener not found
- Safe to call if not subscribed

**Example**:
```javascript
const handler = (data) => console.log(data);
hook.on('component:updated', handler);
hook.off('component:updated', handler);
```

---

##### `emit(event, data) → void`

Emit an event to listeners and extension.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `event` | string | Event name |
| `data` | any | Event payload |

**Behavior**:
- Calls all registered listeners
- Sends to extension via `postMessage` if connected
- Buffers events if not connected
- Synchronous execution

**Message Format** (via postMessage):
```javascript
{
  source: 'kalxjs-devtools-hook',
  event: 'event:name',
  data: { /* payload */ }
}
```

**Example**:
```javascript
hook.emit('custom:event', { message: 'Hello' });
```

---

##### `connect() → void`

Connect DevTools to the browser extension.

**Behavior**:
- Sets `connected = true`
- Flushes all buffered events
- Clears buffer after flush
- Emits `devtools:connected` event

**Buffered Events**:
Events emitted while disconnected are stored in `_buffer` and flushed on connection.

**Example**:
```javascript
hook.connect();
// Now emits events in real-time to extension
```

---

##### `disconnect() → void`

Disconnect DevTools from the extension.

**Behavior**:
- Sets `connected = false`
- Emits `devtools:disconnected` event
- Subsequent events will be buffered

**Example**:
```javascript
hook.disconnect();
// Events now buffered until reconnect
```

---

## Component Inspector API

### Module: `component-inspector.js`

#### `createInspector() → ComponentInspector | null`

Create a new Component Inspector instance.

**Returns**: Inspector instance or `null` if hook not initialized

**Example**:
```javascript
import { createInspector } from '@kalxjs/devtools';

const inspector = createInspector();
if (inspector) {
  inspector.selectComponent('component-1');
}
```

---

#### `class ComponentInspector`

Inspect and edit component state in real-time.

##### Constructor

```javascript
new ComponentInspector(hook)
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `hook` | DevToolsHook | DevTools hook instance |

**Initial State**:
- `selectedComponent`: `null`
- `highlight`: `null`

---

##### `selectComponent(componentId) → ComponentDetails | null`

Select a component for detailed inspection.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `componentId` | string | Component ID |

**Returns**: Component details object or `null` if not found

**Events Emitted**:
- `inspector:component-selected` with `{ component }`

**Side Effects**:
- Sets `selectedComponent` internally
- Logs warning if component not found

**Example**:
```javascript
const details = inspector.selectComponent('component-1');
if (details) {
  console.log('State:', details.state);
}
```

---

##### `getComponentDetails(componentId) → ComponentDetails | null`

Get complete component metadata and state.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `componentId` | string | Component ID |

**Returns**: Detailed component info or `null` if not found

**ComponentDetails Structure**:
```javascript
{
  id: string,                 // Component ID
  name: string,               // Component name
  type: string,               // Component type
  file: string,               // __file location

  // State info
  state: {
    [key]: {
      type: string,           // Value type
      value: string,          // Formatted value
      editable: boolean,      // Is editable
      raw: any                // Raw value
    }
  },
  props: {...},               // Serialized props (same format as state)
  computed: {...},            // Computed properties

  // Lifecycle
  lifecycle: {
    mounted: boolean,
    destroyed: boolean,
    hooks: {                  // Active hooks
      beforeCreate: boolean,
      created: boolean,
      // ... other hooks
    }
  },

  // Tree
  parent: string,             // Parent component ID
  children: string[],         // Child component IDs

  // Metadata
  created: number,            // Creation timestamp
  renderCount: number,        // Total renders
  updateCount: number         // Total updates
}
```

**Example**:
```javascript
const details = inspector.getComponentDetails('component-1');
if (details) {
  console.log('Renders:', details.renderCount);
  console.log('State keys:', Object.keys(details.state));
}
```

---

##### `serializeState(state) → SerializedState`

Serialize component state for inspection.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `state` | Object | State object |

**Returns**: Serialized state with type and editability info

**SerializedValue Structure**:
```javascript
{
  type: string,       // Value type (see getValueType)
  value: string,      // Formatted value (see formatValue)
  editable: boolean,  // Can be edited (see isEditable)
  raw: any            // Original value
}
```

**Example**:
```javascript
const serialized = inspector.serializeState({
  count: 5,
  name: 'Test',
  items: [1, 2, 3]
});
// {
//   count: { type: 'number', value: '5', editable: true, raw: 5 },
//   name: { type: 'string', value: 'Test', editable: true, raw: 'Test' },
//   items: { type: 'array', value: '[1, 2, 3]', editable: false, raw: [...] }
// }
```

---

##### `serializeProps(props) → SerializedState`

Serialize component props.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `props` | Object | Props object |

**Returns**: Serialized props (same format as `serializeState`)

**Implementation**: Calls `serializeState(props)` internally

---

##### `getValueType(value) → string`

Detect the type of a value.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `value` | any | Value to type |

**Returns**: Type string

**Supported Types**:
| Value | Returns |
|-------|---------|
| `null` | `'null'` |
| `undefined` | `'undefined'` |
| `'string'` | `'string'` |
| `123` | `'number'` |
| `true` | `'boolean'` |
| `[1, 2]` | `'array'` |
| `{}` | `'object'` |
| `() => {}` | `'function'` |
| `Symbol()` | `'symbol'` |
| `new Date()` | `'date'` |
| `/test/` | `'regexp'` |
| `new Map()` | `'map'` |
| `new Set()` | `'set'` |

**Example**:
```javascript
inspector.getValueType(5);        // 'number'
inspector.getValueType([1, 2]);   // 'array'
inspector.getValueType(new Date()); // 'date'
```

---

##### `formatValue(value, depth?) → string`

Format a value for display.

**Parameters**:
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `value` | any | required | Value to format |
| `depth` | number | 0 | Current recursion depth |

**Returns**: Formatted string representation

**Formatting Rules**:
- `null` → `'null'`
- `undefined` → `'undefined'`
- Functions → `function toString().slice(0, 50) + '...'`
- Symbols → `symbol.toString()`
- Arrays → `[item1, item2, ...]` or `Array(n)` for n > 5
- Objects → `{ key1: value1, ... }` or `Object {n keys}` for n > 5
- Dates → ISO string
- RegExp → string representation
- Other objects → `String(value)`

**Depth Limiting**:
- Max depth = 2
- Beyond depth 2 → `'...'`

**Example**:
```javascript
inspector.formatValue([1, 2, 3]);           // '[1, 2, 3]'
inspector.formatValue({ a: 1, b: 2 });     // '{ a: 1, b: 2 }'
inspector.formatValue(new Date());          // '2024-01-15T10:30:00.000Z'
```

---

##### `isEditable(value) → boolean`

Check if a value can be edited.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `value` | any | Value to check |

**Returns**: `true` if editable, `false` otherwise

**Editable Types**:
- `string`
- `number`
- `boolean`
- `null`

**Example**:
```javascript
inspector.isEditable(5);         // true
inspector.isEditable('test');    // true
inspector.isEditable([1, 2]);    // false
inspector.isEditable({});        // false
```

---

##### `editState(componentId, path, value) → boolean`

Edit component state directly.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `componentId` | string | Component ID |
| `path` | string | State path (dot notation) |
| `value` | any | New value |

**Returns**: `true` if successful, `false` if failed

**Path Format**:
- Simple: `"count"` → `component.$data.count`
- Nested: `"user.name"` → `component.$data.user.name`
- Multi-level: `"a.b.c.d"`

**Behavior**:
- Navigates to target property
- Updates `component.$data[path]`
- Updates stored component info
- Emits `component:updated`
- Returns false on error (logs to console)

**Restrictions**:
- Only primitive values (string, number, boolean, null)
- Must be in `$data`, not refs or computed
- Path must exist or fail

**Events Emitted** (on success):
- `component:updated` with `{ id, updates: { [path]: value } }`

**Example**:
```javascript
// Simple property
inspector.editState('component-1', 'count', 10);  // true

// Nested property
inspector.editState('component-1', 'user.name', 'John'); // true

// Non-editable type
inspector.editState('component-1', 'items', []); // false
```

---

##### `highlightComponent(componentId) → void`

Visually highlight a component on the page.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `componentId` | string | Component ID |

**Behavior**:
- Creates fixed overlay div if not exists
- Positions overlay over component `$el`
- Uses green border styling
- Z-index: 999999

**Overlay Style**:
```css
position: fixed;
pointer-events: none;
z-index: 999999;
border: 2px solid #42b883;
background: rgba(66, 184, 131, 0.1);
transition: all 0.1s;
```

**Positioning**:
- Gets bounding rect from `component.$el`
- Sets top, left, width, height accordingly
- Reflows with viewport changes

**Side Effects**:
- Creates DOM element if needed
- Shows existing overlay
- Does nothing if component has no `$el`

**Example**:
```javascript
inspector.highlightComponent('component-1');
// Green overlay appears over component

setTimeout(() => {
  inspector.unhighlightComponent();
  // Overlay hidden
}, 3000);
```

---

##### `unhighlightComponent() → void`

Remove the component highlight overlay.

**Behavior**:
- Hides overlay element (display: none)
- Does not remove from DOM
- Safe to call if no overlay

**Example**:
```javascript
inspector.unhighlightComponent();
```

---

##### `getPerformanceMetrics(componentId) → PerformanceMetrics | null`

Get performance metrics for a component.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `componentId` | string | Component ID |

**Returns**: Metrics object or `null` if not found

**PerformanceMetrics Structure**:
```javascript
{
  renderCount: number,     // Total renders
  updateCount: number,     // Total updates
  renderTime: number,      // Total render duration (ms)
  created: number,         // Creation timestamp
  lastUpdate: number       // Last update timestamp
}
```

**Example**:
```javascript
const metrics = inspector.getPerformanceMetrics('component-1');
if (metrics) {
  console.log(`Rendered ${metrics.renderCount} times`);
}
```

---

##### `getComputedValues(instance) → Object`

Extract computed properties from a component.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `instance` | Object | Component instance |

**Returns**: Computed properties with metadata

**Returns Structure**:
```javascript
{
  [computedKey]: {
    type: string,        // Value type
    value: string,       // Formatted value
    dependencies: any[]  // Tracked dependencies
  }
}
```

---

##### `getLifecycleInfo(instance) → LifecycleInfo`

Get component lifecycle information.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `instance` | Object | Component instance |

**Returns**: Lifecycle metadata

**LifecycleInfo Structure**:
```javascript
{
  mounted: boolean,      // Is currently mounted
  destroyed: boolean,    // Is destroyed
  hooks: {               // Which hooks are defined
    beforeCreate: boolean,
    created: boolean,
    beforeMount: boolean,
    mounted: boolean,
    beforeUpdate: boolean,
    updated: boolean,
    beforeUnmount: boolean,
    unmounted: boolean
  }
}
```

---

## Performance Profiler API

### Module: `performance-profiler.js`

#### `createProfiler() → PerformanceProfiler | null`

Create a new Performance Profiler instance.

**Returns**: Profiler instance or `null` if hook not initialized

**Example**:
```javascript
import { createProfiler } from '@kalxjs/devtools';

const profiler = createProfiler();
if (profiler) {
  profiler.startRecording();
}
```

---

#### `class PerformanceProfiler`

Track and analyze performance metrics.

##### Constructor

```javascript
new PerformanceProfiler(hook)
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `hook` | DevToolsHook | DevTools hook instance |

**Initial State**:
- `isRecording`: `false`
- `currentRecording`: `null`
- `recordings`: `[]`
- `metrics`: `Map<string, MetricEntry>`

---

##### `startRecording(options?) → void`

Start recording performance metrics.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `options` | Object (optional) | Recording metadata |

**Behavior**:
- Sets `isRecording = true`
- Creates `currentRecording` object
- Subscribes to component events
- Logs warning if already recording

**CurrentRecording Structure**:
```javascript
{
  id: string,           // 'recording-{timestamp}'
  started: number,      // performance.now()
  ended: null,
  duration: undefined,
  events: [],           // Recorded events
  metrics: {},          // Calculated metrics
  options: {...}        // Passed options
}
```

**Events Subscribed**:
- `component:registered`
- `component:updated`

**Events Emitted**:
- `profiler:started` with `{ recording }`

**Example**:
```javascript
profiler.startRecording({
  label: 'Form Submission',
  metadata: { userId: 123 }
});
```

---

##### `stopRecording() → Recording | null`

Stop recording and calculate metrics.

**Returns**: Recording object or `null` if not recording

**Behavior**:
- Sets `isRecording = false`
- Sets `ended = performance.now()`
- Calculates `duration`
- Calls `calculateMetrics()`
- Saves to `recordings` array
- Logs warning if not recording

**Returned Recording Structure**:
```javascript
{
  id: string,           // Recording ID
  started: number,      // Start time
  ended: number,        // End time
  duration: number,     // Duration in ms
  events: Array,        // Recorded events
  metrics: {            // Calculated metrics
    totalEvents: number,
    componentRegistrations: number,
    componentUpdates: number,
    renders: number,
    renderTimes: number[],
    avgRenderTime: number,
    maxRenderTime: number,
    minRenderTime: number,
    slowestComponents: Array
  }
}
```

**Events Emitted**:
- `profiler:stopped` with `{ recording }`

**Example**:
```javascript
const recording = profiler.stopRecording();
if (recording) {
  console.log(`Duration: ${recording.duration}ms`);
  console.log(`Events: ${recording.metrics.totalEvents}`);
}
```

---

##### `recordRender(componentId, duration) → void`

Record a component render event.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `componentId` | string | Component ID |
| `duration` | number | Render duration (ms) |

**Behavior**:
- Looks up or creates metric for component
- Increments render count
- Updates timing statistics
- Adds event to current recording if active

**Recorded Event Structure**:
```javascript
{
  type: 'render',
  componentId: string,
  duration: number,
  timestamp: number
}
```

**Metric Updates**:
- Increments `renders`
- Accumulates `totalTime`
- Updates `minTime`, `maxTime`
- Calculates `avgTime`

**Example**:
```javascript
const start = performance.now();
// ... render operation
const duration = performance.now() - start;
profiler.recordRender('component-1', duration);
```

---

##### `getComponentMetrics(componentId) → ComponentMetric | null`

Get metrics for a specific component.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `componentId` | string | Component ID |

**Returns**: Metric object or `null` if no data

**ComponentMetric Structure**:
```javascript
{
  renders: number,      // Total renders
  totalTime: number,    // Total duration
  minTime: number,      // Fastest render
  maxTime: number,      // Slowest render
  avgTime: number       // Average render time
}
```

**Example**:
```javascript
const metrics = profiler.getComponentMetrics('component-1');
if (metrics) {
  console.log(`Average render: ${metrics.avgTime.toFixed(2)}ms`);
}
```

---

##### `getAllMetrics() → Object`

Get all component metrics.

**Returns**: Object mapping component IDs to metrics

**Example**:
```javascript
const allMetrics = profiler.getAllMetrics();
Object.entries(allMetrics).forEach(([id, metrics]) => {
  console.log(`${id}: ${metrics.renders} renders`);
});
```

---

##### `getRecordings() → Array<Recording>`

Get all recorded sessions.

**Returns**: Array of recording objects

**Example**:
```javascript
const recordings = profiler.getRecordings();
recordings.forEach(rec => {
  console.log(`Recording ${rec.id}: ${rec.duration}ms`);
});
```

---

##### `clearRecordings() → void`

Clear all recordings and metrics.

**Behavior**:
- Clears `recordings` array
- Clears `metrics` map

**Example**:
```javascript
profiler.clearRecordings();
```

---

##### `exportRecording(recordingId) → string | null`

Export a recording as JSON.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `recordingId` | string | Recording ID |

**Returns**: JSON string or `null` if not found

**Example**:
```javascript
const json = profiler.exportRecording('recording-1234567890');
if (json) {
  const data = JSON.parse(json);
  console.log(data.metrics);
}
```

---

##### `analyzePerformance(recording) → Array<Issue>`

Analyze a recording for performance issues.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `recording` | Recording | Recording to analyze |

**Returns**: Array of issue objects

**Issue Structure**:
```javascript
{
  severity: 'warning' | 'info',  // Issue severity
  type: string,                   // Issue type
  message: string,                // User message
  details: any                    // Technical details (varies by type)
}
```

**Detection Thresholds**:

1. **Slow Renders** (type: `'slow-render'`)
   - Condition: `maxRenderTime > 16ms`
   - Target: 60 FPS (16.67ms per frame)
   - Details: Slowest components

2. **Excessive Updates** (type: `'excessive-updates'`)
   - Condition: `componentUpdates > componentRegistrations * 5`
   - Ratio: Updates per component

3. **Memory Concern** (type: `'potential-memory-leak'`)
   - Condition: `stillMounted > componentsCreated * 0.8`
   - Percentage: Components still mounted

**Example**:
```javascript
const recording = profiler.stopRecording();
const issues = profiler.analyzePerformance(recording);

issues.forEach(issue => {
  console.warn(`[${issue.severity}] ${issue.type}: ${issue.message}`);
});
```

---

##### `calculateMetrics(recording) → Metrics`

Calculate metrics from a recording.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `recording` | Recording | Recording to analyze |

**Returns**: Calculated metrics object

**Metrics Structure** (See Phase 4.3 for full details):
```javascript
{
  totalEvents: number,
  componentRegistrations: number,
  componentUpdates: number,
  renders: number,
  renderTimes: number[],
  avgRenderTime: number,
  maxRenderTime: number,
  minRenderTime: number,
  slowestComponents: Array<{componentId, totalTime}>,
  componentsCreated: Set<string>,
  componentsUpdated: Set<string>
}
```

---

## Data Structures

### AppInfo

```javascript
{
  app: Object,           // Application instance
  id: string,            // Unique app ID
  name: string,          // Display name
  version: string,       // Version string
  rootComponent: Object, // Root component reference
  created: number        // Creation timestamp
}
```

### ComponentInfo

```javascript
{
  instance: Object,      // Component instance
  id: string,            // Unique component ID
  appId: string,         // Parent app ID
  name: string,          // Component name
  type: string,          // Component type
  parent: string,        // Parent component ID
  children: string[],    // Child component IDs
  state: Object,         // Component state
  props: Object,         // Component props
  created: number        // Creation timestamp
}
```

### SerializedValue

```javascript
{
  type: string,          // Value type
  value: string,         // Formatted value
  editable: boolean,     // Can be edited
  raw: any               // Original value
}
```

---

## Event Reference

### Lifecycle Events

| Event | When | Data | Notes |
|-------|------|------|-------|
| `app:registered` | App registered | `{ id, app }` | Never throws |
| `app:unregistered` | App unregistered | `{ id }` | Always emitted |
| `component:registered` | Component registered | `{ id, instance }` | Initial state extracted |
| `component:updated` | State updated | `{ id, updates }` | Inspector or hook updates |

### Inspector Events

| Event | When | Data | Notes |
|-------|------|------|-------|
| `inspector:component-selected` | Component selected | `{ component }` | User selection |

### Profiler Events

| Event | When | Data | Notes |
|-------|------|------|-------|
| `profiler:started` | Recording starts | `{ recording }` | New session begins |
| `profiler:stopped` | Recording stops | `{ recording }` | Metrics calculated |

### Connection Events

| Event | When | Data | Notes |
|-------|------|------|-------|
| `devtools:connected` | Connected | `{ timestamp }` | Buffer flushed |
| `devtools:disconnected` | Disconnected | `{ timestamp }` | Buffering starts |

---

## Type Reference

### Value Types

```
string | number | boolean | null | undefined | array | object |
function | symbol | date | regexp | map | set
```

### Lifecycle Hooks

```
beforeCreate | created | beforeMount | mounted |
beforeUpdate | updated | beforeUnmount | unmounted
```

### Metric Types

```
renders: number
totalTime: number
minTime: number
maxTime: number
avgTime: number
renderTime: number
updateCount: number
renderCount: number
```

---

## Best Practices

1. **Always check for null** when calling factory functions
2. **Use options objects** for configuration
3. **Subscribe to events** with cleanup
4. **Edit only primitives** (string, number, boolean, null)
5. **Use dot notation** for nested paths
6. **Handle missing components** gracefully
7. **Clear recordings** periodically to manage memory
8. **Analyze after recording** for insights

---

**Last Updated**: Phase 9 Documentation
**Status**: ✓ Complete and Tested