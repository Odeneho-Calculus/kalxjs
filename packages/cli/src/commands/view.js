/**
 * view.js - kalxjs view generator
 * This module handles generating view (page) components for kalxjs applications
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { promisify } = require('util');

// Promisify fs methods
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const access = promisify(fs.access);

/**
 * Generate a new view (page component)
 * @param {string} name - Name of the view
 * @param {Object} options - Command options
 */
async function generateView(name, options = {}) {
  if (!name) {
    console.error(chalk.red('View name is required'));
    process.exit(1);
  }

  const spinner = ora('Generating view...').start();

  try {
    // Format name correctly (convert to PascalCase)
    const formattedName = formatComponentName(name);
    const originalName = name;

    // Get current working directory
    const cwd = process.cwd();

    // Determine the target directory
    let targetDir = options.dir || 'src/views';

    // Make sure targetDir is absolute
    if (!path.isAbsolute(targetDir)) {
      targetDir = path.resolve(cwd, targetDir);
    }

    // Create directory if it doesn't exist
    await ensureDirectoryExists(targetDir);

    // Check if we're in a kalxjs project
    const iskalxjsProject = await checkIfkalxjsProject(cwd);
    if (!iskalxjsProject) {
      spinner.warn('Not in a kalxjs project directory. Creating view anyway, but it may not work as expected.');
    }

    // Path for the new view file
    const viewFilePath = path.join(targetDir, `${formattedName}.js`);

    // Check if view already exists
    if (await fileExists(viewFilePath)) {
      spinner.fail(`View ${chalk.cyan(formattedName)} already exists at ${chalk.cyan(viewFilePath)}`);

      // Ask if user wants to overwrite
      spinner.stop();
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: 'Do you want to overwrite the existing view?',
        default: false
      }]);

      if (!overwrite) {
        console.log(chalk.yellow('View generation cancelled.'));
        return;
      }

      // If yes, continue with spinner
      spinner.text = 'Overwriting view...';
      spinner.start();
    }

    // Get template options if needed
    let templateOptions = options;

    if (!options.skipPrompts) {
      spinner.stop();
      templateOptions = await promptForOptions(options);
      spinner.text = 'Generating view with selected options...';
      spinner.start();
    }

    // Generate view content
    const viewContent = generateViewContent(formattedName, originalName, templateOptions);

    // Write the file
    await writeFile(viewFilePath, viewContent);

    // Success message
    spinner.succeed(`View ${chalk.green(formattedName)} created successfully at ${chalk.cyan(viewFilePath)}`);

    // If router is available, suggest how to use the view
    if (iskalxjsProject && await hasRouter(cwd)) {
      console.log('\nTo use this view with the router, add the following to your router configuration:');
      console.log(chalk.cyan(`
import ${formattedName} from '${getRelativePath(cwd, viewFilePath)}';

// Add to your routes array
{
  path: '/${originalName.toLowerCase()}',
  name: '${formattedName}',
  component: ${formattedName}
}
`));
    }

  } catch (error) {
    spinner.fail('Failed to generate view');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Format component name to PascalCase
 * @param {string} name - Input name
 * @returns {string} - PascalCase name
 */
function formatComponentName(name) {
  // Handle kebab-case, snake_case, and camelCase
  return name
    .split(/[-_\s]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Ensure a directory exists, create it if it doesn't
 * @param {string} dir - Directory path
 */
async function ensureDirectoryExists(dir) {
  try {
    await access(dir, fs.constants.F_OK);
  } catch (error) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to file
 * @returns {boolean} - True if file exists
 */
async function fileExists(filePath) {
  try {
    await access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if we're in a kalxjs project
 * @param {string} cwd - Current working directory
 * @returns {boolean} - True if in a kalxjs project
 */
async function checkIfkalxjsProject(cwd) {
  try {
    const packageJsonPath = path.join(cwd, 'package.json');
    const packageExists = await fileExists(packageJsonPath);

    if (!packageExists) return false;

    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

    // Check if kalxjs is a dependency
    return !!(
      (packageJson.dependencies && packageJson.dependencies.kalxjs) ||
      (packageJson.devDependencies && packageJson.devDependencies.kalxjs)
    );
  } catch {
    return false;
  }
}

/**
 * Check if the project has router installed
 * @param {string} cwd - Current working directory
 * @returns {boolean} - True if router is installed
 */
async function hasRouter(cwd) {
  try {
    const packageJsonPath = path.join(cwd, 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

    // Check if kalxjs-router is a dependency
    return !!(
      (packageJson.dependencies && packageJson.dependencies['@kalxjs/router']) ||
      (packageJson.devDependencies && packageJson.devDependencies['@kalxjs/router'])
    );
  } catch {
    return false;
  }
}

/**
 * Get a relative path from cwd to file
 * @param {string} cwd - Current working directory
 * @param {string} filePath - Absolute file path
 * @returns {string} - Relative path
 */
function getRelativePath(cwd, filePath) {
  let relPath = path.relative(cwd, filePath);

  // Ensure it starts with './' or '../'
  if (!relPath.startsWith('.')) {
    relPath = `./${relPath}`;
  }

  // Remove file extension
  return relPath.replace(/\.js$/, '');
}

/**
 * Prompt for additional view options
 * @param {Object} baseOptions - Base options from command line
 * @returns {Object} - Combined options
 */
async function promptForOptions(baseOptions) {
  const questions = [];

  // Only ask questions that weren't provided as command line options
  if (baseOptions.script === undefined) {
    questions.push({
      type: 'confirm',
      name: 'script',
      message: 'Add script section with lifecycle hooks and methods?',
      default: true
    });
  }

  if (!questions.length) return baseOptions;

  const answers = await inquirer.prompt(questions);
  return { ...baseOptions, ...answers };
}

/**
 * Generate the content for the view file
 * @param {string} formattedName - PascalCase name
 * @param {string} originalName - Original input name
 * @param {Object} options - Template options
 * @returns {string} - File content
 */
function generateViewContent(formattedName, originalName, options) {
  let cssClassName = originalName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  let content = `import { defineComponent, h } from '@kalxjs/core';

/**
 * ${formattedName} View
 * @description A page component for ${originalName}
 */
export default defineComponent({
  name: '${formattedName}',
  
  data() {
    return {
      title: '${formattedName}',
      isLoading: false
    };
  },`;

  if (options.script) {
    content += `
  
  // Component properties
  props: {
    id: {
      type: [String, Number],
      default: null
    }
  },
  
  // Computed properties
  computed: {
    hasId() {
      return !!this.id;
    }
  },
  
  // Methods
  methods: {
    /**
     * Navigate back to previous page
     */
    goBack() {
      if (this.$router) {
        this.$router.back();
      }
    },
    
    /**
     * Example method to load data
     */
    async loadData() {
      this.isLoading = true;
      try {
        // Simulated async operation
        await new Promise(resolve => setTimeout(resolve, 500));
        // Add your data fetching logic here
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        this.isLoading = false;
      }
    }
  },
  
  // Lifecycle hooks
  created() {
    // Component created
  },
  
  mounted() {
    this.loadData();
  },
  
  beforeUnmount() {
    // Clean up if needed
  },`;
  }

  // Always include render function
  content += `
  
  // Render the view
  render() {
    return h('div', { class: '${cssClassName}-view' }, [
      h('header', { class: '${cssClassName}-header' }, [
        h('h1', {}, [this.title])
      ]),
      
      h('main', { class: '${cssClassName}-content' }, [
        this.isLoading
          ? h('div', { class: 'loading' }, ['Loading...'])
          : h('div', {}, [
              h('p', {}, ['This is the ${formattedName} view component.'])
            ])
      ]),
      
      h('footer', { class: '${cssClassName}-footer' }, [
        h('button', { 
          onClick: ${options.script ? 'this.goBack' : '() => { if (this.$router) this.$router.back(); }'},
          class: 'btn-back'
        }, ['Back'])
      ])
    ]);
  }
});
`;

  return content;
}

module.exports = { view };