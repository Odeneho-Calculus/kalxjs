# Building a Modern Todo App with kalxjs

Learn how to build a full-featured Todo application using kalxjs v2.1.14's latest features.

## Project Setup

```bash
# Create new project with Vite
npm create kalx@latest todo-app

# Select features
✔ Add TypeScript? Yes
✔ Add Tailwind CSS? Yes
✔ Add Testing? Yes
✔ Add State Management? Yes
✔ Add Animations? Yes
```

## Project Structure

```
todo-app/
├── src/
│   ├── components/
│   │   ├── todo/
│   │   │   ├── TodoList.klx
│   │   │   ├── TodoItem.klx
│   │   │   ├── TodoForm.klx
│   │   │   └── TodoFilter.klx
│   │   └── ui/
│   │       ├── Button.klx
│   │       └── Input.klx
│   ├── composables/
│   │   └── useTodos.ts
│   ├── stores/
│   │   └── todos.ts
│   └── types/
│       └── todo.ts
```

## Type Definitions

```typescript
// src/types/todo.ts
export interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: Date
  sortOrder: number
}

export type TodoFilter = 'all' | 'active' | 'completed'
```

## Store Implementation

```typescript
// src/stores/todos.ts
import { defineStore } from '@kalxjs/state'

export const useTodoStore = defineStore('todos', {
  state: () => ({
    items: [] as Todo[],
    filter: 'all' as TodoFilter
  }),

  actions: {
    async addTodo(text: string) {
      try {
        const todo = await todoService.create({
          text,
          completed: false,
          sortOrder: this.items.length
        })
        this.items.push(todo)
      } catch (error) {
        errorHandler.capture(error)
        throw error
      }
    }
  }
})
```

## Composable Logic

```typescript
// src/composables/useTodos.ts
import { computed } from '@kalxjs/core'
import { useDraggable } from '@kalxjs/core/composition'

export function useTodos() {
  const store = useTodoStore()
  const { isDragging, start, end } = useDraggable()

  // Optimistic updates with error handling
  async function toggleTodo(id: string) {
    const todo = store.items.find(t => t.id === id)
    if (!todo) return

    const previous = { ...todo }
    todo.completed = !todo.completed

    try {
      await todoService.update(id, { completed: todo.completed })
    } catch {
      Object.assign(todo, previous)
    }
  }

  return {
    todos: computed(() => store.filteredTodos),
    isDragging,
    toggleTodo
  }
}
```

## Modern Component Example

```typescript
// src/components/todo/TodoList.klx
import { defineComponent } from '@kalxjs/core'
import { TransitionGroup } from '@kalxjs/core/animation'

export default defineComponent({
  setup() {
    const { todos, isDragging, toggleTodo } = useTodos()
    
    return () => (
      <div class="todo-app">
        <TodoForm />
        
        <TransitionGroup 
          name="todo-list"
          tag="ul"
          class={['todo-list', { 'is-dragging': isDragging }]}
        >
          {todos.value.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
            />
          ))}
        </TransitionGroup>

        <TodoFilter />
      </div>
    )
  }
})
```

## Modern Styling

```css
/* src/styles/todo.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .todo-list-move {
    transition: transform 0.3s ease;
  }

  .todo-list-enter-active,
  .todo-list-leave-active {
    transition: all 0.3s ease;
  }

  .todo-list-enter-from,
  .todo-list-leave-to {
    opacity: 0;
    transform: translateX(30px);
  }
}
```

## Advanced Features

### Persistence Layer

```typescript
// src/services/todoService.ts
import { createClient } from '@kalxjs/core/storage'

const storage = createClient({
  prefix: 'todo-app',
  storage: localStorage
})

export const todoService = {
  async getAll() {
    return storage.get<Todo[]>('todos') ?? []
  },
  
  async save(todos: Todo[]) {
    return storage.set('todos', todos)
  }
}
```

### Error Boundaries

```typescript
// src/components/ErrorBoundary.klx
import { defineComponent, ref, onErrorCaptured } from '@kalxjs/core'

export default defineComponent({
  setup(_, { slots }) {
    const error = ref<Error | null>(null)

    onErrorCaptured((err) => {
      error.value = err
      return false
    })

    return () => error.value
      ? <div class="error-screen">{error.value.message}</div>
      : slots.default?.()
  }
})
```

## Testing Example

```typescript
// src/components/__tests__/TodoList.test.js
import { render, fireEvent } from '@kalxjs/core/testing'
import TodoList from '../TodoList'

test('adds new todo', async () => {
  const { getByRole, findByText } = render(TodoList)
  
  await fireEvent.click(getByRole('button', { name: 'Add' }))
  
  expect(await findByText('New Todo')).toBeInTheDocument()
})
```

## Running the Application

Start the development server:

```bash
npm run dev
```

## Summary

Congratulations! You've built a modern Todo application with kalxjs. This app demonstrates several advanced features:

- TypeScript support
- Component-based architecture
- Centralized state management
- Reactive updates
- Event handling
- Computed properties
- Conditional rendering
- Drag-and-drop functionality
- Animations and transitions
- Persistence layer
- Error handling

## Next Steps

- Add user accounts and backend synchronization
- Implement advanced testing strategies
- Explore server-side rendering (SSR) with kalxjs
- Add more complex animations and interactions

Feel free to enhance this application with additional features as you continue learning kalxjs.