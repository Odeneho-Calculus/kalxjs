# KALXJS DevTools Testing & Enhancement Plan

## Overview

Comprehensive testing strategy for `@kalxjs/devtools` package across initialization, component inspection, performance profiling, and extension integration. This document outlines systematic testing phases and enhancement targets.

---

## Phase 1: Core Initialization & Hook System

**Objective**: Verify DevTools hook initialization, registration, and connection mechanisms.

### 1.1 DevTools Hook Initialization
- [ ] Hook initializes successfully in browser environment
- [ ] Hook is attached to `window.__KALXJS_DEVTOOLS_HOOK__`
- [ ] Multiple initialization calls return the same hook instance (singleton pattern)
- [ ] Hook initialization in non-browser environments (SSR) returns null gracefully
- [ ] Initial hook state: `connected = false`, empty maps for apps and components
- [ ] postMessage announcement is sent during initialization

### 1.2 Application Registration
- [ ] Single app registration stores app metadata correctly
- [ ] Multiple app registrations generate unique IDs
- [ ] Custom app ID can be provided during registration
- [ ] App metadata includes: id, name, version, rootComponent, created timestamp
- [ ] Unregister app removes app from registry
- [ ] Unregister non-existent app doesn't throw error
- [ ] app:registered event is emitted with correct data
- [ ] app:unregistered event is emitted with correct data

### 1.3 Event System
- [ ] Event listeners can be attached via `on()`
- [ ] Multiple listeners for same event are all called
- [ ] `off()` removes specific listener
- [ ] Event unsubscribe function works correctly
- [ ] Events are buffered before connection
- [ ] Buffered events are flushed upon connection
- [ ] postMessage sends events to window when connected
- [ ] Event emission doesn't fail with multiple listeners

### 1.4 Connection Management
- [ ] `connect()` sets connected flag to true
- [ ] `connect()` flushes buffered events
- [ ] `connect()` emits devtools:connected event
- [ ] `disconnect()` sets connected flag to false
- [ ] `disconnect()` emits devtools:disconnected event
- [ ] Transition from disconnected to connected works smoothly
- [ ] Multiple connect() calls don't duplicate events

---

## Phase 2: Component Registration & Tracking

**Objective**: Test component lifecycle tracking, state extraction, and tree building.

### 2.1 Component Registration
- [ ] Component with proper structure registers successfully
- [ ] Component without $options defaults handled
- [ ] Component _uid is used if available, otherwise generated
- [ ] Component metadata includes: id, name, type, parent, children, state, props, created
- [ ] Parent-child relationships are established correctly
- [ ] component:registered event emitted with component data
- [ ] Multiple components can be registered in same app

### 2.2 State Extraction
- [ ] `$data` properties extracted to state object
- [ ] `$refs` extracted to state._refs
- [ ] Computed properties extracted to state._computed
- [ ] State extraction doesn't modify original component
- [ ] State extraction handles missing $data gracefully
- [ ] State extraction handles missing $refs gracefully
- [ ] Deep object state properly captured
- [ ] Array state properly captured

### 2.3 Component Updates
- [ ] `updateComponent()` modifies component state
- [ ] `updateComponent()` emits component:updated event
- [ ] Update doesn't affect unrelated components
- [ ] Non-existent component update returns gracefully

### 2.4 Component Tree Structure
- [ ] `getComponentTree()` builds correct hierarchy for single app
- [ ] Tree includes all parent-child relationships
- [ ] Tree structure matches actual component nesting
- [ ] Tree root identified correctly
- [ ] Multiple root components handled correctly
- [ ] getComponentTree() for non-existent app returns null
- [ ] Tree serialization includes state, props, children

---

## Phase 3: Component Inspector Features

**Objective**: Test component inspection, state editing, highlighting, and performance metrics.

