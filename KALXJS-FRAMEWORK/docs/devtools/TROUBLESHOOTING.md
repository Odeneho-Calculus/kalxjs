# DevTools Troubleshooting Guide

Solutions to common KALXJS DevTools issues and problems.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Initialization Problems](#initialization-problems)
3. [Component Registration Issues](#component-registration-issues)
4. [State Editing Problems](#state-editing-problems)
5. [Performance Issues](#performance-issues)
6. [Browser Extension Issues](#browser-extension-issues)
7. [Event System Problems](#event-system-problems)
8. [Debugging Techniques](#debugging-techniques)

---

## Installation Issues

### Issue: Package Not Found

**Error**: `Cannot find module '@kalxjs/devtools'`

**Causes**:
- Package not installed
- Wrong package name
- Incorrect import path

**Solutions**:

```bash
# 1. Install the package
npm install @kalxjs/devtools

# 2. Verify installation
npm ls @kalxjs/devtools

# 3. Clear npm cache and reinstall
npm cache clean --force
npm install

# 4. Check for typos
npm search kalxjs-devtools
```

**Correct Import**:
```javascript
// ✓ Correct
import { initDevTools } from '@kalxjs/devtools';

// ✗ Wrong
import { initDevTools } from 'kalxjs-devtools';
import { initDevTools } from '@kalxjs/devtools-api';
```

---

### Issue: Build Bundler Error

**Error**: `Module not found` or build fails

**For Webpack**:
```javascript
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      '@kalxjs/devtools': '@kalxjs/devtools/dist/index.esm.js'
    }
  }
};
```

**For Vite**:
```javascript
// vite.config.js
export default {
  optimizeDeps: {
    include: ['@kalxjs/devtools']
  }
};
```

**For Rollup**:
```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';

export default {
  plugins: [
    resolve({
      preferBuiltins: false
    })
  ]
};
```

---

## Initialization Problems

### Issue: DevTools Hook Not Initialized

**Error**: `window.__KALXJS_DEVTOOLS_HOOK__ is undefined`

**Causes**:
- `initDevTools()` not called
- Called after app mount
- Environment issue

**Solutions**:

```javascript
// ✓ Correct order
const app = createApp(App);

const hook = initDevTools();
if (hook) {
  hook.registerApp(app);
}

app.mount('#app');

// ✗ Wrong - called too late
app.mount('#app');
const hook = initDevTools(); // Too late!
```

**Verify Initialization**:
```javascript
// In browser console
console.log('Hook available:', !!window.__KALXJS_DEVTOOLS_HOOK__);
console.log('Hook instance:', window.__KALXJS_DEVTOOLS_HOOK__);
```

---

### Issue: initDevTools Returns null

**Error**: `initDevTools()` returns `null`

**Causes**:
- Running in non-browser environment (Node.js, SSR)
- SSR context detection issue
- Older browser without `window` object

**Solutions**:

```javascript
// ✓ Safe initialization
if (typeof window !== 'undefined') {
  const hook = initDevTools();
  if (hook) {
    hook.registerApp(app);
  }
}

// ✓ Development-only
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const hook = initDevTools();
  if (hook) {
    hook.registerApp(app);
  }
}

// ✓ With error handling
try {
  const hook = initDevTools();
  if (!hook) {
    console.warn('DevTools not available in this environment');
  }
} catch (error) {
  console.warn('Failed to initialize DevTools:', error);
}
```

---

### Issue: Multiple Instances Created

**Error**: Multiple DevTools instances or duplicate initialization

**Cause**: `initDevTools()` called multiple times

**Solution**: `initDevTools()` returns the same instance

```javascript
// Safe - always returns same instance
const hook1 = initDevTools();
const hook2 = initDevTools();
console.log(hook1 === hook2); // true - same instance
```

---

## Component Registration Issues

### Issue: Components Not Appearing in Inspector

**Error**: Registered components don't show in DevTools

**Causes**:
- Wrong app ID
- Component not actually mounted
- Registration timing issue
- Wrong hook instance

**Solutions**:

```javascript
// 1. Verify app registration first
const hook = getDevToolsHook();
console.log('Apps:', hook?.getApps()); // Should show your app

// 2. Use correct app ID
const appId = hook.registerApp(app, { id: 'my-app' });
console.log('App ID:', appId); // Remember this ID

// 3. Register in mounted() hook
export default {
  name: 'MyComponent',
  mounted() {
    const hook = getDevToolsHook();
    if (hook) {
      const componentId = hook.registerComponent(this, 'my-app');
      console.log('Registered component:', componentId);
    }
  }
};

// 4. Check for errors in console
// Look for: [KALXJS DevTools] Error...
```

---

### Issue: Only Some Components Appear

**Error**: Selectively appearing components

**Causes**:
- Components register at different times
- Async component rendering
- Conditional rendering
- Components in portals

**Solutions**:

```javascript
// 1. Ensure consistent timing
export default {
  name: 'MyComponent',
  mounted() {
    this.$nextTick(() => {
      const hook = getDevToolsHook();
      if (hook) {
        hook.registerComponent(this, 'my-app');
      }
    });
  }
};

// 2. For async components
const AsyncComponent = defineAsyncComponent(() =>
  import('./AsyncComponent.js').then(m => {
    const hook = getDevToolsHook();
    if (hook) {
      // Register after import
      hook.registerComponent(this, 'my-app');
    }
    return m;
  })
);

// 3. For conditional components
<template>
  <div v-if="showComponent">
    <MyComponent ref="comp" />
  </div>
</template>

// Register in ref callback
<MyComponent
  v-if="showComponent"
  :ref="el => {
    if (el && typeof el === 'object') {
      const hook = getDevToolsHook();
      if (hook) {
        hook.registerComponent(el, 'my-app');
      }
    }
  }"
/>
```

---

## State Editing Problems

### Issue: State Won't Update in DevTools

**Error**: Can't edit state or changes don't take effect

**Causes**:
- Trying to edit non-primitive types
- Component not reactive
- DevTools API error
- Browser extension issue

**Solutions**:

```javascript
// ✓ Editable (primitives only)
hook.editState(componentId, 'count', 42);
hook.editState(componentId, 'name', 'John');
hook.editState(componentId, 'active', true);
hook.editState(componentId, 'value', null);

// ✗ Non-editable (will fail)
hook.editState(componentId, 'user', { name: 'John' });
hook.editState(componentId, 'items', [1, 2, 3]);
hook.editState(componentId, 'handler', () => {});
```

**Check Component Reactivity**:
```javascript
// ✓ Reactive
data() {
  return {
    count: 0
  };
}

// ✓ Reactive (with ref)
setup() {
  const count = ref(0);
  return { count };
}

// ✗ Not reactive (no getter/setter)
this.localVar = 42; // Won't be editable
```

---

### Issue: Editing Complex State

**Error**: Cannot edit objects, arrays, or nested properties

**Solution**: Edit through component methods instead

```javascript
// ✗ Cannot edit directly
hook.editState(componentId, 'user', { name: 'Jane' });

// ✓ Use component methods
const component = hook.getComponents()
  .find(c => c.id === componentId);

if (component && component.instance) {
  // Call component method instead
  component.instance.updateUser({ name: 'Jane' });
}
```

---

### Issue: Changes Don't Reflect in UI

**Error**: State updates but UI doesn't change

**Causes**:
- Component not reactive
- Missing watchers
- Computed properties not triggered
- Vue reactivity rules not followed

**Solution**: Check Vue reactivity guide

```javascript
// ✓ Proper state management
export default {
  data() {
    return {
      user: {
        name: 'John'
      }
    };
  },
  watch: {
    'user.name'(newValue) {
      console.log('Name changed:', newValue);
    }
  },
  methods: {
    updateName(name) {
      this.$set(this.user, 'name', name);
      // or:
      this.user = { ...this.user, name };
    }
  }
};
```

---

## Performance Issues

### Issue: DevTools Slowing Down Application

**Error**: App performance degrades with DevTools enabled

**Causes**:
- Too many registered components
- Too much state data
- Event buffering overhead
- Performance profiling running

**Solutions**:

```javascript
// 1. Register only important components
export default {
  name: 'LeafComponent', // Don't register leaf components
  mounted() {
    // Skip registration for simple/leaf components
  }
};

// 2. Limit state depth
const hook = getDevToolsHook();
if (hook) {
  hook.setSettings({
    stateDepth: 1, // Reduce from default 2
    bufferSize: 500 // Reduce from default 1000
  });
}

// 3. Disable in production
if (process.env.NODE_ENV === 'production') {
  // Don't initialize DevTools
}

// 4. Stop profiling when not in use
if (hook.profiler) {
  hook.profiler.stopRecording();
}

// 5. Clear old data periodically
if (hook.profiler) {
  hook.profiler.clearMetrics();
}
```

### Issue: Memory Leak from DevTools

**Error**: Memory usage keeps growing

**Causes**:
- Event listeners not cleaned up
- Circular references
- Buffer not clearing
- Components registered but not unregistered

**Solutions**:

```javascript
// 1. Unregister components on destroy
export default {
  mounted() {
    const hook = getDevToolsHook();
    if (hook) {
      this._componentId = hook.registerComponent(this, 'my-app');
    }
  },
  destroyed() {
    // Cleanup if needed
    // Note: hook doesn't require explicit unregister
  }
};

// 2. Unregister app on cleanup
function cleanup() {
  const hook = getDevToolsHook();
  if (hook) {
    hook.unregisterApp('my-app');
  }
}

// 3. Clear event listeners
const unsubscribe = hook.on('component:updated', handler);
// Later:
unsubscribe(); // Cleanup

// 4. Clear old metrics
if (hook.profiler) {
  hook.profiler.clearMetrics();
}
```

---

## Browser Extension Issues

### Issue: Extension Not Appearing in DevTools

**Error**: KALXJS tab doesn't appear in DevTools

**Causes**:
- Extension not installed
- Extension disabled
- DevTools not initialized
- DevTools hidden

**Solutions**:

```bash
# 1. Verify extension installed
# Chrome: chrome://extensions/ → Check for KALXJS DevTools

# 2. Enable if disabled
# Chrome: chrome://extensions/ → Toggle ON for KALXJS DevTools

# 3. Reload page and DevTools
# F12 → Right-click reload button → Hard reload → Close/reopen DevTools

# 4. Check initialization
# Console: window.__KALXJS_DEVTOOLS_HOOK__
```

---

### Issue: Extension Can't See Application State

**Error**: No components or data appearing in extension

**Causes**:
- Hook not initialized
- App not registered
- Components not registered
- Communication issue

**Solutions**:

```javascript
// 1. Verify hook
console.log('Hook:', window.__KALXJS_DEVTOOLS_HOOK__);

// 2. Verify app registered
const hook = window.__KALXJS_DEVTOOLS_HOOK__;
console.log('Apps:', hook?.getApps());

// 3. Verify components
console.log('Components:', hook?.getComponents());

// 4. Check console for errors
// Look for red error messages

// 5. Manually test communication
hook?.on('component:registered', (data) => {
  console.log('Component registered:', data);
});
```

---

### Issue: Extension Keeps Crashing

**Error**: Extension stops working or becomes unresponsive

**Solutions**:

```bash
# 1. Clear extension data
# Chrome: DevTools → KALXJS → Settings → Clear Data

# 2. Reload extension
# Chrome: chrome://extensions/ → Disable → Enable

# 3. Reinstall extension
# Chrome: Uninstall and reinstall from Web Store

# 4. Check Chrome version compatibility
# Chrome: chrome://version/ → Ensure up to date
```

---

## Event System Problems

### Issue: Events Not Firing

**Error**: Event listeners not triggered

**Causes**:
- Hook not initialized
- Wrong event name
- Listener added after event
- App/components not registered

**Solutions**:

```javascript
// ✓ Correct event names
hook.on('app:registered', handler);
hook.on('component:registered', handler);
hook.on('component:updated', handler);
hook.on('profiler:started', handler);

// ✓ Verify hook exists
const hook = getDevToolsHook();
if (!hook) {
  console.error('DevTools not initialized');
  return;
}

// ✓ Add listeners before operations
const hook = getDevToolsHook();
hook.on('component:registered', (data) => {
  console.log('Component registered:', data.id);
});
// Then register app and components

// ✓ Test event manually
const hook = getDevToolsHook();
hook.on('component:updated', (data) => {
  console.log('Component updated:', data);
});

// Manually emit event
const components = hook.getComponents();
if (components.length > 0) {
  hook.updateComponent(components[0].id, { test: 'value' });
}
```

---

### Issue: Memory Leak from Event Listeners

**Error**: Memory keeps growing with listeners

**Solution**: Unsubscribe from events

```javascript
// ✓ Proper cleanup
const unsubscribe = hook.on('component:updated', handler);

// Later, cleanup:
unsubscribe();

// ✓ Or use off method
hook.on('component:updated', handler);
// Later:
hook.off('component:updated', handler);
```

---

## Debugging Techniques

### Technique 1: Console Inspection

```javascript
// Check hook status
const hook = window.__KALXJS_DEVTOOLS_HOOK__;
console.log({
  initialized: !!hook,
  apps: hook?.getApps().length,
  components: hook?.getComponents().length,
  connected: hook?.isConnected?.(),
  profiling: hook?.profiler?.isRecording?.()
});
```

### Technique 2: Event Monitoring

```javascript
// Monitor all events
const hook = window.__KALXJS_DEVTOOLS_HOOK__;
if (hook) {
  const events = [
    'app:registered',
    'component:registered',
    'component:updated',
    'profiler:started'
  ];

  events.forEach(event => {
    hook.on(event, (data) => {
      console.log(`[${event}]`, data);
    });
  });
}
```

### Technique 3: State Inspection

```javascript
// Deep inspect component state
const hook = window.__KALXJS_DEVTOOLS_HOOK__;
const components = hook.getComponents();

components.forEach(comp => {
  console.log(`${comp.name}:`, {
    id: comp.id,
    state: comp.state,
    props: comp.props,
    children: comp.children
  });
});
```

### Technique 4: Network Inspection

Check browser DevTools Network tab:

```
Message Format (postMessage to extension):
{
  source: 'kalxjs-devtools-hook',
  type: 'STATE_CHANGE',
  data: {...}
}
```

### Technique 5: Performance Metrics

```javascript
// Get performance data
const hook = window.__KALXJS_DEVTOOLS_HOOK__;
if (hook?.profiler) {
  hook.profiler.startRecording();
  // ... perform actions ...
  hook.profiler.stopRecording();

  const metrics = hook.profiler.getMetrics();
  console.log('Performance:', metrics);
}
```

---

## Getting Help

### Check These Resources First

1. **[API Reference](./API.md)** - Complete method documentation
2. **[Usage Guide](./USAGE_GUIDE.md)** - Practical patterns
3. **[Installation Guide](./INSTALLATION.md)** - Setup instructions
4. **[Quick Start](./QUICK_START.md)** - 5-minute intro

### Report Issues

- **GitHub Issues**: https://github.com/kalxjs/kalxjs/issues
- **Include**: Error message, code example, browser/version info
- **Attach**: Screenshot or reproduction

### Enable Debug Mode

```javascript
// Enable verbose logging
const hook = window.__KALXJS_DEVTOOLS_HOOK__;
if (hook) {
  hook.setSettings({
    debugMode: true,
    verboseLogging: true
  });
}

// Check browser console for detailed logs
```

---

## Performance Baseline

Expected overhead:
- Hook initialization: ~2ms
- Component registration: ~1ms per component
- State update event: ~0.5ms
- Extension communication: ~1-2ms
- Performance profiling: ~5ms per operation

**Total typical overhead**: 5-10ms per interaction

---

**Still Having Issues?** Check the [DevTools GitHub](https://github.com/kalxjs/kalxjs) or open an issue with your problem details.