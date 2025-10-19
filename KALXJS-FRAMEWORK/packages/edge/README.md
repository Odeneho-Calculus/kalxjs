# @kalxjs/edge

Edge Computing support for KalxJS Framework - Build ultra-fast edge applications with Cloudflare Workers, Deno Deploy, and Vercel Edge Functions.

## Features

- 🚀 **Multiple Edge Runtimes** - Cloudflare Workers, Deno Deploy, Vercel Edge, Netlify Edge
- 🎯 **Automatic Runtime Detection** - Detect and adapt to any edge environment
- ⚡ **Edge-Optimized SSR** - Streaming SSR with minimal overhead
- 🗺️ **Geographic Routing** - Route requests based on user location
- 💾 **Smart Caching** - 5 cache strategies with TTL management
- 🔧 **Middleware System** - CORS, rate limiting, authentication, logging
- 📦 **Platform-Specific APIs** - Full access to KV, Durable Objects, etc.

## Installation

```bash
npm install @kalxjs/edge
```

## Quick Start

### Cloudflare Workers

```javascript
import { createWorkerHandler, WorkerKV } from '@kalxjs/edge/cloudflare';
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

### Deno Deploy

```javascript
import { createDenoHandler, DenoKV } from '@kalxjs/edge/deno';

const handler = createDenoHandler({
  middleware: [/* your middleware */]
});

Deno.serve(handler);
```

### Vercel Edge Functions

```javascript
import { createEdgeHandler, NextResponse } from '@kalxjs/edge/vercel';

export default createEdgeHandler({
  middleware: [/* your middleware */]
});

export const config = {
  runtime: 'edge'
};
```

## Core Features

### Runtime Detection

```javascript
import { detectRuntime, getRuntimeCapabilities } from '@kalxjs/edge';

const runtime = detectRuntime();
const capabilities = getRuntimeCapabilities();

console.log(`Running on: ${runtime}`);
console.log(`Supports streaming: ${capabilities.supportsStreaming}`);
```

### Edge-Optimized Rendering

```javascript
import { renderToEdgeStream } from '@kalxjs/edge';
import { createApp } from '@kalxjs/core';

export default {
  async fetch(request) {
    const app = createApp(/* your app */);
    return renderToEdgeStream(app, { request });
  }
};
```

### Cache Strategies

```javascript
import { EdgeCacheManager } from '@kalxjs/edge';

const cache = new EdgeCacheManager();

// Cache-first strategy
await cache.match(request, async () => {
  return new Response('data');
}, { strategy: 'cache-first', ttl: 3600 });
```

### Middleware System

```javascript
import { MiddlewareManager, corsMiddleware, rateLimitMiddleware } from '@kalxjs/edge';

const manager = new MiddlewareManager();

manager.use(corsMiddleware({
  origin: '*',
  methods: ['GET', 'POST']
}));

manager.use(rateLimitMiddleware({
  limit: 100,
  window: 60000
}));
```

### Geographic Routing

```javascript
import { GeoRouter } from '@kalxjs/edge';

const router = new GeoRouter();

router.register('US', () => new Response('US content'));
router.register('EU', () => new Response('EU content'));
router.register('*', () => new Response('Default content'));

const response = await router.route(request);
```

## Platform-Specific Features

### Cloudflare Workers KV

```javascript
import { WorkerKV } from '@kalxjs/edge/cloudflare';

const kv = new WorkerKV(env.MY_KV);
await kv.put('key', 'value', { expirationTtl: 3600 });
const value = await kv.get('key');
```

### Cloudflare Durable Objects

```javascript
import { DurableObjectWrapper } from '@kalxjs/edge/cloudflare';

const obj = new DurableObjectWrapper(env.MY_DO, id);
const result = await obj.call('method', arg1, arg2);
```

### Deno KV

```javascript
import { DenoKV } from '@kalxjs/edge/deno';

const kv = new DenoKV();
await kv.set(['users', 'alice'], { name: 'Alice' });
const user = await kv.get(['users', 'alice']);
```

### Vercel KV

```javascript
import { VercelKV } from '@kalxjs/edge/vercel';

const kv = new VercelKV();
await kv.set('key', 'value', { ex: 3600 });
const value = await kv.get('key');
```

## API Reference

See [PRIORITY_7_IMPLEMENTATION.md](../../PRIORITY_7_IMPLEMENTATION.md) for complete API documentation.

## Examples

- [Cloudflare Workers App](../../examples/edge-cloudflare)
- [Deno Deploy App](../../examples/edge-deno)
- [Vercel Edge App](../../examples/edge-vercel)

## License

MIT