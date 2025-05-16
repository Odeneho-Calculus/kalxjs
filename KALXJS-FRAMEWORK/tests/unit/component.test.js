// kalxjs/tests/unit/component.test.js

// Import the component system
import { createComponent, defineComponent } from '@kalxjs/core/component';
import { h } from '@kalxjs/core/vdom';

describe('Component System', () => {
    describe('createComponent', () => {
        test('should create a component instance with data', () => {
            const component = createComponent({
                data() {
                    return { count: 0 };
                }
            });

            expect(component.$data.count).toBe(0);
            expect(component.count).toBe(0);

            // Test reactivity
            component.count = 1;
            expect(component.$data.count).toBe(1);
        });

        test('should initialize methods', () => {
            const increment = jest.fn();
            const component = createComponent({
                data() {
                    return { count: 0 };
                },
                methods: {
                    increment
                }
            });

            component.increment();
            expect(increment).toHaveBeenCalled();
        });

        test('should call lifecycle hooks', () => {
            const beforeCreate = jest.fn();
            const created = jest.fn();

            const component = createComponent({
                beforeCreate,
                created
            });

            expect(beforeCreate).toHaveBeenCalled();
            expect(created).toHaveBeenCalled();
        });

        test('should handle computed properties', () => {
            const component = createComponent({
                data() {
                    return { count: 1 };
                },
                computed: {
                    double() {
                        return this.count * 2;
                    }
                }
            });

            expect(component.double).toBe(2);

            component.count = 2;
            expect(component.double).toBe(4);
        });

        test('should have a render function', () => {
            const render = jest.fn().mockReturnValue({
                tag: 'div',
                props: {},
                children: []
            });

            const component = createComponent({
                render
            });

            const vnode = component.render();
            expect(render).toHaveBeenCalled();
            expect(vnode).toEqual({
                tag: 'div',
                props: {},
                children: []
            });
        });
    });

    describe('defineComponent', () => {
        test('should define a functional component', () => {
            const TestComponent = defineComponent({
                props: ['message'],
                render() {
                    return h('div', {}, [this.message]);
                }
            });

            const vnode = TestComponent({ message: 'Hello' });

            expect(vnode).toEqual({
                tag: 'div',
                props: {},
                children: [
                    {
                        tag: 'TEXT_ELEMENT',
                        props: { nodeValue: 'Hello' },
                        children: []
                    }
                ]
            });
        });

        test('should make props accessible', () => {
            let capturedProps = null;

            const TestComponent = defineComponent({
                props: ['message', 'count'],
                render() {
                    capturedProps = {
                        message: this.message,
                        count: this.count
                    };
                    return h('div');
                }
            });

            TestComponent({ message: 'Hello', count: 42 });

            expect(capturedProps).toEqual({
                message: 'Hello',
                count: 42
            });
        });
    });

    describe('Component Mounting', () => {
        beforeEach(() => {
            // Mock the DOM
            document.querySelector = jest.fn().mockImplementation(() => {
                return {
                    innerHTML: '',
                    appendChild: jest.fn()
                };
            });

            document.createElement = jest.fn().mockImplementation(() => {
                return {
                    style: {},
                    appendChild: jest.fn(),
                    setAttribute: jest.fn()
                };
            });

            document.createTextNode = jest.fn().mockImplementation((text) => {
                return { nodeValue: text };
            });
        });

        test('should mount component to DOM element', () => {
            const component = createComponent({
                render() {
                    return h('div', { id: 'app' }, ['Hello World']);
                }
            });

            const el = document.querySelector('#app');
            component.$mount(el);

            expect(el.appendChild).toHaveBeenCalled();
            expect(component.$el).toBe(el);
        });

        test('should handle string selector for mount', () => {
            const component = createComponent({
                render() {
                    return h('div', {}, ['Hello']);
                }
            });

            component.$mount('#app');

            expect(document.querySelector).toHaveBeenCalledWith('#app');
        });

        test('should call mount lifecycle hooks', () => {
            const beforeMount = jest.fn();
            const mounted = jest.fn();

            const component = createComponent({
                beforeMount,
                mounted,
                render() {
                    return h('div');
                }
            });

            component.$mount('#app');

            expect(beforeMount).toHaveBeenCalled();
            expect(mounted).toHaveBeenCalled();
        });
    });
});