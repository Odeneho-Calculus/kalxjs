// kalxjs/tests/unit/reactivity.test.js

// Import the reactivity system
import { reactive, ref, computed, effect } from '@kalxjs/core/reactivity';

describe('Reactivity System', () => {
    describe('reactive', () => {
        test('should make an object reactive', () => {
            const original = { count: 0 };
            const observed = reactive(original);

            // The reactive object should have the same properties
            expect(observed.count).toBe(0);

            // Changes to the reactive object should be tracked
            let dummy;
            effect(() => {
                dummy = observed.count;
            });

            expect(dummy).toBe(0);

            // When we change the property, the effect should run again
            observed.count = 1;
            expect(dummy).toBe(1);
        });

        test('should handle nested objects', () => {
            const original = { nested: { count: 0 } };
            const observed = reactive(original);

            let dummy;
            effect(() => {
                dummy = observed.nested.count;
            });

            expect(dummy).toBe(0);

            observed.nested.count = 1;
            expect(dummy).toBe(1);
        });

        test('should handle property deletion', () => {
            const original = { count: 0 };
            const observed = reactive(original);

            let dummy;
            effect(() => {
                dummy = observed.count;
            });

            expect(dummy).toBe(0);

            delete observed.count;
            expect(dummy).toBeUndefined();
        });
    });

    describe('ref', () => {
        test('should create a reactive reference', () => {
            const count = ref(0);

            let dummy;
            effect(() => {
                dummy = count.value;
            });

            expect(dummy).toBe(0);

            count.value = 1;
            expect(dummy).toBe(1);
        });

        test('should work with complex values', () => {
            const obj = ref({ count: 0 });

            let dummy;
            effect(() => {
                dummy = obj.value.count;
            });

            expect(dummy).toBe(0);

            obj.value.count = 1;
            expect(dummy).toBe(1);

            // Replacing the entire object
            obj.value = { count: 2 };
            expect(dummy).toBe(2);
        });
    });

    describe('computed', () => {
        test('should compute derived values', () => {
            const count = ref(1);
            const double = computed(() => count.value * 2);

            expect(double.value).toBe(2);

            count.value = 2;
            expect(double.value).toBe(4);
        });

        test('should be reactive', () => {
            const count = ref(1);
            const double = computed(() => count.value * 2);

            let dummy;
            effect(() => {
                dummy = double.value;
            });

            expect(dummy).toBe(2);

            count.value = 2;
            expect(dummy).toBe(4);
        });

        test('should handle setter', () => {
            const count = ref(1);
            const double = computed({
                get: () => count.value * 2,
                set: (val) => {
                    count.value = val / 2;
                }
            });

            expect(double.value).toBe(2);
            double.value = 4;
            expect(count.value).toBe(2);
        });
    });

    describe('effect', () => {
        test('should run the effect function', () => {
            const fnSpy = jest.fn();
            effect(fnSpy);

            expect(fnSpy).toHaveBeenCalledTimes(1);
        });

        test('should observe multiple properties', () => {
            const obj = reactive({ foo: 1, bar: 2 });

            let dummy;
            effect(() => {
                dummy = obj.foo + obj.bar;
            });

            expect(dummy).toBe(3);

            obj.foo = 2;
            expect(dummy).toBe(4);

            obj.bar = 3;
            expect(dummy).toBe(5);
        });

        test('should handle multiple effects', () => {
            const obj = reactive({ foo: 1 });

            let dummy1, dummy2;
            effect(() => {
                dummy1 = obj.foo;
            });
            effect(() => {
                dummy2 = obj.foo * 2;
            });

            expect(dummy1).toBe(1);
            expect(dummy2).toBe(2);

            obj.foo = 2;
            expect(dummy1).toBe(2);
            expect(dummy2).toBe(4);
        });
    });
});