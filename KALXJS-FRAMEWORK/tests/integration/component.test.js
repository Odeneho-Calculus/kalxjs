// kalxjs/tests/integration/component.test.js

import { createComponent, defineComponent } from '@kalxjs/core/component';
import { h, createDOMElement } from '@kalxjs/core/vdom/vdom'; // Added createDOMElement import
import { resetDOM, nextTick } from './setup';

describe('Component Integration Tests', () => {
    beforeEach(() => {
        resetDOM();
    });

    test('component should render correctly', () => {
        const component = createComponent({
            data() {
                return { message: 'Hello kalxjs' };
            },
            /**
             * Render the component.
             *
             * @return {VNode} The virtual DOM node representing the component.
             */
            render() {
                return h('div', { id: 'app' }, [this.message]);
            }
        });

        const container = document.createElement('div');
        document.body.appendChild(container);
        component.$mount(container);

        expect(container.children[0].tagName.toLowerCase()).toBe('div');
        expect(container.children[0].id).toBe('app');
        expect(container.children[0].textContent).toBe('Hello kalxjs');

        document.body.removeChild(container);
    });

    // Debugging version of the failing test

    test('component should update when data changes', async () => {
        // Create component with console logs for debugging
        const component = createComponent({
            data() {
                return { message: 'Hello' };
            },
            beforeUpdate() {
                console.log('Before update called');
            },
            updated() {
                console.log('Updated called');
            },
            render() {
                console.log('Render called with message:', this.message);
                return h('div', {}, [this.message]);
            }
        });

        const container = document.createElement('div');
        document.body.appendChild(container);
        component.$mount(container);

        console.log('Initial content:', container.children[0].textContent);
        expect(container.children[0].textContent).toBe('Hello');

        // Update data with explicit logging
        console.log('Setting message to Updated');
        component.message = 'Updated';
        console.log('Current data value:', component.$data.message);

        // Force explicit update
        console.log('Forcing update');
        component.$update();

        // Wait for any possible async operations
        await new Promise(resolve => setTimeout(resolve, 50));

        console.log('Final content:', container.children[0].textContent);

        expect(container.children[0].textContent).toBe('Updated');

        document.body.removeChild(container);
    });

    test('component lifecycle hooks should fire in order', () => {
        const lifecycle = [];

        const component = createComponent({
            beforeCreate() {
                lifecycle.push('beforeCreate');
            },
            created() {
                lifecycle.push('created');
            },
            beforeMount() {
                lifecycle.push('beforeMount');
            },
            mounted() {
                lifecycle.push('mounted');
            },
            beforeUpdate() {
                lifecycle.push('beforeUpdate');
            },
            updated() {
                lifecycle.push('updated');
            },
            render() {
                return h('div', {}, [this.message]);
            },
            data() {
                return { message: 'Hello' };
            }
        });

        const container = document.createElement('div');
        document.body.appendChild(container);
        component.$mount(container);

        expect(lifecycle).toEqual(['beforeCreate', 'created', 'beforeMount', 'mounted']);

        // Update to trigger update hooks
        component.message = 'Updated';

        expect(lifecycle).toContain('beforeUpdate');
        expect(lifecycle).toContain('updated');

        document.body.removeChild(container);
    });

    test('component methods should be bound to component instance', () => {
        const component = createComponent({
            data() {
                return { count: 0 };
            },
            methods: {
                increment() {
                    this.count++;
                }
            },
            render() {
                return h('div', {}, [String(this.count)]);
            }
        });

        const container = document.createElement('div');
        document.body.appendChild(container);
        component.$mount(container);

        expect(container.children[0].textContent).toBe('0');

        component.increment();

        expect(component.count).toBe(1);
        expect(container.children[0].textContent).toBe('1');

        document.body.removeChild(container);
    });

    test('defineComponent should return a component factory', () => {
        const Counter = defineComponent({
            data() {
                return { count: 0 };
            },
            methods: {
                increment() {
                    this.count++;
                }
            },
            render() {
                return h('div', {}, [String(this.count)]);
            }
        });

        const vnode = Counter({ id: 'counter' });

        expect(vnode.tag).toBe('div');
    });

    test('should make props accessible', () => {
        const GreetingComponent = defineComponent({
            render() {
                return h('div', {}, [`Hello, ${this.name}!`]);
            }
        });

        const vnode = GreetingComponent({ name: 'kalxjs' });

        // Create a real DOM element to check the output
        const container = document.createElement('div');
        document.body.appendChild(container);
        container.appendChild(createDOMElement(vnode));

        expect(container.children[0].textContent).toBe('Hello, kalxjs!');
        document.body.removeChild(container);
    });
});