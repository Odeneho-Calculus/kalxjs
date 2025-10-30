# KalxJS CLI Quick Start

Get up and running with KalxJS CLI in 5 minutes. This guide covers the essentials for creating a project and generating code.

## Prerequisites

- Node.js 14.0.0 or higher
- npm, yarn, or pnpm

Check your version:
```bash
node --version
npm --version
```

---

## Step 1: Install the CLI (30 seconds)

```bash
npm install -g @kalxjs/cli
```

Verify installation:
```bash
kalxjs --version
# Output: 2.0.31 (or higher)
```

---

## Step 2: Create Your First Project (2 minutes)

```bash
kalxjs create my-awesome-app
cd my-awesome-app
```

This creates:
```
my-awesome-app/
├── src/
│   ├── components/
│   ├── assets/
│   ├── main.js
│   └── App.js
├── public/
├── package.json
├── index.html
└── README.md
```

---

## Step 3: Install Dependencies (1 minute)

The CLI usually handles this automatically. If not:

```bash
npm install
```

---

## Step 4: Start Development Server (1 minute)

```bash
npm run dev
# or
kalxjs serve
```

Output:
```
KALXJS ╔═════════════════════════╗
       ║  Vite server running at ║
       ║   http://localhost:3000  ║
       ╚═════════════════════════╝
```

Visit `http://localhost:3000` in your browser. 🚀

---

## Step 5: Generate Your First Component (1 minute)

In a new terminal (keep dev server running):

```bash
kalxjs generate component Button
# or shorter:
kalxjs g c Button
```

This creates `src/components/Button.js`:
```javascript
<template>
  <div class="button">
    <button @click="handleClick">Click me</button>
  </div>
</template>

<script>
export default {
  name: 'Button',
  data() {
    return {
      count: 0
    };
  },
  methods: {
    handleClick() {
      this.count++;
      console.log('Clicked!', this.count);
    }
  }
};
</script>
```

---

## Common Commands Cheat Sheet

### Project Commands
```bash
# Create new project
kalxjs create my-app

# Create with specific features
kalxjs create my-app --router --state

# Create with all features
kalxjs create my-app --router --state --testing --scss --linting

# Skip installation
kalxjs create my-app --skip-install

# Skip prompts (use defaults)
kalxjs create my-app --skip-prompts
```

### Generation Commands
```bash
# Component
kalxjs g c Button                    # Basic
kalxjs g c Button --style scss       # With SCSS
kalxjs g c Button --test             # With test file
kalxjs g c Button --composition      # Composition API

# Route (page + view)
kalxjs g r about                     # Creates /src/pages/about.js
kalxjs g r dashboard --composition   # Composition API route

# Store (state management)
kalxjs g s user                      # Creates store
kalxjs g s user --persist            # With localStorage persistence

# Page (combined route + view + store)
kalxjs g p products                  # Creates full page setup
```

### Development Commands
```bash
# Start dev server
kalxjs serve
kalxjs serve --port 8080             # Custom port
kalxjs serve --open                  # Auto-open browser
kalxjs serve --https                 # Enable HTTPS

# Build for production
kalxjs build
kalxjs build --analyze               # Analyze bundle size
kalxjs build --output dist           # Custom output dir
kalxjs build --no-minify             # Keep human-readable
```

### Other Commands
```bash
# Show version
kalxjs --version
kalxjs version

# Show help
kalxjs --help
kalxjs create --help                 # Help for specific command
```

---

## Workflow Examples

### Example 1: Simple App with Button Component

```bash
# Step 1: Create project
kalxjs create button-demo --skip-install
cd button-demo

# Step 2: Install
npm install

# Step 3: Start dev server
npm run dev

# Step 4: Generate button component
kalxjs g c Button --style css --test

# Step 5: Use component in App.js
# Open App.js and import:
# import Button from './components/Button.js'
```

### Example 2: App with Router and State

```bash
# Create with router and state
kalxjs create my-dashboard --router --state

# Navigate to project
cd my-dashboard && npm install

# Generate components
kalxjs g c Header --style scss
kalxjs g c Sidebar --style scss
kalxjs g c Dashboard --composition

# Generate store
kalxjs g s dashboard

# Start dev
npm run dev
```

### Example 3: Full Page Generation

