---
description: Repository Information Overview
alwaysApply: true
---

# KALXJS Framework Information

## Summary
KALXJS is a modern JavaScript framework for building reactive web applications with a component-based architecture. It features reactive state management, virtual DOM implementation, routing system, and developer tools.

## Structure
The repository contains two main parts:
- **Root Project**: Contains utility scripts and the main framework
- **KALXJS-FRAMEWORK**: The core framework with modular packages

### Main Repository Components
- **packages/**: Core framework packages (core, router, state, etc.)
- **KALXJS-FRAMEWORK/**: Main framework source with complete package structure
- **examples/**: Sample applications demonstrating framework usage
- **scripts/**: Utility scripts for project creation and management

## Language & Runtime
**Language**: JavaScript (ES Modules)
**Version**: Modern JavaScript (ES2020+)
**Build System**: Rollup
**Package Manager**: npm with Lerna for monorepo management

## Dependencies
**Main Dependencies**:
- lerna: ^8.2.2 (Monorepo management)
- rollup: ^2.79.1 (Module bundling)
- vite: ^4.4.0 (Development server)
- jest: ^29.5.0 (Testing)

**Development Dependencies**:
- @babel/core: ^7.22.5
- eslint: ^8.36.0
- prettier: ^2.8.4
- vuepress: ^2.0.0-beta.61 (Documentation)

## Build & Installation
```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build specific packages
npm run build:core
npm run build:router
npm run build:store
npm run build:cli

# Create a new project
node create-kalxjs-app.js my-app
```

## Testing
**Framework**: Jest with jsdom
**Test Location**: /tests directory with unit and integration subdirectories
**Configuration**: jest.config.js in root directory
**Run Command**:
```bash
npm test
# or with coverage
npm run test:coverage
```

## Projects

### Core Package
**Configuration File**: packages/core/package.json
**Version**: 2.2.8

#### Dependencies
**Peer Dependencies**:
- @kalxjs/cli: ^1.3.0
- @kalxjs/router: ^2.0.0
- @kalxjs/store: ^1.2.0

#### Build & Installation
```bash
cd packages/core
npm run build
```

### Router Package
**Configuration File**: packages/router/package.json

#### Build & Installation
```bash
cd packages/router
npm run build
```

### CLI Tools
**Configuration File**: packages/cli/package.json

#### Usage
```bash
# Create a new project
kalxjs create my-app

# Generate components
kalxjs generate component [name]
kalxjs generate page [name]
```

### Documentation
**Build System**: VuePress
**Location**: /docs directory
**Build Command**:
```bash
npm run docs:build
```