# Performance Optimization Guide

Learn how to build blazing-fast KALXJS applications.

## Performance Metrics

### Core Web Vitals

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### KALXJS Benchmarks

- Initial bundle: ~45KB (gzipped)
- Component render: < 5ms
- State update: < 1ms
- Virtual DOM diff: < 2ms

## Bundle Size Optimization

### Code Splitting

```javascript
// ✅ Route-based splitting
const routes = [
  {
    path: '/admin',
    component: () => import('./views/Admin.klx'),
  },
  {
    path: '/dashboard',
    component: () => import('./views/Dashboard.klx'),
  },
];
```

### Tree Shaking

```javascript
// ✅ Named imports (tree-shakeable)
import { ref, computed } from '@kalxjs/core';

// ❌ Default import (includes everything)
import * as kalxjs from '@kalxjs/core';
```

### Dynamic Imports

```javascript
// ✅ Load heavy libraries on demand
const loadChart = async () => {
  const { Chart } = await import('chart.js');
  renderChart(Chart);
};
```

## Rendering Performance

### Virtual Scrolling

```vue
<template>
  <VirtualScroller
    :items="largeList"
    :item-height="50"
    :buffer="5"
  >
    <template #default="{ item }">
      <div class="item">{{ item.name }}</div>
    </template>
  </VirtualScroller>
</template>
```

### Lazy Hydration

```javascript
// ✅ Hydrate components on visibility
<Component v-hydrate:lazy />

// ✅ Hydrate on interaction
<Component v-hydrate:interaction />

// ✅ Hydrate on idle
<Component v-hydrate:idle />
```

### Static Hoisting

```vue
<template>
  <!-- ✅ Static content is hoisted -->
  <div class="header">
    <h1>Welcome</h1>
    <p>This is static</p>
  </div>

  <!-- Dynamic content -->
  <p>{{ dynamicMessage }}</p>
</template>
```

## Reactivity Optimization

### Shallow Reactivity

```javascript
// ✅ For large datasets
const bigData = shallowReactive({
  items: [...thousands],
});

// Only triggers when entire object changes
bigData.items = newItems;
```

### Untrack

```javascript
// ✅ Prevent unnecessary tracking
import { untrack } from '@kalxjs/core';

untrack(() => {
  // This won't create dependencies
  console.log(reactive.value);
});
```

### Batch Updates

```javascript
// ✅ Batch multiple updates
import { batch } from '@kalxjs/core';

batch(() => {
  state.value1 = newValue1;
  state.value2 = newValue2;
  state.value3 = newValue3;
}); // Single render
```

## Computed Optimization

### Memoization

```javascript
// ✅ Use memo for expensive calculations
const result = memo(() => {
  return expensiveCalculation(data.value);
}, [data]);
```

### Lazy Computed

```javascript
// ✅ Compute only when accessed
const expensive = computed(() => {
  // Only runs when value is read
  return heavyCalculation();
});
```

## Network Optimization

### Prefetching

```javascript
// ✅ Prefetch routes
router.addRoute({
  path: '/products',
  component: () => import('./Products.klx'),
  meta: { prefetch: true },
});
```

### Caching

```javascript
// ✅ Cache API responses
import { useCache } from '@kalxjs/api';

const { data, refetch } = useCache('users', fetchUsers, {
  ttl: 60000, // 1 minute
});
```

### Request Deduplication

```javascript
// ✅ Deduplicate concurrent requests
import { dedupe } from '@kalxjs/api';

const fetchUser = dedupe(async (id) => {
  return await api.get(`/users/${id}`);
});
```

## Image Optimization

### Lazy Loading

```vue
<template>
  <!-- ✅ Native lazy loading -->
  <img src="large-image.jpg" loading="lazy" />

  <!-- ✅ With placeholder -->
  <img
    v-lazy="imageSrc"
    :placeholder="placeholderSrc"
  />
</template>
```

### Responsive Images

```vue
<template>
  <picture>
    <source
      srcset="image-small.jpg"
      media="(max-width: 768px)"
    />
    <source
      srcset="image-large.jpg"
      media="(min-width: 769px)"
    />
    <img src="image-default.jpg" alt="Responsive" />
  </picture>
</template>
```

## Memory Management

### Cleanup

```javascript
// ✅ Clean up listeners
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  clearInterval(intervalId);
  unsubscribe();
});
```

### Weak References

```javascript
// ✅ Use WeakMap for caching
const cache = new WeakMap();

function getCachedData(obj) {
  if (!cache.has(obj)) {
    cache.set(obj, expensiveComputation(obj));
  }
  return cache.get(obj);
}
```

## SSR Performance

### Streaming

```javascript
// ✅ Stream HTML to client
import { renderToStream } from '@kalxjs/core/ssr';

app.get('*', async (req, res) => {
  const stream = renderToStream(App, { url: req.url });
  stream.pipe(res);
});
```

### Critical CSS

```html
<!-- ✅ Inline critical CSS -->
<head>
  <style>
    /* Critical CSS here */
  </style>
  <link rel="preload" href="/styles.css" as="style" />
  <link rel="stylesheet" href="/styles.css" media="print" onload="this.media='all'" />
</head>
```

## Build Optimization

### Production Build

```bash
# Optimize for production
kalxjs build --mode production

# Enable compression
kalxjs build --compress

# Analyze bundle
kalxjs build --analyze
```

### Vite Configuration

```javascript
// vite.config.js
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@kalxjs/core', '@kalxjs/router'],
        },
      },
    },
  },
};
```

## Monitoring

### Performance API

```javascript
// ✅ Measure performance
import { usePerformance } from '@kalxjs/core';

const { measure, mark } = usePerformance();

mark('start-render');
// ... rendering
mark('end-render');
measure('render-time', 'start-render', 'end-render');
```

### DevTools

```javascript
// ✅ Enable performance profiling
import { enableDevtools } from '@kalxjs/devtools';

if (process.env.NODE_ENV === 'development') {
  enableDevtools(app);
}
```

## Checklist

### Development
- [ ] Use production build for testing
- [ ] Enable source maps for debugging
- [ ] Monitor bundle size
- [ ] Profile component renders

### Production
- [ ] Enable minification
- [ ] Remove console.log
- [ ] Enable compression (gzip/brotli)
- [ ] Use CDN for static assets
- [ ] Implement caching strategy
- [ ] Monitor Core Web Vitals

## Tools

- **Vite** - Fast build tool
- **Rollup** - Module bundler
- **Lighthouse** - Performance auditing
- **Bundle Analyzer** - Visualize bundle size
- **Chrome DevTools** - Performance profiling

## Resources

- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [Web Vitals](https://web.dev/vitals/)
- [MDN Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)