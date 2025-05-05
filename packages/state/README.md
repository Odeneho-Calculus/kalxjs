# kalxjs State

Centralized state management solution for kalxjs applications, inspired by Vuex and Redux.

## Features

- **Centralized Store**: Single source of truth for application state
- **Predictable Mutations**: State changes are explicit and traceable
- **Actions**: For handling asynchronous operations
- **Getters**: Compute derived state based on store state
- **Plugins**: Extend store functionality with plugins

## Installation

```bash
npm install @kalxjs/state
```

## Basic Usage

```javascript
import kalxjs from '@kalxjs/core';
import { createStore } from '@kalxjs/state';

// Create a store
const store = createStore({
  state: {
    count: 0,
    todos: []
  },
  
  mutations: {
    INCREMENT(state, amount = 1) {
      state.count += amount;
    },
    ADD_TODO(state, todo) {
      state.todos.push(todo);
    }
  },
  
  actions: {
    incrementAsync({ commit }, amount) {
      setTimeout(() => {
        commit('INCREMENT', amount);
      }, 1000);
    },
    addTodo({ commit }, text) {
      commit('ADD_TODO', {
        id: Date.now(),
        text,
        completed: false
      });
    }
  },
  
  getters: {
    doubleCount(state) {
      return state.count * 2;
    },
    incompleteTodos(state) {
      return state.todos.filter(todo => !todo.completed);
    }
  }
});

// Create a component using the store
const Counter = kalxjs.defineComponent({
  methods: {
    increment() {
      store.commit('INCREMENT');
    },
    incrementAsync() {
      store.dispatch('incrementAsync', 1);
    }
  },
  
  render(h) {
    return h('div', {}, [
      h('p', {}, `Count: ${store.state.count}`),
      h('p', {}, `Double Count: ${store.getters.doubleCount}`),
      h('button', { onClick: this.increment }, 'Increment'),
      h('button', { onClick: this.incrementAsync }, 'Increment Async')
    ]);
  }
});

// Create and mount the app
const app = kalxjs.createApp({
  render(h) {
    return h(Counter);
  }
});

// Use the store
app.use(store);
app.mount('#app');
```

## API Documentation

### Store Creation

- `createStore(options)`: Create a new store
  - `options.state`: Object containing the state
  - `options.mutations`: Object with state mutation functions
  - `options.actions`: Object with action functions
  - `options.getters`: Object with getter functions
  - `options.plugins`: Array of plugins to use

### Store Methods

- `store.commit(type, payload?)`: Commit a mutation
- `store.dispatch(type, payload?)`: Dispatch an action
- `store.subscribe(callback)`: Subscribe to state changes
- `store.registerModule(name, module)`: Register a dynamic module
- `store.unregisterModule(name)`: Unregister a dynamic module

### Plugins

```javascript
// Example plugin for persisting state to localStorage
function persistStatePlugin(store) {
  // Restore state from localStorage
  const savedState = localStorage.getItem('kalxjs-state');
  if (savedState) {
    store.replaceState(JSON.parse(savedState));
  }
  
  // Save state to localStorage on changes
  store.subscribe((mutation, state) => {
    localStorage.setItem('kalxjs-state', JSON.stringify(state));
  });
}

// Use the plugin
const store = createStore({
  // store options...
  plugins: [persistStatePlugin]
});
```

## License

MIT