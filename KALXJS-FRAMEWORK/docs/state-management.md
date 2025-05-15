# State Management

KALXJS provides a centralized state management solution for managing application state.

## Basic Usage

```javascript
import { createApp } from 'kalxjs-framework/core';
import { createStore } from 'kalxjs-framework/state';

// Create a store
const store = createStore({
  state: {
    count: 0,
    todos: []
  },
  getters: {
    doubleCount(state) {
      return state.count * 2;
    },
    completedTodos(state) {
      return state.todos.filter(todo => todo.completed);
    }
  },
  mutations: {
    increment(state) {
      state.count++;
    },
    addTodo(state, todo) {
      state.todos.push(todo);
    },
    toggleTodo(state, id) {
      const todo = state.todos.find(todo => todo.id === id);
      if (todo) {
        todo.completed = !todo.completed;
      }
    }
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
      todos.forEach(todo => commit('addTodo', todo));
    }
  }
});

// Create app and use store
const app = createApp({
  template: `
    <div>
      <p>Count: {{ count }}</p>
      <p>Double Count: {{ doubleCount }}</p>
      <button @click="increment">Increment</button>
      <button @click="incrementAsync">Increment Async</button>
    </div>
  `,
  computed: {
    count() {
      return store.state.count;
    },
    doubleCount() {
      return store.getters.doubleCount;
    }
  },
  methods: {
    increment() {
      store.commit('increment');
    },
    incrementAsync() {
      store.dispatch('incrementAsync');
    }
  }
});

app.mount('#app');
```

## Modules

For larger applications, you can organize your store into modules:

```javascript
const counterModule = {
  namespaced: true,
  state: {
    count: 0
  },
  getters: {
    doubleCount(state) {
      return state.count * 2;
    }
  },
  mutations: {
    increment(state) {
      state.count++;
    }
  },
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment');
      }, 1000);
    }
  }
};

const todosModule = {
  namespaced: true,
  state: {
    todos: []
  },
  getters: {
    completedTodos(state) {
      return state.todos.filter(todo => todo.completed);
    }
  },
  mutations: {
    addTodo(state, todo) {
      state.todos.push(todo);
    },
    toggleTodo(state, id) {
      const todo = state.todos.find(todo => todo.id === id);
      if (todo) {
        todo.completed = !todo.completed;
      }
    }
  },
  actions: {
    async fetchTodos({ commit }) {
      const response = await fetch('/api/todos');
      const todos = await response.json();
      todos.forEach(todo => commit('addTodo', todo));
    }
  }
};

const store = createStore({
  modules: {
    counter: counterModule,
    todos: todosModule
  }
});

// Access module state and getters
console.log(store.state.counter.count);
console.log(store.getters['counter/doubleCount']);

// Commit module mutations
store.commit('counter/increment');

// Dispatch module actions
store.dispatch('todos/fetchTodos');
```

## Composition API Integration

You can use the store with the Composition API:

```javascript
import { createApp, ref, computed } from 'kalxjs-framework/core';
import { createStore, useStore } from 'kalxjs-framework/state';

const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++;
    }
  }
});

const CounterComponent = {
  setup() {
    const store = useStore();
    
    const count = computed(() => store.state.count);
    
    const increment = () => {
      store.commit('increment');
    };
    
    return {
      count,
      increment
    };
  },
  template: `
    <div>
      <p>Count: {{ count }}</p>
      <button @click="increment">Increment</button>
    </div>
  `
};

const app = createApp(CounterComponent);
app.use(store);
app.mount('#app');
```

## Plugins

You can extend the store with plugins:

```javascript
// Logger plugin
const loggerPlugin = store => {
  store.subscribe((mutation, state) => {
    console.log('Mutation:', mutation.type);
    console.log('Payload:', mutation.payload);
    console.log('State after mutation:', state);
  });
};

// Persistence plugin
const persistencePlugin = store => {
  // Load saved state from localStorage
  const savedState = localStorage.getItem('store');
  if (savedState) {
    store.replaceState(JSON.parse(savedState));
  }
  
  // Save state to localStorage on mutation
  store.subscribe((mutation, state) => {
    localStorage.setItem('store', JSON.stringify(state));
  });
};

// Create store with plugins
const store = createStore({
  state: { /* ... */ },
  mutations: { /* ... */ },
  plugins: [loggerPlugin, persistencePlugin]
});
```