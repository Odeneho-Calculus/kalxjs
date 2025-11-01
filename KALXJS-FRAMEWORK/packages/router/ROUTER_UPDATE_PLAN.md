# KALXJS Router Enhancement Plan
## Making KALXJS Router Superior to React Router v6

**Status**: Enhancement Design & Implementation Plan
**Target Version**: 3.0.0
**Comparison Baseline**: React Router v6.x

---

## Executive Summary

This document outlines strategic enhancements to the KALXJS Router that will make it **more powerful and developer-friendly than React Router v6**. While React Router focuses on component-based routing, KALXJS can leverage its reactive system to provide:

- **Automatic reactive parameter tracking** (no need for useEffect dependencies)
- **Built-in transition state management** (loading, error states)
- **Route-level data preloading** (automatic data fetching)
- **Navigation state management** (location.state with full reactivity)
- **Enhanced route guards** with cancellation support
- **Optimized performance** through lazy loading and route preloading

---

## Current Router State Analysis

### Strengths ✅
- Route parameter extraction works correctly
- Guards system (beforeEach, beforeResolve, afterEach) is solid
- Query parameter parsing with smart type conversion
- Multiple history modes (hash, history, memory)
- Custom event system (kalroute events)

### Limitations ⚠️
- **currentRoute is a plain object** → Not reactive, watchers fail
- **No composable API** → Can't easily hook into route changes in components
- **No transition state** → Can't track loading/pending navigation
- **No location.state support** → Can't pass data between routes cleanly
- **No scroll management hooks** → Manual scroll position handling needed
- **No data preloading** → Components must fetch their own data
- **No navigation cancellation** → Can't abort ongoing navigation
- **Limited metadata** → Route metadata inheritance is basic

---

## Enhancement Roadmap

### Phase 1: Reactive Route State ⭐ CRITICAL
**Goal**: Make route parameters automatically reactive

**Current Problem**:
```javascript
// This doesn't work - currentRoute is plain object
watch(() => window.router.currentRoute, () => {
    console.log('params changed'); // NEVER FIRES
});
```

**Solution**: Implement reactive route state using the framework's reactivity system

```javascript
// After enhancement - using composable
import { useRoute } from '@kalxjs/router';

const component = {
    setup() {
        const route = useRoute();  // Reactive route object
        return () => h('div', null, `ID: ${route.params.id}`);
    }
};

// OR with direct access (current approach)
// But currentRoute is now a reactive ref internally
```

**Changes Required**:
1. Wrap `currentRoute` in reactive/ref mechanism
2. Ensure all property changes trigger reactivity
3. Create `useRoute()` composable hook
4. Update component examples to use new pattern

---

### Phase 2: Transition State Management
**Goal**: Track navigation state (loading, error, cancelled)

**Problem**: React Router doesn't provide built-in transition state management. Developers must use React 18 transitions.

**KALXJS Solution**: Built-in, reactive transition state

```javascript
const router = createRouter({
    routes: [...]
});

// Components can access transition state
const { route, transition } = useRoute();

// transition contains:
// - isLoading: boolean (navigation in progress)
// - isPending: boolean (data preloading in progress)
// - error: null | Error (navigation error)
// - from: Route (previous route)
// - to: Route (target route)
// - percent: number (0-100, only if supports progress)
```

**Implementation**:
```javascript
const transitionState = ref({
    isLoading: false,
    isPending: false,
    error: null,
    from: null,
    to: null,
    percent: 0
});

// Update before/during/after navigation
beforeEach((to, from, next) => {
    transitionState.isLoading = true;
    next();
});

afterEach((to, from) => {
    transitionState.isLoading = false;
});
```

---

### Phase 3: Location State Management
**Goal**: Pass data between routes without URL pollution (like React Router)

**Problem**: Currently no way to pass state between routes

**Solution**:
```javascript
// Navigate with state
router.push({
    path: '/profile/123',
    params: { id: '123' },
    state: {
        from: 'userList',
        searchQuery: 'john',
        listScrollPosition: 450
    }
});

// Access in component
const { route } = useRoute();
console.log(route.state); // { from: 'userList', ... }
```

**Implementation**:
- Add `state` property to route object
- Preserve state in navigation history
- Clear state on page refresh
- Provide hooks to access and update state

---

### Phase 4: Enhanced Query Parameter Hooks
**Goal**: React Router parity + better reactive handling

**Problem**: React Router has `useSearchParams` which requires careful dependency management

