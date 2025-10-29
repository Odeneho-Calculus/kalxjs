const fs = require('fs');
const path = require('path');
const ora = require('ora');

// Import ESM modules dynamically for compatibility - available to all functions
let chalk;

async function initializeESModules() {
  if (!chalk) {
    chalk = await import('chalk').then(m => m.default);
  }
}

/**
 * Generates a new KLX component
 * @param {string} name - Component name
 * @param {Object} options - Generation options
 * @param {Object} chalk - chalk instance for colors
 */
function generateComponent(name, options = {}, chalk) {
  const { dir = '.', composition = false } = options;

  // Create component directory if it doesn't exist
  const componentDir = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }

  // Component file path
  const componentPath = path.join(componentDir, `${name}.klx`);

  // Check if file already exists
  if (fs.existsSync(componentPath)) {
    console.error(chalk.red(`✗ Component ${name} already exists at ${componentPath}`));
    return;
  }

  // Generate component content
  const content = composition
    ? generateCompositionComponent(name)
    : generateOptionsComponent(name);

  // Write component file
  fs.writeFileSync(componentPath, content);

  console.log(chalk.green(`✓ Component ${name} created at ${componentPath}`));
}

/**
 * Generates a component using the Options API
 * @private
 * @param {string} name - Component name
 * @returns {string} Component content
 */
function generateOptionsComponent(name) {
  return `<template>
  <div class="${name.toLowerCase()}">
    <h1>{{ title }}</h1>
    <p>{{ message }}</p>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script>
export default {
  name: '${name}',
  props: {
    title: {
      type: String,
      default: '${name} Component'
    }
  },
  data() {
    return {
      message: 'Welcome to KalxJS!',
      count: 0
    };
  },
  methods: {
    increment() {
      this.count++;
    }
  },
  mounted() {
    console.log('${name} component mounted');
  }
};
</script>

<style scoped>
.${name.toLowerCase()} {
  font-family: Arial, sans-serif;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-width: 500px;
  margin: 0 auto;
}

h1 {
  color: #42b883;
}

button {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #33a06f;
}
</style>`;
}

/**
 * Generates a component using the Composition API
 * @private
 * @param {string} name - Component name
 * @returns {string} Component content
 */
function generateCompositionComponent(name) {
  return `<template>
  <div class="${name.toLowerCase()}">
    <h1>{{ title }}</h1>
    <p>{{ message }}</p>
    <button @click="increment">Count: {{ count.value }}</button>
  </div>
</template>

<script>
import { useRef } from '@kalxjs/core';
import { onMounted } from '@kalxjs/composition';

export default {
  name: '${name}',
  props: {
    title: {
      type: String,
      default: '${name} Component'
    }
  },
  setup(props) {
    // Reactive state
    const count = useRef(0);
    const message = useRef('Welcome to KalxJS!');

    // Methods
    function increment() {
      count.value++;
    }

    // Lifecycle hooks
    onMounted(() => {
      console.log('${name} component mounted');
    });

    // Expose to template
    return {
      count,
      message,
      increment
    };
  }
};
</script>

<style scoped>
.${name.toLowerCase()} {
  font-family: Arial, sans-serif;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-width: 500px;
  margin: 0 auto;
}

h1 {
  color: #42b883;
}

button {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #33a06f;
}
</style>`;
}

/**
 * Main generate command handler
 */
async function generate(type, name, options = {}) {
  // Initialize ESM modules
  await initializeESModules();

  if (!type || !name) {
    console.error(chalk.red('✗ Please specify a type and name'));
    console.log('Usage: kalxjs generate <type> <name> [options]');
    console.log('Available types: component');
    return;
  }

  const spinner = ora({
    text: chalk.cyan(`Generating ${type} ${chalk.bold(name)}...`),
    spinner: 'dots'
  }).start();

  try {
    if (type === 'component' || type === 'c') {
      spinner.succeed(chalk.green(`Generated ${type}: ${name}`));
      generateComponent(name, {
        dir: options.dir || '.',
        composition: options.composition || false
      }, chalk);
    } else {
      spinner.fail(chalk.red(`Unknown generation type: ${type}`));
      console.log('Available types: component');
    }
  } catch (error) {
    spinner.fail(chalk.red(`Error generating ${type}: ${error.message}`));
    process.exit(1);
  }
}

module.exports = generate;
