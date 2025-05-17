# State Management Guide

KalxJS provides a built-in state management system with more modern API and better TypeScript support. It offers a centralized store for all components in an application, with rules ensuring that state can only be mutated in a predictable fashion.

## Basic Usage

```js
import { createStore } from '@kalxjs/state';

// Create a store
const store = createStore({
  state: {
    count: 0,
    todos: []
  },
  getters: {
    doubleCount: state => state.count * 2,
    doneTodos: state => state.todos.filter(todo => todo.done)
  },
  mutations: {
    increment: state => state.count++,
    addTodo: (state, todo) => state.todos.push(todo)
  },
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment');
      }, 1000);
    },
    async fetchTodos({ commit }) {
      const response = await fetch('/api/todos');
      const todos = await response.json();
      commit('setTodos', todos);
    }
  }
});

// Access state
console.log(store.state.count); // 0

// Access getters
console.log(store.getters.doubleCount); // 0

// Commit mutations
store.commit('increment');
console.log(store.state.count); // 1

// Dispatch actions
store.dispatch('incrementAsync');
```

## Store Options

### State

The state is the source of truth for your application. It's a reactive object that can be accessed directly from the store.

```js
const store = createStore({
  state: {
    count: 0,
    user: {
      name: 'John',
      email: 'john@example.com'
    }
  }
});

// Access state
console.log(store.state.count); // 0
console.log(store.state.user.name); // 'John'
```

You can also use a function to create the state, which is useful for reusing state:

```js
const store = createStore({
  state: () => ({
    count: 0,
    user: {
      name: 'John',
      email: 'john@example.com'
    }
  })
});
```

### Getters

Getters are computed properties for the store. They receive the state as their first argument and can also access other getters.

```js
const store = createStore({
  state: {
    todos: [
      { id: 1, text: 'Learn KalxJS', done: true },
      { id: 2, text: 'Build an app', done: false }
    ]
  },
  getters: {
    doneTodos: state => state.todos.filter(todo => todo.done),
    doneTodosCount: (state, getters) => getters.doneTodos.length
  }
});

// Access getters
console.log(store.getters.doneTodos); // [{ id: 1, text: 'Learn KalxJS', done: true }]
console.log(store.getters.doneTodosCount); // 1
```

### Mutations

Mutations are the only way to change the state in a KalxJS store. They are synchronous functions that receive the state as their first argument and an optional payload as their second argument.

```js
const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment: state => state.count++,
    incrementBy: (state, amount) => state.count += amount
  }
});

// Commit mutations
store.commit('increment');
console.log(store.state.count); // 1

store.commit('incrementBy', 10);
console.log(store.state.count); // 11
```

### Actions

Actions are similar to mutations, but they can contain asynchronous operations. They receive a context object with the same properties as the store instance, as well as an optional payload.

```js
const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment: state => state.count++
  },
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment');
      }, 1000);
    },
    incrementIfOdd({ state, commit }) {
      if (state.count % 2 !== 0) {
        commit('increment');
      }
    }
  }
});

// Dispatch actions
store.dispatch('incrementAsync');
store.dispatch('incrementIfOdd');
```

## Advanced Features

### Modules

You can divide your store into modules, each with its own state, getters, mutations, and actions.

```js
import { createStore, createModule } from '@kalxjs/state';

// Create a module
const counterModule = createModule({
  namespaced: true,
  state: {
    count: 0
  },
  getters: {
    doubleCount: state => state.count * 2
  },
  mutations: {
    increment: state => state.count++
  },
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment');
      }, 1000);
    }
  }
});

// Create a store with modules
const store = createStore({
  modules: {
    counter: counterModule
  }
});

// Access module state
console.log(store.state.counter.count); // 0

// Access module getters
console.log(store.getters['counter/doubleCount']); // 0

// Commit module mutations
store.commit('counter/increment');
console.log(store.state.counter.count); // 1

// Dispatch module actions
store.dispatch('counter/incrementAsync');
```

### Plugins

Plugins are a way to extend the store with additional functionality. They receive the store instance as their only argument.

```js
import { createStore, createStorePlugin } from '@kalxjs/state';

// Create a logger plugin
const loggerPlugin = createStorePlugin(store => {
  store.$subscribe((state) => {
    console.log('State changed:', state);
  });
});

// Create a store with plugins
const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment: state => state.count++
  },
  plugins: [loggerPlugin]
});

// Commit mutations
store.commit('increment'); // Logs: State changed: { count: 1 }
```

### Persisted State

KalxJS provides a built-in plugin for persisting the state to localStorage or sessionStorage.

```js
import { createStore, createPersistedState } from '@kalxjs/state';

// Create a store with persisted state
const store = createStore({
  state: {
    count: 0,
    user: {
      name: 'John',
      email: 'john@example.com'
    }
  },
  mutations: {
    increment: state => state.count++
  },
  plugins: [
    createPersistedState({
      key: 'my-app',
      paths: ['count'] // Only persist the count
    })
  ]
});
```

## Composition API Integration

KalxJS provides a way to define stores using the Composition API with the `defineStore` function.

```js
import { defineStore } from '@kalxjs/state';
import { ref, computed } from '@kalxjs/core';

// Define a store
const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0);
  
  // Getters
  const doubleCount = computed(() => count.value * 2);
  
  // Actions
  function increment() {
    count.value++;
  }
  
  function incrementAsync() {
    setTimeout(() => {
      count.value++;
    }, 1000);
  }
  
  return {
    count,
    doubleCount,
    increment,
    incrementAsync
  };
});

// Use the store in a component
export default {
  setup() {
    const counterStore = useCounterStore();
    
    return {
      count: () => counterStore.count,
      doubleCount: () => counterStore.doubleCount,
      increment: () => counterStore.increment()
    };
  }
};
```

You can also use the options API with `defineStore`:

```js
import { defineStore } from '@kalxjs/state';

// Define a store
const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  getters: {
    doubleCount: state => state.count * 2
  },
  actions: {
    increment() {
      this.count++;
    },
    incrementAsync() {
      setTimeout(() => {
        this.increment();
      }, 1000);
    }
  }
});
```

## Best Practices

1. **Use mutations for state changes**: Always use mutations to change the state, even in actions. This ensures that all state changes are tracked and can be debugged.

2. **Keep actions focused**: Actions should have a single responsibility. If an action is doing too much, split it into multiple actions.

3. **Use getters for derived state**: If you need to compute a value from the state, use a getter instead of computing it in a component.

4. **Use modules for large stores**: If your store is getting too large, split it into modules to keep it organized.

5. **Use namespaced modules**: Namespaced modules help avoid naming conflicts and make it clear which module a getter, mutation, or action belongs to.

6. **Use plugins for cross-cutting concerns**: If you need to add functionality that affects the entire store, use a plugin.

7. **Use persisted state for user preferences**: If you need to persist user preferences, use the persisted state plugin.

8. **Use the Composition API for complex stores**: If your store has complex logic, consider using the Composition API with `defineStore`.