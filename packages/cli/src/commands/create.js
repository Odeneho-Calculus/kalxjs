const fs = require('fs-extra');
const path = require('path');
const validateProjectName = require('validate-npm-package-name');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const deepmerge = require('deepmerge');
const execa = require('execa');

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
      linting: true
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
        name: 'testing',
        message: 'Add Testing setup?',
        default: true
      },
      {
        type: 'confirm',
        name: 'linting',
        message: 'Add ESLint setup?',
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

    // Install dependencies
    if (!options.skipInstall) {
      spinner.text = 'Installing dependencies...';
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
    config.features.scss && 'src/styles'
  ].filter(Boolean);

  for (const dir of dirs) {
    await fs.ensureDir(path.join(targetDir, dir));
  }

  // Create base files
  const files = {
    'public/.gitkeep': '',
    'src/assets/.gitkeep': '',
    'src/components/.gitkeep': '',
    'src/components/Button.js': `import { defineComponent, h } from '@kalxjs/core';

export default defineComponent({
  name: 'Button',
  props: {
    text: String,
    primary: Boolean,
    onClick: Function
  },
  setup(props) {
    const getStyle = () => {
      const baseStyle = 'padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;';
      const colorStyle = props.primary 
        ? 'background-color: #4299e1; color: white;' 
        : 'background-color: #e2e8f0; color: #4a5568;';
      return baseStyle + colorStyle;
    };
    
    return { getStyle };
  },
  render() {
    return h('button', {
      style: this.getStyle(),
      onclick: this.onClick
    }, this.text || this.$slots.default);
  }
});`,
    '.gitignore': `# Logs
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
`,
    'README.md': `# ${config.projectName}

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
${config.features.router ? '│   ├── views/       # Page components\n│   ├── router/      # Router configuration\n' : ''}${config.features.state ? '│   ├── store/       # State management\n' : ''}${config.features.scss ? '│   ├── styles/      # SCSS styles\n' : ''}│   ├── App.js       # Root component
│   └── main.js      # Application entry point
├── index.html       # HTML template
└── vite.config.js   # Vite configuration
\`\`\`

## License

MIT
`,
    'index.html': `<!DOCTYPE html>
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
</html>`,

    'src/main.js': `import { createApp } from '@kalxjs/core';
import App from './App.js';
${config.features.router ? "import router from './router';" : ''}
${config.features.state ? "import store from './store';" : ''}
${config.features.scss ? "import './styles/main.scss';" : ''}

try {
  const app = createApp(App);
  ${config.features.router ? 'app.use(router);' : ''}
  ${config.features.state ? 'app.use(store);' : ''}
  
  app.mount('#app');
  console.log('Application successfully mounted');
} catch (error) {
  console.error('Error initializing app:', error);
  
  // Fallback rendering in case of error
  document.getElementById('app').innerHTML = \`
    <div class="app" style="padding: 2rem; text-align: center;">
      <h1>Welcome to KalxJS</h1>
      <p>There was an error initializing the application.</p>
      <pre style="text-align: left; background: #f5f5f5; padding: 1rem; border-radius: 4px;">\${error.message}</pre>
    </div>
  \`;
}`,

    'src/App.js': `import { defineComponent, h } from '@kalxjs/core';

export default defineComponent({
  name: 'App',
  setup() {
    console.log('App component setup called');
    return {};
  },
  render() {
    console.log('App component render called');
    return h('div', { class: 'app', style: 'padding: 2rem; text-align: center;' }, [
      h('h1', { style: 'color: #333;' }, 'Welcome to KalxJS'),
      ${config.features.router ?
        `h("nav", { style: "margin: 1rem 0; padding: 0.5rem; background-color: #f8f9fa; border-radius: 4px;" }, [
        h("a", { href: "/", style: "margin-right: 1rem; color: #4299e1; text-decoration: none;" }, "Home"),
        h("a", { href: "/about", style: "color: #4299e1; text-decoration: none;" }, "About")
      ]),
      h("div", { style: "padding: 1rem; margin-top: 1rem; border-radius: 8px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" }, [h("router-view")])` :
        'h("p", { style: "margin-top: 1rem;" }, "Edit src/App.js to get started")'}
    ]);
  }
});`,

    'vite.config.js': `import { defineConfig } from 'vite';

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
  optimizeDeps: {
    include: ['@kalxjs/core', ${config.features.router ? "'@kalxjs/router'," : ''} ${config.features.state ? "'@kalxjs/state'," : ''}]
  }
});`
  };

  // Add feature-specific files
  if (config.features.router) {
    files['src/router/index.js'] = `import { createRouter } from '@kalxjs/router';
import { h } from '@kalxjs/core';
import Home from '../views/Home.js';

// Create an About page component
const About = {
  name: 'About',
  render() {
    return h('div', { class: 'about', style: 'padding: 1rem;' }, [
      h('h2', { style: 'color: #4a5568;' }, 'About Page'),
      h('p', null, 'This is the about page content.'),
      h('p', null, 'KalxJS is a modern JavaScript framework for building user interfaces.')
    ]);
  }
};

// Create a NotFound page component
const NotFound = {
  name: 'NotFound',
  render() {
    return h('div', { class: 'not-found', style: 'padding: 1rem; text-align: center;' }, [
      h('h2', { style: 'color: #e53e3e;' }, '404 - Page Not Found'),
      h('p', null, 'The page you are looking for does not exist.'),
      h('a', { 
        href: '/', 
        style: 'color: #4299e1; text-decoration: none;'
      }, 'Go back to home')
    ]);
  }
};

export default createRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: Home
    },
    {
      path: '/about',
      component: About
    },
    {
      path: '*',
      component: NotFound
    }
  ]
});`;

    files['src/views/Home.js'] = `import { defineComponent, h } from '@kalxjs/core';
import Button from '../components/Button.js';

export default defineComponent({
  name: 'Home',
  setup() {
    console.log('Home component setup called');
    
    const handleClick = () => {
      console.log('Button clicked!');
      alert('Button clicked!');
    };
    
    return { handleClick };
  },
  render() {
    console.log('Home component render called');
    return h('div', { class: 'home', style: 'padding: 1rem;' }, [
      h('h2', { style: 'color: #4a5568;' }, 'Home Page'),
      h('p', null, 'This is the home page content.'),
      h(Button, { 
        primary: true,
        text: 'Click me!',
        onClick: this.handleClick
      })
    ]);
  }
});`;
  }

  if (config.features.state) {
    files['src/store/index.js'] = `import { createStore } from '@kalxjs/state';

export default createStore({
  state: {
    count: 0,
    todos: [],
    loading: false,
    error: null
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
});`;
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
      "@kalxjs/core": "^1.2.2"
    },
    devDependencies: {
      "vite": "^5.0.0"
    }
  };

  // Add feature-specific dependencies
  if (config.features.router) pkg.dependencies["@kalxjs/router"] = "^1.2.2";
  if (config.features.state) pkg.dependencies["@kalxjs/state"] = "^1.2.2";
  if (config.features.scss) pkg.devDependencies["sass"] = "^1.69.0";

  // Write package.json
  await fs.writeJSON(path.join(targetDir, 'package.json'), pkg, { spaces: 2 });

  try {
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

async function processTemplates(targetDir, config) {
  // Implement template processing logic here
}

module.exports = create;