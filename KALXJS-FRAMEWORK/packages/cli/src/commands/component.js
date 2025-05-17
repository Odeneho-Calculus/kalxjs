const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { promisify } = require('util');
const ora = require('ora');

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
  const spinner = ora(`Generating component: ${componentName}`).start();

  if (!componentName) {
    spinner.fail('Component name is required');
    process.exit(1);
  }

  try {
    const cwd = process.cwd();

    // Check if we're in a kalxjs project
    try {
      const packageJsonPath = path.join(cwd, 'package.json');
      await access(packageJsonPath);
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

      if (!packageJson.dependencies || !packageJson.dependencies.kalxjs) {
        spinner.warn('This does not appear to be a kalxjs project, but continuing anyway...');
      }
    } catch (err) {
      spinner.warn('Could not find package.json. Make sure you are in a kalxjs project directory.');
    }

    // Format component name (PascalCase)
    const formattedName = componentName
      .split(/[-_\s]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');

    // Determine directory for the component
    const componentDir = options.dir
      ? path.resolve(cwd, options.dir)
      : path.join(cwd, 'src', 'components');

    // Ensure component directory exists
    await mkdir(componentDir, { recursive: true });

    // Use .klx extension for single file components if SFC option is enabled
    const useKlx = options.sfc !== false; // Default to true if not specified
    const componentFilePath = path.join(componentDir, `${formattedName}${useKlx ? '.klx' : '.js'}`);

    // Check if component already exists
    try {
      await access(componentFilePath);
      spinner.fail(`Component ${formattedName} already exists at ${componentFilePath}`);
      process.exit(1);
    } catch (err) {
      // File doesn't exist, we can proceed
    }

    // Create component content using template
    const componentTemplate = useKlx
      ? getKlxComponentTemplate(formattedName, options)
      : getDefaultComponentTemplate(formattedName, options);
    await writeFile(componentFilePath, componentTemplate);

    // Create test file if requested
    if (options.test) {
      const testDir = path.join(cwd, 'tests', 'components');
      await mkdir(testDir, { recursive: true });

      const testFilePath = path.join(testDir, `${formattedName}.test.js`);
      const testTemplate = getComponentTestTemplate(formattedName);

      await writeFile(testFilePath, testTemplate);
      spinner.text = `Created test file at ${testFilePath}`;
    }

    // Create style file if requested
    if (options.style) {
      let styleExt = 'css';
      if (typeof options.style === 'string') {
        styleExt = options.style;
      }

      const styleDir = path.join(componentDir, 'styles');
      await mkdir(styleDir, { recursive: true });

      const styleFilePath = path.join(styleDir, `${formattedName.toLowerCase()}.${styleExt}`);
      const styleTemplate = getComponentStyleTemplate(formattedName.toLowerCase());

      await writeFile(styleFilePath, styleTemplate);
      spinner.text = `Created style file at ${styleFilePath}`;
    }

    spinner.succeed(`Component ${chalk.green(formattedName)} created successfully at ${componentFilePath}`);

    // Provide usage example
    console.log('\nUsage example:');
    console.log(chalk.cyan(`import ${formattedName} from './${options.dir ? options.dir.replace(/^src\//, './') : './components'}/${formattedName}';`));
    console.log(chalk.cyan(`\n// In your render function:`));
    console.log(chalk.cyan(`h(${formattedName}, { /* props */ }, [ /* children */ ])`));

  } catch (err) {
    spinner.fail(`Failed to create component: ${err.message}`);
    console.error(chalk.red(err.stack));
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
  let template = `import { defineComponent, h } from '@kalxjs/core';

export default defineComponent({
  name: '${componentName}',\n`;

  if (options.props) {
    template += `
  props: {
    message: {
      type: String,
      required: true
    }
  },\n`;
  }

  if (options.state) {
    template += `
  data() {
    return {
      count: 0
    };
  },\n`;
  } else {
    template += `
  data() {
    return {};
  },\n`;
  }

  if (options.methods) {
    template += `
  methods: {
    increment() {
      this.count++;
    }
  },\n`;
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
  },\n`;
  }

  template += `
  render() {
    return h('div', { class: '${componentName.toLowerCase()}' }, [
      h('h2', {}, ['${componentName}'])${options.state ? `,
      h('p', {}, [\`Count: \${this.count}\`]),
      h('button', { onClick: this.increment }, ['Increment'])` : ''}
    ]);
  }
});
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
import ${componentName} from '@/components/${componentName}';

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
import { defineComponent } from '@kalxjs/core';

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

module.exports = { component };