# State Management API

kalxjs provides a modern, reactive state management solution that combines the best features of Vuex, Redux and Recoil while maintaining simplicity and performance.

## Installation

```bash
# Install latest version
npm install @kalxjs/store@latest
```

Current version: 1.2.0

## Import

```javascript
import { createStore } from '@kalxjs/store'
```

## Key Features

- **Composition API Integration**: Seamless integration with the Composition API
- **Atomic Updates**: Fine-grained reactivity for better performance
- **TypeScript Support**: Full type inference and safety
- **DevTools Integration**: Built-in debugging capabilities
- **Plugin System**: Extensible via plugins
- **Middleware Support**: Custom middleware for state changes
- **Time Travel Debugging**: Undo/redo state changes during development

## Setup

```javascript
import { createStore } from '@kalxjs/store'

const store = createStore({
  state: {
    count: 0,
    todos: [],
    settings: {
      theme: 'light',
      notifications: true
    }
  },
  mutations: {
    increment(state, amount = 1) {
      state.count += amount
    },
    addTodo(state, todo) {
      state.todos.push({
        id: Date.now(),
        ...todo,
        createdAt: new Date()
      })
    },
    updateSettings(state, settings) {
      state.settings = { ...state.settings, ...settings }
    }
  },
  actions: {
    async fetchInitialState({ commit }) {
      const [todos, settings] = await Promise.all([
        fetch('/api/todos').then(r => r.json()),
        fetch('/api/settings').then(r => r.json())
      ])
      commit('setTodos', todos)
      commit('updateSettings', settings)
    },
    async saveTodo({ commit }, todo) {
      const response = await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(todo)
      })
      const savedTodo = await response.json()
      commit('addTodo', savedTodo)
    }
  },
  getters: {
    completedTodos: state => state.todos.filter(todo => todo.completed),
    pendingTodos: state => state.todos.filter(todo => !todo.completed),
    todoCount: state => state.todos.length
  },
  plugins: [
    store => {
      // Example plugin for localStorage persistence
      const savedState = localStorage.getItem('app-state')
      if (savedState) {
        store.replaceState(JSON.parse(savedState))
      }
      store.subscribe((mutation, state) => {
        localStorage.setItem('app-state', JSON.stringify(state))
      })
    }
  ]
})

// Use with app
import { createApp } from '@kalxjs/core'
import App from './App.klx'

const app = createApp(App)
app.use(store)
app.mount('#app')
```

## createStore()

Creates a new store instance for state management.

```javascript
import { createStore } from '@kalxjs/store'

const store = createStore({
  // Define initial state
  state: {
    count: 0,
    todos: []
  },
  
  // Synchronous state changes
  mutations: {
    increment(state, amount = 1) {
      state.count += amount
    },
    addTodo(state, todo) {
      state.todos.push(todo)
    }
  },
  
  // Asynchronous operations
  actions: {
    async fetchTodos({ commit }) {
      const response = await fetch('/api/todos')
      const todos = await response.json()
      commit('setTodos', todos)
    },
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment')
      }, 1000)
    }
  }
})
```

### Arguments

- `{Object} options` - Store configuration options

### Options

- `state` - Object containing the initial state (will be made reactive)
- `mutations` - Object with mutation functions to change state
- `actions` - Object with action functions for async operations

### Returns

- `{Object}` - Store instance

## Store Instance Properties

### store.state

Access the store's reactive state.

```javascript
console.log(store.state.count) // Access state
```

The state is reactive, so changes will automatically trigger UI updates.

## Store Instance Methods

### store.commit()

Commit a mutation to change state.

```javascript
// Commit a mutation
store.commit('increment')

// With payload
store.commit('increment', 5)
```

### store.dispatch()

Dispatch an action.

```javascript
// Dispatch an action
store.dispatch('fetchTodos')

// With payload
store.dispatch('addTodoAsync', { text: 'Learn kalxjs', completed: false })
```

### store.watch()

Watch for state changes.

```javascript
// Watch a specific state property
store.watch(state => state.count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`)
})
```

## Accessing the Store in Components

### Composition API

```javascript
import { computed } from '@kalxjs/core'

export default {
  setup() {
    // Access store via injection
    const store = inject('store')
    
    // Create computed properties from store state
    const count = computed(() => store.state.count)
    
    // Methods that commit mutations
    function increment() {
      store.commit('increment')
    }
    
    // Methods that dispatch actions
    function incrementAsync() {
      store.dispatch('incrementAsync')
    }
    
    return {
      count,
      increment,
      incrementAsync
    }
  }
}
```

### Options API

```javascript
export default {
  computed: {
    // Map state to computed properties
    count() {
      return this.$store.state.count
    }
  },
  methods: {
    // Methods that commit mutations
    increment() {
      this.$store.commit('increment')
    },
    // Methods that dispatch actions
    incrementAsync() {
      this.$store.dispatch('incrementAsync')
    }
  }
}
```

## Helper Functions

### mapState()

Map store state to component computed properties.

```javascript
import { mapState } from '@kalxjs/store'

