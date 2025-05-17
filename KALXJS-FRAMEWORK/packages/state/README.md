# kalxjs State

Next-generation state management for kalxjs applications with composables, TypeScript, and optimized performance.

## Features

- **Composable State**: State composition with hooks
- **Atomic Updates**: Fine-grained reactivity
- **TypeScript Support**: Full type inference
- **State Time Travel**: Undo/redo capabilities
- **State Persistence**: Built-in storage adapters
- **State Sync**: Real-time state synchronization
- **DevTools Integration**: Advanced debugging
- **Performance Optimizations**: Automatic batching

## Installation

```bash
npm install @kalxjs-framework/state
```

## Modern Usage

```typescript
import { defineStore } from '@kalxjs-framework/state'
import type { State, Actions, Getters } from '@kalxjs-framework/state'

// Define store types
interface TodoState {
  items: Todo[]
  filter: 'all' | 'active' | 'completed'
}

// Create type-safe store
const useTodoStore = defineStore<TodoState>({
  id: 'todos',
  
  state: () => ({
    items: [],
    filter: 'all'
  }),

  actions: {
    async addTodo(text: string) {
      const todo = await api.createTodo({ text })
      this.items.push(todo)
    }
  },

  getters: {
    filtered(): Todo[] {
      return this.items.filter(todo => 
        this.filter === 'all' || 
        todo.completed === (this.filter === 'completed')
      )
    }
  }
})

// Use in components
const TodoList = defineComponent({
  setup() {
    const store = useTodoStore()
    const todos = computed(() => store.filtered)
    
    return { todos }
  }
})
```

## Advanced Features

### State Composition

```typescript
// Composable state logic
function useAuth() {
  const user = signal<User | null>(null)
  const isLoggedIn = computed(() => !!user())
  
  async function login(credentials: Credentials) {
    user.value = await api.login(credentials)
  }
  
  return {
    user,
    isLoggedIn,
    login
  }
}

// Use in store
const useAppStore = defineStore({
  compose: () => {
    const auth = useAuth()
    const todos = useTodoStore()
    
    return {
      auth,
      todos
    }
  }
})
```

### State Persistence

```typescript
import { persistence } from '@kalxjs-framework/state'

const store = defineStore({
  persist: {
    storage: localStorage,
    paths: ['user', 'settings'],
    serializer: {
      serialize: JSON.stringify,
      deserialize: JSON.parse
    }
  }
})
```

### Performance

```typescript
import { batch, transaction } from '@kalxjs-framework/state'

// Batch multiple commits
batch(() => {
  store.commit('updateMany', items)
  store.commit('updateStatus', 'done')
})

// Transactional updates
transaction(async () => {
  await store.dispatch('transferFunds')
  await store.dispatch('updateBalance')
})
```

## License

MIT