### 3.1 Component Selection & Details
- [ ] `selectComponent()` retrieves correct component
- [ ] `selectComponent()` emits inspector:component-selected event
- [ ] `getComponentDetails()` returns complete component metadata
- [ ] Component details include: id, name, type, file, state, props, computed, lifecycle
- [ ] Component details include parent/children references
- [ ] Component details include render and update counts
- [ ] Selection of non-existent component returns null

### 3.2 State Serialization
- [ ] Primitive types (string, number, boolean) serialized correctly
- [ ] Null serialized as 'null' type
- [ ] Array serialized with correct length information
- [ ] Object serialized with key count
- [ ] Deep nesting limited to 2 levels (truncated with '...')
- [ ] Function values formatted with toString() preview
- [ ] Symbol values formatted correctly
- [ ] Date values formatted as ISO string
- [ ] RegExp values formatted as string

### 3.3 Value Type Detection
- [ ] Primitive types detected: string, number, boolean, null, undefined
- [ ] Array type detected correctly
- [ ] Object type detected correctly
- [ ] Date type detected
- [ ] RegExp type detected
- [ ] Map type detected
- [ ] Set type detected
- [ ] Function type detected

### 3.4 Editability Detection
- [ ] String values marked as editable
- [ ] Number values marked as editable
- [ ] Boolean values marked as editable
- [ ] Null marked as editable
- [ ] Array/Object marked as non-editable
- [ ] Function marked as non-editable

### 3.5 State Editing
- [ ] Simple property can be edited (e.g., "count": 5 → 10)
- [ ] Nested property can be edited (e.g., "user.name")
- [ ] Multiple levels of nesting supported (e.g., "a.b.c")
- [ ] editState() returns true on success
- [ ] editState() returns false on error
- [ ] Edited value reflected in component instance
- [ ] component:updated event emitted after edit
- [ ] Non-existent path returns false
- [ ] Invalid path structure handled gracefully

### 3.6 Component Highlighting
- [ ] Highlight element created on first call
- [ ] Highlight positioned correctly over component element
- [ ] Highlight dimensions match element dimensions
- [ ] Highlight uses correct styling (border, background, z-index)
- [ ] Highlight can be removed with `unhighlightComponent()`
- [ ] Multiple highlights don't create duplicate elements
- [ ] Highlight removed from DOM when unhighlighted
- [ ] Component without $el doesn't create highlight

### 3.7 Performance Metrics
- [ ] `getPerformanceMetrics()` returns correct structure
- [ ] Metrics include renderCount from component instance
- [ ] Metrics include updateCount from component instance
- [ ] Metrics include renderTime from component instance
- [ ] Metrics include created timestamp
- [ ] Metrics include lastUpdate timestamp
- [ ] Non-existent component metrics return null

---

## Phase 4: Performance Profiler

**Objective**: Test performance recording, analysis, and metrics calculation.

### 4.1 Recording Lifecycle
- [ ] `startRecording()` sets isRecording to true
- [ ] `startRecording()` creates currentRecording with ID and timestamp
- [ ] `startRecording()` emits profiler:started event
- [ ] startRecording() while already recording logs warning
- [ ] `stopRecording()` sets isRecording to false
- [ ] `stopRecording()` calculates duration correctly
- [ ] `stopRecording()` saves recording to recordings array
- [ ] `stopRecording()` emits profiler:stopped event
- [ ] stopRecording() while not recording logs warning and returns null

### 4.2 Event Recording
- [ ] Component registered events recorded during recording
- [ ] Component updated events recorded during recording
- [ ] Render events recorded with componentId and duration
- [ ] Events not recorded when not recording
- [ ] Events include timestamp during recording
- [ ] Multiple events from same recording stored correctly

### 4.3 Metrics Calculation
- [ ] Total events counted correctly
- [ ] Component registrations counted
- [ ] Component updates counted
- [ ] Render events counted
- [ ] Average render time calculated correctly
- [ ] Max render time identified
- [ ] Min render time identified
- [ ] Slowest components identified and ranked
- [ ] Metrics include affected component IDs