export default {
  computed: {
    // Map state properties directly
    ...mapState(['count', 'todos']),
    
    // Map with custom names
    ...mapState({
      counter: 'count',
      todoList: 'todos'
    }),
    
    // Map with functions
    ...mapState({
      countPlusOne: state => state.count + 1
    })
  }
}
```

### mapGetters()

Map store getters to component computed properties.

```javascript
import { mapGetters } from '@kalxjs/store'

export default {
  computed: {
    // Map getters directly
    ...mapGetters(['doubleCount', 'incompleteTodos']),
    
    // Map with custom names
    ...mapGetters({
      doubled: 'doubleCount',
      pending: 'incompleteTodos'
    })
  }
}
```

## Modules

For larger applications, you can organize your store into modules.

```javascript
const store = createStore({
  modules: {
    counter: {
      state: {
        count: 0
      },
      mutations: {
        increment(state) {
          state.count++
        }
      },
      actions: {
        incrementAsync({ commit }) {
          setTimeout(() => {
            commit('increment')
          }, 1000)
        }
      }
    },
    todos: {
      state: {
        list: []
      },
      mutations: {
        add(state, todo) {
          state.list.push(todo)
        }
      }
    }
  }
})

// Access module state
console.log(store.state.counter.count)
console.log(store.state.todos.list)

// Commit module mutations
store.commit('counter/increment')
store.commit('todos/add', { text: 'Learn kalxjs', completed: false })

// Dispatch module actions
store.dispatch('counter/incrementAsync')
```

## Advanced Features

### Middleware Support

Add custom middleware to intercept state changes:

```javascript
const loggingMiddleware = store => next => mutation => {
  console.log('before mutation:', store.state)
  next(mutation)
  console.log('after mutation:', store.state)
}

const store = createStore({
  // ...store config
  middleware: [loggingMiddleware]
})
```

### Time Travel

During development, use time travel debugging:

```javascript
// In development
store.enableTimeTravel()

// Go back one step
store.undo()

// Go forward one step
store.redo()

// Go to specific state
store.timeTravel(stateIndex)
```

### Hot Module Replacement

Support for HMR in development:

```javascript
if (import.meta.hot) {
  import.meta.hot.accept(['./store/mutations'], ([newMutations]) => {
    store.hotUpdate({
      mutations: newMutations
    })
  })
}
```

### Subscription API

Advanced subscription options:

```javascript
// Subscribe to specific mutation types
store.subscribe('increment', (mutation, state) => {
  analytics.track('Counter Incremented', { value: state.count })
})

// Subscribe with filters
store.subscribe(
  mutation => mutation.type.startsWith('todo/'),
  (mutation, state) => {
    syncTodos(state.todos)
  }
)
```

## Using with TypeScript

The store supports TypeScript for type safety.

```typescript
// Define state interface
interface State {
  count: number
  todos: Todo[]
}

interface Todo {
  id: number
  text: string
  completed: boolean
}

// Create typed store
const store = createStore<State>({
  state: {
    count: 0,
    todos: []
  },
  mutations: {
    increment(state) {
      state.count++
    },
    addTodo(state, todo: Todo) {
      state.todos.push(todo)
    }
  }
})
```

## Best Practices

1. **State Mutations**: Always use mutations to change state, never modify state directly.
2. **Async Operations**: Use actions for asynchronous operations, mutations for synchronous state changes.
3. **Modules**: Use modules to organize your store for larger applications.
4. **Composition API**: Use the Composition API for better type inference and code organization.
5. **Reactivity**: Remember that the store state is reactive, so you can use it directly in computed properties.

## Implementation Details

The kalxjs state management system is built on a reactive architecture that efficiently tracks and updates state changes:

### Reactive State

The store uses the same reactivity system as the core framework:

```javascript
// Simplified implementation
function createStore(options) {
  // Create reactive state
  const state = reactive(options.state || {});
  
  // Create store instance
  const store = {
    state,
    
    // Commit a mutation
    commit(type, payload) {
      const mutation = options.mutations[type];
      if (!mutation) {
        console.warn(`Unknown mutation type: ${type}`);
        return;
      }
      
      // Call the mutation with state and payload
      mutation(state, payload);
      
      // Notify subscribers
      notifySubscribers(type, payload);
    },
    
    // Dispatch an action
    async dispatch(type, payload) {
      const action = options.actions[type];
      if (!action) {
        console.warn(`Unknown action type: ${type}`);
        return;
      }
      
      // Call the action with context and payload
      return action({
        state,
        commit: store.commit,
        dispatch: store.dispatch
      }, payload);
    }
  };
  
  return store;
}
```

### State Change Flow

1. **Component Interaction**: A component calls `store.commit()` or `store.dispatch()`
2. **Mutation Execution**: The mutation function updates the reactive state
3. **Reactivity System**: The reactivity system detects the state change
4. **Component Updates**: Components using the state are automatically updated

### Integration with Components

The store integrates with the component system through:

1. App-level registration: `app.use(store)`
2. Component injection: `const store = inject('store')`
3. Helper functions: `mapState`, `mapGetters`, etc.

## Version Information

For detailed version history and changes, please refer to the [CHANGELOG.md](https://github.com/Odeneho-Calculus/kalxjs/blob/main/KALXJS-FRAMEWORK/packages/store/CHANGELOG.md) file in the repository.