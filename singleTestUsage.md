# Testing Strategy for kalxjs Framework

Based on your project structure and the code you've shared, I've compiled a comprehensive testing strategy for the kalxjs framework. This approach will help you test each component individually and track errors effectively.

## Individual Test Files

### Core Component System Tests
```bash
# Test component creation and lifecycle
npm test -- tests/unit/component.test.js

# Test component integration
npm test -- tests/integration/component.test.js
```

### Reactivity System Tests
```bash
# Test reactive objects, refs, computed, and effects
npm test -- tests/unit/reactivity.test.js

# Test reactivity integration
npm test -- tests/integration/reactivity.test.js
```

### Virtual DOM Tests
```bash
# Test createElement, rendering, and diffing
npm test -- tests/unit/vdom.test.js

# Test DOM integration with components
npm test -- tests/integration/vdom.test.js
```

### Router Tests
```bash
# Test router initialization, matching, and navigation
npm test -- tests/unit/router.test.js

# Test router integration with components
npm test -- tests/integration/router.test.js
```

### State Management Tests
```bash
# Test store creation, mutations, actions, and getters
npm test -- tests/unit/store.test.js

# Test state integration with components
npm test -- tests/integration/state.test.js
```

## Testing by Feature Pattern

### Component Tests
```bash
# Test component creation
npm test -- -t "createComponent" -t "should create"

# Test component lifecycle
npm test -- -t "should call lifecycle hooks"

# Test component rendering
npm test -- -t "should render correctly"

# Test component updating
npm test -- -t "should update when data changes"

# Test props handling
npm test -- -t "should make props accessible"
```

### Reactivity Tests
```bash
# Test reactive objects
npm test -- -t "should make an object reactive"

# Test nested reactivity
npm test -- -t "should handle nested objects"

# Test ref functionality
npm test -- -t "should create a reactive reference"
npm test -- -t "should work with complex values"

# Test computed properties
npm test -- -t "should compute derived values"
npm test -- -t "should be reactive"
npm test -- -t "should handle setter"

# Test effect system
npm test -- -t "should run the effect function"
npm test -- -t "should handle multiple effects"
npm test -- -t "effect should stop tracking when inactive"
```

### Virtual DOM Tests
```bash
# Test element creation
npm test -- -t "createElement should" -t "h should"

# Test text elements
npm test -- -t "createTextElement"

# Test DOM creation from VDOM
npm test -- -t "createDOMElement"

# Test diffing and patching
npm test -- -t "updateElement"
npm test -- -t "updateProps"
npm test -- -t "updateChildren"
```

### Router Tests
```bash
# Test router initialization
npm test -- -t "should create a router instance"
npm test -- -t "should initialize with default values"

# Test route matching
npm test -- -t "should match exact routes"
npm test -- -t "should match dynamic routes"
npm test -- -t "should match fallback route"

# Test navigation
npm test -- -t "should push a new route"
npm test -- -t "should replace current route"
npm test -- -t "should go back in history"

# Test query parameters
npm test -- -t "should parse query parameters"

# Test router components
npm test -- -t "RouterView should render"
npm test -- -t "RouterLink should render"
```

### State Management Tests
```bash
# Test store creation
npm test -- -t "store should initialize with state"

# Test mutations
npm test -- -t "store should apply mutations"

# Test getters
npm test -- -t "store should handle getters"

# Test mappers
npm test -- -t "mapState"
npm test -- -t "mapGetters"
```

## Testing by Test Type

```bash
# Run all unit tests
npm test -- tests/unit

# Run all integration tests
npm test -- tests/integration
```

## Testing with Additional Options

```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests with coverage report
npm test -- --coverage

# Run tests in watch mode (reruns on file changes)
npm test -- --watch
```

## Debugging Specific Issues

```bash
# Debug module resolution issues
npm test -- --verbose -t "error module"

# Debug specific component issue
npm test -- tests/unit/component.test.js --verbose

# Run a single specific test
npm test -- -t "effect should stop tracking when inactive"
```

## Focused Testing for Current Issues

Based on previous errors, you might want to focus on these tests first:

```bash
# Fix ref implementation issues
npm test -- -t "ref should" --verbose

# Fix array reactivity issues
npm test -- -t "reactivity should work with arrays" --verbose

# Fix VDOM export issues
npm test -- tests/unit/vdom.test.js --verbose

# Fix component rendering
npm test -- -t "component should render correctly" --verbose

# Fix store test modules
npm test -- tests/unit/store.test.js --verbose
```

This comprehensive testing strategy will help you methodically address issues in your kalxjs framework. The modular approach allows you to focus on specific components or features while keeping track of your progress.