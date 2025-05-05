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
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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

const app = createApp(App);
${config.features.router ? 'app.use(router);' : ''}
${config.features.state ? 'app.use(store);' : ''}

app.mount('#app');`,

    'src/App.js': `import { defineComponent, h } from '@kalxjs/core';

export default defineComponent({
  name: 'App',
  render() {
    return h('div', { class: 'app' }, [
      h('h1', null, 'Welcome to KalxJS'),
      ${config.features.router ? 'h("router-view")' : 'h("p", null, "Edit src/App.js to get started")'}
    ]);
  }
});`,

    'vite.config.js': `import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000
  }
});`
  };

  // Add feature-specific files
  if (config.features.router) {
    files['src/router/index.js'] = `import { createRouter } from '@kalxjs/router';
import Home from '../views/Home.js';

export default createRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: Home
    }
  ]
});`;

    files['src/views/Home.js'] = `import { defineComponent, h } from '@kalxjs/core';

export default defineComponent({
  name: 'Home',
  render() {
    return h('div', { class: 'home' }, [
      h('h2', null, 'Home Page')
    ]);
  }
});`;
  }

  if (config.features.state) {
    files['src/store/index.js'] = `import { createStore } from '@kalxjs/state';

export default createStore({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++;
    }
  }
});`;
  }

  if (config.features.scss) {
    files['src/styles/main.scss'] = `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app {
  padding: 2rem;
  text-align: center;
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