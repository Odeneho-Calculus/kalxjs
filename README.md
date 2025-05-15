# KALXJS Framework

🚀 A modern JavaScript framework for building powerful web applications

## Overview

KALXJS is a progressive JavaScript framework designed for building user interfaces. It provides a component-based architecture, reactive data binding, and a rich ecosystem of tools and libraries.

## Key Features

## Framework Patch

This patch fixes common issues in the KalxJS framework:

1. Ensures proper Vite server configuration
2. Creates necessary directory structure and files
3. Fixes router configuration issues
4. Ensures proper file references

### Creating a New Project

Use the new project initializer script:

```bash
node create-kalxjs-app.js my-app
cd my-app
npm run dev
```

### Starting an Existing Project

To start an existing KalxJS project:

```bash
node start-kalxjs.js my-app
```

### Fixing Existing Projects

If you have an existing project with issues, run:

```bash
node framework-patch.js
```

### Key Improvements

- Fixed server configuration to work on all network interfaces
- Improved router with better error handling and fallbacks
- Ensured proper directory structure and file references
- Added proper SCSS support with default styles
- Fixed component mounting issues


- **Component-Based Architecture**: Build encapsulated components that manage their own state
- **Reactive Data Binding**: Automatically updates the UI when data changes
- **Virtual DOM**: Efficient rendering with a lightweight virtual DOM implementation
- **Routing**: Built-in router for single-page applications
- **State Management**: Centralized state management for complex applications
- **Developer Tools**: Comprehensive developer tools for debugging and performance optimization

## Project Structure

The KALXJS project uses a unique directory structure:

```
my-kalxjs-app/
├── app/                  # Application source code
│   ├── core/             # Core application files
│   ├── components/       # Reusable components
│   ├── pages/            # Page components (with router)
│   ├── navigation/       # Router configuration
│   ├── state/            # State management
│   ├── services/         # API services
│   ├── hooks/            # Composition hooks
│   ├── extensions/       # Plugins and extensions
│   ├── assets/           # Static assets
│   └── styles/           # Global styles
├── config/               # Application configuration
├── docs/                 # Project documentation
├── public/               # Public static files
└── package.json          # Project metadata and dependencies
```

## Getting Started

### Installation

```bash
npm install -g @kalxjs/cli
```

### Create a New Project

```bash
kalxjs create my-app
```

### Start Development Server

```bash
cd my-app
npm run dev
```

## CLI Commands

- `kalxjs create [project-name]` - Create a new project
- `kalxjs generate component [name]` - Generate a new component
- `kalxjs generate page [name]` - Generate a new page component
- `kalxjs build` - Build for production
- `kalxjs serve` - Serve a production build locally

## Documentation

For detailed documentation, 
Documentation still under development

## License

MIT