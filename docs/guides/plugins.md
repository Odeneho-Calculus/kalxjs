# Plugin System Guide

KalxJS provides a plugin system that allows you to extend the framework with additional functionality. Plugins can add global methods, properties, assets, and more.

## Creating a Plugin

A plugin is an object with an `install` method that receives the application instance and options.

```js
import { createPlugin } from '@kalxjs/core';

const MyPlugin = createPlugin({
  name: 'my-plugin',
  version: '1.0.0',
  install(app, options) {
    // Add global properties
    app.config.globalProperties.$myPlugin = {
      // Plugin methods and properties
      greet: (name) => `Hello, ${name}!`
    };
    
    // Add global methods
    app.myPluginMethod = () => {
      // Plugin logic
    };
    
    // Add global components
    app.component('MyPluginComponent', {
      // Component definition
    });
    
    // Add global directives
    app.directive('my-directive', {
      // Directive definition
    });
    
    // Add global mixins
    app.mixin({
      // Mixin definition
    });
    
    // Add global hooks
    app.hook('beforeMount', () => {
      // Hook logic
    });
  }
});

export default MyPlugin;
```

## Using a Plugin

To use a plugin, call the `use` method on the application instance.

```js
import { createApp } from '@kalxjs/core';
import MyPlugin from './my-plugin';

const app = createApp({
  // App options
});

// Use the plugin
app.use(MyPlugin, {
  // Plugin options
});

app.mount('#app');
```

## Plugin Manager

KalxJS provides a `PluginManager` class that helps manage plugins.

```js
import { createApp, PluginManager } from '@kalxjs/core';
import MyPlugin from './my-plugin';
import AnotherPlugin from './another-plugin';

const app = createApp({
  // App options
});

// Create a plugin manager
const pluginManager = new PluginManager();
pluginManager.setApp(app);

// Install plugins
pluginManager.use(MyPlugin, { /* options */ });
pluginManager.use(AnotherPlugin, { /* options */ });

// Check if a plugin is installed
if (pluginManager.has('my-plugin')) {
  console.log('MyPlugin is installed');
}

// Get a plugin
const myPlugin = pluginManager.get('my-plugin');

// Uninstall a plugin
pluginManager.uninstall('my-plugin');

app.mount('#app');
```

## Example: Logger Plugin

Here's an example of a logger plugin that adds logging functionality to the application.

```js
import { createPlugin } from '@kalxjs/core';

export const LoggerPlugin = createPlugin({
  name: 'logger',
  version: '1.0.0',
  install(app, options = {}) {
    const { level = 'info', prefix = '[KalxJS]' } = options;
    
    // Define log levels
    const levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    // Create logger methods
    const logger = {
      debug(...args) {
        if (levels[level] <= levels.debug) {
          console.debug(prefix, ...args);
        }
      },
      
      info(...args) {
        if (levels[level] <= levels.info) {
          console.info(prefix, ...args);
        }
      },
      
      warn(...args) {
        if (levels[level] <= levels.warn) {
          console.warn(prefix, ...args);
        }
      },
      
      error(...args) {
        if (levels[level] <= levels.error) {
          console.error(prefix, ...args);
        }
      }
    };
    
    // Add logger to the app
    app.logger = logger;
    
    // Add logger to all components
    app.mixin({
      created() {
        this.$logger = logger;
      }
    });
    
    // Log app creation
    logger.info('App created');
  }
});
```

Using the logger plugin:

```js
import { createApp } from '@kalxjs/core';
import { LoggerPlugin } from './logger-plugin';

const app = createApp({
  // App options
});

// Use the logger plugin
app.use(LoggerPlugin, {
  level: 'debug',
  prefix: '[MyApp]'
});

app.mount('#app');

// Using the logger in a component
export default {
  setup() {
    onMounted(() => {
      this.$logger.info('Component mounted');
    });
    
    return {
      logMessage() {
        this.$logger.info('Button clicked');
      }
    };
  }
};
```

## Best Practices

1. **Name your plugins**: Always provide a name for your plugins to make them easier to identify and manage.

2. **Version your plugins**: Include a version number to help with compatibility checks.

3. **Document your plugins**: Provide clear documentation on how to use your plugin, including available options and methods.

4. **Provide uninstall method**: If your plugin adds event listeners or makes other changes that need to be cleaned up, provide an `uninstall` method.

5. **Use namespaces**: To avoid conflicts with other plugins, use namespaces for your plugin's methods and properties.

6. **Make options optional**: Design your plugin to work with sensible defaults, but allow customization through options.

7. **Check for conflicts**: Before adding global methods or properties, check if they already exist to avoid overwriting them.

8. **Respect the application's structure**: Follow the application's conventions and patterns when extending it.

9. **Test your plugins**: Write tests for your plugins to ensure they work as expected and don't break existing functionality.

10. **Keep it focused**: A plugin should do one thing and do it well. If you need more functionality, consider creating multiple plugins.