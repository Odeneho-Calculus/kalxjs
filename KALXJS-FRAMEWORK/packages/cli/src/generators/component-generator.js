/**
 * Component Generator
 * Generate component files with templates
 *
 * @module @kalxjs/cli/generators/component-generator
 */

import path from 'path';
import { writeFile, ensureDir } from '../utils/file-system.js';

/**
 * Generate component
 */
export async function generateComponent(name, options = {}) {
    const {
        type = 'sfc',
        directory = 'src/components',
        withProps = true,
        withEmits = false,
        withTests = true,
        withStorybook = false,
    } = options;

    const componentPath = path.join(process.cwd(), directory);
    await ensureDir(componentPath);

    // Generate component file
    const componentFile = await generateComponentFile(name, type, { withProps, withEmits });
    const componentFilePath = path.join(componentPath, `${name}.${getExtension(type)}`);
    await writeFile(componentFilePath, componentFile);

    console.log(`✓ Created component: ${componentFilePath}`);

    // Generate test file
    if (withTests) {
        const testFile = generateTestFile(name, type);
        const testFilePath = path.join(componentPath, `${name}.test.js`);
        await writeFile(testFilePath, testFile);
        console.log(`✓ Created test: ${testFilePath}`);
    }

    // Generate Storybook story
    if (withStorybook) {
        const storyFile = generateStoryFile(name);
        const storyFilePath = path.join(componentPath, `${name}.stories.js`);
        await writeFile(storyFilePath, storyFile);
        console.log(`✓ Created story: ${storyFilePath}`);
    }

    return {
        componentPath: componentFilePath,
        name,
    };
}

/**
 * Get file extension
 */
function getExtension(type) {
    const extensions = {
        sfc: 'klx',
        js: 'js',
        ts: 'ts',
    };
    return extensions[type] || 'klx';
}

/**
 * Generate component file content
 */
async function generateComponentFile(name, type, options) {
    if (type === 'sfc') {
        return generateSFCTemplate(name, options);
    } else if (type === 'ts') {
        return generateTSTemplate(name, options);
    } else {
        return generateJSTemplate(name, options);
    }
}

/**
 * Generate SFC template
 */
function generateSFCTemplate(name, options) {
    const { withProps, withEmits } = options;

    return `<template>
  <div class="${name.toLowerCase()}">
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <button @click="handleClick">Click Me</button>
  </div>
</template>

<script>
import { ref } from '@kalxjs/core';

export default {
  name: '${name}',
  ${withProps ? `
  props: {
    title: {
      type: String,
      default: 'Hello ${name}',
    },
    message: {
      type: String,
      default: 'This is a generated component',
    },
  },` : ''}
  ${withEmits ? `
  emits: ['click', 'update'],` : ''}

  setup(props${withEmits ? ', { emit }' : ''}) {
    const count = ref(0);

    const handleClick = () => {
      count.value++;
      ${withEmits ? "emit('click', count.value);" : ''}
    };

    return {
      count,
      handleClick,
    };
  },
};
</script>

<style scoped>
.${name.toLowerCase()} {
  padding: var(--spacing-4);
}

.${name.toLowerCase()} h2 {
  margin-bottom: var(--spacing-2);
  color: var(--color-primary-500);
}
</style>
`;
}

/**
 * Generate JS template
 */
function generateJSTemplate(name, options) {
    const { withProps, withEmits } = options;

    return `/**
 * ${name} Component
 */
import { ref } from '@kalxjs/core';

export default function ${name}(props${withEmits ? ', { emit }' : ''}) {
  ${withProps ? `const { title = 'Hello ${name}', message = 'This is a generated component' } = props;` : ''}

  const count = ref(0);

  const handleClick = () => {
    count.value++;
    ${withEmits ? "emit('click', count.value);" : ''}
  };

  return {
    tag: 'div',
    props: { class: '${name.toLowerCase()}' },
    children: [
      {
        tag: 'h2',
        children: [${withProps ? 'title' : `'Hello ${name}'`}],
      },
      {
        tag: 'p',
        children: [${withProps ? 'message' : `'This is a generated component'`}],
      },
      {
        tag: 'button',
        on: { click: handleClick },
        children: ['Click Me'],
      },
    ],
  };
}
`;
}

/**
 * Generate TypeScript template
 */
function generateTSTemplate(name, options) {
    const { withProps, withEmits } = options;

    return `/**
 * ${name} Component
 */
import { ref, Ref } from '@kalxjs/core';

${withProps ? `interface ${name}Props {
  title?: string;
  message?: string;
}` : ''}

${withEmits ? `interface ${name}Emits {
  click: (count: number) => void;
  update: (value: any) => void;
}` : ''}

export default function ${name}(props${withProps ? `: ${name}Props` : ''}${withEmits ? `, { emit }: { emit: ${name}Emits }` : ''}) {
  ${withProps ? `const { title = 'Hello ${name}', message = 'This is a generated component' } = props;` : ''}

  const count: Ref<number> = ref(0);

  const handleClick = (): void => {
    count.value++;
    ${withEmits ? "emit('click', count.value);" : ''}
  };

  return {
    tag: 'div' as const,
    props: { class: '${name.toLowerCase()}' },
    children: [
      {
        tag: 'h2' as const,
        children: [${withProps ? 'title' : `'Hello ${name}'`}],
      },
      {
        tag: 'p' as const,
        children: [${withProps ? 'message' : `'This is a generated component'`}],
      },
      {
        tag: 'button' as const,
        on: { click: handleClick },
        children: ['Click Me'],
      },
    ],
  };
}
`;
}

/**
 * Generate test file
 */
function generateTestFile(name, type) {
    return `import { describe, it, expect } from 'vitest';
import { mount } from '@kalxjs/core/testing';
import ${name} from './${name}.${getExtension(type)}';

describe('${name}', () => {
  it('renders correctly', () => {
    const wrapper = mount(${name}, {
      props: {
        title: 'Test Title',
        message: 'Test Message',
      },
    });

    expect(wrapper.text()).toContain('Test Title');
    expect(wrapper.text()).toContain('Test Message');
  });

  it('handles click events', async () => {
    const wrapper = mount(${name});
    const button = wrapper.find('button');

    await button.trigger('click');

    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('updates count on click', async () => {
    const wrapper = mount(${name});
    const button = wrapper.find('button');

    await button.trigger('click');
    await button.trigger('click');

    expect(wrapper.vm.count).toBe(2);
  });
});
`;
}

/**
 * Generate Storybook story
 */
function generateStoryFile(name) {
    return `import ${name} from './${name}.klx';

export default {
  title: 'Components/${name}',
  component: ${name},
  argTypes: {
    title: {
      control: 'text',
      description: 'Component title',
    },
    message: {
      control: 'text',
      description: 'Component message',
    },
  },
};

const Template = (args) => ({
  components: { ${name} },
  setup() {
    return { args };
  },
  template: '<${name} v-bind="args" />',
});

export const Default = Template.bind({});
Default.args = {
  title: 'Hello ${name}',
  message: 'This is a generated component',
};

export const CustomTitle = Template.bind({});
CustomTitle.args = {
  title: 'Custom Title',
  message: 'With a custom message',
};
`;
}

/**
 * Export default
 */
export default generateComponent;