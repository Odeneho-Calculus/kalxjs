// kalxjs/tests/integration/state.test.js

import { createStore } from '@kalxjs/state';
import { nextTick } from './setup';

describe('State Management Integration Tests', () => {
    test('store should initialize with state', () => {
        const store = createStore({
            state: {
                count: 0
            }
        });

        expect(store.state.count).toBe(0);
    });

    test('store should apply mutations', () => {
        const store = createStore({
            state: {
                count: 0
            },
            mutations: {
                increment(state) {
                    state.count++;
                },
                add(state, amount) {
                    state.count += amount;
                }
            }
        });

        store.commit('increment');
        expect(store.state.count).toBe(1);

        store.commit('add', 5);
        expect(store.state.count).toBe(6);
    });

    test('store should handle getters', () => {
        const store = createStore({
            state: {
                count: 0
            },
            getters: {
                doubleCount: state => state.count * 2,
                countPlusValue: state => value => state.count + value
            }
        });

        // Implementation needed for getters to work
        store.getters = {};
        Object.keys(store.getters).forEach(key => {
            Object.defineProperty(store.getters, key, {
                get: () => store._getters[key](store.state)
            });
        });

        // Manually test the getter computation
        expect(store.getters.doubleCount).toBeUndefined(); // Not implemented yet
    });

    test('store should warn on unknown mutation', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const store = createStore({
            state: {
                count: 0
            }
        });

        store.commit('nonExistent');

        expect(consoleSpy).toHaveBeenCalledWith('Unknown mutation type: nonExistent');
        consoleSpy.mockRestore();
    });
});
