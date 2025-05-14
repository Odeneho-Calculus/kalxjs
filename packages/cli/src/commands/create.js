const fs = require('fs-extra');
const path = require('path');
const validateProjectName = require('validate-npm-package-name');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const deepmerge = require('deepmerge');
const execa = require('execa');

/**
 * Creates a new KalxJS project
 * @param {string} projectName - Name of the project
 * @param {Object} options - Configuration options
 */
async function create(projectName, options = {}) {
  // Validate project name
  const result = validateProjectName(projectName);
  if (!result.validForNewPackages) {
    console.error(chalk.red(`Invalid project name: "${projectName}"`));
    result.errors && result.errors.forEach(err => {
      console.error(chalk.red.dim('Error: ' + err));
    });
    result.warnings && result.warnings.forEach(warn => {
      console.error(chalk.yellow.dim('Warning: ' + warn));
    });
    process.exit(1);
  }

  const cwd = options.cwd || process.cwd();
  const targetDir = path.resolve(cwd, projectName);

  if (fs.existsSync(targetDir)) {
    console.error(chalk.red(`Directory ${projectName} already exists.`));
    process.exit(1);
  }

  const spinner = ora(`Creating project in ${chalk.cyan(targetDir)}...`).start();

  try {
    // Create project directory
    await fs.ensureDir(targetDir);

    // Stop spinner during prompts
    spinner.stop();

    // Get feature flags
    const promptAnswers = options.skipPrompts ? {
      router: options.router || true,
      state: options.state || true,
      scss: options.scss || true,
      testing: options.testing || true,
      linting: options.linting || true,
      sfc: true,
      api: true,
      composition: true,
      performance: true,
      plugins: true,
      customRenderer: true  // Always enabled by default
    } : await inquirer.prompt([
      {
        type: 'confirm',
        name: 'router',
        message: 'Add Router support?',
        default: true
      },
      {
        type: 'confirm',
        name: 'state',
        message: 'Add State Management?',
        default: true
      },
      {
        type: 'confirm',
        name: 'scss',
        message: 'Add SCSS support?',
        default: true
      },
      {
        type: 'confirm',
        name: 'sfc',
        message: 'Add Single File Components support?',
        default: true
      },
      {
        type: 'confirm',
        name: 'composition',
        message: 'Add Composition API support?',
        default: true
      },
      {
        type: 'confirm',
        name: 'api',
        message: 'Add API integration utilities?',
        default: true
      },
      {
        type: 'confirm',
        name: 'performance',
        message: 'Add Performance optimization utilities?',
        default: true
      },
      {
        type: 'confirm',
        name: 'plugins',
        message: 'Add Plugin system support?',
        default: true
      },
      {
        type: 'confirm',
        name: 'testing',
        message: 'Add Testing setup?',
        default: true
      },
      {
        type: 'confirm',
        name: 'linting',
        message: 'Add ESLint setup?',
        default: true
      },
      {
        type: 'confirm',
        name: 'customRenderer',
        message: 'Add Custom Renderer support?',
        default: true
      }
    ]);

    // Create a new config object
    const projectConfig = deepmerge({
      projectName,
      features: promptAnswers
    }, options);

    spinner.start();

    // Generate project files
    await generateProject(targetDir, projectConfig);

    // Process template files
    spinner.text = 'Processing templates...';
    await processTemplates(targetDir, projectConfig);

    // Install dependencies
    if (!options.skipInstall) {
      spinner.text = 'Installing dependencies...';
      const installSuccess = await installDependencies(targetDir, projectConfig);
      
      if (!installSuccess) {
        spinner.warn('Dependencies installation failed. You will need to run npm install manually.');
      }
    }

    spinner.succeed(`Project created successfully at ${chalk.cyan(targetDir)}`);

    // Show next steps
    console.log('\n  Done. Now run:\n');
    console.log(chalk.cyan(`  cd ${projectName}`));
    if (options.skipInstall || !installSuccess) console.log(chalk.cyan('  npm install'));
    console.log(chalk.cyan('  npm run dev\n'));

  } catch (err) {
    spinner.fail('Project creation failed.');
    console.error(chalk.red(err.stack || err.message));

    // Cleanup on failure
    if (fs.existsSync(targetDir)) {
      fs.removeSync(targetDir);
    }

    process.exit(1);
  }
}

