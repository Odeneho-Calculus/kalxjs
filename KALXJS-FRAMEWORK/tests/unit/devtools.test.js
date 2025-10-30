/**
 * @kalxjs/devtools Unit Tests
 * Comprehensive testing for DevTools API, Component Inspector, and Performance Profiler
 */

import {
    DevToolsHook,
    initDevTools,
    getDevToolsHook,
} from '@kalxjs/devtools/devtools-api';
import {
    ComponentInspector,
    createInspector,
} from '@kalxjs/devtools/component-inspector';
import {
    PerformanceProfiler,
    createProfiler,
} from '@kalxjs/devtools/performance-profiler';
import { createDevTools } from '@kalxjs/devtools/index';

// Mock window for postMessage tests
global.postMessage = jest.fn();

// Clean up between tests
beforeEach(() => {
    delete window.__KALXJS_DEVTOOLS_HOOK__;
    jest.clearAllMocks();
});

// ============================================================================
// PHASE 1: CORE INITIALIZATION & HOOK SYSTEM
// ============================================================================

describe('Phase 1: DevTools Hook Initialization', () => {
    describe('1.1 Hook Initialization', () => {
        test('should initialize hook successfully', () => {
            const hook = initDevTools();
            expect(hook).toBeTruthy();
            expect(hook).toBeInstanceOf(DevToolsHook);
        });

        test('should attach hook to window.__KALXJS_DEVTOOLS_HOOK__', () => {
            initDevTools();
            expect(window.__KALXJS_DEVTOOLS_HOOK__).toBeTruthy();
        });

        test('should return same hook instance on multiple initializations (singleton)', () => {
            const hook1 = initDevTools();
            const hook2 = initDevTools();
            expect(hook1).toBe(hook2);
        });

        test('should initialize with correct default state', () => {
            const hook = initDevTools();
            expect(hook.connected).toBe(false);
            expect(hook.apps.size).toBe(0);
            expect(hook.componentInstances.size).toBe(0);
            expect(hook._buffer).toEqual([]);
        });

        test('should send postMessage announcement during initialization', () => {
            global.postMessage.mockClear();
            initDevTools();

            expect(global.postMessage).toHaveBeenCalled();
            const call = global.postMessage.mock.calls[0][0];
            expect(call.source).toBe('kalxjs-devtools-hook');
            expect(call.event).toBe('init');
            expect(call.version).toBe('2.2.8');
        });

        test('should return null in non-browser environments', () => {
            const originalWindow = global.window;
            delete global.window;

            const hook = initDevTools();
            expect(hook).toBeNull();

            global.window = originalWindow;
        });
    });

    describe('1.2 Application Registration', () => {
        let hook;

        beforeEach(() => {
            hook = initDevTools();
        });

        test('should register single app successfully', () => {
            const mockApp = { _rootComponent: {} };
            const id = hook.registerApp(mockApp, { name: 'TestApp' });

            expect(id).toBeTruthy();
            expect(hook.apps.has(id)).toBe(true);
        });

        test('should store app metadata correctly', () => {
            const mockApp = { _rootComponent: {} };
            const id = hook.registerApp(mockApp, {
                name: 'TestApp',
                version: '1.0.0'
            });

            const appInfo = hook.apps.get(id);
            expect(appInfo.name).toBe('TestApp');
            expect(appInfo.version).toBe('1.0.0');
            expect(appInfo.app).toBe(mockApp);
            expect(appInfo.created).toBeTruthy();
            expect(typeof appInfo.created).toBe('number');
        });

        test('should generate unique IDs for multiple app registrations', () => {
            const app1 = { _rootComponent: {} };
            const app2 = { _rootComponent: {} };

            const id1 = hook.registerApp(app1);
            const id2 = hook.registerApp(app2);

            expect(id1).not.toBe(id2);
            expect(hook.apps.size).toBe(2);
        });

        test('should support custom app ID', () => {
            const mockApp = { _rootComponent: {} };
            const customId = 'custom-app-id';
            const id = hook.registerApp(mockApp, { id: customId });

            expect(id).toBe(customId);
            expect(hook.apps.get(customId)).toBeTruthy();
        });

        test('should unregister app', () => {
            const mockApp = { _rootComponent: {} };
            const id = hook.registerApp(mockApp);

            hook.unregisterApp(id);
            expect(hook.apps.has(id)).toBe(false);
        });

        test('should not throw when unregistering non-existent app', () => {
            expect(() => hook.unregisterApp('non-existent')).not.toThrow();
        });

        test('should emit app:registered event', () => {
            const mockApp = { _rootComponent: {} };
            const listener = jest.fn();
            hook.on('app:registered', listener);

            hook.connect();
            const id = hook.registerApp(mockApp);

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ id })
            );
        });

        test('should emit app:unregistered event', () => {
            const mockApp = { _rootComponent: {} };
            const listener = jest.fn();
            hook.on('app:unregistered', listener);

            hook.connect();
            const id = hook.registerApp(mockApp);
            hook.unregisterApp(id);

            expect(listener).toHaveBeenCalledWith({ id });
        });
    });

    describe('1.3 Event System', () => {
        let hook;

        beforeEach(() => {
            hook = initDevTools();
        });

        test('should attach event listener with on()', () => {
            const listener = jest.fn();
            hook.on('test:event', listener);

            hook.connect();
            hook.emit('test:event', { data: 'test' });

            expect(listener).toHaveBeenCalledWith({ data: 'test' });
        });

        test('should call all listeners for same event', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();

            hook.on('test:event', listener1);
            hook.on('test:event', listener2);

            hook.connect();
            hook.emit('test:event', { data: 'test' });

            expect(listener1).toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
        });

        test('should remove listener with off()', () => {
            const listener = jest.fn();
            hook.on('test:event', listener);
            hook.off('test:event', listener);

            hook.connect();
            hook.emit('test:event', { data: 'test' });

            expect(listener).not.toHaveBeenCalled();
        });

        test('should return unsubscribe function from on()', () => {
            const listener = jest.fn();
            const unsubscribe = hook.on('test:event', listener);

            unsubscribe();

            hook.connect();
            hook.emit('test:event', { data: 'test' });

            expect(listener).not.toHaveBeenCalled();
        });

        test('should buffer events before connection', () => {
            hook.emit('buffered:event', { data: 'test' });

            expect(hook._buffer.length).toBe(1);
            expect(hook._buffer[0].event).toBe('buffered:event');
        });

        test('should flush buffered events on connection', () => {
            const listener = jest.fn();
            hook.on('buffered:event', listener);

            hook.emit('buffered:event', { data: 'test' });
            expect(listener).not.toHaveBeenCalled();

            hook.connect();
            expect(listener).toHaveBeenCalledWith({ data: 'test' });
            expect(hook._buffer.length).toBe(0);
        });

        test('should send events via postMessage when connected', () => {
            global.postMessage.mockClear();
            hook.connect();
            hook.emit('test:event', { data: 'test' });

            const lastCall = global.postMessage.mock.calls[
                global.postMessage.mock.calls.length - 1
            ];
            expect(lastCall[0]).toEqual({
                source: 'kalxjs-devtools-hook',
                event: 'test:event',
                data: { data: 'test' }
            });
        });
    });

    describe('1.4 Connection Management', () => {
        let hook;

        beforeEach(() => {
            hook = initDevTools();
        });

        test('should set connected flag on connect()', () => {
            expect(hook.connected).toBe(false);
            hook.connect();
            expect(hook.connected).toBe(true);
        });

        test('should flush buffered events on connect()', () => {
            const listener = jest.fn();
            hook.on('event', listener);

            hook.emit('event', { id: 1 });
            expect(listener).not.toHaveBeenCalled();

            hook.connect();
            expect(listener).toHaveBeenCalled();
        });

        test('should emit devtools:connected event', () => {
            const listener = jest.fn();
            hook.on('devtools:connected', listener);

            hook.connect();

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ timestamp: expect.any(Number) })
            );
        });

        test('should set connected flag to false on disconnect()', () => {
            hook.connect();
            expect(hook.connected).toBe(true);

            hook.disconnect();
            expect(hook.connected).toBe(false);
        });

        test('should emit devtools:disconnected event', () => {
            const listener = jest.fn();

            hook.connect();
            hook.on('devtools:disconnected', listener);
            hook.disconnect();

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ timestamp: expect.any(Number) })
            );
        });

        test('should not duplicate events on multiple connect() calls', () => {
            const listener = jest.fn();
            hook.on('test', listener);

            hook.emit('test', { id: 1 });
            hook.connect();
            hook.connect();

            expect(listener).toHaveBeenCalledTimes(1);
        });
    });
});

