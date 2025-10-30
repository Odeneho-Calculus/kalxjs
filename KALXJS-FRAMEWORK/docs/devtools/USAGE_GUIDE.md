# @kalxjs/devtools Usage Guide

Practical patterns, recipes, and best practices for using KALXJS DevTools.

---

## Table of Contents

- [Setup Patterns](#setup-patterns)
- [Component Registration](#component-registration)
- [State Inspection & Editing](#state-inspection--editing)
- [Performance Analysis](#performance-analysis)
- [Event Monitoring](#event-monitoring)
- [Integration Patterns](#integration-patterns)
- [Troubleshooting](#troubleshooting)

---

## Setup Patterns

### Pattern 1: Basic Setup (Development Only)

Initialize DevTools only in development:

```javascript
// main.js
import { createDevTools } from '@kalxjs/devtools';
import App from './App.js';

let devtools = null;

if (process.env.NODE_ENV !== 'production') {
  devtools = createDevTools({
    enabled: true,
    inspector: true,
    profiler: true
  });
}

const app = createApp(App);

// Register app if DevTools available
if (devtools?.hook) {
  devtools.hook.registerApp(app, {
    id: 'my-app',
    name: 'My Application',
    version: '1.0.0'
  });
}

app.mount('#app');

// Export for console access
if (devtools) {
  window.__devtools = devtools;
}
```

**Usage in Browser Console**:
```javascript
// Access devtools
const { hook, inspector, profiler } = window.__devtools;

// Inspect app
console.log(hook.getApps());

// Record performance
profiler.startRecording();
// ... perform actions ...
const recording = profiler.stopRecording();
console.log(recording.metrics);
```

---

### Pattern 2: Conditional Feature Initialization

Enable/disable features dynamically:

```javascript
const features = {
  inspector: true,
  profiler: localStorage.getItem('devtools_profiler') === 'true'
};

const devtools = createDevTools({
  enabled: process.env.NODE_ENV !== 'production',
  inspector: features.inspector,
  profiler: features.profiler
});

// Toggle profiler at runtime
window.toggleProfiler = () => {
  features.profiler = !features.profiler;
  localStorage.setItem('devtools_profiler', features.profiler);
  console.log('Profiler:', features.profiler ? 'enabled' : 'disabled');
};
```

---

### Pattern 3: Plugin-style Integration

Wrap DevTools in a plugin:

```javascript
// devtools-plugin.js
export function installDevTools(app, options = {}) {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const devtools = createDevTools({
    enabled: true,
    ...options
  });

  if (!devtools?.hook) return null;

  // Register app
  devtools.hook.registerApp(app, {
    name: options.appName || 'KalxJS App',
    version: options.version || '1.0.0'
  });

  // Provide global access
  app.config.globalProperties.$devtools = devtools;
  window.__KALXJS_DEVTOOLS__ = devtools;

  return devtools;
}

// main.js
import { installDevTools } from './devtools-plugin.js';

const app = createApp(App);

if (process.env.NODE_ENV !== 'production') {
  installDevTools(app, {
    appName: 'My App',
    version: '1.0.0'
  });
}

app.mount('#app');
```

---

## Component Registration

### Pattern 1: Automatic Registration in Mounted Hook

Register components automatically when mounted:

```javascript
// Base component or mixin
const devtoolsMixin = {
  mounted() {
    const hook = getDevToolsHook();
    if (hook) {
      this._devtoolsId = hook.registerComponent(this, 'my-app');
    }
  }
};

// Usage in component
export default {
  name: 'MyComponent',
  mixins: [devtoolsMixin],
  data() {
    return {
      count: 0
    };
  }
};
```

---

### Pattern 2: Composable Hook for Registration

Create a composable for easier registration:

```javascript
// useDevtools.js
import { getDevToolsHook } from '@kalxjs/devtools';

export function useDevtools(componentName, appId = 'my-app') {
  let componentId = null;

  return {
    mounted() {
      const hook = getDevToolsHook();
      if (hook) {
        componentId = hook.registerComponent(this, appId);
        console.log(`[DevTools] Registered ${componentName} (${componentId})`);
      }
    },
    getComponentId() {
      return componentId;
    }
  };
}

// Usage
export default {
  name: 'Counter',
  setup() {
    const devtools = useDevtools('Counter', 'my-app');
    return { devtools };
  },
  data() {
    return { count: 0 };
  },
  mounted() {
    this.devtools.mounted.call(this);
  }
};
```

---

### Pattern 3: Selective Component Registration

Only register certain components:

```javascript
const DEVTOOLS_TRACKED = [
  'App',
  'PageHeader',
  'UserList',
  'UserDetail',
  'DataTable'
];

export default {
  name: 'MyComponent',
  mounted() {
    const hook = getDevToolsHook();
    if (hook && DEVTOOLS_TRACKED.includes(this.$options.name)) {
      this._devtoolsId = hook.registerComponent(this, 'my-app');
    }
  }
};
```

---

## State Inspection & Editing

### Pattern 1: Component State Inspection

Inspect component state in console:

```javascript
// Get all components
const hook = window.__KALXJS_DEVTOOLS__.hook;
const allComponents = hook.getComponents();

// Find specific component
const userListComponent = allComponents.find(c => c.name === 'UserList');
console.log('UserList state:', userListComponent.state);

// Get detailed info
const inspector = window.__KALXJS_DEVTOOLS__.inspector;
const details = inspector.getComponentDetails(userListComponent.id);
console.log('Detailed state:', details.state);
```

---

### Pattern 2: State Editing Workflow

Edit component state safely:

```javascript
const inspector = window.__KALXJS_DEVTOOLS__.inspector;

// 1. Find component
const components = hook.getComponents();
const target = components.find(c => c.name === 'UserForm');

// 2. Check editability
const details = inspector.getComponentDetails(target.id);
const isCountEditable = details.state.count.editable;

// 3. Edit if possible
if (isCountEditable) {
  const success = inspector.editState(target.id, 'count', 100);
  if (success) {
    console.log('✓ State updated');
  } else {
    console.error('✗ Failed to update');
  }
}
```

---

### Pattern 3: Monitor State Changes

Listen to state changes:

```javascript
const hook = window.__KALXJS_DEVTOOLS__.hook;

hook.on('component:updated', (data) => {
  console.log(`Component ${data.id} updated:`, data.updates);
});

// For specific component
hook.on('component:updated', (data) => {
  if (data.id === targetComponentId) {
    console.log('Target component changed:', data.updates);
  }
});

// Auto-unsubscribe
const unsubscribe = hook.on('component:updated', handler);
setTimeout(() => unsubscribe(), 10000); // Stop listening after 10s
```

---

### Pattern 4: Batch State Updates

Update multiple properties:

```javascript
const inspector = window.__KALXJS_DEVTOOLS__.inspector;
const componentId = 'component-1';

const updates = [
  { path: 'name', value: 'John' },
  { path: 'age', value: 30 },
  { path: 'email', value: 'john@example.com' }
];

let successCount = 0;
updates.forEach(({ path, value }) => {
  if (inspector.editState(componentId, path, value)) {
    successCount++;
  }
});

console.log(`✓ Updated ${successCount}/${updates.length} properties`);
```

---

## Performance Analysis

### Pattern 1: Basic Performance Recording

Record and analyze performance:

```javascript
const profiler = window.__KALXJS_DEVTOOLS__.profiler;

// Start recording
profiler.startRecording({ label: 'User Interaction' });

// Perform actions
// ... user interactions, API calls, etc.
await performUserActions();

// Stop and analyze
const recording = profiler.stopRecording();

// Check metrics
const metrics = recording.metrics;
console.log('Duration:', metrics);
console.log('Total renders:', metrics.renders);
console.log('Average render time:', metrics.avgRenderTime.toFixed(2) + 'ms');

// Analyze for issues
const issues = profiler.analyzePerformance(recording);
if (issues.length > 0) {
  console.warn('⚠ Performance issues found:');
  issues.forEach(issue => {
    console.warn(`  - [${issue.severity}] ${issue.message}`);
  });
}
```

---

### Pattern 2: Component-level Performance

Track individual component performance:

```javascript
const profiler = window.__KALXJS_DEVTOOLS__.profiler;

// Get component ID
const components = hook.getComponents();
const dataTableComponent = components.find(c => c.name === 'DataTable');

// Start recording
profiler.startRecording({ label: 'DataTable Sort' });

// Trigger sort action
table.sort('name');

// Stop and check metrics
profiler.stopRecording();
const componentMetrics = profiler.getComponentMetrics(dataTableComponent.id);

if (componentMetrics) {
  console.log(`DataTable Performance:`);
  console.log(`  Renders: ${componentMetrics.renders}`);
  console.log(`  Avg time: ${componentMetrics.avgTime.toFixed(2)}ms`);
  console.log(`  Max time: ${componentMetrics.maxTime.toFixed(2)}ms`);
}
```

---

### Pattern 3: Performance Comparison

Compare performance across operations:

```javascript
const profiler = window.__KALXJS_DEVTOOLS__.profiler;

async function compareOperations() {
  const results = {};

  // Test operation 1
  profiler.startRecording({ label: 'Operation A' });
  await operationA();
  results.operationA = profiler.stopRecording().metrics;

  // Test operation 2
  profiler.startRecording({ label: 'Operation B' });
  await operationB();
  results.operationB = profiler.stopRecording().metrics;

  // Compare
  console.log('Performance Comparison:');
  console.log('Operation A avg:', results.operationA.avgRenderTime.toFixed(2) + 'ms');
  console.log('Operation B avg:', results.operationB.avgRenderTime.toFixed(2) + 'ms');

  const speedup = results.operationA.avgRenderTime / results.operationB.avgRenderTime;
  console.log('Speedup:', speedup.toFixed(2) + 'x');
}

compareOperations();
```

---

### Pattern 4: Export Performance Data

Export recordings for analysis:

```javascript
const profiler = window.__KALXJS_DEVTOOLS__.profiler;

// Record performance
profiler.startRecording();
// ... perform actions ...
const recording = profiler.stopRecording();

// Export as JSON
const json = profiler.exportRecording(recording.id);

// Download
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `perf-${Date.now()}.json`;
a.click();
```

---

## Event Monitoring

### Pattern 1: Component Registration Tracking

Track all component registrations:

```javascript
const hook = window.__KALXJS_DEVTOOLS__.hook;
const registrationLog = [];

hook.on('component:registered', (data) => {
  const info = {
    timestamp: Date.now(),
    id: data.id,
    name: data.instance.$options.name || 'Unknown',
    instance: data.instance
  };
  registrationLog.push(info);
  console.log(`✓ Registered: ${info.name}`);
});

// View log
window.getRegistrationLog = () => registrationLog;
```

---

### Pattern 2: Update Frequency Monitoring

Monitor how often components update:

```javascript
const hook = window.__KALXJS_DEVTOOLS__.hook;
const updateCounts = new Map();

hook.on('component:updated', (data) => {
  const count = updateCounts.get(data.id) || 0;
  updateCounts.set(data.id, count + 1);

  // Warn if updates too frequent
  if (count > 100) {
    console.warn(`⚠ High update frequency for ${data.id}: ${count} updates`);
  }
});

// View update counts
window.getUpdateCounts = () => {
  return Array.from(updateCounts.entries())
    .sort((a, b) => b[1] - a[1]);
};
```

---

### Pattern 3: Event Filtering

Filter events by criteria:

```javascript
const hook = window.__KALXJS_DEVTOOLS__.hook;

// Only log updates for specific component
const targetId = 'component-1';
hook.on('component:updated', (data) => {
  if (data.id === targetId) {
    console.log('Target component updated:', data.updates);
  }
});

// Only log updates with certain properties
hook.on('component:updated', (data) => {
  if (data.updates.count !== undefined) {
    console.log('Count changed:', data.updates.count);
  }
});
```

---

### Pattern 4: Session Monitoring

Monitor app lifecycle:

```javascript
const hook = window.__KALXJS_DEVTOOLS__.hook;

const sessionLog = {
  startTime: Date.now(),
  appsRegistered: [],
  totalComponents: 0,
  updates: 0
};

hook.on('app:registered', (data) => {
  sessionLog.appsRegistered.push({
    id: data.id,
    name: data.app.$options?.name,
    time: Date.now()
  });
});

hook.on('component:registered', () => {
  sessionLog.totalComponents++;
});

hook.on('component:updated', () => {
  sessionLog.updates++;
});

window.getSessionLog = () => sessionLog;
```

---

## Integration Patterns

### Pattern 1: React DevTools-like UI

Display component tree:

```javascript
const hook = window.__KALXJS_DEVTOOLS__.hook;

function renderComponentTree() {
  const apps = hook.getApps();

  apps.forEach(app => {
    console.log(`📦 App: ${app.name}`);

    const tree = hook.getComponentTree(app.id);
    renderTree(tree, 1);
  });
}

function renderTree(nodes, depth) {
  nodes.forEach(node => {
    const indent = '  '.repeat(depth);
    console.log(`${indent}├ ${node.name} (${node.id})`);
    if (node.children.length > 0) {
      renderTree(node.children, depth + 1);
    }
  });
}

renderComponentTree();
```

---

### Pattern 2: Dashboard Display

Create a simple dashboard:

```javascript
function displayDevToolsDashboard() {
  const { hook, inspector, profiler } = window.__KALXJS_DEVTOOLS__;

  const dashboard = {
    apps: hook.getApps().length,
    components: hook.getComponents().length,
    recordings: profiler.getRecordings().length,
    latestRecording: profiler.getRecordings().at(-1),
    allMetrics: profiler.getAllMetrics()
  };

  console.table(dashboard);

  if (dashboard.latestRecording) {
    console.log('Latest Recording:');
    console.table({
      Duration: dashboard.latestRecording.duration + 'ms',
      Events: dashboard.latestRecording.metrics.totalEvents,
      Renders: dashboard.latestRecording.metrics.renders,
      Avg Render: dashboard.latestRecording.metrics.avgRenderTime.toFixed(2) + 'ms'
    });
  }
}

window.showDashboard = displayDevToolsDashboard;
```

---

### Pattern 3: Memory Profiling

Monitor memory usage during recording:

```javascript
async function profileMemory() {
  const profiler = window.__KALXJS_DEVTOOLS__.profiler;

  console.log('Starting memory profile...');
  const startMem = performance.memory.usedJSHeapSize;

  profiler.startRecording({ label: 'Memory Profile' });

  // Perform operations
  for (let i = 0; i < 100; i++) {
    // Simulate heavy operations
    await new Promise(r => setTimeout(r, 10));
  }

  profiler.stopRecording();
  const endMem = performance.memory.usedJSHeapSize;

  console.log(`Memory used: ${((endMem - startMem) / 1024 / 1024).toFixed(2)}MB`);
}
```

---

## Troubleshooting

### Issue: DevTools Hook Not Found

**Problem**: `getDevToolsHook()` returns `null`

**Solutions**:

```javascript
// 1. Ensure initialization
import { createDevTools } from '@kalxjs/devtools';
const devtools = createDevTools({ enabled: true });

// 2. Check timing (must init before use)
if (!getDevToolsHook()) {
  console.error('DevTools not initialized yet');
}

// 3. Force initialization
import { initDevTools } from '@kalxjs/devtools';
const hook = initDevTools();
if (!hook) {
  console.error('Not in browser environment');
}
```

---

### Issue: State Edit Not Working

**Problem**: `editState()` returns `false`

**Solutions**:

```javascript
const inspector = window.__KALXJS_DEVTOOLS__.inspector;

// 1. Check editability
const details = inspector.getComponentDetails(componentId);
if (!details.state.count.editable) {
  console.error('Count is not editable');
}

// 2. Verify component exists
if (!details) {
  console.error('Component not found');
}

// 3. Check path syntax
// ✓ Correct: 'user.name', 'count'
// ✗ Wrong: 'user["name"]', 'user[0]'

// 4. Verify value type
const types = details.state.count.type;
console.log('Expected type:', types); // Should be 'number'
const success = inspector.editState(componentId, 'count', 'not-a-number');
// Will fail because value is wrong type
```

---

### Issue: Performance Metrics Missing

**Problem**: `getComponentMetrics()` returns `null`

**Solutions**:

```javascript
const profiler = window.__KALXJS_DEVTOOLS__.profiler;

// 1. Start recording first
profiler.startRecording();

// 2. Ensure profiler was recording when component rendered
// Records occur during active recording only

// 3. Check component ID
const components = hook.getComponents();
console.log('Available components:', components.map(c => c.id));

// 4. Record manually if needed
const duration = 2.5; // ms
profiler.recordRender(componentId, duration);
```

---

### Issue: Console Warnings

**Problem**: Getting console warnings

**Solutions**:

```javascript
// Warning: "Component {id} not found"
// → Component was unregistered or ID is wrong
const components = hook.getComponents();
console.log('Valid IDs:', components.map(c => c.id));

// Warning: "Already recording"
// → Stop current recording first
profiler.stopRecording();
profiler.startRecording();

// Warning: "Not recording"
// → Start recording before stopping
profiler.startRecording();
// ... do work ...
profiler.stopRecording();

// Warning: "DevTools hook not found"
// → Initialize DevTools before creating inspector/profiler
const devtools = createDevTools({ enabled: true });
const inspector = createInspector(); // Now safe
```

---

### Debugging Checklist

```javascript
// ✓ Is DevTools initialized?
console.log('Hook:', getDevToolsHook());

// ✓ Is component registered?
console.log('Components:', hook.getComponents());

// ✓ Is inspector/profiler available?
console.log('Inspector:', window.__KALXJS_DEVTOOLS__.inspector);
console.log('Profiler:', window.__KALXJS_DEVTOOLS__.profiler);

// ✓ Is hook connected?
console.log('Connected:', hook.connected);

// ✓ Are events firing?
hook.on('component:updated', () => console.log('✓ Event fired'));

// ✓ Can you edit state?
const canEdit = inspector.isEditable(value);
console.log('Can edit:', canEdit);
```

---

## Console Commands Quick Reference

```javascript
// Access DevTools
const dt = window.__KALXJS_DEVTOOLS__;
const { hook, inspector, profiler } = dt;

// Inspect
hook.getApps()
hook.getComponents()
hook.getComponentTree('app-id')
inspector.getComponentDetails('component-id')
profiler.getRecordings()

// Record performance
profiler.startRecording()
// ... perform actions ...
profiler.stopRecording()

// Analyze
profiler.analyzePerformance(recording)
profiler.getAllMetrics()

// Export
profiler.exportRecording('recording-id')

// Monitor
hook.on('component:updated', handler)

// Edit
inspector.editState('component-id', 'prop', value)
inspector.highlightComponent('component-id')
```

---

**Last Updated**: Phase 9 Usage Guide
**Status**: ✓ Complete