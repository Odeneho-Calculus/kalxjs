# KALXJS Project Structure

This document outlines the recommended project structure for KALXJS applications.

## Directory Structure

```
my-kalxjs-app/
├── app/                  # Application source code
│   ├── core/             # Core application files
│   │   └── App.js        # Main application component
│   ├── components/       # Reusable components
│   ├── pages/            # Page components (with router)
│   │   ├── Home.js       # Home page
│   │   ├── About.js      # About page
│   │   └── NotFound.js   # 404 page
│   ├── navigation/       # Router configuration
│   │   └── index.js      # Router setup
│   ├── state/            # State management
│   │   └── index.js      # Store setup
│   ├── services/         # API services
│   ├── hooks/            # Composition hooks
│   ├── extensions/       # Plugins and extensions
│   │   └── index.js      # Plugin registration
│   ├── assets/           # Static assets
│   │   └── logo.svg      # Application logo
│   ├── styles/           # Global styles
│   │   └── main.scss     # Main stylesheet
│   └── main.js           # Application entry point
├── config/               # Application configuration
│   └── app.config.js     # App configuration
├── docs/                 # Project documentation
│   └── README.md         # Documentation index
├── public/               # Public static files
│   ├── index.html        # HTML entry point
│   └── favicon.ico       # Favicon
└── package.json          # Project metadata and dependencies
```

## Key Files

### app/core/App.js

The main application component that serves as the root of your component tree.

```javascript
<template>
  <div class="app">
    <header class="app-header">
      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/about">About</router-link>
      </nav>
    </header>
    <main>
      <router-view></router-view>
    </main>
    <footer class="app-footer">
      <p>© 2024 KALXJS</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem;
}

.app-footer {
  margin-top: auto;
  background-color: var(--secondary-color);
  color: white;
  padding: 1rem;
  text-align: center;
}
</style>
```

### app/main.js

The entry point of your application where you initialize KALXJS and mount the app.

```javascript
import { createApp, version as coreVersion } from '@kalxjs/core';
import App from './core/App.js';
import { createRouter, version as routerVersion } from './navigation';
import { createStore, version as stateVersion } from './state';
import { registerPlugins } from './extensions';
import appConfig from '../config/app.config.js';
import { version as utilsVersion } from '@kalxjs/utils';
import { version as devtoolsVersion } from '@kalxjs/devtools';

// Check package versions compatibility
console.log('🚀 KALXJS Framework - Starting application');
console.log('📦 Package versions:');
console.log('  • Core:', coreVersion);
console.log('  • Router:', routerVersion);
console.log('  • State:', stateVersion);
console.log('  • Utils:', utilsVersion);
console.log('  • DevTools:', devtoolsVersion);

// Create the app instance with configuration
const app = createApp(App, {
  debug: appConfig.env.development.debug,
  appName: appConfig.name,
  version: appConfig.version
});

// Register plugins
registerPlugins(app);

// Set up router
const router = createRouter();
app.use(router);

// Set up state management
const store = createStore();
app.use(store);

// Enable development tools in development mode
if (appConfig.env.development.debug) {
  const { setupDevTools } = require('@kalxjs/devtools');
  setupDevTools(app, {
    logLifecycleEvents: true,
    performanceMonitoring: true
  });
}

// Mount the app
app.mount('#app');
console.log('🎉 KALXJS application successfully mounted');
```

### config/app.config.js

Application configuration file that centralizes settings for different environments.

```javascript
/**
 * KALXJS Application Configuration
 */
module.exports = {
  name: 'My KALXJS App',
  version: '0.1.0',
  description: 'A powerful KALXJS application',
  
  // Environment settings
  env: {
    development: {
      apiBaseUrl: 'http://localhost:3000/api',
      debug: true
    },
    production: {
      apiBaseUrl: '/api',
      debug: false
    }
  },
  
  // Feature flags
  features: {
    router: true,
    state: true,
    plugins: true,
    scss: true
  }
};
```

## Best Practices

1. **Component Organization**: Group components by feature or functionality
2. **File Naming**: Use PascalCase for component files and camelCase for utility files
3. **Code Splitting**: Use dynamic imports for code splitting in larger applications
4. **State Management**: Keep state as local as possible, only use global state when necessary
5. **CSS Organization**: Use scoped styles for components and global styles for app-wide styling
6. **Documentation**: Document components, hooks, and services with JSDoc comments
7. **Testing**: Write unit tests for components and integration tests for features

## Migration from Previous Versions

If you're migrating from a previous version of KALXJS that used the .klx extension, you'll need to:

1. Rename all .klx files to .js
2. Update import statements to use the .js extension
3. Update your build configuration to process .js files instead of .klx files
4. Update your linting configuration to target .js files

The KALXJS CLI provides a migration tool to help with this process:

```bash
kalxjs-migrate my-project
```

This will automatically convert your project to use the new structure and file extensions.