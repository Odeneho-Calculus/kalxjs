const fs = require('fs-extra');
const path = require('path');
const validateProjectName = require('validate-npm-package-name');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const deepmerge = require('deepmerge');
const execa = require('execa');
const https = require('https');

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
    const promptAnswers = options.default ? {
      router: true,
      state: true,
      scss: true,
      testing: true,
      linting: true,
      sfc: true,
      ai: false,
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
        name: 'ai',
        message: 'Add AI features support?',
        default: false
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
      spinner.text = 'Checking for latest package versions...';
      await installDependencies(targetDir, projectConfig);
    }

    spinner.succeed(`Project created successfully at ${chalk.cyan(targetDir)}`);

    // Show next steps
    console.log('\n  Done. Now run:\n');
    console.log(chalk.cyan(`  cd ${projectName}`));
    if (options.skipInstall) console.log(chalk.cyan('  npm install'));
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
    config.features.ai && 'src/ai',
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
    ...(config.features.ai ? { 'src/ai/.gitkeep': '' } : {}),
    ...(config.features.api ? { 'src/api/.gitkeep': '' } : {}),
    ...(config.features.composition ? { 'src/composables/.gitkeep': '' } : {}),
    ...(config.features.performance ? { 'src/utils/performance/.gitkeep': '' } : {}),
    ...(config.features.plugins ? { 'src/plugins/.gitkeep': '' } : {}),
    ...(config.features.customRenderer ? {
      'src/templates/.gitkeep': '',
      'src/renderer/.gitkeep': '',
      'src/utils/.gitkeep': ''
    } : {})
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
  
  // Or add global properties
  app.config.globalProperties.$formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };
  
  console.log('Plugins registered successfully');
}
`;
  }

  // Add router files if router feature is enabled
  if (config.features.router) {
    files['src/router/index.js'] = `import { createRouter as createKalRouter, createHistory } from '@kalxjs/router';
import Home from '../views/Home.klx';
import About from '../views/About.klx';
import NotFound from '../views/NotFound.klx';

