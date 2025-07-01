// @kalxjs/core - Directives System
// Export the directives system

export {
  directivesRegistry,
  applyDirectives,
  registerDirective,
  getDirective
} from './directives.js';

export {
  processDirectives,
  processDirective,
  evaluateExpression
} from './directive-processor.js';

// Export a convenience function to process directives on an element
export function processDirectivesOnElement(element, context) {
  if (!element || !context) {
    console.error('Invalid parameters for processDirectivesOnElement');
    return;
  }

  return processDirectives(element, context);
}