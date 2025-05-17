# @kalxjs/performance

Performance optimization utilities for KalxJs framework.

## Installation

```bash
npm install @kalxjs/performance
```

## Usage

```javascript
import { 
  lazyLoad, 
  debounce, 
  throttle, 
  memoize, 
  virtualList, 
  withPerformanceTracking 
} from '@kalxjs/performance';

// Lazy load a component
const LazyComponent = lazyLoad(() => import('./HeavyComponent.js'), {
  loading: LoadingSpinner,
  error: ErrorComponent,
  delay: 200,
  timeout: 10000
});

// Debounce a function
const debouncedSearch = debounce((query) => {
  // Search logic here
  fetchSearchResults(query);
}, 300);

// Throttle a function
const throttledScroll = throttle(() => {
  // Scroll handler logic
  updateScrollPosition();
}, 100);

// Memoize a function
const expensiveCalculation = memoize((a, b) => {
  // Complex calculation
  return a * b * Math.sqrt(a + b);
});

// Create a virtualized list
const VirtualizedList = virtualList({
  itemHeight: 50,
  overscan: 5,
  getKey: (item) => item.id
});

// Use the virtualized list
const MyList = {
  setup() {
    const items = ref([/* many items */]);
    
    return () => h(VirtualizedList, {
      items: items.value,
      renderItem: (item) => h('div', {}, item.name)
    });
  }
};

// Track component performance
const TrackedComponent = withPerformanceTracking(MyComponent, {
  name: 'MyComponent',
  logToConsole: true,
  onMeasure: (stats) => {
    // Send performance data to analytics
    analytics.trackPerformance(stats);
  }
});
```

## Features

### Lazy Loading

Load components only when they're needed to reduce initial bundle size.

### Debounce & Throttle

Limit the rate at which functions are called to improve performance.

### Memoization

Cache function results to avoid redundant calculations.

### Virtual List

Efficiently render large lists by only rendering items in the viewport.

### Performance Tracking

Measure and monitor component render performance.

## API Reference

### lazyLoad(factory, options)

Lazy load a component with loading and error states.

### debounce(fn, wait, immediate)

Create a debounced function that delays invoking the function until after `wait` milliseconds.

### throttle(fn, limit)

Create a throttled function that only invokes the function at most once per `limit` milliseconds.

### memoize(fn, keyResolver)

Create a memoized function that caches results based on input arguments.

### virtualList(options)

Create a virtualized list component for efficient rendering of large lists.

### withPerformanceTracking(component, options)

Wrap a component with performance measurement.

## License

MIT