export function createRouter() {
  return createKalRouter({
    history: createHistory(),
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
  <div class="not-found">
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for doesn't exist or has been moved.</p>
    <div class="navigation">
      <router-link to="/">Go to Home Page</router-link>
    </div>
  </div>
</template>

<script>
import { h } from '@kalxjs/core';

export default {
  name: 'NotFound',
  
  render() {
    return h('div', { class: 'not-found' }, [
      h('h1', {}, ['404 - Page Not Found']),
      h('p', {}, ['The page you are looking for doesn\\'t exist or has been moved.']),
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
.not-found {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  color: #dc3545;
  margin-bottom: 1rem;
}

p {
  margin-bottom: 2rem;
  color: #6c757d;
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

  // Add store files if state feature is enabled
  if (config.features.state) {
    files['src/store/index.js'] = `import { createStore as createKalStore } from '@kalxjs/store';

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
      doubleCount: state => state.count * 2,
      isEven: state => state.count % 2 === 0,
      completedTodos: state => state.todos.filter(todo => todo.completed),
      incompleteTodos: state => state.todos.filter(todo => !todo.completed)
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
              { id: 3, text: 'Share with the community', completed: false }
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

    files['src/store/useStore.js'] = `import { inject } from '@kalxjs/core';

export function useStore() {
  const store = inject('store');
  
  if (!store) {
    throw new Error('Store not found. Make sure to call app.use(store) before using useStore()');
  }
  
  return store;
}
`;
  }

  // Add main.js file with router support
  files['src/main.js'] = `import { createApp } from '@kalxjs/core';
import App from './App.klx';
${config.features.router ? "import { createRouter } from './router';" : ''}
${config.features.state ? "import { createStore } from './store';" : ''}
${config.features.plugins ? "import { registerPlugins } from './plugins';" : ''}

// Create the app instance
const app = createApp(App);

// Register global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Application Error:', err);
  console.log('Error occurred in component:', instance);
  console.log('Error info:', info);
  
  // You could also send errors to a monitoring service here
};

${config.features.router ? `
// Initialize router
const router = createRouter();
app.use(router);
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

// Mount the app to the DOM
app.mount('#app');

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
}, 1000);
`;

  // Add index.html
  files['index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.projectName} - KalxJS App</title>
  <link rel="icon" href="/src/assets/logo.svg" type="image/svg+xml">
  <meta name="description" content="A KalxJS application">
  ${config.features.scss ? '<link rel="stylesheet" href="/src/styles/main.scss">' : ''}
  <style>
    :root {
      --primary-color: #42b883;
      --secondary-color: #35495e;
      --accent-color: #3b82f6;
      --text-color: #333;
      --text-muted: #6c757d;
      --bg-color: #fff;
      --bg-secondary: #f8f9fa;
      --border-color: #dee2e6;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      color: var(--text-color);
      background-color: var(--bg-color);
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    
    * {
      box-sizing: border-box;
    }
    
    #app {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 1.5rem;
      color: var(--primary-color);
    }
    
    .loading::after {
      content: "...";
      animation: dots 1.5s infinite;
    }
    
    @keyframes dots {
      0%, 20% { content: "."; }
      40% { content: ".."; }
      60%, 100% { content: "..."; }
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="loading">Loading KalxJS Application</div>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`;

  // Add App.klx
  files['src/App.klx'] = `<template>
  <div class="app">
    <header class="app-header">
      <div class="logo-container">
        <img src="./assets/logo.svg" alt="KalxJS Logo" class="logo" />
        <h1 class="app-title">${config.projectName}</h1>
      </div>
      ${config.features.router ? `
      <nav class="app-nav">
        <RouterLink to="/" active-class="active" exact-active-class="exact-active">Home</RouterLink>
        <RouterLink to="/about" active-class="active" exact-active-class="exact-active">About</RouterLink>
      </nav>` : ''}
    </header>

    <main class="app-main">
      <!-- Feature information section -->
      <section class="features-section">
        <h2>Enabled Features:</h2>
        <ul class="features-list">
          ${config.features.router ? `<li class="feature-item router">✓ Router</li>` : ''}
          ${config.features.state ? `<li class="feature-item state">✓ State Management</li>` : ''}
          ${config.features.scss ? `<li class="feature-item scss">✓ SCSS Support</li>` : ''}
          ${config.features.sfc ? `<li class="feature-item sfc">✓ Single File Components</li>` : ''}
          ${config.features.api ? `<li class="feature-item api">✓ API Integration</li>` : ''}
          ${config.features.composition ? `<li class="feature-item composition">✓ Composition API</li>` : ''}
          ${config.features.performance ? `<li class="feature-item performance">✓ Performance Utilities</li>` : ''}
          ${config.features.plugins ? `<li class="feature-item plugins">✓ Plugin System</li>` : ''}
          ${config.features.ai ? `<li class="feature-item ai">✓ AI Features</li>` : ''}
          ${config.features.testing ? `<li class="feature-item testing">✓ Testing</li>` : ''}
          ${config.features.linting ? `<li class="feature-item linting">✓ Linting</li>` : ''}
        </ul>
      </section>

      <!-- Router view if router is enabled -->
      ${config.features.router ?
      `<section class="router-view-container">
        <!-- Use transition for smooth page transitions -->
        <Transition name="fade" mode="out-in">
          <RouterView />
        </Transition>
      </section>` :
      '<p class="edit-prompt">Edit src/App.klx to get started</p>'}
    </main>

    <footer class="app-footer">
      <p>Powered by KalxJS</p>
    </footer>
  </div>
</template>

<script>
import { defineComponent, onMounted, h } from '@kalxjs/core';
${config.features.router ? "import { useRouter, RouterLink, RouterView } from '@kalxjs/router';" : ''}
${config.features.state ? "import { useStore } from './store/useStore';" : ''}
${config.features.api ? "import { useApi } from './api/useApi';" : ''}
${config.features.composition ? "import { useWindowSize } from './composables/useWindowSize';" : ''}
${config.features.performance ? "import { useLazyLoad } from './utils/performance/lazyLoad';" : ''}
${config.features.plugins ? "import { plugins } from './plugins';" : ''}
${config.features.ai ? "import { aiManager, generateText, useAI } from './ai/aiManager';" : ''}

export default defineComponent({
  name: 'App',

  // Register components
  components: {
    ${config.features.router ? 'RouterLink,\n    RouterView,' : ''}
  },

  // Component setup with composition API
  setup() {
    console.log('App component setup called');

    // Initialize features based on configuration
    ${config.features.router ? `const { route, meta, beforeEach } = useRouter();

    // Set page title based on route meta
    beforeEach((to, from, next) => {
      // You can add global navigation guards here
      console.log(\`Navigating from \${from.path} to \${to.path}\`);
      next();
    });` : ''}

    ${config.features.state ? `const store = useStore();` : ''}

    ${config.features.api ? `const api = useApi({
      baseUrl: 'https://api.example.com'
    });` : ''}

    ${config.features.composition ? `const { width, height, isMobile } = useWindowSize();` : ''}

    ${config.features.plugins ? `// Register plugins
    plugins.register('logger', {
      install: () => console.log('Logger plugin installed')
    });` : ''}

    // Lifecycle hooks
    onMounted(() => {
      console.log('App component mounted');
    });

    return {
      ${config.features.router ? 'route,\n      meta,' : ''}
      ${config.features.state ? 'store,' : ''}
      ${config.features.api ? 'api,' : ''}
      ${config.features.composition ? 'width, height, isMobile,' : ''}
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
        ${config.features.router ? `
        h('nav', { class: 'app-nav' }, [
          h(RouterLink, { to: '/', activeClass: 'active', exactActiveClass: 'exact-active' }, ['Home']),
          h(RouterLink, { to: '/about', activeClass: 'active', exactActiveClass: 'exact-active' }, ['About'])
        ])` : 'null'}
      ]),
      
      h('main', { class: 'app-main' }, [
        h('section', { class: 'features-section' }, [
          h('h2', {}, ['Enabled Features:']),
          h('ul', { class: 'features-list' }, [
            ${config.features.router ? `h('li', { class: 'feature-item router' }, ['✓ Router']),` : ''}
            ${config.features.state ? `h('li', { class: 'feature-item state' }, ['✓ State Management']),` : ''}
            ${config.features.scss ? `h('li', { class: 'feature-item scss' }, ['✓ SCSS Support']),` : ''}
            ${config.features.sfc ? `h('li', { class: 'feature-item sfc' }, ['✓ Single File Components']),` : ''}
            ${config.features.api ? `h('li', { class: 'feature-item api' }, ['✓ API Integration']),` : ''}
            ${config.features.composition ? `h('li', { class: 'feature-item composition' }, ['✓ Composition API']),` : ''}
            ${config.features.performance ? `h('li', { class: 'feature-item performance' }, ['✓ Performance Utilities']),` : ''}
            ${config.features.plugins ? `h('li', { class: 'feature-item plugins' }, ['✓ Plugin System']),` : ''}
            ${config.features.ai ? `h('li', { class: 'feature-item ai' }, ['✓ AI Features']),` : ''}
            ${config.features.testing ? `h('li', { class: 'feature-item testing' }, ['✓ Testing']),` : ''}
            ${config.features.linting ? `h('li', { class: 'feature-item linting' }, ['✓ Linting']),` : ''}
          ].filter(Boolean))
        ]),
        
        ${config.features.router ?
      `h('section', { class: 'router-view-container' }, [
          h(RouterView)
        ])` :
      `h('p', { class: 'edit-prompt' }, ['Edit src/App.klx to get started'])`}
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
}

.app-footer {
  background-color: var(--secondary-color);
  color: white;
  text-align: center;
  padding: 1rem;
  margin-top: 2rem;
}

.edit-prompt {
  text-align: center;
  margin: 3rem 0;
  color: var(--text-muted);
  font-style: italic;
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

  // Add README.md
  files['README.md'] = `# ${config.projectName}

This project was generated with KalxJS CLI.

## Project Setup

\`\`\`bash
npm install
\`\`\`

### Compile and Hot-Reload for Development

\`\`\`bash
npm run dev
\`\`\`

### Compile and Minify for Production

\`\`\`bash
npm run build
\`\`\`

${config.features.testing ? `
### Run Unit Tests

\`\`\`bash
npm run test
\`\`\`
` : ''}

${config.features.linting ? `
### Lint and Fix Files

\`\`\`bash
npm run lint
\`\`\`
` : ''}

## Features

This project includes the following features:

${config.features.router ? '- ✅ Router\n' : ''}
${config.features.state ? '- ✅ State Management\n' : ''}
${config.features.scss ? '- ✅ SCSS Support\n' : ''}
${config.features.sfc ? '- ✅ Single File Components\n' : ''}
${config.features.api ? '- ✅ API Integration\n' : ''}
${config.features.composition ? '- ✅ Composition API\n' : ''}
${config.features.performance ? '- ✅ Performance Utilities\n' : ''}
${config.features.plugins ? '- ✅ Plugin System\n' : ''}
${config.features.ai ? '- ✅ AI Features\n' : ''}
${config.features.testing ? '- ✅ Testing\n' : ''}
${config.features.linting ? '- ✅ Linting\n' : ''}
${config.features.customRenderer ? '- ✅ Custom Renderer\n' : ''}

## Documentation

For more information, please refer to the [KalxJS Documentation](https://kalxjs.dev/docs).
`;

  // Add vite.config.js
  files['vite.config.js'] = `import { defineConfig } from 'vite';
import { kalxCompilerPlugin } from '@kalxjs/compiler-plugin';
import path from 'path';

export default defineConfig({
  plugins: [
    kalxCompilerPlugin()
  ],
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
    minify: 'terser',
    sourcemap: true
  }
});
`;

  // Write all files
  for (const [file, content] of Object.entries(files)) {
    await fs.writeFile(path.join(targetDir, file), content);
  }
}

/**
 * Installs dependencies for the project
 * @param {string} targetDir - Target project directory
 * @param {Object} config - Project configuration
 */
async function installDependencies(targetDir, config) {
  // Get the latest versions of all packages
  const latestVersions = await getLatestPackageVersions();

  const pkg = {
    name: config.projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    },
    dependencies: {
      "@kalxjs/core": latestVersions["@kalxjs/core"] || "^2.1.12" // Fallback to current version
    },
    devDependencies: {
      "vite": "^5.0.0"
    }
  };

  // Add feature-specific dependencies with latest versions
  if (config.features.router) pkg.dependencies["@kalxjs/router"] = latestVersions["@kalxjs/router"] || "^2.0.0";
  if (config.features.state) pkg.dependencies["@kalxjs/state"] = latestVersions["@kalxjs/state"] || "^1.2.26";
  if (config.features.scss) pkg.devDependencies["sass"] = "^1.69.0";

  // Always include compiler for .klx files since we're using App.klx
  pkg.dependencies["@kalxjs/compiler"] = latestVersions["@kalxjs/compiler"] || "^1.2.2";
  pkg.devDependencies["@kalxjs/compiler-plugin"] = latestVersions["@kalxjs/compiler-plugin"] || "^1.2.2";

  // Add the newly created packages with latest versions
  if (config.features.ai) {
    pkg.dependencies["@kalxjs/ai"] = latestVersions["@kalxjs/ai"] || "^1.2.2";
  }
  if (config.features.api) {
    pkg.dependencies["@kalxjs/api"] = latestVersions["@kalxjs/api"] || "^1.2.2";
  }
  if (config.features.composition) {
    pkg.dependencies["@kalxjs/composition"] = latestVersions["@kalxjs/composition"] || "^1.2.2";
  }
  if (config.features.performance) {
    pkg.dependencies["@kalxjs/performance"] = latestVersions["@kalxjs/performance"] || "^1.2.2";
  }
  if (config.features.plugins) {
    pkg.dependencies["@kalxjs/plugins"] = latestVersions["@kalxjs/plugins"] || "^1.2.2";
  }

  // Write package.json
  await fs.writeJSON(path.join(targetDir, 'package.json'), pkg, { spaces: 2 });

  // Log the versions being used
  console.log('\n' + chalk.cyan('Using the following package versions:'));
  Object.entries(pkg.dependencies).forEach(([name, version]) => {
    console.log(`  ${chalk.green(name)}: ${version}`);
  });

  try {
    console.log('\n' + chalk.cyan('Installing dependencies...'));

    // Use child_process instead of execa
    const { execSync } = require('child_process');
    execSync('npm install', {
      cwd: targetDir,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: true }
    });
  } catch (err) {
    throw new Error('Failed to install dependencies: ' + err.message);
  }
}

/**
 * Fetches the latest versions of KalxJS packages from npm
 * @returns {Promise<Object>} Object with package names as keys and version strings as values
 */
async function getLatestPackageVersions() {
  const packages = [
    '@kalxjs/core',
    '@kalxjs/router',
    '@kalxjs/state',
    '@kalxjs/compiler',
    '@kalxjs/compiler-plugin',
    '@kalxjs/ai',
    '@kalxjs/api',
    '@kalxjs/composition',
    '@kalxjs/performance',
    '@kalxjs/plugins',
    '@kalxjs/devtools',
    '@kalxjs/cli'
  ];

  const versions = {};

  // Create a promise for each package
  const promises = packages.map(pkg => {
    return new Promise((resolve) => {
      https.get(`https://registry.npmjs.org/${pkg}/latest`, (res) => {
        if (res.statusCode !== 200) {
          // If we can't get the latest version, resolve with null
          console.warn(chalk.yellow(`Could not fetch latest version for ${pkg}`));
          resolve();
          return;
        }

        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const pkgData = JSON.parse(data);
            versions[pkg] = `^${pkgData.version}`;
            resolve();
          } catch (err) {
            console.warn(chalk.yellow(`Error parsing version data for ${pkg}: ${err.message}`));
            resolve();
          }
        });
      }).on('error', (err) => {
        console.warn(chalk.yellow(`Network error fetching version for ${pkg}: ${err.message}`));
        resolve();
      });
    });
  });

  // Wait for all requests to complete
  await Promise.all(promises);
  return versions;
}

/**
 * Process template files and replace placeholders with configuration values
 * @param {string} targetDir - Target project directory
 * @param {Object} config - Project configuration
 */
async function processTemplates(targetDir, config) {
  const templateFiles = [
    'src/App.js',
    'src/main.js',
    'index.html',
    'README.md',
    'vite.config.js'
  ];

  // Add feature-specific template files
  if (config.features.router) {
    templateFiles.push('src/router/index.js');
    templateFiles.push('src/views/Home.js');
  }

  if (config.features.state) {
    templateFiles.push('src/store/index.js');
    templateFiles.push('src/store/useStore.js');
  }

  if (config.features.scss) {
    templateFiles.push('src/styles/main.scss');
  }

  if (config.features.api) {
    templateFiles.push('src/api/useApi.js');
  }

  if (config.features.composition) {
    templateFiles.push('src/composables/useWindowSize.js');
    templateFiles.push('src/composables/useLocalStorage.js');
  }

  if (config.features.performance) {
    templateFiles.push('src/utils/performance/lazyLoad.js');
    templateFiles.push('src/utils/performance/debounce.js');
  }

  // Process each template file
  for (const file of templateFiles) {
    const filePath = path.join(targetDir, file);
    if (await fs.pathExists(filePath)) {
      let content = await fs.readFile(filePath, 'utf8');

      // Replace placeholders with config values
      content = content.replace(/\{\{projectName\}\}/g, config.projectName);

      // Replace feature flags
      Object.entries(config.features).forEach(([feature, enabled]) => {
        const regex = new RegExp(`\\{\\{features\\.${feature}\\}\\}`, 'g');
        content = content.replace(regex, enabled.toString());
      });

      await fs.writeFile(filePath, content);
    }
  }
}

module.exports = create;