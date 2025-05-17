#!/usr/bin/env node

/**
 * KalxJS Migration Tool
 * Converts .klx files to standard .js files and updates project structure
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const glob = require('glob');
const gradient = require('gradient-string');
const figlet = require('figlet');
const boxen = require('boxen');
const { execSync } = require('child_process');
const readline = require('readline-sync');

// Check if a file path was provided
if (process.argv.length < 3) {
  console.error('Please provide a .klx file path to convert');
  console.error('Usage: npx kalxjs-migrate path/to/component.klx.js');
  process.exit(1);
}

// Get the file path from command line arguments
const filePath = process.argv[2];

// Check if the file exists
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Check if it's a .klx file
if (!filePath.endsWith('.klx.js')) {
  console.error('The file must be a .klx.js file');
  process.exit(1);
}

// Read the file content
const fileContent = fs.readFileSync(filePath, 'utf8');

// Parse the .klx file
function parseKlxFile(content) {
  // Extract template section
  const templateMatch = /<template>([\s\S]*?)<\/template>/.exec(content);
  const template = templateMatch ? templateMatch[1].trim() : null;

  // Extract script section
  const scriptMatch = /<script>([\s\S]*?)<\/script>/.exec(content);
  const script = scriptMatch ? scriptMatch[1].trim() : null;

  // Extract style section
  const styleMatch = /<style(?:\s+scoped)?>([\s\S]*?)<\/style>/.exec(content);
  const style = styleMatch ? styleMatch[1].trim() : null;
  const isScoped = styleMatch ? styleMatch[0].includes('scoped') : false;

  return { template, script, style, isScoped };
}

// Convert template to render function
function templateToRender(template) {
  if (!template) {
    return 'function render() {\n  return h(\'div\', {}, [\'No template provided\']);\n}';
  }

  // This is a simplified conversion and won't handle all cases
  // For a production tool, you'd need a proper HTML parser

  // Replace {{ expressions }}
  let processedTemplate = template.replace(/{{(.*?)}}/g, (match, expression) => {
    return `\${state.${expression.trim()}}`;
  });

  // Replace v-if with ternary operators (simplified)
  processedTemplate = processedTemplate.replace(/v-if="(.*?)"/g, (match, condition) => {
    return `v-if="\${state.${condition.trim()} ? true : false}"`;
  });

  // Replace @click with onClick (simplified)
  processedTemplate = processedTemplate.replace(/@click="(.*?)"/g, (match, handler) => {
    return `onClick={${handler.trim()}}`;
  });

  // Replace :class with className (simplified)
  processedTemplate = processedTemplate.replace(/:class="(.*?)"/g, (match, expression) => {
    return `className={\`\${state.${expression.trim()}}\`}`;
  });

  // This is a very basic conversion that won't handle complex templates
  // For a real implementation, you'd need to parse the HTML and build the render function properly

  // Create a simple render function that just returns the template as a string
  // In a real implementation, you'd convert this to h() function calls
  return `function render() {
  // TODO: This is a simplified render function that needs manual adjustment
  // Convert the HTML below to h() function calls
  /*
  Original template:
  ${template}
  */
  
  return h('div', {}, [
    // Add your converted template here
    'Template conversion requires manual adjustment'
  ]);
}`;
}

// Convert script to setup function
function scriptToSetup(script) {
  if (!script) {
    return `setup() {
  const state = reactive({});
  
  return {
    state,
    render
  };
}`;
  }

  // Extract the component definition
  const componentMatch = /export\s+default\s+(?:defineComponent\()?({[\s\S]*})(?:\))?;?/.exec(script);

  if (!componentMatch) {
    console.error('Could not find component definition in script');
    return `setup() {
  const state = reactive({});
  
  return {
    state,
    render
  };
}`;
  }

  const componentDef = componentMatch[1];

  // Extract component properties
  const nameMatch = /name:\s*['"]([^'"]*)['"]/g.exec(componentDef);
  const name = nameMatch ? nameMatch[1] : 'UnnamedComponent';

  // Extract data function
  const dataMatch = /data\(\)\s*{([\s\S]*?)return\s*({[\s\S]*?});?[\s\S]*?}/g.exec(componentDef);
  const dataObj = dataMatch ? dataMatch[2] : '{}';

  // Extract methods
  const methodsMatch = /methods:\s*({[\s\S]*?}),?(?:\n|$)/g.exec(componentDef);
  const methods = methodsMatch ? methodsMatch[1] : '{}';

  // Extract computed properties
  const computedMatch = /computed:\s*({[\s\S]*?}),?(?:\n|$)/g.exec(componentDef);
  const computed = computedMatch ? computedMatch[1] : '{}';

  // Extract lifecycle hooks
  const lifecycleHooks = ['created', 'mounted', 'beforeMount', 'beforeUpdate', 'updated', 'beforeUnmount', 'unmounted'];
  const hooks = {};

  lifecycleHooks.forEach(hook => {
    const hookMatch = new RegExp(`${hook}\\(\\)\\s*{([\\s\\S]*?)}`, 'g').exec(componentDef);
    if (hookMatch) {
      hooks[hook] = hookMatch[1].trim();
    }
  });

  // Create the setup function
  return `setup(props) {
  // Component state
  const state = reactive(${dataObj});
  
  // Methods
  ${methods ? `// Methods from original component
  ${methods.replace(/^\s*{|}\s*$/g, '').trim()}` : '// No methods defined'}
  
  // Computed properties
  ${computed ? `// Computed properties from original component
  // Convert these to functions
  ${computed.replace(/^\s*{|}\s*$/g, '').trim().replace(/(\w+)\(\)\s*{/g, 'function $1() {')}` : '// No computed properties defined'}
  
  // Lifecycle hooks
  ${Object.entries(hooks).map(([hook, body]) => `function ${hook}() {
    ${body}
  }`).join('\n\n  ')}
  
  return {
    state,
    ${Object.keys(hooks).join(',\n    ')},
    render
  };
}`;
}

// Convert the .klx file to a .js file
function convertKlxToJs(filePath, content) {
  const { template, script, style, isScoped } = parseKlxFile(content);

  const renderFunction = templateToRender(template);
  const setupFunction = scriptToSetup(script);

  // Create the new .js file content
  const jsContent = `import { h, defineComponent, reactive, createStyles } from '@kalxjs/core';

