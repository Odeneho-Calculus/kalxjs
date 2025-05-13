# Getting Started with kalxjs

Learn how to build modern web applications with kalxjs v2.1.14.

## Prerequisites
- Node.js 16.x or later (Node.js 18+ recommended)
- npm 7.x or later (npm 9+ recommended)
- Basic JavaScript/TypeScript knowledge

## Project Setup

```bash
# Create new project with Vite
npm create kalx@latest my-app

# Select features
✔ Add TypeScript? Yes
✔ Add JSX Support? Yes
✔ Add Router? Yes
✔ Add State Management? Yes
✔ Add Testing? Yes
✔ Add ESLint? Yes
✔ Add Prettier? Yes
✔ Add PWA Support? Yes
✔ Add Cypress E2E? Yes
✔ Add Tailwind CSS? Yes
```

## Development Tools

- VS Code Extension with IntelliSense
- Chrome/Firefox DevTools Extension
- Performance Monitoring & Profiling
- State Inspector with Time Travel
- Component Explorer & Playground
- Hot Module Replacement (HMR)
- Fast Refresh Support
- API Mocking Integration

## Project Structure

A modern kalxjs project follows this structure:

```
my-app/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── common/    # Shared components
│   │   └── features/  # Feature-specific components
│   ├── composables/   # Shared composition functions
│   ├── layouts/       # Page layouts
│   ├── pages/         # Route pages
│   ├── router/        # Routing configuration
│   ├── store/         # State management
│   │   ├── modules/   # Store modules
│   │   └── plugins/   # Store plugins
│   ├── styles/        # Global styles and themes
│   ├── types/         # TypeScript declarations
│   └── utils/         # Helper functions
├── public/            # Static assets
├── tests/             # Test files
│   ├── e2e/          # End-to-end tests
│   └── unit/         # Unit tests
└── vite.config.ts    # Build configuration
```

## Creating Your First Component

Let's create a simple component in a file called `HelloWorld.js`:

```javascript
import { defineComponent, h } from '@kalxjs/core';

export default defineComponent({
  props: {
    message: {
      type: String,
      default: 'Hello World!'
    }
  },
  
  render() {
    return h('div', { class: 'hello' }, [
      h('h1', {}, this.message)
    ]);
  }
});
```

## Using the Component

Now we can use our component in the main application:

```javascript
// src/main.js
import { createApp, h, ref } from '@kalxjs/core';
import HelloWorld from './components/HelloWorld';

const app = createApp({
  setup() {
    const title = ref('My First kalxjs App');
    
    return {
      title
    };
  },
  
  render() {
    return h('div', { class: 'app' }, [
      h('header', {}, this.title.value),
      h(HelloWorld, { message: 'Welcome to kalxjs!' })
    ]);
  }
});

app.mount('#app');
```

Make sure you have a root element with the ID "app" in your HTML:

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My kalxjs App</title>
</head>
<body>
  <div id="app"></div>
  <script src="./src/main.js" type="module"></script>
</body>
</html>
```

## Running Your Application

To run your application:

1. If you're using the CLI:
   ```bash
   npm run dev
   ```

2. Or set up a development server using a bundler like Vite or Webpack.

## Using AI Features

KalxJS v2.1.14 includes built-in AI capabilities. Here's how to use them:

```javascript
import { createApp, ref } from '@kalxjs/core';
import { useAI } from '@kalxjs/core/ai';

const app = createApp({
  setup() {
    // Initialize AI with your API key
    const ai = useAI({
      apiKeys: {
        openai: 'your-api-key'
      }
    });
    
    const prompt = ref('');
    const result = ref('');
    
    async function generateText() {
      result.value = await ai.generateText({
        prompt: prompt.value,
        model: 'gpt-3.5-turbo'
      });
    }
    
    return {
      prompt,
      result,
      generateText
    };
  }
});

app.mount('#app');
```

## Using the Custom Renderer

KalxJS v2.1.14 provides a custom rendering system for improved performance:

```javascript
import { createRouter } from '@kalxjs/router';
import { createStore } from '@kalxjs/state';
import { createCustomRenderer } from '@kalxjs/core/renderer';

// Create router
const router = createRouter({
  mode: 'hash',
  routes: [
    { path: '/', component: 'home' },
    { path: '/counter', component: 'counter' }
  ]
});

// Create store
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

// Create and initialize the custom renderer
const renderer = createCustomRenderer(router, store);
renderer.init('#app');
```

## Next Steps
- Explore [Component Composition](../guides/composition-api.md)
- Learn about [State Management](../guides/state-management.md)
- Understand [Performance Optimization](../guides/performance.md)
- Try out [API Integration](../guides/api-integration.md)
- Experiment with [Custom Renderers](../guides/custom-renderer.md)

Congratulations! You've built your first kalxjs application.