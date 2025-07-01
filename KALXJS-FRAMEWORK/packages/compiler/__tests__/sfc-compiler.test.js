import { compileSFC } from '../src/sfc-compiler.js';

describe('SFC Compiler and Parser Critical Path Tests', () => {
  const simpleComponent = `
<template>
  <div>Hello, {{ name }}!</div>
</template>
<script>
export default {
  data() {
    return { name: 'World' };
  }
}
</script>
<style scoped>
div { color: red; }
</style>
`;

  test('compiles a simple component without errors', () => {
    const result = compileSFC(null, { source: simpleComponent, useRobustParser: true, filename: 'SimpleComponent.kal' });
    expect(result.errors.length).toBe(0);
    expect(result.template).toBeDefined();
    expect(result.script).toBeDefined();
    expect(result.style).toBeDefined();
    expect(result.template.code).toContain('render');
    expect(result.script.code).toContain('export default');
    expect(result.style.code).toContain('color: red');
  });

  test('handles missing template gracefully', () => {
    const noTemplateComponent = `
<script>
export default {
  data() {
    return { name: 'NoTemplate' };
  }
}
</script>
`;
    const result = compileSFC(null, { source: noTemplateComponent, useRobustParser: true, filename: 'NoTemplate.kal' });
    expect(result.errors).toContain('No template section found. A fallback template has been created, but you should add a <template> section to your component.');
    expect(result.template.code).toContain('Component Ready');
  });

  test('parses custom blocks correctly', () => {
    const componentWithCustomBlock = `
<template><div>Custom Block Test</div></template>
<script>export default {}</script>
<custom-block lang="json">{ "key": "value" }</custom-block>
`;
    const result = compileSFC(null, { source: componentWithCustomBlock, useRobustParser: true, filename: 'CustomBlock.kal' });
    expect(result.customBlocks['custom-block']).toBeDefined();
    expect(result.customBlocks['custom-block'].attrs.lang).toBe('json');
    expect(result.customBlocks['custom-block'].content).toContain('"key": "value"');
  });
});
