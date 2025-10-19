/**
 * Project Templates
 * Available project templates for scaffolding
 *
 * @module @kalxjs/cli/scaffolding/project-templates
 */

/**
 * Available project templates
 */
export const projectTemplates = {
    spa: {
        name: 'Single Page Application (SPA)',
        description: 'Basic SPA with routing and state management',
        features: ['router', 'store', 'components'],
        structure: 'spa',
    },
    ssr: {
        name: 'Server-Side Rendering (SSR)',
        description: 'SSR application with Node.js backend',
        features: ['router', 'store', 'ssr', 'components'],
        structure: 'ssr',
    },
    ssg: {
        name: 'Static Site Generation (SSG)',
        description: 'Pre-rendered static site',
        features: ['router', 'ssg', 'components'],
        structure: 'ssg',
    },
    pwa: {
        name: 'Progressive Web App (PWA)',
        description: 'PWA with offline support',
        features: ['router', 'store', 'pwa', 'service-worker', 'components'],
        structure: 'pwa',
    },
    library: {
        name: 'Component Library',
        description: 'Reusable component library',
        features: ['components', 'build'],
        structure: 'library',
    },
    fullstack: {
        name: 'Full-Stack Application',
        description: 'Complete full-stack app with API',
        features: ['router', 'store', 'ssr', 'api', 'database', 'components'],
        structure: 'fullstack',
    },
};

/**
 * Get template by name
 */
export function getTemplate(templateName) {
    return projectTemplates[templateName] || projectTemplates.spa;
}

/**
 * Get all template names
 */
export function getTemplateNames() {
    return Object.keys(projectTemplates);
}

/**
 * Get template choices for prompts
 */
export function getTemplateChoices() {
    return Object.entries(projectTemplates).map(([key, template]) => ({
        name: `${template.name} - ${template.description}`,
        value: key,
    }));
}

/**
 * Generate project structure based on template
 */
export function getProjectStructure(templateName) {
    const template = getTemplate(templateName);

    const baseStructure = {
        'src/': {
            'main.js': true,
            'App.klx': true,
            'assets/': {
                'styles/': {
                    'main.css': true,
                },
                'images/': {},
            },
            'components/': {
                'HelloWorld.klx': true,
            },
        },
        'public/': {
            'index.html': true,
            'favicon.ico': true,
        },
        'package.json': true,
        'README.md': true,
        '.gitignore': true,
    };

    // Add router structure
    if (template.features.includes('router')) {
        baseStructure['src/']['router/'] = {
            'index.js': true,
            'routes.js': true,
        };
        baseStructure['src/']['views/'] = {
            'Home.klx': true,
            'About.klx': true,
        };
    }

    // Add store structure
    if (template.features.includes('store')) {
        baseStructure['src/']['store/'] = {
            'index.js': true,
            'modules/': {
                'user.js': true,
            },
        };
    }

    // Add SSR structure
    if (template.features.includes('ssr')) {
        baseStructure['server/'] = {
            'index.js': true,
            'renderer.js': true,
        };
    }

    // Add API structure
    if (template.features.includes('api')) {
        baseStructure['server/']['api/'] = {
            'index.js': true,
            'routes/': {
                'users.js': true,
            },
        };
    }

    // Add PWA structure
    if (template.features.includes('pwa')) {
        baseStructure['public/']['manifest.json'] = true;
        baseStructure['public/']['service-worker.js'] = true;
        baseStructure['public/']['icons/'] = {};
    }

    // Add library structure
    if (template.structure === 'library') {
        baseStructure['src/']['components/']['index.js'] = true;
        baseStructure['rollup.config.js'] = true;
    }

    return baseStructure;
}

/**
 * Get dependencies based on template
 */
export function getTemplateDependencies(templateName) {
    const template = getTemplate(templateName);

    const baseDeps = {
        '@kalxjs/core': '^2.0.0',
    };

    const devDeps = {
        '@kalxjs/cli': '^1.0.0',
        'vite': '^4.4.0',
    };

    // Add feature-based dependencies
    if (template.features.includes('router')) {
        baseDeps['@kalxjs/router'] = '^2.0.0';
    }

    if (template.features.includes('store')) {
        baseDeps['@kalxjs/store'] = '^1.0.0';
    }

    if (template.features.includes('pwa')) {
        baseDeps['@kalxjs/pwa'] = '^1.0.0';
    }

    if (template.features.includes('ssr')) {
        baseDeps['@kalxjs/ssr'] = '^1.0.0';
        baseDeps['express'] = '^4.18.0';
    }

    if (template.features.includes('api')) {
        baseDeps['@kalxjs/api'] = '^1.0.0';
    }

    if (template.features.includes('build')) {
        devDeps['rollup'] = '^2.79.1';
    }

    return { dependencies: baseDeps, devDependencies: devDeps };
}

/**
 * Export default
 */
export default {
    templates: projectTemplates,
    getTemplate,
    getTemplateNames,
    getTemplateChoices,
    getProjectStructure,
    getTemplateDependencies,
};