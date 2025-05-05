<!-- kalxjs/docs/api/state.md -->
# State Management API

kalxjs provides a centralized state management solution inspired by Vuex and Redux for handling application-level data.

## createStore()

Creates a new store instance for state management.

```javascript
import { createStore } from 'kalxjs/state';

const store = createStore({
  // Define initial state
  state: {
    count: 0,
    todos: []
  },
  
  // Synchronous state changes
  mutations: {
    increment(state, amount = 1) {
      state.count += amount;
    },
    addTodo(state, todo) {
      state.todos.push(todo);
    }
  },
  
  // Asynchronous operations
  actions: {
    async fetchTodos({ commit }) {
      const response = await fetch('/api/todos');
      const todos = await response.json();
      commit('setTodos', todos);
    },
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment');
      }, 1000);
    }
  },
  
  // Computed state
  getters: {
    doubleCount(state) {
      return state.count * 2;
    },
    incompleteTodos(state) {
      return state.todos.filter(todo => !todo.completed);
    }
  }
});
```

### Arguments

- `{Object} options` - Store configuration options

### Options

- `state` - Object containing the initial state
- `mutations` - Object with mutation functions to change state
- `actions` - Object with action functions for async operations
- `getters` - Object with getter functions for derived state

### Returns

- `{Object}` - Store instance

## Store Instance Properties

### store.state

Access the store's state (read-only).

```javascript
console.log(store.state.count); // Access state
```

### store.getters

Access the store's computed properties.

```javascript
console.log(store.getters.doubleCount);
```

## Store Instance Methods

### store.commit()

Commit a mutation to change state.

```javascript
// Commit a mutation
store.commit('increment');

// With payload
store.commit('increment', 5);
```

### store.dispatch()

Dispatch an action.

```javascript
// Dispatch an action
store.dispatch('fetchTodos');

// With payload
store.dispatch('addTodoAsync', { text: 'Learn kalxjs', completed: false });
```

### store.subscribe()

Subscribe to store mutations.

```javascript
// Subscribe to all mutations
const unsubscribe = store.subscribe((mutation, state) => {
  console.log(`Mutation: ${mutation.type}`, mutation.payload);
  console.log('New state:', state);
});

// Later, to unsubscribe
unsubscribe();
```

### store.registerModule()

Dynamically register a new module in the store.

```javascript
store.registerModule('user', {
  state: {
    profile: null
  },
  mutations: {
    setProfile(state, profile) {
      state.profile = profile;
    }
  },
  actions: {
    async fetchProfile({ commit }) {
      const profile = await fetchUserProfile();
      commit('setProfile', profile);
    }
  }
});
```

## Integrating with Components

```javascript
import { defineComponent } from 'kalxjs';
import store from './store';

const Counter = defineComponent({
  render() {
    return h('div', [
      h('p', `Count: ${store.state.count}`),
      h('p', `Double: ${store.getters.doubleCount}`),
      h('button', { onClick: () => store.commit('increment') }, 'Increment'),
      h('button', { onClick: () => store.dispatch('incrementAsync') }, 'Increment Async')
    ]);
  }
});
```