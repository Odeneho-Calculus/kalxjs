/**
 * Route Generator
 * Generate routes and view components
 *
 * @module @kalxjs/cli/generators/route-generator
 */

import path from 'path';
import { writeFile, ensureDir, readFile, fileExists } from '../utils/file-system.js';

/**
 * Generate route
 */
export async function generateRoute(name, options = {}) {
    const {
        path: routePath = `/${name.toLowerCase()}`,
        createView = true,
        lazy = true,
        addGuard = false,
        viewsDirectory = 'src/views',
        routerFile = 'src/router/routes.js',
    } = options;

    const results = [];

    // Generate view component
    if (createView) {
        const viewPath = path.join(process.cwd(), viewsDirectory);
        await ensureDir(viewPath);

        const viewContent = generateViewComponent(name);
        const viewFilePath = path.join(viewPath, `${name}.klx`);
        await writeFile(viewFilePath, viewContent);

        console.log(`✓ Created view: ${viewFilePath}`);
        results.push({ type: 'view', path: viewFilePath });
    }

    // Update router file
    const routerFilePath = path.join(process.cwd(), routerFile);
    if (await fileExists(routerFilePath)) {
        await updateRouterFile(routerFilePath, name, routePath, { lazy, addGuard });
        console.log(`✓ Updated routes: ${routerFilePath}`);
        results.push({ type: 'router', path: routerFilePath });
    } else {
        console.warn(`⚠ Router file not found: ${routerFilePath}`);
    }

    return results;
}

/**
 * Generate view component
 */
function generateViewComponent(name) {
    return `<template>
  <div class="${name.toLowerCase()}-view">
    <h1>{{ title }}</h1>
    <p>Welcome to the ${name} page!</p>
  </div>
</template>

<script>
import { ref } from '@kalxjs/core';

export default {
  name: '${name}View',

  setup() {
    const title = ref('${name}');

    return {
      title,
    };
  },
};
</script>

<style scoped>
.${name.toLowerCase()}-view {
  padding: var(--spacing-8);
}

.${name.toLowerCase()}-view h1 {
  font-size: var(--text-4xl);
  margin-bottom: var(--spacing-4);
  color: var(--color-primary-500);
}
</style>
`;
}

/**
 * Update router file with new route
 */
async function updateRouterFile(routerFilePath, name, routePath, options) {
    const { lazy, addGuard } = options;

    let content = await readFile(routerFilePath);

    // Generate route definition
    const routeDefinition = generateRouteDefinition(name, routePath, { lazy, addGuard });

    // Find the routes array
    const routesArrayRegex = /(const\s+routes\s*=\s*\[)([\s\S]*?)(\];)/;
    const match = content.match(routesArrayRegex);

    if (match) {
        // Insert new route before the closing bracket
        const beforeRoutes = match[1];
        const existingRoutes = match[2];
        const afterRoutes = match[3];

        const newContent = `${beforeRoutes}${existingRoutes}
  ${routeDefinition}${afterRoutes}`;

        content = content.replace(routesArrayRegex, newContent);
    } else {
        // If routes array not found, append at the end
        content += `\n\n// ${name} route\n${routeDefinition}\n`;
    }

    // Add import if lazy loading
    if (lazy) {
        const importStatement = `// Lazy-loaded ${name} view\n`;
        if (!content.includes(importStatement)) {
            content = importStatement + content;
        }
    } else {
        const importStatement = `import ${name} from '../views/${name}.klx';\n`;
        if (!content.includes(importStatement)) {
            content = importStatement + content;
        }
    }

    await writeFile(routerFilePath, content);
}

/**
 * Generate route definition
 */
function generateRouteDefinition(name, routePath, options) {
    const { lazy, addGuard } = options;

    const componentImport = lazy
        ? `() => import('../views/${name}.klx')`
        : name;

    let routeDefinition = `{
    path: '${routePath}',
    name: '${name}',
    component: ${componentImport},
    meta: {
      title: '${name}',
      requiresAuth: false,
    },`;

    if (addGuard) {
        routeDefinition += `
    beforeEnter: (to, from, next) => {
      // Add your guard logic here
      next();
    },`;
    }

    routeDefinition += `
  },`;

    return routeDefinition;
}

/**
 * Export default
 */
export default generateRoute;