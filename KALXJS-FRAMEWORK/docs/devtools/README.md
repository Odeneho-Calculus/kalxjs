# KALXJS DevTools Documentation

Welcome to the official KALXJS DevTools documentation. This directory contains comprehensive guides for using and integrating the DevTools package into your KALXJS applications.

## Quick Navigation

### Getting Started
- **[Installation & Setup](./INSTALLATION.md)** - How to install and configure DevTools in your project
- **[Quick Start](./QUICK_START.md)** - 5-minute introduction with basic examples

### API Documentation
- **[Complete API Reference](./API.md)** - Detailed technical specifications for all DevTools APIs
  - DevToolsHook API (app and component management)
  - ComponentInspector API (inspection and state editing)
  - PerformanceProfiler API (performance analysis)
  - Event system and type definitions

### Practical Guides
- **[Usage Guide & Patterns](./USAGE_GUIDE.md)** - Real-world patterns and integration strategies
  - Component registration patterns
  - State inspection and editing
  - Performance analysis workflows
  - Event monitoring and filtering
  - Integration with custom dashboards

### Reference
- **[API Index](#api-index)** - Complete method listing
- **[Event Reference](#event-reference)** - All available events
- **[Browser Extension Integration](./BROWSER_EXTENSION.md)** - DevTools extension specifics
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions

## Features

✓ **Component Inspection** - Inspect component state, props, and hierarchy
✓ **State Editing** - Modify component state in real-time during development
✓ **Performance Profiling** - Analyze render times and update frequency
✓ **Event Monitoring** - Track component lifecycle and updates
✓ **Browser DevTools Integration** - First-class Chrome DevTools extension
✓ **Visual Highlighting** - Highlight components directly in the page

## Installation

```bash
npm install @kalxjs/devtools
# or
yarn add @kalxjs/devtools
# or
pnpm add @kalxjs/devtools
```

## Basic Setup

```javascript
import { initDevTools } from '@kalxjs/devtools';
import { createApp } from '@kalxjs/core';
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

## API Index

### DevToolsHook Methods

**App Management**
- `registerApp(app, options?)` - Register an application
- `unregisterApp(id)` - Unregister an application
- `getApps()` - Get all registered applications

**Component Management**
- `registerComponent(instance, appId)` - Register a component
- `updateComponent(id, updates)` - Update component state
- `getComponents(appId?)` - Get registered components
- `getComponentTree(appId)` - Get component hierarchy

**Event System**
- `on(event, callback)` - Subscribe to events
- `off(event, callback)` - Unsubscribe from events
- `once(event, callback)` - Subscribe to single event

**Browser Connection**
- `connect()` - Connect to browser DevTools
- `disconnect()` - Disconnect from browser DevTools
- `isConnected()` - Check connection status

**Utilities**
- `extractState(instance)` - Extract reactive state
- `setSettings(settings)` - Configure DevTools settings

### ComponentInspector Methods

- `selectComponent(componentId)` - Select a component
- `getComponentDetails(componentId)` - Get full component info
- `serializeState(value, depth?)` - Serialize state for transmission
- `editState(componentId, path, value)` - Edit component state
- `highlight(componentId)` - Highlight component in DOM
- `unhighlight()` - Remove visual highlight

### PerformanceProfiler Methods

- `startRecording()` - Start performance recording
- `stopRecording()` - Stop performance recording
- `getMetrics()` - Get recorded metrics
- `analyzePerformance()` - Run performance analysis
- `exportMetrics(format?)` - Export performance data
- `clearMetrics()` - Clear recorded data

## Event Reference

The DevTools API emits standardized events for lifecycle and state changes:

**Application Events**
- `app:registered` - App registered with DevTools
- `app:unregistered` - App unregistered from DevTools

**Component Events**
- `component:registered` - Component registered for inspection
- `component:updated` - Component state changed
- `component:removed` - Component unregistered

**Performance Events**
- `profiler:started` - Performance recording started
- `profiler:stopped` - Performance recording stopped
- `profiler:report` - Performance analysis completed

**System Events**
- `devtools:connected` - Connected to browser extension
- `devtools:disconnected` - Disconnected from browser extension
- `devtools:error` - Internal DevTools error occurred

## Browser Extension Integration

KALXJS provides an official Chrome DevTools extension that integrates seamlessly with the DevTools API:

- **Visual component tree** - Explore component hierarchy
- **Real-time state inspection** - View current component state
- **State editing** - Edit state with immediate visual feedback
- **Performance tab** - View render times and profiling data
- **Event timeline** - Timeline of component updates

See [Browser Extension Integration Guide](./BROWSER_EXTENSION.md) for installation and usage.

## Best Practices

### Development Only
DevTools should be initialized only during development to avoid overhead in production:

```javascript
if (process.env.NODE_ENV === 'development') {
  const hook = initDevTools();
  if (hook) hook.registerApp(app, { name: 'MyApp' });
}
```

### Selective Component Registration
Register components selectively for performance:

```javascript
export default {
  name: 'UserComponent',
  mounted() {
    const hook = getDevToolsHook();
    if (hook) {
      hook.registerComponent(this, 'main-app');
    }
  }
};
```

### State Editing Limitations
Only primitive types (string, number, boolean, null) can be edited through DevTools:

```javascript
// ✓ Editable
hook.editState(componentId, 'count', 10);
hook.editState(componentId, 'name', 'John');
hook.editState(componentId, 'active', true);

// ✗ Not editable (complex types)
hook.editState(componentId, 'user', { name: 'John' }); // Will fail
```

### Performance Monitoring
Use the profiler during development to identify performance bottlenecks:

```javascript
const hook = getDevToolsHook();
if (hook?.profiler) {
  hook.profiler.startRecording();
  // ... perform user actions ...
  hook.profiler.stopRecording();
  const analysis = hook.profiler.analyzePerformance();
  console.log('Slow renders:', analysis.slowRenders);
}
```

## Documentation Structure

This documentation is organized as follows:

```
docs/devtools/
├── README.md                          # This file
├── INSTALLATION.md                    # Installation and setup
├── QUICK_START.md                     # Quick start guide
├── API.md                             # Complete API reference
├── USAGE_GUIDE.md                     # Patterns and examples
├── BROWSER_EXTENSION.md               # Extension integration
├── TROUBLESHOOTING.md                 # Common issues
└── examples/                          # Code examples
    ├── basic-setup.js
    ├── component-inspection.js
    ├── performance-analysis.js
    └── event-monitoring.js
```

## Related Documentation

- [KALXJS Core Documentation](../README.md)
- [Component API](../api/component.md)
- [State Management](../state-management.md)
- [Performance Optimization](../performance-optimization.md)

## Support & Contributing

- **Issues**: Report bugs on [GitHub](https://github.com/kalxjs/kalxjs)
- **Discussions**: Join community discussions
- **Contributing**: See [Contributing Guide](../../CONTRIBUTING.md)

## License

DevTools is part of KALXJS Framework and is released under the MIT License.

---

**Next Steps:**
- Start with [Quick Start Guide](./QUICK_START.md) for hands-on introduction
- Check [Usage Guide](./USAGE_GUIDE.md) for practical patterns
- Reference [API Documentation](./API.md) for detailed specifications