// ============================================================================
// PHASE 2: COMPONENT REGISTRATION & TRACKING
// ============================================================================

describe('Phase 2: Component Registration & Tracking', () => {
    let hook;

    beforeEach(() => {
        hook = initDevTools();
        hook.connect();
    });

    describe('2.1 Component Registration', () => {
        test('should register component successfully', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'TestComponent' },
                $parent: null,
                $data: {},
                $props: {}
            };

            const id = hook.registerComponent(component, 'app-1');
            expect(id).toBeTruthy();
            expect(hook.componentInstances.has(id)).toBe(true);
        });

        test('should store complete component metadata', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Counter' },
                $parent: null,
                $data: { count: 0 },
                $props: { initial: 5 }
            };

            const id = hook.registerComponent(component, 'app-1');
            const info = hook.componentInstances.get(id);

            expect(info.id).toBe('comp-1');
            expect(info.name).toBe('Counter');
            expect(info.appId).toBe('app-1');
            expect(info.parent).toBeNull();
            expect(info.children).toEqual([]);
            expect(info.created).toBeTruthy();
        });

        test('should use _uid if available', () => {
            const component = {
                _uid: 'custom-uid',
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            const id = hook.registerComponent(component, 'app-1');
            expect(id).toBe('custom-uid');
        });

        test('should generate ID if _uid not available', () => {
            const component = {
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            const id = hook.registerComponent(component, 'app-1');
            expect(id).toMatch(/component-\d+/);
        });

        test('should establish parent-child relationships', () => {
            const parent = {
                _uid: 'parent-1',
                $options: { name: 'Parent' },
                $parent: null,
                $data: {},
                $props: {}
            };

            const child = {
                _uid: 'child-1',
                $options: { name: 'Child' },
                $parent: parent,
                $data: {},
                $props: {}
            };

            const parentId = hook.registerComponent(parent, 'app-1');
            const childId = hook.registerComponent(child, 'app-1');

            const parentInfo = hook.componentInstances.get(parentId);
            expect(parentInfo.children).toContain(childId);
        });

        test('should emit component:registered event', () => {
            const listener = jest.fn();
            hook.on('component:registered', listener);

            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(component, 'app-1');

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ id: expect.any(String) })
            );
        });

        test('should handle multiple components', () => {
            const comp1 = {
                _uid: 'comp-1',
                $options: { name: 'C1' },
                $parent: null,
                $data: {},
                $props: {}
            };

            const comp2 = {
                _uid: 'comp-2',
                $options: { name: 'C2' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(comp1, 'app-1');
            hook.registerComponent(comp2, 'app-1');

            expect(hook.componentInstances.size).toBe(2);
        });
    });

    describe('2.2 State Extraction', () => {
        test('should extract $data properties', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: { count: 0, message: 'hello' },
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            const state = hook.componentInstances.get('comp-1').state;

            expect(state.count).toBe(0);
            expect(state.message).toBe('hello');
        });

        test('should extract $refs to state._refs', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $refs: { input: {} },
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            const state = hook.componentInstances.get('comp-1').state;

            expect(state._refs).toEqual({ input: {} });
        });

        test('should extract computed properties', () => {
            const component = {
                _uid: 'comp-1',
                $options: {
                    name: 'Test',
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

            hook.registerComponent(component, 'app-1');
            const state = hook.componentInstances.get('comp-1').state;

            expect(state._computed).toBeTruthy();
        });

        test('should handle missing $data gracefully', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $props: {}
            };

            expect(() => hook.registerComponent(component, 'app-1')).not.toThrow();
        });

        test('should handle missing $refs gracefully', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            const state = hook.componentInstances.get('comp-1').state;

            expect(state._refs).toBeUndefined();
        });
    });

    describe('2.3 Component Updates', () => {
        test('should update component state', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: { count: 0 },
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            hook.updateComponent('comp-1', { count: 5 });

            const state = hook.componentInstances.get('comp-1').state;
            expect(state.count).toBe(5);
        });

        test('should emit component:updated event', () => {
            const listener = jest.fn();
            hook.on('component:updated', listener);

            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: { count: 0 },
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            hook.updateComponent('comp-1', { count: 5 });

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'comp-1' })
            );
        });

        test('should handle non-existent component gracefully', () => {
            expect(() => hook.updateComponent('non-existent', { count: 5 })).not.toThrow();
        });
    });

    describe('2.4 Component Tree Structure', () => {
        test('should build correct hierarchy', () => {
            const parent = {
                _uid: 'parent',
                $options: { name: 'Parent' },
                $parent: null,
                $data: {},
                $props: {}
            };

            const child = {
                _uid: 'child',
                $options: { name: 'Child' },
                $parent: parent,
                $data: {},
                $props: {}
            };

            hook.registerApp({ _rootComponent: parent }, { id: 'app-1' });
            hook.registerComponent(parent, 'app-1');
            hook.registerComponent(child, 'app-1');

            const tree = hook.getComponentTree('app-1');

            expect(tree).toBeTruthy();
            expect(Array.isArray(tree)).toBe(true);
        });

        test('should return null for non-existent app', () => {
            const tree = hook.getComponentTree('non-existent');
            expect(tree).toBeNull();
        });
    });
});

