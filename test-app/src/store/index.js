import { createStore } from '@kalxjs/state';

    // Create and export the main store
    export default createStore({
      state: {
        count: 0,
        todos: [],
        loading: false,
        error: null
      },
      getters: {
        doubleCount: state => state.count * 2,
        completedTodos: state => state.todos.filter(todo => todo.completed),
        pendingTodos: state => state.todos.filter(todo => !todo.completed)
      },
      mutations: {
        increment(state) {
          state.count++;
        },
        decrement(state) {
          state.count--;
        },
        setCount(state, value) {
          state.count = value;
        },
        addTodo(state, todo) {
          state.todos.push(todo);
        },
        removeTodo(state, id) {
          state.todos = state.todos.filter(todo => todo.id !== id);
        },
        toggleTodo(state, id) {
          const todo = state.todos.find(todo => todo.id === id);
          if (todo) {
            todo.completed = !todo.completed;
          }
        },
        setLoading(state, status) {
          state.loading = status;
        },
        setError(state, error) {
          state.error = error;
        }
      },
      actions: {
        async fetchData({ commit }) {
          commit('setLoading', true);
          commit('setError', null);

          try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            commit('setCount', 42);
          } catch (error) {
            commit('setError', error.message);
          } finally {
            commit('setLoading', false);
          }
        }
      }
    }); 