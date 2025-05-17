// packages/cli/src/cli.js

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');

// Define CLI version from package.json
const packageJson = require('../package.json');
const version = packageJson.version;

/**
 * Helper to create directories recursively
 * @param {string} dir - Directory path
 */
function createDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * Create a new file with content
 * @param {string} filePath - File path
 * @param {string} content - File content
 */
function createFile(filePath, content) {
    fs.writeFileSync(filePath, content);
}

/**
 * Copy a template file and replace placeholders
 * @param {string} src - Source template path
 * @param {string} dest - Destination path
 * @param {Object} vars - Variables to replace
 */
function copyTemplate(src, dest, vars = {}) {
    let content = fs.readFileSync(src, 'utf8');

    // Replace template variables
    Object.keys(vars).forEach(key => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        content = content.replace(regex, vars[key]);
    });

    createFile(dest, content);
}

/**
 * Create a new kalxjs project
 * @param {string} projectName - Project name
 * @param {Object} options - Project options
 */
async function createProject(projectName, options) {
    const spinner = ora('Creating project...').start();

    try {
        // Project directory
        const projectDir = path.resolve(process.cwd(), projectName);

        // Check if directory already exists
        if (fs.existsSync(projectDir)) {
            spinner.fail(`Directory ${projectName} already exists`);
            return;
        }

        // Create project directory
        createDir(projectDir);

        // Create basic structure
        createDir(path.join(projectDir, 'src'));
        createDir(path.join(projectDir, 'src', 'components'));
        createDir(path.join(projectDir, 'src', 'views'));
        createDir(path.join(projectDir, 'src', 'assets'));
        createDir(path.join(projectDir, 'public'));

        // Copy template files
        const templateDir = path.join(__dirname, 'templates', 'project');

        // Create package.json
        const packageJsonTemplate = {
            name: projectName,
            version: '0.1.0',
            private: true,
            scripts: {
                dev: 'vite',
                build: 'vite build',
                serve: 'vite preview'
            },
            dependencies: {
                '@kalxjs/core': '^1.2.2'
            },
            devDependencies: {
                'vite': '^2.5.0'
            }
        };

        // Add optional dependencies based on features
        if (options.router) {
            packageJsonTemplate.dependencies['@kalxjs/router'] = '^1.2.2';
        }

        if (options.state) {
            packageJsonTemplate.dependencies['@kalxjs/state'] = '^1.2.2';
        }

        createFile(
            path.join(projectDir, 'package.json'),
            JSON.stringify(packageJsonTemplate, null, 2)
        );

        // Create index.html
        const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`;

        createFile(path.join(projectDir, 'index.html'), indexHtml);

        // Create main.js
        let mainJs = `import kalxjs from '@kalxjs/core';
import App from './App.js';

const app = kalxjs.createApp(App);
`;

        if (options.router) {
            mainJs += `import { createRouter } from '@kalxjs/router';
import Home from './views/Home.js';

const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/', component: Home }
  ]
});

app.use(router);
`;
        }

        if (options.state) {
            mainJs += `import { createStore } from '@kalxjs/state';

const store = createStore({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++;
    }
  },
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment');
      }, 1000);
    }
  }
});

app.use(store);
`;
        }

        mainJs += `
app.mount('#app');
`;

        createFile(path.join(projectDir, 'src', 'main.js'), mainJs);

        // Create App.js
        let appJs = `export default {
  data() {
    return {
      message: 'Welcome to Your kalxjs App'
    };
  },
  render(h) {
    return h('div', { class: 'app' }, [
      h('h1', null, this.message),
      h('p', null, 'Start building your app!')`;

        if (options.router) {
            appJs += `,
      h('router-view')`;
        }

        appJs += `
    ]);
  }
};
`;

        createFile(path.join(projectDir, 'src', 'App.js'), appJs);

        // Create Home view if router is enabled
        if (options.router) {
            const homeJs = `export default {
  data() {
    return {
      title: 'Home Page'
    };
  },
  render(h) {
    return h('div', { class: 'home' }, [
      h('h2', null, this.title),
      h('p', null, 'This is the home page of your kalxjs application.')
    ]);
  }
};
`;

            createFile(path.join(projectDir, 'src', 'views', 'Home.js'), homeJs);
        }

        // Create a simple README
        const readme = `# ${projectName}