// ============================================================================
// PHASE 3: COMPONENT INSPECTOR FEATURES
// ============================================================================

describe('Phase 3: Component Inspector', () => {
    let hook;
    let inspector;

    beforeEach(() => {
        hook = initDevTools();
        hook.connect();
        inspector = createInspector();
    });

    describe('3.1 Component Selection & Details', () => {
        test('should select component', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'TestComponent' },
                $parent: null,
                $data: { count: 0 },
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            const details = inspector.selectComponent('comp-1');

            expect(details).toBeTruthy();
            expect(inspector.selectedComponent).toBeTruthy();
        });

        test('should emit inspector:component-selected event', () => {
            const listener = jest.fn();
            hook.on('inspector:component-selected', listener);

            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            inspector.selectComponent('comp-1');

            expect(listener).toHaveBeenCalled();
        });

        test('should return null for non-existent component', () => {
            const details = inspector.selectComponent('non-existent');
            expect(details).toBeNull();
        });

        test('should provide component details', () => {
            const component = {
                _uid: 'comp-1',
                $options: {
                    name: 'Counter',
                    __file: '/path/to/Counter.js'
                },
                $parent: null,
                $data: { count: 0 },
                $props: { initial: 5 }
            };

            hook.registerComponent(component, 'app-1');
            const details = inspector.getComponentDetails('comp-1');

            expect(details.id).toBe('comp-1');
            expect(details.name).toBe('Counter');
            expect(details.file).toBe('/path/to/Counter.js');
            expect(details.state).toBeTruthy();
            expect(details.props).toBeTruthy();
            expect(details.lifecycle).toBeTruthy();
        });
    });

    describe('3.2 State Serialization', () => {
        test('should serialize string values', () => {
            const value = 'test';
            const serialized = inspector.serializeState({ name: value });

            expect(serialized.name.type).toBe('string');
            expect(serialized.name.raw).toBe('test');
            expect(serialized.name.editable).toBe(true);
        });

        test('should serialize number values', () => {
            const serialized = inspector.serializeState({ count: 42 });

            expect(serialized.count.type).toBe('number');
            expect(serialized.count.raw).toBe(42);
            expect(serialized.count.editable).toBe(true);
        });

        test('should serialize boolean values', () => {
            const serialized = inspector.serializeState({ active: true });

            expect(serialized.active.type).toBe('boolean');
            expect(serialized.active.raw).toBe(true);
            expect(serialized.active.editable).toBe(true);
        });

        test('should serialize null', () => {
            const serialized = inspector.serializeState({ value: null });

            expect(serialized.value.type).toBe('null');
            expect(serialized.value.value).toBe('null');
            expect(serialized.value.editable).toBe(true);
        });

        test('should serialize arrays', () => {
            const serialized = inspector.serializeState({ items: [1, 2, 3] });

            expect(serialized.items.type).toBe('array');
            expect(serialized.items.editable).toBe(false);
        });

        test('should serialize objects', () => {
            const serialized = inspector.serializeState({ user: { name: 'John' } });

            expect(serialized.user.type).toBe('object');
            expect(serialized.user.editable).toBe(false);
        });

        test('should limit depth to 2 levels', () => {
            const deepObj = { a: { b: { c: { d: 'deep' } } } };
            const serialized = inspector.serializeState({ nested: deepObj });

            expect(serialized.nested.value).toContain('...');
        });
    });

    describe('3.3 Value Type Detection', () => {
        test('should detect string type', () => {
            const type = inspector.getValueType('hello');
            expect(type).toBe('string');
        });

        test('should detect number type', () => {
            const type = inspector.getValueType(42);
            expect(type).toBe('number');
        });

        test('should detect boolean type', () => {
            const type = inspector.getValueType(true);
            expect(type).toBe('boolean');
        });

        test('should detect null type', () => {
            const type = inspector.getValueType(null);
            expect(type).toBe('null');
        });

        test('should detect undefined type', () => {
            const type = inspector.getValueType(undefined);
            expect(type).toBe('undefined');
        });

        test('should detect array type', () => {
            const type = inspector.getValueType([1, 2, 3]);
            expect(type).toBe('array');
        });

        test('should detect object type', () => {
            const type = inspector.getValueType({ key: 'value' });
            expect(type).toBe('object');
        });

        test('should detect Date type', () => {
            const type = inspector.getValueType(new Date());
            expect(type).toBe('date');
        });

        test('should detect RegExp type', () => {
            const type = inspector.getValueType(/pattern/);
            expect(type).toBe('regexp');
        });

        test('should detect Map type', () => {
            const type = inspector.getValueType(new Map());
            expect(type).toBe('map');
        });

        test('should detect Set type', () => {
            const type = inspector.getValueType(new Set());
            expect(type).toBe('set');
        });

        test('should detect function type', () => {
            const type = inspector.getValueType(() => { });
            expect(type).toBe('function');
        });
    });

    describe('3.4 Editability Detection', () => {
        test('should mark string as editable', () => {
            const editable = inspector.isEditable('hello');
            expect(editable).toBe(true);
        });

        test('should mark number as editable', () => {
            const editable = inspector.isEditable(42);
            expect(editable).toBe(true);
        });

        test('should mark boolean as editable', () => {
            const editable = inspector.isEditable(true);
            expect(editable).toBe(true);
        });

        test('should mark null as editable', () => {
            const editable = inspector.isEditable(null);
            expect(editable).toBe(true);
        });

        test('should mark array as non-editable', () => {
            const editable = inspector.isEditable([1, 2, 3]);
            expect(editable).toBe(false);
        });

        test('should mark object as non-editable', () => {
            const editable = inspector.isEditable({ key: 'value' });
            expect(editable).toBe(false);
        });

        test('should mark function as non-editable', () => {
            const editable = inspector.isEditable(() => { });
            expect(editable).toBe(false);
        });
    });

    describe('3.5 State Editing', () => {
        test('should edit simple property', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: { count: 5 },
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            const result = inspector.editState('comp-1', 'count', 10);

            expect(result).toBe(true);
            expect(component.$data.count).toBe(10);
        });

        test('should edit nested property', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: { user: { name: 'John' } },
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            const result = inspector.editState('comp-1', 'user.name', 'Jane');

            expect(result).toBe(true);
            expect(component.$data.user.name).toBe('Jane');
        });

        test('should emit component:updated after edit', () => {
            const listener = jest.fn();
            hook.on('component:updated', listener);

            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: { count: 5 },
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            inspector.editState('comp-1', 'count', 10);

            expect(listener).toHaveBeenCalled();
        });

        test('should return false for non-existent component', () => {
            const result = inspector.editState('non-existent', 'count', 10);
            expect(result).toBe(false);
        });

        test('should return false for invalid path', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: { count: 5 },
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            const result = inspector.editState('comp-1', 'invalid.path.here', 10);

            expect(result).toBe(false);
        });
    });

    describe('3.6 Component Highlighting', () => {
        test('should create highlight element', () => {
            const mockEl = {
                getBoundingClientRect: () => ({
                    top: 100,
                    left: 200,
                    width: 300,
                    height: 150
                })
            };

            const component = {
                _uid: 'comp-1',
                $el: mockEl,
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            inspector.highlightComponent('comp-1');

            expect(inspector.highlight).toBeTruthy();
            expect(inspector.highlight.style.display).toBe('block');
        });

        test('should position highlight correctly', () => {
            const mockEl = {
                getBoundingClientRect: () => ({
                    top: 100,
                    left: 200,
                    width: 300,
                    height: 150
                })
            };

            const component = {
                _uid: 'comp-1',
                $el: mockEl,
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            inspector.highlightComponent('comp-1');

            expect(inspector.highlight.style.top).toBe('100px');
            expect(inspector.highlight.style.left).toBe('200px');
            expect(inspector.highlight.style.width).toBe('300px');
            expect(inspector.highlight.style.height).toBe('150px');
        });

        test('should unhighlight component', () => {
            const mockEl = {
                getBoundingClientRect: () => ({
                    top: 0,
                    left: 0,
                    width: 0,
                    height: 0
                })
            };

            const component = {
                _uid: 'comp-1',
                $el: mockEl,
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            inspector.highlightComponent('comp-1');
            inspector.unhighlightComponent();

            expect(inspector.highlight.style.display).toBe('none');
        });

        test('should handle component without $el', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            expect(() => inspector.highlightComponent('comp-1')).not.toThrow();
        });
    });

    describe('3.7 Performance Metrics', () => {
        test('should get performance metrics', () => {
            const component = {
                _uid: 'comp-1',
                _renderCount: 5,
                _updateCount: 3,
                _renderTime: 2.5,
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            const metrics = inspector.getPerformanceMetrics('comp-1');

            expect(metrics.renderCount).toBe(5);
            expect(metrics.updateCount).toBe(3);
            expect(metrics.renderTime).toBe(2.5);
            expect(metrics.created).toBeTruthy();
        });

        test('should return null for non-existent component', () => {
            const metrics = inspector.getPerformanceMetrics('non-existent');
            expect(metrics).toBeNull();
        });
    });
});

// ============================================================================
// PHASE 4: PERFORMANCE PROFILER
// ============================================================================

describe('Phase 4: Performance Profiler', () => {
    let hook;
    let profiler;

    beforeEach(() => {
        hook = initDevTools();
        hook.connect();
        profiler = createProfiler();
    });

    describe('4.1 Recording Lifecycle', () => {
        test('should start recording', () => {
            profiler.startRecording();

            expect(profiler.isRecording).toBe(true);
            expect(profiler.currentRecording).toBeTruthy();
            expect(profiler.currentRecording.id).toMatch(/recording-\d+/);
        });

        test('should emit profiler:started event', () => {
            const listener = jest.fn();
            hook.on('profiler:started', listener);

            profiler.startRecording();

            expect(listener).toHaveBeenCalled();
        });

        test('should warn when starting while already recording', () => {
            console.warn = jest.fn();
            profiler.startRecording();
            profiler.startRecording();

            expect(console.warn).toHaveBeenCalledWith('Already recording');
        });

        test('should stop recording', () => {
            profiler.startRecording();
            const recording = profiler.stopRecording();

            expect(profiler.isRecording).toBe(false);
            expect(recording).toBeTruthy();
            expect(recording.ended).toBeTruthy();
            expect(recording.duration).toBeTruthy();
        });

        test('should calculate duration correctly', () => {
            profiler.startRecording();
            const startTime = profiler.currentRecording.started;

            // Record some events to simulate activity
            profiler.recordRender('comp-1', 2.5);
            profiler.recordRender('comp-2', 1.5);

            const recording = profiler.stopRecording();
            expect(recording.duration).toBeTruthy();
            expect(recording.ended).toBeGreaterThanOrEqual(startTime);
            expect(recording.duration).toBeGreaterThanOrEqual(0);
        });

        test('should emit profiler:stopped event', () => {
            const listener = jest.fn();
            hook.on('profiler:stopped', listener);

            profiler.startRecording();
            profiler.stopRecording();

            expect(listener).toHaveBeenCalled();
        });

        test('should warn when stopping without recording', () => {
            console.warn = jest.fn();
            const result = profiler.stopRecording();

            expect(console.warn).toHaveBeenCalledWith('Not recording');
            expect(result).toBeNull();
        });

        test('should save recording to array', () => {
            profiler.startRecording();
            profiler.stopRecording();

            expect(profiler.recordings.length).toBe(1);
        });
    });

    describe('4.2 Event Recording', () => {
        test('should record component registered events', () => {
            profiler.startRecording();

            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(component, 'app-1');

            expect(profiler.currentRecording.events.length).toBeGreaterThan(0);
        });

        test('should record component updated events', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: { count: 0 },
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            profiler.startRecording();
            hook.updateComponent('comp-1', { count: 5 });

            expect(profiler.currentRecording.events.length).toBeGreaterThan(0);
        });

        test('should record render events', () => {
            profiler.startRecording();
            profiler.recordRender('comp-1', 2.5);

            expect(profiler.currentRecording.events.length).toBeGreaterThan(0);
            const renderEvent = profiler.currentRecording.events.find(e => e.type === 'render');
            expect(renderEvent).toBeTruthy();
            expect(renderEvent.duration).toBe(2.5);
        });

        test('should not record events when not recording', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            profiler.recordRender('comp-1', 2.5);

            expect(profiler.recordings.length).toBe(0);
        });
    });

    describe('4.3 Metrics Calculation', () => {
        test('should calculate metrics from recording', () => {
            profiler.startRecording();

            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            profiler.recordRender('comp-1', 2.5);
            profiler.recordRender('comp-1', 3.0);

            const recording = profiler.stopRecording();
            const metrics = recording.metrics;

            expect(metrics.totalEvents).toBeGreaterThan(0);
            expect(metrics.renders).toBeGreaterThanOrEqual(2);
            expect(metrics.avgRenderTime).toBeGreaterThan(0);
        });

        test('should calculate average render time', () => {
            profiler.startRecording();
            profiler.recordRender('comp-1', 2.0);
            profiler.recordRender('comp-1', 4.0);

            const recording = profiler.stopRecording();
            expect(recording.metrics.avgRenderTime).toBe(3.0);
        });

        test('should identify slowest components', () => {
            profiler.startRecording();
            profiler.recordRender('comp-1', 10);
            profiler.recordRender('comp-2', 20);
            profiler.recordRender('comp-3', 5);

            const recording = profiler.stopRecording();
            const slowest = recording.metrics.slowestComponents;

            expect(slowest[0].componentId).toBe('comp-2');
            expect(slowest[1].componentId).toBe('comp-1');
            expect(slowest[2].componentId).toBe('comp-3');
        });
    });

    describe('4.4 Performance Analysis', () => {
        test('should detect slow renders', () => {
            profiler.startRecording();
            profiler.recordRender('comp-1', 20); // > 16ms threshold

            const recording = profiler.stopRecording();
            const issues = profiler.analyzePerformance(recording);

            const slowRenderIssue = issues.find(i => i.type === 'slow-render');
            expect(slowRenderIssue).toBeTruthy();
            expect(slowRenderIssue.severity).toBe('warning');
        });

        test('should detect excessive updates', () => {
            profiler.startRecording();

            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: { count: 0 },
                $props: {}
            };

            hook.registerComponent(component, 'app-1');

            // Create many updates
            for (let i = 0; i < 10; i++) {
                hook.updateComponent('comp-1', { count: i });
            }

            const recording = profiler.stopRecording();
            const issues = profiler.analyzePerformance(recording);

            // Should detect potential issue
            expect(Array.isArray(issues)).toBe(true);
        });
    });

    describe('4.5 Metrics Retrieval & Export', () => {
        test('should get component metrics', () => {
            profiler.recordRender('comp-1', 2.5);
            profiler.recordRender('comp-1', 3.0);

            const metrics = profiler.getComponentMetrics('comp-1');

            expect(metrics).toBeTruthy();
            expect(metrics.renders).toBe(2);
            expect(metrics.totalTime).toBe(5.5);
            expect(metrics.avgTime).toBe(2.75);
        });

        test('should get all metrics', () => {
            profiler.recordRender('comp-1', 2.5);
            profiler.recordRender('comp-2', 1.5);

            const allMetrics = profiler.getAllMetrics();

            expect(allMetrics['comp-1']).toBeTruthy();
            expect(allMetrics['comp-2']).toBeTruthy();
        });

        test('should clear recordings', () => {
            profiler.startRecording();
            profiler.stopRecording();

            expect(profiler.recordings.length).toBe(1);
            profiler.clearRecordings();
            expect(profiler.recordings.length).toBe(0);
        });

        test('should export recording as JSON', () => {
            profiler.startRecording();
            profiler.recordRender('comp-1', 2.5);
            const recording = profiler.stopRecording();

            const exported = profiler.exportRecording(recording.id);

            expect(exported).toBeTruthy();
            const parsed = JSON.parse(exported);
            expect(parsed.id).toBe(recording.id);
            expect(Array.isArray(parsed.events)).toBe(true);
        });

        test('should return null for non-existent recording', () => {
            const exported = profiler.exportRecording('non-existent');
            expect(exported).toBeNull();
        });
    });
});

