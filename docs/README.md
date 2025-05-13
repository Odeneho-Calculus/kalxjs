<!-- kalxjs/docs/README.md -->
# kalxjs Documentation

Welcome to the kalxjs documentation. Here you'll find everything you need to know about building applications with kalxjs v2.1.14, a modern JavaScript framework for building user interfaces with exceptional performance, developer experience, and scalability.

## Contents

- [API Reference](./api/README.md) - Detailed API documentation for all kalxjs modules
- [Guides](./guides/README.md) - Step-by-step guides for common tasks
- [Tutorials](./tutorials/README.md) - Practical tutorials to help you learn kalxjs

## Getting Started

If you're new to kalxjs, we recommend starting with our [Introduction Guide](./guides/introduction.md) and then working through the [Getting Started Tutorial](./tutorials/getting-started.md).

## Core Concepts

kalxjs is built around several core concepts:

### Reactivity

The reactivity system automatically updates the UI when the underlying data changes. kalxjs uses a fine-grained reactivity system with functions like `ref()`, `reactive()`, and `computed()` to make your data reactive.

```javascript
import { ref } from '@kalxjs/core'

const count = ref(0)
// When count.value changes, the UI automatically updates
```

### Single File Components

kalxjs uses .klx files for single file components, combining template, script, and style in one file:

```klx
<template>
  <div>{{ message }}</div>
</template>

<script>
import { ref } from '@kalxjs/core'

export default {
  setup() {
    const message = ref('Hello kalxjs!')
    return { message }
  }
}
</script>

<style>
div {
  color: blue;
}
</style>
```

### Composition API

The Composition API provides a way to organize component logic by feature rather than by options. It uses the `setup()` function to expose reactive state and functions to the template.

```javascript
import { ref, computed } from '@kalxjs/core'

export default {
  setup() {
    const count = ref(0)
    const doubleCount = computed(() => count.value * 2)
    
    function increment() {
      count.value++
    }
    
    return {
      count,
      doubleCount,
      increment
    }
  }
}
```

### Virtual DOM

kalxjs uses a virtual DOM to optimize rendering performance. Instead of directly manipulating the browser's DOM for every change, kalxjs creates a lightweight copy of the DOM in memory and efficiently updates only what has changed.

### Routing

The routing system enables navigation in single-page applications without page reloads:

```javascript
import { createRouter } from '@kalxjs/router'

const router = createRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
})
```

### State Management

For larger applications, kalxjs provides a centralized state management solution:

```javascript
import { createStore } from '@kalxjs/state'

const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++
    }
  }
})
```

### AI Capabilities

KalxJS includes powerful AI capabilities for text generation, sentiment analysis, and entity extraction:

```javascript
import { useAI } from '@kalxjs/core/ai'

export default {
  setup() {
    const ai = useAI({
      apiKeys: {
        openai: 'your-api-key'
      }
    })
    
    const prompt = ref('')
    const result = ref('')
    
    async function generateText() {
      result.value = await ai.generateText({
        prompt: prompt.value,
        model: 'gpt-3.5-turbo'
      })
    }
    
    // Additional AI capabilities
    async function analyzeSentiment(text) {
      return ai.analyzeSentiment(text);
    }
    
    async function extractEntities(text) {
      return ai.extractEntities(text);
    }
    
    async function summarizeText(text) {
      return ai.summarize(text, { maxLength: 100 });
    }
    
    return {
      prompt,
      result,
      generateText,
      analyzeSentiment,
      extractEntities,
      summarizeText
    }
  }
}
```

### Custom Rendering System

KalxJS provides a template-based rendering system with native DOM APIs for improved reliability and performance:

```javascript
import { createRouter } from '@kalxjs/router'
import { createStore } from '@kalxjs/state'
import { createCustomRenderer } from '@kalxjs/core/renderer'

// Create router
const router = createRouter({
  mode: 'hash',
  routes: [
    { path: '/', component: 'home' },
    { path: '/counter', component: 'counter' }
  ]
})

// Create store
const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++
    }
  }
})

// Create and initialize the custom renderer
const renderer = createCustomRenderer(router, store)
renderer.init('#app')
```

The Custom Renderer works by:
1. Using HTML templates directly from your project
2. Binding data from your store to the DOM
3. Setting up event listeners for user interactions
4. Updating the DOM when state changes

This approach can provide better performance in certain scenarios and offers a more direct way to work with the DOM.

Understanding these core concepts will help you make the most of kalxjs in your applications.