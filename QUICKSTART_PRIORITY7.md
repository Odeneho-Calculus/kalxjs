# Priority 7 Quick Start Guide
## Get Started with AI, Native, and Edge Features in 5 Minutes

---

## Installation

```bash
# Install all Priority 7 packages
npm install @kalxjs/ai @kalxjs/native @kalxjs/edge

# Or install individually
npm install @kalxjs/ai        # AI-powered development
npm install @kalxjs/native    # Native mobile/desktop
npm install @kalxjs/edge      # Edge computing
```

---

## 1. AI-Powered Development

### Quick Example: Code Generation

```javascript
import { CodeGenerator } from '@kalxjs/ai';

const generator = new CodeGenerator({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate a component in seconds!
const component = await generator.generateComponent(
  'Create a login form with email and password fields'
);

console.log(component.code);
```

### Quick Example: Accessibility Check

```javascript
import { AccessibilityAnalyzer } from '@kalxjs/ai';

const analyzer = new AccessibilityAnalyzer();

// Check your component
const issues = await analyzer.analyzeComponent(yourComponentCode);

// Auto-fix accessibility issues
const fixed = await analyzer.fixComponent(yourComponentCode);
```

### Quick Example: Performance Optimization

```javascript
import { PerformanceOptimizer } from '@kalxjs/ai';

const optimizer = new PerformanceOptimizer();

// Find performance issues
const issues = await optimizer.analyzePerformance(componentCode);

// Get optimization suggestions
const suggestions = await optimizer.suggestOptimizations(componentCode);

// Auto-optimize
const optimized = await optimizer.optimizeCode(componentCode);
console.log(`Performance improved by ${optimized.improvement}%`);
```

---

## 2. Native Mobile/Desktop

### Quick Example: Cross-Platform App

```javascript
import { View, Text, Button, Platform } from '@kalxjs/native';
import { ref, createApp } from '@kalxjs/core';

const App = {
  setup() {
    const count = ref(0);

    return () => (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24 }}>
          Running on {Platform.getOS()}
        </Text>
        <Text style={{ fontSize: 18 }}>
          Count: {count.value}
        </Text>
        <Button
          title="Increment"
          onPress={() => count.value++}
        />
      </View>
    );
  }
};

createApp(App).mount('#app');
```

### Quick Example: Device APIs

```javascript
import { Device, AsyncStorage } from '@kalxjs/native';

// Get device info
const info = Device.getDeviceInfo();
console.log(`Running on ${info.model}`);

// Use storage
await AsyncStorage.setItem('user', JSON.stringify({ name: 'John' }));
const user = JSON.parse(await AsyncStorage.getItem('user'));
```

### Quick Example: Electron Desktop App

```javascript
import { Electron } from '@kalxjs/native/electron';

// Create window
await Electron.createWindow({
  width: 800,
  height: 600,
  title: 'My App'
});

// File dialog
const file = await Electron.showOpenDialog({
  filters: [{ name: 'Images', extensions: ['png', 'jpg'] }]
});

// IPC Communication
Electron.on('message-from-main', (data) => {
  console.log('Received:', data);
});

Electron.send('message-to-main', { hello: 'world' });
```

### Quick Example: Mobile Camera

```javascript
import { Camera } from '@kalxjs/native/mobile';

const photo = await Camera.takePicture({
  quality: 0.8,
  flash: 'auto'
});

console.log('Photo saved at:', photo.uri);
```

---

## 3. Edge Computing

### Quick Example: Cloudflare Workers

```javascript
// worker.js
import { createWorkerHandler } from '@kalxjs/edge/cloudflare';
import { createApp } from '@kalxjs/core';

const handler = createWorkerHandler({
  middleware: [/* your middleware */]
});

export default {
  async fetch(request, env, ctx) {
    return handler(request, env, ctx);
  }
};
```

### Quick Example: Deno Deploy

```javascript
// main.ts
import { createDenoHandler } from '@kalxjs/edge/deno';

const handler = createDenoHandler({
  middleware: [/* your middleware */]
});

Deno.serve(handler);
```

### Quick Example: Vercel Edge Functions

```javascript
// api/hello.js
import { createEdgeHandler } from '@kalxjs/edge/vercel';

export default createEdgeHandler({
  middleware: [/* your middleware */]
});

export const config = {
  runtime: 'edge'
};
```

### Quick Example: Edge SSR

```javascript
import { renderToEdgeStream } from '@kalxjs/edge';
import { createApp } from '@kalxjs/core';

export default {
  async fetch(request) {
    const app = createApp(MyApp);

    return renderToEdgeStream(app, {
      request,
      minify: true,
      streaming: true
    });
  }
};
```

### Quick Example: Smart Caching

```javascript
import { EdgeCacheManager } from '@kalxjs/edge';

const cache = new EdgeCacheManager();

export default {
  async fetch(request) {
    return cache.match(request, async () => {
      // Your fetch logic
      return new Response('data');
    }, {
      strategy: 'stale-while-revalidate',
      ttl: cache.TTL_PRESETS.MEDIUM // 1 hour
    });
  }
};
```

### Quick Example: Geographic Routing

