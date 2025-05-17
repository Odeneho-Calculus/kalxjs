# kalxjs CLI

Modern CLI tooling for kalxjs development workflow.

## Installation

```bash
# Using npm
npm install -g @kalxjs/cli

# Using yarn
yarn global add @kalxjs/cli

# Using pnpm
pnpm add -g @kalxjs/cli
```

## Quick Start

```bash
# Create a new project with interactive prompts
kalxjs create my-app

✔ Add Router support? Yes
✔ Add State Management? Yes
✔ Add SCSS support? Yes
✔ Add Single File Components support? Yes
✔ Add Composition API support? Yes
✔ Add API integration utilities? Yes
✔ Add Performance optimization utilities? Yes
✔ Add Plugin system support? Yes
✔ Add Testing setup? Yes
✔ Add ESLint setup? Yes
✔ Add Custom Renderer support? Yes
```

## Commands

### Project Creation

```bash
# Create a new project with interactive prompts
kalxjs create my-app

# Create a new project with specific features
kalxjs create my-app --router --state --scss --testing --linting

# Create a new project skipping prompts (all features enabled)
kalxjs create my-app --skip-prompts

# Create a new project without installing dependencies
kalxjs create my-app --skip-install
```

### Component Generation

```bash
# Generate a basic component
kalxjs component MyComponent

# Generate a component with options
kalxjs component MyComponent --dir src/components --style scss --test --props --state --methods --lifecycle

# Use the shorthand alias
kalxjs c MyComponent
```

### Development Workflow

```bash
# Start development server
kalxjs serve

# Start development server on a specific port
kalxjs serve --port 8080

# Build for production (coming soon)
kalxjs build
```

## Project Structure

When you create a new project with kalxjs CLI, it generates the following structure:

```
my-app/
├── app/                  # Application source code
│   ├── components/       # Reusable components
│   ├── core/             # Core application files
│   ├── navigation/       # Router configuration (if enabled)
│   ├── pages/            # Page components (if router enabled)
│   ├── state/            # State management (if enabled)
│   ├── styles/           # Global styles (if SCSS enabled)
│   ├── services/         # API services (if API enabled)
│   ├── hooks/            # Composition hooks (if enabled)
│   ├── extensions/       # Plugins (if enabled)
│   ├── utils/            # Utility functions
│   ├── renderer/         # Custom renderer (if enabled)
│   └── templates/        # Templates for rendering (if enabled)
├── assets/               # Static assets
├── config/               # Configuration files
│   └── app.config.js     # Application configuration
├── docs/                 # Documentation
├── public/               # Public files
└── index.html            # HTML entry point
```

## Configuration

The project configuration is stored in `config/app.config.js`:

```javascript
/**
 * KALXJS Application Configuration
 */
const config = {
  name: 'my-app',
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
    scss: true,
    sfc: true,
    composition: true,
    api: true,
    performance: true,
    plugins: true,
    testing: true,
    linting: true,
    customRenderer: true
  }
};

export default config;
```

## Upcoming Features

The following features are planned for future releases:

- Full TypeScript support
- Advanced component generation
- View/page generation
- API service generation
- Store module generation
- Unit and E2E testing commands
- Production build optimization
- Deployment to various platforms
- Docker container support
- Plugin system
- Custom template support

## Troubleshooting

### Common Issues

#### Installation Problems

If you encounter issues during installation, try:

```bash
npm install -g @kalxjs/cli --force
```

#### Dependency Conflicts

If you see dependency conflicts when creating a new project:

```bash
cd my-app
npm install --legacy-peer-deps
# or
npm install --force
```

#### Port Already in Use

If the default port (3000) is already in use, the CLI will automatically find an available port. You can also specify a port:

```bash
kalxjs serve --port 8080
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.