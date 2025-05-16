import { createStore as createKalStore } from '@kalxjs/state';

    // Define version for compatibility checks
    const version = '1.2.49';

    export function createStore() {
      return createKalStore({
        state: {
          count: 0,
          user: {
            name: '',
            isAuthenticated: false
          },
          todos: []
        },

        getters: {
          completedTodos: (state) => {
            return state.todos.filter(todo => todo.completed);
          },

          incompleteTodos: (state) => {
            return state.todos.filter(todo => !todo.completed);
          },

          todoCount: (state) => {
            return state.todos.length;
          }
        },

        mutations: {
          increment(state) {
            state.count++;
          },

          decrement(state) {
            state.count--;
          },

          setUser(state, user) {
            state.user = user;
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
          }
        },

        actions: {
          incrementAsync({ commit }) {
            setTimeout(() => {
              commit('increment');
            }, 1000);
          },

          login({ commit }, credentials) {
            // Simulate API call
            return new Promise((resolve) => {
              setTimeout(() => {
                const user = {
                  name: credentials.username,
                  isAuthenticated: true
                };
                commit('setUser', user);
                resolve(user);
              }, 1000);
            });
          },

          fetchTodos({ commit }) {
            // Simulate API call
            return new Promise((resolve) => {
              setTimeout(() => {
                const todos = [
                  { id: 1, text: 'Learn KalxJS', completed: true },
                  { id: 2, text: 'Build an app', completed: false },
                  { id: 3, text: 'Deploy to production', completed: false }
                ];

                todos.forEach(todo => {
                  commit('addTodo', todo);
                });

                resolve(todos);
              }, 1000);
            });
          }
        }
      });
    }
    