```javascript
import { GeoRouter } from '@kalxjs/edge';

const router = new GeoRouter();

router.register('US', () => new Response('Hello USA!'));
router.register('EU', () => new Response('Hello Europe!'));
router.register('*', () => new Response('Hello World!'));

export default {
  async fetch(request) {
    return router.route(request);
  }
};
```

### Quick Example: Middleware

```javascript
import {
  MiddlewareManager,
  corsMiddleware,
  rateLimitMiddleware
} from '@kalxjs/edge';

const manager = new MiddlewareManager();

manager.use(corsMiddleware({ origin: '*' }));
manager.use(rateLimitMiddleware({ limit: 100, window: 60000 }));

export default {
  async fetch(request) {
    return manager.execute(request, {});
  }
};
```

---

## Common Patterns

### Pattern 1: AI-Enhanced Component Development

```javascript
import { CodeGenerator, AccessibilityAnalyzer } from '@kalxjs/ai';

// 1. Generate component
const generator = new CodeGenerator({ apiKey: 'key' });
let component = await generator.generateComponent('user profile card');

// 2. Check accessibility
const analyzer = new AccessibilityAnalyzer();
component = await analyzer.fixComponent(component.code);

// 3. Use it!
console.log(component);
```

### Pattern 2: Universal Cross-Platform App

```javascript
import { Platform } from '@kalxjs/native';
import { View, Text } from '@kalxjs/native';
import { Electron } from '@kalxjs/native/electron';
import { Camera } from '@kalxjs/native/mobile';

const App = {
  setup() {
    const platform = Platform.getOS();

    const takePhoto = async () => {
      if (Platform.isMobile()) {
        const photo = await Camera.takePicture();
        return photo.uri;
      } else if (Platform.isElectron) {
        const file = await Electron.showOpenDialog({
          filters: [{ name: 'Images', extensions: ['png', 'jpg'] }]
        });
        return file.filePaths[0];
      }
    };

    return () => (
      <View>
        <Text>Platform: {platform}</Text>
        <Button title="Select Photo" onPress={takePhoto} />
      </View>
    );
  }
};
```

### Pattern 3: Edge App with Caching & Geo-Routing

```javascript
import {
  EdgeCacheManager,
  GeoRouter,
  MiddlewareManager,
  corsMiddleware
} from '@kalxjs/edge';

const cache = new EdgeCacheManager();
const router = new GeoRouter();
const middleware = new MiddlewareManager();

middleware.use(corsMiddleware({ origin: '*' }));

router.register('US', async (req, geo) => {
  return cache.match(req, () =>
    fetch('https://us-api.example.com/data'),
    { strategy: 'cache-first', ttl: 3600 }
  );
});

router.register('*', async (req, geo) => {
  return fetch('https://global-api.example.com/data');
});

export default {
  async fetch(request) {
    const withMiddleware = await middleware.execute(request, {});
    return router.route(withMiddleware);
  }
};
```

---

## Testing Your Implementation

### Test AI Features

```bash
node examples/priority-7-features/ai-demo.js
```

### Test Native Features

```bash
node examples/priority-7-features/native-demo.js
```

### Test Edge Features

```bash
node examples/priority-7-features/edge-demo.js
```

---

## Configuration

### AI Provider Setup

```javascript
// .env
OPENAI_API_KEY=your-key-here

// code
import { setAIProvider } from '@kalxjs/ai';

setAIProvider({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4'
});
```

### Native Platform Setup

**For Electron:**
```bash
npm install electron --save-optional
```

**For Tauri:**
```bash
npm install @tauri-apps/api --save-optional
```

### Edge Runtime Setup

**Cloudflare Workers:**
```bash
npm install -g wrangler
wrangler init my-worker
```

**Deno Deploy:**
```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
deployctl deploy --project=my-project main.ts
```

**Vercel Edge:**
```bash
npm install -g vercel
vercel
```

---

## Next Steps

1. ✅ Read the full implementation guide: [PRIORITY_7_IMPLEMENTATION.md](./PRIORITY_7_IMPLEMENTATION.md)
2. ✅ Check out example apps in `examples/priority-7-features/`
3. ✅ Read package READMEs for detailed APIs
4. ✅ Join the community and share your projects!

---

## Troubleshooting

### AI Features Not Working

- Check that you have a valid API key
- Ensure internet connection
- Verify API provider is configured correctly

### Native Features Not Working

- Check platform detection: `console.log(Platform.getOS())`
- Ensure optional dependencies are installed (Electron/Tauri)
- Verify permissions for device features (Camera, Location, etc.)

### Edge Features Not Working

- Verify you're running in an edge runtime environment
- Check that Web APIs are available (`fetch`, `Request`, `Response`)
- Ensure runtime detection is working: `console.log(detectRuntime())`

---

## Resources

- **Full Documentation:** [PRIORITY_7_IMPLEMENTATION.md](./PRIORITY_7_IMPLEMENTATION.md)
- **AI Package README:** [packages/ai/README.md](./KALXJS-FRAMEWORK/packages/ai/README.md)
- **Native Package README:** [packages/native/README.md](./KALXJS-FRAMEWORK/packages/native/README.md)
- **Edge Package README:** [packages/edge/README.md](./KALXJS-FRAMEWORK/packages/edge/README.md)
- **Examples:** [examples/priority-7-features/](./examples/priority-7-features/)

---

**🎉 Congratulations! You're now ready to use KALXJS Priority 7 features!**