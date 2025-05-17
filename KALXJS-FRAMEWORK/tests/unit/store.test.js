// kalxjs/tests/unit/store.test.js

import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import { createStore, mapState, mapGetters } from '@kalxjs/state';

// We won't use jest.mock() since it causes issues with ES modules
// Instead, we'll test the functionality directly

describe('State Management', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createStore', () => {
        test('should create a store with state', () => {
            const store = createStore({
                state: {
                    count: 0
                }
            });

            expect(store.state.count).toBe(0);
        });

        test('should handle empty options', () => {
            const store = createStore();
            expect(store.state).toEqual({});
        });
    });

    describe('Mutations', () => {
        test('should commit mutations', () => {
            const store = createStore({
                state: {
                    count: 0
                },
                mutations: {
                    increment(state, amount = 1) {
                        state.count += amount;
                    }
                }
            });

            store.commit('increment');
            expect(store.state.count).toBe(1);

            store.commit('increment', 5);
            expect(store.state.count).toBe(6);
        });

        test('should warn on unknown mutations', () => {
            const originalWarn = console.warn;
            let warningMessage = '';

            console.warn = (msg) => {
                warningMessage = msg;
            };

            const store = createStore({
                state: { count: 0 },
                mutations: {}
            });

            store.commit('nonExistent');

            expect(warningMessage).toBe('Unknown mutation type: nonExistent');
            console.warn = originalWarn;
        });
    });

    describe('Actions', () => {
        test('should dispatch actions', async () => {
            let actionCalled = false;
            let payloadReceived = null;

            const store = createStore({
                state: {
                    count: 0
                },
                mutations: {
                    increment(state, amount) {
                        state.count += amount;
                    }
                },
                actions: {
                    incrementAsync(context, payload) {
                        actionCalled = true;
                        payloadReceived = payload;
                        context.commit('increment', payload);
                        return Promise.resolve(payload);
                    }
                }
            });

            const result = await store.dispatch('incrementAsync', 5);

            expect(actionCalled).toBe(true);
            expect(payloadReceived).toBe(5);
            expect(store.state.count).toBe(5);
        });
    });

    describe('Getters', () => {
        test('should compute derived state', () => {
            const store = createStore({
                state: {
                    count: 2
                },
                getters: {
                    doubled: state => state.count * 2,
                    plusOne: state => state.count + 1
                }
            });

            expect(store.getters.doubled).toBe(4);
            expect(store.getters.plusOne).toBe(3);
        });
    });
});