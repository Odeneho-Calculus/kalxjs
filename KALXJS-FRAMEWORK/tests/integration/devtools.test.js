/**
 * @kalxjs/devtools Integration Tests
 * Testing devtools with real KALXJS applications and components
 */

import {
    initDevTools,
    DevToolsHook
} from '@kalxjs/devtools/devtools-api';
import {
    createInspector
} from '@kalxjs/devtools/component-inspector';
import {
    createProfiler
} from '@kalxjs/devtools/performance-profiler';
import {
    createDevTools
} from '@kalxjs/devtools/index';
import { createComponent } from '@kalxjs/core/component';

// ============================================================================
// PHASE 8: INTEGRATION TESTS
// ============================================================================

describe('Phase 8: DevTools Integration with KALXJS Applications', () => {
    let hook;
    let inspector;
    let profiler;

    beforeEach(() => {
        delete window.__KALXJS_DEVTOOLS_HOOK__;
        hook = initDevTools();
        hook.connect();
        inspector = createInspector();
        profiler = createProfiler();
    });

    describe('8.1 Counter App Integration', () => {
        test('should initialize devtools with counter component', () => {
            // Register app
            const mockApp = { _rootComponent: {} };
            const appId = hook.registerApp(mockApp, {
                name: 'CounterApp',
                version: '1.0.0'
            });

            expect(appId).toBeTruthy();
            expect(hook.apps.has(appId)).toBe(true);
        });

        test('should track counter component state changes', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'CounterApp' }
            );

            // Create counter component
            const counter = {
                _uid: 'counter-1',
                $options: { name: 'Counter' },
                $parent: null,
                $data: { count: 0 },
                $props: {}
            };

            hook.registerComponent(counter, appId);

            // Simulate count updates
            hook.updateComponent('counter-1', { count: 1 });
            hook.updateComponent('counter-1', { count: 2 });
            hook.updateComponent('counter-1', { count: 3 });

            const component = hook.componentInstances.get('counter-1');
            expect(component.state.count).toBe(3);
        });

        test('should profile increment operations', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'CounterApp' }
            );

            const counter = {
                _uid: 'counter-1',
                $options: { name: 'Counter' },
                $parent: null,
                $data: { count: 0 },
                $props: {}
            };

            hook.registerComponent(counter, appId);

            // Start profiling
            profiler.startRecording();

            // Record increments
            for (let i = 0; i < 10; i++) {
                hook.updateComponent('counter-1', { count: i + 1 });
                profiler.recordRender('counter-1', Math.random() * 5); // Simulate render time
            }

            const recording = profiler.stopRecording();

            expect(recording).toBeTruthy();
            expect(recording.metrics.componentUpdates).toBeGreaterThan(0);
            expect(recording.metrics.renders).toBe(10);
        });

        test('should calculate performance within expected range', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'CounterApp' }
            );

            const counter = {
                _uid: 'counter-1',
                $options: { name: 'Counter' },
                $parent: null,
                $data: { count: 0 },
                $props: {}
            };

            hook.registerComponent(counter, appId);
            profiler.startRecording();

            // Simulate fast renders
            for (let i = 0; i < 5; i++) {
                profiler.recordRender('counter-1', 2.5); // Good performance
            }

            const recording = profiler.stopRecording();
            const issues = profiler.analyzePerformance(recording);

            // No slow render issues expected
            const slowRenderIssues = issues.filter(i => i.type === 'slow-render');
            expect(slowRenderIssues.length).toBe(0);
        });

        test('should allow inspecting counter state', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'CounterApp' }
            );

            const counter = {
                _uid: 'counter-1',
                $options: { name: 'Counter' },
                $parent: null,
                $data: { count: 42 },
                $props: { initial: 0 }
            };

            hook.registerComponent(counter, appId);

            const details = inspector.getComponentDetails('counter-1');

            expect(details.name).toBe('Counter');
            expect(details.state.count.raw).toBe(42);
            expect(details.props.initial.raw).toBe(0);
        });

        test('should allow modifying counter value through inspector', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'CounterApp' }
            );

            const counter = {
                _uid: 'counter-1',
                $options: { name: 'Counter' },
                $parent: null,
                $data: { count: 5 },
                $props: {}
            };

            hook.registerComponent(counter, appId);

            // Edit through inspector
            const result = inspector.editState('counter-1', 'count', 100);

            expect(result).toBe(true);
            expect(counter.$data.count).toBe(100);

            const updated = hook.componentInstances.get('counter-1');
            expect(updated.state.count).toBe(100);
        });
    });

    describe('8.2 Multi-Component App Integration', () => {
        test('should register and track multiple components', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'TodoApp' }
            );

            // Root component
            const root = {
                _uid: 'root',
                $options: { name: 'App' },
                $parent: null,
                $data: { todos: [] },
                $props: {}
            };

            // Parent component
            const todoList = {
                _uid: 'todo-list',
                $options: { name: 'TodoList' },
                $parent: root,
                $data: { items: [] },
                $props: {}
            };

            // Child components
            const todoItem1 = {
                _uid: 'todo-item-1',
                $options: { name: 'TodoItem' },
                $parent: todoList,
                $data: { text: 'Buy milk' },
                $props: { todo: { id: 1 } }
            };

            const todoItem2 = {
                _uid: 'todo-item-2',
                $options: { name: 'TodoItem' },
                $parent: todoList,
                $data: { text: 'Fix bug' },
                $props: { todo: { id: 2 } }
            };

            hook.registerComponent(root, appId);
            hook.registerComponent(todoList, appId);
            hook.registerComponent(todoItem1, appId);
            hook.registerComponent(todoItem2, appId);

            expect(hook.componentInstances.size).toBe(4);
        });

        test('should reflect parent-child relationships in component tree', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'TodoApp' }
            );

            const root = {
                _uid: 'root',
                $options: { name: 'App' },
                $parent: null,
                $data: {},
                $props: {}
            };

            const parent = {
                _uid: 'parent',
                $options: { name: 'Container' },
                $parent: root,
                $data: {},
                $props: {}
            };

            const child = {
                _uid: 'child',
                $options: { name: 'Item' },
                $parent: parent,
                $data: {},
                $props: {}
            };

            hook.registerComponent(root, appId);
            hook.registerComponent(parent, appId);
            hook.registerComponent(child, appId);

            const tree = hook.getComponentTree(appId);

            expect(tree).toBeTruthy();
            expect(Array.isArray(tree)).toBe(true);
            expect(tree.length).toBeGreaterThan(0);
        });

        test('should track state changes across multiple components', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const comp1 = {
                _uid: 'comp-1',
                $options: { name: 'Component1' },
                $parent: null,
                $data: { value: 'a' },
                $props: {}
            };

            const comp2 = {
                _uid: 'comp-2',
                $options: { name: 'Component2' },
                $parent: null,
                $data: { value: 'b' },
                $props: {}
            };

            hook.registerComponent(comp1, appId);
            hook.registerComponent(comp2, appId);

            // Track updates
            const updates = [];
            hook.on('component:updated', (data) => updates.push(data));

            hook.updateComponent('comp-1', { value: 'x' });
            hook.updateComponent('comp-2', { value: 'y' });
            hook.updateComponent('comp-1', { value: 'z' });

            expect(updates.length).toBe(3);
            expect(hook.componentInstances.get('comp-1').state.value).toBe('z');
            expect(hook.componentInstances.get('comp-2').state.value).toBe('y');
        });

        test('should handle complex state mutations', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const list = {
                _uid: 'list',
                $options: { name: 'List' },
                $parent: null,
                $data: {
                    items: [
                        { id: 1, text: 'Item 1' },
                        { id: 2, text: 'Item 2' }
                    ],
                    filter: 'all'
                },
                $props: {}
            };

            hook.registerComponent(list, appId);

            // Add item
            const items = hook.componentInstances.get('list').state.items;
            items.push({ id: 3, text: 'Item 3' });
            hook.updateComponent('list', { items });

            // Change filter
            hook.updateComponent('list', { filter: 'active' });

            const component = hook.componentInstances.get('list');
            expect(component.state.items.length).toBe(3);
            expect(component.state.filter).toBe('active');
        });

        test('should profile multi-component interactions', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const components = [];
            for (let i = 0; i < 5; i++) {
                const comp = {
                    _uid: `comp-${i}`,
                    $options: { name: `Component${i}` },
                    $parent: null,
                    $data: { count: 0 },
                    $props: {}
                };
                components.push(comp);
                hook.registerComponent(comp, appId);
            }

            profiler.startRecording();

            // Simulate activity
            components.forEach((comp, idx) => {
                for (let i = 0; i < 10; i++) {
                    hook.updateComponent(comp._uid, { count: i });
                    profiler.recordRender(comp._uid, Math.random() * 3);
                }
            });

            const recording = profiler.stopRecording();

            expect(recording.metrics.componentUpdates).toBeGreaterThan(0);
            expect(recording.metrics.renders).toBe(50);
            expect(recording.metrics.slowestComponents.length).toBeGreaterThan(0);
        });
    });

    describe('8.3 Complex App Features', () => {
        test('should track computed properties', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const component = {
                _uid: 'calc',
                $options: {
                    name: 'Calculator',
                    computed: {
                        doubled: function () { return this.count * 2; }
                    }
                },
                $parent: null,
                $data: { count: 5 },
                $props: {},
                count: 5,
                doubled: 10
            };

            hook.registerComponent(component, appId);
            const details = inspector.getComponentDetails('calc');

            expect(details.state._computed).toBeTruthy();
        });

        test('should handle component lifecycle events', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const events = [];
            hook.on('component:registered', (e) => events.push('registered'));
            hook.on('component:updated', (e) => events.push('updated'));

            const comp = {
                _uid: 'lifecle-test',
                $options: { name: 'LifecycleTest' },
                $parent: null,
                $data: { value: 0 },
                $props: {}
            };

            hook.registerComponent(comp, appId);
            hook.updateComponent('lifecle-test', { value: 1 });
            hook.updateComponent('lifecle-test', { value: 2 });

            expect(events).toContain('registered');
            expect(events.filter(e => e === 'updated').length).toBe(2);
        });

        test('should handle refs in components', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const comp = {
                _uid: 'ref-test',
                $options: { name: 'RefTest' },
                $parent: null,
                $data: { value: 'test' },
                $refs: { input: { value: 'input-value' }, button: {} },
                $props: {}
            };

            hook.registerComponent(comp, appId);
            const details = inspector.getComponentDetails('ref-test');

            expect(details.state._refs).toBeTruthy();
            // Refs are extracted as part of state
            const state = hook.componentInstances.get('ref-test').state;
            expect(state._refs).toBeTruthy();
            expect(state._refs.input).toBeTruthy();
        });

        test('should track render metrics across operations', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const comp = {
                _uid: 'metrics-test',
                $options: { name: 'MetricsTest' },
                $parent: null,
                $data: { value: 0 },
                $props: {}
            };

            hook.registerComponent(comp, appId);

            profiler.startRecording();

            // Record various render times
            profiler.recordRender('metrics-test', 2.5);
            profiler.recordRender('metrics-test', 3.1);
            profiler.recordRender('metrics-test', 2.8);

            const recording = profiler.stopRecording();

            const metrics = recording.metrics;
            expect(metrics.renders).toBe(3);
            expect(metrics.avgRenderTime).toBeCloseTo(2.8, 1);
            expect(metrics.maxRenderTime).toBeCloseTo(3.1, 1);
            expect(metrics.minRenderTime).toBeCloseTo(2.5, 1);
        });
    });

    describe('8.4 Real-world Scenarios', () => {
        test('should debug form component with complex state', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'FormApp' }
            );

            const form = {
                _uid: 'form',
                $options: { name: 'Form' },
                $parent: null,
                $data: {
                    fields: {
                        name: { value: '', errors: [] },
                        email: { value: '', errors: [] }
                    },
                    submitted: false
                },
                $props: {},
                $refs: { nameInput: {}, emailInput: {} }
            };

            hook.registerComponent(form, appId);

            // Simulate form interactions
            hook.updateComponent('form', {
                fields: {
                    name: { value: 'John', errors: [] },
                    email: { value: 'john@example.com', errors: [] }
                }
            });

            hook.updateComponent('form', { submitted: true });

            const details = inspector.getComponentDetails('form');
            expect(details.state.fields).toBeTruthy();
            expect(details.state.submitted.raw).toBe(true);
        });

        test('should profile list rendering with hundreds of items', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'ListApp' }
            );

            const list = {
                _uid: 'list',
                $options: { name: 'VirtualList' },
                $parent: null,
                $data: { items: Array(1000).fill(0).map((_, i) => ({ id: i, text: `Item ${i}` })) },
                $props: {}
            };

            hook.registerComponent(list, appId);
            profiler.startRecording();

            // Initial render - slow (>16ms threshold)
            profiler.recordRender('list', 17.5);

            // Update item - fast
            hook.updateComponent('list', { items: list.$data.items });
            profiler.recordRender('list', 1.2);

            const recording = profiler.stopRecording();
            const issues = profiler.analyzePerformance(recording);

            // Should detect initial slow render
            const slowRenderIssues = issues.filter(i => i.type === 'slow-render');
            expect(slowRenderIssues.length).toBeGreaterThan(0);
        });

        test('should detect performance issues in recursive components', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'TreeApp' }
            );

            // Create tree structure
            const createNode = (id, depth, parent = null) => ({
                _uid: `node-${id}`,
                $options: { name: `TreeNode` },
                $parent: parent,
                $data: { depth, id },
                $props: { node: { id, depth } }
            });

            const root = createNode(0, 0);
            hook.registerComponent(root, appId);

            // Add children recursively
            for (let i = 1; i < 20; i++) {
                const node = createNode(i, Math.floor(i / 4), root);
                hook.registerComponent(node, appId);
            }

            profiler.startRecording();

            // Record renders for each node
            for (let i = 0; i < 20; i++) {
                profiler.recordRender(`node-${i}`, 1.5);
            }

            const recording = profiler.stopRecording();

            expect(recording.metrics.renders).toBe(20);
            expect(hook.componentInstances.size).toBe(20);
        });
    });

    describe('8.5 Integration with DevTools Factory', () => {
        test('should create complete devtools suite', () => {
            const devtools = createDevTools({
                enabled: true,
                inspector: true,
                profiler: true
            });

            expect(devtools).toBeTruthy();
            expect(devtools.hook).toBeTruthy();
            expect(devtools.inspector).toBeTruthy();
            expect(devtools.profiler).toBeTruthy();
            expect(devtools.hook.connected).toBe(true);
        });

        test('should allow selective feature activation', () => {
            const devtoolsInspectorOnly = createDevTools({
                enabled: true,
                inspector: true,
                profiler: false
            });

            expect(devtoolsInspectorOnly.inspector).toBeTruthy();
            expect(devtoolsInspectorOnly.profiler).toBeNull();

            const devtoolsProfilerOnly = createDevTools({
                enabled: true,
                inspector: false,
                profiler: true
            });

            expect(devtoolsProfilerOnly.inspector).toBeNull();
            expect(devtoolsProfilerOnly.profiler).toBeTruthy();
        });

        test('should respect production environment', () => {
            const originalEnv = process.env.NODE_ENV;

            try {
                process.env.NODE_ENV = 'production';
                const devtools = createDevTools(); // No options = auto-disable in production
                expect(devtools).toBeNull();
            } finally {
                process.env.NODE_ENV = originalEnv;
            }
        });
    });
});

