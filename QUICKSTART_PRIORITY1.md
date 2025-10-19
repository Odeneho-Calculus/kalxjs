# Quick Start Guide - Priority 1 Features
## Get Started with KALXJS's New Features in 5 Minutes

---

## 🚀 1. Signals-Based Reactivity

**The fastest way to create reactive state:**

```javascript
import { signal, computed, effect } from '@kalxjs/core';

// Create signals
const count = signal(0);
const doubled = computed(() => count() * 2);

// Auto-tracking
effect(() => {
    console.log(`Count: ${count()}, Doubled: ${doubled()}`);
});

// Update
count.set(5); // Logs: "Count: 5, Doubled: 10"
```

**When to use:** High-frequency updates, fine-grained control

---

## 💫 2. Suspense for Async Components

**Handle loading states automatically:**

```javascript
import { Suspense, h } from '@kalxjs/core';

const MyApp = {
    setup() {
        return () => h(Suspense, {
            fallback: h('div', {}, 'Loading...')
        }, {
            default: () => h(AsyncComponent)
        });
    }
};
```

**When to use:** Async data fetching, code splitting, lazy loading

---

## 🎯 3. Teleport for Modals

**Render anywhere in the DOM:**

```javascript
import { Teleport, h, ref } from '@kalxjs/core';

const Modal = {
    setup() {
        const isOpen = ref(false);

        return () => h('div', {}, [
            h('button', {
                onClick: () => isOpen.value = true
            }, 'Open Modal'),

            isOpen.value && h(Teleport, { to: 'body' }, {
                default: () => h('div', { class: 'modal' }, [
                    h('h2', {}, 'Modal Title'),
                    h('button', {
                        onClick: () => isOpen.value = false
                    }, 'Close')
                ])
            })
        ]);
    }
};
```

**When to use:** Modals, tooltips, notifications, dropdowns

---

## 🛡️ 4. Error Boundaries

**Catch errors and prevent crashes:**

```javascript
import { ErrorBoundary, h } from '@kalxjs/core';

const SafeApp = {
    setup() {
        return () => h(ErrorBoundary, {
            fallback: ({ error, reset }) => h('div', {}, [
                h('h2', {}, 'Something went wrong'),
                h('p', {}, error.message),
                h('button', { onClick: reset }, 'Try Again')
            ])
        }, {
            default: () => h(App)
        });
    }
};
```

**When to use:** Production apps, third-party integrations

---

## 📦 5. Fragment for Multiple Roots

**No wrapper div needed:**

```javascript
import { Fragment, h } from '@kalxjs/core';

const MyComponent = {
    setup() {
        return () => h(Fragment, null, [
            h('header', {}, 'Header'),
            h('main', {}, 'Content'),
            h('footer', {}, 'Footer')
        ]);
    }
};
```

**When to use:** Lists, layouts, clean DOM structure

---

## 🌊 6. Streaming SSR

**Faster page loads:**

```javascript
import { createStreamRenderer } from '@kalxjs/core/ssr';

const stream = createStreamRenderer(app, {
    bootstrapScripts: ['/client.js'],
    onShellReady() {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/html');
        stream.pipe(response);
    }
});
```

**When to use:** Server-side rendering, SEO, performance

---

## 🎨 7. Template Directives (in .klx files)

### v-model (Two-Way Binding)
```html
<input v-model="message" />
<input v-model.number="age" type="number" />
<input v-model.trim="username" />
```

### v-if / v-else-if / v-else
```html
<div v-if="score >= 90">Excellent</div>
<div v-else-if="score >= 70">Good</div>
<div v-else>Keep trying</div>
```

### v-for (List Rendering)
```html
<div v-for="item in items" :key="item.id">
    {{ item.name }}
</div>
```

### v-show (Toggle Display)
```html
<div v-show="isVisible">
    This content is toggled
</div>
```

### v-slot (Named Slots)
```html
<Card>
    <template #header>
        <h1>Title</h1>
    </template>
    <template #default>
        Content
    </template>
</Card>
```

---

## 🏗️ Complete Example: Todo App

