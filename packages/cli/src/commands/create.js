const fs = require('fs-extra');
const path = require('path');
const validateProjectName = require('validate-npm-package-name');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const deepmerge = require('deepmerge');
const execa = require('execa');
const https = require('https');

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

  // Add API integration example if enabled
  if (config.features.api) {
    files['src/api/useApi.js'] = `import { ref, computed } from '@kalxjs/core';
import { reactive } from '@kalxjs/composition';

/**
 * Custom hook for API requests with built-in state management
 * @param {Object} options - Configuration options
 * @param {string} options.baseUrl - Base URL for API requests
 * @param {Object} options.headers - Default headers for requests
 * @param {number} options.timeout - Request timeout in milliseconds
 * @param {Function} options.onError - Global error handler
 * @returns {Object} API utilities and state
 */
export function useApi(options = {}) {
    const {
        baseUrl = '',
        headers: defaultHeaders = { 'Content-Type': 'application/json' },
        timeout = 30000,
        onError = null
    } = options;

    // State
    const isLoading = ref(false);
    const error = ref(null);
    const abortControllers = reactive({});

    // Computed
    const hasError = computed(() => error.value !== null);

    /**
     * Make an API request
     * @param {Object} config - Request configuration
     * @returns {Promise} - Response promise
     */
    async function request(config) {
        const {
            url,
            method = 'GET',
            data = null,
            params = {},
            headers = {},
            signal = null,
            cache = 'default',
            key = url + method
        } = config;

        // Create URL with query parameters
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, value);
            }
        });

        const fullUrl = \`\${baseUrl}\${url}\${queryParams.toString() ? '?' + queryParams.toString() : ''}\`;

        // Create abort controller if not provided
        let controller;
        if (signal) {
            controller = { signal };
        } else {
            controller = new AbortController();
            abortControllers[key] = controller;
        }

        // Reset state
        isLoading.value = true;
        error.value = null;

        try {
            // Prepare request options
            const requestOptions = {
                method,
                headers: { ...defaultHeaders, ...headers },
                signal: controller.signal,
                cache
            };

            // Add body for non-GET requests
            if (method !== 'GET' && data) {
                requestOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
            }

            // Set timeout
            const timeoutId = setTimeout(() => {
                if (abortControllers[key]) {
                    abortControllers[key].abort();
                    delete abortControllers[key];
                }
            }, timeout);

            // Make request
            const response = await fetch(fullUrl, requestOptions);
            clearTimeout(timeoutId);

            // Handle response
            if (!response.ok) {
                throw new Error(\`API error: \${response.status} \${response.statusText}\`);
            }

            // Parse response based on content type
            const contentType = response.headers.get('content-type');
            let result;

            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else if (contentType && contentType.includes('text/')) {
                result = await response.text();
            } else {
                result = await response.blob();
            }

            return result;
        } catch (err) {
            error.value = err.message || 'Unknown error occurred';

            if (onError && typeof onError === 'function') {
                onError(err);
            }

            throw err;
        } finally {
            isLoading.value = false;
            if (abortControllers[key]) {
                delete abortControllers[key];
            }
        }
    }

    /**
     * Abort an ongoing request
     * @param {string} key - Request key to abort
     */
    function abort(key) {
        if (abortControllers[key]) {
            abortControllers[key].abort();
            delete abortControllers[key];
        }
    }

    /**
     * Abort all ongoing requests
     */
    function abortAll() {
        Object.values(abortControllers).forEach(controller => {
            controller.abort();
        });
        Object.keys(abortControllers).forEach(key => {
            delete abortControllers[key];
        });
    }

    // Convenience methods
    const get = (url, config = {}) => request({ ...config, url, method: 'GET' });
    const post = (url, data, config = {}) => request({ ...config, url, method: 'POST', data });
    const put = (url, data, config = {}) => request({ ...config, url, method: 'PUT', data });
    const patch = (url, data, config = {}) => request({ ...config, url, method: 'PATCH', data });
    const del = (url, config = {}) => request({ ...config, url, method: 'DELETE' });

    return {
        // State
        isLoading,
        error,
        hasError,

        // Methods
        request,
        get,
        post,
        put,
        patch,
        delete: del,
        abort,
        abortAll
    };
}`;
  }

  // Add Custom Renderer example if enabled
  if (config.features.customRenderer) {
    // Create .klx components instead of HTML templates
    files['src/components/counter.klx'] = `<template>
  <div class="counter-page">
    <h1>Counter Example</h1>

    <div class="counter-container">
      <div class="counter-display">
        <div class="counter-value" id="counter-value">{{ count }}</div>
        <div class="counter-label">Current Count</div>
      </div>

      <div class="counter-controls">
        <button id="decrement-button" class="counter-button decrement" data-event-decrement="click">-</button>
        <button id="reset-button" class="counter-button reset" data-event-reset="click">Reset</button>
        <button id="increment-button" class="counter-button increment" data-event-increment="click">+</button>
      </div>

      <div class="counter-stats">
        <div class="stat-item">
          <div class="stat-label">Double Count:</div>
          <div class="stat-value" id="double-count">{{ doubleCount }}</div>
        </div>

        <div class="stat-item">
          <div class="stat-label">Is Even:</div>
          <div class="stat-value" id="is-even">{{ isEven }}</div>
        </div>
      </div>
    </div>

    <div class="counter-actions">
      <a href="#/" class="nav-link">Back to Home</a>
    </div>
  </div>
</template>

<script>
import { defineComponent } from '@kalxjs/core';

export default {
  name: 'CounterComponent',

  data() {
    return {
      count: 0
    };
  },

  computed: {
    doubleCount() {
      return this.count * 2;
    },

    isEven() {
      return this.count % 2 === 0 ? 'Yes' : 'No';
    }
  },

  methods: {
    increment() {
      this.count++;
      this.updateCounter();
    },

    decrement() {
      this.count--;
      this.updateCounter();
    },

    reset() {
      this.count = 0;
      this.updateCounter();
    },

    updateCounter() {
      const counterValue = document.getElementById('counter-value');
      const doubleCount = document.getElementById('double-count');
      const isEven = document.getElementById('is-even');

      if (counterValue) {
        counterValue.textContent = this.count;

        // Add animation class
        counterValue.classList.add('updated');
        setTimeout(() => {
          counterValue.classList.remove('updated');
        }, 300);
      }

      if (doubleCount) {
        doubleCount.textContent = this.doubleCount;
      }

      if (isEven) {
        isEven.textContent = this.isEven;
      }
    }
  },

  mounted() {
    console.log('Counter component mounted!');
  }
};
</script>

<style>
.counter-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: Arial, sans-serif;
}

.counter-container {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.counter-display {
  margin-bottom: 2rem;
}

.counter-value {
  font-size: 4rem;
  font-weight: bold;
  color: #42b883;
  margin-bottom: 0.5rem;
}

.counter-label {
  color: #666;
  font-size: 1.2rem;
}

.counter-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.counter-button {
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  width: 50px;
  height: 50px;
  cursor: pointer;
}

.counter-button.reset {
  background-color: #7f8c8d;
  font-size: 0.9rem;
}

.counter-button.decrement {
  background-color: #e74c3c;
}

.counter-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #35495e;
}

.counter-actions {
  margin-top: 2rem;
  text-align: center;
}

.nav-link {
  color: #42b883;
  text-decoration: none;
  font-weight: bold;
}

.nav-link:hover {
  text-decoration: underline;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.counter-value.updated {
  animation: pulse 0.3s ease;
}
</style>
`;

    files['src/components/welcome.klx'] = `<template>
  <div class="welcome-container">
    <div class="welcome-header">
      <img src="/src/assets/logo.svg" alt="KalxJS Logo" class="welcome-logo" />
      <h1>Welcome to <span class="brand-name">KalxJS</span></h1>
    </div>

    <div class="welcome-content">
      <p class="welcome-message">
        {{ welcomeMessage }}
      </p>

      <div class="feature-grid">
        <div class="feature-card" v-for="feature in features">
          <h3>{{ feature.icon }} {{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </div>

      <div class="counter-demo">
        <h2>Try the Counter Demo</h2>
        <div class="counter-value" id="counter-value">{{ count }}</div>
        <div class="counter-buttons">
          <button id="decrement-button" class="counter-button" data-event-decrement="click">-</button>
          <button id="reset-button" class="counter-button reset" data-event-reset="click">Reset</button>
          <button id="increment-button" class="counter-button" data-event-increment="click">+</button>
        </div>
        <div class="counter-info">
          <div class="stat-item">
            <div class="stat-label">Double Count:</div>
            <div class="stat-value" id="double-count">{{ doubleCount }}</div>
          </div>

          <div class="stat-item">
            <div class="stat-label">Is Even:</div>
            <div class="stat-value" id="is-even">{{ isEven }}</div>
          </div>
        </div>
      </div>

      <div class="getting-started">
        <h2>Getting Started</h2>
        <div class="code-block">
          <pre><code>
// Create a new KalxJS project
npm init kalx my-app

// Start the development server
cd my-app
npm run dev
          </code></pre>
        </div>

        <div class="links-section">
          <h3>Essential Links</h3>
          <div class="links-grid">
            <a href="https://github.com/Odeneho-Calculus/kalxjs" target="_blank" class="link-card">
              <span class="link-icon">📚</span>
              <span class="link-text">Documentation</span>
            </a>
            <a href="https://github.com/Odeneho-Calculus/kalxjs/examples" target="_blank" class="link-card">
              <span class="link-icon">🔍</span>
              <span class="link-text">Examples</span>
            </a>
            <a href="https://github.com/Odeneho-Calculus/kalxjs" target="_blank" class="link-card">
              <span class="link-icon">💻</span>
              <span class="link-text">GitHub</span>
            </a>
            <a href="https://github.com/Odeneho-Calculus/kalxjs/issues" target="_blank" class="link-card">
              <span class="link-icon">🐞</span>
              <span class="link-text">Report Bug</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <footer class="welcome-footer">
      <p>Made with ❤️ by the KalxJS Team</p>
    </footer>
  </div>
</template>

<script>
import { defineComponent } from '@kalxjs/core';

export default {
  name: 'WelcomeComponent',

  data() {
    return {
      count: 0,
      welcomeMessage: 'Congratulations! You\\'ve successfully created a new KalxJS project with .klx components!',
      features: [
        {
          icon: '📝',
          title: 'Template-Based Rendering',
          description: 'Use HTML templates directly with no virtual DOM overhead'
        },
        {
          icon: '⚡',
          title: 'Reactive State',
          description: 'Powerful state management with automatic DOM updates'
        },
        {
          icon: '🧩',
          title: 'Component System',
          description: 'Create reusable components with clean APIs'
        },
        {
          icon: '🔄',
          title: 'Routing',
          description: 'Seamless navigation between different views'
        }
      ]
    };
  },

  computed: {
    doubleCount() {
      return this.count * 2;
    },

    isEven() {
      return this.count % 2 === 0 ? 'Yes' : 'No';
    }
  },

  methods: {
    increment() {
      this.count++;
      this.updateCounter();
    },

    decrement() {
      this.count--;
      this.updateCounter();
    },

    reset() {
      this.count = 0;
      this.updateCounter();
    },

    updateCounter() {
      const counterValue = document.getElementById('counter-value');
      const doubleCount = document.getElementById('double-count');
      const isEven = document.getElementById('is-even');

      if (counterValue) {
        counterValue.textContent = this.count;

        // Add animation class
        counterValue.classList.add('updated');
        setTimeout(() => {
          counterValue.classList.remove('updated');
        }, 300);
      }

      if (doubleCount) {
        doubleCount.textContent = this.doubleCount;
      }

      if (isEven) {
        isEven.textContent = this.isEven;
      }
    }
  },

  mounted() {
    console.log('Welcome component mounted!');

    // Render the features dynamically
    const featureGrid = document.querySelector('.feature-grid');
    if (featureGrid) {
      featureGrid.innerHTML = '';

      this.features.forEach(feature => {
        const card = document.createElement('div');
        card.className = 'feature-card';
        card.innerHTML = \`
          <h3>\${feature.icon} \${feature.title}</h3>
          <p>\${feature.description}</p>
        \`;
        featureGrid.appendChild(card);
      });
    }
  }
};
</script>

<style>
.welcome-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: Arial, sans-serif;
}

.welcome-header {
  text-align: center;
  margin-bottom: 2rem;
}

.welcome-logo {
  width: 100px;
  height: auto;
  margin-bottom: 1rem;
}

.brand-name {
  color: #42b883;
  font-weight: bold;
}

.welcome-content {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.welcome-message {
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: 2rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.feature-card {
  background-color: white;
  padding: 1.5rem;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.feature-card h3 {
  color: #42b883;
  margin-top: 0;
}

.counter-demo {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  margin-top: 2rem;
}

.counter-value {
  font-size: 4rem;
  font-weight: bold;
  color: #42b883;
  margin: 1rem 0;
}

.counter-buttons {
  margin: 1rem 0;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.counter-button {
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  width: 50px;
  height: 50px;
  cursor: pointer;
}

.counter-button.reset {
  background-color: #7f8c8d;
  font-size: 0.9rem;
}

.counter-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #35495e;
}

.getting-started {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.code-block {
  background-color: #282c34;
  border-radius: 6px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
}

.code-block code {
  color: #abb2bf;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.links-section {
  margin-top: 2rem;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  text-decoration: none;
  color: #35495e;
  transition: transform 0.2s;
}

.link-card:hover {
  transform: translateY(-3px);
}

.link-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.link-text {
  font-weight: bold;
}

.welcome-footer {
  text-align: center;
  margin-top: 3rem;
  color: #7f8c8d;
  font-size: 0.9rem;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.counter-value.updated {
  animation: pulse 0.3s ease;
}
</style>
`;

    files['src/utils/template-loader.js'] = `/**
 * Template loader utility
 * Loads HTML templates from files and injects them into the DOM
 */

    /**
     * Loads a template from a file and injects it into a template element
     * @param {string} templateId - ID of the template element
     * @param {string} templatePath - Path to the template file
     * @returns {Promise<void>}
     */
    export async function loadTemplate(templateId, templatePath) {
      try {
        // Fetch the template content
        const response = await fetch(templatePath);

        if (!response.ok) {
          throw new Error(\`Failed to load template: \${response.status} \${response.statusText}\`);
    }

    // Get the template content
    const templateContent = await response.text();

    // Find the template element
    const templateElement = document.getElementById(templateId);

    if (!templateElement) {
      throw new Error(\`Template element not found: \${templateId}\`);
    }

    // Set the template content
    templateElement.innerHTML = templateContent;

    console.log(\`Template loaded: \${templateId}\`);
  } catch (error) {
    console.error(\`Error loading template \${templateId}:\`, error);
  }
}

/**
 * Loads all templates
 * @returns {Promise<void>}
 */
export async function loadAllTemplates() {
  // Define templates to load
  const templates = [
    { id: 'welcome-template', path: '/src/templates/welcome.html' },
    { id: 'counter-template', path: '/src/templates/counter.html' }
  ];

  // Load all templates in parallel
  await Promise.all(templates.map(template =>
    loadTemplate(template.id, template.path)
  ));

  console.log('All templates loaded');
}`;

    files['src/styles/welcome.scss'] = `// Welcome page styles

.welcome-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Arial', sans-serif;
  color: #333;
}

.welcome-header {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-logo {
  width: 120px;
  height: auto;
  margin-bottom: 1rem;
}

.brand-name {
  color: #42b883;
  font-weight: bold;
}

.welcome-content {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.welcome-message {
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: 2rem;
  color: #555;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.feature-card {
  background-color: white;
  padding: 1.5rem;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h3 {
  color: #42b883;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.counter-demo {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 3rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.counter-value {
  font-size: 4rem;
  font-weight: bold;
  color: #42b883;
  margin: 1rem 0;
}

.counter-buttons {
  margin: 1rem 0;
}

.counter-button {
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.5rem;
  width: 50px;
  height: 50px;
  margin: 0 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.counter-button:hover {
  background-color: #3aa876;
}

.counter-info {
  margin-top: 1rem;
  color: #666;
}

.next-steps {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.next-steps h2 {
  color: #42b883;
  margin-top: 0;
}

.next-steps ul {
  padding-left: 1.5rem;
}

.next-steps li {
  margin-bottom: 0.5rem;
}

.next-steps code {
  background-color: #f0f0f0;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
}

.next-steps a {
  color: #42b883;
  text-decoration: none;
}

.next-steps a:hover {
  text-decoration: underline;
}

.welcome-footer {
  text-align: center;
  margin-top: 3rem;
  color: #888;
}

.version-info {
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

// Responsive adjustments
@media (max-width: 768px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }

  .welcome-container {
    padding: 1rem;
  }

  .welcome-content {
    padding: 1.5rem;
  }
}`;

    files['src/styles/counter.scss'] = `// Counter page styles

.counter-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.counter-page h1 {
  color: #35495e;
  margin-bottom: 2rem;
}

.counter-container {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.counter-display {
  margin-bottom: 2rem;
}

.counter-value {
  font-size: 6rem;
  font-weight: bold;
  color: #42b883;
  line-height: 1;
  transition: all 0.3s ease;
}

.counter-label {
  color: #666;
  margin-top: 0.5rem;
  font-size: 1.2rem;
}

.counter-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.counter-button {
  width: 60px;
  height: 60px;
  font-size: 1.5rem;
  font-weight: bold;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.counter-button.increment {
  background-color: #42b883;
  color: white;
}

.counter-button.increment:hover {
  background-color: #3aa876;
  transform: scale(1.05);
}

.counter-button.decrement {
  background-color: #e74c3c;
  color: white;
}

.counter-button.decrement:hover {
  background-color: #c0392b;
  transform: scale(1.05);
}

.counter-button.reset {
  background-color: #7f8c8d;
  color: white;
  font-size: 0.9rem;
}

.counter-button.reset:hover {
  background-color: #6c7a7a;
  transform: scale(1.05);
}

.counter-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #35495e;
}

.counter-actions {
  margin-top: 2rem;
}

.nav-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #f8f8fa;
  color: #42b883;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
}

// Animations
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.counter-value.updated {
  animation: pulse 0.3s ease;
}`;

    files['public/logo.svg'] = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="90" fill="#42b883" opacity="0.2"/>
  <path d="M100 20L180 140H20L100 20Z" fill="#42b883"/>
  <path d="M100 60L140 140H60L100 60Z" fill="#35495e"/>
  <circle cx="100" cy="100" r="15" fill="#35495e"/>
</svg>`;

    files['src/renderer/index.js'] = `// Custom renderer initialization and setup

/**
 * Sets up the counter component
 * @param {DocumentFragment} content - Component content
 * @param {Object} store - Store instance
 */
export function setupCounterComponent(content, store) {
  if (!store) return;

  // Get elements
  const counterValue = content.querySelector('#counter-value');
  const doubleCount = content.querySelector('#double-count');
  const isEven = content.querySelector('#is-even');

  // Set up initial values
  if (counterValue) {
    counterValue.textContent = store.state.count;
  }

  if (doubleCount && store.getters && store.getters.doubleCount) {
    doubleCount.textContent = store.getters.doubleCount;
  }

  if (isEven) {
    isEven.textContent = store.state.count % 2 === 0 ? 'Yes' : 'No';
  }

  // Set up event listeners
  const incrementBtn = content.querySelector('#increment-button');
  if (incrementBtn) {
    incrementBtn.addEventListener('click', () => {
      store.commit('increment');
      updateCounter(store);
    });
  }

  const decrementBtn = content.querySelector('#decrement-button');
  if (decrementBtn) {
    decrementBtn.addEventListener('click', () => {
      store.commit('decrement');
      updateCounter(store);
    });
  }

  const resetBtn = content.querySelector('#reset-button');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      store.commit('setCount', 0);
      updateCounter(store);
    });
  }
}

