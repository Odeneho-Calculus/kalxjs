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
    'docs/README.md': `# ${config.projectName} - KalxJS Documentation

## Introduction to KalxJS

KalxJS is a modern JavaScript framework for building user interfaces with a focus on simplicity, performance, and developer experience. It features a virtual DOM implementation, reactive components, and a modular architecture.

## Key Concepts

### Components

Components are the building blocks of KalxJS applications. Each component encapsulates its own state, logic, and UI.

\`\`\`javascript
// Example component
import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'HelloWorld',
  
  data() {
    return {
      message: 'Hello, KalxJS!'
    };
  },
  
  methods: {
    updateMessage() {
      this.message = 'Updated message!';
      this.$update(); // Trigger re-render
    }
  },
  
  render() {
    return h('div', {}, [
      h('h1', {}, [this.message]),
      h('button', { onClick: this.updateMessage }, ['Update Message'])
    ]);
  }
});
\`\`\`

### Virtual DOM

KalxJS uses a virtual DOM to efficiently update the UI. When your component's state changes, KalxJS creates a new virtual DOM tree, compares it with the previous one, and applies only the necessary changes to the real DOM.

### Reactivity

When you modify data in your component and call \`this.$update()\`, KalxJS automatically re-renders the component with the updated state.

### Routing

KalxJS includes a built-in router for creating single-page applications:

\`\`\`javascript
// Access the router in your components
this.navigateTo('/about');

// Or use the global router
window.router.push('/about');
\`\`\`

## Project Structure

\`\`\`
${config.projectName}/
├── app/                  # Application source code
│   ├── components/       # Reusable components
│   ├── core/             # Core application files
│   ├── navigation/       # Router configuration
│   ├── pages/            # Page components
│   ├── state/            # State management
│   ├── styles/           # Global styles
│   ├── utils/            # Utility functions
│   └── main.js           # Application entry point
├── assets/               # Static assets
├── config/               # Configuration files
├── docs/                 # Documentation
├── public/               # Public files
└── index.html            # HTML entry point
\`\`\`

## Further Reading

For more detailed documentation, visit the [KalxJS GitHub repository](https://github.com/Odeneho-Calculus/kalxjs).
`,
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

  // We'll copy the favicon.ico file from templates during file creation

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

  // Add onError method to the router
  router.onError = function(callback) {
    router.errorHandler = callback;
    return router;
  };

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

    files['app/pages/Home.js'] = `import { h, defineComponent } from '@kalxjs/core';
import ThemeSwitcher from '../components/ThemeSwitcher.js';
import AnimatedCounter from '../components/AnimatedCounter.js';

export default defineComponent({
  name: 'HomeView',

  components: {
    ThemeSwitcher,
    AnimatedCounter
  },

  data() {
    return {
      count: 0,
      features: [
        { id: 1, title: 'Virtual DOM', description: 'Efficient DOM updates with virtual DOM diffing' },
        { id: 2, title: 'Component System', description: 'Modular, reusable component architecture' },
        { id: 3, title: 'Reactive Data', description: 'Automatic UI updates when data changes' },
        { id: 4, title: 'Routing', description: 'Built-in client-side routing system' }
      ],
      showFeatures: false,
      activeTab: 'counter'
    };
  },

  mounted() {
    // Animate features in after a short delay
    setTimeout(() => {
      this.showFeatures = true;
      this.$update();
    }, 500);
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
    },

    setActiveTab(tab) {
      this.activeTab = tab;
      this.$update();
    },

    navigateToAbout(e) {
      e.preventDefault();

      // Add a small animation before navigation
      const homeView = document.querySelector('.home-view');
      if (homeView) {
        homeView.classList.add('fade-out');

        setTimeout(() => {
          window.router.push('/about');
        }, 300);
      } else {
        window.router.push('/about');
      }
    }
  },

  render() {
    return h('div', { class: 'home-view fade-in' }, [
      h('div', { class: 'container' }, [
        // Header section
        h('header', { class: 'page-header flex flex-between' }, [
          h('div', { class: 'logo' }, [
            h('h1', { class: 'logo-text' }, ['KalxJS']),
            h('span', { class: 'logo-tagline' }, ['Modern JavaScript Framework'])
          ]),

          // Theme switcher component
          h(ThemeSwitcher)
        ]),

        // Hero section
        h('section', { class: 'hero text-center' }, [
          h('h2', { class: 'hero-title' }, ['Welcome to KalxJS']),
          h('p', { class: 'hero-subtitle' }, [
            'A lightweight, modern JavaScript framework for building user interfaces'
          ]),

          // Tabs navigation
          h('div', { class: 'tabs mt-4' }, [
            h('div', { class: 'tab-nav' }, [
              h('button', {
                class: \`tab-btn \${this.activeTab === 'counter' ? 'active' : ''}\`,
                onClick: () => this.setActiveTab('counter')
              }, ['Counter Demo']),

              h('button', {
                class: \`tab-btn \${this.activeTab === 'features' ? 'active' : ''}\`,
                onClick: () => this.setActiveTab('features')
              }, ['Features'])
            ]),

            // Tab content
            h('div', { class: 'tab-content' }, [
              // Counter tab
              this.activeTab === 'counter' ? h('div', { class: 'tab-pane fade-in' }, [
                h('div', { class: 'card counter-demo' }, [
                  h('h3', { class: 'card-title' }, ['Interactive Counter']),

                  h('div', { class: 'counter flex flex-center' }, [
                    h('button', {
                      class: 'btn btn-circle',
                      onClick: this.decrement
                    }, ['-']),

                    h(AnimatedCounter, {
                      value: this.count,
                      duration: 500
                    }),

                    h('button', {
                      class: 'btn btn-circle',
                      onClick: this.increment
                    }, ['+'])
                  ]),

                  h('div', { class: 'text-center mt-3' }, [
                    h('button', {
                      class: 'btn btn-secondary',
                      onClick: this.resetCount
                    }, ['Reset'])
                  ])
                ])
              ]) : null,

              // Features tab
              this.activeTab === 'features' ? h('div', { class: 'tab-pane fade-in' }, [
                h('div', { class: 'features-grid' },
                  this.features.map((feature, index) =>
                    h('div', {
                      class: \`card feature-card \${this.showFeatures ? 'slide-in-right' : ''}\`,
                      style: \`animation-delay: \${index * 100}ms\`
                    }, [
                      h('h3', { class: 'card-title' }, [feature.title]),
                      h('p', {}, [feature.description])
                    ])
                  )
                )
              ]) : null
            ])
          ])
        ]),

        // Call to action
        h('div', { class: 'cta-container text-center mt-4' }, [
          h('a', {
            class: 'btn btn-pulse',
            href: '/about',
            onClick: this.navigateToAbout
          }, ['Explore More Features'])
        ])
      ])
    ]);
  }
});`;

    files['app/pages/About.js'] = `import { h, defineComponent } from '@kalxjs/core';
import ThemeSwitcher from '../components/ThemeSwitcher.js';

export default defineComponent({
  name: 'AboutView',

  components: {
    ThemeSwitcher
  },

  data() {
    return {
      features: [
        {
          title: 'Virtual DOM',
          description: 'Efficiently updates the UI by comparing virtual DOM representations and applying only the necessary changes to the real DOM.',
          icon: '🔄'
        },
        {
          title: 'Component System',
          description: 'Build encapsulated, reusable components that manage their own state and can be composed to create complex UIs.',
          icon: '🧩'
        },
        {
          title: 'Reactive Data',
          description: 'Automatically updates the UI when the underlying data changes, making state management simple and intuitive.',
          icon: '⚡'
        },
        {
          title: 'Routing',
          description: 'Built-in client-side routing with support for nested routes, route parameters, and navigation guards.',
          icon: '🧭'
        },
        {
          title: 'State Management',
          description: 'Centralized state management for complex applications with predictable state mutations.',
          icon: '📦'
        },
        {
          title: 'Developer Tools',
          description: 'Comprehensive developer tools for debugging, performance monitoring, and state inspection.',
          icon: '🛠️'
        }
      ],
      activeFeature: null,
      showBackToTop: false
    };
  },

  mounted() {
    // Add scroll listener for back-to-top button
    window.addEventListener('scroll', this.handleScroll);

    // Animate features in sequence
    this.animateFeaturesSequentially();
  },

  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },

  methods: {
    handleScroll() {
      this.showBackToTop = window.scrollY > 300;
      this.$update();
    },

    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    },

    setActiveFeature(index) {
      this.activeFeature = this.activeFeature === index ? null : index;
      this.$update();
    },

    animateFeaturesSequentially() {
      const featureElements = document.querySelectorAll('.feature-card');

      featureElements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('fade-in');
        }, 100 * index);
      });
    },

    navigateToHome(e) {
      e.preventDefault();

      // Add a small animation before navigation
      const aboutView = document.querySelector('.about-view');
      if (aboutView) {
        aboutView.classList.add('fade-out');

        setTimeout(() => {
          window.router.push('/');
        }, 300);
      } else {
        window.router.push('/');
      }
    }
  },

  render() {
    return h('div', { class: 'about-view fade-in' }, [
      h('div', { class: 'container' }, [
        // Header section
        h('header', { class: 'page-header flex flex-between' }, [
          h('div', { class: 'logo' }, [
            h('h1', { class: 'logo-text' }, ['KalxJS']),
            h('span', { class: 'logo-tagline' }, ['Modern JavaScript Framework'])
          ]),

          // Theme switcher component
          h(ThemeSwitcher)
        ]),

        // About section
        h('section', { class: 'about-section' }, [
          h('h2', { class: 'section-title' }, ['About KalxJS']),

          h('div', { class: 'about-content' }, [
            h('p', { class: 'lead-text' }, [
              'KalxJS is a modern JavaScript framework designed for building fast, interactive user interfaces with a focus on simplicity and performance.'
            ]),

            h('p', {}, [
              'Built with a virtual DOM implementation and a reactive component system, KalxJS makes it easy to create complex applications that respond instantly to data changes.'
            ]),

            h('div', { class: 'tech-stack mt-4' }, [
              h('h3', {}, ['Technology Stack']),

              h('div', { class: 'tech-badges' }, [
                h('span', { class: 'badge' }, ['JavaScript']),
                h('span', { class: 'badge' }, ['Virtual DOM']),
                h('span', { class: 'badge' }, ['Reactive']),
                h('span', { class: 'badge' }, ['Component-Based']),
                h('span', { class: 'badge' }, ['Router']),
                h('span', { class: 'badge' }, ['State Management'])
              ])
            ])
          ])
        ]),

        // Features section
        h('section', { class: 'features-section mt-4' }, [
          h('h2', { class: 'section-title' }, ['Key Features']),

          h('div', { class: 'features-grid' },
            this.features.map((feature, index) =>
              h('div', {
                class: \`feature-card \${this.activeFeature === index ? 'active' : ''}\`,
                onClick: () => this.setActiveFeature(index)
              }, [
                h('div', { class: 'feature-icon' }, [feature.icon]),
                h('h3', { class: 'feature-title' }, [feature.title]),
                h('p', { class: 'feature-description' }, [feature.description])
              ])
            )
          )
        ]),

        // Getting started section
        h('section', { class: 'getting-started-section mt-4' }, [
          h('h2', { class: 'section-title' }, ['Getting Started']),

          h('div', { class: 'card code-card' }, [
            h('h3', { class: 'card-title' }, ['Installation']),

            h('pre', { class: 'code-block' }, [
              h('code', {}, ['npm install @kalxjs/core @kalxjs/router @kalxjs/state'])
            ]),

            h('h3', { class: 'card-title mt-4' }, ['Create Your First Component']),

            h('pre', { class: 'code-block' }, [
              h('code', {}, [
                \`import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'HelloWorld',
  
  data() {
    return {
      message: 'Hello, KalxJS!'
    };
  },
  
  render() {
    return h('div', {}, [
      h('h1', {}, [this.message])
    ]);
  }
});\`
              ])
            ])
          ])
        ]),

        // Navigation
        h('div', { class: 'navigation-container text-center mt-4' }, [
          h('a', {
            class: 'btn btn-outline',
            href: '/',
            onClick: this.navigateToHome
          }, ['Back to Home'])
        ]),

        // Back to top button
        this.showBackToTop ? h('button', {
          class: 'back-to-top-btn',
          onClick: this.scrollToTop
        }, ['↑']) : null
      ])
    ]);
  }
});`;

    files['app/pages/NotFound.js'] = `import { h, defineComponent } from '@kalxjs/core';
import ThemeSwitcher from '../components/ThemeSwitcher.js';

export default defineComponent({
  name: 'NotFoundView',

  components: {
    ThemeSwitcher
  },

  data() {
    return {
      animationActive: false
    };
  },

  mounted() {
    // Start animation after a short delay
    setTimeout(() => {
      this.animationActive = true;
      this.$update();
    }, 100);
  },

  methods: {
    navigateToHome(e) {
      e.preventDefault();

      // Add a small animation before navigation
      const notFoundView = document.querySelector('.not-found-view');
      if (notFoundView) {
        notFoundView.classList.add('fade-out');

        setTimeout(() => {
          window.router.push('/');
        }, 300);
      } else {
        window.router.push('/');
      }
    }
  },

  render() {
    return h('div', { class: 'not-found-view fade-in' }, [
      h('div', { class: 'container' }, [
        // Header with theme switcher
        h('header', { class: 'page-header flex flex-between' }, [
          h('div', { class: 'logo' }, [
            h('h1', { class: 'logo-text' }, ['KalxJS']),
            h('span', { class: 'logo-tagline' }, ['Modern JavaScript Framework'])
          ]),

          h(ThemeSwitcher)
        ]),

        // 404 content
        h('div', { class: 'not-found-content text-center' }, [
          h('div', {
            class: \`error-code \${this.animationActive ? 'animate' : ''}\`
          }, ['404']),

          h('h1', { class: 'error-title' }, ['Page Not Found']),

          h('p', { class: 'error-message' }, [
            'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.'
          ]),

          h('div', { class: 'error-illustration' }, [
            h('div', { class: 'planet' }, []),
            h('div', { class: 'astronaut' }, []),
            h('div', { class: 'stars' }, [
              ...[...Array(20)].map((_, i) =>
                h('div', {
                  class: 'star',
                  style: \`
                    top: \${Math.random() * 100}%;
                    left: \${Math.random() * 100}%;
                    animation-delay: \${Math.random() * 2}s;
                  \`
                }, [])
              )
            ])
          ]),

          h('div', { class: 'navigation-container mt-4' }, [
            h('a', {
              class: 'btn btn-pulse',
              href: '/',
              onClick: this.navigateToHome
            }, ['Return to Home Page'])
          ])
        ])
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
@use "sass:color";
@use "sass:map";

// Theme Variables
$themes: (
  "default": (
    primary-color: #42b883,
    secondary-color: #35495e,
    accent-color: #e7c000
  ),
  "blue": (
    primary-color: #3498db,
    secondary-color: #2c3e50,
    accent-color: #f39c12
  ),
  "purple": (
    primary-color: #9b59b6,
    secondary-color: #34495e,
    accent-color: #f1c40f
  ),
  "orange": (
    primary-color: #e67e22,
    secondary-color: #2c3e50,
    accent-color: #3498db
  )
);

// Base Variables
$primary-color: #42b883;
$secondary-color: #35495e;
$light-color: #f8f9fa;
$dark-color: #343a40;
$border-radius: 8px;
$box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
$transition-speed: 0.3s;

// Global styles
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--bg-color);
  margin: 0;
  padding: 0;
  transition: background-color $transition-speed ease, color $transition-speed ease;
}

a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color $transition-speed ease;

  &:hover {
    color: color.adjust(vars.$primary-color, $lightness: -10%);
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
  background-color: var(--primary-color);
  color: white;
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
  transition: all $transition-speed ease;
  font-weight: 500;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.btn-secondary {
    background-color: var(--secondary-color);
  }
  
  &.btn-outline {
    background-color: transparent;
    border: 2px solid var(--primary-color);
    color: var(--primary-color);
    
    &:hover {
      background-color: var(--primary-color);
      color: white;
    }
  }
}

// Card component
.card {
  background-color: var(--card-bg);
  border-radius: $border-radius;
  box-shadow: $box-shadow;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: transform $transition-speed ease, box-shadow $transition-speed ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
  
  .card-title {
    margin-top: 0;
    color: var(--primary-color);
    font-weight: 600;
  }
}

// Form elements
input, textarea, select {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid var(--input-border);
  border-radius: $border-radius;
  background-color: var(--input-bg);
  color: var(--text-color);
  transition: border-color $transition-speed ease, box-shadow $transition-speed ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
  }
}

// Utility classes
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-left { text-align: left; }

.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.flex-grow { flex-grow: 1; }

.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mt-3 { margin-top: 1.5rem; }
.mt-4 { margin-top: 2rem; }

.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 2rem; }

.p-1 { padding: 0.5rem; }
.p-2 { padding: 1rem; }
.p-3 { padding: 1.5rem; }
.p-4 { padding: 2rem; }

// CSS Variables for theming
:root {
  // Default theme (light)
  --primary-color: #{$primary-color};
  --secondary-color: #{$secondary-color};
  --light-color: #{$light-color};
  --dark-color: #{$dark-color};
  --border-radius: #{$border-radius};
  --box-shadow: #{$box-shadow};

  // Light theme colors
  --bg-color: #ffffff;
  --bg-secondary: #{$light-color};
  --text-color: #{$dark-color};
  --border-color: #e1e1e1;
  --card-bg: #ffffff;
  --input-bg: #ffffff;
  --input-border: #d1d1d1;
  --code-bg: #f5f5f5;
}

// Dark theme
[data-theme="dark"] {
  --bg-color: #121212;
  --bg-secondary: #1e1e1e;
  --text-color: #f0f0f0;
  --border-color: #333333;
  --card-bg: #1e1e1e;
  --input-bg: #2a2a2a;
  --input-border: #444444;
  --code-bg: #2a2a2a;

  .card {
    background-color: var(--card-bg);
  }

  .btn-outline {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  code {
    background-color: var(--code-bg);
    color: #e83e8c;
  }
}

/* Dark theme styles - applied directly and aggressively */
html.dark-theme {
  background-color: #1a1a1a !important;
}

html.dark-theme body {
  background-color: #1a1a1a !important;
  color: #f0f0f0 !important;
}

html.dark-theme .app-header,
html.dark-theme header,
html.dark-theme nav {
  background-color: #2a2a2a !important;
  border-bottom: 1px solid #444444 !important;
  color: #f0f0f0 !important;
}

html.dark-theme .welcome-banner,
html.dark-theme .features-section,
html.dark-theme .card,
html.dark-theme .tab-content,
html.dark-theme .counter-demo {
  background-color: #2a2a2a !important;
  color: #f0f0f0 !important;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
}

html.dark-theme .btn-primary {
  background-color: #42d392 !important;
}

html.dark-theme .btn-secondary {
  background-color: #2c3e50 !important;
}

html.dark-theme a {
  color: #42d392 !important;
}

html.dark-theme .text-secondary {
  color: #aaaaaa !important;
}

html.dark-theme h1, 
html.dark-theme h2, 
html.dark-theme h3, 
html.dark-theme h4, 
html.dark-theme h5, 
html.dark-theme h6 {
  color: #f0f0f0 !important;
}

html.dark-theme .counter-value {
  color: #42d392 !important;
}

/* Ensure theme transition is smooth */
html, 
body, 
.app-header, 
.card, 
.welcome-banner, 
.features-section {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
}

// Generate theme color variables
@each $theme-name, $theme-colors in $themes {
  [data-color-theme="#{$theme-name}"] {
    --primary-color: #{map.get($theme-colors, primary-color)};
    --secondary-color: #{map.get($theme-colors, secondary-color)};
    --accent-color: #{map.get($theme-colors, accent-color)};
  }
}

// Responsive utilities
@media (max-width: 768px) {
  .hide-mobile {
    display: none !important;
  }
  
  .container {
    padding: 0 10px;
  }
}`;

    files['app/styles/animations.scss'] = `// Animation styles

// Animated Counter
.animated-counter {
    display: inline-block;

    .counter-value {
        font-size: 3rem;
        font-weight: bold;
        color: var(--primary-color);
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        transition: color 0.3s ease;
    }
}

// Page transitions
.page-enter {
    opacity: 0;
    transform: translateY(20px);
}

.page-enter-active {
    transition: opacity 0.5s ease, transform 0.5s ease;
}

.page-enter-to {
    opacity: 1;
    transform: translateY(0);
}

.page-leave {
    opacity: 1;
    transform: translateY(0);
}

.page-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

// Button animations
@keyframes pulse {
    0% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
    }

    70% {
        transform: scale(1.05);
        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
    }

    100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
    }
}

.btn-pulse {
    animation: pulse 1.5s infinite;
}

// Loading spinner
.spinner {
    width: 40px;
    height: 40px;
    margin: 20px auto;
    border: 4px solid rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    border-top-color: var(--primary-color);
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

// Fade animations
.fade-in {
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.fade-out {
    animation: fadeOut 0.5s ease-out;
}

@keyframes fadeOut {
    from {
        opacity: 1;
    }

    to {
        opacity: 0;
    }
}

// Slide animations
.slide-in-right {
    animation: slideInRight 0.5s ease-out;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.slide-in-left {
    animation: slideInLeft 0.5s ease-out;
}

@keyframes slideInLeft {
    from {
        transform: translateX(-100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

// Bounce animation
.bounce {
    animation: bounce 0.5s;
}

@keyframes bounce {
    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }

    40% {
        transform: translateY(-20px);
    }

    60% {
        transform: translateY(-10px);
    }
}`;

    files['app/styles/theme-switcher.scss'] = `// Theme Switcher Component Styles
@use 'sass:color';
@use './variables' as vars;

.theme-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background-color: var(--bg-secondary);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.theme-icon {
  font-size: 1.2rem;
  transition: transform 0.5s ease;
}

.theme-text {
  font-weight: 500;
}

// Animation for theme icon
@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.rotate {
  animation: rotate 0.5s ease-in-out;
}

// Dark theme specific styles for the switcher
html.dark-theme .theme-switcher {
  background-color: #2a2a2a;
  color: #f0f0f0;
  border-color: #444444;
}

// Responsive styles
@media (max-width: 768px) {
  .theme-switcher {
    padding: 8px;
    
    .theme-text {
      display: none;
    }
  }
}`;

    files['app/styles/app.scss'] = `// App-specific styles

// Variables
$header-height: 60px;
$footer-height: 60px;
$primary-color: #42b883;
$secondary-color: #35495e;
$light-bg: #ffffff;
$dark-bg: #1a1a1a;
$light-text: #333333;
$dark-text: #f0f0f0;
$border-radius: 4px;
$box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

// App container
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg-color, $light-bg);
  color: var(--text-color, $light-text);
  transition: background-color 0.3s, color 0.3s;
}

// Header styles
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: $header-height;
  padding: 0 20px;
  background-color: var(--bg-secondary, $secondary-color);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  .logo-container {
    display: flex;
    align-items: center;
    
    .logo {
      height: 40px;
      margin-right: 10px;
      cursor: pointer;
    }
    
    .app-title {
      font-size: 1.5rem;
      margin: 0;
    }
  }
  
  .app-nav {
    display: flex;
    gap: 20px;
    
    .nav-link {
      color: white;
      text-decoration: none;
      padding: 5px 10px;
      border-radius: 4px;
      transition: background-color 0.2s;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      &.active {
        background-color: rgba(255, 255, 255, 0.2);
        font-weight: bold;
      }
    }
    
    .theme-switcher-container {
      display: flex;
      align-items: center;
    }
    
    .theme-switcher {
      background: none;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      cursor: pointer;
      padding: 5px 10px;
      border-radius: $border-radius;
      display: flex;
      align-items: center;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .theme-icon {
        margin-right: 8px;
        font-size: 1.2rem;
      }
      
      .theme-text {
        font-size: 0.9rem;
      }
    }
    
    .theme-toggle {
      background: none;
      border: none;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 5px 10px;
      border-radius: 4px;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }
}

// Main content area
.app-main {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

// Footer styles
.app-footer {
  height: $footer-height;
  background-color: var(--bg-secondary, $secondary-color);
  color: white;
  
  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    padding: 0 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .copyright {
    margin: 0;
  }
  
  .footer-links {
    display: flex;
    gap: 20px;
    
    a {
      color: white;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

// Dark theme
.dark-theme {
  --bg-color: #{$dark-bg};
  --text-color: #{$dark-text};
  --bg-secondary: #2a2a2a;
  --border-color: #444444;
  --card-bg: #2a2a2a;
  --input-bg: #333333;
  --input-border: #555555;
  --code-bg: #333333;
  
  .app-header, .app-footer {
    background-color: #2a2a2a;
  }
  
  .theme-switcher {
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  button, .button {
    &.primary {
      background-color: darken($primary-color, 10%);
    }
    
    &.secondary {
      background-color: darken($secondary-color, 10%);
    }
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    height: auto;
    padding: 10px;
    
    .logo-container {
      margin-bottom: 10px;
    }
    
    .app-nav {
      width: 100%;
      justify-content: center;
      flex-wrap: wrap;
      
      .theme-switcher {
        .theme-text {
          display: none;
        }
        
        .theme-icon {
          margin-right: 0;
        }
      }
    }
  }
  
  .app-footer {
    .footer-content {
      flex-direction: column;
      padding: 10px;
      height: auto;
      
      .copyright {
        margin-bottom: 10px;
      }
    }
  }
}`;

  }

  // Create App.js file
  files['app/core/App.js'] = `import { h, defineComponent, onMounted, ref } from '@kalxjs/core';
    // Import the app styles
    import '../styles/app.scss';
    // Import ThemeSwitcher component
    import ThemeSwitcher from '../components/ThemeSwitcher.js';

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

    // Lifecycle hooks
    onMounted(() => {
      console.log('App component mounted');

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
      activeRoute
    };
  },

  // Add render function to ensure it works properly
  render() {
    return h('div', {
      class: 'app'
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
          // Import and use ThemeSwitcher component
          h('div', { class: 'theme-switcher-container' }, [
            h(ThemeSwitcher)
          ]),
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
          }, ['Features'])
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
        const module = await import(/* @vite-ignore */ packageName);
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
${config.features.router ? `let routerVersion = '${config.packageVersions['@kalxjs/router']}';` : ''}
${config.features.state ? `let stateVersion = '${config.packageVersions['@kalxjs/state']}';` : ''}
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
<html lang="en" class="dark-theme">
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
    
    /* Dark theme variables - applied by default */
    .dark-theme {
      --primary-color: #4ecca3;
      --secondary-color: #30475e;
      --bg-color: #121212;
      --text-color: #ffffff;
      --border-color: #333333;
      --shadow-color: rgba(0, 0, 0, 0.5);
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
`;

  // Create README.md file
  files['README.md'] = `# ${config.projectName}

> This project was created with KalxJS CLI.

## Description

*[Add your project description here]*

## Features

- *[List your project features here]*
- Built with KalxJS framework
- Responsive design
- Dark/light theme support
${config.features.router ? '- ✅ Router\n' : ''}${config.features.state ? '- ✅ State Management\n' : ''}${config.features.scss ? '- ✅ SCSS Support\n' : ''}${config.features.sfc ? '- ✅ Single File Components\n' : ''}${config.features.api ? '- ✅ API Integration\n' : ''}${config.features.composition ? '- ✅ Composition API\n' : ''}${config.features.performance ? '- ✅ Performance Utilities\n' : ''}${config.features.plugins ? '- ✅ Plugin System\n' : ''}${config.features.testing ? '- ✅ Testing\n' : ''}${config.features.linting ? '- ✅ Linting\n' : ''}${config.features.customRenderer ? '- ✅ Custom Renderer\n' : ''}

## Project Setup

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
\`\`\`

${config.features.testing ? '### Testing\n\n```bash\n# Run tests\nnpm run test\n\n# Run tests in watch mode\nnpm run test:watch\n```\n\n' : ''}
${config.features.linting ? '### Linting\n\n```bash\n# Lint files\nnpm run lint\n\n# Fix linting issues\nnpm run lint:fix\n```\n\n' : ''}

