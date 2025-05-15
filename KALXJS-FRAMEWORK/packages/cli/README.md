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

✔ Select a template
  › TypeScript + Vite
  › JavaScript + Vite
  › TypeScript + Webpack
  › Pure JavaScript

✔ Add features
  ☑ Router
  ☑ State Management
  ☑ Testing
  ☑ ESLint + Prettier
  ☑ Tailwind CSS
  ☑ PWA Support
```

## Commands

### Project Scaffolding

```bash
# Create component with TypeScript and tests
kalxjs generate component MyComponent --typescript --test

# Create view/page component
kalxjs generate view Dashboard --layout default

# Generate API service
kalxjs generate service UserAPI --rest

# Create store module
kalxjs generate store user --typescript
```

### Development Workflow

```bash
# Start dev server with HMR
kalxjs dev --port 3000 --open

# Run unit tests
kalxjs test unit

# Run E2E tests
kalxjs test e2e

# Type check
kalxjs type-check
```

### Build & Deploy

```bash
# Production build
kalxjs build --modern --analyze

# Deploy to various platforms
kalxjs deploy --platform vercel
kalxjs deploy --platform netlify
kalxjs deploy --platform azure
```

### Container Support

```bash
# Generate Docker configuration
kalxjs docker init

# Build container
kalxjs docker build

# Run containerized app
kalxjs docker run
```

## Configuration

Create `kalxjs.config.ts` in project root:

```typescript
import { defineConfig } from '@kalxjs/cli'

export default defineConfig({
  plugins: ['@kalxjs/pwa'],
  build: {
    target: 'esnext',
    minify: 'esbuild'
  },
  test: {
    coverage: true
  }
})
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.