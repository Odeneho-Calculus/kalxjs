# kalxjs DevTools

Developer Tools for debugging and inspecting kalxjs applications.

## Features

- Component inspection
- State tracking
- Performance monitoring
- Event timeline
- Network request inspection
- Visual component hierarchy

## Installation

```bash
npm install @kalxjs/devtools
```

## Usage

### Basic Setup

```javascript
import kalxjs from 'kalxjs';
import { DevToolsPlugin } from '@kalxjs/devtools';
import App from './App';

const app = kalxjs.createApp(App);

// Register DevTools plugin
app.use(DevToolsPlugin);

app.mount('#app');
```

### Manual Control

```javascript
import kalxjs from 'kalxjs';
import { createDevTools } from '@kalxjs/devtools';
import App from './App';

const app = kalxjs.createApp(App);
const devtools = createDevTools(app);

// Initialize manually
devtools.init();

// Enable/disable as needed
devtools.enable();
devtools.disable();

app.mount('#app');
```

## Configuration Options

```javascript
app.use(DevToolsPlugin, {
  autoEnable: true, // Enable DevTools automatically
  logLevel: 'info', // Log level (debug, info, warn, error)
  trackComponents: true, // Track component updates
  trackPerformance: true // Track performance metrics
});
```

## Browser Extension

The kalxjs DevTools browser extension provides an enhanced debugging experience directly in your browser's developer tools panel.

1. Install the extension from Chrome Web Store (coming soon)
2. Add DevTools to your app as shown above
3. Open Chrome DevTools and navigate to the "kalxjs" panel

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.