**KALXJS Enhancement**: Reactive query object with update helpers

```javascript
const { query, updateQuery, removeQueryParam } = useRoute();

// query is reactive - changes update URL automatically
watch(() => query.search, (newValue) => {
    console.log('Search changed to:', newValue);
});

// Helper functions
updateQuery({
    page: 2,
    filter: 'active',
    replace: true // Use replaceState instead of pushState
});

removeQueryParam('page');
```

---

### Phase 5: Route Guard Enhancements
**Goal**: More powerful and cancellable guards

**Problem**: React Router guards are component-level; global guards are complex

**KALXJS Enhancement**:
```javascript
// Support guard cancellation
router.beforeEach((to, from, next, signal) => {
    if (signal.aborted) {
        console.log('Navigation was cancelled');
        return;
    }

    // Can listen to cancellation
    signal.addEventListener('abort', () => {
        console.log('User cancelled navigation');
        cleanup();
    });

    // Can cancel other navigations
    next(); // or next(false) to cancel
});

// New: Ability to cancel ongoing navigation
const controller = router.push('/page1');
controller.cancel(); // Cancel navigation

// New: Sequence guards with priority
router.beforeEach(guard, { priority: 10 }); // Runs earlier
```

---

### Phase 6: Route Data Preloading
**Goal**: Automatically load data before component renders

**Problem**: React Router doesn't handle this; must use loader pattern (v6.4+)

**KALXJS Solution**: Route-level data preloading with automatic integration

```javascript
const routes = [
    {
        path: '/user/:id',
        component: UserProfile,
        async preload(params) {
            // Runs before component mounts
            return {
                user: await fetchUser(params.id),
                posts: await fetchUserPosts(params.id)
            };
        },
        // Component receives data automatically
        setup() {
            const { data } = useRoute();
            return () => h('div', null, data?.user?.name);
        }
    }
];
```

---

### Phase 7: Lazy Route Loading with Hooks
**Goal**: Code splitting with automatic loading state

**Problem**: React Router requires babel plugin; KALXJS can handle this natively

```javascript
// Before (manual)
import { lazy, defineComponent } from '@kalxjs/core';
const Admin = lazy(() => import('./Admin.js'));

// After (helper function)
import { lazyRoute } from '@kalxjs/router';

const routes = [
    {
        path: '/admin',
        component: lazyRoute(() => import('./Admin.js')),
        // Automatically tracks loading/error state
        loadingComponent: LoadingSpinner,
        errorComponent: ErrorPage
    }
];
```

---

### Phase 8: Scroll Position Management
**Goal**: Automatic scroll position preservation and restoration

**Problem**: React Router doesn't handle this well

**KALXJS Solution**: Built-in scroll behavior with route-level control

```javascript
const router = createRouter({
    routes: [...],
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        } else if (to.hash) {
            return { selector: to.hash };
        } else {
            return { x: 0, y: 0 };
        }
    }
});

// In components
const { saveScrollPosition } = useRoute();
onBeforeUnmount(() => {
    saveScrollPosition(); // Saves current scroll for this route
});
```

---

### Phase 9: Middleware/Interceptor Pattern
**Goal**: Request/response-like pattern for routes

**Problem**: Not available in React Router

**KALXJS Solution**: Route middleware pattern

```javascript
router.use(async (to, from, next) => {
    console.log('Middleware 1: Before navigation');
    await next();
    console.log('Middleware 1: After navigation');
});

// Stack-based execution like express middleware
router.use(authMiddleware);
router.use(analyticsMiddleware);
router.use(dataPrefetchMiddleware);
```

---

### Phase 10: Route Navigation Lifecycle Hooks
**Goal**: Fine-grained control over navigation lifecycle

**Problem**: Limited compared to modern routers

**KALXJS Enhancement**: Component-level lifecycle hooks

```javascript
const component = {
    setup() {
        const { onBeforeNavigate, onAfterNavigate } = useRoute();

        // Called when user is about to navigate away
        onBeforeNavigate(async (to, from) => {
            if (hasUnsavedChanges) {
                return confirm('Discard changes?');
            }
        });

        // Called after navigation completes
        onAfterNavigate((to, from) => {
            analytics.track('page_view', { page: to.name });
        });
    }
};
```

---

## Implementation Priority

### Tier 1 (Critical - Week 1) ⭐
1. **Phase 1**: Reactive route state + useRoute hook
2. **Phase 2**: Transition state management
3. **Phase 3**: Location state support