/**
 * Generates the project structure and files
 * @param {string} targetDir - Target project directory
 * @param {Object} config - Project configuration
 */
async function generateProject(targetDir, config) {
  // Create basic structure
  const dirs = [
    'src',
    'src/components',
    'src/assets',
    'public',
    config.features.router && 'src/views',
    config.features.router && 'src/router',
    config.features.state && 'src/store',
    config.features.scss && 'src/styles',
    config.features.sfc && 'src/components/sfc',
    config.features.api && 'src/api',
    config.features.composition && 'src/composables',
    config.features.performance && 'src/utils/performance',
    config.features.plugins && 'src/plugins',
    config.features.customRenderer && 'src/templates',
    config.features.customRenderer && 'src/renderer',
    config.features.customRenderer && 'src/utils'
  ].filter(Boolean);

  for (const dir of dirs) {
    await fs.ensureDir(path.join(targetDir, dir));
  }

  // Create base files
  const files = {
    'public/.gitkeep': '',
    'src/assets/.gitkeep': '',
    'src/components/.gitkeep': '',
    ...(config.features.sfc ? { 'src/components/sfc/.gitkeep': '' } : {}),
    ...(config.features.api ? { 'src/api/.gitkeep': '' } : {}),
    ...(config.features.composition ? { 'src/composables/.gitkeep': '' } : {}),
    ...(config.features.performance ? { 'src/utils/performance/.gitkeep': '' } : {}),
    ...(config.features.plugins ? { 'src/plugins/.gitkeep': '' } : {}),
    ...(config.features.customRenderer ? {
      'src/templates/.gitkeep': '',
      'src/renderer/.gitkeep': '',
      'src/utils/.gitkeep': ''
    } : {}),
  };

  // Add logo.svg file
  files['src/assets/logo.svg'] = `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" rx="40" fill="#35495E"/>
  <path d="M100 40L160 140H40L100 40Z" fill="#42B883"/>
  <path d="M100 80L130 130H70L100 80Z" fill="#35495E"/>
  <circle cx="100" cy="65" r="10" fill="white"/>
</svg>`;

  // Add plugins file if plugins feature is enabled
  if (config.features.plugins) {
    files['src/plugins/index.js'] = `// Register all plugins here
export function registerPlugins(app) {
  // Example: app.use(somePlugin)
  
  // You can also register global components
  // app.component('GlobalComponent', YourComponent)
  
  // Add global properties
  // In KalxJS, we need to use a different approach since app.config.globalProperties is not available
  // We can use app.provide to make values available to all components
  app.provide('formatDate', (date) => {
    return new Date(date).toLocaleDateString();
  });
  
  // Alternatively, we can add methods directly to the app instance
  app._context = app._context || {};
  app._context.helpers = app._context.helpers || {};
  app._context.helpers.formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };
  
  console.log('Plugins registered successfully');
}
`;
  }

  // Add router files if router feature is enabled
  if (config.features.router) {
    files['src/router/index.js'] = `import { createRouter as createKalRouter } from '@kalxjs/router';
import Home from '../views/Home.klx';
import About from '../views/About.klx';
import NotFound from '../views/NotFound.klx';
import { h, createApp } from '@kalxjs/core';

export function createRouter() {
  const router = createKalRouter({
    history: 'hash', // Use hash history instead of createHistory()
    routes: [
      {
        path: '/',
        component: Home,
        name: 'home'
      },
      {
        path: '/about',
        component: About,
        name: 'about'
      },
      {
        path: '/:pathMatch(.*)*',
        component: NotFound,
        name: 'not-found'
      }
    ]
  });

  // Custom rendering logic for router views
  router.afterEach((to, from) => {
    console.log(\`Router navigation complete: \${from.path} -> \${to.path}\`);
    
    // Get the matched component
    const matchedRoute = to.matched[0];
    if (!matchedRoute) {
      console.error('No matching route found');
      return;
    }
    
    const component = matchedRoute.component;
    if (!component) {
      console.error('No component defined for route');
      return;
    }
    
    // Get the router view container
    const routerViewContainer = document.getElementById('router-view');
    if (!routerViewContainer) {
      console.error('Router view container not found');
      return;
    }
    
    // Clear the container
    routerViewContainer.innerHTML = '';
    
    // Render the component
    try {
      console.log('Rendering component:', component.name || 'Unnamed Component');
      
      // Create a new app instance with the component
      const app = createApp(component);
      
      // Mount it to the container
      app.mount(routerViewContainer);
      
      console.log('Component rendered successfully');
    } catch (error) {
      console.error('Error rendering component:', error);
      routerViewContainer.innerHTML = \`<div class="error">Error rendering view: \${error.message}</div>\`;
    }
  });

  return router;
}
`;

    files['src/views/Home.klx'] = `<template>
  <div class="home-view">
    <h1>Home Page</h1>
    <p>Welcome to the KalxJS demo application!</p>
    
    <div class="counter-demo">
      <h2>Interactive Counter</h2>
      <div class="counter">
        <button @click="decrement">-</button>
        <span>{{ count }}</span>
        <button @click="increment">+</button>
      </div>
      <button class="reset-button" @click="resetCount">Reset</button>
    </div>
    
    <div class="navigation">
      <router-link to="/about">Go to About Page</router-link>
    </div>
  </div>
</template>

<script>
import { h } from '@kalxjs/core';

export default {
  name: 'HomeView',
  
  data() {
    return {
      count: 0
    };
  },
  
  methods: {
    increment() {
      console.log('Incrementing count');
      this.count++;
      this.$update();
    },
    
    decrement() {
      console.log('Decrementing count');
      this.count--;
      this.$update();
    },
    
    resetCount() {
      console.log('Resetting count');
      this.count = 0;
      this.$update();
    }
  },
  
  render() {
    return h('div', { class: 'home-view' }, [
      h('h1', {}, ['Home Page']),
      h('p', {}, ['Welcome to the KalxJS demo application!']),
      
      h('div', { class: 'counter-demo' }, [
        h('h2', {}, ['Interactive Counter']),
        h('div', { class: 'counter' }, [
          h('button', { onClick: this.decrement }, ['-']),
          h('span', {}, [String(this.count)]),
          h('button', { onClick: this.increment }, ['+']),
        ]),
        h('button', { class: 'reset-button', onClick: this.resetCount }, ['Reset'])
      ]),
      
      h('div', { class: 'navigation' }, [
        h('a', { href: '/about', onClick: (e) => {
          e.preventDefault();
          window.router.push('/about');
        }}, ['Go to About Page'])
      ])
    ]);
  }
};
</script>

<style>
.home-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  color: #42b883;
  margin-bottom: 1rem;
}

.counter-demo {
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.counter {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}

button {
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #3aa876;
}

.reset-button {
  background-color: #6c757d;
  margin-top: 0.5rem;
}

.reset-button:hover {
  background-color: #5a6268;
}

span {
  font-size: 2rem;
  font-weight: bold;
  min-width: 3rem;
}

.navigation {
  margin-top: 2rem;
}

.navigation a {
  color: #42b883;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border: 2px solid #42b883;
  border-radius: 4px;
  transition: all 0.2s;
}

.navigation a:hover {
  background-color: #42b883;
  color: white;
}
</style>`;

    files['src/views/About.klx'] = `<template>
  <div class="about-view">
    <h1>About KalxJS</h1>
    <div class="about-content">
      <p>KalxJS is a modern JavaScript framework for building user interfaces.</p>
      <p>It features a reactive component system, virtual DOM, and a modular architecture.</p>
      
      <h2>Key Features</h2>
      <ul class="features-list">
        <li>Virtual DOM for efficient updates</li>
        <li>Reactive data binding</li>
        <li>Component-based architecture</li>
        <li>Single-file components</li>
        <li>Built-in routing system</li>
        <li>State management</li>
      </ul>
    </div>
    
    <div class="navigation">
      <router-link to="/">Back to Home</router-link>
    </div>
  </div>
</template>

<script>
import { h } from '@kalxjs/core';

export default {
  name: 'AboutView',
  
  render() {
    return h('div', { class: 'about-view' }, [
      h('h1', {}, ['About KalxJS']),
      h('div', { class: 'about-content' }, [
        h('p', {}, ['KalxJS is a modern JavaScript framework for building user interfaces.']),
        h('p', {}, ['It features a reactive component system, virtual DOM, and a modular architecture.']),
        
        h('h2', {}, ['Key Features']),
        h('ul', { class: 'features-list' }, [
          h('li', {}, ['Virtual DOM for efficient updates']),
          h('li', {}, ['Reactive data binding']),
          h('li', {}, ['Component-based architecture']),
          h('li', {}, ['Single-file components']),
          h('li', {}, ['Built-in routing system']),
          h('li', {}, ['State management'])
        ])
      ]),
      
      h('div', { class: 'navigation' }, [
        h('a', { href: '/', onClick: (e) => {
          e.preventDefault();
          window.router.push('/');
        }}, ['Back to Home'])
      ])
    ]);
  }
};
</script>

<style>
.about-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #42b883;
  text-align: center;
  margin-bottom: 2rem;
}

.about-content {
  background-color: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #42b883;
  margin: 1.5rem 0 1rem;
}

.features-list {
  padding-left: 1.5rem;
}

.features-list li {
  margin-bottom: 0.5rem;
  position: relative;
}

.features-list li::before {
  content: "✓";
  color: #42b883;
  position: absolute;
  left: -1.2rem;
}

.navigation {
  text-align: center;
  margin-top: 2rem;
}

.navigation a {
  color: #42b883;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border: 2px solid #42b883;
  border-radius: 4px;
  transition: all 0.2s;
}

.navigation a:hover {
  background-color: #42b883;
  color: white;
}
</style>`;

    files['src/views/NotFound.klx'] = `<template>
  <div class="not-found-view">
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <div class="navigation">
      <router-link to="/">Go to Home Page</router-link>
    </div>
  </div>
</template>

<script>
import { h } from '@kalxjs/core';

export default {
  name: 'NotFoundView',
  
  render() {
    return h('div', { class: 'not-found-view' }, [
      h('h1', {}, ['404 - Page Not Found']),
      h('p', {}, ['The page you are looking for does not exist.']),
      h('div', { class: 'navigation' }, [
        h('a', { href: '/', onClick: (e) => {
          e.preventDefault();
          window.router.push('/');
        }}, ['Go to Home Page'])
      ])
    ]);
  }
};
</script>

<style>
.not-found-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.navigation {
  margin-top: 2rem;
}

.navigation a {
  color: #42b883;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border: 2px solid #42b883;
  border-radius: 4px;
  transition: all 0.2s;
}

.navigation a:hover {
  background-color: #42b883;
  color: white;
}
</style>`;
  }

  // Add state management files if state feature is enabled
  if (config.features.state) {
    files['src/store/index.js'] = `import { createStore as createKalStore } from '@kalxjs/state';

export function createStore() {
  return createKalStore({
    state: {
      count: 0,
      user: {
        name: '',
        isAuthenticated: false
      },
      todos: []
    },
    
    getters: {
      completedTodos: (state) => {
        return state.todos.filter(todo => todo.completed);
      },
      
      incompleteTodos: (state) => {
        return state.todos.filter(todo => !todo.completed);
      },
      
      todoCount: (state) => {
        return state.todos.length;
      }
    },
    
    mutations: {
      increment(state) {
        state.count++;
      },
      
      decrement(state) {
        state.count--;
      },
      
      setUser(state, user) {
        state.user = user;
      },
      
      addTodo(state, todo) {
        state.todos.push(todo);
      },
      
      removeTodo(state, id) {
        state.todos = state.todos.filter(todo => todo.id !== id);
      },
      
      toggleTodo(state, id) {
        const todo = state.todos.find(todo => todo.id === id);
        if (todo) {
          todo.completed = !todo.completed;
        }
      }
    },
    
    actions: {
      incrementAsync({ commit }) {
        setTimeout(() => {
          commit('increment');
        }, 1000);
      },
      
      login({ commit }, credentials) {
        // Simulate API call
        return new Promise((resolve) => {
          setTimeout(() => {
            const user = {
              name: credentials.username,
              isAuthenticated: true
            };
            commit('setUser', user);
            resolve(user);
          }, 1000);
        });
      },
      
      fetchTodos({ commit }) {
        // Simulate API call
        return new Promise((resolve) => {
          setTimeout(() => {
            const todos = [
              { id: 1, text: 'Learn KalxJS', completed: true },
              { id: 2, text: 'Build an app', completed: false },
              { id: 3, text: 'Deploy to production', completed: false }
            ];
            
            todos.forEach(todo => {
              commit('addTodo', todo);
            });
            
            resolve(todos);
          }, 1000);
        });
      }
    }
  });
}
`;
  }

  // Add SCSS files if SCSS feature is enabled
  if (config.features.scss) {
    files['src/styles/main.scss'] = `// Main SCSS file for the application

// Import the color module
@use "sass:color";

// Variables
$primary-color: #42b883;
$secondary-color: #35495e;
$light-color: #f8f9fa;
$dark-color: #343a40;
$border-radius: 4px;

// Global styles
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: $dark-color;
  background-color: white;
  margin: 0;
  padding: 0;
}

a {
  color: $primary-color;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

// Button styles
.btn {
  display: inline-block;
  background-color: $primary-color;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: color.adjust($primary-color, $lightness: -10%);
  }
  
  &.btn-secondary {
    background-color: $secondary-color;
    
    &:hover {
      background-color: color.adjust($secondary-color, $lightness: -10%);
    }
  }
}

// Card component
.card {
  background-color: white;
  border-radius: $border-radius;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  
  .card-title {
    margin-top: 0;
    color: $primary-color;
  }
}

// Utility classes
.text-center {
  text-align: center;
}

.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mt-3 { margin-top: 1.5rem; }
.mt-4 { margin-top: 2rem; }

.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 2rem; }

// CSS Variables for theming
:root {
  --primary-color: #{$primary-color};
  --secondary-color: #{$secondary-color};
  --light-color: #{$light-color};
  --dark-color: #{$dark-color};
  --border-radius: #{$border-radius};
  --bg-color: white;
  --bg-secondary: #{$light-color};
  --text-color: #{$dark-color};
}

// Dark mode support
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a1a;
    --bg-secondary: #2a2a2a;
    --text-color: #f0f0f0;
  }
  
  body {
    background-color: var(--bg-color);
    color: var(--text-color);
  }
  
  .card {
    background-color: var(--bg-secondary);
  }
}
`;
  }

  // Create App.klx file
  files['src/App.klx'] = `<template>
  <div class="app">
    <header class="app-header">
      <div class="logo-container">
        <img src="./assets/logo.svg" alt="KalxJS Logo" class="logo" />
        <h1 class="app-title">${config.projectName}</h1>
      </div>
      
      <nav class="app-nav">
        <a href="/" class="nav-link" @click.prevent="navigateTo('/')">Home</a>
        <a href="/about" class="nav-link" @click.prevent="navigateTo('/about')">About</a>
      </nav>
    </header>

    <main class="app-main">
      <!-- Feature information section -->
      <section class="features-section">
        <h2>Enabled Features:</h2>
        <ul class="features-list">
          ${config.features.router ? '<li class="feature-item router">✓ Router</li>' : ''}
          ${config.features.state ? '<li class="feature-item state">✓ State Management</li>' : ''}
          ${config.features.scss ? '<li class="feature-item scss">✓ SCSS Support</li>' : ''}
          ${config.features.sfc ? '<li class="feature-item sfc">✓ Single File Components</li>' : ''}
          ${config.features.api ? '<li class="feature-item api">✓ API Integration</li>' : ''}
          ${config.features.composition ? '<li class="feature-item composition">✓ Composition API</li>' : ''}
          ${config.features.performance ? '<li class="feature-item performance">✓ Performance Utilities</li>' : ''}
          ${config.features.plugins ? '<li class="feature-item plugins">✓ Plugin System</li>' : ''}
          ${config.features.testing ? '<li class="feature-item testing">✓ Testing</li>' : ''}
          ${config.features.linting ? '<li class="feature-item linting">✓ Linting</li>' : ''}
        </ul>
      </section>

      <!-- Router view container -->
      <section class="router-view-container">
        <div id="router-view"></div>
      </section>
    </main>

    <footer class="app-footer">
      <p>Powered by KalxJS</p>
    </footer>
  </div>
</template>

<script>
import { defineComponent, onMounted, h } from '@kalxjs/core';

export default defineComponent({
  name: 'App',

  // Component setup with composition API
  setup() {
    console.log('App component setup called');

    // Function to navigate programmatically
    const navigateTo = (path) => {
      console.log(\`Navigating to: \${path}\`);
      if (window.router) {
        window.router.push(path);
      } else {
        console.warn('Router not available');
        window.location.hash = path;
      }
    };

    // Lifecycle hooks
    onMounted(() => {
      console.log('App component mounted');
      
      // Make sure the router view container is available
      const routerViewContainer = document.getElementById('router-view');
      if (routerViewContainer && window.router) {
        console.log('Router view container found, initializing router view');
        
        // Force an initial navigation to the current route
        const currentPath = window.location.hash.slice(1) || '/';
        window.router.push(currentPath);
      }
    });

    return {
      navigateTo
    };
  },
  
  // Add render function to ensure it works properly
  render() {
    return h('div', { class: 'app' }, [
      h('header', { class: 'app-header' }, [
        h('div', { class: 'logo-container' }, [
          h('img', { src: './assets/logo.svg', alt: 'KalxJS Logo', class: 'logo' }),
          h('h1', { class: 'app-title' }, ['${config.projectName}'])
        ]),
        
        h('nav', { class: 'app-nav' }, [
          h('a', { 
            href: '/', 
            class: 'nav-link',
            onClick: (e) => {
              e.preventDefault();
              this.navigateTo('/');
            }
          }, ['Home']),
          h('a', { 
            href: '/about', 
            class: 'nav-link',
            onClick: (e) => {
              e.preventDefault();
              this.navigateTo('/about');
            }
          }, ['About'])
        ])
      ]),
      
      h('main', { class: 'app-main' }, [
        h('section', { class: 'features-section' }, [
          h('h2', {}, ['Enabled Features:']),
          h('ul', { class: 'features-list' }, [
            ${config.features.router ? "h('li', { class: 'feature-item router' }, ['✓ Router'])," : ''}
            ${config.features.state ? "h('li', { class: 'feature-item state' }, ['✓ State Management'])," : ''}
            ${config.features.scss ? "h('li', { class: 'feature-item scss' }, ['✓ SCSS Support'])," : ''}
            ${config.features.sfc ? "h('li', { class: 'feature-item sfc' }, ['✓ Single File Components'])," : ''}
            ${config.features.api ? "h('li', { class: 'feature-item api' }, ['✓ API Integration'])," : ''}
            ${config.features.composition ? "h('li', { class: 'feature-item composition' }, ['✓ Composition API'])," : ''}
            ${config.features.performance ? "h('li', { class: 'feature-item performance' }, ['✓ Performance Utilities'])," : ''}
            ${config.features.plugins ? "h('li', { class: 'feature-item plugins' }, ['✓ Plugin System'])," : ''}
            ${config.features.testing ? "h('li', { class: 'feature-item testing' }, ['✓ Testing'])," : ''}
            ${config.features.linting ? "h('li', { class: 'feature-item linting' }, ['✓ Linting'])," : ''}
          ])
        ]),
        
        h('section', { class: 'router-view-container' }, [
          h('div', { id: 'router-view' })
        ])
      ]),
      
      h('footer', { class: 'app-footer' }, [
        h('p', {}, ['Powered by KalxJS'])
      ])
    ]);
  }
});
</script>

<style>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: var(--secondary-color);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  width: 40px;
  height: 40px;
  margin-right: 1rem;
}

.app-title {
  font-size: 1.5rem;
  margin: 0;
}

.app-nav {
  display: flex;
  gap: 1.5rem;
}

.app-nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 0;
  position: relative;
  font-weight: 500;
}

.app-nav a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: var(--primary-color);
  transition: width 0.3s;
}

.app-nav a:hover::after,
.app-nav a.active::after,
.app-nav a.exact-active::after {
  width: 100%;
}

.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.features-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.features-section h2 {
  margin-top: 0;
  color: var(--secondary-color);
  font-size: 1.5rem;
}

.features-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-item {
  background-color: var(--bg-color);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  font-size: 0.9rem;
}

.router-view-container {
  margin-top: 2rem;
  padding: 2rem;
  background-color: var(--bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.welcome-message {
  text-align: center;
}

.welcome-message h2 {
  color: var(--primary-color);
  margin-top: 0;
}

.app-footer {
  background-color: var(--secondary-color);
  color: white;
  text-align: center;
  padding: 1rem;
  margin-top: 2rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>`;

  // Create main.js file
  files['src/main.js'] = `import { createApp } from '@kalxjs/core';
import App from './App.klx';
${config.features.router ? "import { createRouter } from './router';" : ''}
${config.features.state ? "import { createStore } from './store';" : ''}
${config.features.plugins ? "import { registerPlugins } from './plugins';" : ''}
${config.features.scss ? "// Import global styles\nimport './styles/main.scss';" : ''}

// Create the app instance
const app = createApp(App);

// Register global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Application Error:', err);
  console.log('Error occurred in component:', instance);
  console.log('Error info:', info);
  
  // You could also send errors to a monitoring service here
};

// Also catch unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled Error:', event.error);
});

${config.features.router ? `
// Initialize router
const router = createRouter();
app.use(router);

// Expose router globally for direct access
window.router = router;
` : ''}

${config.features.state ? `
// Initialize store
const store = createStore();
app.use(store);
` : ''}

${config.features.plugins ? `
// Register plugins
registerPlugins(app);
` : ''}

// Function to mount the app when the DOM is fully loaded
function mountApp() {
  // Mount the app to the DOM
  app.mount('#app');
}

// Wait for the DOM and stylesheets to be fully loaded before mounting
if (document.readyState === 'complete') {
  // If already loaded, mount immediately
  mountApp();
} else {
  // Otherwise, wait for the load event
  window.addEventListener('load', mountApp);
}

console.log('KalxJS application successfully mounted');

// Add fallback rendering in case the main mounting fails
setTimeout(() => {
  const appElement = document.getElementById('app');
  if (appElement && (appElement.innerHTML.includes('<!--empty node-->') || appElement.innerHTML.trim() === '')) {
    console.log('Fallback rendering activated');
    appElement.innerHTML = \`
      <div style="max-width: 800px; margin: 0 auto; padding: 2rem; text-align: center;">
        <h1 style="color: #42b883;">Welcome to KalxJS</h1>
        <p>This is a simple counter example:</p>
        <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem;">
          <button id="decrement-btn" style="background-color: #42b883; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; font-size: 1.2rem; cursor: pointer;">-</button>
          <span id="counter-value" style="font-size: 2rem; font-weight: bold;">0</span>
          <button id="increment-btn" style="background-color: #42b883; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; font-size: 1.2rem; cursor: pointer;">+</button>
        </div>
      </div>
    \`;
    
    // Add minimal interactivity
    const counterValue = document.getElementById('counter-value');
    const decrementBtn = document.getElementById('decrement-btn');
    const incrementBtn = document.getElementById('increment-btn');
    
    let count = 0;
    
    decrementBtn.addEventListener('click', () => {
      count--;
      counterValue.textContent = count;
    });
    
    incrementBtn.addEventListener('click', () => {
      count++;
      counterValue.textContent = count;
    });
  }
}, 1000);`;

  // Create index.html file
  files['public/index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.projectName}</title>
  <link rel="icon" href="favicon.ico">
  <style>
    :root {
      --primary-color: #42b883;
      --secondary-color: #35495e;
      --bg-color: white;
      --text-color: #333;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: var(--bg-color);
      color: var(--text-color);
    }
    
    #app {
      min-height: 100vh;
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
    }
    
    .loading h1 {
      color: var(--primary-color);
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    
    .loading p {
      color: var(--secondary-color);
      margin-bottom: 2rem;
    }
    
    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(66, 184, 131, 0.2);
      border-radius: 50%;
      border-top-color: var(--primary-color);
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #1a1a1a;
        --text-color: #f0f0f0;
      }
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="loading">
      <h1>${config.projectName}</h1>
      <p>Loading KalxJS application...</p>
      <div class="spinner"></div>
    </div>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`;

  // Create package.json file
  files['package.json'] = `{
  "name": "${config.projectName}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"${config.features.testing ? ',\n    "test": "vitest run",\n    "test:watch": "vitest"' : ''}${config.features.linting ? ',\n    "lint": "eslint . --ext .js,.klx",\n    "lint:fix": "eslint . --ext .js,.klx --fix"' : ''}
  },
  "dependencies": {
    "@kalxjs/core": "^1.0.0"${config.features.router ? ',\n    "@kalxjs/router": "^1.0.0"' : ''}${config.features.state ? ',\n    "@kalxjs/state": "^1.0.0"' : ''}
  },
  "devDependencies": {
    "vite": "^4.3.9"${config.features.scss ? ',\n    "sass": "^1.62.1"' : ''}${config.features.testing ? ',\n    "vitest": "^0.31.1",\n    "@testing-library/dom": "^9.3.0"' : ''}${config.features.linting ? ',\n    "eslint": "^8.41.0",\n    "eslint-plugin-javascript": "^1.0.0"' : ''}
  }
}`;

  // Create vite.config.js file
  files['vite.config.js'] = `import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: true
  }${config.features.testing ? ',\n  test: {\n    globals: true,\n    environment: "jsdom"\n  }' : ''}
});`;

  // Create .gitignore file
  files['.gitignore'] = `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`;

  // Create README.md file
  files['README.md'] = `# ${config.projectName}

