# @kalxjs/plugins

Plugin system for KalxJs framework.

## Installation

```bash
npm install @kalxjs/plugins
```

## Usage

```javascript
import { createApp } from '@kalxjs/core';
import { createPlugin, PluginManager, createLoggerPlugin, createPersistencePlugin } from '@kalxjs/plugins';

// Create a custom plugin
const myPlugin = createPlugin({
  name: 'my-plugin',
  install: (app, options) => {
    // Add functionality to the app
    app.myFeature = () => {
      console.log('My feature is running!');
    };
  },
  // Lifecycle hooks
  mounted: () => {
    console.log('App has been mounted');
  },
  // Expose methods/properties for other plugins
  exposed: {
    someUtility: () => {
      // Utility function
    }
  }
});

// Create an app
const app = createApp({
  // App configuration
});

// Create plugin manager
const pluginManager = new PluginManager(app);

// Use plugins
pluginManager.use(myPlugin, { /* options */ });
pluginManager.use(createLoggerPlugin({ level: 'info' }));
pluginManager.use(createPersistencePlugin({ 
  key: 'my-app-state',
  paths: ['user', 'preferences']
}));

// Mount the app
app.mount('#app');
```

## Creating Plugins

Plugins are objects with an `install` method and optional lifecycle hooks:

```javascript
import { createPlugin } from '@kalxjs/plugins';

const myPlugin = createPlugin({
  name: 'my-plugin',
  
  // Required: install function
  install: (app, options, pluginManager) => {
    // Add properties to the app
    app.myFeature = () => {
      // Feature implementation
    };
    
    // Register global components
    app.component('MyComponent', { /* component definition */ });
    
    // Access other plugins
    const logger = pluginManager.getPlugin('logger');
    if (logger) {
      logger.exposed.logger.info('My plugin installed');
    }
  },
  
  // Optional: lifecycle hooks
  beforeCreate: () => { /* ... */ },
  created: () => { /* ... */ },
  beforeMount: () => { /* ... */ },
  mounted: () => { /* ... */ },
  beforeUpdate: () => { /* ... */ },
  updated: () => { /* ... */ },
  beforeUnmount: () => { /* ... */ },
  unmounted: () => { /* ... */ },
  errorCaptured: (err) => { /* ... */ },
  
  // Optional: exposed methods/properties for other plugins
  exposed: {
    someUtility: () => { /* ... */ },
    someValue: 'value'
  }
});
```

## Built-in Plugins

### Logger Plugin

```javascript
import { createLoggerPlugin } from '@kalxjs/plugins';

const loggerPlugin = createLoggerPlugin({
  level: 'info',           // 'debug', 'info', 'warn', 'error'
  prefix: '[MyApp]',       // Log prefix
  enabled: true,           // Enable/disable logging
  logTime: true,           // Include timestamp
  logToConsole: true,      // Log to console
  customLogger: null       // Custom logger implementation
});

// Usage after installation
app.logger.info('Application started');
app.logger.warn('Something might be wrong');
app.logger.error('Something went wrong', errorObject);
```

### Persistence Plugin

```javascript
import { createPersistencePlugin } from '@kalxjs/plugins';

const persistencePlugin = createPersistencePlugin({
  key: 'my-app-state',     // Storage key
  storage: localStorage,   // Storage mechanism
  paths: ['user', 'settings.theme'], // Specific paths to persist
  saveOnChange: true,      // Save state on change
  restoreOnStart: true,    // Restore state on start
  serialize: JSON.stringify,    // Serialization function
  deserialize: JSON.parse       // Deserialization function
});

// Usage after installation
app.saveState();      // Manually save state
app.restoreState();   // Manually restore state
```

## Plugin Manager API

The `PluginManager` class provides methods for managing plugins:

- `use(plugin, options)`: Register a plugin
- `callHook(hookName, ...args)`: Call a specific lifecycle hook
- `getPlugin(name)`: Get a plugin by name
- `hasPlugin(name)`: Check if a plugin is registered
- `getPlugins()`: Get all registered plugins
- `getExposed()`: Get all exposed methods and properties

## License

MIT