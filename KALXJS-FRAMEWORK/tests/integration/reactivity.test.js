// kalxjs/tests/integration/reactivity.test.js

import { reactive, ref, computed, effect } from '@kalxjs/core/reactivity/reactive';
import { nextTick } from './setup';

describe('Reactivity Integration Tests', () => {
    test('reactive should track property changes', () => {
        const state = reactive({ count: 0 });
        let dummy;

        effect(() => {
            dummy = state.count;
        });

        expect(dummy).toBe(0);
        state.count = 1;
        expect(dummy).toBe(1);
    });

    test('reactive should handle nested properties', () => {
        const state = reactive({ nested: { count: 0 } });
        let dummy;

        effect(() => {
            dummy = state.nested.count;
        });

        expect(dummy).toBe(0);
        state.nested.count = 1;
        expect(dummy).toBe(1);
    });

    test('ref should be reactive', () => {
        const count = ref(0);
        let dummy;

        effect(() => {
            dummy = count.value;
        });

        expect(dummy).toBe(0);
        count.value++;
        expect(dummy).toBe(1);
    });

    test('computed should update when dependencies change', () => {
        const count = ref(1);
        const double = computed(() => count.value * 2);

        expect(double.value).toBe(2);
        count.value = 2;
        expect(double.value).toBe(4);
    });

    test('effect should stop tracking when inactive', () => {
        const state = reactive({ count: 0 });
        let dummy;

        const runner = effect(() => {
            dummy = state.count;
        });

        expect(dummy).toBe(0);

        // Stop the effect
        runner.active = false;

        // This should not trigger the effect
        state.count = 1;
        expect(dummy).toBe(0);

        // Reactivate and manually run
        runner.active = true;
        runner();
        expect(dummy).toBe(1);
    });

    test('reactivity should work with arrays', async () => {
        const arr = reactive([1, 2, 3]);
        let sum = 0;

        effect(() => {
            sum = arr.reduce((a, b) => a + b, 0);
        });

        expect(sum).toBe(6);
        arr.push(4);
        await nextTick();
        expect(sum).toBe(10);
        arr.pop();
        await nextTick();
        expect(sum).toBe(6);
    });

    test('reactivity should handle replacement of objects', () => {
        const state = reactive({ obj: { count: 0 } });
        let dummy;

        effect(() => {
            dummy = state.obj.count;
        });

        expect(dummy).toBe(0);
        state.obj = { count: 1 };
        expect(dummy).toBe(1);
    });
});