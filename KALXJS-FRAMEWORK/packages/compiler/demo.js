// Quick demonstration of the enhanced SFC compiler
import { compileSFC } from './src/index.js';

const demoKalFile = `
<template>
  <div class="demo-component">
    <h1 k-text="title"></h1>
    <p k-if="showMessage" k-text="message"></p>
    <button @click="toggleMessage">Toggle Message</button>
    <ul k-if="items.length > 0">
      <li k-for="item in items" k-text="item"></li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'DemoComponent',
  data() {
    return {
      title: 'Enhanced SFC Compiler Demo',
      message: 'This is working perfectly!',
      showMessage: true,
      items: ['Feature 1', 'Feature 2', 'Feature 3']
    };
  },
  methods: {
    toggleMessage() {
      this.showMessage = !this.showMessage;
    }
  }
}
</script>

<style scoped>
.demo-component {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
</style>
`;

console.log('🚀 Enhanced SFC Compiler Demo\n');

try {
  const result = compileSFC(demoKalFile, {
    filename: 'DemoComponent.kal',
    optimizeImports: true,
    generateSourceMaps: true,
    scopedCSS: true
  });

  console.log('✅ Compilation successful!');
  console.log(`📊 Has template: ${result.metadata.hasTemplate}`);
  console.log(`📊 Has script: ${result.metadata.hasScript}`);
  console.log(`📊 Has style: ${result.metadata.hasStyle}`);
  console.log(`📊 Is scoped: ${result.metadata.isScoped}`);
  console.log(`📦 Dependencies: ${result.dependencies.length}`);
  console.log(`⚠️  Warnings: ${result.warnings.length}`);
  console.log(`❌ Errors: ${result.errors.length}`);

  console.log('\n📄 Generated JavaScript Code:');
  console.log('─'.repeat(80));
  console.log(result.code);
  console.log('─'.repeat(80));

  console.log('\n🎉 Your enhanced SFC compiler is working perfectly!');

} catch (error) {
  console.error('❌ Demo failed:', error);
}