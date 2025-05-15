const fs = require('fs-extra');
const path = require('path');
const validateProjectName = require('validate-npm-package-name');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const deepmerge = require('deepmerge');
const execa = require('execa');
const gradient = require('gradient-string');
const figlet = require('figlet');
const boxen = require('boxen');
const processTemplates = require('../utils/processTemplates');
const https = require('https');

/**
 * Creates a new KalxJS project
 * @param {string} projectName - Name of the project
 * @param {Object} options - Configuration options
 */
async function create(projectName, options = {}) {
  // Display welcome banner
  console.log('\n');
  figlet.textSync('KALXJS', {
    font: 'Big',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 80,
    whitespaceBreak: true
  }).split('\n').forEach(line => {
    console.log(gradient.pastel.multiline(line));
  });

  console.log('\n');
  console.log(boxen(
    chalk.bold('🚀 Modern JavaScript Framework for Building Powerful Applications'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      backgroundColor: '#222'
    }
  ));
  console.log('\n');

  // Validate project name
  const result = validateProjectName(projectName);
  if (!result.validForNewPackages) {
    console.error(chalk.red.bold(`❌ Invalid project name: "${projectName}"`));
    result.errors && result.errors.forEach(err => {
      console.error(chalk.red('  ✖ Error: ' + err));
    });
    result.warnings && result.warnings.forEach(warn => {
      console.error(chalk.yellow('  ⚠ Warning: ' + warn));
    });
    process.exit(1);
  }

  const cwd = options.cwd || process.cwd();
  const targetDir = path.resolve(cwd, projectName);

  if (fs.existsSync(targetDir)) {
    console.error(chalk.red.bold(`❌ Directory ${chalk.cyan(projectName)} already exists.`));
    process.exit(1);
  }

  const spinner = ora({
    text: `Creating project in ${chalk.cyan(targetDir)}...`,
    spinner: 'dots',
    color: 'cyan'
  }).start();

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

    // Fetch latest package versions
    spinner.text = 'Fetching latest package versions...';
    const packageVersions = await getLatestVersions(projectConfig);
    projectConfig.packageVersions = packageVersions;

    // Generate project files
    spinner.text = 'Generating project files...';
    await generateProject(targetDir, projectConfig);

    // Process template files
    spinner.text = 'Processing templates...';
    await processTemplates(targetDir, projectConfig);

    // Create test component
    await createTestComponent(targetDir, projectConfig);

    // Install dependencies
    let installSuccess = false;
    if (!options.skipInstall) {
      spinner.text = 'Installing dependencies...';
      installSuccess = await installDependencies(targetDir, projectConfig);

      if (!installSuccess) {
        spinner.warn('Dependencies installation failed. You will need to run npm install manually.');
      }
    }

    spinner.succeed(`Project created successfully at ${chalk.cyan(targetDir)}`);

    // Show next steps with enhanced visuals
    console.log('\n');

    // Prepare dependency installation instructions
    let installInstructions = '';
    if (options.skipInstall || !installSuccess) {
      installInstructions = '\n' + chalk.cyan('  npm install --legacy-peer-deps') +
        '\n  ' + chalk.gray('# If that fails, try:') +
        '\n  ' + chalk.cyan('  npm install --force');
    }

    console.log(boxen(
      chalk.bold.green('🎉 KALXJS Project Created Successfully! 🎉') +
      '\n\n' +
      chalk.bold('Next Steps:') +
      '\n\n' +
      chalk.cyan(`  cd ${projectName}`) +
      installInstructions +
      '\n' +
      chalk.cyan('  npm run start') + chalk.gray(' # Recommended: Uses the start script with auto-fixes') +
      '\n  ' + chalk.gray('# Or use the standard command:') +
      '\n  ' + chalk.cyan('npm run dev') +
      '\n\n' +
      chalk.bold.yellow('📚 Documentation:') +
      '\n' +
      chalk.yellow('  Check the docs/ directory for project documentation') +
      '\n\n' +
      chalk.bold.magenta('🔧 Configuration:') +
      '\n' +
      chalk.magenta('  Edit config/app.config.js to customize your application') +
      '\n\n' +
      chalk.bold.blue('🛠️ Troubleshooting:') +
      '\n' +
      chalk.blue('  If you encounter any issues, the start.js script will automatically fix common problems') +
      (options.skipInstall || !installSuccess ?
        '\n\n' + chalk.bold.red('⚠️ Dependency Note:') +
        '\n' + chalk.red('  If you encounter dependency conflicts, try:') +
        '\n  ' + chalk.cyan('npm install --legacy-peer-deps') +
        '\n  ' + chalk.cyan('npm install --force') : ''),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        backgroundColor: '#222'
      }
    ));

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
  // Create unique KALXJS project structure
  const dirs = [
    'app',
    'app/core',
    'app/components',
    'app/assets',
    'public',
    'public/assets',
    config.features.router && 'app/pages',
    config.features.router && 'app/navigation',
    config.features.state && 'app/state',
    config.features.scss && 'app/styles',
    config.features.sfc && 'app/components/single-file',
    config.features.api && 'app/services',
    config.features.composition && 'app/hooks',
    config.features.performance && 'app/utils/performance',
    config.features.plugins && 'app/extensions',
    config.features.customRenderer && 'app/templates',
    config.features.customRenderer && 'app/renderer',
    config.features.customRenderer && 'app/utils',
    'config',
    'docs'
  ].filter(Boolean);

  for (const dir of dirs) {
    await fs.ensureDir(path.join(targetDir, dir));
  }

  // Create base files for our unique structure
  const files = {
    'public/.gitkeep': '',
    'public/assets/.gitkeep': '',
    'app/assets/.gitkeep': '',
    'app/components/.gitkeep': '',
    'app/core/.gitkeep': '',
    'config/.gitkeep': '',
    'docs/README.md': `# ${config.projectName}\n\nDocumentation for your KALXJS project.\n`,
    ...(config.features.sfc ? { 'app/components/single-file/.gitkeep': '' } : {}),
    ...(config.features.api ? { 'app/services/.gitkeep': '' } : {}),
    ...(config.features.composition ? { 'app/hooks/.gitkeep': '' } : {}),
    ...(config.features.performance ? { 'app/utils/performance/.gitkeep': '' } : {}),
    ...(config.features.plugins ? { 'app/extensions/.gitkeep': '' } : {}),
    ...(config.features.customRenderer ? {
      'app/templates/.gitkeep': '',
      'app/renderer/.gitkeep': '',
      'app/utils/.gitkeep': ''
    } : {}),
    'app/utils/version-helper.js': fs.readFileSync(
      path.join(__dirname, '../../templates/version-helper.js'),
      'utf8'
    ),
    'app/utils/index.js': `/**
 * KALXJS Utilities
 * This file exports all utility functions used in the application
 */

// Export version utilities
export * from './version-helper';
`,
    'config/app.config.js': `/**
 * KALXJS Application Configuration
 */
const config = {
  name: '${config.projectName}',
  version: '0.1.0',
  description: 'A powerful KALXJS application',
  
  // Environment settings
  env: {
    development: {
      apiBaseUrl: 'http://localhost:3000/api',
      debug: true
    },
    production: {
      apiBaseUrl: '/api',
      debug: false
    }
  },
  
  // Feature flags
  features: ${JSON.stringify(config.features, null, 2)}
};

// Support both CommonJS and ES modules
export default config;

// For CommonJS compatibility
if (typeof module !== 'undefined') {
  module.exports = config;
}`
  };

  // Add logo.svg file with KALXJS branding
  files['app/assets/logo.svg'] = `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" rx="40" fill="#1E293B"/>
  <path d="M40 60H160L100 160L40 60Z" fill="#38BDF8"/>
  <path d="M70 80H130L100 130L70 80Z" fill="#0EA5E9"/>
  <circle cx="100" cy="50" r="15" fill="#F472B6"/>
  <text x="100" y="105" font-family="Arial" font-size="24" font-weight="bold" fill="white" text-anchor="middle">KALXJS</text>
</svg>`;

  // Add favicon.ico file
  files['public/assets/favicon.ico'] = Buffer.from(
    'AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAA' +
    'AAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A' +
    '////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD/' +
    '//8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP//' +
    '/wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////' +
    'AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A' +
    '////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD/' +
    '//8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP//' +
    '/wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////' +
    'AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A' +
    '////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD/' +
    '//8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP//' +
    '/wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////' +
    'AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A' +
    '////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD/' +
    '//8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP//' +
    '/wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////' +
    'AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A' +
    '////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD/' +
    '//8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP//' +
    '/wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////' +
    'AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A' +
    '////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD/' +
    '//8A////AP///wA=',
    'base64'
  );

  // Add modern logo.svg file for the public assets
  files['public/assets/logo.svg'] = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .primary { fill: #4f46e5; }
    .secondary { fill: #10b981; }
    .accent { fill: #f59e0b; }
    
    @media (prefers-color-scheme: dark) {
      .primary { fill: #818cf8; }
      .secondary { fill: #34d399; }
      .accent { fill: #fbbf24; }
    }
  </style>
  
  <!-- Background Circle -->
  <circle cx="100" cy="100" r="90" fill="white" stroke="#e5e7eb" stroke-width="2"/>
  
  <!-- K Letter -->
  <path class="primary" d="M60 40V160H80V110L120 160H145L95 100L145 40H120L80 90V40H60Z"/>
  
  <!-- Decorative Elements -->
  <circle class="secondary" cx="160" cy="70" r="15"/>
  <circle class="accent" cx="160" cy="130" r="15"/>
  
  <!-- Connecting Lines -->
  <path d="M80 100H140" stroke="#e5e7eb" stroke-width="4" stroke-linecap="round"/>
  <path d="M145 55L120 80" stroke="#e5e7eb" stroke-width="4" stroke-linecap="round"/>
  <path d="M145 145L120 120" stroke="#e5e7eb" stroke-width="4" stroke-linecap="round"/>
</svg>`;

  // Add plugins file if plugins feature is enabled
  if (config.features.plugins) {
    files['app/extensions/index.js'] = `// Register all plugins here
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
    files['app/navigation/index.js'] = `import { createRouter as createKalRouter } from '@kalxjs/router';
import Home from '../pages/Home.js';
import About from '../pages/About.js';
import NotFound from '../pages/NotFound.js';
import { h, createApp } from '@kalxjs/core';

// Define version for compatibility checks
const version = '${config.packageVersions['@kalxjs/router']}';

// Helper function to handle route errors
function handleRouteError(err, route) {
  console.error(\`Error loading route \${route.path}:\`, err);
  const routerView = document.getElementById('router-view');
  if (routerView) {
    routerView.innerHTML = \`
      <div class="error-container">
        <h2>Navigation Error</h2>
        <p>Failed to load route: \${route.path}</p>
        <p>Error: \${err.message || 'Unknown error'}</p>
        <button onclick="window.router.push('/')">Go to Home</button>
      </div>
    \`;
  }
}

export function createRouter() {
  const router = createKalRouter({
    history: 'hash', // Use hash history instead of createHistory()
    mode: 'hash', // Fallback mode for compatibility
    base: '/', // Base URL for all routes
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

    files['app/pages/Home.js'] = `import { h } from '@kalxjs/core';

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

/* CSS styles
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
*/`;

    files['app/pages/About.js'] = `import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
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
});`;

    files['app/pages/NotFound.js'] = `import { h, defineComponent } from '@kalxjs/core';

    export default defineComponent({
      name: 'NotFoundView',

      render() {
        return h('div', { class: 'not-found-view' }, [
          h('h1', {}, ['404 - Page Not Found']),
          h('p', {}, ['The page you are looking for does not exist.']),
          h('div', { class: 'navigation' }, [
            h('a', {
              href: '/', onClick: (e) => {
                e.preventDefault();
                window.router.push('/');
              }
            }, ['Go to Home Page'])
          ])
        ]);
      }
    }); `;
  }

  // Add state management files if state feature is enabled
  if (config.features.state) {
    files['app/state/index.js'] = `import { createStore as createKalStore } from '@kalxjs/state';

    // Define version for compatibility checks
    const version = '${config.packageVersions['@kalxjs/state']}';

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
    files['app/styles/main.scss'] = `// Main SCSS file for the application

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
@media(prefers-color-scheme: dark) {
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

  // Create App.js file
  files['app/core/App.js'] = `import { h, defineComponent, onMounted, ref } from '@kalxjs/core';
    // Import the app styles
    import '../styles/app.scss';

    export default defineComponent({
      name: 'App',

      // Component setup with composition API
      setup() {
        console.log('App component setup called');

        // Active route tracking for navigation highlighting
        const activeRoute = ref('/');

        // Function to navigate programmatically
        const navigateTo = (path) => {
          console.log(\`Navigating to: \${path}\`);
      activeRoute.value = path;

      if (window.router) {
        window.router.push(path);
      } else {
        console.warn('Router not available');
        window.location.hash = path;
      }
    };

    // Theme toggle state
    const isDarkTheme = ref(false);

    // Toggle theme function
    const toggleTheme = () => {
      isDarkTheme.value = !isDarkTheme.value;
      document.body.classList.toggle('dark-theme', isDarkTheme.value);
    };

    // Lifecycle hooks
    onMounted(() => {
      console.log('App component mounted');

      // Check for saved theme preference
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        isDarkTheme.value = true;
        document.body.classList.add('dark-theme');
      }

      // Make sure the router view container is available
      const routerViewContainer = document.getElementById('router-view');
      if (routerViewContainer && window.router) {
        console.log('Router view container found, initializing router view');

        // Force an initial navigation to the current route
        const currentPath = window.location.hash.slice(1) || '/';
        activeRoute.value = currentPath;
        window.router.push(currentPath);
      }
    });

    return {
      navigateTo,
      activeRoute,
      isDarkTheme,
      toggleTheme
    };
  },

  // Add render function to ensure it works properly
  render() {
    return h('div', {
      class: ['app', { 'dark-theme': this.isDarkTheme }]
    }, [
      // Header with navigation
      h('header', { class: 'app-header' }, [
        h('div', { class: 'logo-container' }, [
          h('img', {
            src: '/assets/logo.svg',
            alt: 'KalxJS Logo',
            class: 'logo',
            onClick: () => this.navigateTo('/')
          }),
          h('h1', { class: 'app-title' }, ['${config.projectName}'])
        ]),

        h('nav', { class: 'app-nav' }, [
          h('a', {
            href: '/',
            class: ['nav-link', { 'active': this.activeRoute === '/' }],
            onClick: (e) => {
              e.preventDefault();
              this.navigateTo('/');
            }
          }, ['Home']),
          h('a', {
            href: '/about',
            class: ['nav-link', { 'active': this.activeRoute === '/about' }],
            onClick: (e) => {
              e.preventDefault();
              this.navigateTo('/about');
            }
          }, ['About']),
          h('a', {
            href: '/features',
            class: ['nav-link', { 'active': this.activeRoute === '/features' }],
            onClick: (e) => {
              e.preventDefault();
              this.navigateTo('/features');
            }
          }, ['Features']),
          h('button', {
            class: 'btn theme-toggle',
            onClick: this.toggleTheme,
            title: this.isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'
          }, [
            this.isDarkTheme ? '☀️' : '🌙'
          ])
        ])
      ]),

      // Main content area
      h('main', { class: 'app-main' }, [
        // Welcome banner
        h('section', { class: 'welcome-banner' }, [
          h('h1', { class: 'welcome-title' }, ['Welcome to KalxJS']),
          h('p', { class: 'welcome-subtitle' }, ['A modern JavaScript framework for building powerful applications']),
          h('div', { class: 'action-buttons' }, [
            h('button', {
              class: 'btn btn-primary',
              onClick: () => window.open('https://github.com/Odeneho-Calculus/kalxjs', '_blank')
            }, ['GitHub']),
            h('button', {
              class: 'btn btn-secondary',
              onClick: () => this.navigateTo('/features')
            }, ['Explore Features'])
          ])
        ]),

        // Feature information section
        h('section', { class: 'features-section' }, [
          h('h2', null, ['Enabled Features']),
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

        // Router view container
        h('section', { class: 'router-view-container' }, [
          h('div', { id: 'router-view' })
        ])
      ]),

      // Footer
      h('footer', { class: 'app-footer' }, [
        h('div', { class: 'footer-content' }, [
          h('p', { class: 'copyright' }, ['© 2023 Powered by KalxJS']),
          h('div', { class: 'footer-links' }, [
            h('a', { href: 'https://github.com/Odeneho-Calculus/kalxjs', target: '_blank' }, ['GitHub']),
            h('a', { href: '#', onClick: (e) => { e.preventDefault(); this.navigateTo('/about'); } }, ['About']),
            h('a', { href: '#', onClick: (e) => { e.preventDefault(); this.navigateTo('/features'); } }, ['Features'])
          ])
        ])
      ])
    ]);
  }
});`;

  // Create main.js file
  files['app/main.js'] = `import { createApp } from '@kalxjs/core';
import App from './core/App.js';
${config.features.router ? "import { createRouter } from './navigation';" : ''}
${config.features.state ? "import { createStore } from './state';" : ''}
${config.features.plugins ? "import { registerPlugins } from './extensions';" : ''}
${config.features.scss ? "// Import global styles\nimport './styles/main.scss';" : ''}
// Import application configuration
import appConfig from '../config/app.config.js';
// Import version utilities
import { initVersionCheck } from './utils/version-helper';

// Function to dynamically get package versions at runtime
async function getPackageVersions() {
  const versions = {};
  
  // Helper function to safely fetch a package version
  async function getVersion(packageName) {
    try {
      // Try to dynamically import the package to get its version
      try {
        const module = await import(packageName);
        if (module.version) {
          return module.version;
        }
      } catch (importErr) {
        console.debug(\`Could not import \${packageName} directly: \`, importErr);
      }
      
      // If direct import fails, try to fetch from package.json
      try {
        // This works in development environments where node_modules is accessible
        const response = await fetch(\`/node_modules/\${packageName}/package.json\`);
  if (response.ok) {
    const packageInfo = await response.json();
    return packageInfo.version;
  }
} catch (fetchErr) {
  console.debug(\`Could not fetch package.json for \${packageName}: \`, fetchErr);
}

// If all else fails, try to get from window.__KALXJS_VERSIONS__ if available
if (window.__KALXJS_VERSIONS__ && window.__KALXJS_VERSIONS__[packageName]) {
  return window.__KALXJS_VERSIONS__[packageName];
}

// Last resort: use a fallback version based on the package
const fallbacks = {
  '@kalxjs/core': '${config.packageVersions["@kalxjs/core"]}',
  '@kalxjs/router': '${config.packageVersions["@kalxjs/router"]}',
  '@kalxjs/state': '${config.packageVersions["@kalxjs/state"]}',
  '@kalxjs/utils': '${config.packageVersions["@kalxjs/utils"]}',
  '@kalxjs/devtools': '${config.packageVersions["@kalxjs/devtools"]}'
};

return fallbacks[packageName] || '1.0.0';
    } catch (err) {
  console.warn(\`Error getting version for \${packageName}: \`, err);
  return '1.0.0';
}
  }

// Get versions for all packages
versions['@kalxjs/core'] = await getVersion('@kalxjs/core');
  ${config.features.router ? "versions['@kalxjs/router'] = await getVersion('@kalxjs/router');" : ''}
  ${config.features.state ? "versions['@kalxjs/state'] = await getVersion('@kalxjs/state');" : ''}
versions['@kalxjs/utils'] = await getVersion('@kalxjs/utils');
versions['@kalxjs/devtools'] = await getVersion('@kalxjs/devtools');

return versions;
}

// Initialize with fallback versions first
let coreVersion = '${config.packageVersions['@kalxjs/core']}';
${config.features.router ? "let routerVersion = '${config.packageVersions['@kalxjs/router']}';" : ''}
${config.features.state ? "let stateVersion = '${config.packageVersions['@kalxjs/state']}';" : ''}
let utilsVersion = '${config.packageVersions['@kalxjs/utils']}';
let devtoolsVersion = '${config.packageVersions['@kalxjs/devtools']}';

// Then update with actual versions when available
getPackageVersions().then(versions => {
  coreVersion = versions['@kalxjs/core'];
  ${config.features.router ? "routerVersion = versions['@kalxjs/router'];" : ''}
  ${config.features.state ? "stateVersion = versions['@kalxjs/state'];" : ''}
  utilsVersion = versions['@kalxjs/utils'];
  devtoolsVersion = versions['@kalxjs/devtools'];

  // Log the actual versions once they're loaded
  console.log('📦 Updated package versions:');
  console.log('  • Core:', coreVersion);
  ${config.features.router ? "console.log('  • Router:', routerVersion);" : ''}
  ${config.features.state ? "console.log('  • State:', stateVersion);" : ''}
  console.log('  • Utils:', utilsVersion);
  console.log('  • DevTools:', devtoolsVersion);

  // Version checking is now handled by initVersionCheck in the main application
});

// Global error handling function
function handleError(err, source = 'Application') {
  console.error(\`[\${source} Error]\`, err);
  
  // Display error in UI if possible
  const appElement = document.getElementById('app');
  if (appElement) {
    // Keep the loading spinner if it exists
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    // Create error container if it doesn't exist
    let errorContainer = document.querySelector('.error-container');
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.className = 'error-container';
      appElement.appendChild(errorContainer);
    }
    
    errorContainer.innerHTML = \`
      <h2>\${source} Error</h2>
      <p>\${err.message || 'An unknown error occurred'}</p>
      <button onclick="location.reload()">Reload Application</button>
    \`;
  }
  
  // You could also send errors to a monitoring service here
}

// Set up global error handlers
window.addEventListener('error', (event) => {
  handleError(event.error || new Error(event.message), 'Unhandled');
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  handleError(event.reason || new Error('Promise rejection'), 'Unhandled Promise');
  event.preventDefault();
});

// Initialize application with error handling
try {
  // Check package versions compatibility
  console.log('🚀 KALXJS Framework - Starting application');
  console.log('📦 Package versions:');
  console.log('  • Core:', coreVersion);
  ${config.features.router ? "console.log('  • Router:', routerVersion);" : ''}
  ${config.features.state ? "console.log('  • State:', stateVersion);" : ''}
  console.log('  • Utils:', utilsVersion);
  console.log('  • DevTools:', devtoolsVersion);

  // Version compatibility check
  // Version compatibility check is now handled by the version-helper.js utility

  // Check package versions
  initVersionCheck().then(() => {
    console.log('✅ Version check complete');
  });

  const app = createApp(App, {
    debug: appConfig.env.development.debug,
    appName: appConfig.name,
    version: appConfig.version
  });

  // Register global error handler
  app.config.errorHandler = (err, instance, info) => {
    handleError(err, 'Component');
  };

  ${config.features.router ? `
  // Initialize router
  const router = createRouter();
  
  // Add error handling for router
  router.onError((err, to, from) => {
    console.error('Router Error:', err);
    console.log('Failed navigation from', from?.path || 'initial route', 'to', to.path);
    handleError(err, 'Router');
  });
  
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
  try {
    registerPlugins(app);
  } catch (err) {
    console.warn('Plugin registration error:', err);
    // Continue without plugins
  }
  ` : ''}

  // Enable development tools in development mode
  if (appConfig.env.development.debug) {
    try {
      const { setupDevTools } = require('@kalxjs/devtools');
      setupDevTools(app, {
        logLifecycleEvents: true,
        performanceMonitoring: true
      });
    } catch (err) {
      console.warn('DevTools initialization error:', err);
      // Continue without devtools
    }
  }

  // Function to mount the app when the DOM is fully loaded
  function mountApp() {
    try {
      // Hide loading indicator
      const loadingElement = document.querySelector('.loading');
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
      
      // Mount the app to the DOM
      app.mount('#app');
      console.log('🎉 KALXJS application successfully mounted');
      
      // Initialize router view if needed
      if (${config.features.router ? 'true' : 'false'} && window.router) {
        const routerViewElement = document.getElementById('router-view');
        if (routerViewElement) {
          console.log('Router view container found');
          // Force initial navigation
          const currentPath = window.location.hash.slice(1) || '/';
          window.router.push(currentPath);
        }
      }
    } catch (err) {
      handleError(err, 'Mount');
    }
  }

  // Wait for the DOM and stylesheets to be fully loaded before mounting
  if (document.readyState === 'complete') {
    // If already loaded, mount immediately
    mountApp();
  } else {
    // Otherwise, wait for the load event
    window.addEventListener('load', mountApp);
  }

  // Add fallback rendering in case the main mounting fails
  setTimeout(() => {
    const appElement = document.getElementById('app');
    if (appElement && 
        (appElement.innerHTML.includes('<!--empty node-->') || 
         (appElement.innerHTML.trim() === '') ||
         (appElement.querySelector('.loading') && !appElement.querySelector('.loading').style.display === 'none'))) {
      console.log('Fallback rendering activated');
      
      // Hide loading indicator if it exists
      const loadingElement = document.querySelector('.loading');
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
      
      // Create fallback UI
      const fallbackElement = document.createElement('div');
      fallbackElement.style.maxWidth = '800px';
      fallbackElement.style.margin = '0 auto';
      fallbackElement.style.padding = '2rem';
      fallbackElement.style.textAlign = 'center';
      
      fallbackElement.innerHTML = \`
        <h1 style="color: #42b883;">Welcome to KalxJS</h1>
        <p>This is a simple counter example:</p>
        <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem;">
          <button id="decrement-btn" style="background-color: #42b883; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; font-size: 1.2rem; cursor: pointer;">-</button>
          <span id="counter-value" style="font-size: 2rem; font-weight: bold;">0</span>
          <button id="increment-btn" style="background-color: #42b883; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; font-size: 1.2rem; cursor: pointer;">+</button>
        </div>
        <p style="margin-top: 2rem; color: #666;">Note: The application is running in fallback mode. Some features may be limited.</p>
        <button id="reload-btn" style="margin-top: 1rem; background-color: #35495e; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; cursor: pointer;">Reload Application</button>
      \`;
      
      appElement.appendChild(fallbackElement);
      
      // Add minimal interactivity
      const counterValue = document.getElementById('counter-value');
      const decrementBtn = document.getElementById('decrement-btn');
      const incrementBtn = document.getElementById('increment-btn');
      const reloadBtn = document.getElementById('reload-btn');
      
      let count = 0;
      
      decrementBtn.addEventListener('click', () => {
        count--;
        counterValue.textContent = count;
      });
      
      incrementBtn.addEventListener('click', () => {
        count++;
        counterValue.textContent = count;
      });
      
      reloadBtn.addEventListener('click', () => {
        location.reload();
      });
    }
  }, 2000);
} catch (err) {
  handleError(err, 'Initialization');
}
`;

  // Create index.html file
  files['index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${config.projectName}</title>
  <link rel="icon" href="/assets/favicon.ico">
  <style>
    :root {
      --primary-color: #42b883;
      --secondary-color: #35495e;
      --bg-color: white;
      --text-color: #333;
      --border-color: #eaeaea;
      --shadow-color: rgba(0, 0, 0, 0.1);
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: var(--bg-color);
      color: var(--text-color);
      transition: background-color 0.3s, color 0.3s;
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
    
    /* Router view container */
    #router-view {
      min-height: calc(100vh - 120px);
      padding: 20px;
    }
    
    /* Dark mode support */
    .dark-theme {
      --bg-color: #1a1a1a;
      --text-color: #f0f0f0;
      --border-color: #333;
      --shadow-color: rgba(0, 0, 0, 0.3);
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #1a1a1a;
        --text-color: #f0f0f0;
        --border-color: #333;
        --shadow-color: rgba(0, 0, 0, 0.3);
      }
    }
    
    /* Error message styling */
    .error-container {
      background-color: #fff1f0;
      border: 1px solid #ffccc7;
      border-radius: 4px;
      padding: 16px;
      margin: 16px 0;
      color: #cf1322;
    }
    
    .dark-theme .error-container {
      background-color: #2a1215;
      border-color: #5c2223;
      color: #ff7875;
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
    <!-- Router view container -->
    <div id="router-view"></div>
  </div>
  
  <!-- Error handling for script loading -->
  <script>
    window.addEventListener('error', function(event) {
      if (event.target.tagName === 'SCRIPT') {
        const appElement = document.getElementById('app');
        if (appElement) {
          appElement.innerHTML = \`
            <div class="error-container">
              <h2>Script Loading Error</h2>
              <p>Failed to load: \${event.target.src || 'main script'}</p>
              <p>Please check your network connection and try again.</p>
              <button onclick="location.reload()">Reload Page</button>
            </div>
          \`;
        }
      }
    }, true);
  </script>
  
  <script type="module" src="/app/main.js"></script>
</body>
</html>`;

  // Also create a copy in the public directory for compatibility
  files['public/index.html'] = files['index.html'];

  // Create package.json file
  files['package.json'] = `{
  "name": "${config.projectName}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "start": "node start.js",
    "build": "vite build",
    "preview": "vite preview"${config.features.testing ? ',\n    "test": "vitest run",\n    "test:watch": "vitest"' : ''}${config.features.linting ? ',\n    "lint": "eslint . --ext .js",\n    "lint:fix": "eslint . --ext .js --fix"' : ''}
  },
  "dependencies": {
    "@kalxjs/core": "^${config.packageVersions['@kalxjs/core']}",
    "@kalxjs/cli": "^${config.packageVersions['@kalxjs/cli']}",
    "@kalxjs/router": "^${config.packageVersions['@kalxjs/router']}",
    "@kalxjs/store": "^${config.packageVersions['@kalxjs/store']}",
    "@kalxjs/state": "^${config.packageVersions['@kalxjs/state']}",
    "@kalxjs/ai": "^${config.packageVersions['@kalxjs/ai']}",
    "@kalxjs/api": "^${config.packageVersions['@kalxjs/api']}",
    "@kalxjs/performance": "^${config.packageVersions['@kalxjs/performance']}",
    "@kalxjs/plugins": "^${config.packageVersions['@kalxjs/plugins']}",
    "@kalxjs/composition": "^${config.packageVersions['@kalxjs/composition']}",
    "@kalxjs/devtools": "^${config.packageVersions['@kalxjs/devtools']}",
    "@kalxjs/compiler": "^${config.packageVersions['@kalxjs/compiler']}",
    "@kalxjs/compiler-plugin": "^${config.packageVersions['@kalxjs/compiler-plugin']}",
    "@kalxjs/utils": "^${config.packageVersions['@kalxjs/utils']}"
  },
  "devDependencies": {
    "vite": "^4.3.9"${config.features.scss ? ',\n    "sass": "^1.62.1"' : ''}${config.features.testing ? ',\n    "vitest": "^0.31.1",\n    "@testing-library/dom": "^9.3.0"' : ''}${config.features.linting ? ',\n    "eslint": "^8.41.0"' : ''}
  }
}`;

  // Create vite.config.js file
  files['vite.config.js'] = `import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
      '@core': path.resolve(__dirname, './app/core'),
      '@components': path.resolve(__dirname, './app/components'),
      '@assets': path.resolve(__dirname, './app/assets'),
      '@config': path.resolve(__dirname, './config')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow connections from all network interfaces
    open: true,
    strictPort: false, // Try another port if 3000 is in use
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true // Improve file watching reliability
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@kalxjs/core', '@kalxjs/router', '@kalxjs/state'],
          utils: ['@kalxjs/utils', '@kalxjs/performance']
        }
      }
    }
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
*.ntvs*`;

  // Create start script for easier startup
  files['start.js'] = `#!/usr/bin/env node
/**
 * KalxJS Application Starter
 * This script helps start your KalxJS application with proper configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for terminal output
const colors = {
  reset: '\\x1b[0m',
  bright: '\\x1b[1m',
  dim: '\\x1b[2m',
  underscore: '\\x1b[4m',
  blink: '\\x1b[5m',
  reverse: '\\x1b[7m',
  hidden: '\\x1b[8m',
  
  black: '\\x1b[30m',
  red: '\\x1b[31m',
  green: '\\x1b[32m',
  yellow: '\\x1b[33m',
  blue: '\\x1b[34m',
  magenta: '\\x1b[35m',
  cyan: '\\x1b[36m',
  white: '\\x1b[37m',
  
  bgBlack: '\\x1b[40m',
  bgRed: '\\x1b[41m',
  bgGreen: '\\x1b[42m',
  bgYellow: '\\x1b[43m',
  bgBlue: '\\x1b[44m',
  bgMagenta: '\\x1b[45m',
  bgCyan: '\\x1b[46m',
  bgWhite: '\\x1b[47m'
};

// Helper function to log with colors
function log(message, color = colors.reset) {
  console.log(\`\${color}\${message}\${colors.reset}\`);
}

// Helper function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Helper function to ensure a directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

// Check if index.html exists in both root and public directory
function checkIndexHtml() {
  const rootIndexPath = path.join(process.cwd(), 'index.html');
  const publicIndexPath = path.join(process.cwd(), 'public', 'index.html');
  
  if (!fileExists(rootIndexPath) && !fileExists(publicIndexPath)) {
    log('⚠️ No index.html found in root or public directory', colors.yellow);
    
    // Create a basic index.html file
    const indexHtml = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>KalxJS Application</title>
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
    
    #router-view {
      min-height: calc(100vh - 120px);
      padding: 20px;
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="loading">
      <h1>KalxJS Application</h1>
      <p>Loading application...</p>
      <div class="spinner"></div>
    </div>
    <div id="router-view"></div>
  </div>
  <script type="module" src="/app/main.js"></script>
</body>
</html>\`;
    
    // Create in both locations to be safe
    ensureDir(path.join(process.cwd(), 'public'));
    fs.writeFileSync(rootIndexPath, indexHtml);
    fs.writeFileSync(publicIndexPath, indexHtml);
    
    log('✅ Created index.html files', colors.green);
  }
}

// Check if vite.config.js exists and has proper configuration
function checkViteConfig() {
  const viteConfigPath = path.join(process.cwd(), 'vite.config.js');
  
  if (!fileExists(viteConfigPath)) {
    log('⚠️ No vite.config.js found', colors.yellow);
    
    // Create a basic vite.config.js file
    const viteConfig = \`import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
      '@core': path.resolve(__dirname, './app/core'),
      '@components': path.resolve(__dirname, './app/components'),
      '@assets': path.resolve(__dirname, './app/assets'),
      '@config': path.resolve(__dirname, './config')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow connections from all network interfaces
    open: true,
    strictPort: false,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: true
  }
});
\`;
    
    fs.writeFileSync(viteConfigPath, viteConfig);
    log('✅ Created vite.config.js', colors.green);
  } else {
    // Check if the vite config has the host setting
    const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf8');
    if (!viteConfigContent.includes('host:') || !viteConfigContent.includes('0.0.0.0')) {
      log('⚠️ Vite config might not have proper host configuration', colors.yellow);
      log('  Consider adding "host: \\'0.0.0.0\\'" to the server section', colors.yellow);
    }
  }
}

// Main function to start the application
async function startApp() {
  try {
    log('🚀 Starting KalxJS Application...', colors.cyan + colors.bright);
    
    // Check for required files and fix if needed
    checkIndexHtml();
    checkViteConfig();
    
    // Check if node_modules exists
    if (!fileExists(path.join(process.cwd(), 'node_modules'))) {
      log('📦 Installing dependencies...', colors.magenta);
      try {
        execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
      } catch (err) {
        log('⚠️ Failed to install dependencies with --legacy-peer-deps, trying with --force', colors.yellow);
        execSync('npm install --force', { stdio: 'inherit' });
      }
    }
    
    // Start the development server
    log('🌐 Starting development server...', colors.green);
    execSync('npm run dev', { stdio: 'inherit' });
    
  } catch (error) {
    log('❌ Error starting application:', colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run the app
startApp();
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
 * Create a test component
 * @param {string} targetDir - Target project directory
 * @param {Object} config - Project configuration
 */
async function createTestComponent(targetDir, config) {
  // Create a simple component as an example

  const testComponentPath = path.join(targetDir, 'app/components/TestComponent.js');
  const testComponentContent = `import { h, defineComponent, ref } from '@kalxjs/core';

export default defineComponent({
  name: 'TestComponent',
  
  setup() {
    const counter = ref(0);
    
    const incrementCounter = () => {
      counter.value++;
    };
    
    return {
      counter,
      incrementCounter
    };
  },
  
  render() {
    return h('div', { class: 'test-component' }, [
      h('h3', {}, ['Test Component']),
      h('p', {}, ['This is a simple test component to demonstrate component functionality.']),
      h('button', { onClick: this.incrementCounter }, [\`Clicked \${this.counter} times\`])
    ]);
  }
});`;

  await fs.writeFile(testComponentPath, testComponentContent);
}

/**
 * Install dependencies
 * @param {string} targetDir - Target project directory
 * @param {Object} config - Project configuration
 */
async function installDependencies(targetDir, config) {
  // Create a .npmrc file to always use legacy-peer-deps
  await fs.writeFile(
    path.join(targetDir, '.npmrc'),
    'legacy-peer-deps=true\n'
  );

  try {
    // First try with --legacy-peer-deps to handle peer dependency conflicts
    console.log(chalk.blue('Installing dependencies with --legacy-peer-deps...'));
    await execa('npm', ['install', '--legacy-peer-deps'], { cwd: targetDir });

    // Create a success file with helpful information
    const successText = `
# KalxJS Installation Success

Your project was set up with the following package versions:

- Core: ${config.packageVersions.core}
- Router: ${config.packageVersions.router}
- State: ${config.packageVersions.state}
- CLI: ${config.packageVersions.cli}

## Development Commands

- \`npm run dev\` - Start the development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview the production build
- \`npm run test\` - Run tests
- \`npm run lint\` - Run linting
- \`npm run format\` - Format code

## Note on Dependencies

This project uses \`legacy-peer-deps=true\` in .npmrc to handle dependency conflicts.
If you need to install additional packages, they will automatically use this setting.
`;

    await fs.writeFile(
      path.join(targetDir, 'SETUP_INFO.md'),
      successText
    );

    return true;
  } catch (firstError) {
    console.warn(chalk.yellow('First installation attempt failed, trying alternative approach...'));

    try {
      // If that fails, try with --force
      console.log(chalk.blue('Installing dependencies with --force...'));
      await execa('npm', ['install', '--force'], { cwd: targetDir });
      return true;
    } catch (secondError) {
      console.error('Failed to install dependencies:', secondError.message);

      // Create a helpful file with instructions
      const helpText = `
# KalxJS Installation Help

Installation failed: ${secondError.message}

## Troubleshooting

To fix this issue, try one of the following commands:

\`\`\`
npm install --legacy-peer-deps
\`\`\`

If that doesn't work:

\`\`\`
npm install --force
\`\`\`

## Manual Package Installation

You can also try installing packages one by one:

\`\`\`
npm install @kalxjs/core@${config.packageVersions.core}
npm install @kalxjs/router@${config.packageVersions.router}
npm install @kalxjs/state@${config.packageVersions.state}
\`\`\`

## Package Versions

These are the versions that should be compatible:
- Core: ${config.packageVersions.core}
- Router: ${config.packageVersions.router}
- State: ${config.packageVersions.state}
- CLI: ${config.packageVersions.cli}

## Additional Help

If you're still having issues, please report them at:
https://github.com/Odeneho-Calculus/kalxjs/issues
`;

      await fs.writeFile(
        path.join(targetDir, 'INSTALLATION_HELP.md'),
        helpText
      );

      // Don't throw error, just return false to indicate failure
      console.warn(chalk.yellow('Continuing without installing dependencies. Please see INSTALLATION_HELP.md for instructions.'));
      return false;
    }
  }
}

/**
 * Fetch the latest version of a package from npm
 * @param {string} packageName - Name of the package
 * @returns {Promise<string>} - Latest version
 */
function getLatestVersion(packageName) {
  return new Promise((resolve) => {
    const request = https.get(`https://registry.npmjs.org/${packageName}`, (res) => {
      // Handle redirects or errors
      if (res.statusCode !== 200) {
        console.warn(`Could not fetch latest version for ${packageName}: HTTP ${res.statusCode}`);
        resolve('1.0.0'); // Fallback version
        return;
      }

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const packageData = JSON.parse(data);
          if (packageData['dist-tags'] && packageData['dist-tags'].latest) {
            resolve(packageData['dist-tags'].latest);
          } else {
            console.warn(`No latest tag found for ${packageName}`);
            resolve('1.0.0'); // Fallback version
          }
        } catch (error) {
          console.warn(`Could not parse response for ${packageName}: ${error.message}`);
          resolve('1.0.0'); // Fallback version
        }
      });
    });

    request.on('error', (error) => {
      console.warn(`Network error fetching version for ${packageName}: ${error.message}`);
      resolve('1.0.0'); // Fallback version
    });

    // Set a timeout to avoid hanging
    request.setTimeout(5000, () => {
      console.warn(`Timeout fetching version for ${packageName}`);
      request.abort();
      resolve('1.0.0'); // Fallback version
    });
  });
}

/**
 * Fetch the latest versions of all required packages
 * @param {Object} config - Project configuration
 * @returns {Promise<Object>} - Object with package names and versions
 */
async function getLatestVersions(config) {
  // Include all possible KALXJS packages
  const packages = [
    '@kalxjs/core',
    '@kalxjs/cli',
    '@kalxjs/router',
    '@kalxjs/store', // Global state management
    '@kalxjs/state', // Component state management
    '@kalxjs/ai',
    '@kalxjs/api',
    '@kalxjs/performance',
    '@kalxjs/plugins',
    '@kalxjs/composition',
    '@kalxjs/devtools',
    '@kalxjs/compiler',
    '@kalxjs/compiler-plugin',
    '@kalxjs/utils'
  ];

  const versions = {};

  // Fetch versions in parallel
  await Promise.all(
    packages.map(async (pkg) => {
      versions[pkg] = await getLatestVersion(pkg);
    })
  );

  // Extract package names without the namespace for easier access
  Object.keys(versions).forEach(fullName => {
    const shortName = fullName.split('/')[1];
    versions[shortName] = versions[fullName];
  });

  // Log the versions we're using
  console.log('Using the following package versions:');
  Object.entries(versions)
    .filter(([key]) => !key.includes('/')) // Only show short names
    .forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

  return versions;
}

module.exports = create;
