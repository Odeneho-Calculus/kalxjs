// @kalxjs/core - JS Component Implementation
// This file provides the new component API for standard .js files

/**
 * Process template expressions to replace {{ expr }} with actual values
 * @param {string} template - Template string with expressions
 * @param {Object} component - Component instance
 * @returns {string} Processed template
 */
function processTemplateExpressions(template, component) {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
    try {
      // Trim the expression
      const trimmedExpr = expression.trim();

      // Split by dots to handle nested properties
      const parts = trimmedExpr.split('.');
      let value = component;

      // Navigate through the object properties
      for (const part of parts) {
        if (value === undefined || value === null) {
          return '';
        }
        value = value[part];

        // Handle ref objects
        if (value && typeof value === 'object' && 'value' in value && typeof value.value !== 'function') {
          value = value.value;
        }
      }

      // Handle undefined values
      if (value === undefined) {
        console.warn(`Expression "${trimmedExpr}" evaluated to undefined in template`);
        return '';
      }

      // Handle arrays and objects
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return JSON.stringify(value);
        }
        return String(value);
      }

      return String(value);
    } catch (error) {
      console.error(`Error evaluating expression "${expression}":`, error);
      return '';
    }
  });
}

import { reactive, effect, ref } from '../reactivity/reactive';
import { h, createElement, updateElement } from '../vdom/vdom';
import { applyDirectives } from '../directives/index.js';

/**
 * Creates a component from a setup function
 * @param {Function} setup - Setup function that returns component state and methods
 * @returns {Function} Component factory function
 */