### 4.4 Performance Analysis
- [ ] Slow renders detected (>16ms threshold)
- [ ] Excessive updates detected (>5x components ratio)
- [ ] Potential memory leaks detected (>80% mounted)
- [ ] Issues include severity level
- [ ] Issues include actionable message
- [ ] Issues include technical details
- [ ] No false positives for normal performance

### 4.5 Metrics Retrieval & Export
- [ ] `getComponentMetrics()` returns metrics for recorded component
- [ ] `getAllMetrics()` returns all component metrics
- [ ] `getRecordings()` returns all saved recordings
- [ ] `clearRecordings()` clears recordings array
- [ ] `clearRecordings()` clears metrics map
- [ ] `exportRecording()` exports recording as JSON
- [ ] exportRecording() for non-existent recording returns null

---

## Phase 5: DevTools Creation & Configuration

**Objective**: Test factory functions and initialization options.

### 5.1 Inspector Creation
- [ ] `createInspector()` returns ComponentInspector instance
- [ ] `createInspector()` without hook returns null with warning
- [ ] Inspector has access to correct hook

### 5.2 Profiler Creation
- [ ] `createProfiler()` returns PerformanceProfiler instance
- [ ] `createProfiler()` without hook returns null with warning
- [ ] Profiler has access to correct hook

### 5.3 DevTools Factory
- [ ] `createDevTools()` initializes all components
- [ ] createDevTools() respects enabled flag
- [ ] createDevTools() respects inspector option
- [ ] createDevTools() respects profiler option
- [ ] createDevTools() auto-connects hook
- [ ] createDevTools() returns null when disabled
- [ ] createDevTools() disables by default in production
- [ ] Default options enable inspector and profiler

---

## Phase 6: Extension Integration & Communication

**Objective**: Test browser extension message passing and synchronization.

### 6.1 Hook Announcement
- [ ] postMessage announces hook initialization
- [ ] Message includes source identifier: 'kalxjs-devtools-hook'
- [ ] Message includes event: 'init'
- [ ] Message includes framework version
- [ ] Extension can detect framework presence

### 6.2 Event Communication
- [ ] Events broadcast via postMessage when connected
- [ ] Event messages include source identifier
- [ ] Event messages include event name
- [ ] Event messages include data payload
- [ ] Extension receives messages correctly

### 6.3 Hook Query
- [ ] `getDevToolsHook()` returns hook if initialized
- [ ] getDevToolsHook() returns null in non-browser
- [ ] getDevToolsHook() returns null if not initialized
- [ ] Hook is globally accessible via window

---

## Phase 7: Edge Cases & Error Handling

**Objective**: Test robustness against unusual inputs and error conditions.

### 7.1 Null/Undefined Handling
- [ ] Null component data handled
- [ ] Undefined props handled
- [ ] Missing lifecycle hooks handled
- [ ] Missing computed properties handled
- [ ] Empty state object handled

### 7.2 Circular Reference Handling
- [ ] Circular object references don't crash profiler
- [ ] Circular parent-child relationships handled
- [ ] Deep recursion limited correctly

### 7.3 Large Dataset Handling
- [ ] 1000+ components can be registered
- [ ] Deep component trees (50+ levels) handled
- [ ] Large state objects (1MB+) serialized
- [ ] Performance doesn't degrade linearly with data size

### 7.4 Concurrent Operations
- [ ] Multiple simultaneous edits don't conflict
- [ ] Recording during profiling works correctly
- [ ] Inspection during recording works correctly

---

## Phase 8: Integration Tests

**Objective**: Test full workflow scenarios with real KALXJS applications.

### 8.1 Counter App Integration
- [ ] DevTools initializes correctly with counter component
- [ ] Component state changes tracked
- [ ] Profiler records increment operations
- [ ] Performance metrics within expected range
- [ ] Inspector can modify counter value

### 8.2 Multi-Component App Integration
- [ ] Multiple components registered and tracked
- [ ] Parent-child relationships reflect DOM structure
- [ ] State changes propagated correctly
- [ ] Tree visualization matches actual structure

