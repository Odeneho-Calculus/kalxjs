// @kalxjs/core - Directive Processor Tests
// This file contains tests for the directive processor

import { processDirectives, processDirective, evaluateExpression } from './directive-processor';
import { directivesRegistry } from './directives';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Mock console methods to avoid cluttering test output
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  
  // Create a fresh DOM for each test
  document.body.innerHTML = '';
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

describe('Directive Processor', () => {
  test('processDirectives should process directives on an element and its children', () => {
    // Create a test DOM
    const rootElement = document.createElement('div');
    rootElement.innerHTML = `
      <div>
        <p k-text="message">Original text</p>
        <p k-if="showText">Conditional text</p>
        <p k-else>Else text</p>
        <ul>
          <li k-for="item in items" k-text="item"></li>
        </ul>
      </div>
    `;
    
    // Create a test context
    const context = {
      message: 'Hello, world!',
      showText: true,
      items: ['Item 1', 'Item 2', 'Item 3']
    };
    
    // Process directives
    processDirectives(rootElement, context);
    
    // Check that directives were processed
    const textElement = rootElement.querySelector('[k-text]');
    expect(textElement.textContent).toBe('Hello, world!');
    
    const ifElement = rootElement.querySelector('[k-if]');
    expect(ifElement.style.display).not.toBe('none');
    
    const elseElement = rootElement.querySelector('[k-else]');
    expect(elseElement.style.display).toBe('none');
    
    // k-for is more complex and would need a more sophisticated test
  });
  
  test('processDirective should process a specific directive', () => {
    // Create a test element
    const element = document.createElement('p');
    element.textContent = 'Original text';
    
    // Create a test context
    const context = {
      message: 'Hello, world!'
    };
    
    // Process a text directive
    processDirective(element, 'text', 'message', context);
    
    // Check that the directive was processed
    expect(element.textContent).toBe('Hello, world!');
  });
  
  test('evaluateExpression should evaluate expressions in a context', () => {
    // Create a test context
    const context = {
      message: 'Hello, world!',
      count: 42,
      nested: {
        value: 'Nested value'
      }
    };
    
    // Evaluate simple expressions
    expect(evaluateExpression('message', context)).toBe('Hello, world!');
    expect(evaluateExpression('count', context)).toBe(42);
    expect(evaluateExpression('nested.value', context)).toBe('Nested value');
    
    // Evaluate complex expressions
    expect(evaluateExpression('count > 40', context)).toBe(true);
    expect(evaluateExpression('message.length', context)).toBe(13);
    expect(evaluateExpression('`${message} The count is ${count}.`', context)).toBe('Hello, world! The count is 42.');
  });
});