# kalxjs DevTools

Advanced development tools for debugging, profiling, and optimizing kalxjs applications.

## Features

- Real-time Component Inspection
- State Management Time Travel
- Performance Profiling & Metrics
- Component Render Timeline
- Network Request Analysis
- Visual Component Graph
- Memory Usage Tracking
- Signal Dependencies Graph
- Hot Module Replacement
- Custom Plugin Support

## Installation

```bash
# Using npm
npm install @kalxjs-framework/devtools

# Using pnpm
pnpm add @kalxjs-framework/devtools
```

## Modern Setup

```typescript
import { createApp } from '@kalxjs-framework/runtime'
import { DevTools } from '@kalxjs-framework/devtools'
import type { DevToolsConfig } from '@kalxjs-framework/devtools'

const config: DevToolsConfig = {
  app: {
    name: 'MyApp',
    version: '1.0.0'
  },
  performance: {
    cpu: true,
    memory: true,
    network: true
  },
  features: {
    timeTravel: true,
    componentInspector: true,
    signalGraph: true
  }
}

const app = createApp(App)
app.use(DevTools, config)
```

## Advanced Features

### Performance Profiling

```typescript
import { profile, measure } from '@kalxjs-framework/devtools'

// Component profiling
@profile()
class ProfiledComponent {
  @measure()
  expensiveOperation() {
    // Performance tracked automatically
  }
}

// Manual profiling
const profiler = profile.start('CustomOperation')
// ...operations
profiler.end()
```

### Custom Plugins

```typescript
import { defineDevToolsPlugin } from '@kalxjs-framework/devtools'

export const CustomDebugger = defineDevToolsPlugin({
  name: 'custom-debugger',
  setup(context) {
    return {
      trackCustomMetric(name: string, value: number) {
        context.addMetric({ name, value })
      }
    }
  }
})
```

### Integration with Bundlers

```typescript
// vite.config.ts
import { kalxjsDevTools } from '@kalxjs-framework/devtools/vite'

export default defineConfig({
  plugins: [
    kalxjsDevTools({
      sourceMap: true,
      componentGraph: true
    })
  ]
})
```

## Browser Extension

The kalxjs DevTools browser extension provides an enhanced debugging experience directly in your browser's developer tools panel.

1. Install the extension from Chrome Web Store (coming soon)
2. Add DevTools to your app as shown above
3. Open Chrome DevTools and navigate to the "kalxjs" panel

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.