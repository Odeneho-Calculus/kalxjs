# kalxjs/docs/tutorials/getting-started.md

# Getting Started with kalxjs

This tutorial will guide you through setting up your first kalxjs application. We'll cover installation, project initialization, and building a simple "Hello World" application.

## Prerequisites

Before starting, ensure you have the following installed:
- Node.js (version 14.x or higher)
- npm (version 7.x or higher) or yarn

## Installation

You can install kalxjs using npm or yarn:

```bash
# Using npm
npm install kalxjs

# Using yarn
yarn add kalxjs
```

Alternatively, you can use the kalxjs CLI to create a new project:

```bash
# Install the CLI globally
npm install -g kalxjs-cli

# Create a new project
kalxjs create my-app
```

## Project Structure

A basic kalxjs project has the following structure:

```
my-app/
├── node_modules/
├── public/
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── components/
│   │   └── App.js
│   ├── main.js
│   └── style.css
├── package.json
└── README.md
```

## Creating Your First Component

Let's create a simple component in a file called `HelloWorld.js`:

```javascript
import { defineComponent, h } from 'kalxjs';

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
import kalxjs from 'kalxjs';
import HelloWorld from './components/HelloWorld';

const app = kalxjs.createApp({
  data() {
    return {
      title: 'My First kalxjs App'
    };
  },
  
  render() {
    return h('div', { class: 'app' }, [
      h('header', {}, this.title),
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

## Next Steps

Now that you've created your first kalxjs application, you might want to:

- Learn about [reactivity in kalxjs](./reactivity.md)
- Explore [component lifecycle hooks](./component-lifecycle.md)
- Build a [Todo List application](./todo-app.md)

Congratulations! You've built your first kalxjs application.