This project was created with KalxJS CLI.

## Project Setup

\`\`\`
npm install
\`\`\`

### Compile and Hot-Reload for Development

\`\`\`
npm run dev
\`\`\`

### Compile and Minify for Production

\`\`\`
npm run build
\`\`\`

${config.features.testing ? '### Run Tests\n\n```\nnpm run test\n```\n\n### Run Tests in Watch Mode\n\n```\nnpm run test:watch\n```\n' : ''}
${config.features.linting ? '### Lint Files\n\n```\nnpm run lint\n```\n\n### Fix Linting Issues\n\n```\nnpm run lint:fix\n```\n' : ''}

## Features

${config.features.router ? '- ✅ Router\n' : ''}${config.features.state ? '- ✅ State Management\n' : ''}${config.features.scss ? '- ✅ SCSS Support\n' : ''}${config.features.sfc ? '- ✅ Single File Components\n' : ''}${config.features.api ? '- ✅ API Integration\n' : ''}${config.features.composition ? '- ✅ Composition API\n' : ''}${config.features.performance ? '- ✅ Performance Utilities\n' : ''}${config.features.plugins ? '- ✅ Plugin System\n' : ''}${config.features.testing ? '- ✅ Testing\n' : ''}${config.features.linting ? '- ✅ Linting\n' : ''}${config.features.customRenderer ? '- ✅ Custom Renderer\n' : ''}

## Documentation

For more information, please refer to the [KalxJS documentation](https://github.com/Odeneho-Calculus/kalxjs).
`;

  // Create all files
  for (const [filePath, content] of Object.entries(files)) {
    await fs.writeFile(path.join(targetDir, filePath), content);
  }
}

