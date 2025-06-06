// @kalxjs/cli - Generate command

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generates a new KLX component
 * @param {string} name - Component name
 * @param {Object} options - Generation options
 */
export function generateComponent(name, options = {}) {
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
    console.error(`Component ${name} already exists at ${componentPath}`);
    return;
  }

  // Generate component content
  const content = composition
    ? generateCompositionComponent(name)
    : generateOptionsComponent(name);

  // Write component file
  fs.writeFileSync(componentPath, content);

  console.log(`Component ${name} created at ${componentPath}`);
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
 * Command handler for generating components
 */
export default {
  name: 'generate',
  alias: 'g',
  description: 'Generate a new component',
  run: (args) => {
    const [type, name] = args._;

    if (!type || !name) {
      console.error('Please specify a type and name');
      console.log('Usage: kalxjs generate component MyComponent');
      return;
    }

    if (type === 'component' || type === 'c') {
      generateComponent(name, {
        dir: args.dir || '.',
        composition: args.composition || false
      });
    } else {
      console.error(`Unknown generation type: ${type}`);
      console.log('Available types: component');
    }
  }
};