// Import KalxJS modules
import { createStore } from '../../packages/state/src/index.js';
import { createRouter } from '../../packages/router/src/index.js';
import { createCustomRenderer } from '../../packages/core/src/renderer/index.js';

// Create the store
const store = createStore({
  state: {
    count: 0,
    todos: [
      { id: 1, text: 'Learn KalxJS', completed: true },
      { id: 2, text: 'Build an app', completed: false }
    ],
    user: {
      name: 'User'
    }
  },
  getters: {
    doubleCount: state => state.count * 2,
    completedTodos: state => state.todos.filter(todo => todo.completed)
  },
  mutations: {
    increment(state) {
      state.count++;
    },
    decrement(state) {
      state.count--;
    },
    addTodo(state, payload) {
      const newTodo = {
        id: Date.now(),
        text: payload.text,
        completed: false
      };
      state.todos.push(newTodo);
    },
    toggleTodo(state, id) {
      const todo = state.todos.find(todo => todo.id === id);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    removeTodo(state, id) {
      state.todos = state.todos.filter(todo => todo.id !== id);
    }
  }
});

// Add fallback getters if the store doesn't provide them
if (!store.getters) {
  console.warn('Store getters not found, creating fallback getters');
  store.getters = {
    doubleCount: () => store.state.count * 2,
    completedTodos: () => store.state.todos.filter(todo => todo.completed)
  };
}

// Create the router
const router = createRouter({
  mode: 'hash', // Use hash mode for simplicity
  routes: [
    {
      path: '/',
      component: 'home'
    },
    {
      path: '/counter',
      component: 'counter'
    },
    {
      path: '/todos',
      component: 'todos'
    },
    {
      path: '/about',
      component: 'about'
    }
  ]
});

// Initialize the router
router.init();

// Create the custom renderer
const renderer = createCustomRenderer(router, store);

// Initialize the renderer
renderer.init('#router-view');

// Force navigation to home route if no hash is present
if (window.location.hash === '') {
  router.push('/');
}

// Export for debugging
window.app = {
  store,
  router,
  renderer
};