A project built with kalxjs framework.

## Project setup
\`\`\`
npm install
\`\`\`

### Compiles and hot-reloads for development
\`\`\`
npm run dev
\`\`\`

### Compiles and minifies for production
\`\`\`
npm run build
\`\`\`

### Preview the production build
\`\`\`
npm run serve
\`\`\`
`;

        createFile(path.join(projectDir, 'README.md'), readme);

        // Create .gitignore
        const gitignore = `node_modules
.DS_Store
dist
dist-ssr
*.local
`;

        createFile(path.join(projectDir, '.gitignore'), gitignore);

        spinner.succeed(`Project ${projectName} created successfully!`);
        console.log(`\nTo get started:`);
        console.log(chalk.cyan(`  cd ${projectName}`));
        console.log(chalk.cyan('  npm install'));
        console.log(chalk.cyan('  npm run dev'));

    } catch (error) {
        spinner.fail('Failed to create project');
        console.error(error);
    }
}

/**
 * Create a new component
 * @param {string} componentName - Component name
 * @param {Object} options - Component options
 */
function createComponent(componentName, options) {
    try {
        // Format the component name (PascalCase)
        const formattedName = componentName
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');

        const componentDir = path.resolve(process.cwd(), 'src', 'components');

        // Check if src/components directory exists
        if (!fs.existsSync(componentDir)) {
            console.error(chalk.red('Error: src/components directory not found. Are you in a kalxjs project?'));
            return;
        }

        // Component file path
        const componentPath = path.join(componentDir, `${formattedName}.js`);

        // Check if component already exists
        if (fs.existsSync(componentPath)) {
            console.error(chalk.red(`Component ${formattedName} already exists`));
            return;
        }

        // Create component content
        const componentContent = `export default {
  name: '${formattedName}',
  data() {
    return {
      // Component data
    };
  },${options.script ? `
  methods: {
    // Component methods
  },
  mounted() {
    // Component mounted lifecycle hook
  },` : ''}
  render(h) {
    return h('div', { class: '${componentName}' }, [
      h('h2', null, '${formattedName} Component')
    ]);
  }
};
`;

        // Create the component file
        createFile(componentPath, componentContent);

        console.log(chalk.green(`Component ${formattedName} created successfully!`));

    } catch (error) {
        console.error(chalk.red('Failed to create component:'), error);
    }
}

/**
 * Create a new view (page component)
 * @param {string} viewName - View name
 * @param {Object} options - View options
 */
function createView(viewName, options) {
    try {
        // Format the view name (PascalCase)
        const formattedName = viewName
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');

        const viewsDir = path.resolve(process.cwd(), 'src', 'views');

        // Check if src/views directory exists
        if (!fs.existsSync(viewsDir)) {
            // Create the directory if it doesn't exist
            createDir(viewsDir);
        }

        // View file path
        const viewPath = path.join(viewsDir, `${formattedName}.js`);

        // Check if view already exists
        if (fs.existsSync(viewPath)) {
            console.error(chalk.red(`View ${formattedName} already exists`));
            return;
        }

        // Create view content
        const viewContent = `export default {
  name: '${formattedName}',
  data() {
    return {
      title: '${formattedName} Page'
    };
  },${options.script ? `
  methods: {
    // View methods
  },
  mounted() {
    // View mounted lifecycle hook
  },` : ''}
  render(h) {
    return h('div', { class: '${viewName}-page' }, [
      h('h1', null, this.title),
      h('p', null, 'This is the ${viewName} page component.')
    ]);
  }
};
`;

        // Create the view file
        createFile(viewPath, viewContent);

        console.log(chalk.green(`View ${formattedName} created successfully!`));

    } catch (error) {
        console.error(chalk.red('Failed to create view:'), error);
    }
}

// Export CLI functions
module.exports = {
    createProject,
    createComponent,
    createView,
    program,
    version
};