```javascript
import {
    signal,
    computed,
    batch,
    ErrorBoundary,
    Fragment,
    h
} from '@kalxjs/core';

const TodoApp = {
    setup() {
        // State with Signals
        const todos = signal([]);
        const newTodo = signal('');
        const filter = signal('all');

        // Computed
        const filteredTodos = computed(() => {
            const all = todos();
            if (filter() === 'active') {
                return all.filter(t => !t.done);
            }
            if (filter() === 'completed') {
                return all.filter(t => t.done);
            }
            return all;
        });

        // Actions
        const addTodo = () => {
            if (newTodo().trim()) {
                batch(() => {
                    todos.set([...todos(), {
                        id: Date.now(),
                        text: newTodo(),
                        done: false
                    }]);
                    newTodo.set('');
                });
            }
        };

        const toggleTodo = (id) => {
            todos.set(todos().map(t =>
                t.id === id ? { ...t, done: !t.done } : t
            ));
        };

        const removeTodo = (id) => {
            todos.set(todos().filter(t => t.id !== id));
        };

        // Render
        return () => h(ErrorBoundary, {
            fallback: ({ error }) => h('div', {}, `Error: ${error.message}`)
        }, {
            default: () => h('div', { class: 'todo-app' }, [
                // Input
                h('div', { class: 'input-section' }, [
                    h('input', {
                        value: newTodo(),
                        onInput: (e) => newTodo.set(e.target.value),
                        onKeyup: (e) => e.key === 'Enter' && addTodo(),
                        placeholder: 'Add todo...'
                    }),
                    h('button', { onClick: addTodo }, 'Add')
                ]),

                // Filters
                h('div', { class: 'filters' }, [
                    ['all', 'active', 'completed'].map(f =>
                        h('button', {
                            onClick: () => filter.set(f),
                            class: filter() === f ? 'active' : ''
                        }, f)
                    )
                ]),

                // List
                h('div', { class: 'todo-list' },
                    filteredTodos().map(todo =>
                        h(Fragment, { key: todo.id }, [
                            h('div', { class: 'todo-item' }, [
                                h('input', {
                                    type: 'checkbox',
                                    checked: todo.done,
                                    onChange: () => toggleTodo(todo.id)
                                }),
                                h('span', {
                                    style: {
                                        textDecoration: todo.done ? 'line-through' : 'none'
                                    }
                                }, todo.text),
                                h('button', {
                                    onClick: () => removeTodo(todo.id)
                                }, 'Delete')
                            ])
                        ])
                    )
                ),

                // Stats
                h('div', { class: 'stats' },
                    `Total: ${todos().length}, ` +
                    `Active: ${todos().filter(t => !t.done).length}`
                )
            ])
        });
    }
};

export default TodoApp;
```

---

## 📁 Project Structure

```
my-kalxjs-app/
├── src/
│   ├── App.klx              # Main app (with directives)
│   ├── components/
│   │   ├── TodoList.klx     # Component with v-for
│   │   ├── Modal.js         # Component with Teleport
│   │   └── AsyncData.js     # Component with Suspense
│   ├── stores/
│   │   └── todos.js         # Signals-based store
│   └── main.js              # Entry point
├── index.html
└── package.json
```

---

## 🎯 Best Practices

### 1. **Choose the Right Reactivity**

```javascript
// Use Signals for high-frequency updates
const mouseX = signal(0);
const mouseY = signal(0);

// Use reactive() for complex objects
const form = reactive({
    name: '',
    email: '',
    address: {
        street: '',
        city: ''
    }
});
```

### 2. **Batch Updates**

```javascript
// ❌ Bad: Multiple updates
count.set(1);
name.set('John');
active.set(true);

// ✅ Good: Batched updates
batch(() => {
    count.set(1);
    name.set('John');
    active.set(true);
});
```

### 3. **Error Boundaries Placement**

```javascript
// ✅ Good: Isolate critical sections
<ErrorBoundary>
    <CriticalFeature />
</ErrorBoundary>

<ErrorBoundary>
    <ThirdPartyWidget />
</ErrorBoundary>
```

### 4. **Suspense with ErrorBoundary**

```javascript
// ✅ Best: Combine for robust async handling
<ErrorBoundary fallback={<ErrorDisplay />}>
    <Suspense fallback={<Loading />}>
        <AsyncComponent />
    </Suspense>
</ErrorBoundary>
```

### 5. **Keys in v-for**

```html
<!-- ✅ Good: Always use keys -->
<div v-for="item in items" :key="item.id">
    {{ item.name }}
</div>

<!-- ❌ Bad: No keys -->
<div v-for="item in items">
    {{ item.name }}
</div>
```

---

## 🚨 Common Pitfalls

### 1. **Forgetting to call signals**
```javascript
// ❌ Wrong
console.log(count); // Signal object

// ✅ Correct
console.log(count()); // Value
```

### 2. **Not tracking in effects**
```javascript
// ❌ Wrong: Won't track
effect(() => {
    const c = count;
    console.log(c());
});

// ✅ Correct: Tracks properly
effect(() => {
    console.log(count());
});
```

### 3. **Teleport target not found**
```javascript
// ❌ Wrong: Target might not exist
<Teleport to="#modal">

// ✅ Correct: Check or use body
<Teleport to="body">
```

---

## 📚 Learn More

- **Full Documentation:** `/PRIORITY_1_IMPLEMENTATION.md`
- **Examples:** `/examples/priority-1-features/`
- **Status:** `/IMPLEMENTATION_STATUS.md`
- **Roadmap:** `/UPDATE_PLAN.md`

---

## 🎉 You're Ready!

Start building with Priority 1 features:

```bash
# Run examples
node examples/priority-1-features/signals-demo.js

# Start dev server
npm run dev

# Build your app
npm run build
```

**Happy coding with KALXJS!** 🚀