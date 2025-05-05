// kalxjs/tests/unit/vdom.test.js

// Import the Virtual DOM functionality
import { createElement, h, createDOMElement, updateElement } from '@kalxjs/core/vdom/vdom';

describe('Virtual DOM', () => {
    describe('createElement', () => {
        test('should create a virtual node with tag, props, and children', () => {
            const vnode = createElement('div', { id: 'test' }, [
                createElement('span', {}, ['Hello'])
            ]);

            expect(vnode).toEqual({
                tag: 'div',
                props: { id: 'test' },
                children: [
                    {
                        tag: 'span',
                        props: {},
                        children: [
                            {
                                tag: 'TEXT_ELEMENT',
                                props: { nodeValue: 'Hello' },
                                children: []
                            }
                        ]
                    }
                ]
            });
        });

        test('should handle text children', () => {
            const vnode = createElement('div', {}, ['Hello', 'World']);

            expect(vnode.children).toEqual([
                {
                    tag: 'TEXT_ELEMENT',
                    props: { nodeValue: 'Hello' },
                    children: []
                },
                {
                    tag: 'TEXT_ELEMENT',
                    props: { nodeValue: 'World' },
                    children: []
                }
            ]);
        });

        test('should handle number children', () => {
            const vnode = createElement('div', {}, [42]);

            expect(vnode.children).toEqual([
                {
                    tag: 'TEXT_ELEMENT',
                    props: { nodeValue: '42' },
                    children: []
                }
            ]);
        });
    });

    describe('h (JSX compatibility)', () => {
        test('should create elements with props and children', () => {
            const vnode = h('div', { id: 'test' }, 'Hello', 'World');

            expect(vnode).toEqual({
                tag: 'div',
                props: { id: 'test' },
                children: [
                    {
                        tag: 'TEXT_ELEMENT',
                        props: { nodeValue: 'Hello' },
                        children: []
                    },
                    {
                        tag: 'TEXT_ELEMENT',
                        props: { nodeValue: 'World' },
                        children: []
                    }
                ]
            });
        });

        test('should handle nested children', () => {
            const vnode = h('div', null,
                h('span', null, 'Hello'),
                h('span', null, 'World')
            );

            expect(vnode.children.length).toBe(2);
            expect(vnode.children[0].tag).toBe('span');
            expect(vnode.children[1].tag).toBe('span');
        });

        test('should handle component functions', () => {
            const Component = (props) => h('div', null, props.message);
            const vnode = h(Component, { message: 'Hello' });

            expect(vnode.tag).toBe('div');
            expect(vnode.children[0].props.nodeValue).toBe('Hello');
        });
    });

    describe('createDOMElement', () => {
        beforeEach(() => {
            // Setup document mock
            document.createElement = jest.fn().mockImplementation((tag) => {
                return {
                    tagName: tag.toUpperCase(),
                    style: {},
                    setAttribute: jest.fn(),
                    appendChild: jest.fn(),
                    // Add addEventListener and removeEventListener mocks
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn()
                };
            });

            document.createTextNode = jest.fn().mockImplementation((text) => {
                return { nodeValue: text, nodeType: 3 };
            });
        });

        test('should create a DOM element from virtual node', () => {
            const vnode = createElement('div', { id: 'test', className: 'container' }, []);
            const element = createDOMElement(vnode);

            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(element.id).toBe('test');
            expect(element.className).toBe('container');
        });

        test('should create text nodes', () => {
            const vnode = createElement('TEXT_ELEMENT', { nodeValue: 'Hello' }, []);
            const textNode = createDOMElement(vnode);

            expect(document.createTextNode).toHaveBeenCalledWith('Hello');
            expect(textNode.nodeValue).toBe('Hello');
        });

        test('should handle event listeners', () => {
            const mockFn = jest.fn();
            const vnode = createElement('button', { onClick: mockFn }, []);
            const element = createDOMElement(vnode);

            // Check that event listener would be added (can't directly test in JSDOM)
            expect(element.addEventListener).toHaveBeenCalledWith('click', mockFn);
        });

        test('should handle style objects', () => {
            const vnode = createElement('div', { style: { color: 'red', fontSize: '16px' } }, []);
            const element = createDOMElement(vnode);

            expect(element.style.color).toBe('red');
            expect(element.style.fontSize).toBe('16px');
        });
    });

    describe('updateElement', () => {
        // These tests would be more complex and require a full DOM environment
        // For simplicity, we'll add basic tests

        test('should update element properties', () => {
            // Mock setup
            const parent = { childNodes: [] };
            const oldNode = createElement('div', { id: 'old', className: 'test' }, []);
            const newNode = createElement('div', { id: 'new', className: 'test' }, []);

            // Mock the DOM element to be updated
            const mockElement = {
                id: 'old',
                className: 'test'
            };

            parent.childNodes[0] = mockElement;

            // Call update function
            updateElement(parent, oldNode, newNode, 0);

            // Check if properties were updated
            expect(mockElement.id).toBe('new');
        });

        test('should handle new elements', () => {
            const parent = {
                appendChild: jest.fn(),
                childNodes: []
            };

            const newNode = createElement('div', { id: 'new' }, []);

            updateElement(parent, null, newNode);

            expect(parent.appendChild).toHaveBeenCalled();
        });

        test('should handle removed elements', () => {
            const parent = {
                removeChild: jest.fn(),
                childNodes: ['mockChild']
            };

            updateElement(parent, { tag: 'div' }, null, 0);

            expect(parent.removeChild).toHaveBeenCalledWith('mockChild');
        });
    });
});