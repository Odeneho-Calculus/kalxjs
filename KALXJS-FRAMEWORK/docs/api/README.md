<!-- kalxjs/docs/api/README.md -->
# kalxjs API Reference

Comprehensive API documentation for kalxjs v2.1.14.

## Runtime Package (@kalxjs-framework/runtime)

Core runtime features:

### Reactivity System
- `ref()`, `reactive()`, `computed()` - Create reactive state
- `watchEffect()`, `watch()` - Track reactive dependencies
- `effectScope()` - Manage effect lifecycles

### Component System
- `defineComponent()` - Create components
- `createApp()` - Initialize application
- `inject()`, `provide()` - Dependency injection
- Lifecycle hooks and directives

### Composition API
- `setup()` - Component composition
- `onMounted()`, `onUnmounted()` - Lifecycle hooks
- `toRefs()`, `toRef()` - Reactivity utilities

## Router Package

- [Router API](./router.md) - Functions and components for routing
  - `createRouter()` - Create a router instance
  - `<router-link>` - Component for navigation
  - `<router-view>` - Component for rendering the matched route
  - Navigation guards and hooks

## State Management

- [State Management API](./state.md) - Functions for centralized state management
  - `createStore()` - Create a store instance
  - Store options (state, mutations, actions)
  - `mapState()` and `mapGetters()` - Helper functions

## CLI Tools

- [CLI API](./cli.md) - Command-line interface for project scaffolding
  - `create` - Create a new project
  - `generate:component` - Generate a component
  - `generate:view` - Generate a view

## Single File Components

- [SFC Compiler](./compiler-sfc.md) - Compiler for .klx files
  - Template syntax
  - Script setup syntax
  - Style scoping

## Developer Tools

- [DevTools API](../devtools/API.md) - Complete DevTools specification
  - Component inspection and state editing
  - Performance profiling and analysis
  - Event system and lifecycle monitoring
  - Browser extension integration

## Advanced Features

### AI Integration
- [AI API](./ai.md) - AI capabilities for text and image generation
- AI model integration
- Content analysis
- Image generation and editing

### Compiler
- Template compilation optimizations
- Static hoisting
- Tree-shaking support
- Source map generation

### Performance
- Async components
- Suspense integration
- Keep-alive caching
- Virtual scrolling

### Custom Rendering
- Template-based rendering
- Native DOM APIs
- Performance optimizations
- Fallback mechanisms

## TypeScript Support

kalxjs includes TypeScript type definitions for all APIs. See the [TypeScript Support Guide](../guides/typescript.md) for details on using TypeScript with kalxjs.

## Debugging & Developer Experience

### DevTools Integration

The official DevTools package provides:
- **Component Inspection** - Visual component tree and state debugging
- **Performance Profiling** - Render time analysis and optimization
- **Event Monitoring** - Track component lifecycle events
- **Browser Extension** - Chrome DevTools integration
- **State Editing** - Real-time state modifications during development

See the [DevTools Documentation](../devtools/README.md) for complete information.