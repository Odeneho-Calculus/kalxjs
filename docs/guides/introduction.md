<!-- kalxjs/docs/guides/introduction.md -->
# Introduction to kalxjs v2.1.14

kalxjs is a progressive JavaScript framework designed for building modern web interfaces with focus on performance and developer experience.

## Core Concepts

### Reactivity System
The foundation of kalxjs is its fine-grained reactivity system:

```javascript
import { ref, computed } from '@kalxjs/core'

const count = ref(0)
const doubled = computed(() => count.value * 2)

// Automatically tracks dependencies and updates
watchEffect(() => {
  console.log(`Count is: ${count.value}, doubled is: ${doubled.value}`)
})
```

### Component Architecture
Components are the building blocks of kalxjs applications:

```javascript
import { defineComponent, ref } from '@kalxjs/core'

export default defineComponent({
  props: {
    message: String
  },
  setup(props) {
    const count = ref(0)
    return { count }
  }
})
```

### Virtual DOM

kalxjs uses a virtual DOM to optimize rendering performance. Instead of directly manipulating the browser's DOM for every change, kalxjs creates a lightweight copy of the DOM in memory. It then efficiently compares the virtual DOM with the actual DOM and makes only the minimum changes needed.

### State Management

For larger applications, kalxjs provides a centralized state management solution inspired by Flux architecture. This makes it easier to manage shared state across components.

```javascript
import { createStore } from '@kalxjs/state';

const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++;
    }
  }
});
```

### Routing

kalxjs includes a powerful routing system for creating single-page applications with dynamic navigation.

```javascript
import { createRouter } from '@kalxjs/router';

const router = createRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/user/:id', component: User }
  ]
});
```

## Modern Features

- Server Components
- Suspense Boundaries
- Error Boundaries
- Automatic Batching
- Concurrent Rendering
- Static Site Generation

## Philosophy

kalxjs is built with the following principles in mind:

1. **Simplicity**: We strive to create an API that's easy to learn and use.
2. **Performance**: kalxjs is optimized for speed and efficiency.
3. **Flexibility**: The framework can be used for simple websites or complex applications.
4. **Progressive**: You can adopt kalxjs incrementally, starting with just the core and adding features as needed.

## Next Steps

Now that you have a basic understanding of kalxjs, check out the [Quick Start Tutorial](../tutorials/quick-start.md) to build your first kalxjs application.