/**
 * KALXJS CLI
 * Command-line interface for KALXJS projects
 *
 * @module @kalxjs/cli
 */

// Generators
export { generateComponent } from './generators/component-generator.js';
export { generateRoute } from './generators/route-generator.js';
export { generateStore } from './generators/store-generator.js';

// Scaffolding
export { projectTemplates, getTemplate, getTemplateChoices, getProjectStructure, getTemplateDependencies } from './scaffolding/project-templates.js';
export { projectPrompts, lintingPrompts, featuresPrompts, componentPrompts, routePrompts, storePrompts, prompt } from './scaffolding/prompts.js';

// Utilities
export * as fileSystem from './utils/file-system.js';
export * as logger from './utils/logger.js';
export * as packageManager from './utils/package-manager.js';

/**
 * CLI version
 */
export const VERSION = '1.0.0';

/**
 * Export default
 */
export default {
    version: VERSION,
};