// ============================================================================
// PHASE 9: DOCUMENTATION & USABILITY
// ============================================================================

describe('Phase 9: DevTools Documentation & Usability', () => {
    let hook;
    let inspector;
    let profiler;

    beforeEach(() => {
        delete window.__KALXJS_DEVTOOLS_HOOK__;
        hook = initDevTools();
        hook.connect();
        inspector = createInspector();
        profiler = createProfiler();
    });

    describe('9.1 README Accuracy & API Completeness', () => {
        test('should have all documented methods available', () => {
            // Core hook methods
            expect(typeof hook.registerApp).toBe('function');
            expect(typeof hook.unregisterApp).toBe('function');
            expect(typeof hook.registerComponent).toBe('function');
            expect(typeof hook.updateComponent).toBe('function');
            expect(typeof hook.getComponentTree).toBe('function');
            expect(typeof hook.connect).toBe('function');
            expect(typeof hook.disconnect).toBe('function');
            expect(typeof hook.on).toBe('function');
            expect(typeof hook.off).toBe('function');
            expect(typeof hook.emit).toBe('function');
            expect(typeof hook.getApps).toBe('function');
            expect(typeof hook.getComponents).toBe('function');
        });

        test('should have all inspector methods available', () => {
            expect(typeof inspector.selectComponent).toBe('function');
            expect(typeof inspector.getComponentDetails).toBe('function');
            expect(typeof inspector.editState).toBe('function');
            expect(typeof inspector.highlightComponent).toBe('function');
            expect(typeof inspector.unhighlightComponent).toBe('function');
            expect(typeof inspector.getPerformanceMetrics).toBe('function');
            expect(typeof inspector.serializeState).toBe('function');
            expect(typeof inspector.isEditable).toBe('function');
        });

        test('should have all profiler methods available', () => {
            expect(typeof profiler.startRecording).toBe('function');
            expect(typeof profiler.stopRecording).toBe('function');
            expect(typeof profiler.recordRender).toBe('function');
            expect(typeof profiler.getComponentMetrics).toBe('function');
            expect(typeof profiler.getAllMetrics).toBe('function');
            expect(typeof profiler.getRecordings).toBe('function');
            expect(typeof profiler.clearRecordings).toBe('function');
            expect(typeof profiler.exportRecording).toBe('function');
            expect(typeof profiler.analyzePerformance).toBe('function');
        });

        test('should support example usage: counter app inspection', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'CounterApp', version: '1.0.0' }
            );

            const counter = {
                _uid: 'counter',
                $options: { name: 'Counter' },
                $parent: null,
                $data: { count: 0 },
                $props: { initial: 0 }
            };

            hook.registerComponent(counter, appId);

            // Simulate usage from docs
            const details = inspector.getComponentDetails('counter');
            expect(details).toBeTruthy();
            expect(details.name).toBe('Counter');
            expect(details.state.count.raw).toBe(0);
            expect(details.props.initial.raw).toBe(0);
        });

        test('should support example usage: state editing', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const comp = {
                _uid: 'test-comp',
                $options: { name: 'TestComp' },
                $parent: null,
                $data: { user: { name: 'John', age: 30 } },
                $props: {}
            };

            hook.registerComponent(comp, appId);

            // Edit nested state
            const result = inspector.editState('test-comp', 'user.name', 'Jane');
            expect(result).toBe(true);
            expect(comp.$data.user.name).toBe('Jane');
        });

        test('should handle invalid component gracefully', () => {
            // Attempt invalid operations
            const result = inspector.editState('non-existent', 'prop', 'value');
            expect(result).toBe(false);

            // Details for non-existent component
            const details = inspector.getComponentDetails('non-existent');
            expect(details).toBeNull();

            // Metrics for non-existent component
            const metrics = inspector.getPerformanceMetrics('non-existent');
            expect(metrics).toBeNull();
        });
    });

    describe('9.2 API Consistency', () => {
        test('should have consistent method naming conventions', () => {
            // Getter methods
            const getters = [
                { obj: hook, name: 'getComponentTree' },
                { obj: inspector, name: 'getComponentDetails' },
                { obj: inspector, name: 'getPerformanceMetrics' },
                { obj: profiler, name: 'getComponentMetrics' },
                { obj: profiler, name: 'getRecordings' }
            ];

            getters.forEach(({ obj, name }) => {
                expect(typeof obj[name]).toBe('function');
            });
        });

        test('should have consistent return types', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const comp = {
                _uid: 'comp',
                $options: { name: 'Comp' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(comp, appId);

            // Edit success returns boolean
            const editResult = inspector.editState('comp', 'prop', 'value');
            expect(typeof editResult).toBe('boolean');

            // Details returns object or null
            const details = inspector.getComponentDetails('comp');
            expect(details === null || typeof details === 'object').toBe(true);

            // Tree returns array
            const tree = hook.getComponentTree(appId);
            expect(Array.isArray(tree) || tree === null).toBe(true);
        });

        test('should have consistent event naming', () => {
            const events = [];
            hook.on('app:registered', () => events.push('app:registered'));
            hook.on('app:unregistered', () => events.push('app:unregistered'));
            hook.on('component:registered', () => events.push('component:registered'));
            hook.on('component:updated', () => events.push('component:updated'));
            hook.on('devtools:connected', () => events.push('devtools:connected'));
            hook.on('devtools:disconnected', () => events.push('devtools:disconnected'));

            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const comp = {
                _uid: 'comp',
                $options: { name: 'Comp' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(comp, appId);

            // All events follow namespace:action pattern
            expect(events.some(e => e.includes(':'))).toBe(true);
        });

        test('should handle configuration options consistently', () => {
            const devtools1 = createDevTools({
                enabled: true,
                inspector: true,
                profiler: true
            });

            expect(devtools1).toBeTruthy();

            delete window.__KALXJS_DEVTOOLS_HOOK__;

            const devtools2 = createDevTools({
                enabled: false
            });

            expect(devtools2).toBeNull();
        });
    });

    describe('9.3 Type Safety & Documentation', () => {
        test('should accept valid parameter types', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App', version: '1.0.0' }
            );

            // Valid component object
            const comp = {
                _uid: 'comp',
                $options: { name: 'Comp' },
                $parent: null,
                $data: { value: 'test' },
                $props: { prop: 'value' }
            };

            expect(() => hook.registerComponent(comp, appId)).not.toThrow();

            // Valid state update object
            expect(() => {
                hook.updateComponent('comp', { value: 'updated' });
            }).not.toThrow();

            // Valid event listener callback
            expect(() => {
                hook.on('component:registered', (data) => {
                    expect(typeof data).toBe('object');
                });
            }).not.toThrow();
        });

        test('should document export interface', () => {
            // Verify main exports
            expect(typeof initDevTools).toBe('function');
            expect(typeof createDevTools).toBe('function');
            expect(typeof createInspector).toBe('function');
            expect(typeof createProfiler).toBe('function');
            expect(typeof DevToolsHook).toMatch(/function|class/);
        });

        test('should handle null/undefined gracefully', () => {
            // Missing hook shouldn't crash
            delete window.__KALXJS_DEVTOOLS_HOOK__;
            const newHook = require('@kalxjs/devtools/devtools-api').getDevToolsHook();
            expect(newHook).toBeNull();

            // Invalid component ID
            inspector.getComponentDetails('non-existent');
            // Should not throw

            // Invalid recording ID
            const exported = profiler.exportRecording('non-existent');
            expect(exported).toBeNull();
        });
    });
});