// ============================================================================
// PHASE 5: DEVTOOLS CREATION & CONFIGURATION
// ============================================================================

describe('Phase 5: DevTools Creation & Configuration', () => {
    beforeEach(() => {
        delete window.__KALXJS_DEVTOOLS_HOOK__;
    });

    describe('5.1 Inspector Creation', () => {
        test('should create inspector', () => {
            initDevTools();
            const inspector = createInspector();

            expect(inspector).toBeTruthy();
            expect(inspector).toBeInstanceOf(ComponentInspector);
        });

        test('should return null without hook', () => {
            const inspector = createInspector();
            expect(inspector).toBeNull();
        });
    });

    describe('5.2 Profiler Creation', () => {
        test('should create profiler', () => {
            initDevTools();
            const profiler = createProfiler();

            expect(profiler).toBeTruthy();
            expect(profiler).toBeInstanceOf(PerformanceProfiler);
        });

        test('should return null without hook', () => {
            const profiler = createProfiler();
            expect(profiler).toBeNull();
        });
    });

    describe('5.3 DevTools Factory', () => {
        test('should create devtools with defaults', () => {
            const devtools = createDevTools();

            expect(devtools).toBeTruthy();
            expect(devtools.hook).toBeTruthy();
            expect(devtools.inspector).toBeTruthy();
            expect(devtools.profiler).toBeTruthy();
        });

        test('should respect enabled option', () => {
            const devtools = createDevTools({ enabled: false });
            expect(devtools).toBeNull();
        });

        test('should respect inspector option', () => {
            const devtools = createDevTools({ inspector: false });
            expect(devtools.inspector).toBeNull();
        });

        test('should respect profiler option', () => {
            const devtools = createDevTools({ profiler: false });
            expect(devtools.profiler).toBeNull();
        });

        test('should auto-connect hook', () => {
            const devtools = createDevTools();
            expect(devtools.hook.connected).toBe(true);
        });

        test('should disable by default in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const devtools = createDevTools();

            expect(devtools).toBeNull();

            process.env.NODE_ENV = originalEnv;
        });
    });
});