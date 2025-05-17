# @kalxjs/store

> Global state management for KalxJS applications

This package provides a state management solution for KalxJS applications.

## Installation

```bash
npm install @kalxjs/store
```

## Usage

```js
import { createApp } from '@kalxjs/core';
import { createStore } from '@kalxjs/store';
import App from './App.js';

// Create a store
const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++;
    },
    decrement(state) {
      state.count--;
    }
  },
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment');
      }, 1000);
    }
  }
});

// Create app and use store
const app = createApp(App);
app.use(store);
app.mount('#app');
```

In your components:

```js
import { mapState } from '@kalxjs/store';

export default {
  computed: {
    ...mapState(['count'])
  },
  methods: {
    increment() {
      this.$store.commit('increment');
    },
    decrement() {
      this.$store.commit('decrement');
    },
    incrementAsync() {
      this.$store.dispatch('incrementAsync');
    }
  }
};
```

## API

### `createStore(options)`

Creates a new store instance.

Options:
- `state`: The root state object
- `mutations`: Methods to mutate the state
- `actions`: Methods to perform async operations and commit mutations
- `getters`: Computed properties for the store

### `mapState(namespace?, map)`

Maps store state to component computed properties.

### `mapGetters(namespace?, map)`

Maps store getters to component computed properties.

### `mapMutations(namespace?, map)`

Maps store mutations to component methods.

### `mapActions(namespace?, map)`

Maps store actions to component methods.

## License

MIT