/**
 * Updates the counter display
 * @param {Object} store - Store instance
 */
export function updateCounter(store) {
  // Get elements
  const counterValue = document.querySelector('#counter-value');
  const doubleCount = document.querySelector('#double-count');
  const isEven = document.querySelector('#is-even');

  // Update values
  if (counterValue) {
    counterValue.textContent = store.state.count;

    // Add animation class
    counterValue.classList.add('updated');

    // Remove animation class after animation completes
    setTimeout(() => {
      counterValue.classList.remove('updated');
    }, 300);
  }

  if (doubleCount && store.getters && store.getters.doubleCount) {
    doubleCount.textContent = store.getters.doubleCount;
  }

  if (isEven) {
    isEven.textContent = store.state.count % 2 === 0 ? 'Yes' : 'No';
  }
}

/**
 * Sets up the welcome component
 * @param {DocumentFragment} content - Component content
 * @param {Object} store - Store instance
 */
export function setupWelcomeComponent(content, store) {
  if (!store) return;

  // Set up counter in the welcome page
  const counterValue = content.querySelector('#counter-value');
  const doubleCount = content.querySelector('#double-count');

  // Set up initial values
  if (counterValue) {
    counterValue.textContent = store.state.count;
  }

  if (doubleCount && store.getters && store.getters.doubleCount) {
    doubleCount.textContent = store.getters.doubleCount;
  }

  // Set up event listeners
  const incrementBtn = content.querySelector('#increment-button');
  if (incrementBtn) {
    incrementBtn.addEventListener('click', () => {
      store.commit('increment');
      updateWelcomeCounter(store);
    });
  }

  const decrementBtn = content.querySelector('#decrement-button');
  if (decrementBtn) {
    decrementBtn.addEventListener('click', () => {
      store.commit('decrement');
      updateWelcomeCounter(store);
    });
  }
}