### 8.3 Store Integration (if applicable)
- [ ] Store mutations tracked as component updates
- [ ] Store state visible in component details
- [ ] Time-travel debugging supported

---

## Phase 9: Documentation & Usability

**Objective**: Ensure comprehensive documentation, API consistency, and developer experience.

### 9.1 README & Installation Documentation

**File**: `README.md` — Production-quality documentation with examples

- [x] Installation instructions for npm, yarn, pnpm
- [x] Quick start guide with basic setup
- [x] Component registration lifecycle guide
- [x] Zero-overhead in production (disabled by default)
- [x] Table of contents with clear sections

### 9.2 API Reference Documentation

#### DevTools Hook API
- [x] `initDevTools()` - Initialize hook globally
- [x] `getDevToolsHook()` - Retrieve existing hook
- [x] `hook.registerApp(app, options)` - Register application
  - Parameters: app instance, optional id/name/version
  - Returns: application ID
  - Events: app:registered
- [x] `hook.unregisterApp(id)` - Unregister application
- [x] `hook.registerComponent(instance, appId)` - Register component
  - Extracts: state ($data), refs, computed properties, props
  - Returns: component ID
  - Events: component:registered
- [x] `hook.updateComponent(id, updates)` - Update component state
- [x] `hook.getComponentTree(appId)` - Retrieve full component hierarchy
- [x] `hook.getApps()` - Get all registered applications
- [x] `hook.getComponents(appId?)` - Get all or filtered components
- [x] `hook.on(event, callback)` - Subscribe to events
  - Returns: unsubscribe function
- [x] `hook.off(event, callback)` - Unsubscribe from event
- [x] `hook.emit(event, data)` - Emit events
- [x] `hook.connect()` - Connect to browser extension
  - Flushes buffered events
  - Events: devtools:connected
- [x] `hook.disconnect()` - Disconnect from extension
  - Events: devtools:disconnected

#### Component Inspector API
- [x] `createInspector()` - Create inspector instance
- [x] `inspector.selectComponent(componentId)` - Select for inspection
  - Returns: component details or null
  - Events: inspector:component-selected
- [x] `inspector.getComponentDetails(componentId)` - Get metadata
  - Includes: state, props, computed, lifecycle, tree position, render/update counts
- [x] `inspector.serializeState(state)` - Serialize state with type info
  - Each property includes: type, value, editable, raw
- [x] `inspector.serializeProps(props)` - Serialize props
- [x] `inspector.getValueType(value)` - Type detection
  - Supported: string, number, boolean, null, undefined, array, object, function, symbol, date, regexp, map, set
- [x] `inspector.isEditable(value)` - Check editability
  - Editable: string, number, boolean, null
- [x] `inspector.editState(componentId, path, value)` - Edit component state
  - Supports nested paths: "user.name"
  - Returns: boolean success/failure
  - Events: component:updated on success
- [x] `inspector.highlightComponent(componentId)` - Visual overlay
  - Style: green border, 2px, z-index 999999
- [x] `inspector.unhighlightComponent()` - Remove overlay
- [x] `inspector.getPerformanceMetrics(componentId)` - Get metrics
  - Returns: renderCount, updateCount, renderTime, created, lastUpdate

#### Performance Profiler API
- [x] `createProfiler()` - Create profiler instance
- [x] `profiler.startRecording(options)` - Start performance recording
  - Returns: void
  - Events: profiler:started
- [x] `profiler.stopRecording()` - Stop and calculate metrics
  - Returns: recording object with id, duration, events, metrics
  - Events: profiler:stopped
- [x] `profiler.recordRender(componentId, duration)` - Record render event
- [x] `profiler.getComponentMetrics(componentId)` - Get component metrics
  - Returns: renders, totalTime, minTime, maxTime, avgTime
