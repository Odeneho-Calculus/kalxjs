// @kalxjs/core - JS Component Implementation
// This file provides the new component API for standard .js files

import { reactive, effect } from '../reactivity/reactive';
import { h, createElement, updateElement } from '../vdom/vdom';

/**
 * Creates a component from a setup function
 * @param {Function} setup - Setup function that returns component state and methods
 * @returns {Function} Component factory function
 */
export function createJsComponent(setup) {
  return function ComponentFactory(props = {}) {
    const instance = {
      props,
      $el: null,
      _vnode: null,
      _isMounted: false,
      _isUnmounted: false,
      _watchers: []
    };

    // Create context for setup function
    const context = {
      emit: (event, ...args) => {
        const handler = props[`on${event[0].toUpperCase() + event.slice(1)}`];
        if (handler && typeof handler === 'function') {
          handler(...args);
        }
      },
      props: reactive(props)
    };

    // Call setup function
    const setupResult = setup(context.props, context);

    // Make state reactive
    const state = reactive(setupResult.state || {});

    // Extract render function
    const { render, state: _, ...rest } = setupResult;

    // Add state to instance
    instance.state = state;

    if (!render || typeof render !== 'function') {
      console.error('Component setup must return a render function');
      // Create a default render function
      instance.render = () => h('div', {
        style: 'padding: 10px; border: 1px solid red; color: red;'
      }, ['Component Error: No render function provided']);
    } else {
      // Bind render to instance
      instance.render = function () {
        try {
          return render.call(this, state);
        } catch (error) {
          console.error('Error in render function:', error);
          return h('div', {
            style: 'padding: 10px; border: 1px solid red; color: red;'
          }, [
            h('h3', {}, ['Render Error']),
            h('p', {}, [error.message])
          ]);
        }
      };
    }

    // Add all other properties to instance
    Object.assign(instance, rest);

    // Add lifecycle methods
    instance.$mount = function (el) {
      if (typeof el === 'string') {
        el = document.querySelector(el);
      }

      if (!el) {
        console.error('Invalid mounting element');
        return this;
      }

      // Store reference to the mounting element
      this.$el = el;

      // Call beforeMount hooks
      if (this.beforeMount) {
        this.beforeMount();
      }

      // Render the component
      try {
        // Clear the element before mounting
        el.innerHTML = '';

        // Render the component
        const vnode = this.render();

        // Store the vnode for future updates
        this._vnode = vnode;

        // Create real DOM from virtual DOM and append to element
        if (vnode) {
          const dom = createElement(vnode);
          if (dom) {
            el.appendChild(dom);
          }
        }

        // Set mounted flag
        this._isMounted = true;

        // Call mounted hooks
        if (this.mounted) {
          this.mounted();
        }
      } catch (error) {
        console.error('Error during component mounting:', error);
        el.innerHTML = `
          <div style="color: red; border: 1px solid red; padding: 10px; margin: 10px 0;">
            <h3>Component Mounting Error</h3>
            <p>${error.message}</p>
            <pre style="font-size: 12px; overflow: auto; max-height: 200px; background: #f5f5f5; padding: 5px;">${error.stack}</pre>
          </div>
        `;
      }

      return this;
    };

    instance.$update = function () {
      if (!this.$el || this._isUnmounted) {
        return;
      }

      // Call beforeUpdate hooks
      if (this.beforeUpdate) {
        this.beforeUpdate();
      }

      // Re-render and update the DOM
      try {
        const newVnode = this.render();

        if (this._vnode) {
          // Update the DOM using the diff algorithm
          updateElement(this.$el, this._vnode, newVnode);
        } else {
          // First render
          const dom = createElement(newVnode);
          this.$el.innerHTML = '';
          this.$el.appendChild(dom);
        }

        // Store the new vnode
        this._vnode = newVnode;

        // Call updated hooks
        if (this.updated) {
          this.updated();
        }
      } catch (error) {
        console.error('Error during component update:', error);
        this.$el.innerHTML = `
          <div style="color: red; border: 1px solid red; padding: 10px; margin: 10px 0;">
            <h3>Component Update Error</h3>
            <p>${error.message}</p>
            <pre style="font-size: 12px; overflow: auto; max-height: 200px; background: #f5f5f5; padding: 5px;">${error.stack}</pre>
          </div>
        `;
      }
    };

    instance.$unmount = function () {
      if (!this.$el || this._isUnmounted) {
        return;
      }

      // Call beforeUnmount hooks
      if (this.beforeUnmount) {
        this.beforeUnmount();
      }

      // Clean up watchers
      this._watchers.forEach(unwatch => {
        if (typeof unwatch === 'function') {
          unwatch();
        }
      });

      // Remove element from DOM
      if (this.$el.parentNode) {
        this.$el.parentNode.removeChild(this.$el);
      }

      // Set unmounted flag
      this._isUnmounted = true;

      // Call unmounted hooks
      if (this.unmounted) {
        this.unmounted();
      }

      // Clear references
      this.$el = null;
      this._vnode = null;
    };

    // Setup reactivity for state changes
    if (setupResult.state && typeof setupResult.state === 'object') {
      // Create effect to automatically update the component when state changes
      const stopEffect = effect(() => {
        // Access all reactive properties to track them
        JSON.stringify(setupResult.state);

        // Only update if already mounted
        if (instance._isMounted && !instance._isUnmounted) {
          instance.$update();
        }
      });

      // Add to watchers for cleanup
      instance._watchers.push(stopEffect);
    }

    return instance;
  };
}

/**
 * Defines a component using the new JS-based API
 * @param {Object} options - Component options
 * @returns {Function} Component factory function
 */
export function defineJsComponent(options) {
  // If using the new API with setup function
  if (options.setup && typeof options.setup === 'function') {
    return createJsComponent(options.setup);
  }

  // For backward compatibility, create a setup function from options API
  return createJsComponent((props, { emit }) => {
    const result = { props };

    // Initialize data as reactive state
    if (options.data && typeof options.data === 'function') {
      result.state = reactive(options.data());
    } else {
      result.state = reactive({});
    }

    // Add methods
    if (options.methods) {
      Object.entries(options.methods).forEach(([key, method]) => {
        result[key] = function (...args) {
          return method.apply({ ...result, ...result.state }, args);
        };
      });
    }

    // Add computed properties
    if (options.computed) {
      Object.entries(options.computed).forEach(([key, computedFn]) => {
        Object.defineProperty(result, key, {
          get: function () {
            return computedFn.call({ ...result, ...result.state });
          }
        });
      });
    }

    // Add lifecycle hooks
    ['beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeUnmount', 'unmounted'].forEach(hook => {
      if (options[hook]) {
        result[hook] = function () {
          return options[hook].call({ ...result, ...result.state });
        };
      }
    });

    // Add render function
    if (options.render) {
      result.render = function () {
        return options.render.call({ ...result, ...result.state });
      };
    } else {
      // Default render function
      result.render = () => h('div', {}, ['No render function defined']);
    }

    return result;
  });
}

/**
 * Creates styles for a component
 * @param {string} cssString - CSS styles as a string
 * @returns {string} Style ID for reference
 */
export function createStyles(cssString, styleId) {
  if (typeof document === 'undefined') {
    return null;
  }

  // Use provided styleId or generate a random one
  const id = styleId || 'kaljs-style-' + Math.random().toString(36).substring(2, 10);

  // Check if the style element already exists
  const existingStyle = document.getElementById(id);
  if (existingStyle) {
    return id;
  }

  // Create new style element
  const style = document.createElement('style');
  style.id = id;
  style.textContent = cssString;
  document.head.appendChild(style);

  return id;
}