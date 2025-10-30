// Register all plugins here
export function registerPlugins(app) {
  // Example: app.use(somePlugin)

  // You can also register global components
  // app.component('GlobalComponent', YourComponent)

  // Add global properties
  // In KalxJS, we need to use a different approach since app.config.globalProperties is not available
  // We can use app.provide to make values available to all components
  app.provide('formatDate', (date) => {
    return new Date(date).toLocaleDateString();
  });

  // Alternatively, we can add methods directly to the app instance
  app._context = app._context || {};
  app._context.helpers = app._context.helpers || {};
  app._context.helpers.formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  console.log('Plugins registered successfully');
}