- [x] `profiler.getAllMetrics()` - Get all metrics
- [x] `profiler.getRecordings()` - Get all recordings
- [x] `profiler.clearRecordings()` - Clear all data
- [x] `profiler.exportRecording(recordingId)` - Export as JSON
- [x] `profiler.analyzePerformance(recording)` - Analyze issues
  - Detects: slow renders (>16ms), excessive updates (>5x), memory concerns (>80%)

#### Factory Function
- [x] `createDevTools(options)` - Initialize all features
  - Options: enabled, inspector, profiler
  - Returns: { hook, inspector, profiler }
  - Auto-connects hook if enabled

### 9.3 API Consistency Patterns

**Return Types**: Consistent across all methods
- Success operations return object or ID string
- Failures return null or false
- Methods never throw exceptions
- Async operations not supported (synchronous API)

**Error Handling**: Graceful degradation
- Methods return null/false instead of throwing
- Console warnings for non-fatal issues
- No mandatory error handling required
- API remains usable even with missing data

**Event System**: Consistent naming and structure
- Naming: `module:action` format (app:registered, component:updated)
- All events emit data payload
- Listeners receive complete information
- Unsubscribe always provided

**Configuration**: Single options object
```javascript
createDevTools({ enabled, inspector, profiler })
hook.registerApp(app, { id, name, version })
profiler.startRecording({ label, metadata })
```

### 9.4 Event System Documentation

**Available Events**:
- `app:registered` - Application registered
  - Data: { id, app }
- `app:unregistered` - Application unregistered
  - Data: { id }
- `component:registered` - Component registered
  - Data: { id, instance }
- `component:updated` - Component state updated
  - Data: { id, updates }
- `inspector:component-selected` - Component selected
  - Data: { component }
- `profiler:started` - Recording started
  - Data: { recording }
- `profiler:stopped` - Recording stopped
  - Data: { recording }
- `devtools:connected` - Connected to extension
  - Data: { timestamp }
- `devtools:disconnected` - Disconnected from extension
  - Data: { timestamp }

**Event Subscription Pattern**:
```javascript
// Subscribe
const unsubscribe = hook.on('event:name', (data) => {
  // Handle event
});

// Unsubscribe
unsubscribe();
```

### 9.5 Type Safety & JSDoc Documentation

All exported functions have complete JSDoc:

**DevTools API** (`devtools-api.js`):
- `DevToolsHook` class with method signatures
- `initDevTools()` documented
- `getDevToolsHook()` documented
- All methods include param types and return types

**Component Inspector** (`component-inspector.js`):
- `ComponentInspector` class with method signatures
- `createInspector()` documented
- State serialization methods documented
- Utility methods documented

**Performance Profiler** (`performance-profiler.js`):
- `PerformanceProfiler` class with method signatures
- `createProfiler()` documented
- Recording methods documented
- Analysis methods documented

**Module Export** (`index.js`):
- All 6 main exports documented
- `createDevTools()` factory documented
- Default export documented

### 9.6 Code Examples

Complete examples in README:
- [x] Basic setup and initialization
- [x] Component registration in lifecycle
- [x] Component inspection and state editing
- [x] Performance profiling workflow
- [x] Component highlighting
- [x] Event monitoring
- [x] Proper error handling

### 9.7 API Usability

**Conventions Followed**:
- Consistent method naming: `register*`, `get*`, `create*`, `edit*`
- Clear parameter names: componentId, appId, path, value
- Descriptive return values: null for not found, false for failed edits
- Options object pattern for configuration
- Factory pattern for instance creation

**Developer Experience**:
- No required error handling (safe defaults)
- Chainable where applicable
- Early returns for edge cases
- Helpful console messages in development
- Production-safe (disabled by default)

### 9.8 Browser Extension Integration

**Hook Announcement**:
```javascript
window.postMessage({
  source: 'kalxjs-devtools-hook',
  event: 'init',
  version: '2.2.8'
}, '*');
```

**Global Access**:
```javascript
window.__KALXJS_DEVTOOLS_HOOK__ // Always available if initialized
```

