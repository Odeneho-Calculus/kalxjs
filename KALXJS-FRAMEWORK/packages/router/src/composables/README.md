# Router Composables (Phase 1-3 Enhancements)

Professional, modular composable hooks for reactive routing with KALXJS.

## 📋 Directory Structure

```
src/composables/
├── index.js                    # Main barrel export - imports all composables
├── README.md                   # This file
│
├── reactiveState.js            # Core reactive state factories
│   ├── createReactiveRoute()   # Phase 1: Reactive route state
│   └── createTransitionState() # Phase 2: Transition state
│
├── useRoute.js                 # Main composable hook
│   └── useRoute()              # Full-featured route composable
│
├── useParams.js                # Shorthand composable
│   └── useParams()             # Just route parameters
│
├── useQuery.js                 # Query parameter composable
│   └── useQuery()              # Query helpers: update, remove, clear
│
├── useTransition.js            # Transition state composable
│   └── useTransition()         # Loading/pending/error state
│
├── navigationEnhancers.js      # Navigation method wrappers
│   └── createNavigationEnhancers()
│       ├── enhancedPush()
│       ├── enhancedReplace()
│       ├── enhancedGo()
│       ├── enhancedBack()
│       └── enhancedForward()
│
├── queryHelpers.js             # Query parameter utilities
│   └── createQueryHelpers()
│       ├── updateQuery()
│       ├── removeQueryParam()
│       └── clearQuery()
│
├── preloadHooks.js             # Phase 3: Data preloading system
│   └── createPreloadManager()
│       ├── registerPreload()
│       ├── executePreload()
│       ├── getHooks()
│       ├── unregisterPreload()
│       └── clearPreloads()
│
└── routerEnhancer.js           # Main enhancement function
    └── enhanceRouter()         # Wraps all above into enhanced router
```

## 🚀 Quick Start

### 1. Enhanced Router Setup

```javascript
import { createRouter } from '@kalxjs/router';
import { enhanceRouter } from '@kalxjs/router/composables';

// Create base router
const baseRouter = createRouter({
    routes: [
        { path: '/home', component: Home },
        { path: '/user/:id', component: UserProfile }
    ]
});

// Enhance with reactive features
const router = enhanceRouter(baseRouter);

// Now router has new composable methods!
```

### 2. Using Composables in Components

```javascript
import { defineComponent } from '@kalxjs/core';

export default defineComponent({
    setup() {
        // Use the enhanced router's composable factories
        const route = router.useRoute();
        const params = router.useParams();
        const query = router.useQuery();
        const transition = router.useTransition();

        return { route, params, query, transition };
    },

    template: `
        <div>
            <!-- Route data -->
            <h1>{{ route.route.value.name }}</h1>

            <!-- Reactive params -->
            <p>User ID: {{ params.value.id }}</p>

            <!-- Reactive query -->
            <p>Page: {{ query.query.value.page }}</p>

            <!-- Loading state -->
            <div v-if="transition.value.isLoading">
                Loading...
            </div>

            <!-- Error handling -->
            <div v-if="transition.value.error" class="error">
                {{ transition.value.error.message }}
            </div>
        </div>
    `
});
```

## 📚 Module Reference

### Core State Management

#### `createReactiveRoute()` - Phase 1
Creates reactive route state that triggers updates on parameter changes.

```javascript
const reactiveRoute = createReactiveRoute();

// Update route while preserving reactivity
reactiveRoute.update({
    path: '/user/123',
    params: { id: '123' },
    name: 'userProfile'
});

// Set location state
reactiveRoute.setState({
    from: 'list',
    scrollPos: 450
});
```

#### `createTransitionState()` - Phase 2
Creates reactive transition state for tracking navigation progress.

```javascript
const transition = createTransitionState();

// Properties automatically updated during navigation:
// - isLoading: boolean
// - isPending: boolean (data preload)
// - error: Error|null
// - from: Object|null (previous route)
// - to: Object|null (target route)
// - percent: number (0-100)
// - reason: 'navigation'|'preload'|null
```

### Composable Hooks

#### `useRoute()` - Main Hook
Complete route and navigation interface.