/**
 * Process template files
 * @param {string} targetDir - Target project directory
 * @param {Object} config - Project configuration
 */
async function processTemplates(targetDir, config) {
  // This function would normally process template files with placeholders
  // For now, we'll just create a simple component as an example
  
  const testComponentPath = path.join(targetDir, 'src/components/TestComponent.klx');
  const testComponentContent = `<template>
  <div class="test-component">
    <h3>Test Component</h3>
    <p>This is a simple test component to demonstrate component functionality.</p>
    <button @click="incrementCounter">Clicked {{ counter }} times</button>
  </div>
</template>

<script>
import { h } from '@kalxjs/core';

export default {
  name: 'TestComponent',
  
  data() {
    return {
      counter: 0
    };
  },
  
  methods: {
    incrementCounter() {
      this.counter++;
      this.$update();
    }
  },
  
  render() {
    return h('div', { class: 'test-component' }, [
      h('h3', {}, ['Test Component']),
      h('p', {}, ['This is a simple test component to demonstrate component functionality.']),
      h('button', { onClick: this.incrementCounter }, [\`Clicked \${this.counter} times\`])
    ]);
  }
};
</script>

<style>
.test-component {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  text-align: center;
}

.test-component h3 {
  color: #42b883;
  margin-top: 0;
}

.test-component button {
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  margin-top: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.test-component button:hover {
  background-color: #3aa876;
}
</style>`;

  await fs.writeFile(testComponentPath, testComponentContent);
}

/**
 * Install dependencies
 * @param {string} targetDir - Target project directory
 * @param {Object} config - Project configuration
 */
async function installDependencies(targetDir, config) {
  try {
    await execa('npm', ['install'], { cwd: targetDir });
    return true;
  } catch (error) {
    console.error('Failed to install dependencies:', error.message);
    
    // Create a .dependencies-failed file to indicate installation failed
    await fs.writeFile(
      path.join(targetDir, '.dependencies-failed'),
      `Installation failed: ${error.message}\n\nPlease run 'npm install' manually after fixing any issues.`
    );
    
    // Don't throw error, just return false to indicate failure
    console.warn(chalk.yellow('Continuing without installing dependencies. Please run npm install manually.'));
    return false;
  }
}

module.exports = create;
