import { createStore } from '@kalxjs/state';

export const store = createStore({
    state: {
        count: 0,
        user: {
            name: 'Developer'
        },
        todos: [
            { id: 1, text: 'Learn KalxJS', completed: true },
            { id: 2, text: 'Build an awesome app', completed: false }
        ]
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
        setCount(state, value) {
            state.count = value;
        },
        addTodo(state, text) {
            state.todos.push({
                id: Date.now(),
                text,
                completed: false
            });
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

// Add watch functionality for the custom renderer
if (!store.watch) {
    store.watch = function(getter, callback) {
        let lastValue = getter(this.state);
        
        // Create a simple watcher that checks for changes on each mutation
        const unsubscribe = this.subscribe((mutation, state) => {
            const newValue = getter(state);
            if (newValue !== lastValue) {
                callback(newValue, lastValue);
                lastValue = newValue;
            }
        });
        
        return unsubscribe;
    };
}

export default store;