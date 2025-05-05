# kalxjs/docs/tutorials/todo-app.md

# Building a Todo App with kalxjs

This tutorial will guide you through building a complete Todo List application using kalxjs. You'll learn how to create components, manage state, handle events, and more.

## Project Setup

First, set up a new kalxjs project using the CLI:

```bash
# Install the CLI if you haven't already
npm install -g @kalxjs/cli

# Create a new project
kalxjs create todo-app

# Navigate to the project
cd todo-app
```

## Project Structure

We'll use the following structure for our Todo app:

```
todo-app/
├── src/
│   ├── components/
│   │   ├── TodoList.js
│   │   ├── TodoItem.js
│   │   ├── TodoForm.js
│   │   └── TodoFilter.js
│   ├── store.js
│   ├── main.js
│   └── styles.css
└── index.html
```

## Creating the Store

First, let's create a central store for our Todo state using kalxjs's state management:

```javascript
// src/store.js
import { createStore } from '@kalxjs/state';

export default createStore({
  state: {
    todos: [],
    filter: 'all' // all, active, completed
  },
  
  mutations: {
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
      const index = state.todos.findIndex(todo => todo.id === id);
      if (index !== -1) {
        state.todos.splice(index, 1);
      }
    },
    
    setFilter(state, filter) {
      state.filter = filter;
    },
    
    clearCompleted(state) {
      state.todos = state.todos.filter(todo => !todo.completed);
    }
  },
  
  getters: {
    filteredTodos(state) {
      switch (state.filter) {
        case 'active':
          return state.todos.filter(todo => !todo.completed);
        case 'completed':
          return state.todos.filter(todo => todo.completed);
        default:
          return state.todos;
      }
    },
    
    remaining(state) {
      return state.todos.filter(todo => !todo.completed).length;
    },
    
    anyCompleted(state) {
      return state.todos.some(todo => todo.completed);
    }
  }
});
```

## Creating the Components

### TodoForm Component

```javascript
// src/components/TodoForm.js
import { defineComponent, h, ref } from '@kalxjs/core';
import store from '../store';

export default defineComponent({
  setup() {
    const input = ref('');
    
    const handleSubmit = (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (text) {
        store.commit('addTodo', text);
        input.value = '';
      }
    };
    
    return { input, handleSubmit };
  },
  
  render() {
    return h('form', { class: 'todo-form', onSubmit: this.handleSubmit }, [
      h('input', {
        type: 'text',
        placeholder: 'What needs to be done?',
        value: this.input.value,
        onInput: (e) => { this.input.value = e.target.value }
      }),
      h('button', { type: 'submit' }, 'Add')
    ]);
  }
});
```

### TodoItem Component

```javascript
// src/components/TodoItem.js
import { defineComponent, h } from '@kalxjs/core';
import store from '../store';

export default defineComponent({
  props: {
    todo: {
      type: Object,
      required: true
    }
  },
  
  render() {
    const { id, text, completed } = this.todo;
    
    return h('li', { class: { 'todo-item': true, 'completed': completed } }, [
      h('input', {
        type: 'checkbox',
        checked: completed,
        onChange: () => store.commit('toggleTodo', id)
      }),
      h('span', { class: 'todo-text' }, text),
      h('button', { 
        class: 'delete-btn',
        onClick: () => store.commit('removeTodo', id)
      }, '×')
    ]);
  }
});
```

### TodoFilter Component

```javascript
// src/components/TodoFilter.js
import { defineComponent, h, computed } from '@kalxjs/core';
import store from '../store';

export default defineComponent({
  setup() {
    const remaining = computed(() => store.getters.remaining);
    const anyCompleted = computed(() => store.getters.anyCompleted);
    const filter = computed(() => store.state.filter);
    
    const setFilter = (newFilter) => {
      store.commit('setFilter', newFilter);
    };
    
    const clearCompleted = () => {
      store.commit('clearCompleted');
    };
    
    return { remaining, anyCompleted, filter, setFilter, clearCompleted };
  },
  
  render() {
    return h('div', { class: 'todo-filter' }, [
      h('span', {}, `${this.remaining.value} items left`),
      
      h('div', { class: 'filter-buttons' }, [
        h('button', { 
          class: { active: this.filter.value === 'all' },
          onClick: () => this.setFilter('all')
        }, 'All'),
        
        h('button', { 
          class: { active: this.filter.value === 'active' },
          onClick: () => this.setFilter('active')
        }, 'Active'),
        
        h('button', { 
          class: { active: this.filter.value === 'completed' },
          onClick: () => this.setFilter('completed')
        }, 'Completed')
      ]),
      
      this.anyCompleted.value ? h('button', {
        class: 'clear-completed',
        onClick: this.clearCompleted
      }, 'Clear completed') : null
    ]);
  }
});
```

### TodoList Component

```javascript
// src/components/TodoList.js
import { defineComponent, h, computed } from '@kalxjs/core';
import TodoItem from './TodoItem';
import TodoForm from './TodoForm';
import TodoFilter from './TodoFilter';
import store from '../store';

export default defineComponent({
  setup() {
    const filteredTodos = computed(() => store.getters.filteredTodos);
    
    return { filteredTodos };
  },
  
  render() {
    return h('div', { class: 'todo-app' }, [
      h('h1', {}, 'Todo App'),
      h(TodoForm),
      
      h('ul', { class: 'todo-list' }, 
        this.filteredTodos.value.map(todo => 
          h(TodoItem, { key: todo.id, todo })
        )
      ),
      
      h(TodoFilter)
    ]);
  }
});
```

## Main Application

```javascript
// src/main.js
import kalxjs from '@kalxjs/core';
import TodoList from './components/TodoList';
import './styles.css';

const app = kalxjs.createApp({
  render() {
    return h(TodoList);
  }
});

app.mount('#app');
```

## CSS Styling

Let's add some basic styling:

```css
/* src/styles.css */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Arial', sans-serif;
  line-height: 1.4;
  background-color: #f5f5f5;
  color: #333;
}

.todo-app {
  max-width: 600px;
  margin: 40px auto;
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 20px;
  color: #2c3e50;
}

.todo-form {
  display: flex;
  margin-bottom: 20px;
}

.todo-form input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 16px;
}

.todo-form button {
  padding: 10px 15px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-size: 16px;
}

.todo-list {
  list-style: none;
  margin-bottom: 20px;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #888;
}

.todo-item input[type="checkbox"] {
  margin-right: 10px;
}

.todo-text {
  flex: 1;
}

.delete-btn {
  background: transparent;
  color: #ff5252;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.todo-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.filter-buttons {
  display: flex;
  gap: 5px;
}

.filter-buttons button {
  padding: 5px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 3px;
  cursor: pointer;
}

.filter-buttons button.active {
  border-color: #42b983;
  color: #42b983;
}

.clear-completed {
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
}

.clear-completed:hover {
  text-decoration: underline;
}
```

## HTML Entry Point

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todo App with kalxjs</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

## Running the Application

Start the development server:

```bash
npm run dev
```

## Summary

Congratulations! You've built a complete Todo application with kalxjs. This app demonstrates several key features:

- Component-based architecture
- Centralized state management
- Reactive updates
- Event handling
- Computed properties
- Conditional rendering

## Next Steps

- Add local storage persistence
- Implement drag-and-drop reordering
- Add animations for adding/removing todos
- Create user accounts and backend synchronization

Feel free to enhance this application with additional features as you continue learning kalxjs.