**Event Broadcasting**:
```javascript
window.postMessage({
  source: 'kalxjs-devtools-hook',
  event: 'component:registered',
  data: { /* ... */ }
}, '*');
```

### 9.9 Documentation Completeness Checklist

- [x] Installation instructions (npm, yarn, pnpm)
- [x] Quick start guide
- [x] API reference for all 6 exported entities
- [x] Complete method signatures with parameters
- [x] Return types documented
- [x] Available events documented
- [x] Parameter options documented
- [x] Type information provided
- [x] Code examples for all features
- [x] Best practices section
- [x] Browser extension integration guide
- [x] Troubleshooting section
- [x] Performance characteristics table
- [x] License and contribution info

---

## Phase 10: Performance & Optimization

**Objective**: Ensure DevTools has minimal performance impact.

### 10.1 Overhead Measurement
- [ ] Hook initialization overhead: <1ms
- [ ] Component registration overhead: <0.5ms per component
- [ ] State extraction overhead: <1ms per component
- [ ] Event emission overhead: <0.1ms
- [ ] Profiler recording overhead: <2%

### 10.2 Memory Usage
- [ ] Hook doesn't leak memory with component churn
- [ ] Old recordings can be garbage collected
- [ ] Buffer doesn't grow unbounded
- [ ] Circular reference cleanup tested

### 10.3 Bundle Size
- [ ] Minified bundle size < 50KB
- [ ] Tree-shaking removes unused modules
- [ ] No unnecessary polyfills included

---

## Test Execution Strategy

### Tools & Framework
- **Framework**: Jest with jsdom
- **Location**: `tests/unit/devtools.test.js` (new)
- **Integration Tests**: `tests/integration/devtools.test.js` (new)

### Test Coverage Goals
- **Lines**: ≥ 90%
- **Branches**: ≥ 85%
- **Functions**: ≥ 90%
- **Statements**: ≥ 90%

### Continuous Integration
- Run on every commit
- Run full suite before publishing
- Performance benchmarks tracked
- Coverage reports tracked

---

## Enhancements & Improvements

Based on industry best practices for developer tools, planned enhancements:

### Short-term (v1.3.x)
1. **Error Recovery**: Better error messages and recovery strategies
2. **Hook Status Monitoring**: Monitor hook connectivity and health
3. **Batch Operations**: Support batch component registration for better performance
4. **State Comparison**: Ability to compare component state between snapshots

### Medium-term (v2.0.0)
1. **Time Travel Debugging**: Replay component state changes
2. **Computed Dependency Tracking**: Visualize what triggers computed updates
3. **Performance Warnings**: Real-time alerts for performance issues
4. **Custom Hooks**: Allow users to define custom devtool hooks
5. **Remote Debugging**: Connect to apps via websocket for remote inspection

### Long-term (v2.1+)
1. **AI-assisted Debugging**: Analyze patterns and suggest optimizations
2. **Memory Profiler**: Track memory allocations by component
3. **Network Inspector**: Track async operations and API calls
4. **Replay Engine**: Record and replay user interactions with state

---

## Success Criteria

- [ ] All Phase 1-7 tests pass with 100% pass rate
- [ ] Code coverage ≥ 90%
- [ ] Performance overhead < 2% for typical apps
- [ ] Memory footprint < 10MB for 1000 components
- [ ] Documentation updated with examples
- [ ] Browser extension communicates correctly
- [ ] No regressions in existing tests
- [ ] Published update to npm
- [ ] Backward compatibility maintained

---

## Timeline

- **Phase 1-3**: Week 1 (Core functionality)
- **Phase 4-5**: Week 1 (Performance & Factory)
- **Phase 6-7**: Week 2 (Integration & Edge cases)
- **Phase 8-10**: Week 2 (Real integration, docs, performance)

---

## Notes

- Each phase builds on previous phases
- Tests should be run incrementally
- Performance benchmarks establish baselines
- Documentation updates mirror test completion
- Extension integration tested with actual extension