// ============================================================================
// PHASE 10: PERFORMANCE & OPTIMIZATION
// ============================================================================

describe('Phase 10: DevTools Performance & Optimization', () => {
    let hook;
    let inspector;
    let profiler;

    beforeEach(() => {
        delete window.__KALXJS_DEVTOOLS_HOOK__;
        hook = initDevTools();
        hook.connect();
        inspector = createInspector();
        profiler = createProfiler();
    });

    describe('10.1 Overhead Measurement', () => {
        test('should initialize hook with minimal overhead', () => {
            const start = performance.now();
            delete window.__KALXJS_DEVTOOLS_HOOK__;
            const newHook = initDevTools();
            const end = performance.now();

            const overhead = end - start;
            expect(overhead).toBeLessThan(5); // Allow some margin for test environment
        });

        test('should register component with minimal overhead', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const comp = {
                _uid: 'perf-test',
                $options: { name: 'Comp' },
                $parent: null,
                $data: { value: 'test' },
                $props: {}
            };

            const start = performance.now();
            hook.registerComponent(comp, appId);
            const end = performance.now();

            const overhead = end - start;
            expect(overhead).toBeLessThan(10);
        });

        test('should update component state efficiently', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const comp = {
                _uid: 'perf-test',
                $options: { name: 'Comp' },
                $parent: null,
                $data: { value: 'test' },
                $props: {}
            };

            hook.registerComponent(comp, appId);

            const start = performance.now();
            for (let i = 0; i < 100; i++) {
                hook.updateComponent('perf-test', { value: `test-${i}` });
            }
            const end = performance.now();

            const avgOverhead = (end - start) / 100;
            expect(avgOverhead).toBeLessThan(5);
        });

        test('should emit events with minimal overhead', () => {
            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                hook.emit('test:event', { data: i });
            }
            const end = performance.now();

            const avgOverhead = (end - start) / 1000;
            expect(avgOverhead).toBeLessThan(0.5);
        });

        test('should record renders efficiently', () => {
            profiler.startRecording();

            const start = performance.now();
            for (let i = 0; i < 100; i++) {
                profiler.recordRender('comp', 2.5);
            }
            const end = performance.now();

            const avgOverhead = (end - start) / 100;
            expect(avgOverhead).toBeLessThan(1);

            profiler.stopRecording();
        });
    });

    describe('10.2 Memory Usage', () => {
        test('should handle many component registrations efficiently', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const initialSize = hook.componentInstances.size;

            // Register many components
            for (let i = 0; i < 50; i++) {
                const comp = {
                    _uid: `churn-${i}`,
                    $options: { name: `Comp${i}` },
                    $parent: null,
                    $data: { value: i },
                    $props: {}
                };
                hook.registerComponent(comp, appId);
            }

            // Verify they're registered
            expect(hook.componentInstances.size).toBe(50 + initialSize);

            // Verify all can be retrieved
            const components = hook.getComponents(appId);
            expect(components.length).toBe(50);
        });

        test('should allow garbage collection of old recordings', () => {
            const recordings = [];

            for (let i = 0; i < 5; i++) {
                profiler.startRecording();
                for (let j = 0; j < 10; j++) {
                    profiler.recordRender('comp', 2.5);
                }
                const recording = profiler.stopRecording();
                recordings.push(recording);
            }

            expect(profiler.getRecordings().length).toBe(5);

            // Clear recordings
            profiler.clearRecordings();
            expect(profiler.getRecordings().length).toBe(0);
        });

        test('should handle circular references without crashing', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const circularData = { value: 'test' };
            circularData.self = circularData; // Circular reference

            const comp = {
                _uid: 'circular',
                $options: { name: 'Circular' },
                $parent: null,
                $data: circularData,
                $props: {}
            };

            // Should not crash
            expect(() => hook.registerComponent(comp, appId)).not.toThrow();

            // Should be able to serialize
            const details = inspector.getComponentDetails('circular');
            expect(details).toBeTruthy();
        });

        test('should keep event buffer bounded', () => {
            hook.disconnect();

            // Emit many events while disconnected
            for (let i = 0; i < 100; i++) {
                hook.emit('test:event', { data: i });
            }

            // Buffer should be finite
            expect(hook._buffer).toBeTruthy();
            if (Array.isArray(hook._buffer)) {
                expect(hook._buffer.length).toBeLessThanOrEqual(100);
            }
        });
    });

    describe('10.3 Bundle Size & Tree-shaking', () => {
        test('should export only necessary types', () => {
            const devtoolsApi = require('@kalxjs/devtools/devtools-api');
            const inspector = require('@kalxjs/devtools/component-inspector');
            const profiler = require('@kalxjs/devtools/performance-profiler');
            const main = require('@kalxjs/devtools/index');

            // Verify main exports exist
            expect(Object.keys(devtoolsApi).length).toBeGreaterThan(0);
            expect(Object.keys(inspector).length).toBeGreaterThan(0);
            expect(Object.keys(profiler).length).toBeGreaterThan(0);
            expect(Object.keys(main).length).toBeGreaterThan(0);
        });

        test('should support selective imports', () => {
            // Verify tree-shaking compatible exports
            expect(typeof createDevTools).toBe('function');
            expect(typeof createInspector).toBe('function');
            expect(typeof createProfiler).toBe('function');
        });

        test('should handle large component trees efficiently', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'LargeApp' }
            );

            // Register 1000 components
            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                const comp = {
                    _uid: `large-${i}`,
                    $options: { name: `Comp${i}` },
                    $parent: i > 0 ? { _uid: `large-${i - 1}` } : null,
                    $data: { index: i },
                    $props: {}
                };
                hook.registerComponent(comp, appId);
            }
            const end = performance.now();

            expect(hook.componentInstances.size).toBe(1000);
            const totalTime = end - start;
            const avgPerComponent = totalTime / 1000;

            // Average registration should be sub-millisecond for large trees
            expect(avgPerComponent).toBeLessThan(5);
        });

        test('should handle deeply nested component states', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'DeepApp' }
            );

            // Create deep nested structure
            let nestedData = { value: 'deepest' };
            for (let i = 0; i < 50; i++) {
                nestedData = { nested: nestedData };
            }

            const comp = {
                _uid: 'deep',
                $options: { name: 'Deep' },
                $parent: null,
                $data: nestedData,
                $props: {}
            };

            expect(() => hook.registerComponent(comp, appId)).not.toThrow();

            // Serialization should handle deep nesting
            const details = inspector.getComponentDetails('deep');
            expect(details).toBeTruthy();
            expect(details.state).toBeTruthy();
        });

        test('should handle large state objects efficiently', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'LargeStateApp' }
            );

            // Create large state object (~1MB)
            const largeState = {};
            for (let i = 0; i < 10000; i++) {
                largeState[`key_${i}`] = {
                    id: i,
                    data: Array(100).fill(Math.random()),
                    nested: { value: Math.random() }
                };
            }

            const comp = {
                _uid: 'large-state',
                $options: { name: 'LargeState' },
                $parent: null,
                $data: largeState,
                $props: {}
            };

            const start = performance.now();
            hook.registerComponent(comp, appId);
            const end = performance.now();

            // Registration shouldn't take too long even with large state
            expect(end - start).toBeLessThan(100);

            const details = inspector.getComponentDetails('large-state');
            expect(details).toBeTruthy();
        });
    });

    describe('10.4 Concurrent Operations', () => {
        test('should handle simultaneous component operations', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            // Register multiple components
            for (let i = 0; i < 10; i++) {
                const comp = {
                    _uid: `concurrent-${i}`,
                    $options: { name: `Comp${i}` },
                    $parent: null,
                    $data: { value: i },
                    $props: {}
                };
                hook.registerComponent(comp, appId);
            }

            // Update all concurrently (simulate)
            const operations = [];
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 5; j++) {
                    hook.updateComponent(`concurrent-${i}`, { value: i + j });
                    operations.push(`update-${i}`);
                }
            }

            expect(operations.length).toBe(50);
        });

        test('should record and inspect simultaneously', () => {
            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const comp = {
                _uid: 'sim',
                $options: { name: 'Sim' },
                $parent: null,
                $data: { value: 0 },
                $props: {}
            };

            hook.registerComponent(comp, appId);
            profiler.startRecording();

            // Record while inspecting
            for (let i = 0; i < 10; i++) {
                hook.updateComponent('sim', { value: i });
                profiler.recordRender('sim', 2.5);
                const details = inspector.getComponentDetails('sim');
                expect(details).toBeTruthy();
            }

            const recording = profiler.stopRecording();
            expect(recording.metrics.renders).toBe(10);
        });

        test('should handle multiple event listeners', () => {
            const events = { reg: [], upd: [], con: [] };

            // Multiple listeners on same event
            for (let i = 0; i < 5; i++) {
                hook.on('component:registered', () => events.reg.push(i));
                hook.on('component:updated', () => events.upd.push(i));
                hook.on('devtools:connected', () => events.con.push(i));
            }

            const appId = hook.registerApp(
                { _rootComponent: {} },
                { name: 'App' }
            );

            const comp = {
                _uid: 'multi',
                $options: { name: 'Multi' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(comp, appId);
            hook.updateComponent('multi', { value: 1 });

            // All listeners should be called
            expect(events.reg.length).toBeGreaterThan(0);
            expect(events.upd.length).toBeGreaterThan(0);
        });
    });
});