**Why**: These fix the fundamental issue where components don't update on parameter changes

### Tier 2 (Important - Week 2) ⭐⭐
4. **Phase 4**: Enhanced query parameter hooks
5. **Phase 5**: Guard cancellation support
6. **Phase 6**: Route data preloading

**Why**: These provide feature parity with React Router + extra features

### Tier 3 (Nice to Have - Week 3) ⭐⭐⭐
7. **Phase 7**: Lazy route loading with hooks
8. **Phase 8**: Scroll position management
9. **Phase 9**: Middleware/interceptor pattern
10. **Phase 10**: Lifecycle hooks

**Why**: These are polish features that make development easier

---

## Breaking Changes

⚠️ **Version 3.0 Breaking Changes**:

1. `currentRoute` becomes reactive (internal change, same API)
2. `useRouter()` hook added (new, no breaking change)
3. `useRoute()` hook added (new, no breaking change)
4. Guard signature extended with `signal` parameter (optional for backward compatibility)

**Backward Compatibility**: All existing code continues to work without changes.

---

## Performance Considerations

1. **Reactive Performance**: Use Vue 3-style reactivity with proper dependency tracking
2. **Memory**: Route cache management to prevent memory leaks
3. **Lazy Loading**: Code splitting reduces initial bundle
4. **Preloading**: Parallel data fetching during navigation
5. **Guard Execution**: Optimize guard execution with early exit strategies

---

## Comparison: KALXJS vs React Router v6

| Feature | React Router v6 | KALXJS Enhanced | Winner |
|---------|-----------------|-----------------|--------|
| Route Parameters | useParams hook | useRoute (reactive) | KALXJS ✅ |
| Query Parameters | useSearchParams hook | useRoute (reactive) | KALXJS ✅ |
| Transition State | React 18 useTransition | Built-in transition state | KALXJS ✅ |
| Location State | location.state (not reactive) | Reactive state object | KALXJS ✅ |
| Data Preloading | Route loaders (v6.4+) | Automatic preload hook | KALXJS ✅ |
| Guards | Limited | beforeEach, beforeResolve, afterEach | KALXJS ✅ |
| Lazy Loading | Code splitting | Auto loading state tracking | KALXJS ✅ |
| Scroll Management | Manual | Built-in with hooks | KALXJS ✅ |
| Type Safety | TypeScript support | Full TypeScript support | Equal ⚖️ |
| Maturity | Mature (stable) | New (feature-rich) | React Router 🔷 |
| API Complexity | Higher learning curve | Simpler API | KALXJS ✅ |

---

## Testing Strategy

### Unit Tests
- Route parameter extraction
- Query parameter parsing
- Guard execution order
- Transition state updates
- Location state management

### Integration Tests
- Full navigation lifecycle
- Guard cancellation scenarios
- Data preloading flow
- Scroll position preservation
- Lazy loading performance

### E2E Tests
- Real browser navigation
- Complex multi-step flows
- History management
- Hash vs History mode
- Parameter changes and re-renders

---

## Documentation Updates Required

1. **API Reference**: New hooks (useRoute, useParams, useQuery)
2. **Migration Guide**: From v2.x to v3.x
3. **Tutorial**: Reactive routing patterns
4. **Examples**: Data preloading, transition state, scroll management
5. **Best Practices**: Guard patterns, performance optimization

---

## Success Criteria

✅ All Phase 1-3 features implemented and working
✅ 100% backward compatible
✅ All unit tests passing (>90% coverage)
✅ All integration tests passing
✅ E2E tests validate real-world scenarios
✅ Documentation complete
✅ Performance benchmarks show no regression
✅ Phase 4+ features available for optional use

---

## Timeline

- **Week 1**: Phase 1-3 (Reactive State, Transition State, Location State)
- **Week 2**: Phase 4-6 (Query Hooks, Guards, Preloading)
- **Week 3**: Phase 7-10 (Lazy Loading, Scroll, Middleware, Lifecycle)
- **Week 4**: Testing, Documentation, Release Preparation

---

## Next Steps

1. ✅ Review and approve this plan
2. Start Phase 1 implementation
3. Create enhanced router module alongside existing router
4. Test thoroughly with simplified-test-app
5. Run full Phase 4 test suite validation
6. Document all changes and new API

---

**Author**: KALXJS Enhancement Team
**Date**: 2024
**Status**: Ready for Implementation