```javascript
const {
    // Reactive properties
    route,           // Full route object
    params,          // Route parameters
    query,           // Query string parameters
    state,           // Location state (not in URL)
    path,            // Current path
    name,            // Current route name
    meta,            // Route metadata

    // Transition state
    transition,      // Navigation state tracking

    // Navigation methods
    push,            // Navigate (push to history)
    replace,         // Replace in history
    go,              // Navigate by delta
    back,            // Go back one
    forward,         // Go forward one

    // Query helpers
    updateQuery,     // Merge query params
    removeQueryParam, // Remove query param(s)
    clearQuery,      // Clear all query params

    // State methods
    setState,        // Update location state
    getPreloadedData, // Access preloaded data

    // Advanced
    subscribe        // Subscribe to route changes
} = router.useRoute();
```

**Examples:**

```javascript
// Reactive parameter watching
watch(() => params.value.id, async (id) => {
    const user = await fetchUser(id);
});

// Query parameter manipulation
await updateQuery({ page: 2, sort: 'name' });
await removeQueryParam('filter');
await clearQuery();

// Navigation
await push('/user/456');
await replace('/home');
await go(-1);
await back();

// State passing (like React Router)
await push({
    path: '/search',
    state: { query: 'kalxjs', from: 'home' }
});

// Check transition state
if (transition.value.isLoading) {
    showSpinner();
}

// Handle errors
if (transition.value.error) {
    showError(transition.value.error);
}
```

#### `useParams()` - Params Only
Shorthand hook for just route parameters.

```javascript
const params = router.useParams();

// Watch for param changes
watch(() => params.value.id, (id) => {
    loadUser(id);
});
```

#### `useQuery()` - Query Parameters
Query-focused composable.

```javascript
const { query, update, remove, clear } = router.useQuery();

// Update with options
await update({ page: 2, filter: 'active' }, { replace: true });

// Remove one or many
await remove('page');
await remove(['page', 'filter']);

// Clear all
await clear();
```

#### `useTransition()` - Loading State
Track navigation and data loading progress.

```javascript
const transition = router.useTransition();

// Show loading UI
if (transition.value.isLoading) {
    // Show spinner
}

// Track data preload
if (transition.value.isPending) {
    // Show data loading indicator
}

// Handle errors
if (transition.value.error) {
    showError(transition.value.error.message);
}

// Show progress
updateProgressBar(transition.value.percent);

// Track reason
if (transition.value.reason === 'preload') {
    // Data is being preloaded
}
```

### Helper Functions

#### `createQueryHelpers(config)` - Query Utilities
Internal helper for query parameter manipulation.

Functions:
- `updateQuery(params, options)` - Merge query parameters
- `removeQueryParam(keys)` - Remove parameter(s)
- `clearQuery()` - Clear all parameters

#### `createNavigationEnhancers(config)` - Navigation Wrappers
Internal helper that wraps base router methods with tracking.

Functions:
- `enhancedPush(location)` - Push with transition tracking
- `enhancedReplace(location)` - Replace with transition tracking
- `enhancedGo(delta)` - Go with transition tracking
- `enhancedBack()` - Back with transition tracking
- `enhancedForward()` - Forward with transition tracking

#### `createPreloadManager(config)` - Phase 3 Data Preloading
Route-level data preloading system.

```javascript
// Register preload hook for a route
router.registerPreload('userProfile', async (params, route) => {
    const user = await fetchUser(params.id);
    const posts = await fetchUserPosts(params.id);
    return { user, posts };
});

// Preloaded data automatically available during navigation
const route = router.useRoute();
const preloadedData = route.getPreloadedData();
console.log(preloadedData.user); // Already loaded!

// Unregister if needed
router.unregisterPreload('userProfile');
```

### Main Enhancement Function

#### `enhanceRouter(baseRouter)` - Phase 1-3 Setup
Wraps a base router with all reactive features.

```javascript
import { createRouter } from '@kalxjs/router';
import { enhanceRouter } from '@kalxjs/router/composables';

const baseRouter = createRouter({ routes: [...] });
const router = enhanceRouter(baseRouter);

// Returns enhanced router with:
// - router.useRoute()
// - router.useParams()
// - router.useQuery()
// - router.useTransition()
// - router.registerPreload()
// - All base router methods (push, replace, go, etc.)
```

## 🔄 Phase Breakdown

### Phase 1: Reactive Route State
**Status**: ✅ Implemented

