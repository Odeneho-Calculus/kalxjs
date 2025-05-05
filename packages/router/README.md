# kalxjs Router

Next-generation routing for kalxjs applications with TypeScript support, view transitions, and code splitting.

## Features

- **View Transitions API**: Smooth page transitions
- **Lazy Loading**: Automatic code splitting
- **Type Safe Routes**: Full TypeScript support
- **Middleware System**: Powerful route middleware
- **Persistent Layout**: Nested layouts support
- **Dynamic Routes**: Pattern matching and parameters
- **Navigation API**: History and scroll management
- **Dev Tools**: Built-in debugging support

## Installation

```bash
npm install @kalxjs-framework/router
```

## Modern Usage

```typescript
import { createRouter, defineRoute } from '@kalxjs-framework/router'
import type { RouteDefinition } from '@kalxjs-framework/router'

// Type-safe route definitions
const routes: RouteDefinition[] = [
  defineRoute({
    path: '/',
    component: () => import('./pages/Home.vue'),
    meta: { transition: 'slide' }
  }),
  defineRoute({
    path: '/users/:id',
    component: () => import('./pages/User.vue'),
    props: route => ({ 
      id: parseInt(route.params.id) 
    }),
    middleware: ['auth']
  })
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    return { top: 0 }
  }
})
```

## Advanced Features

### View Transitions

```typescript
import { useViewTransition } from '@kalxjs-framework/router'

const router = createRouter({
  transitions: {
    default: {
      enter: 'slide-in',
      leave: 'slide-out'
    },
    modal: {
      enter: 'fade-in',
      leave: 'fade-out'
    }
  }
})

// In component
const { isTransitioning } = useViewTransition()
```

### Middleware System

```typescript
import { defineMiddleware } from '@kalxjs-framework/router'

const authMiddleware = defineMiddleware(async (to, from) => {
  const auth = useAuth()
  
  if (!auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})

router.middleware('auth', authMiddleware)
```

### TypeScript Support

```typescript
// Route params typing
interface UserParams {
  id: string
  tab?: 'profile' | 'settings'
}

const UserRoute = defineRoute<UserParams>({
  path: '/users/:id/:tab?',
  component: UserView,
  validate: params => /^\d+$/.test(params.id)
})
```

## License

MIT