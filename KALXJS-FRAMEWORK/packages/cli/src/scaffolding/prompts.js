/**
 * Interactive Prompts
 * Questions for project scaffolding
 *
 * @module @kalxjs/cli/scaffolding/prompts
 */

import { getTemplateChoices } from './project-templates.js';

/**
 * Project scaffolding prompts
 */
export const projectPrompts = [
    {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'my-kalxjs-app',
        validate: (input) => {
            if (!input || input.trim() === '') {
                return 'Project name is required';
            }
            if (!/^[a-z0-9-]+$/.test(input)) {
                return 'Project name can only contain lowercase letters, numbers, and hyphens';
            }
            return true;
        },
    },
    {
        type: 'list',
        name: 'template',
        message: 'Select a template:',
        choices: getTemplateChoices(),
        default: 'spa',
    },
    {
        type: 'confirm',
        name: 'useTypeScript',
        message: 'Use TypeScript?',
        default: false,
    },
    {
        type: 'list',
        name: 'packageManager',
        message: 'Package manager:',
        choices: [
            { name: 'npm', value: 'npm' },
            { name: 'yarn', value: 'yarn' },
            { name: 'pnpm', value: 'pnpm' },
        ],
        default: 'npm',
    },
    {
        type: 'confirm',
        name: 'installDependencies',
        message: 'Install dependencies now?',
        default: true,
    },
    {
        type: 'confirm',
        name: 'initGit',
        message: 'Initialize git repository?',
        default: true,
    },
];

/**
 * ESLint/Prettier setup prompts
 */
export const lintingPrompts = [
    {
        type: 'confirm',
        name: 'useESLint',
        message: 'Add ESLint for code quality?',
        default: true,
    },
    {
        type: 'list',
        name: 'eslintConfig',
        message: 'ESLint configuration:',
        choices: [
            { name: 'Standard', value: 'standard' },
            { name: 'Airbnb', value: 'airbnb' },
            { name: 'Custom', value: 'custom' },
        ],
        default: 'standard',
        when: (answers) => answers.useESLint,
    },
    {
        type: 'confirm',
        name: 'usePrettier',
        message: 'Add Prettier for code formatting?',
        default: true,
    },
];

/**
 * Additional features prompts
 */
export const featuresPrompts = [
    {
        type: 'checkbox',
        name: 'features',
        message: 'Additional features (select with space):',
        choices: [
            { name: 'Unit Testing (Vitest)', value: 'testing' },
            { name: 'E2E Testing (Playwright)', value: 'e2e' },
            { name: 'Internationalization (i18n)', value: 'i18n' },
            { name: 'Accessibility (a11y)', value: 'a11y' },
            { name: 'UI Component Library', value: 'ui' },
            { name: 'PWA Support', value: 'pwa' },
            { name: 'Docker Configuration', value: 'docker' },
            { name: 'CI/CD (GitHub Actions)', value: 'cicd' },
        ],
    },
];

/**
 * Component generator prompts
 */
export const componentPrompts = [
    {
        type: 'input',
        name: 'name',
        message: 'Component name (PascalCase):',
        validate: (input) => {
            if (!input || input.trim() === '') {
                return 'Component name is required';
            }
            if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
                return 'Component name must be in PascalCase';
            }
            return true;
        },
    },
    {
        type: 'list',
        name: 'type',
        message: 'Component type:',
        choices: [
            { name: 'Single File Component (.klx)', value: 'sfc' },
            { name: 'JavaScript Component (.js)', value: 'js' },
            { name: 'TypeScript Component (.ts)', value: 'ts' },
        ],
        default: 'sfc',
    },
    {
        type: 'confirm',
        name: 'withProps',
        message: 'Add props definition?',
        default: true,
    },
    {
        type: 'confirm',
        name: 'withEmits',
        message: 'Add emits definition?',
        default: false,
    },
    {
        type: 'confirm',
        name: 'withTests',
        message: 'Create test file?',
        default: true,
    },
    {
        type: 'confirm',
        name: 'withStorybook',
        message: 'Create Storybook story?',
        default: false,
    },
];

/**
 * Route generator prompts
 */
export const routePrompts = [
    {
        type: 'input',
        name: 'name',
        message: 'Route name:',
        validate: (input) => {
            if (!input || input.trim() === '') {
                return 'Route name is required';
            }
            return true;
        },
    },
    {
        type: 'input',
        name: 'path',
        message: 'Route path:',
        default: (answers) => `/${answers.name.toLowerCase()}`,
    },
    {
        type: 'confirm',
        name: 'createView',
        message: 'Create view component?',
        default: true,
    },
    {
        type: 'confirm',
        name: 'lazy',
        message: 'Use lazy loading?',
        default: true,
    },
    {
        type: 'confirm',
        name: 'addGuard',
        message: 'Add navigation guard?',
        default: false,
    },
];

/**
 * Store module prompts
 */
export const storePrompts = [
    {
        type: 'input',
        name: 'name',
        message: 'Store module name:',
        validate: (input) => {
            if (!input || input.trim() === '') {
                return 'Module name is required';
            }
            if (!/^[a-z][a-zA-Z0-9]*$/.test(input)) {
                return 'Module name must be in camelCase';
            }
            return true;
        },
    },
    {
        type: 'list',
        name: 'style',
        message: 'Store style:',
        choices: [
            { name: 'Pinia-style (Composition API)', value: 'pinia' },
            { name: 'Vuex-style (Options API)', value: 'vuex' },
        ],
        default: 'pinia',
    },
    {
        type: 'confirm',
        name: 'withPersistence',
        message: 'Enable state persistence?',
        default: false,
    },
];

/**
 * Helper to run prompts
 */
export async function prompt(questions) {
    // This would use inquirer or similar library
    // For now, return a mock implementation
    console.log('Prompts:', questions);
    return {};
}

/**
 * Export all prompts
 */
export default {
    project: projectPrompts,
    linting: lintingPrompts,
    features: featuresPrompts,
    component: componentPrompts,
    route: routePrompts,
    store: storePrompts,
    prompt,
};