${style ? `// Define styles
const styles = createStyles(\`
${style}
\`);
` : ''}
export default defineComponent({
  name: '${script && script.includes('name:') ? script.match(/name:\s*['"]([^'"]*)['"]/)[1] : 'Component'}',
  
  ${setupFunction}
});`;

  // Create the output file path
  const outputPath = filePath.replace('.klx.js', '.js');

  // Write the new file
  fs.writeFileSync(outputPath, jsContent);

  console.log(`Converted ${filePath} to ${outputPath}`);
  console.log('Note: The conversion is a starting point and may require manual adjustments, especially for the render function.');
}

// Function to migrate an entire project
function migrateProject(projectDir) {
  // Display banner
  console.log('\n');
  figlet.textSync('KALXJS Migration', {
    font: 'Big',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 80,
    whitespaceBreak: true
  }).split('\n').forEach(line => {
    console.log(gradient.pastel.multiline(line));
  });

  console.log('\n');
  console.log(boxen(
    chalk.bold('🚀 Migrate from .klx to .js files'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      backgroundColor: '#222'
    }
  ));
  console.log('\n');

  const absoluteProjectDir = path.resolve(process.cwd(), projectDir);

  // Check if the directory exists
  if (!fs.existsSync(absoluteProjectDir)) {
    console.error(chalk.red(`Directory ${chalk.cyan(absoluteProjectDir)} does not exist.`));
    process.exit(1);
  }

  // Check if it's a KALXJS project
  const packageJsonPath = path.join(absoluteProjectDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red(`No package.json found in ${chalk.cyan(absoluteProjectDir)}.`));
    process.exit(1);
  }

  const packageJson = require(packageJsonPath);
  const hasKalxjsDependency = Object.keys(packageJson.dependencies || {}).some(dep => dep.startsWith('@kalxjs/'));

  if (!hasKalxjsDependency) {
    console.warn(chalk.yellow(`Warning: This doesn't appear to be a KALXJS project. No @kalxjs dependencies found.`));
    const continueAnyway = readline.question(chalk.yellow('Continue anyway? (y/n) '));
    if (continueAnyway.toLowerCase() !== 'y') {
      process.exit(0);
    }
  }

  // Start migration
  console.log(chalk.cyan(`Starting migration in ${chalk.bold(absoluteProjectDir)}`));

  // 1. Find all .klx files
  const spinner = ora('Finding .klx files...').start();
  let klxFiles;
  try {
    klxFiles = glob.sync('**/*.klx', { cwd: absoluteProjectDir, ignore: ['**/node_modules/**', '**/dist/**'] });
    spinner.succeed(`Found ${chalk.bold(klxFiles.length)} .klx files`);
  } catch (error) {
    spinner.fail('Failed to find .klx files');
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  if (klxFiles.length === 0) {
    console.log(chalk.yellow('No .klx files found. Nothing to migrate.'));
    process.exit(0);
  }

  // 2. Convert each .klx file to .js
  spinner.text = 'Converting .klx files to .js...';
  spinner.start();

  try {
    for (const klxFile of klxFiles) {
      const klxPath = path.join(absoluteProjectDir, klxFile);
      const fileContent = fs.readFileSync(klxPath, 'utf8');

      // Convert the file using our existing conversion function
      const { template, script, style, isScoped } = parseKlxFile(fileContent);
      const renderFunction = templateToRender(template);
      const setupFunction = scriptToSetup(script);

      // Create the new .js file content
      const jsContent = `import { h, defineComponent, reactive, createStyles } from '@kalxjs/core';

${style ? `// Define styles
const styles = createStyles(\`
${style}
\`);
` : ''}
export default defineComponent({
  name: '${script && script.includes('name:') ? script.match(/name:\\s*['"]([^'"]*)['"]/)[1] : 'Component'}',
  
  ${setupFunction}
});`;

      // Create the output file path
      const jsPath = klxPath.replace(/\.klx$/, '.js');

      // Write the new file
      fs.writeFileSync(jsPath, jsContent, 'utf8');

      // Remove the old .klx file
      fs.unlinkSync(klxPath);
    }

    spinner.succeed(`Converted ${chalk.bold(klxFiles.length)} files from .klx to .js`);
  } catch (error) {
    spinner.fail('Failed to convert files');
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  // 3. Update import statements in all JS files
  spinner.text = 'Updating import statements...';
  spinner.start();

  try {
    const jsFiles = glob.sync('**/*.js', { cwd: absoluteProjectDir, ignore: ['**/node_modules/**', '**/dist/**'] });
    let updatedImports = 0;

    for (const jsFile of jsFiles) {
      const filePath = path.join(absoluteProjectDir, jsFile);
      let content = fs.readFileSync(filePath, 'utf8');

      // Replace .klx imports with .js
      const newContent = content.replace(/from\\s+['"](.+)\\.klx['"]/g, "from '$1.js'");

      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        updatedImports++;
      }
    }

    spinner.succeed(`Updated import statements in ${chalk.bold(updatedImports)} files`);
  } catch (error) {
    spinner.fail('Failed to update import statements');
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  // 4. Update package.json scripts
  spinner.text = 'Updating package.json scripts...';
  spinner.start();

  try {
    let updated = false;

    if (packageJson.scripts) {
      for (const [scriptName, scriptCommand] of Object.entries(packageJson.scripts)) {
        if (scriptCommand.includes('.klx')) {
          packageJson.scripts[scriptName] = scriptCommand.replace(/\\.klx/g, '.js');
          updated = true;
        }
      }
    }

    if (updated) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      spinner.succeed('Updated package.json scripts');
    } else {
      spinner.succeed('No package.json scripts needed updating');
    }
  } catch (error) {
    spinner.fail('Failed to update package.json scripts');
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  // 5. Update directory structure (optional)
  console.log('\n');
  const updateStructure = readline.question(
    chalk.cyan('Would you like to update to the new KALXJS directory structure? (y/n) ')
  );

  if (updateStructure.toLowerCase() === 'y') {
    spinner.text = 'Updating directory structure...';
    spinner.start();

    try {
      // Create new directory structure
      const newDirs = [
        'app',
        'app/core',
        'app/components',
        'app/pages',
        'app/navigation',
        'app/state',
        'app/services',
        'app/hooks',
        'app/extensions',
        'app/assets',
        'app/styles',
        'app/utils',
        'config',
        'docs'
      ];

      for (const dir of newDirs) {
        fs.ensureDirSync(path.join(absoluteProjectDir, dir));
      }

      // Move files to new structure
      const moveMap = {
        'src/App.js': 'app/core/App.js',
        'src/main.js': 'app/main.js',
        'src/components': 'app/components',
        'src/views': 'app/pages',
        'src/router': 'app/navigation',
        'src/store': 'app/state',
        'src/api': 'app/services',
        'src/composables': 'app/hooks',
        'src/plugins': 'app/extensions',
        'src/assets': 'app/assets',
        'src/styles': 'app/styles',
        'src/utils': 'app/utils'
      };

      for (const [oldPath, newPath] of Object.entries(moveMap)) {
        const fullOldPath = path.join(absoluteProjectDir, oldPath);
        const fullNewPath = path.join(absoluteProjectDir, newPath);

        if (fs.existsSync(fullOldPath)) {
          if (fs.statSync(fullOldPath).isDirectory()) {
            // For directories, copy contents
            fs.copySync(fullOldPath, fullNewPath);
          } else {
            // For files, copy the file
            fs.copySync(fullOldPath, fullNewPath);
          }
        }
      }

      // Create config file
      const configPath = path.join(absoluteProjectDir, 'config/app.config.js');
      fs.writeFileSync(configPath, `/**
 * KALXJS Application Configuration
 */
module.exports = {
  name: '${packageJson.name || 'KALXJS App'}',
  version: '${packageJson.version || '0.1.0'}',
  description: '${packageJson.description || 'A powerful KALXJS application'}',
  
  // Environment settings
  env: {
    development: {
      apiBaseUrl: 'http://localhost:3000/api',
      debug: true
    },
    production: {
      apiBaseUrl: '/api',
      debug: false
    }
  },
  
  // Feature flags
  features: {
    router: ${fs.existsSync(path.join(absoluteProjectDir, 'src/router')) || fs.existsSync(path.join(absoluteProjectDir, 'app/navigation'))},
    state: ${fs.existsSync(path.join(absoluteProjectDir, 'src/store')) || fs.existsSync(path.join(absoluteProjectDir, 'app/state'))},
    plugins: ${fs.existsSync(path.join(absoluteProjectDir, 'src/plugins')) || fs.existsSync(path.join(absoluteProjectDir, 'app/extensions'))},
    scss: ${fs.existsSync(path.join(absoluteProjectDir, 'src/styles')) || fs.existsSync(path.join(absoluteProjectDir, 'app/styles'))}
  }
};`, 'utf8');

      // Update vite.config.js if it exists
      const viteConfigPath = path.join(absoluteProjectDir, 'vite.config.js');
      if (fs.existsSync(viteConfigPath)) {
        let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

        // Update alias paths
        viteConfig = viteConfig.replace(
          /alias:\\s*{[^}]*}/,
          `alias: {
      '@': path.resolve(__dirname, './app'),
      '@core': path.resolve(__dirname, './app/core'),
      '@components': path.resolve(__dirname, './app/components'),
      '@assets': path.resolve(__dirname, './app/assets'),
      '@config': path.resolve(__dirname, './config')
    }`
        );

        fs.writeFileSync(viteConfigPath, viteConfig, 'utf8');
      }

      // Update index.html if it exists
      const indexHtmlPath = path.join(absoluteProjectDir, 'index.html');
      if (fs.existsSync(indexHtmlPath)) {
        let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

        // Update script src
        indexHtml = indexHtml.replace(
          /<script[^>]*src=["']\\/src\\/main\\.js["'][^>]*>/,
          '<script type="module" src="/app/main.js">'
        );

        fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
      }

      spinner.succeed('Updated directory structure');

      // Ask if user wants to remove old src directory
      const removeSrc = readline.question(
        chalk.cyan('Would you like to remove the old src directory? (y/n) ')
      );

      if (removeSrc.toLowerCase() === 'y') {
        fs.removeSync(path.join(absoluteProjectDir, 'src'));
        console.log(chalk.green('Removed old src directory'));
      }
    } catch (error) {
      spinner.fail('Failed to update directory structure');
      console.error(chalk.red(error.message));
    }
  }

  // 6. Update dependencies
  spinner.text = 'Updating dependencies...';
  spinner.start();

  try {
    // Update KALXJS dependencies to latest version
    const dependencies = packageJson.dependencies || {};
    let updated = false;

    for (const [dep, version] of Object.entries(dependencies)) {
      if (dep.startsWith('@kalxjs/')) {
        dependencies[dep] = '^2.0.0';
        updated = true;
      }
    }

    // Add missing KALXJS dependencies
    const requiredDeps = ['@kalxjs/core', '@kalxjs/cli', '@kalxjs/utils', '@kalxjs/devtools'];
    for (const dep of requiredDeps) {
      if (!dependencies[dep]) {
        dependencies[dep] = '^2.0.0';
        updated = true;
      }
    }

    if (updated) {
      packageJson.dependencies = dependencies;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      spinner.succeed('Updated dependencies');

      // Ask if user wants to install updated dependencies
      const installDeps = readline.question(
        chalk.cyan('Would you like to install the updated dependencies? (y/n) ')
      );

      if (installDeps.toLowerCase() === 'y') {
        console.log(chalk.cyan('Installing dependencies...'));
        execSync('npm install', { cwd: absoluteProjectDir, stdio: 'inherit' });
      }
    } else {
      spinner.succeed('No dependencies needed updating');
    }
  } catch (error) {
    spinner.fail('Failed to update dependencies');
    console.error(chalk.red(error.message));
  }

  // Migration complete
  console.log('\n');
  console.log(boxen(
    chalk.bold.green('🎉 Migration Complete! 🎉') +
    '\n\n' +
    chalk.bold('Next Steps:') +
    '\n\n' +
    chalk.cyan('  1. Review your code for any remaining .klx references') +
    '\n' +
    chalk.cyan('  2. Update your imports if needed') +
    '\n' +
    chalk.cyan('  3. Test your application') +
    '\n' +
    chalk.cyan('  4. Check the migration guide for more information:') +
    '\n' +
    chalk.cyan('     https://kalxjs.dev/docs/migration-guide'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
      backgroundColor: '#222'
    }
  ));
}

// Check if we're migrating a single file or an entire project
if (process.argv.length > 2) {
  const arg = process.argv[2];

  if (fs.existsSync(arg) && fs.statSync(arg).isDirectory()) {
    // Migrate an entire project
    migrateProject(arg);
  } else if (fs.existsSync(arg) && arg.endsWith('.klx.js')) {
    // Migrate a single file
    try {
      convertKlxToJs(arg, fs.readFileSync(arg, 'utf8'));
    } catch (error) {
      console.error('Error converting file:', error);
      process.exit(1);
    }
  } else {
    console.error('Invalid argument. Please provide a .klx.js file or a project directory.');
    process.exit(1);
  }
} else {
  // No arguments, assume current directory
  migrateProject('.');
}