```bash
# Create base project
kalxjs create my-app

# Generate full page (route + view + store)
kalxjs g p products --composition --test

# This creates:
# - src/pages/products.js (route definition)
# - src/views/ProductsView.js (view component)
# - src/stores/products.js (store module)
```

---

## Understanding Generated Components

### Options API (Default)
```javascript
<template>
  <div class="my-component">
    <p>{{ message }}</p>
    <button @click="greet">Say Hello</button>
  </div>
</template>

<script>
export default {
  name: 'MyComponent',
  data() {
    return {
      message: 'Hello, World!'
    };
  },
  methods: {
    greet() {
      alert(this.message);
    }
  }
};
</script>
```

### Composition API (`--composition` flag)
```javascript
<template>
  <div class="my-component">
    <p>{{ message }}</p>
    <button @click="greet">Say Hello</button>
  </div>
</template>

<script>
import { ref } from '@kalxjs/core';

export default {
  name: 'MyComponent',
  setup() {
    const message = ref('Hello, World!');

    const greet = () => {
      alert(message.value);
    };

    return { message, greet };
  }
};
</script>
```

---

## Testing Your Generation

### Component with Test File

```bash
# Generate component with test
kalxjs g c Counter --test

# This creates:
# src/components/Counter.js (component)
# src/components/__tests__/Counter.test.js (test)

# Run tests
npm test
```

### Test File Structure
```javascript
import { describe, it, expect } from '@jest/globals';
import Counter from '../Counter.js';

describe('Counter', () => {
  it('renders counter component', () => {
    const wrapper = mount(Counter);
    expect(wrapper.exists()).toBe(true);
  });

  it('increments counter on click', async () => {
    const wrapper = mount(Counter);
    await wrapper.find('button').trigger('click');
    expect(wrapper.vm.count).toBe(1);
  });
});
```

---

## Adding Styles

### CSS
```bash
kalxjs g c Card --style css
```

Creates:
- `src/components/Card.js`
- `src/styles/components/Card.css`

### SCSS
```bash
kalxjs g c Card --style scss
```

Creates:
- `src/components/Card.js`
- `src/styles/components/Card.scss`

---

## Build for Production

```bash
# Build optimized bundle
kalxjs build

# This creates dist/ directory with:
# - index.html (optimized)
# - Minified JavaScript
# - Optimized CSS
# - Source maps (optional)

# Check bundle size
kalxjs build --analyze
```

---

## Next Steps

1. **Learn More Commands**: Read [Commands Reference](./COMMANDS.md)
2. **Advanced Generation**: See [Code Generation Guide](./GENERATION.md)
3. **Project Setup**: Explore [Project Structure](./PROJECT_STRUCTURE.md)
4. **Advanced Features**: Check [Advanced Usage](./ADVANCED_USAGE.md)
5. **Troubleshooting**: Visit [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

## Tips & Tricks

### Faster Component Generation Using Aliases
```bash
# All of these are equivalent:
kalxjs component Button
kalxjs c Button

# All of these are equivalent:
kalxjs generate component Button
kalxjs g c Button
```

### Combining Flags
```bash
# Multiple options together
kalxjs g c Button --style scss --test --props --state

# Works with routes
kalxjs g r about --composition --test

# Works with stores
kalxjs g s user --persist
```

### Batch Generation
```bash
# Generate multiple components
kalxjs g c Button
kalxjs g c Input
kalxjs g c Modal
kalxjs g c Dialog
```

### Custom Port for Dev Server
```bash
# If 3000 is busy
kalxjs serve --port 8080

# Auto-open in browser
kalxjs serve --port 8080 --open

# HTTPS + Custom port
kalxjs serve --https --port 3443
```

---

## Common Errors & Quick Fixes

### "Command not found: kalxjs"
```bash
# Reinstall globally
npm install -g @kalxjs/cli

# Or use with npx
npx kalxjs --version
```

### "Permission denied"
```bash
# Use npm with sudo (or configure npm prefix)
sudo npm install -g @kalxjs/cli

# Better: configure npm prefix
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### "Port already in use"
```bash
# Use different port
kalxjs serve --port 8080

# CLI auto-detects, so just run:
kalxjs serve
```

---

## Getting Help

```bash
# General help
kalxjs --help

# Command-specific help
kalxjs create --help
kalxjs generate --help
kalxjs serve --help
```

---

You're ready to build amazing KalxJS applications! 🎉