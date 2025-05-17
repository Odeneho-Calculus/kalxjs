# kalxjs Core

Next-generation core package for building high-performance web applications with kalxjs.

## Features

- **Signal-Based Reactivity**: Fine-grained reactivity with automatic dependency tracking
- **Server Components**: First-class SSR support with hydration
- **Typed Components**: Full TypeScript support with type inference
- **Suspense Integration**: Async data loading and code splitting
- **Error Boundaries**: Graceful error handling
- **Static Analysis**: Tree-shakeable APIs and dead code elimination
- **Concurrent Rendering**: Non-blocking UI updates
- **Automatic Batching**: Smart update scheduling

## Installation

```bash
npm install @kalxjs-framework/runtime @kalxjs-framework/compiler
```

## Modern Usage

```typescript
import { defineComponent, signal, computed } from '@kalxjs-framework/runtime'

// Create signals for reactive state
const count = signal(0)
const doubled = computed(() => count() * 2)

// Modern component with TypeScript
const Counter = defineComponent<{
  initial: number
  onChange?: (value: number) => void
}>({
  props: {
    initial: { type: Number, required: true },
    onChange: Function
  },

  setup(props, { emit }) {
    const count = signal(props.initial)
    
    function increment() {
      count.update(n => n + 1)
      emit('onChange', count())
    }

    return () => (
      <div class="counter">
        <h1>Counter Example</h1>
        <p>Count: {count()}</p>
        <p>Doubled: {doubled()}</p>
        <button onClick={increment}>Increment</button>
      </div>
    )
  }
})
```

## Advanced Features

### Server Components

```typescript
// Server Component
const AsyncData = defineServerComponent(async () => {
  const data = await fetchData()
  return <DataDisplay data={data} />
})

// Client Entry
const App = () => (
  <Suspense fallback={<Loading />}>
    <AsyncData />
  </Suspense>
)
```

### Performance Optimizations

```typescript
import { lazy, memo, useTransition } from '@kalxjs-framework/runtime'

// Lazy loading
const LazyComponent = lazy(() => import('./Heavy'))

// Memoization
const Pure = memo(({ data }) => <div>{data}</div>)

// Concurrent updates
const [isPending, startTransition] = useTransition()
startTransition(() => {
  // Non-blocking update
  heavyOperation()
})
```

## Type System

```typescript
import { Component, PropType } from '@kalxjs-framework/runtime'

interface Props {
  items: string[]
  onSelect: (item: string) => void
}

const List: Component<Props> = defineComponent({
  props: {
    items: Array as PropType<string[]>,
    onSelect: Function as PropType<(item: string) => void>
  },
  // ...
})
```

## API Documentation

### Reactivity

- `signal(value)`: Create a reactive signal
- `computed(getter)`: Create a computed signal
- `effect(fn)`: Run a function reactively

### Component System

- `defineComponent(options)`: Define a component
- `defineServerComponent(factory)`: Define a server component

### Rendering

- `h(type, props, ...children)`: Create virtual DOM nodes
- `lazy(factory)`: Lazy load a component
- `memo(component)`: Memoize a component

### Application

- `createApp(options)`: Create a new application instance
  - `app.mount(el)`: Mount the application
  - `app.unmount()`: Unmount the application
  - `app.use(plugin, options?)`: Use a plugin
  - `app.component(name, component)`: Register a global component
  - `app.provide(key, value)`: Provide a value to all components

## License

MIT