/**
 * Updates the welcome page counter
 * @param {Object} store - Store instance
 */
export function updateWelcomeCounter(store) {
  // Get elements
  const counterValue = document.querySelector('#counter-value');
  const doubleCount = document.querySelector('#double-count');

  // Update values
  if (counterValue) {
    counterValue.textContent = store.state.count;
  }

  if (doubleCount && store.getters && store.getters.doubleCount) {
    doubleCount.textContent = store.getters.doubleCount;
  }
}

/**
 * Extends the custom renderer with additional component setup
 * @param {Object} renderer - Custom renderer instance
 * @param {Object} store - Store instance
 */
export function extendRenderer(renderer, store) {
  // Store the original setupComponent method
  const originalSetupComponent = renderer.setupComponent;

  // Override the setupComponent method
  renderer.setupComponent = function(name, content) {
    // Call the original method first
    if (originalSetupComponent) {
      originalSetupComponent.call(this, name, content);
    }

    // Add custom component setup
    switch (name) {
      case 'welcome':
        setupWelcomeComponent(content, store);
        break;
      case 'counter':
        setupCounterComponent(content, store);
        break;
    }
  };

  return renderer;
}

/**
 * Initialize the custom renderer
 * @param {Object} router - Router instance
 * @param {Object} store - Store instance
 * @param {string} selector - Container selector
 * @returns {Promise<Object>} Extended renderer instance
 */
export function initRenderer(router, store, selector = '#app') {
  // Import the custom renderer dynamically
  return import('@kalxjs/core/renderer').then(({ createCustomRenderer }) => {
    // Create the custom renderer
    const renderer = createCustomRenderer(router, store);

    // Extend the renderer with custom functionality
    const extendedRenderer = extendRenderer(renderer, store);

    // Initialize the renderer with the container
    extendedRenderer.init(selector);

    return extendedRenderer;
  });
}`;
  }

  // Add Composition API example if enabled
  if (config.features.composition) {
    files['src/composables/useWindowSize.js'] = `import { ref } from '@kalxjs/core';
import { onMounted, onUnmounted } from '@kalxjs/composition';

/**
 * Composable for tracking window size
 * @returns {Object} Window size state and utilities
 */
export function useWindowSize() {
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);

  // Computed breakpoints
  const isMobile = ref(width.value < 768);
  const isTablet = ref(width.value >= 768 && width.value < 1024);
  const isDesktop = ref(width.value >= 1024);

  function updateSize() {
    width.value = window.innerWidth;
    height.value = window.innerHeight;

    // Update breakpoints
    isMobile.value = width.value < 768;
    isTablet.value = width.value >= 768 && width.value < 1024;
    isDesktop.value = width.value >= 1024;
  }

  onMounted(() => {
    window.addEventListener('resize', updateSize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateSize);
  });

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop
  };
}`;

    files['src/composables/useLocalStorage.js'] = `import { ref } from '@kalxjs/core';
import { watch } from '@kalxjs/composition';

/**
 * Composable for using localStorage with reactivity
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {Object} Reactive value and utilities
 */
