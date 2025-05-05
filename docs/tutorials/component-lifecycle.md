# kalxjs/docs/tutorials/component-lifecycle.md

# Component Lifecycle in kalxjs

Modern guide to component lifecycle management in kalxjs 1.2.x.

## Composition API Lifecycle

```typescript
import { 
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onErrorCaptured,
  onActivated,
  onDeactivated
} from '@kalxjs-framework/runtime'

export default defineComponent({
  setup() {
    // Creation
    onBeforeMount(() => {
      console.log('Before component mounts')
    })

    onMounted(() => {
      console.log('Component mounted')
    })

    // Updates
    onBeforeUpdate(() => {
      console.log('Before component updates')
    })

    onUpdated(() => {
      console.log('Component updated')
    })

    // Destruction
    onBeforeUnmount(() => {
      console.log('Before component unmounts')
    })

    onUnmounted(() => {
      console.log('Component unmounted')
    })

    // Error Handling
    onErrorCaptured((err, instance, info) => {
      console.error('Error in child component:', err)
      return false // Prevent error propagation
    })

    // Keep-alive
    onActivated(() => {
      console.log('Component activated from cache')
    })

    onDeactivated(() => {
      console.log('Component deactivated to cache')
    })
  }
})
```

## Async Component Lifecycle

```typescript
const AsyncComponent = defineAsyncComponent({
  loader: () => import('./MyComponent.klx'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200,
  timeout: 3000,
  onError(error, retry, fail, attempts) {
    if (attempts <= 3) {
      retry()
    } else {
      fail()
    }
  }
})
```

## Suspense Integration

```typescript
import { Suspense } from '@kalxjs-framework/runtime'

export default defineComponent({
  setup() {
    const asyncData = ref(null)
    
    onMounted(async () => {
      asyncData.value = await fetchData()
    })

    return () => (
      <Suspense fallback={<LoadingSpinner />}>
        <AsyncComponent data={asyncData.value} />
      </Suspense>
    )
  }
})
```

## Effect Scope Lifecycle

```typescript
import { effectScope } from '@kalxjs-framework/runtime'

export default defineComponent({
  setup() {
    const scope = effectScope()

    scope.run(() => {
      // Effects created here will be automatically disposed
      const stop = watchEffect(() => {
        // ...
      })
    })

    onUnmounted(() => {
      scope.stop() // Clean up all effects
    })
  }
})
```

## Best Practices

1. **Use Composition API Hooks** - Prefer composition API lifecycle hooks for better TypeScript support
2. **Async Component Loading** - Leverage async components with Suspense for better loading states
3. **Error Boundaries** - Implement error boundaries using onErrorCaptured
4. **Effect Cleanup** - Use effectScope for managing multiple effects
5. **State Management** - Initialize store modules in setup() instead of created()

## Next Steps

- Learn about [component communication](./component-communication.md)
- Explore [routing in kalxjs](./routing.md)
- Check out [state management](./state-management.md)