# Getting Started with KALXJS

Welcome to KALXJS! This guide will help you create your first KALXJS application.

## Prerequisites

- Node.js 14+ installed
- Basic JavaScript knowledge
- Familiarity with modern frontend concepts

## Quick Start

### 1. Create a New Project

```bash
# Using npm
npx @kalxjs/cli create my-app

# Or install CLI globally
npm install -g @kalxjs/cli
kalxjs create my-app
```

### 2. Choose Your Template

Select from multiple project templates:
- **SPA** - Single Page Application
- **SSR** - Server-Side Rendering
- **PWA** - Progressive Web App
- **SSG** - Static Site Generator

### 3. Start Development

```bash
cd my-app
npm run dev
```

Your app will be running at `http://localhost:3000`

## Your First Component

Create a file `src/components/Counter.klx`:

```vue
<template>
  <div class="counter">
    <h2>{{ count }}</h2>
    <button @click="increment">Increment</button>
  </div>
</template>

<script>
import { ref } from '@kalxjs/core';

export default {
  setup() {
    const count = ref(0);

    const increment = () => {
      count.value++;
    };

    return {
      count,
      increment,
    };
  },
};
</script>

<style scoped>
.counter {
  text-align: center;
  padding: 2rem;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
}
</style>
```

## Core Concepts

### Reactivity

KALXJS uses a powerful reactivity system based on Proxies and Signals.

```javascript
import { ref, reactive, computed } from '@kalxjs/core';

// Ref for primitives
const count = ref(0);
console.log(count.value); // Access with .value

// Reactive for objects
const user = reactive({
  name: 'John',
  age: 30,
});

// Computed values
const double = computed(() => count.value * 2);
```

### Components

Components are the building blocks of KALXJS apps.

```javascript
// Counter.js
export default {
  name: 'Counter',
  props: {
    initial: Number,
  },
  setup(props) {
    const count = ref(props.initial || 0);
    return { count };
  },
};
```

### Template Syntax

KALXJS uses an intuitive template syntax:

```vue
<!-- Text interpolation -->
<p>{{ message }}</p>

<!-- Attribute binding -->
<img :src="imageUrl" :alt="imageAlt" />

<!-- Event handling -->
<button @click="handleClick">Click me</button>

<!-- Conditional rendering -->
<p v-if="show">Visible</p>
<p v-else>Hidden</p>

<!-- List rendering -->
<ul>
  <li v-for="item in items" :key="item.id">
    {{ item.name }}
  </li>
</ul>
```

## Routing

Add routing to your application:

```javascript
// router/index.js
import { createRouter } from '@kalxjs/router';
import Home from '../views/Home.klx';
import About from '../views/About.klx';

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
];

export const router = createRouter({
  routes,
});
```

## State Management

Use stores for global state:

```javascript
// store/user.js
import { defineStore } from '@kalxjs/store';

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    email: '',
  }),
  actions: {
    setUser(user) {
      this.name = user.name;
      this.email = user.email;
    },
  },
});
```

## Next Steps

- [Core Concepts](./core-concepts.md) - Learn about reactivity and components
- [Template Syntax](./template-syntax.md) - Master the template language
- [Component Guide](./components.md) - Build reusable components
- [Router Guide](./routing.md) - Add navigation to your app
- [State Management](./state-management.md) - Manage global state

## Resources

- [API Reference](./api/index.md)
- [Examples](../examples/)
- [Community Discord](https://discord.gg/kalxjs)
- [GitHub](https://github.com/kalxjs/kalxjs)