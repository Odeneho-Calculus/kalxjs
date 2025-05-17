// @ts-check
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { defineJsComponent, createJsComponent, createStyles } from '../../packages/core/src/component/js-component';
import { h, reactive } from '../../packages/core/src/index';

// Mock document and window for testing
global.document = {
  createElement: jest.fn((tag) => ({
    tag,
    style: {},
    className: '',
    setAttribute: jest.fn(),
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    innerHTML: ''
  })),
  createTextNode: jest.fn((text) => ({ text })),
  createComment: jest.fn((text) => ({ text })),
  head: {
    appendChild: jest.fn()
  },
  getElementById: jest.fn(() => null),
  querySelector: jest.fn(() => ({
    appendChild: jest.fn(),
    innerHTML: '',
    parentNode: {
      removeChild: jest.fn()
    }
  }))
};

describe('JS Component System', () => {
  describe('createJsComponent', () => {
    it('should create a component from a setup function', () => {
      const setup = () => {
        const state = reactive({ count: 0 });
        
        function increment() {
          state.count++;
        }
        
        function render() {
          return h('div', {}, [state.count]);
        }
        
        return { state, increment, render };
      };
      
      const Component = createJsComponent(setup);
      const instance = Component();
      
      expect(instance).toBeDefined();
      expect(instance.state.count).toBe(0);
      expect(typeof instance.increment).toBe('function');
      expect(typeof instance.render).toBe('function');
      expect(typeof instance.$mount).toBe('function');
      expect(typeof instance.$update).toBe('function');
      expect(typeof instance.$unmount).toBe('function');
    });
    
    it('should handle missing render function', () => {
      const setup = () => {
        return { state: reactive({ count: 0 }) };
      };
      
      const Component = createJsComponent(setup);
      const instance = Component();
      
      expect(instance).toBeDefined();
      expect(typeof instance.render).toBe('function');
      
      // The render function should return an error message
      const vnode = instance.render();
      expect(vnode.tag).toBe('div');
      expect(vnode.props.style).toContain('red');
    });
    
    it('should handle reactivity', () => {
      const setup = () => {
        const state = reactive({ count: 0 });
        
        function increment() {
          state.count++;
        }
        
        function render() {
          return h('div', {}, [state.count]);
        }
        
        return { state, increment, render };
      };
      
      const Component = createJsComponent(setup);
      const instance = Component();
      
      // Initial state
      expect(instance.state.count).toBe(0);
      
      // Update state
      instance.increment();
      expect(instance.state.count).toBe(1);
      
      // Render should reflect the new state
      const vnode = instance.render();
      expect(vnode.children[0]).toBe(1);
    });
  });
  
  describe('defineJsComponent', () => {
    it('should define a component with setup function', () => {
      const Component = defineJsComponent({
        name: 'TestComponent',
        setup() {
          const state = reactive({ count: 0 });
          
          function increment() {
            state.count++;
          }
          
          function render() {
            return h('div', {}, [state.count]);
          }
          
          return { state, increment, render };
        }
      });
      
      const instance = Component();
      
      expect(instance).toBeDefined();
      expect(instance.state.count).toBe(0);
      expect(typeof instance.increment).toBe('function');
    });
    
    it('should define a component with options API for backward compatibility', () => {
      const Component = defineJsComponent({
        name: 'TestComponent',
        data() {
          return { count: 0 };
        },
        methods: {
          increment() {
            this.count++;
          }
        },
        render() {
          return h('div', {}, [this.count]);
        }
      });
      
      const instance = Component();
      
      expect(instance).toBeDefined();
      expect(instance.state.count).toBe(0);
      expect(typeof instance.increment).toBe('function');
    });
  });
  
  describe('createStyles', () => {
    it('should create a style element with the provided CSS', () => {
      // Reset mocks
      document.getElementById.mockReturnValue(null);
      document.createElement.mockReturnValue({
        id: '',
        textContent: '',
        setAttribute: jest.fn()
      });
      
      const styleId = createStyles('.test { color: red; }');
      
      expect(styleId).toMatch(/^kaljs-style-/);
      expect(document.createElement).toHaveBeenCalledWith('style');
      expect(document.head.appendChild).toHaveBeenCalled();
    });
    
    it('should not create duplicate styles', () => {
      // Mock getElementById to return an existing style element
      document.getElementById.mockReturnValue({ id: 'existing-style' });
      
      const styleId = createStyles('.test { color: blue; }');
      
      expect(styleId).toMatch(/^kaljs-style-/);
      expect(document.head.appendChild).not.toHaveBeenCalled();
    });
  });
});