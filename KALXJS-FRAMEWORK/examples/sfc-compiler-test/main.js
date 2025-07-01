import { createApp, defineComponent } from '@kalxjs/core';
import { compileSFC } from '../../packages/compiler/src/sfc-compiler.js';

// Load the App.kal source code dynamically
async function loadSource() {
  const response = await fetch('/App.kal');
  return await response.text();
}

async function bootstrap() {
  const source = await loadSource();

  // Compile the SFC using the robust parser option
  const compiled = compileSFC(null, { source, useRobustParser: true, filename: 'App.kal' });

  // Wrap the compiled script code in an ES module format string
  const moduleCode = compiled.script.code;

  // Create a Blob URL for the compiled script code as an ES module
  const blob = new Blob([moduleCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);

  // Dynamically import the compiled module
  const module = await import(url);
  URL.revokeObjectURL(url);

  const component = module.default;

  // Create the app and mount
  const app = createApp(defineComponent(component));
  app.mount('#app');
}

bootstrap();
