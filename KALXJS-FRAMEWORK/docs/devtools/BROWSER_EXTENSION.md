# KALXJS DevTools Browser Extension

Complete guide to using the official KALXJS DevTools Chrome extension.

## Installation

### From Chrome Web Store (Recommended)

1. Visit [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "KALXJS DevTools"
3. Click **Add to Chrome**
4. Confirm permissions
5. Reload your KALXJS application

### Manual Installation (Development)

```bash
# Clone the repository
git clone https://github.com/kalxjs/kalxjs.git
cd kalxjs/kalxjsDevToolBrowserExtension

# Install dependencies
npm install

# Build the extension
npm run build

# Load in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode" (top right)
# 3. Click "Load unpacked"
# 4. Select the build/ folder
```

## Getting Started

### 1. Open DevTools

Press **F12** (or **Ctrl+Shift+I**) in your browser with a KALXJS app loaded.

### 2. Find the KALXJS Tab

Look for the **KALXJS** tab at the top of the DevTools panel (appears when app is detected).

### 3. Explore the Interface

The extension has 4 main sections:

- **Inspector** - Component tree and state
- **State Editor** - Edit component state in real-time
- **Performance** - Render times and profiling
- **Events** - Timeline of component updates

## Inspector Tab

### Viewing the Component Tree

The Inspector shows the complete component hierarchy:

```
App (root)
  ├── Header
  │   ├── Logo
  │   └── Navigation
  ├── MainContent
  │   ├── Sidebar
  │   └── Page
  └── Footer
```

### Selecting Components

Click any component in the tree to:
- View its state, props, and computed properties
- See parent-child relationships
- View the component's code location

### Viewing Component Details

When selected, a component shows:

```javascript
{
  id: "component-1",
  name: "UserCard",
  type: "component",

  props: {
    userId: 42,
    showDetails: true
  },

  state: {
    loading: false,
    data: { name: 'John', email: 'john@example.com' },
    _refs: { form: HTMLFormElement }
  },

  computed: {
    displayName: 'John Doe'
  }
}
```

### Highlighting Components

Click the **Highlight** button (eye icon) to:
- Visually highlight the component in the page
- See its bounding box and dimensions
- Identify components visually while inspecting

Click again to remove the highlight.

## State Editor Tab

### Editing State

The State Editor allows real-time state modification:

1. Select a component in the Inspector
2. Go to the **State** section
3. Click on a value to edit

**Editable Types** (primitives):
- `string` - Text values
- `number` - Integers and decimals
- `boolean` - True/false toggles
- `null` - Empty values

**Non-editable Types** (complex):
- `object` - Use component methods instead
- `array` - Use component methods instead
- `function` - Cannot edit methods

### Example Workflow

```
Inspector: Select "Counter" component
          ↓
State Section: Shows { count: 5 }
          ↓
Click "count" value field
          ↓
Change 5 → 10
          ↓
Press Enter
          ↓
Component re-renders with new count
```

### Tracking Changes

Edit events appear in the **Events** tab with:
- Timestamp
- Component ID
- Changed property
- Old and new values

## Performance Tab

### Starting Performance Recording

1. Go to **Performance** tab
2. Click **Start Recording**
3. Perform user actions in your app
4. Click **Stop Recording**
5. View the analysis report

### Reading Performance Metrics

The report shows:

```
╔════════════════════════════════════════╗
║      Performance Analysis Report       ║
╠════════════════════════════════════════╣
║ Total Renders: 45                      ║
║ Average Render Time: 8.2ms             ║
║ Max Render Time: 24.5ms                ║
║ Slow Renders (>16ms): 3                ║
║ Excessive Updates: 2 components        ║
║ Memory Concerns: None                  ║
╚════════════════════════════════════════╝
```

**Thresholds**:
- **Slow Render**: >16ms (target for 60 FPS)
- **Excessive Updates**: >5x in recording session
- **Memory Concern**: >80% baseline

### Analyzing Slow Components

The report lists components with performance issues:

```
SLOW RENDERS (>16ms):
├── UserList
│   └── Render time: 24.5ms
├── DataTable
│   └── Render time: 18.3ms
└── Chart
    └── Render time: 16.1ms
```

Click a component to see:
- Why it rendered
- What state/props changed
- Optimization suggestions

### Exporting Metrics

Export performance data for analysis:

1. Click **Export** button
2. Choose format: JSON or CSV
3. Save the file
4. Analyze with external tools

**JSON Format**:
```json
{
  "totalRenders": 45,
  "averageRenderTime": 8.2,
  "renders": [
    {
      "componentId": "comp-1",
      "componentName": "UserList",
      "duration": 24.5,
      "timestamp": 1630000000000,
      "reason": "props changed"
    }
  ]
}
```

## Events Tab

### Event Timeline

The Events tab shows a timeline of all component lifecycle events:

```
┌────────────────────────────────────────┐
│  0ms  ├─ app:registered                │
│  2ms  ├─ component:registered (App)    │
│ 10ms  ├─ component:registered (Header) │
│ 15ms  ├─ component:registered (Content)│
│ 18ms  ├─ component:updated (Content)   │
│ 20ms  ├─ component:updated (Header)    │
│ 22ms  ├─ component:registered (Footer) │
│ 25ms  ├─ component:updated (App)       │
└────────────────────────────────────────┘
```

### Event Details

Click on an event to see:
- Event type and timestamp
- Component affected
- Data (state changes, new values)
- Stack trace (where event originated)

### Filtering Events

Filter events by:
- **Event type**: registration, update, removal
- **Component name**: by component name pattern
- **Time range**: between timestamps

### Event Types

| Event | Fired When |
|-------|-----------|
| `component:registered` | Component mounted and registered |
| `component:updated` | Component state or props changed |
| `component:removed` | Component unmounted |
| `app:registered` | Application registered |
| `profiler:started` | Performance recording started |
| `profiler:stopped` | Performance recording stopped |

## Settings & Options

### General Settings

Access settings via the **⚙️ Settings** button:

```
☐ Auto-expand component tree
☑ Highlight on select
☐ Filter components by type
☑ Show render times
☑ Deep inspect enabled
```

### Debug Mode

Enable debug mode for verbose logging:

```
☑ Debug mode
├─ Log component registration
├─ Log state changes
├─ Log render times
└─ Log event timeline
```

**Console Output**:
```
[KALXJS DevTools] Component registered: UserCard
[KALXJS DevTools] State updated: count (5 → 10)
[KALXJS DevTools] Render time: 12.3ms
```

### Export Settings

Save and load extension settings:

```
[Export Settings] → settings.json
[Import Settings] ← settings.json
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F12` | Open DevTools |
| `Ctrl+Shift+I` | Toggle DevTools |
| `Ctrl+Shift+C` | Element inspector |
| `Enter` | Confirm state edit |
| `Esc` | Cancel state edit |
| `Ctrl+A` | Select all text in field |
| `↑/↓` | Navigate event timeline |
| `Space` | Expand/collapse tree node |

## Advanced Features

### Component Search

Press **Ctrl+F** in the Inspector to search:

```
Search: "button"
Results:
├── SubmitButton
├── CancelButton
└── MenuButton
```

### State Diff Viewer

When state changes, view the diff:

```
BEFORE:  { count: 5, message: 'Hello' }
          ↓
AFTER:   { count: 10, message: 'Hello' }

CHANGES: { count: 5 → 10 }
```

### Custom Breakpoints

Set breakpoints on state changes:

```
Add breakpoint on: component.count > 10
```

When triggered, the extension pauses and shows:
- Component state at breakpoint
- Stack trace
- Option to continue or modify

### Remote Debugging

DevTools can work with remote KALXJS apps:

```javascript
// Remote app configuration
window.__KALXJS_DEVTOOLS_CONFIG__ = {
  remoteId: 'app-12345',
  remoteHost: 'debug.example.com',
  remotePort: 8080
};
```

## Troubleshooting

### Extension Not Appearing

1. Check if KALXJS app is loaded
2. Verify `initDevTools()` was called
3. Check browser console for errors
4. Try reloading the page
5. Reinstall extension if needed

### State Not Updating

1. Verify component is registered
2. Ensure state changes emit events
3. Check if state is reactive (using `ref()` or `reactive()`)
4. Look in console for edit errors

### Performance Not Recording

1. Click **Start Recording** first
2. Perform actions in the app
3. Ensure components are registered
4. Check browser console for errors
5. Try recording shorter session

### Extension Crashes

1. Clear extension data: Settings → Clear Data
2. Reload the page
3. Reinstall the extension
4. Check Chrome version compatibility

## Performance Considerations

- Extension adds ~2-5ms overhead
- Event buffering may use 1-2MB memory
- Performance recording limited to ~1000 events
- Export large datasets as JSON

## Accessibility

The DevTools extension supports:
- **Keyboard navigation** - Full keyboard control
- **High contrast mode** - Dark/light themes
- **Screen reader support** - ARIA labels and descriptions
- **Zoom support** - Panel zoom 100-200%

## Tips & Tricks

### Tip 1: Monitor State Changes
Set up real-time monitoring of specific state properties to catch issues early.

### Tip 2: Use Performance Profiling
Run performance analysis after significant code changes to track impact.

### Tip 3: Export Metrics
Regularly export and compare metrics to establish performance baseline.

### Tip 4: Component Highlight
Use highlighting when searching for components visually in complex UIs.

### Tip 5: Event Timeline
Review event timeline to understand component initialization order.

## Support & Feedback

- **Report Issues**: [GitHub Issues](https://github.com/kalxjs/kalxjs/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/kalxjs/kalxjs/discussions)
- **Documentation**: [DevTools Docs](./README.md)

## Version History

See [CHANGELOG.md](../packages/devtools/CHANGELOG.md) for extension updates and new features.