Features:
- Route state wrapped in reactive refs
- Automatic change detection on parameter updates
- Watchers trigger on params/query changes
- `useRoute()` and `useParams()` hooks

**Files**: `reactiveState.js`, `useRoute.js`, `useParams.js`

### Phase 2: Transition State Management
**Status**: ✅ Implemented

Features:
- Loading state during navigation
- Error tracking and reporting
- From/to route tracking
- Progress percentage support
- `useTransition()` hook

**Files**: `reactiveState.js`, `useTransition.js`, `navigationEnhancers.js`

### Phase 3: Location State & Data Preloading
**Status**: ✅ Implemented

Features:
- Pass state between routes without URL pollution
- Route-level data preloading
- Automatic preload execution before navigation
- `route.state` reactive property
- `router.registerPreload()` system

**Files**: `preloadHooks.js`, `routerEnhancer.js`

## 📦 Modular Import Options

### Option 1: Import Everything
```javascript
import * as composables from '@kalxjs/router/composables';

const router = composables.enhanceRouter(baseRouter);
```

### Option 2: Named Imports
```javascript
import {
    enhanceRouter,
    createReactiveRoute,
    createTransitionState
} from '@kalxjs/router/composables';

const router = enhanceRouter(baseRouter);
```

### Option 3: Default Export
```javascript
import RouterComposables from '@kalxjs/router/composables';

const router = RouterComposables.enhanceRouter(baseRouter);
```

## 🎯 Best Practices

1. **Always enhance your router** at app startup
   ```javascript
   const router = enhanceRouter(createRouter(config));
   app.use(router);
   ```

2. **Use composables within components**
   ```javascript
   const { route, params } = router.useRoute();
   ```

3. **Watch reactive properties** with watch/watchEffect
   ```javascript
   watch(() => params.value.id, (id) => {
       loadUser(id);
   });
   ```

4. **Handle transitions** for better UX
   ```javascript
   if (transition.value.isLoading) {
       showSpinner();
   }
   ```

5. **Register preload hooks** for route-level data loading
   ```javascript
   router.registerPreload('profilePage', async (params) => {
       return fetchProfileData(params.id);
   });
   ```

6. **Pass state between routes** instead of URL params
   ```javascript
   // For transient data (not needed in URL)
   await push({
       path: '/result',
       state: { searchQuery: query, filters: active }
   });
   ```

## 🧪 Testing Examples

```javascript
// Test reactive parameters
test('params should update reactively', async () => {
    const params = router.useParams();
    expect(params.value.id).toBe('123');

    await router.push('/user/456');
    expect(params.value.id).toBe('456');
});

// Test query parameters
test('query should merge with existing', async () => {
    const { query, update } = router.useQuery();
    await update({ page: 2 });

    expect(query.value.page).toBe(2);
});

// Test transition state
test('should track loading state', async () => {
    const transition = router.useTransition();

    const promise = router.push('/expensive-route');
    expect(transition.value.isLoading).toBe(true);

    await promise;
    expect(transition.value.isLoading).toBe(false);
});

// Test data preloading
test('should preload route data', async () => {
    router.registerPreload('profile', async (params) => {
        return { user: { id: params.id } };
    });

    await router.push('/profile/123');
    const { getPreloadedData } = router.useRoute();

    expect(getPreloadedData().user.id).toBe('123');
});
```

## 🔗 Integration with Main Router

Add to `src/index.js` in router package:

```javascript
// Export composables
export {
    enhanceRouter,
    useRoute,
    useParams,
    useQuery,
    useTransition,
    createReactiveRoute,
    createTransitionState
} from './composables/index.js';
```

## ❓ FAQ

**Q: Do I have to use these composables?**
A: No! The enhanced router is backward compatible. Existing code works as-is. Composables are optional enhancements.

**Q: How is this different from React Router?**
A: KALXJS composables are automatically reactive (no dependency arrays), have built-in transition state, and support route-level data preloading natively.

**Q: Can I mix old and new API?**
A: Yes! `router.push()` works the same. The composables add reactive layers on top.

**Q: Performance impact?**
A: Minimal. Reactive tracking only on accessed properties. No watchers unless you create them.

**Q: What about SSR?**
A: Memory history mode works with preloading. State is preserved during server render.

---

**Created**: 2024
**Version**: 1.0.0 (Phase 1-3)
**Status**: Production Ready