export function createJsComponent(setup) {
  return function ComponentFactory(props = {}) {
    // Extract component options from the setup function if available
    const setupOptions = setup.options || {};

    // Store the component options for reference
    const $options = {
      name: setupOptions.name || 'ComponentFactory',
      props: setupOptions.props || {}
    };

    console.log('Creating component with options:', $options);
    console.log('Received props:', props);

    // Initialize props with default values if not provided
    const initializedProps = { ...props };

    // Apply default values for props
    if ($options.props) {
      for (const key in $options.props) {
        if (!(key in initializedProps) || initializedProps[key] === undefined) {
          const propDef = $options.props[key];
          if (typeof propDef === 'object' && 'default' in propDef) {
            initializedProps[key] = typeof propDef.default === 'function'
              ? propDef.default()
              : propDef.default;
            console.log(`Initialized prop ${key} with default value:`, initializedProps[key]);
          }
        }
      }
    }

    const instance = {
      $options,
      props: initializedProps,
      $el: null,
      _vnode: null,
      _isMounted: false,
      _isUnmounted: false,
      _watchers: []
    };

    // Make props directly accessible on the instance
    for (const key in initializedProps) {
      if (!(key in instance)) {
        Object.defineProperty(instance, key, {
          get() { return instance.props[key]; },
          configurable: true
        });
        console.log(`Made prop ${key} directly accessible on instance:`, instance.props[key]);
      }
    }

    // Create context for setup function
    const context = {
      emit: (event, ...args) => {
        const handler = initializedProps[`on${event[0].toUpperCase() + event.slice(1)}`];
        if (handler && typeof handler === 'function') {
          handler(...args);
        }
      },
      props: reactive(initializedProps),
      ref: ref,  // Make ref function available to the component
      $options: $options  // Make options available to the component
    };

    // Make ref available in the global scope for this execution context
    const globalRef = window.ref;
    window.ref = ref;

    // Call setup function
    let setupResult;
    try {
      console.log('Calling setup function with props:', context.props);
      console.log('Component options:', $options);

      setupResult = setup(context.props, context);
      console.log('Setup function result:', setupResult);

      // Add all props to the setup result if they're not already there
      if ($options.props) {
        for (const key in $options.props) {
          if (!(key in setupResult) && key in initializedProps) {
            console.log(`Adding ${key} prop to setup result from props:`, initializedProps[key]);
            setupResult[key] = initializedProps[key];
          }
        }
      }
    } catch (error) {
      console.error('Error in setup function:', error);
      // If the error is about ref not being defined, try again with ref explicitly passed
      if (error.message.includes('ref is not defined')) {
        console.log('Retrying setup with explicit ref parameter');
        // Create a wrapper function that explicitly passes ref
        const setupWithRef = new Function('props', 'context', 'ref', `
          return (${setup.toString()})(props, context);
        `);
        setupResult = setupWithRef(context.props, context, ref);
        console.log('Setup function result after retry:', setupResult);
      } else {
        throw error;
      }
    } finally {
      // Restore the original ref (or undefined)
      window.ref = globalRef;
    }

    // Check if setupResult is an object
    if (!setupResult || typeof setupResult !== 'object') {
      console.error('Component setup must return an object');
      // Create a default render function
      instance.render = () => h('div', {
        style: 'padding: 10px; border: 1px solid red; color: red;'
      }, ['Component Error: Setup did not return a valid object']);
      return instance;
    }

    // Extract render function if it exists
    const { render, ...rest } = setupResult;

    // Add all reactive properties to the instance
    for (const key in rest) {
      // Check if it's a ref object
      if (rest[key] && typeof rest[key] === 'object' && 'value' in rest[key]) {
        console.log(`Made reactive property ${key} directly accessible on instance:`, rest[key]);

        // Define a getter/setter for the reactive property
        Object.defineProperty(instance, key, {
          get() {
            return rest[key].value;
          },
          set(newValue) {
            rest[key].value = newValue;
          }
        });

        // Also store the ref object itself
        instance[`__reactive_${key}`] = rest[key];
      } else {
        // For non-reactive properties, just copy them
        instance[key] = rest[key];
      }
    }

    // If render function is provided, use it
    if (render && typeof render === 'function') {
      // Bind render to instance
      instance.render = function () {
        try {
          return render.call(this);
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
    } else {
      // If no render function is provided, check if the component has a _renderTemplate method
      console.log('No render function provided in setup result, checking for _renderTemplate method');

      if (rest._renderTemplate && typeof rest._renderTemplate === 'function') {
        // Use the _renderTemplate method to render the component
        console.log('Using _renderTemplate method for rendering');

        // Copy the _renderTemplate method to the instance
        instance._renderTemplate = rest._renderTemplate;

        instance.render = function () {
          console.log('Rendering component with _renderTemplate method');
          console.log('Component props before rendering:', this.props);
          console.log('Component $options before rendering:', this.$options);

          // Make sure all props are accessible on the instance
          for (const key in this.props) {
            if (!(key in this)) {
              Object.defineProperty(this, key, {
                get() { return this.props[key]; },
                configurable: true
              });
              console.log(`Made prop ${key} accessible on instance before rendering:`, this.props[key]);
            }
          }

          try {
            // Get the template content
            let templateContent = this._renderTemplate();
            console.log('Template content from _renderTemplate:', templateContent);

            // Process template expressions
            templateContent = processTemplateExpressions(templateContent, this);

            // Create a proper vnode with tag, props, and children
            // Store the original template for directive processing
            this._originalTemplate = templateContent;

            const vnode = {
              tag: 'div',
              props: { class: 'kal-component' },
              children: [{
                tag: 'div',
                props: {
                  innerHTML: templateContent,
                  'data-component-id': this._uid || 'component',
                  onclick: (e) => {
                    // Handle click events by finding the closest element with data-click attribute
                    const path = e.composedPath ? e.composedPath() : e.path || [e.target];
                    for (const el of path) {
                      if (el.hasAttribute && el.hasAttribute('data-click')) {
                        const handlerName = el.getAttribute('data-click');
                        if (typeof this[handlerName] === 'function') {
                          this[handlerName]();
                          e.preventDefault();
                          e.stopPropagation();
                          break;
                        }
                      }
                    }
                  }
                },
                children: [],
                // Add a hook for directive processing
                mounted: (el) => {
                  // Apply directives to the rendered content
                  if (el && el.firstChild) {
                    applyDirectives(el.firstChild, this);
                  }
                }
              }]
            };

            console.log('_renderTemplate render function returning vnode:', vnode);
            return vnode;
          } catch (error) {
            console.error('Error in _renderTemplate render function:', error);

            // Return an error vnode
            return {
              tag: 'div',
              props: { class: 'kal-component-error' },
              children: [{
                tag: 'div',
                props: {
                  innerHTML: `
                    <div style="padding: 20px; border: 2px solid #e53e3e; border-radius: 4px; background-color: #fff5f5; color: #c53030;">
                      <h2 style="margin-top: 0;">Template Error</h2>
                      <p>${error.message}</p>
                      <div style="margin-top: 15px; font-size: 14px; padding: 10px; background: #fff; border-radius: 4px; overflow: auto;">
                        <pre style="margin: 0;">${error.stack}</pre>
                      </div>
                    </div>
                  `
                },
                children: []
              }]
            };
          }
        };
      } else {
        // Fallback render function
        console.log('No _renderTemplate method found, using fallback render function');
        instance.render = function () {
          console.log('Calling fallback render function');

          // Create a proper vnode with tag, props, and children
          const vnode = {
            tag: 'div',
            props: { class: 'component-with-template' },
            children: [{
              tag: 'div',
              props: {
                innerHTML: `
                  <div style="padding: 20px; border: 2px solid #ed8936; border-radius: 4px; background-color: #fffaf0; color: #c05621;">
                    <h2 style="margin-top: 0;">${this.$options.name || 'Component'}</h2>
                    <p>This component is missing a template or render function.</p>
                    <div style="margin-top: 15px; font-size: 14px; padding: 10px; background: #fff; border-radius: 4px;">
                      <p style="margin: 0;">Add a template section to your .kal file or define a render function in the setup method.</p>
                    </div>
                  </div>
                `,
                style: 'padding: 10px;'
              },
              children: []
            }]
          };

          console.log('Fallback render function returning vnode:', vnode);
          return vnode;
        };
      }
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
        let vnode = this.render();
        console.log('Render result before processing:', vnode);

        // Ensure vnode is a proper virtual DOM node
        if (vnode && typeof vnode === 'object') {
          // If vnode is the component instance itself, create a default vnode
          if (vnode === this || !vnode.tag) {
            console.warn('Render function returned invalid vnode, creating default vnode');
            vnode = {
              tag: 'div',
              props: { class: 'kal-component' },
              children: [{
                tag: 'div',
                props: {
                  innerHTML: this._renderTemplate ? this._renderTemplate() : 'Component rendered successfully'
                },
                children: []
              }]
            };
          }
        } else if (!vnode) {
          console.warn('Render function returned null or undefined, creating default vnode');
          vnode = {
            tag: 'div',
            props: { class: 'kal-component-empty' },
            children: [{
              tag: 'div',
              props: {
                innerHTML: 'Component render returned empty result',
                style: 'padding: 10px; border: 1px solid #f0ad4e; background-color: #fcf8e3; color: #8a6d3b; border-radius: 4px;'
              },
              children: []
            }]
          };
        }

        console.log('Final vnode for rendering:', vnode);

        // Store the vnode for future updates
        this._vnode = vnode;

        // Create real DOM from virtual DOM and append to element
        if (vnode) {
          const dom = createElement(vnode);
          if (dom) {
            el.appendChild(dom);
            console.log('DOM element created and appended:', dom);
          } else {
            console.error('Failed to create DOM element from vnode');
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
  return createJsComponent((props, { emit, ref }) => {
    const result = { props, ref };

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
export function createStyles(cssString) {
  if (typeof document === 'undefined') {
    return null;
  }

  const styleId = 'kaljs-style-' + Math.random().toString(36).substring(2, 10);

  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = cssString;
    document.head.appendChild(style);
  }

  return styleId;
}