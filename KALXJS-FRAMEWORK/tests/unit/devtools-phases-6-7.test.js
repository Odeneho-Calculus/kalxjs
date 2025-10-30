/**
 * @kalxjs/devtools Phase 6 & 7 Tests
 * Extension Integration & Communication, Edge Cases & Error Handling
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

// Mock postMessage for browser communication
global.postMessage = jest.fn();

// Clean up between tests
beforeEach(() => {
    delete window.__KALXJS_DEVTOOLS_HOOK__;
    jest.clearAllMocks();
    global.postMessage.mockClear();
});

// ============================================================================
// PHASE 6: EXTENSION INTEGRATION & COMMUNICATION
// ============================================================================

describe('Phase 6: Extension Integration & Communication', () => {
    describe('6.1 Hook Announcement', () => {
        test('should send postMessage announcement on initialization', () => {
            global.postMessage.mockClear();
            const hook = initDevTools();

            expect(global.postMessage).toHaveBeenCalled();
            const announcement = global.postMessage.mock.calls[0][0];

            expect(announcement).toHaveProperty('source', 'kalxjs-devtools-hook');
            expect(announcement).toHaveProperty('event', 'init');
        });

        test('announcement should include framework version', () => {
            global.postMessage.mockClear();
            initDevTools();

            const announcement = global.postMessage.mock.calls[0][0];
            expect(announcement.version).toBe('2.2.8');
        });

        test('announcement should have source identifier for extension detection', () => {
            global.postMessage.mockClear();
            const hook = initDevTools();

            const announcement = global.postMessage.mock.calls[0][0];
            expect(announcement.source).toBe('kalxjs-devtools-hook');
        });

        test('should include init event in announcement', () => {
            global.postMessage.mockClear();
            initDevTools();

            const announcement = global.postMessage.mock.calls[0][0];
            expect(announcement.event).toBe('init');
        });

        test('announcement should allow extension to detect framework presence', () => {
            global.postMessage.mockClear();
            initDevTools();

            const announcement = global.postMessage.mock.calls[0][0];
            // Extension can check: message.source === 'kalxjs-devtools-hook' && message.event === 'init'
            const extensionCanDetect =
                announcement.source === 'kalxjs-devtools-hook' &&
                announcement.event === 'init';

            expect(extensionCanDetect).toBe(true);
        });
    });

    describe('6.2 Event Communication', () => {
        let hook;

        beforeEach(() => {
            hook = initDevTools();
            hook.connect();
            global.postMessage.mockClear();
        });

        test('should broadcast events via postMessage when connected', () => {
            hook.emit('test:event', { data: 'test' });

            expect(global.postMessage).toHaveBeenCalled();
            const call = global.postMessage.mock.calls[0][0];
            expect(call.source).toBe('kalxjs-devtools-hook');
            expect(call.event).toBe('test:event');
        });

        test('event messages should include source identifier', () => {
            hook.emit('component:registered', { id: 'comp-1' });

            const call = global.postMessage.mock.calls[0][0];
            expect(call.source).toBe('kalxjs-devtools-hook');
        });

        test('event messages should include event name', () => {
            const eventName = 'component:updated';
            hook.emit(eventName, { id: 'comp-1', state: {} });

            const call = global.postMessage.mock.calls[0][0];
            expect(call.event).toBe(eventName);
        });

        test('event messages should include data payload', () => {
            const payload = { id: 'comp-1', name: 'TestComponent' };
            hook.emit('component:registered', payload);

            const call = global.postMessage.mock.calls[0][0];
            expect(call.data).toEqual(payload);
        });

        test('extension should receive and process events correctly', () => {
            global.postMessage.mockClear();

            // Simulate event emission
            const mockEvents = [];
            global.postMessage.mockImplementation((msg) => {
                if (msg.source === 'kalxjs-devtools-hook') {
                    mockEvents.push(msg);
                }
            });

            hook.emit('app:registered', { id: 'app-1' });
            hook.emit('component:registered', { id: 'comp-1' });

            expect(mockEvents.length).toBe(2);
            expect(mockEvents[0].event).toBe('app:registered');
            expect(mockEvents[1].event).toBe('component:registered');
        });
    });

    describe('6.3 Hook Query', () => {
        test('should return hook via getDevToolsHook when initialized', () => {
            initDevTools();
            const hook = getDevToolsHook();

            expect(hook).toBeTruthy();
            expect(hook).toBeInstanceOf(DevToolsHook);
        });

        test('should return null via getDevToolsHook in non-browser environment', () => {
            const originalWindow = global.window;
            delete global.window;

            const hook = getDevToolsHook();
            expect(hook).toBeNull();

            global.window = originalWindow;
        });

        test('should return null via getDevToolsHook if not initialized', () => {
            // Ensure no hook is initialized
            if (window.__KALXJS_DEVTOOLS_HOOK__) {
                delete window.__KALXJS_DEVTOOLS_HOOK__;
            }
            const hook = getDevToolsHook();
            expect(hook).toBeNull();
        });

        test('hook should be globally accessible via window object', () => {
            const hook = initDevTools();

            expect(window.__KALXJS_DEVTOOLS_HOOK__).toBe(hook);
            expect(window.__KALXJS_DEVTOOLS_HOOK__).toBeInstanceOf(DevToolsHook);
        });

        test('should return same hook instance on multiple queries', () => {
            initDevTools();
            const hook1 = getDevToolsHook();
            const hook2 = getDevToolsHook();

            expect(hook1).toBe(hook2);
        });
    });
});

// ============================================================================
// PHASE 7: EDGE CASES & ERROR HANDLING
// ============================================================================

describe('Phase 7: Edge Cases & Error Handling', () => {
    describe('7.1 Null/Undefined Handling', () => {
        let hook;
        let inspector;

        beforeEach(() => {
            hook = initDevTools();
            hook.registerApp({}, { name: 'TestApp' });
            inspector = createInspector();
        });

        test('should handle null component data gracefully', () => {
            const component = null;

            // Null component should be handled without crashing the entire system
            try {
                hook.registerComponent(component, 'app-1');
            } catch (e) {
                // It's acceptable if null throws, but the system should recover
                expect(e).toBeTruthy();
            }

            // System should still work after null attempt
            const validComponent = {
                _uid: 'comp-valid',
                $options: { name: 'Valid' },
                $parent: null,
                $data: {},
                $props: {}
            };
            expect(() => hook.registerComponent(validComponent, 'app-1')).not.toThrow();
            expect(hook.componentInstances.has('comp-valid')).toBe(true);
        });

        test('should handle undefined component properties', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: undefined,
                $data: undefined,
                $props: undefined
            };

            expect(() => hook.registerComponent(component, 'app-1')).not.toThrow();
            expect(hook.componentInstances.size).toBe(1);
        });

        test('should handle missing lifecycle hooks', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: { count: 0 },
                $props: {}
                // No lifecycle hooks defined
            };

            hook.registerComponent(component, 'app-1');
            const details = inspector.getComponentDetails('comp-1');

            expect(details).toBeTruthy();
            expect(details.lifecycle).toBeDefined();
        });

        test('should handle missing computed properties', () => {
            const component = {
                _uid: 'comp-1',
                $options: {
                    name: 'Test'
                    // No computed defined
                },
                $parent: null,
                $data: { value: 10 },
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            const state = inspector.getComponentDetails('comp-1').state;

            expect(state).toHaveProperty('value');
            expect(state._computed || {}).toBeDefined();
        });

        test('should handle empty state object', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            hook.registerComponent(component, 'app-1');
            const details = inspector.getComponentDetails('comp-1');

            expect(details.state).toBeDefined();
            expect(typeof details.state).toBe('object');
        });
    });

    describe('7.2 Circular Reference Handling', () => {
        let hook;
        let profiler;

        beforeEach(() => {
            hook = initDevTools();
            hook.connect();
            profiler = createProfiler();
        });

        test('should handle circular object references in state', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: {},
                $props: {}
            };

            // Create circular reference
            component.$data.self = component.$data;

            expect(() => hook.registerComponent(component, 'app-1')).not.toThrow();
        });

        test('should handle circular parent-child relationships', () => {
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

            // Create circular relationship
            parent.$parent = child;

            expect(() => {
                hook.registerComponent(parent, 'app-1');
                hook.registerComponent(child, 'app-1');
            }).not.toThrow();
        });

        test('should limit deep recursion correctly', () => {
            const inspector = createInspector();
            hook.registerApp({}, { name: 'TestApp' });

            // Create deeply nested state
            let nested = { level: 0 };
            let current = nested;
            for (let i = 1; i < 100; i++) {
                current.next = { level: i };
                current = current.next;
            }

            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: nested,
                $props: {}
            };

            hook.registerComponent(component, 'app-1');

            // Serialization should handle deep nesting without crashing
            const state = inspector.getComponentDetails('comp-1').state;
            expect(state).toBeTruthy();
        });
    });

    describe('7.3 Large Dataset Handling', () => {
        let hook;

        beforeEach(() => {
            hook = initDevTools();
            hook.registerApp({}, { name: 'LargeApp' });
        });

        test('should handle 1000+ components registration', () => {
            const startTime = performance.now();

            for (let i = 0; i < 1000; i++) {
                const component = {
                    _uid: `comp-${i}`,
                    $options: { name: `Component${i}` },
                    $parent: null,
                    $data: { id: i },
                    $props: {}
                };
                hook.registerComponent(component, 'app-1');
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(hook.componentInstances.size).toBe(1000);
            expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
        });

        test('should handle deep component trees (50+ levels)', () => {
            let parent = null;

            for (let i = 0; i < 50; i++) {
                const component = {
                    _uid: `comp-${i}`,
                    $options: { name: `Component${i}` },
                    $parent: parent,
                    $data: { level: i },
                    $props: {}
                };
                hook.registerComponent(component, 'app-1');
                parent = component;
            }

            expect(hook.componentInstances.size).toBe(50);
        });

        test('should serialize large state objects (1MB+)', () => {
            const inspector = createInspector();

            // Create a large state object
            const largeData = {};
            for (let i = 0; i < 10000; i++) {
                largeData[`key_${i}`] = {
                    value: i,
                    nested: { data: 'x'.repeat(100) }
                };
            }

            const component = {
                _uid: 'comp-1',
                $options: { name: 'LargeComponent' },
                $parent: null,
                $data: largeData,
                $props: {}
            };

            hook.registerComponent(component, 'app-1');

            const startTime = performance.now();
            const details = inspector.getComponentDetails('comp-1');
            const endTime = performance.now();

            expect(details).toBeTruthy();
            expect(endTime - startTime).toBeLessThan(1000); // Should serialize in < 1 second
        });

        test('should handle many simultaneous events without degradation', () => {
            const listener = jest.fn();

            // Connect hook first to ensure events are emitted
            hook.connect();
            hook.on('component:registered', listener);

            const startTime = performance.now();

            for (let i = 0; i < 100; i++) {
                const component = {
                    _uid: `comp-${i}`,
                    $options: { name: `Component${i}` },
                    $parent: null,
                    $data: {},
                    $props: {}
                };
                hook.registerComponent(component, 'app-1');
            }

            const endTime = performance.now();

            expect(listener).toHaveBeenCalledTimes(100);
            expect(endTime - startTime).toBeLessThan(2000); // Should handle all events in < 2 seconds
        });
    });

    describe('7.4 Concurrent Operations', () => {
        let hook;
        let inspector;
        let profiler;

        beforeEach(() => {
            hook = initDevTools();
            hook.connect();
            hook.registerApp({}, { name: 'ConcurrentApp' });
            inspector = createInspector();
            profiler = createProfiler();
        });

        test('should handle multiple simultaneous edits without conflict', async () => {
            const components = [];

            // Register 10 components
            for (let i = 0; i < 10; i++) {
                const component = {
                    _uid: `comp-${i}`,
                    $options: { name: `Component${i}` },
                    $parent: null,
                    $data: { count: 0 },
                    $props: {}
                };
                hook.registerComponent(component, 'app-1');
                components.push(component);
            }

            // Simulate concurrent edits
            const editPromises = [];
            for (let i = 0; i < 10; i++) {
                editPromises.push(
                    Promise.resolve().then(() => {
                        inspector.editState(`comp-${i}`, 'count', i * 10);
                    })
                );
            }

            await Promise.all(editPromises);

            // Verify all edits succeeded
            for (let i = 0; i < 10; i++) {
                expect(components[i].$data.count).toBe(i * 10);
            }
        });

        test('should handle recording while profiling works correctly', () => {
            profiler.startRecording();

            // Register component during recording
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: { value: 10 },
                $props: {}
            };
            hook.registerComponent(component, 'app-1');

            // Edit state during recording
            inspector.editState('comp-1', 'value', 20);

            const recording = profiler.stopRecording();

            expect(recording).toBeTruthy();
            expect(recording.events.length).toBeGreaterThan(0);
        });

        test('should handle inspection during recording works correctly', () => {
            profiler.startRecording();

            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: { count: 0 },
                $props: {}
            };
            hook.registerComponent(component, 'app-1');

            // Get details while recording
            const details = inspector.getComponentDetails('comp-1');

            // Emit some updates
            hook.emit('component:updated', { id: 'comp-1', state: { count: 1 } });

            const recording = profiler.stopRecording();

            expect(details).toBeTruthy();
            expect(recording.events.length).toBeGreaterThan(0);
        });

        test('should maintain consistency with rapid state changes', () => {
            const component = {
                _uid: 'comp-1',
                $options: { name: 'Test' },
                $parent: null,
                $data: { counter: 0 },
                $props: {}
            };
            hook.registerComponent(component, 'app-1');

            // Rapid state changes
            for (let i = 0; i < 100; i++) {
                inspector.editState('comp-1', 'counter', i);
            }

            const details = inspector.getComponentDetails('comp-1');
            // State is serialized, so we need to get the raw value or direct component data
            const finalValue = component.$data.counter;
            expect(finalValue).toBe(99);
        });
    });
});

// ============================================================================
// INTEGRATION: Phases 6 & 7 Combined Scenarios
// ============================================================================

describe('Phases 6 & 7: Integration Scenarios', () => {
    let hook;
    let inspector;
    let profiler;

    beforeEach(() => {
        hook = initDevTools();
        hook.connect();
        hook.registerApp({}, { name: 'IntegrationApp' });
        inspector = createInspector();
        profiler = createProfiler();
        global.postMessage.mockClear();
    });

    test('should announce initialization and allow extension to detect', () => {
        global.postMessage.mockClear();
        delete window.__KALXJS_DEVTOOLS_HOOK__;

        const newHook = initDevTools();

        // Extension receives announcement
        expect(global.postMessage).toHaveBeenCalled();
        const announcement = global.postMessage.mock.calls[0][0];

        // Extension confirms framework presence
        const isKALXJSApp =
            announcement.source === 'kalxjs-devtools-hook' &&
            announcement.event === 'init';

        expect(isKALXJSApp).toBe(true);
    });

    test('should handle extension querying hook after announcement', () => {
        initDevTools();

        // Extension queries for hook
        const hook = getDevToolsHook();
        expect(hook).toBeTruthy();

        // Extension can now register listeners
        const listener = jest.fn();
        hook.on('component:registered', listener);

        // Verify hook is accessible and functional
        const component = {
            _uid: 'comp-1',
            $options: { name: 'Test' },
            $parent: null,
            $data: {},
            $props: {}
        };
        hook.registerComponent(component, 'app-1');

        expect(listener).toHaveBeenCalled();
    });

    test('should recover from large dataset operations and continue extension communication', () => {
        global.postMessage.mockClear();

        // Simulate large dataset handling
        for (let i = 0; i < 500; i++) {
            const component = {
                _uid: `comp-${i}`,
                $options: { name: `Component${i}` },
                $parent: null,
                $data: { index: i },
                $props: {}
            };
            hook.registerComponent(component, 'app-1');
        }

        global.postMessage.mockClear();

        // Extension communication should still work
        hook.emit('component:updated', { id: 'comp-0', state: { index: 0 } });

        expect(global.postMessage).toHaveBeenCalled();
    });

    test('should handle error conditions without breaking extension connection', () => {
        global.postMessage.mockClear();

        // Attempt to edit non-existent component
        const result = inspector.editState('non-existent', 'value', 10);
        expect(result).toBe(false);

        // Extension communication should still work
        hook.emit('test:event', {});
        expect(global.postMessage).toHaveBeenCalled();
    });

    test('should handle concurrent extension events during profiling', (done) => {
        // Register a component first to generate events
        const component = {
            _uid: 'comp-1',
            $options: { name: 'Test' },
            $parent: null,
            $data: { value: 0 },
            $props: {}
        };
        hook.registerComponent(component, 'app-1');

        profiler.startRecording();

        // Simulate extension sending multiple events
        setTimeout(() => {
            inspector.editState('comp-1', 'value', 10);
        }, 10);

        setTimeout(() => {
            inspector.editState('comp-1', 'value', 20);
        }, 20);

        setTimeout(() => {
            const recording = profiler.stopRecording();
            // Recording should have been created with some events
            expect(recording).toBeTruthy();
            expect(recording.id).toBeTruthy();
            done();
        }, 100);
    }, 10000);
});