## KalxJS CLI Commands

The following commands are available with KalxJS CLI:

\`\`\`bash
# Create a new component
npx kalxjs create:component MyComponent

# Create a new page
npx kalxjs create:page MyPage

# Create a new service
npx kalxjs create:service MyService

# Generate a new route
npx kalxjs create:route /my-route MyPage
\`\`\`

## Project Structure

See the [KalxJS Documentation](./docs/README.md) for more information about the project structure and framework concepts.

## Customization

### Configuration

Edit the \`config/app.config.js\` file to customize your application settings.

### Styling

Global styles are located in \`app/styles/\`. The application uses ${config.features.scss ? 'SCSS' : 'CSS'} for styling.

## Documentation

For more information, please refer to the [KalxJS documentation](https://github.com/Odeneho-Calculus/kalxjs).

## License

*[Add your license information here]*
`;

  // Create all files
  for (const [filePath, content] of Object.entries(files)) {
    await fs.writeFile(path.join(targetDir, filePath), content);
  }

  // Copy favicon.ico from templates
  const faviconSourcePath = path.join(__dirname, '../templates/favicon.ico');
  const faviconTargetPath = path.join(targetDir, 'public/assets/favicon.ico');

  try {
    // Ensure the target directory exists
    await fs.mkdir(path.dirname(faviconTargetPath), { recursive: true });

    // Copy the favicon file
    await fs.copyFile(faviconSourcePath, faviconTargetPath);
    console.log('✅ Copied favicon.ico from templates');
  } catch (error) {
    console.error('⚠️ Error copying favicon.ico:', error.message);
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

  // Create a ThemeSwitcher component
  const themeSwitcherPath = path.join(targetDir, 'app/components/ThemeSwitcher.js');
  const themeSwitcherContent = `import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'ThemeSwitcher',

  data() {
    return {
      isDarkTheme: true, // Set default to true for dark theme
    };
  },

  mounted() {
    console.log('ThemeSwitcher mounting...');

    // Check if user has a theme preference stored
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      console.log('Found stored theme preference:', storedTheme);
      this.isDarkTheme = storedTheme === 'dark';
    } else {
      // Set dark theme as default
      console.log('No stored theme, setting dark theme as default.');
      this.isDarkTheme = true;
      localStorage.setItem('theme', 'dark');
    }

    // Apply theme immediately
    this.applyTheme();
    this.$update();

    console.log('ThemeSwitcher mounted, dark theme:', this.isDarkTheme);
  },

  methods: {
    // Apply theme to document
    applyTheme() {
      console.log('Applying theme:', this.isDarkTheme ? 'dark' : 'light');

      if (this.isDarkTheme) {
        document.documentElement.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        document.body.style.backgroundColor = '#121212';
        document.body.style.color = '#ffffff';
      } else {
        document.documentElement.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#333333';
      }

      // Force a repaint to ensure styles are applied
      const repaint = document.body.offsetHeight;
    },

    // Toggle theme function - simplified to match counter pattern
    toggleTheme() {
      console.log('Toggle theme clicked, current:', this.isDarkTheme);
      this.isDarkTheme = !this.isDarkTheme;
      this.applyTheme();
      this.$update();
    }
  },

  render() {
    // Create a simple button similar to the counter buttons
    return h('div', {
      class: 'theme-switcher-wrapper',
      style: 'display: flex; align-items: center; justify-content: center;'
    }, [
      h('button', {
        class: 'theme-button',
        onClick: this.toggleTheme,
        style: \`
          width: 50px; 
          height: 50px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 1.5rem; 
          background-color: var(--primary-color); 
          color: white; 
          cursor: pointer; 
          transition: all 0.3s ease;
          border: none;
          outline: none;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        \`
      }, [
        this.isDarkTheme ? '☀️' : '🌙'
      ]),

      h('span', {
        style: 'margin-left: 10px; font-weight: 500;'
      }, [
        this.isDarkTheme ? 'Light Mode' : 'Dark Mode'
      ])
    ]);
  }
});`;

  await fs.writeFile(themeSwitcherPath, themeSwitcherContent);

  // Create an AnimatedCounter component
  const animatedCounterPath = path.join(targetDir, 'app/components/AnimatedCounter.js');
  const animatedCounterContent = `import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
    name: 'AnimatedCounter',

    props: {
        value: {
            type: Number,
            default: 0
        },
        duration: {
            type: Number,
            default: 1000
        }
    },

    data() {
        return {
            displayValue: 0,
            animationId: null
        };
    },

    mounted() {
        this.animateToValue(this.value);
    },

    updated() {
        console.log('AnimatedCounter updated, value:', this.value, 'displayValue:', this.displayValue);
        // Always animate to the new value when updated
        this.animateToValue(this.value);
    },

    beforeUnmount() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    },

    methods: {
        animateToValue(targetValue) {
            // Cancel any ongoing animation
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }

            const startValue = this.displayValue;
            const startTime = performance.now();
            const changeInValue = targetValue - startValue;

            const animate = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / this.duration, 1);

                // Easing function (ease-out-cubic)
                const easedProgress = 1 - Math.pow(1 - progress, 3);

                this.displayValue = Math.round(startValue + changeInValue * easedProgress);
                this.$update();

                if (progress < 1) {
                    this.animationId = requestAnimationFrame(animate);
                } else {
                    this.displayValue = targetValue;
                    this.animationId = null;
                    this.$update();
                }
            };

            this.animationId = requestAnimationFrame(animate);
        }
    },

    render() {
        console.log('Rendering AnimatedCounter with value:', this.value, 'displayValue:', this.displayValue);
        
        // Force the display value to match the actual value if they're different
        // This ensures the counter always shows the correct value
        if (this.value !== this.displayValue && !this.animationId) {
            this.displayValue = this.value;
        }
        
        return h('div', { 
            class: 'animated-counter',
            style: 'font-size: 3rem; font-weight: bold; color: var(--primary-color); min-width: 80px; text-align: center;'
        }, [
            h('span', { 
                class: 'counter-value',
                style: 'display: inline-block; transition: transform 0.2s ease;'
            }, [String(this.displayValue)])
        ]);
    }
});`;

  await fs.writeFile(animatedCounterPath, animatedCounterContent);

  // Create the theme-switcher.scss file
  const themeSwitcherStylePath = path.join(targetDir, 'app/styles/theme-switcher.scss');
  const themeSwitcherStyleContent = `// Theme Switcher Styles
@use 'sass:color';
@use './variables' as vars;

.theme-switcher {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 20px;
    background-color: var(--bg-secondary);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    z-index: 10;
    /* Ensure it's above other elements */
    font-weight: 500;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
    outline: none;

    /* Make it more noticeable */
    &::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border-radius: 22px;
        background: transparent;
        border: 2px solid transparent;
        transition: all 0.3s ease;
        pointer-events: none;
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

        &::before {
            border-color: var(--primary-color);
        }
    }

    &:active {
        transform: translateY(0);
        background-color: var(--primary-color);
        color: white;
    }

    &:focus {
        outline: none;

        &::before {
            border-color: var(--primary-color);
        }
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
}

.theme-icon {
    font-size: 1.2rem;
    transition: transform 0.5s ease;
}

.theme-text {
    font-weight: 500;
}

// Animation for theme icon
@keyframes rotate {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.rotate {
    animation: rotate 0.5s ease-in-out;
}

// Dark theme specific styles for the switcher - enhanced
html.dark-theme .theme-switcher {
    background-color: #1e1e1e;
    color: #ffffff;
    border-color: #333333;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

    &:hover {
        background-color: #252525;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    }

    &:active {
        transform: translateY(0);
        background-color: #2a2a2a;
    }
}

// Responsive styles
@media (max-width: 768px) {
    .theme-switcher {
        padding: 8px;
        
        .theme-text {
            display: none;
        }
    }
}`;

  await fs.writeFile(themeSwitcherStylePath, themeSwitcherStyleContent);

  // Create the animations.scss file
  const animationsStylePath = path.join(targetDir, 'app/styles/animations.scss');
  const animationsStyleContent = `// Animation styles
@use 'sass:color';
@use './variables' as vars;

// Animated Counter
.animated-counter {
    display: inline-block;

    .counter-value {
        font-size: 3rem;
        font-weight: bold;
        color: var(--primary-color);
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        transition: color 0.3s ease;
    }
}

// Page transitions
.page-enter {
    opacity: 0;
    transform: translateY(20px);
}

.page-enter-active {
    transition: opacity 0.5s ease, transform 0.5s ease;
}

.page-enter-to {
    opacity: 1;
    transform: translateY(0);
}

.page-leave {
    opacity: 1;
    transform: translateY(0);
}

.page-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

// Button animations
@keyframes pulse {
    0% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(var(--primary-color), 0.7);
    }

    70% {
        transform: scale(1.05);
        box-shadow: 0 0 0 10px rgba(var(--primary-color), 0);
    }

    100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(var(--primary-color), 0);
    }
}

.btn-pulse {
    animation: pulse 1.5s infinite;
}

// Loading spinner
.spinner {
    width: 40px;
    height: 40px;
    margin: 20px auto;
    border: 4px solid rgba(var(--primary-color), 0.3);
    border-radius: 50%;
    border-top-color: var(--primary-color);
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

// Fade animations
.fade-in {
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.fade-out {
    animation: fadeOut 0.5s ease-out;
}

@keyframes fadeOut {
    from {
        opacity: 1;
    }

    to {
        opacity: 0;
    }
}

// Slide animations
.slide-in-right {
    animation: slideInRight 0.5s ease-out;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.slide-in-left {
    animation: slideInLeft 0.5s ease-out;
}

@keyframes slideInLeft {
    from {
        transform: translateX(-100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

// Bounce animation
.bounce {
    animation: bounce 0.5s;
}

@keyframes bounce {

    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }

    40% {
        transform: translateY(-20px);
    }

    60% {
        transform: translateY(-10px);
    }
}

// Button hover effects
.btn {
    transition: all 0.3s ease;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    &:active {
        transform: translateY(1px);
    }
}

// Theme switcher animation
.theme-button {
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    
    &:hover {
        transform: scale(1.1) rotate(15deg);
        box-shadow: 0 6px 10px rgba(0, 0, 0, 0.3);
    }
}`;

  await fs.writeFile(animationsStylePath, animationsStyleContent);

  // Update the main.scss file to import the new styles
  const mainScssPath = path.join(targetDir, 'app/styles/main.scss');
  const mainScssContent = `// Main Styles for KalxJS Application

// Import variables and theme
@use './variables' as vars;

// Import component styles
@use './theme-switcher';
@use './animations';
@use 'sass:color';

// Global styles
:root {
  --primary-color: #42b883;
  --secondary-color: #35495e;
  --accent-color: #ff7e67;
  --bg-color: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-color: #333333;
  --text-secondary: #666666;
  --border-color: #dddddd;
  --shadow-color: rgba(0, 0, 0, 0.1);
  --success-color: #4caf50;
  --warning-color: #ff9800;
  --error-color: #f44336;
  --info-color: #2196f3;
}

// Dark theme variables - enhanced for better visual appeal
.dark-theme {
  --primary-color: #4ecca3; // Brighter green for better visibility
  --secondary-color: #30475e; // Richer blue-gray
  --accent-color: #ff7f50; // Coral accent for better contrast
  --bg-color: #121212; // Deeper dark background (Material dark theme standard)
  --bg-secondary: #1e1e1e; // Slightly lighter than main bg
  --text-color: #ffffff; // Pure white text for better readability
  --text-secondary: #b0b0b0; // Lighter secondary text
  --border-color: #333333; // Subtle borders
  --shadow-color: rgba(0, 0, 0, 0.5); // Stronger shadows for depth
}

/* Dark theme styles - applied directly and aggressively with enhanced colors */
html.dark-theme {
  background-color: #121212 !important;
}

html.dark-theme body {
  background-color: #121212 !important;
  color: #ffffff !important;
}

.dark-theme .app-header {
  background-color: #1e1e1e !important;
  border-bottom: 1px solid #333333 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
}

.dark-theme .welcome-banner,
.dark-theme .features-section,
.dark-theme .card {
  background-color: #1e1e1e !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
  border: 1px solid #333333 !important;
}

.dark-theme .btn-primary {
  background-color: #4ecca3 !important;
  color: white !important;
  font-weight: 700 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important;
}

.dark-theme .btn-primary:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4) !important;
  text-decoration: none !important;
}

.dark-theme .btn-secondary {
  background-color: #30475e !important;
  color: white !important;
  font-weight: 600 !important;
}

.dark-theme a {
  color: #4ecca3 !important;
  text-decoration: none !important;
  transition: all 0.3s ease !important;
}

.dark-theme a:hover {
  color: #5fddaf !important;
  text-decoration: underline !important;
}

.dark-theme .text-secondary {
  color: #aaaaaa !important;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--bg-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.3s ease;
  
  &:hover {
    text-decoration: underline;
  }
}

button, .btn {
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
  }
  
  &.btn-primary {
    background-color: var(--primary-color);
    color: white;
    
    &:hover {
      background-color: color.adjust(#42b883, $lightness: -10%);
    }
  }
  
  &.btn-secondary {
    background-color: var(--secondary-color);
    color: white;
    
    &:hover {
      background-color: color.adjust(#35495e, $lightness: -10%);
    }
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
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

.p-1 { padding: 0.5rem; }
.p-2 { padding: 1rem; }
.p-3 { padding: 1.5rem; }
.p-4 { padding: 2rem; }

// Responsive grid
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}`;

  await fs.writeFile(mainScssPath, mainScssContent);

  // Create variables.scss file
  const variablesScssPath = path.join(targetDir, 'app/styles/variables.scss');
  const variablesScssContent = `// Variables for KalxJS Application

// Colors
$primary-color: #42b883;
$secondary-color: #35495e;
$accent-color: #ff7e67;
$bg-color: #ffffff;
$bg-secondary: #f5f5f5;
$text-color: #333333;
$text-secondary: #666666;
$border-color: #dddddd;
$shadow-color: rgba(0, 0, 0, 0.1);
$success-color: #4caf50;
$warning-color: #ff9800;
$error-color: #f44336;
$info-color: #2196f3;

// Dark theme colors
$dark-primary-color: #42d392;
$dark-secondary-color: #2c3e50;
$dark-accent-color: #ff9e7d;
$dark-bg-color: #1a1a1a;
$dark-bg-secondary: #2a2a2a;
$dark-text-color: #f0f0f0;
$dark-text-secondary: #aaaaaa;
$dark-border-color: #444444;
$dark-shadow-color: rgba(0, 0, 0, 0.3);

// Spacing
$spacing-xs: 0.25rem;
$spacing-sm: 0.5rem;
$spacing-md: 1rem;
$spacing-lg: 1.5rem;
$spacing-xl: 2rem;
$spacing-xxl: 3rem;

// Breakpoints
$breakpoint-xs: 480px;
$breakpoint-sm: 768px;
$breakpoint-md: 992px;
$breakpoint-lg: 1200px;

// Typography
$font-family-base: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
$font-family-heading: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
$font-family-mono: 'Courier New', Courier, monospace;

$font-size-xs: 0.75rem;
$font-size-sm: 0.875rem;
$font-size-md: 1rem;
$font-size-lg: 1.25rem;
$font-size-xl: 1.5rem;
$font-size-xxl: 2rem;
$font-size-xxxl: 3rem;

// Border radius
$border-radius-sm: 2px;
$border-radius-md: 4px;
$border-radius-lg: 8px;
$border-radius-xl: 16px;
$border-radius-circle: 50%;

// Shadows
$shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
$shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
$shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);

// Transitions
$transition-fast: 0.2s ease;
$transition-normal: 0.3s ease;
$transition-slow: 0.5s ease;

// Z-index
$z-index-dropdown: 1000;
$z-index-sticky: 1020;
$z-index-fixed: 1030;
$z-index-modal-backdrop: 1040;
$z-index-modal: 1050;
$z-index-popover: 1060;
$z-index-tooltip: 1070;`;

  // Create app.scss file
  const appScssPath = path.join(targetDir, 'app/styles/app.scss');
  const appScssContent = `// App-specific styles
@use 'sass:color';
@use './variables' as vars;

// App layout
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease;
}

// Header styles
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--bg-secondary);
  box-shadow: 0 2px 4px var(--shadow-color);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;

  .logo-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;

    .logo {
      height: 40px;
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.1);
      }
    }

    .app-title {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--primary-color);
      margin: 0;
    }
  }

  .app-nav {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    .nav-link {
      color: var(--text-color);
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 0;
      position: relative;
      transition: color 0.3s ease;

      &:after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background-color: var(--primary-color);
        transition: width 0.3s ease;
      }

      &:hover, &.active {
        color: var(--primary-color);

        &:after {
          width: 100%;
        }
      }
    }

    .theme-switcher {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: var(--bg-color);
      }
    }
  }
}

// Main content area
.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

// Welcome banner
.welcome-banner {
  text-align: center;
  padding: 3rem 1rem;
  margin-bottom: 2rem;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: 0 4px 6px var(--shadow-color);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;

  .welcome-title {
    font-size: 2.5rem;
    color: var(--primary-color);
    margin-bottom: 1rem;
  }

  .welcome-subtitle {
    font-size: 1.2rem;
    color: var(--text-secondary);
    margin-bottom: 2rem;
  }

  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
}

// Features section
.features-section {
  margin: 2rem 0;
  padding: 2rem;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: 0 4px 6px var(--shadow-color);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;

  h2 {
    color: var(--primary-color);
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .features-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    list-style: none;
    padding: 0;

    .feature-item {
      padding: 1rem;
      background-color: var(--bg-color);
      border-radius: 4px;
      box-shadow: 0 2px 4px var(--shadow-color);
      transition: transform 0.3s ease, box-shadow 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 12px var(--shadow-color);
      }
    }
  }
}

// Router view container
.router-view-container {
  min-height: 300px;
  margin: 2rem 0;
}

// Footer
.app-footer {
  background-color: var(--bg-secondary);
  padding: 2rem;
  margin-top: 2rem;
  transition: background-color 0.3s ease;

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;

    .copyright {
      color: var(--text-secondary);
    }

    .footer-links {
      display: flex;
      gap: 1.5rem;

      a {
        color: var(--text-secondary);
        text-decoration: none;
        transition: color 0.3s ease;

        &:hover {
          color: var(--primary-color);
        }
      }
    }
  }
}

// Button styles
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  outline: none;

  &.btn-primary {
    background-color: var(--primary-color);
    color: white;

    &:hover {
      background-color: color.adjust(vars.$primary-color, $lightness: -10%);
      transform: translateY(-2px);
    }
  }

  &.btn-secondary {
    background-color: var(--secondary-color);
    color: white;

    &:hover {
      background-color: color.adjust(vars.$secondary-color, $lightness: -10%);
      transform: translateY(-2px);
    }
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    padding: 1rem;

    .logo-container {
      margin-bottom: 1rem;
    }

    .app-nav {
      width: 100%;
      justify-content: space-around;
      gap: 0.5rem;
    }
  }

  .app-main {
    padding: 1rem;
  }

  .welcome-banner {
    padding: 2rem 1rem;

    .welcome-title {
      font-size: 2rem;
    }
  }

  .app-footer .footer-content {
    flex-direction: column;
    text-align: center;

    .footer-links {
      justify-content: center;
    }
  }
}`;

  await fs.writeFile(variablesScssPath, variablesScssContent);
  await fs.writeFile(appScssPath, appScssContent);
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