export function useLocalStorage(key, defaultValue = null) {
  // Get initial value from localStorage or use default
  const getStoredValue = () => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(\`Error reading localStorage key "\${key}":\`, error);
      return defaultValue;
    }
  };

  const storedValue = ref(getStoredValue());

  // Update localStorage when value changes
  watch(storedValue, (newValue) => {
    try {
      if (newValue === null || newValue === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      }
    } catch (error) {
      console.error(\`Error writing to localStorage key "\${key}":\`, error);
    }
  });

  // Handle storage events from other tabs/windows
  const handleStorageChange = (event) => {
    if (event.key === key) {
      storedValue.value = event.newValue ? JSON.parse(event.newValue) : defaultValue;
    }
  };

  // Add event listener for storage events
  window.addEventListener('storage', handleStorageChange);

  // Remove event listener on cleanup
  const clear = () => {
    window.removeEventListener('storage', handleStorageChange);
  };

  return {
    value: storedValue,
    clear,
    remove: () => {
      window.localStorage.removeItem(key);
      storedValue.value = defaultValue;
    }
  };
}`;
  }

  // Add Performance utilities if enabled
  if (config.features.performance) {
    files['src/utils/performance/lazyLoad.js'] = `import { ref } from '@kalxjs/core';
import { onMounted } from '@kalxjs/composition';

/**
 * Utility for lazy loading components or resources
 * @param {Function} importFn - Dynamic import function
 * @param {Object} options - Configuration options
 * @returns {Object} Lazy loading state and component
 */
export function useLazyLoad(importFn, options = {}) {
  const {
    immediate = false,
    loadingComponent = null,
    errorComponent = null,
    onError = null
  } = options;

  const component = ref(loadingComponent);
  const isLoading = ref(immediate);
  const isLoaded = ref(false);
  const error = ref(null);

  const load = async () => {
    if (isLoaded.value || isLoading.value) return;

    isLoading.value = true;
    error.value = null;

    try {
      const loadedModule = await importFn();
      component.value = loadedModule.default || loadedModule;
      isLoaded.value = true;
    } catch (err) {
      error.value = err;
      component.value = errorComponent;

      if (onError && typeof onError === 'function') {
        onError(err);
      }
    } finally {
      isLoading.value = false;
    }
  };

  if (immediate) {
    // Load immediately if specified
    load();
  }

  onMounted(() => {
    // Check if component should be loaded on mount
    if (!immediate && !isLoaded.value) {
      load();
    }
  });

  return {
    component,
    isLoading,
    isLoaded,
    error,
    load
  };
}`;

    files['src/utils/performance/debounce.js'] = `/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation.
 *
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - The options object
 * @param {boolean} options.leading - Specify invoking on the leading edge of the timeout
 * @param {boolean} options.trailing - Specify invoking on the trailing edge of the timeout
 * @returns {Function} The debounced function
 */
export function debounce(func, wait = 300, options = {}) {
  const { leading = false, trailing = true } = options;

  let timeout;
  let result;
  let lastArgs;
  let lastThis;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let isInvoking = false;

  // Convert wait to number if it's not already
  const waitTime = +wait || 0;

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    isInvoking = true;

    result = func.apply(thisArg, args);
    isInvoking = false;

    return result;
  }

  function leadingEdge(time) {
    lastInvokeTime = time;
    // Schedule a trailing edge call
    timeout = setTimeout(timerExpired, waitTime);
    // Invoke the leading edge
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = waitTime - timeSinceLastCall;

    return trailing ? Math.min(timeWaiting, waitTime - timeSinceLastInvoke) : timeWaiting;
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined || // First call
      timeSinceLastCall >= waitTime || // Wait time elapsed
      timeSinceLastCall < 0 || // System time adjusted
      (trailing && timeSinceLastInvoke >= waitTime) // Trailing edge case
    );
  }

  function timerExpired() {
    const time = Date.now();

    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }

    // Restart the timer
    timeout = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timeout = undefined;

    // Only invoke if we have lastArgs, which means func has been called at least once
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }

    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }

    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeout = undefined;
  }

  function flush() {
    return timeout === undefined ? result : trailingEdge(Date.now());
  }

  function pending() {
    return timeout !== undefined;
  }

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeout === undefined) {
        return leadingEdge(lastCallTime);
      }

      if (isInvoking) {
        // Handle invocations in a tight loop
        clearTimeout(timeout);
        timeout = setTimeout(timerExpired, waitTime);
        return invokeFunc(lastCallTime);
      }
    }

    if (timeout === undefined) {
      timeout = setTimeout(timerExpired, waitTime);
    }

    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}`;
  }

  // Add Plugin system example if enabled
  if (config.features.plugins) {
    files['src/plugins/index.js'] = `import { createApp } from '@kalxjs/core';

/**
 * Plugin system for extending application functionality
 */
export const plugins = {
  _registry: new Map(),
  _hooks: new Map(),

  /**
   * Register a plugin
   * @param {string} name - Plugin name
   * @param {Object} plugin - Plugin object
   * @param {Object} options - Plugin options
   */
  register(name, plugin, options = {}) {
    if (this._registry.has(name)) {
      console.warn(\`Plugin "\${name}" is already registered. It will be overwritten.\`);
    }

    this._registry.set(name, { plugin, options });

    // Initialize plugin if it has an install method
    if (plugin.install && typeof plugin.install === 'function') {
      plugin.install(options);
    }

    return this;
  },

  /**
   * Get a registered plugin
   * @param {string} name - Plugin name
   * @returns {Object|null} Plugin object or null if not found
   */
  get(name) {
    const entry = this._registry.get(name);
    return entry ? entry.plugin : null;
  },

  /**
   * Check if a plugin is registered
   * @param {string} name - Plugin name
   * @returns {boolean} True if plugin is registered
   */
  has(name) {
    return this._registry.has(name);
  },

  /**
   * Unregister a plugin
   * @param {string} name - Plugin name
   */
  unregister(name) {
    const entry = this._registry.get(name);

    if (entry && entry.plugin.uninstall && typeof entry.plugin.uninstall === 'function') {
      entry.plugin.uninstall();
    }

    this._registry.delete(name);
    return this;
  },

  /**
   * Register a hook
   * @param {string} name - Hook name
   * @param {Function} callback - Hook callback
   * @param {Object} options - Hook options
   */
  hook(name, callback, options = {}) {
    if (!this._hooks.has(name)) {
      this._hooks.set(name, []);
    }

    this._hooks.get(name).push({ callback, options });
    return this;
  },

  /**
   * Execute a hook
   * @param {string} name - Hook name
   * @param {...any} args - Arguments to pass to hook callbacks
   * @returns {Promise<Array>} Results from hook callbacks
   */
  async executeHook(name, ...args) {
    if (!this._hooks.has(name)) {
      return [];
    }

    const hooks = this._hooks.get(name);
    const results = [];

    for (const hook of hooks) {
      try {
        const result = await hook.callback(...args);
        results.push(result);
      } catch (error) {
        console.error(\`Error executing hook "\${name}":\`, error);
        if (hook.options.throwError) {
          throw error;
        }
      }
    }

    return results;
  },

  /**
   * Apply all plugins to an app instance
   * @param {Object} app - App instance
   */
  applyToApp(app) {
    for (const [name, entry] of this._registry.entries()) {
      if (entry.plugin.applyToApp && typeof entry.plugin.applyToApp === 'function') {
        entry.plugin.applyToApp(app, entry.options);
      }
    }

    return app;
  }
};

/**
 * Create a plugin
 * @param {Object} options - Plugin configuration
 * @returns {Object} Plugin object
 */
export function createPlugin(options) {
  const {
    name,
    install,
    uninstall,
    applyToApp,
    hooks = {},
    ...rest
  } = options;

  const plugin = {
    name,
    install,
    uninstall,
    applyToApp,
    ...rest
  };

  // Register hooks
  Object.entries(hooks).forEach(([hookName, callback]) => {
    plugins.hook(hookName, callback);
  });

  return plugin;
}`;

    files['src/plugins/logger.js'] = `import { createPlugin } from './index';

/**
 * Logger plugin for application-wide logging
 */
export const loggerPlugin = createPlugin({
  name: 'logger',

  // Plugin state
  _config: {
    level: 'info',
    prefix: '[App]',
    enabled: true,
    console: true,
    custom: null
  },

  // Log levels
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  },

  /**
   * Install the plugin
   * @param {Object} options - Plugin options
   */
  install(options = {}) {
    this._config = { ...this._config, ...options };

    // Register global error handler if enabled
    if (this._config.catchErrors) {
      window.addEventListener('error', (event) => {
        this.error('Uncaught error:', event.error);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection:', event.reason);
      });
    }
  },

  /**
   * Apply plugin to app instance
   * @param {Object} app - App instance
   * @param {Object} options - Plugin options
   */
  applyToApp(app, options = {}) {
    // Add logger to app instance
    app.logger = this;

    // Add logger to app context
    app.provide('logger', this);
  },

  /**
   * Check if a log level is enabled
   * @param {string} level - Log level
   * @returns {boolean} True if level is enabled
   */
  isLevelEnabled(level) {
    return this._config.enabled &&
           this.levels[level] >= this.levels[this._config.level];
  },

  /**
   * Format log message
   * @param {string} level - Log level
   * @param {Array} args - Log arguments
   * @returns {Array} Formatted log arguments
   */
  formatLog(level, args) {
    const timestamp = new Date().toISOString();
    const prefix = this._config.prefix;
    return [\`\${prefix} [\${timestamp}] [\${level.toUpperCase()}]\`, ...args];
  },

  /**
   * Log a message
   * @param {string} level - Log level
   * @param {...any} args - Log arguments
   */
  log(level, ...args) {
    if (!this.isLevelEnabled(level)) return;

    const formattedArgs = this.formatLog(level, args);

    // Console logging
    if (this._config.console) {
      switch (level) {
        case 'debug':
          console.debug(...formattedArgs);
          break;
        case 'info':
          console.info(...formattedArgs);
          break;
        case 'warn':
          console.warn(...formattedArgs);
          break;
        case 'error':
          console.error(...formattedArgs);
          break;
        default:
          console.log(...formattedArgs);
      }
    }

    // Custom logger
    if (this._config.custom && typeof this._config.custom === 'function') {
      this._config.custom(level, formattedArgs);
    }
  },

  // Convenience methods
  debug(...args) { this.log('debug', ...args); },
  info(...args) { this.log('info', ...args); },
  warn(...args) { this.log('warn', ...args); },
  error(...args) { this.log('error', ...args); },

  /**
   * Set log level
   * @param {string} level - Log level
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this._config.level = level;
    }
  },

  /**
   * Enable or disable logging
   * @param {boolean} enabled - Whether logging is enabled
   */
  setEnabled(enabled) {
    this._config.enabled = !!enabled;
  }
});`;
  }

  // Add SFC example component if enabled
  if (config.features.sfc) {
    files['src/components/sfc/Card.klx'] = `<template>
  <div class="card">
    <div class="card-header">
      <slot name="header">Default Header</slot>
    </div>
    <div class="card-body">
      <slot>Default Content</slot>
    </div>
    <div class="card-footer">
      <slot name="footer">Default Footer</slot>
    </div>
  </div>
</template>

<script>
import { defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'Card',
  props: {
    title: String,
    subtitle: String,
    bordered: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    // Component logic here
    return {};
  }
});
</script>

<style>
.card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  background-color: white;
}

.card-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  font-weight: bold;
}

.card-body {
  padding: 1rem;
}

.card-footer {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  background-color: #f8f9fa;
}
</style>`;
  }

  // Add AI manager example if enabled
  if (config.features.ai) {
    files['src/ai/aiManager.js'] = `import { createAIManager, configure, generateText as aiGenerateText, useAI } from '@kalxjs/ai';

// Helper function to get environment variables in different environments
const getEnvVar = (name) => {
  // For Vite
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name] || '';
  }
  // For webpack
  else if (typeof process !== 'undefined' && process.env) {
    return process.env[name] || '';
  }
  return '';
};

// Get API key from environment
const apiKey = getEnvVar('OPENAI_API_KEY') || '';

// Create AI manager instance
export const aiManager = createAIManager({
  apiKeys: {
    openai: apiKey
  },
  defaultOptions: {
    temperature: 0.7,
    max_length: 1000
  }
});

// Configure the AI service (alternative approach)
configure({
  apiKey: apiKey,
  endpoint: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  maxTokens: 1000,
  temperature: 0.7
});

// Helper functions for common AI tasks
export async function generateText(prompt, options = {}) {
  try {
    // Try using the AI manager first
    return await aiManager.generateText({
      prompt,
      model: options.model || 'gpt-3.5-turbo',
      options: {
        temperature: options.temperature || 0.7,
        max_tokens: options.max_length || 100,
        ...options
      }
    });
  } catch (error) {
    // Fall back to direct API if manager fails
    return aiGenerateText(prompt, {
      model: options.model || 'gpt-3.5-turbo',
      maxTokens: options.max_length || 100,
      temperature: options.temperature || 0.7,
      ...options
    });
  }
}

// Create a hook for AI functionality
export function useAIHelper(options = {}) {
  return useAI(options);
}

// Export other AI utilities
export { useAI } from '@kalxjs/ai';`;

    files['src/components/AITextGenerator.js'] = `import { defineComponent, h, ref } from '@kalxjs/core';
import { aiManager, generateText, useAIHelper } from '../ai/aiManager';

export default defineComponent({
  name: 'AITextGenerator',
  props: {
    initialPrompt: String,
    placeholder: {
      type: String,
      default: 'Enter your prompt here...'
    },
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    temperature: {
      type: Number,
      default: 0.7
    },
    maxLength: {
      type: Number,
      default: 200
    }
  },
  setup(props) {
    const prompt = ref(props.initialPrompt || '');
    const result = ref('');
    const loading = ref(false);
    const error = ref(null);

    // Use the AI helper for additional functionality
    const ai = useAIHelper();

    const generateContent = async () => {
      if (!prompt.value) return;

      loading.value = true;
      error.value = null;

      try {
        // Try using the helper function first (which handles both approaches)
        result.value = await generateText(prompt.value, {
          model: props.model,
          temperature: props.temperature,
          max_length: props.maxLength
        });
      } catch (err) {
        error.value = err.message || 'Failed to generate text';
        console.error('AI text generation error:', err);
      } finally {
        loading.value = false;
      }
    };

    return {
      prompt,
      result,
      loading,
      error,
      generateContent,
      ai,
      aiManager // Export the manager for advanced usage
    };
  },
  render() {
    return h('div', { class: 'ai-text-generator' }, [
      h('div', { class: 'input-group' }, [
        h('textarea', {
          value: this.prompt,
          onInput: (e) => this.prompt = e.target.value,
          placeholder: this.placeholder,
          rows: 3,
          style: 'width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid #e2e8f0;'
        })
      ]),

      h('div', { class: 'controls', style: 'margin-top: 1rem;' }, [
        h('button', {
          onClick: this.generateContent,
          disabled: this.loading || !this.prompt,
          style: \`
            padding: 0.5rem 1rem;
            background-color: #4299e1;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: \${this.loading || !this.prompt ? 'not-allowed' : 'pointer'};
            opacity: \${this.loading || !this.prompt ? 0.7 : 1};
          \`
        }, this.loading ? 'Generating...' : 'Generate Text')
      ]),

      this.error && h('div', {
        class: 'error',
        style: 'margin-top: 1rem; color: #e53e3e; padding: 0.5rem; background-color: #fff5f5; border-radius: 4px;'
      }, this.error),

      this.result && h('div', {
        class: 'result',
        style: 'margin-top: 1rem; padding: 1rem; background-color: #f7fafc; border-radius: 4px; border: 1px solid #e2e8f0;'
      }, this.result)
    ]);
  }
});`;
  }

  files['src/components/Button.klx'] = `<template>
  <button 
    :class="[
      'button', 
      primary ? 'primary' : 'secondary',
      size,
      { 'full-width': fullWidth, 'icon-only': iconOnly }
    ]" 
    @click="handleClick"
    :disabled="disabled || loading"
    :type="type"
  >
    <span v-if="loading" class="spinner"></span>
    <span v-else-if="icon" class="icon">{{ icon }}</span>
    <span v-if="!iconOnly" class="text">{{ text }}</span>
    <slot></slot>
  </button>
</template>

<script>
import { defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'Button',
  props: {
    text: {
      type: String,
      default: ''
    },
    primary: {
      type: Boolean,
      default: false
    },
    secondary: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    fullWidth: {
      type: Boolean,
      default: false
    },
    icon: {
      type: String,
      default: ''
    },
    iconOnly: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'button',
      validator: (value) => ['button', 'submit', 'reset'].includes(value)
    }
  },
  
  setup(props, { emit }) {
    const handleClick = (event) => {
      if (!props.disabled && !props.loading) {
        emit('click', event);
      }
    };

    return { handleClick };
  }
});
</script>

<style>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
}

.button:active {
  transform: translateY(1px);
}

.button.disabled, .button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Sizes */
.button.small {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.button.medium {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.button.large {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

/* Variants */
.button.primary {
  background-color: #4299e1;
  color: white;
}

.button.primary:hover:not(:disabled):not(.disabled) {
  background-color: #3182ce;
}

.button.secondary {
  background-color: #e2e8f0;
  color: #4a5568;
}

.button.secondary:hover:not(:disabled):not(.disabled) {
  background-color: #cbd5e0;
}

/* Full width */
.button.full-width {
  width: 100%;
}

/* Icon styles */
.button .icon {
  margin-right: 0.5rem;
}

.button.icon-only {
  padding: 0.5rem;
  border-radius: 50%;
}

.button.icon-only.small {
  padding: 0.25rem;
}

.button.icon-only.large {
  padding: 0.75rem;
}

/* Loading spinner */
.spinner {
  width: 1em;
  height: 1em;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.button.secondary .spinner {
  border-color: rgba(74, 85, 104, 0.3);
  border-top-color: #4a5568;
}
</style>
`;

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
*.sw?`;

  files['README.md'] = `# ${config.projectName}

A modern web application built with KalxJS.

## Getting Started

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

## Features

${config.features.router ? '- Router for navigation\n' : ''}${config.features.state ? '- State management\n' : ''}${config.features.scss ? '- SCSS styling\n' : ''}${config.features.testing ? '- Testing setup\n' : ''}${config.features.linting ? '- ESLint for code quality\n' : ''}

## Project Structure

\`\`\`
${config.projectName}/
├── public/          # Static assets
├── src/             # Source code
│   ├── assets/      # Project assets
│   ├── components/  # UI components
${config.features.router ? '│   ├── views/       # Page components\n│   ├── router/      # Router configuration\n' : ''}${config.features.state ? '│   ├── store/       # State management\n' : ''}${config.features.scss ? '│   ├── styles/      # SCSS styles\n' : ''}│   ├── App.klx      # Root component (Single File Component)
│   └── main.js      # Application entry point
├── index.html       # HTML template
└── vite.config.js   # Vite configuration
\`\`\`

## License

MIT`;

  files['index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml"
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>" />
  <title>${config.projectName}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`;

  files['src/main.js'] = `import { createApp } from '@kalxjs/core';
import App from './App.klx';
${config.features.router ? "import router from './router';" : ''}
${config.features.state ? "import store from './store';" : ''}
${config.features.scss ? "import './styles/main.scss';" : ''}

// Application configuration
const appConfig = {
  name: '${config.projectName}',
  version: '1.0.0',
  debug: import.meta.env.DEV,
  apiUrl: import.meta.env.VITE_API_URL || 'https://api.example.com'
};

try {
  // Create application instance
  const app = createApp(App);

  // Register plugins
  ${config.features.router ? 'app.use(router);' : ''}
  ${config.features.state ? 'app.use(store);' : ''}

  // Add global properties to the app context
  app.provide('appConfig', appConfig);

  // Performance monitoring
  if (appConfig.debug) {
    const startTime = performance.now();

    // Mount the application
    app.mount('#app');

    const endTime = performance.now();
    console.log(\`Application mounted in \${(endTime - startTime).toFixed(2)}ms\`);
  } else {
    // Production mount
    app.mount('#app');
  }

  console.log(\`\${appConfig.name} v\${appConfig.version} initialized successfully\`);

  // Make app globally accessible for debugging
  window.$app = app;
} catch (error) {
  console.error('Error initializing app:', error);

  // Fallback rendering in case of error
  document.getElementById('app').innerHTML = \`
    <div class="app" style="padding: 2rem; text-align: center;">
      <h1>Welcome to KalxJS</h1>
      <p>There was an error initializing the application.</p>
      <pre style="text-align: left; background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow: auto;">\${error.message}</pre>
      <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background-color: #4299e1; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Reload Application
      </button>
    </div>
  \`;
}`;


  files['src/App.klx'] = `<template>
  <div class="app">
    <header class="app-header">
      <h1>Welcome to KalxJS</h1>

      <!-- Navigation if router is enabled -->
      ${config.features.router ? `<nav class="app-nav">
        <RouterLink to="/" active-class="active" exact-active-class="exact-active">Home</RouterLink>
        <RouterLink to="/about" active-class="active" exact-active-class="exact-active">About</RouterLink>
        <RouterLink to="/user/1" active-class="active" exact-active-class="exact-active">User Profile</RouterLink>
      </nav>` : ''}
    </header>

    <main class="app-main">
      <!-- Feature information section -->
      <section class="features-section">
        <h2>Enabled Features:</h2>
        <ul class="features-list">
          ${config.features.router ? `<li class="feature-item router">✓ Advanced Router (v2.0)</li>` : ''}
          ${config.features.state ? `<li class="feature-item state">✓ State Management</li>` : ''}
          ${config.features.scss ? `<li class="feature-item scss">✓ SCSS Support</li>` : ''}
          ${config.features.sfc ? `<li class="feature-item sfc">✓ Single File Components (.klx)</li>` : ''}
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
      <p>Powered by KalxJS - More powerful than Vue</p>
    </footer>
  </div>
</template>

<script>
import { defineComponent, onMounted } from '@kalxjs/core';
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
  }
});
</script>

<style${config.features.scss ? ' lang="scss"' : ''}>
/* Global styles */
:root {
  --primary-color: #4299e1;
  --secondary-color: #2d3748;
  --background-color: #f8f9fa;
  --text-color: #333;
  --border-radius: 8px;
  --box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  --transition-duration: 0.3s;
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
  background-color: #f5f7fa;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  &-header {
    text-align: center;
    margin-bottom: 2rem;

    h1 {
      color: var(--secondary-color);
      margin-bottom: 1rem;
      font-size: 2.5rem;
    }
  }

  &-nav {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin: 1rem 0;
    padding: 0.5rem;
    background-color: var(--background-color);
    border-radius: var(--border-radius);

    a {
      color: var(--primary-color);
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background-color var(--transition-duration);

      &:hover {
        background-color: rgba(66, 153, 225, 0.1);
      }

      &.active {
        background-color: rgba(66, 153, 225, 0.2);
      }

      &.exact-active {
        background-color: var(--primary-color);
        color: white;
      }
    }
  }

  &-main {
    margin-bottom: 2rem;
  }

  &-footer {
    text-align: center;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
    color: #718096;
    font-size: 0.875rem;
  }
}

.features-section {
  margin-top: 1rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);

  h2 {
    margin-top: 0;
    color: var(--secondary-color);
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }
}

.features-list {
  list-style-type: none;
  padding-left: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.feature-item {
  margin: 0.5rem 0;
  padding: 1rem;
  background-color: #ebf8ff;
  border-radius: 4px;
  transition: transform var(--transition-duration);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &.router { background-color: #ebf8ff; }
  &.state { background-color: #e6fffa; }
  &.scss { background-color: #fefcbf; }
  &.sfc { background-color: #feebc8; }
  &.api { background-color: #fed7d7; }
  &.composition { background-color: #e9d8fd; }
  &.performance { background-color: #c6f6d5; }
  &.plugins { background-color: #bee3f8; }
  &.ai { background-color: #fbd38d; }
  &.testing { background-color: #b2f5ea; }
  &.linting { background-color: #d6bcfa; }
}

.router-view-container {
  padding: 1.5rem;
  margin-top: 1.5rem;
  border-radius: var(--border-radius);
  background-color: white;
  box-shadow: var(--box-shadow);
}

.edit-prompt {
  margin-top: 1rem;
  text-align: center;
  color: #718096;
}

/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-duration);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<!-- Advanced features section -->
<script setup>
import { onMounted, onUnmounted, ref, watch } from '@kalxjs/core';

// Component-specific state
const darkMode = ref(false);

// Toggle dark mode function
function toggleDarkMode() {
  darkMode.value = !darkMode.value;
  document.body.classList.toggle('dark-theme', darkMode.value);
}

// Lifecycle hooks
onMounted(() => {
  // Check user preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    darkMode.value = true;
    document.body.classList.add('dark-theme');
  }

  // Add event listener for theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    darkMode.value = e.matches;
    document.body.classList.toggle('dark-theme', e.matches);
  });
});

onUnmounted(() => {
  // Clean up event listeners
  window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', () => {});
});

// Watch for changes
watch(darkMode, (newValue) => {
  console.log(\`Dark mode is now \${newValue ? 'enabled' : 'disabled'}\`);
});
</script>

<!-- Custom blocks - KalxJS specific features that surpass Vue -->
<i18n>
{
  "en": {
    "welcome": "Welcome to KalxJS",
    "features": "Enabled Features",
    "footer": "Powered by KalxJS - More powerful than Vue"
  },
  "es": {
    "welcome": "Bienvenido a KalxJS",
    "features": "Características habilitadas",
    "footer": "Desarrollado con KalxJS - Más potente que Vue"
  }
}
</i18n>

<documentation>
# App Component

This is the root component of the application. It demonstrates the following features:

- Single File Component (.klx) structure
- Template with conditional rendering
- Script with component definition
- Style with CSS/SCSS
- Script setup for composition API
- i18n for internationalization
- Documentation block for component documentation

## Usage

This component is automatically imported and used in main.js.
</documentation>

<tests>
import { mount } from '@kalxjs/test-utils';
import App from './App.klx';

describe('App.klx', () => {
  test('renders correctly', () => {
    const wrapper = mount(App);
    expect(wrapper.find('h1').text()).toBe('Welcome to KalxJS');
  });

  test('toggles dark mode', async () => {
    const wrapper = mount(App);
    await wrapper.vm.toggleDarkMode();
    expect(document.body.classList.contains('dark-theme')).toBe(true);
  });
});
</tests>`;


  files['vite.config.js'] = `import { defineConfig } from 'vite';
import { klxPlugin } from '@kalxjs/compiler';
import path from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: true
  },
  plugins: [
    klxPlugin() // Add support for .klx single file components
  ],
  optimizeDeps: {
    include: [
      '@kalxjs/core',
      '@kalxjs/compiler',
      ${config.features.router ? "'@kalxjs/router'," : ''}
      ${config.features.state ? "'@kalxjs/state'," : ''}
      ${config.features.ai ? "'@kalxjs/ai'," : ''}
      ${config.features.api ? "'@kalxjs/api'," : ''}
      ${config.features.composition ? "'@kalxjs/composition'," : ''}
      ${config.features.performance ? "'@kalxjs/performance'," : ''}
      ${config.features.plugins ? "'@kalxjs/plugins'," : ''}
    ]
  },
  // Add .klx files to assetsInclude to prevent Vite from trying to process them as JS
  assetsInclude: ['**/*.klx'],
  // Custom handling for .klx files
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});`;


  // Add feature-specific files
  if (config.features.router) {
    files['src/router/index.js'] = `import { createRouter, useRouter } from '@kalxjs/router';
import { h } from '@kalxjs/core';

// Import views - using lazy loading for better performance
const Home = () => import('../views/Home.klx');
const About = () => import('../views/About.klx');
const User = () => import('../views/User.klx');
const NotFound = () => import('../views/NotFound.klx');

// Create router instance
const router = createRouter({
  // Use hash-based routing mode
  mode: 'hash',

  // Define routes with advanced matching capabilities
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: {
        title: 'Home'
      }
    },
    {
      path: '/about',
      name: 'about',
      component: About,
      meta: {
        title: 'About'
      }
    },
    {
      path: '/user/:id(\\d+)', // Only match numeric IDs
      name: 'user',
      component: User,
      props: true, // Pass route params as component props
      meta: {
        title: 'User Profile'
      }
    },
    {
      // Catch-all route for 404 page with named parameter
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
      meta: {
        title: 'Page Not Found'
      }
    }
  ],

  // Custom scroll behavior
  scrollBehavior(to, from, savedPosition) {
    // Return to saved position for back/forward navigation
    if (savedPosition) {
      return savedPosition;
    }

    // Scroll to anchor if hash is present
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      };
    }

    // Otherwise scroll to top
    return { top: 0 };
  }
});

// Set page title based on route meta
// We'll handle this in the main.js file instead

export default router;

// Export the useRouter function for easy access in components
export { useRouter } from '@kalxjs/router';`;

    files['src/views/About.klx'] = `<template>
  <div class="about">
    <h2>About Page</h2>
    <p>This is the about page content.</p>
    <p>KalxJS is a modern JavaScript framework for building user interfaces.</p>
    
    <div class="about-features">
      <h3>Why Choose KalxJS?</h3>
      <ul>
        <li>Powerful component system</li>
        <li>Reactive state management</li>
        <li>Single File Components (.klx)</li>
        <li>Performance optimizations</li>
        <li>Advanced routing capabilities</li>
      </ul>
    </div>
    
    <div class="about-actions">
      <RouterLink to="/" class="back-link">Back to Home</RouterLink>
    </div>
  </div>
</template>

<script>
import { defineComponent } from '@kalxjs/core';
import { RouterLink } from '@kalxjs/router';

export default defineComponent({
  name: 'About',
  components: {
    RouterLink
  }
});
</script>

<style>
.about {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  color: #4a5568;
  margin-bottom: 1rem;
}

p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.about-features {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f7fafc;
  border-radius: 8px;
}

h3 {
  color: #2d3748;
  margin-bottom: 1rem;
}

ul {
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
}

.about-actions {
  margin-top: 2rem;
  text-align: center;
}

.back-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #4299e1;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.back-link:hover {
  background-color: #3182ce;
}
</style>
`;

    files['src/views/NotFound.klx'] = `<template>
  <div class="not-found">
    <div class="error-container">
      <div class="error-code">404</div>
      <h2>Page Not Found</h2>
      <p>The page you are looking for does not exist or has been moved.</p>
      
      <div class="actions">
        <RouterLink to="/" class="home-link">Go back to home</RouterLink>
        <button @click="goBack" class="back-button">Go back</button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from '@kalxjs/core';
import { useRouter, RouterLink } from '@kalxjs/router';

export default defineComponent({
  name: 'NotFound',
  components: {
    RouterLink
  },
  setup() {
    const { push } = useRouter();

    const goHome = () => {
      push('/');
    };
    
    const goBack = () => {
      window.history.back();
    };

    return { 
      goHome,
      goBack
    };
  }
});
</script>

<style>
.not-found {
  padding: 2rem;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.error-container {
  max-width: 500px;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.error-code {
  font-size: 6rem;
  font-weight: bold;
  color: #e53e3e;
  line-height: 1;
  margin-bottom: 1rem;
}

h2 {
  color: #4a5568;
  margin-bottom: 1rem;
}

p {
  color: #718096;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.home-link, .back-button {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s;
  cursor: pointer;
}

.home-link {
  background-color: #4299e1;
  color: white;
  text-decoration: none;
}

.home-link:hover {
  background-color: #3182ce;
}

.back-button {
  background-color: #edf2f7;
  color: #4a5568;
  border: none;
}

.back-button:hover {
  background-color: #e2e8f0;
}
</style>
`;

    files['src/views/User.klx'] = `<template>
  <div class="user">
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <h2>Loading User Data...</h2>
      <div class="loading-indicator">
        <div class="spinner"></div>
        <span>Please wait...</span>
      </div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <h2>Error</h2>
      <p class="error-message">{{ error }}</p>
      <button class="primary-button" @click="goBack">Back to Home</button>
    </div>
    
    <!-- User profile -->
    <div v-else class="user-profile">
      <h2>{{ pageTitle }}</h2>
      
      <!-- User info card -->
      <div class="user-card">
        <div class="user-header">
          <div class="user-avatar">{{ user?.name?.charAt(0) || 'U' }}</div>
          <div class="user-info">
            <h3>{{ user?.name }}</h3>
            <p>{{ user?.email }}</p>
          </div>
        </div>
        
        <div class="user-details">
          <p>
            <strong>User ID: </strong>
            <span>{{ userId }}</span>
          </p>
          <p>
            <strong>Role: </strong>
            <span class="role-badge" :class="user?.role.toLowerCase()">{{ user?.role }}</span>
          </p>
        </div>
      </div>
      
      <!-- Navigation buttons -->
      <div class="action-buttons">
        <button class="primary-button" @click="goBack">
          <span>Back to Home</span>
          <span v-if="isHomeActive" class="status-badge">Active</span>
        </button>
        
        <button class="success-button" @click="goToNextUser">Next User</button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from '@kalxjs/core';
import { useRouter, RouterLink } from '@kalxjs/router';

export default defineComponent({
  name: 'User',
  components: {
    RouterLink
  },
  
  // Accept route params as props (enabled by props: true in router config)
  props: {
    id: {
      type: String,
      required: true
    }
  },
  
  setup(props) {
    // Use the enhanced router composition API
    const { 
      params,           // Route params (reactive)
      query,            // Query parameters (reactive)
      meta,             // Route meta data (reactive)
      push,             // Navigation method (returns Promise)
      replace,          // Replace navigation method (returns Promise)
      isActive,         // Check if route is active (non-exact)
      isExactActive     // Check if route is exactly active
    } = useRouter();
    
    // Local state
    const user = ref(null);
    const loading = ref(true);
    const error = ref(null);
    
    // Computed properties
    const userId = computed(() => props.id || params.value.id);
    const pageTitle = computed(() => meta.value.title || 'User Profile');
    const isHomeActive = computed(() => isActive('/'));
    
    // Methods
    const goBack = async () => {
      try {
        // Promise-based navigation
        await push('/');
        console.log('Navigation to home successful');
      } catch (err) {
        console.error('Navigation failed:', err);
      }
    };
    
    const goToNextUser = async () => {
      const nextId = parseInt(userId.value) + 1;
      try {
        // Navigate to another user with replace (doesn't add to history)
        await replace(\`/user/\${nextId}\`);
      } catch (err) {
        console.error('Navigation failed:', err);
      }
    };
    
    // Simulate fetching user data
    const fetchUserData = async (id) => {
      loading.value = true;
      error.value = null;
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock user data
        user.value = {
          id,
          name: \`User \${id}\`,
          email: \`user\${id}@example.com\`,
          role: id % 2 === 0 ? 'Admin' : 'User'
        };
      } catch (err) {
        error.value = 'Failed to load user data';
        console.error(err);
      } finally {
        loading.value = false;
      }
    };
    
    // Watch for changes to user ID (for navigation between users)
    onMounted(() => {
      fetchUserData(userId.value);
    });
    
    // Watch for route param changes to reload data when navigating between users
    watch(() => userId.value, (newId) => {
      fetchUserData(newId);
    });
    
    return { 
      user, 
      loading, 
      error, 
      userId, 
      pageTitle,
      isHomeActive,
      goBack, 
      goToNextUser 
    };
  }
});
</script>

<style>
.user {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  color: #4a5568;
  margin-bottom: 1.5rem;
}

.loading-state, .error-state {
  text-align: center;
  padding: 2rem;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(66, 153, 225, 0.2);
  border-radius: 50%;
  border-top-color: #4299e1;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #e53e3e;
  margin-bottom: 1.5rem;
}

.user-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #4299e1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.5rem;
  margin-right: 1rem;
}

.user-info h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
}

.user-info p {
  margin: 0.25rem 0 0;
  color: #718096;
}

.user-details {
  margin: 1rem 0;
  padding: 0.75rem 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.user-details p {
  margin: 0.5rem 0;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.role-badge.admin {
  background-color: #ebf8ff;
  color: #3182ce;
}

.role-badge.user {
  background-color: #f0fff4;
  color: #38a169;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.primary-button, .success-button {
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
}

.primary-button {
  background-color: #4299e1;
  color: white;
}

.primary-button:hover {
  background-color: #3182ce;
}

.success-button {
  background-color: #48bb78;
  color: white;
}

.success-button:hover {
  background-color: #38a169;
}

.status-badge {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  background-color: #3182ce;
  color: white;
}

@media (max-width: 640px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .user-header {
    flex-direction: column;
    text-align: center;
  }
  
  .user-avatar {
    margin-right: 0;
    margin-bottom: 1rem;
  }
}
</style>
`;

    files['src/views/Home.klx'] = `<template>
  <div class="home">
    <section class="hero">
      <h1>Welcome to KalxJS</h1>
      <p class="subtitle">A powerful JavaScript framework for building modern web applications</p>
      
      <div class="cta-buttons">
        <Button primary text="Get Started" @click="handleClick" />
        <RouterLink to="/about" class="learn-more-link">Learn More</RouterLink>
      </div>
    </section>
    
    <section class="features">
      <h2>Key Features</h2>
      
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">🚀</div>
          <h3>Performance</h3>
          <p>Optimized rendering and reactivity system for blazing fast applications</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🧩</div>
          <h3>Components</h3>
          <p>Build your UI with reusable, composable components</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🔄</div>
          <h3>Reactivity</h3>
          <p>Automatic UI updates when your data changes</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📱</div>
          <h3>Responsive</h3>
          <p>Create applications that work on any device</p>
        </div>
      </div>
    </section>
    
    <section class="getting-started">
      <h2>Getting Started</h2>
      <div class="code-block">
        <pre><code>npm create kalxjs@latest my-project</code></pre>
        <button class="copy-button" @click="copyCommand">Copy</button>
      </div>
      <p>Run this command to create a new KalxJS project with all the features you need.</p>
    </section>
  </div>
</template>

<script>
import { defineComponent, ref } from '@kalxjs/core';
import { useRouter, RouterLink } from '@kalxjs/router';
import Button from '../components/Button.klx';

export default defineComponent({
  name: 'Home',
  components: {
    Button,
    RouterLink
  },
  setup() {
    console.log('Home component setup called');
    const copied = ref(false);

    // Get router functionality using the composition API
    const { push } = useRouter();

    const handleClick = () => {
      console.log('Get Started button clicked!');
      push('/about');
    };

    const copyCommand = () => {
      navigator.clipboard.writeText('npm create kalxjs@latest my-project');
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    };

    return {
      handleClick,
      copyCommand,
      copied
    };
  }
});
</script>

<style>
.home {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 3rem 1rem;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #f6f9fc 0%, #edf2f7 100%);
  border-radius: 8px;
}

h1 {
  font-size: 2.5rem;
  color: #2d3748;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.25rem;
  color: #4a5568;
  margin-bottom: 2rem;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.learn-more-link {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: transparent;
  border: 1px solid #4299e1;
  color: #4299e1;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s;
}

.learn-more-link:hover {
  background-color: rgba(66, 153, 225, 0.1);
}

.features {
  margin-bottom: 3rem;
}

h2 {
  font-size: 1.75rem;
  color: #2d3748;
  margin-bottom: 1.5rem;
  text-align: center;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

h3 {
  font-size: 1.25rem;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.getting-started {
  padding: 2rem;
  background-color: #f7fafc;
  border-radius: 8px;
}

.code-block {
  position: relative;
  margin: 1.5rem 0;
}

pre {
  background-color: #2d3748;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

code {
  font-family: 'Fira Code', monospace;
}

.copy-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.copy-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .hero {
    padding: 2rem 1rem;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
`;
  }

  if (config.features.state) {
    files['src/store/index.js'] = `import { createStore } from '@kalxjs/state';

    // Create and export the main store
    export default createStore({
      state: {
        count: 0,
        todos: [],
        loading: false,
        error: null
      },
      getters: {
        doubleCount: state => state.count * 2,
        completedTodos: state => state.todos.filter(todo => todo.completed),
        pendingTodos: state => state.todos.filter(todo => !todo.completed)
      },
      mutations: {
        increment(state) {
          state.count++;
        },
        decrement(state) {
          state.count--;
        },
        setCount(state, value) {
          state.count = value;
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
        },
        setLoading(state, status) {
          state.loading = status;
        },
        setError(state, error) {
          state.error = error;
        }
      },
      actions: {
        async fetchData({ commit }) {
          commit('setLoading', true);
          commit('setError', null);

          try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            commit('setCount', 42);
          } catch (error) {
            commit('setError', error.message);
          } finally {
            commit('setLoading', false);
          }
        }
      }
    }); `;

    // Add a useStore composable for the Composition API
    files['src/store/useStore.js'] = `import { createStore } from '@kalxjs/state';
    import store from './index';

    /**
     * Composition API hook for using the store
     * @param {Object} options - Optional custom store options
     * @returns {Object} Store instance with state, getters, actions, etc.
     */
    export function useStore(options = {}) {
      // If no options provided, return the main store
      if (Object.keys(options).length === 0) {
        return {
          state: store.state,
          getters: store.getters,
          dispatch: store.dispatch.bind(store),
          commit: store.commit.bind(store),
          $reset: store.$reset && store.$reset.bind(store),
          $patch: store.$patch && store.$patch.bind(store),
          $subscribe: store.$subscribe && store.$subscribe.bind(store),
          // Return the full store for advanced usage
          $store: store
        };
      }

      // Create a new store with the provided options
      return createStore(options);
    } `;
  }

  if (config.features.scss) {
    files['src/styles/main.scss'] = `/* Base styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f7f8fa;
  color: #333;
  line-height: 1.6;
}

/* Layout */
.app {
  padding: 2rem;
  text-align: center;
  max-width: 1200px;
  margin: 0 auto;
}

.home {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin-top: 1rem;
}

/* Typography */
h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #2d3748;
}

h2 {
  font-size: 1.8rem;
  margin-bottom: 0.8rem;
  color: #4a5568;
}

p {
  margin-bottom: 1.5rem;
  color: #4a5568;
}

/* Buttons */
button {
  background-color: #4299e1;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #3182ce;
}

button:active {
  background-color: #2b6cb0;
}`;
  }

  // Write all files
  for (const [file, content] of Object.entries(files)) {
    await fs.writeFile(path.join(targetDir, file), content);
  }
}

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

  if (config.features.plugins) {
    templateFiles.push('src/plugins/index.js');
    templateFiles.push('src/plugins/logger.js');
  }

  if (config.features.ai) {
    templateFiles.push('src/ai/aiManager.js');
    templateFiles.push('src/components/AITextGenerator.js');
  }

  if (config.features.sfc) {
    templateFiles.push('src/components/sfc/Card.klx');
  }

  // Process each template file
  for (const file of templateFiles) {
    const filePath = path.join(targetDir, file);

    // Skip if file doesn't exist
    if (!fs.existsSync(filePath)) {
      continue;
    }

    try {
      // Read file content
      let content = await fs.readFile(filePath, 'utf8');

      // Replace common placeholders
      content = content.replace(/\{\{projectName\}\}/g, config.projectName);
      content = content.replace(/\{\{version\}\}/g, '0.1.0');
      content = content.replace(/\{\{description\}\}/g, `A modern web application built with KalxJS`);

      // Replace feature flags
      Object.entries(config.features).forEach(([feature, enabled]) => {
        content = content.replace(new RegExp(`\\{ \\{ features\\.${feature} \\ } \\ } `, 'g'), enabled.toString());
      });

      // Process conditional blocks
      // Format: <!-- IF feature.name -->content<!-- ENDIF -->
      const conditionalRegex = /<!--\s*IF\s+features\.(\w+)\s*-->([\s\S]*?)<!--\s*ENDIF\s*-->/g;
      content = content.replace(conditionalRegex, (match, feature, block) => {
        return config.features[feature] ? block : '';
      });

      // Write processed content back to file
      await fs.writeFile(filePath, content, 'utf8');

    } catch (error) {
      console.error(`Error processing template file ${file}: `, error);
    }
  }

  // Process package.json separately (it's a JSON file)
  const packageJsonPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = await fs.readJSON(packageJsonPath);

      // Update package.json fields
      packageJson.name = config.projectName;
      packageJson.description = `A modern web application built with KalxJS`;

      // Add custom scripts based on features
      if (config.features.testing) {
        packageJson.scripts.test = 'vitest run';
        packageJson.scripts['test:watch'] = 'vitest';
      }

      if (config.features.linting) {
        packageJson.scripts.lint = 'eslint src --ext .js,.klx';
        packageJson.scripts['lint:fix'] = 'eslint src --ext .js,.klx --fix';
      }

      // Write updated package.json
      await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });

    } catch (error) {
      console.error('Error processing package.json:', error);
    }
  }
}

module.exports = create;
