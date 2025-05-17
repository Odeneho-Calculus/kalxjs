const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { promisify } = require('util');
const ora = require('ora');
const gradient = require('gradient-string');
const boxen = require('boxen');
const cliProgress = require('cli-progress');

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const access = promisify(fs.access);

/**
 * Generate a new component
 * @param {string} componentName - Name of the component
 * @param {Object} options - Command options
 */
async function component(componentName, options = {}) {
  // Display a fancy header
  console.log('\n');
  console.log(gradient.pastel.multiline('╔═════════════════════════════════════╗'));
  console.log(gradient.pastel.multiline('║                                     ║'));
  console.log(gradient.pastel.multiline('║     KalxJS Component Generator      ║'));
  console.log(gradient.pastel.multiline('║                                     ║'));
  console.log(gradient.pastel.multiline('╚═════════════════════════════════════╝'));
  console.log('\n');

  // Start the spinner with a custom spinner
  const spinner = ora({
    text: chalk.cyan(`Creating component ${chalk.bold(componentName)}...`),
    spinner: 'dots',
    color: 'cyan'
  }).start();

  if (!componentName) {
    spinner.fail(chalk.red('Component name is required'));
    console.log('\n');
    console.log(boxen(
      chalk.redBright('⚠️ Component Generation Failed ⚠️') + '\n\n' +
      chalk.white('A component name must be provided.') + '\n\n' +
      chalk.yellow('Example usage:') + '\n' +
      chalk.cyan('  kalxjs component Button') + '\n' +
      chalk.cyan('  kalxjs c Header --style scss --props'),
      {
        padding: 1,
        margin: 1,
        borderColor: 'red',
        borderStyle: 'round'
      }
    ));
    process.exit(1);
  }

  try {
    const cwd = process.cwd();

    // Check if we're in a kalxjs project
    spinner.text = chalk.cyan('Validating project structure...');

    try {
      const packageJsonPath = path.join(cwd, 'package.json');
      await access(packageJsonPath);
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

      if (!packageJson.dependencies || !packageJson.dependencies.kalxjs) {
        spinner.warn(chalk.yellow('This does not appear to be a kalxjs project, but proceeding anyway...'));
      } else {
        spinner.succeed(chalk.green('Valid KalxJS project detected'));
      }
    } catch (err) {
      spinner.fail(chalk.red('No package.json found. Are you in a kalxjs project directory?'));
      console.log('\n');
      console.log(boxen(
        chalk.redBright('⚠️ Project Validation Failed ⚠️') + '\n\n' +
        chalk.white('This command must be run from the root of a KalxJS project.') + '\n\n' +
        chalk.yellow('To create a new project, run:') + '\n' +
        chalk.cyan('  kalxjs create my-app'),
        {
          padding: 1,
          margin: 1,
          borderColor: 'red',
          borderStyle: 'round'
        }
      ));
      process.exit(1);
    }

    // Format component name (PascalCase)
    spinner.text = chalk.cyan('Formatting component name...');
    const formattedName = componentName
      .split(/[-_\s]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');

    if (formattedName !== componentName) {
      spinner.info(chalk.blue(`Component name formatted to PascalCase: ${chalk.bold(formattedName)}`));
    }

    // Create a progress bar for the component creation process
    spinner.succeed(chalk.green('Preparation complete'));
    console.log('\n');

    const progress = new cliProgress.SingleBar({
      format: chalk.cyan('{bar}') + ' | {percentage}% | {state}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      clearOnComplete: true
    });

    progress.start(100, 0, { state: 'Starting component creation' });

    // Determine directory for the component based on the KalxJS project structure
    const componentDir = options.dir
      ? path.resolve(cwd, options.dir)
      : path.join(cwd, 'app', 'components');

    progress.update(10, { state: `Setting up directory: ${path.relative(cwd, componentDir)}` });

    // Ensure component directory exists
    await mkdir(componentDir, { recursive: true });
    progress.update(20, { state: 'Component directory created' });

    // Use .klx extension for single file components if SFC option is enabled
    const useKlx = options.sfc !== false; // Default to true if not specified
    const componentFilePath = path.join(componentDir, `${formattedName}${useKlx ? '.klx' : '.js'}`);

    progress.update(30, { state: `Checking if component already exists` });

    // Check if component already exists
    try {
      await access(componentFilePath);
      progress.stop();
      console.log('\n');
      console.log(boxen(
        chalk.redBright('⚠️ Component Already Exists ⚠️') + '\n\n' +
        chalk.white(`Component ${chalk.bold(formattedName)} already exists at:`) + '\n' +
        chalk.yellow(componentFilePath) + '\n\n' +
        chalk.white('Choose a different name or use a different directory.'),
        {
          padding: 1,
          margin: 1,
          borderColor: 'red',
          borderStyle: 'round'
        }
      ));
      process.exit(1);
    } catch (err) {
      // File doesn't exist, we can proceed
      progress.update(40, { state: `Component name is available` });
    }

    // Create component content using template
    progress.update(50, { state: `Generating component code` });
    const componentTemplate = useKlx
      ? getKlxComponentTemplate(formattedName, options)
      : getDefaultComponentTemplate(formattedName, options);
    await writeFile(componentFilePath, componentTemplate);
    progress.update(60, { state: `Component file created` });

    // Create test file if requested
    if (options.test) {
      progress.update(65, { state: `Setting up test files` });
      const testDir = path.join(cwd, 'app', 'components', '__tests__');
      await mkdir(testDir, { recursive: true });

      const testFilePath = path.join(testDir, `${formattedName}.test.js`);
      const testTemplate = getComponentTestTemplate(formattedName);

      await writeFile(testFilePath, testTemplate);
      progress.update(75, { state: `Test file created` });
    } else {
      progress.update(75, { state: `Skipping test file creation` });
    }

    // Create style file if requested
    if (options.style) {
      progress.update(80, { state: `Setting up style files` });
      let styleExt = 'css';
      if (typeof options.style === 'string') {
        styleExt = options.style;
      }

      // Create styles in the app styles directory for better organization
      const styleDir = path.join(cwd, 'app', 'styles', 'components');
      await mkdir(styleDir, { recursive: true });

      const styleFilePath = path.join(styleDir, `${formattedName.toLowerCase()}.${styleExt}`);
      const styleTemplate = getComponentStyleTemplate(formattedName.toLowerCase());

      await writeFile(styleFilePath, styleTemplate);
      progress.update(90, { state: `Style file created (${styleExt})` });
    } else {
      progress.update(90, { state: `Skipping style file creation` });
    }

    // Complete the progress bar
    progress.update(100, { state: `Component creation complete` });
    progress.stop();

    // Display success message
    console.log('\n');
    console.log(boxen(
      gradient.rainbow(`🎉 Component ${formattedName} Created! 🎉`) + '\n\n' +
      chalk.white('Location: ') + chalk.green(path.relative(cwd, componentFilePath)) + '\n\n' +
      chalk.white('Files:') + '\n' +
      chalk.cyan(`  ➜ app/components/${formattedName}${useKlx ? '.klx' : '.js'}`) + chalk.gray(' - Component implementation') +
      (options.style ? `\n${chalk.cyan(`  ➜ app/styles/components/${formattedName.toLowerCase()}.${typeof options.style === 'string' ? options.style : 'css'}`)}` + chalk.gray(' - Component styles') : '') +
      (options.test ? `\n${chalk.cyan(`  ➜ app/components/__tests__/${formattedName}.test.js`)}` + chalk.gray(' - Component tests') : '') + '\n\n' +
      chalk.white('Import with: ') + chalk.yellow(`import ${formattedName} from './${path.relative(cwd, componentDir).replace(/\\/g, '/')}/${formattedName}';`),
      {
        padding: 1,
        margin: 1,
        borderColor: 'green',
        borderStyle: 'round'
      }
    ));

  } catch (err) {
    // Stop any running progress bars
    try {
      progress?.stop();
    } catch (e) {
      // Ignore errors from progress bar
    }

    spinner.fail(chalk.red('Component generation failed'));

    // Display error in a fancy box
    console.log('\n');
    console.log(boxen(
      chalk.redBright('⚠️ Component Generation Failed ⚠️') + '\n\n' +
      chalk.white('Error details:') + '\n' +
      chalk.red(err.stack || err.message),
      {
        padding: 1,
        margin: 1,
        borderColor: 'red',
        borderStyle: 'round'
      }
    ));

    // Provide some helpful tips
    console.log('\n');
    console.log(chalk.yellow('Troubleshooting tips:'));
    console.log(chalk.cyan('1.') + ' Check if you have write permissions in the target directory');
    console.log(chalk.cyan('2.') + ' Try using a different component name');
    console.log(chalk.cyan('3.') + ' Specify a different directory with ' + chalk.white('--dir option'));
    console.log('\n');

    process.exit(1);
  }
}

/**
 * Get default component template
 * @param {string} componentName - Component name
 * @param {Object} options - Component options
 * @returns {string} - Component template
 */
function getDefaultComponentTemplate(componentName, options = {}) {
  let template = `import { h, Component } from 'kalxjs';
${options.style ? `import '../styles/components/${componentName.toLowerCase()}${typeof options.style === 'string' ? '.' + options.style : '.css'}';` : ''}

class ${componentName} extends Component {\n`;

  if (options.state) {
    template += `  constructor(props) {
    super(props);
    this.state = {
      count: 0
    };
  }\n`;
  } else {
    template += `  constructor(props) {
    super(props);
    this.state = {};
  }\n`;
  }

  if (options.methods) {
    template += `
  increment = () => {
    this.setState({ count: this.state.count + 1 });
  }\n`;
  }

  if (options.lifecycle) {
    template += `
  componentDidMount() {
    console.log('${componentName} mounted');
  }

  componentWillUnmount() {
    // Called when component is about to be removed
  }

  componentDidUpdate(prevProps, prevState) {
    // Called after component updates
  }\n`;
  }

  template += `
  render() {
    ${options.state ? 'const { count } = this.state;' : ''}
    ${options.props ? 'const { title } = this.props;' : ''}
    
    return (
      <div className="${componentName.toLowerCase()}">
        <h2>${options.props ? '{title}' : componentName}</h2>
        ${options.state ? '<p>Count: {count}</p>' : ''}
        ${options.state && options.methods ? '<button onClick={this.increment}>Increment</button>' : ''}
      </div>
    );
  }
}

${options.props ? `${componentName}.defaultProps = {
  title: '${componentName}'
};` : ''}

export default ${componentName};
`;

  return template;
}

/**
 * Get component test template
 * @param {string} componentName - Component name
 * @returns {string} - Test template
 */
function getComponentTestTemplate(componentName) {
  return `import { mount } from '@kalxjs/test-utils';
import ${componentName} from '../../${componentName}';

describe('${componentName}', () => {
  test('mounts successfully', () => {
    const wrapper = mount(${componentName});
    expect(wrapper.find('h2').text()).toBe('${componentName}');
  });
});
`;
}

/**
 * Get component style template
 * @param {string} componentName - Component name in lowercase
 * @returns {string} - Style template
 */
function getComponentStyleTemplate(componentName) {
  return `.${componentName} {
  padding: 1rem;
  margin: 1rem;
  border: 1px solid #eee;
  border-radius: 4px;
}

.${componentName} h2 {
  margin-top: 0;
  color: #333;
}

.${componentName} button {
  padding: 0.5rem 1rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.${componentName} button:hover {
  background-color: #357abd;
}
`;
}

/**
 * Get KLX single file component template
 * @param {string} componentName - Component name
 * @param {Object} options - Component options
 * @returns {string} - KLX component template
 */
function getKlxComponentTemplate(componentName, options = {}) {
  // Template section
  let template = `<template>
  <div class="${componentName.toLowerCase()}">
    <h2>${componentName}</h2>`;

  if (options.state) {
    template += `
    <p>Count: {{ count }}</p>
    <div class="button-group">
      <button class="button" data-event-increment="click">Increment</button>
      <button class="button reset" data-event-reset="click">Reset</button>
    </div>`;
  }

  template += `
  </div>
</template>

`;

  // Script section
  template += `<script>
import { Component } from 'kalxjs';

export default {
  name: '${componentName}',
`;

  if (options.props) {
    template += `
  props: {
    message: {
      type: String,
      required: true
    }
  },
`;
  }

  if (options.state) {
    template += `
  data() {
    return {
      count: 0
    };
  },
`;
  } else {
    template += `
  data() {
    return {};
  },
`;
  }

  if (options.state) {
    template += `
  computed: {
    doubleCount() {
      return this.count * 2;
    }
  },
`;
  }

  if (options.methods || options.state) {
    template += `
  methods: {`;

    if (options.state) {
      template += `
    increment() {
      this.count++;
    },
    
    reset() {
      this.count = 0;
    }`;
    }

    template += `
  },
`;
  }

  if (options.lifecycle) {
    template += `
  beforeMount() {
    // Called before component is mounted
  },

  mounted() {
    console.log('${componentName} mounted');
  },

  beforeUpdate() {
    // Called before component updates
  },

  updated() {
    // Called after component updates
  },
`;
  } else {
    template += `
  mounted() {
    console.log('${componentName} mounted');
  },
`;
  }

  template += `};
</script>

`;

  // Style section
  template += `<style>
.${componentName.toLowerCase()} {
  padding: 1rem;
  margin: 1rem;
  border: 1px solid #eee;
  border-radius: 4px;
}

.${componentName.toLowerCase()} h2 {
  margin-top: 0;
  color: #333;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.button {
  padding: 0.5rem 1rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background-color: #3aa776;
}

.button.reset {
  background-color: #7f8c8d;
}

.button.reset:hover {
  background-color: #6c7a7b;
}
</style>`;

  return template;
}

module.exports = component;