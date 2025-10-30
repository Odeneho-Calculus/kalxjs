# DevTools Installation & Setup

Complete guide to installing and configuring KALXJS DevTools in your project.

## Prerequisites

- KALXJS Framework v2.0.0 or higher
- Node.js 14 or higher
- npm, yarn, or pnpm

## Installation

### Step 1: Install the Package

Choose your package manager:

```bash
# npm
npm install @kalxjs/devtools

# yarn
yarn add @kalxjs/devtools

# pnpm
pnpm add @kalxjs/devtools
```

### Step 2: Initialize in Your Application

Import and initialize DevTools in your application entry point:

```javascript
// main.js or index.js
import { createApp } from '@kalxjs/core';
import { initDevTools } from '@kalxjs/devtools';
import App from './App.js';

const app = createApp(App);

// Initialize DevTools (recommended for development only)
if (process.env.NODE_ENV === 'development') {
  const hook = initDevTools();
  if (hook) {
    hook.registerApp(app, {
      name: 'My Application',
      version: '1.0.0'
    });
  }
}

app.mount('#app');
```

### Step 3: Register Components (Optional)

Components can be registered individually for inspection:

```javascript
import { getDevToolsHook } from '@kalxjs/devtools';

export default {
  name: 'UserCard',

  mounted() {
    const hook = getDevToolsHook();
    if (hook) {
      hook.registerComponent(this, 'main-app');
    }
  },

  // ... rest of component
};
```

## Configuration Options

### App Registration Options

```javascript
hook.registerApp(app, {
  id: 'my-app',              // Custom app ID (optional)
  name: 'My App',            // Display name (optional)
  version: '1.0.0'           // Version string (optional)
});
```

### DevTools Settings

Configure DevTools behavior:

```javascript
const hook = getDevToolsHook();
if (hook) {
  hook.setSettings({
    autoRegisterComponents: false,  // Auto-register all components
    maxComponentDepth: 50,          // Max tree depth for inspection
    stateDepth: 2,                  // State serialization depth
    enablePerformanceProfiling: true, // Enable profiler
    bufferSize: 1000                // Event buffer size
  });
}
```

## Development vs Production

### Development Setup

```javascript
// Full DevTools with all features
if (process.env.NODE_ENV === 'development') {
  const hook = initDevTools();
  if (hook) {
    hook.registerApp(app, {
      name: process.env.APP_NAME || 'KALXJS App',
      version: process.env.APP_VERSION || '1.0.0'
    });

    // Enable performance profiling
    if (hook.profiler) {
      hook.profiler.startRecording();
    }
  }
}
```

### Production Setup

```javascript
// Minimal DevTools (if needed for debugging)
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEVTOOLS) {
  const hook = initDevTools();
  if (hook) {
    hook.registerApp(app, {
      name: 'Production App',
      version: process.env.APP_VERSION
    });
  }
}
```

## Build Configuration

### Vite Setup

If using Vite, DevTools is automatically available. No special configuration needed.

### Webpack Setup

```javascript
// webpack.config.js
module.exports = {
  // ... other config
  resolve: {
    alias: {
      '@kalxjs/devtools': '@kalxjs/devtools/dist/index.esm.js'
    }
  }
};
```

### Rollup Setup

```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';

export default {
  // ... other config
  external: [],
  plugins: [
    resolve({
      preferBuiltins: false
    })
  ]
};
```

## Browser DevTools Extension

### Installation

The official KALXJS DevTools browser extension provides a visual interface:

1. Download the extension from [Chrome Web Store](https://chrome.google.com/webstore)
2. Or build locally:
   ```bash
   cd kalxjsDevToolBrowserExtension
   npm install
   npm run build
   # Load build/ folder as unpacked extension in Chrome
   ```

### Configuration for Extension

The extension automatically communicates with DevTools API via `postMessage`:

```javascript
// No additional configuration needed!
// The hook announces itself on initialization:
// window.postMessage({
//   source: 'kalxjs-devtools-hook',
//   type: 'HOOK_READY'
// }, '*')
```

## Environment Variables

### Recommended Setup

```bash
# .env.development
VITE_DEVTOOLS_ENABLED=true
VITE_APP_NAME=My App
VITE_APP_VERSION=1.0.0

# .env.production
VITE_DEVTOOLS_ENABLED=false
```

### Usage in Code

```javascript
const hook = initDevTools();
if (hook) {
  hook.registerApp(app, {
    name: import.meta.env.VITE_APP_NAME,
    version: import.meta.env.VITE_APP_VERSION
  });
}
```

## Verification

### Check Installation

```javascript
// In browser console
console.log(window.__KALXJS_DEVTOOLS_HOOK__); // Should be DevToolsHook instance
```

### Verify App Registration

```javascript
// In browser console
const hook = window.__KALXJS_DEVTOOLS_HOOK__;
if (hook) {
  console.log('Registered apps:', hook.getApps());
  console.log('Registered components:', hook.getComponents());
}
```

### Listen for Events

```javascript
const hook = window.__KALXJS_DEVTOOLS_HOOK__;
if (hook) {
  hook.on('app:registered', (data) => {
    console.log('App registered:', data.id);
  });

  hook.on('component:registered', (data) => {
    console.log('Component registered:', data.id);
  });
}
```

## TypeScript Support

DevTools works with TypeScript projects. Type definitions are included:

```typescript
import { initDevTools, getDevToolsHook, DevToolsHook } from '@kalxjs/devtools';

const hook: DevToolsHook | null = initDevTools();

if (hook) {
  hook.registerApp(app, {
    name: 'My App',
    version: '1.0.0'
  });
}
```

## Troubleshooting

### Hook Not Initialized

```javascript
const hook = getDevToolsHook();
if (!hook) {
  console.warn('DevTools not initialized');
  // Make sure initDevTools() was called before registering app
}
```

### App Not Appearing in Extension

1. Verify `initDevTools()` was called
2. Check browser console for errors: `console.error()`
3. Verify extension is installed and enabled
4. Refresh the page

### Performance Impact

DevTools adds minimal overhead in development. To minimize:

- Register only key components
- Disable auto-registration of all components
- Set appropriate `stateDepth` (default: 2)
- Clear event buffer periodically

## Next Steps

- [Quick Start Guide](./QUICK_START.md) - Get started in 5 minutes
- [Usage Guide](./USAGE_GUIDE.md) - Learn practical patterns
- [API Reference](./API.md) - Complete API documentation
- [Browser Extension](./BROWSER_EXTENSION.md) - Extension setup and usage

## Support

- **Documentation**: See [DevTools Documentation](./README.md)
- **Issues**: Report on [GitHub](https://github.com/kalxjs/kalxjs)
- **Discussions**: Join [Community Discussions](https://github.com/kalxjs/kalxjs/discussions)