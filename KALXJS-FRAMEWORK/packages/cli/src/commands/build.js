const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ora = require('ora');
const gradient = require('gradient-string');
const cliProgress = require('cli-progress');

// Import ESM modules dynamically for compatibility - available to all functions
let chalk, boxen;

async function initializeESModules() {
    if (!chalk || !boxen) {
        chalk = await import('chalk').then(m => m.default);
        boxen = await import('boxen').then(m => m.default);
    }
}

/**
 * Build project for production
 * @param {Object} options - Command options
 */
async function build(options = {}) {
    // Initialize ESM modules
    await initializeESModules();

    // Set default options
    options = {
        verbose: false,
        mode: 'production',
        output: 'dist',
        minify: true,
        analyze: false,
        ...options
    };

    // Display a fancy header with build mode
    const headerText = options.mode === 'production'
        ? 'KalxJS Production Builder'
        : 'KalxJS Development Builder';

    console.log('\n');
    console.log(gradient.pastel.multiline('╔═════════════════════════════════════╗'));
    console.log(gradient.pastel.multiline('║                                     ║'));
    console.log(gradient.pastel.multiline(`║     ${headerText}       ║`));
    console.log(gradient.pastel.multiline('║                                     ║'));
    console.log(gradient.pastel.multiline('╚═════════════════════════════════════╝'));
    console.log('\n');

    // Show build configuration if verbose
    if (options.verbose) {
        console.log(boxen(
            chalk.blueBright('Build Configuration') + '\n\n' +
            chalk.white('Mode: ') + chalk.yellow(options.mode) + '\n' +
            chalk.white('Output directory: ') + chalk.yellow(options.output) + '\n' +
            chalk.white('Minification: ') + chalk.yellow(options.minify ? 'Enabled' : 'Disabled') + '\n' +
            chalk.white('Bundle analysis: ') + chalk.yellow(options.analyze ? 'Enabled' : 'Disabled'),
            {
                padding: 1,
                borderColor: 'blue',
                borderStyle: 'round'
            }
        ));
        console.log('\n');
    }

    // Start the spinner with a custom spinner
    const spinner = ora({
        text: chalk.cyan('Initializing build process...'),
        spinner: 'dots',
        color: 'cyan'
    }).start();

    try {
        // Get project root directory
        const projectRoot = process.cwd();

        // Check if this is a valid project by looking for package.json
        if (!fs.existsSync(path.join(projectRoot, 'package.json'))) {
            spinner.fail(chalk.red('No package.json found. Are you in a project directory?'));
            console.log('\n');
            console.log(boxen(
                chalk.redBright('⚠️ Project Validation Failed ⚠️') + '\n\n' +
                chalk.white('This command must be run from the root of a project with a package.json file.') + '\n\n' +
                chalk.yellow('To create a new project, run:') + '\n' +
                chalk.cyan('  kalxjs create my-app'),
                {
                    padding: 1,
                    margin: 1,
                    borderColor: 'red',
                    borderStyle: 'round'
                }
            ));
            process.exit(1);
        }

        // Read package.json
        const packageJson = require(path.join(projectRoot, 'package.json'));

        // Create or ensure output directory exists
        const distDir = path.join(projectRoot, options.output);
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
        }

        if (options.verbose) {
            spinner.info(chalk.blue(`Creating output directory: ${distDir}`));
        }

        // Create a progress bar for the build process
        const buildProgress = new cliProgress.SingleBar({
            format: chalk.cyan('{bar}') + ' | {percentage}% | {state}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
            clearOnComplete: true
        });

        // Start the build process
        spinner.succeed(chalk.green('Project validation complete'));
        console.log(chalk.yellow('\n📦 Starting build process...\n'));

        buildProgress.start(100, 0, { state: 'Preparing build environment' });

        // Run build process using bundler (if available)
        if (packageJson.scripts && packageJson.scripts.build) {
            // Use the project's build script
            buildProgress.update(20, { state: 'Running project build script' });

            try {
                execSync('npm run build', { stdio: options.verbose ? 'inherit' : 'pipe' });
                buildProgress.update(70, { state: 'Build script completed' });
            } catch (err) {
                buildProgress.stop();
                console.log('\n');
                console.log(boxen(
                    chalk.redBright('⚠️ Build script failed ⚠️') + '\n\n' +
                    chalk.white('Error details:') + '\n' +
                    chalk.red(err.message) + '\n\n' +
                    chalk.yellow('Troubleshooting tips:') + '\n' +
                    chalk.cyan('1.') + ' Check your package.json build script\n' +
                    chalk.cyan('2.') + ' Ensure all dependencies are installed: ' + chalk.white('npm install') + '\n' +
                    chalk.cyan('3.') + ' Check for syntax errors in your code\n' +
                    chalk.cyan('4.') + ' Try running with verbose mode: ' + chalk.white('kalxjs build --verbose'),
                    {
                        padding: 1,
                        borderColor: 'red',
                        borderStyle: 'round'
                    }
                ));
                process.exit(1);
            }
        } else {
            // Fallback to manual build process
            buildProgress.update(15, { state: 'Detecting build configuration' });

            // Check for a bundler like webpack, vite, rollup, or use a default
            let bundleCommand;
            let bundlerName = 'default';

            if (fs.existsSync(path.join(projectRoot, 'vite.config.js'))) {
                // Build Vite command with options
                let viteCommand = `npx vite build --mode ${options.mode} --outDir ${options.output}`;
                if (!options.minify) viteCommand += ' --no-minify';
                if (options.analyze) viteCommand += ' --bundle-analyze';

                bundleCommand = viteCommand;
                bundlerName = 'Vite';
                buildProgress.update(25, { state: 'Using Vite bundler' });

                if (options.verbose) {
                    console.log('\n' + chalk.blue(`Vite command: ${viteCommand}`) + '\n');
                }
            } else if (fs.existsSync(path.join(projectRoot, 'webpack.config.js'))) {
                // Build Webpack command with options
                let webpackCommand = `npx webpack --mode ${options.mode} --output-path ${path.join(projectRoot, options.output)}`;
                if (!options.minify) webpackCommand += ' --optimization-minimize false';
                if (options.analyze) webpackCommand += ' --analyze';

                bundleCommand = webpackCommand;
                bundlerName = 'Webpack';
                buildProgress.update(25, { state: 'Using Webpack bundler' });

                if (options.verbose) {
                    console.log('\n' + chalk.blue(`Webpack command: ${webpackCommand}`) + '\n');
                }
            } else if (fs.existsSync(path.join(projectRoot, 'rollup.config.js'))) {
                // Build Rollup command with options
                let rollupCommand = `npx rollup -c`;
                if (options.mode === 'development') rollupCommand += ' --environment NODE_ENV:development';
                if (options.analyze) rollupCommand += ' --plugin rollup-plugin-visualizer';

                bundleCommand = rollupCommand;
                bundlerName = 'Rollup';
                buildProgress.update(25, { state: 'Using Rollup bundler' });

                if (options.verbose) {
                    console.log('\n' + chalk.blue(`Rollup command: ${rollupCommand}`) + '\n');
                }
            } else {
                // Use esbuild as a fallback bundler
                bundlerName = 'ESBuild';
                buildProgress.update(20, { state: 'Setting up ESBuild bundler' });

                try {
                    // Install esbuild if not already installed
                    buildProgress.update(30, { state: 'Installing ESBuild dependencies' });
                    execSync('npm install --save-dev esbuild', { stdio: 'ignore' });

                    // Create a build script with options
                    const buildScript = `
const esbuild = require('esbuild');
const path = require('path');

${options.analyze ? "const { analyzeMetafile } = require('esbuild');" : ""}

esbuild.build({
  entryPoints: [path.join(process.cwd(), 'src/main.js')],
  bundle: true,
  minify: ${options.minify},
  outfile: path.join(process.cwd(), '${options.output}/bundle.js'),
  loader: { '.js': 'jsx' },
  format: 'esm',
  target: ['es2018'],
  metafile: ${options.analyze},
  define: {
    'process.env.NODE_ENV': '"${options.mode}"'
  }
})
${options.analyze ?
                            `.then(async (result) => {
  if (result.metafile) {
    const analysis = await analyzeMetafile(result.metafile);
    console.log(analysis);
  }
})` : ""}
.catch(() => process.exit(1));
`;

                    // Save build script temporarily
                    fs.writeFileSync(path.join(projectRoot, 'kalxjs-build.js'), buildScript);

                    // Run the build script
                    buildProgress.update(40, { state: 'Bundling with ESBuild' });
                    execSync('node kalxjs-build.js', { stdio: options.verbose ? 'inherit' : 'pipe' });
                    buildProgress.update(60, { state: 'ESBuild bundling complete' });

                    // Clean up the temporary build script
                    fs.unlinkSync(path.join(projectRoot, 'kalxjs-build.js'));

                } catch (err) {
                    buildProgress.stop();
                    console.log('\n');
                    console.log(boxen(
                        chalk.redBright('⚠️ ESBuild Bundling Failed ⚠️') + '\n\n' +
                        chalk.white('Error details:') + '\n' +
                        chalk.red(err.message) + '\n\n' +
                        chalk.yellow('Troubleshooting tips:') + '\n' +
                        chalk.cyan('1.') + ' Check your project structure\n' +
                        chalk.cyan('2.') + ' Ensure all dependencies are installed: ' + chalk.white('npm install') + '\n' +
                        chalk.cyan('3.') + ' Check for syntax errors in your code\n' +
                        chalk.cyan('4.') + ' Try running with verbose mode: ' + chalk.white('kalxjs build --verbose'),
                        {
                            padding: 1,
                            margin: 1,
                            borderColor: 'red',
                            borderStyle: 'round'
                        }
                    ));
                    process.exit(1);
                }
            }

            // Execute the bundle command if one was set
            if (bundleCommand) {
                buildProgress.update(40, { state: `Running ${bundlerName} build` });
                try {
                    execSync(bundleCommand, { stdio: options.verbose ? 'inherit' : 'pipe' });
                    buildProgress.update(60, { state: `${bundlerName} build completed` });
                } catch (err) {
                    buildProgress.stop();
                    console.log('\n');
                    console.log(boxen(
                        chalk.redBright(`⚠️ ${bundlerName} Build Failed ⚠️`) + '\n\n' +
                        chalk.white('Error details:') + '\n' +
                        chalk.red(err.message) + '\n\n' +
                        chalk.yellow('Troubleshooting tips:') + '\n' +
                        chalk.cyan('1.') + ' Check your bundler configuration\n' +
                        chalk.cyan('2.') + ' Ensure all dependencies are installed: ' + chalk.white('npm install') + '\n' +
                        chalk.cyan('3.') + ' Check for syntax errors in your code\n' +
                        chalk.cyan('4.') + ' Try running with verbose mode: ' + chalk.white('kalxjs build --verbose'),
                        {
                            padding: 1,
                            margin: 1,
                            borderColor: 'red',
                            borderStyle: 'round'
                        }
                    ));
                    process.exit(1);
                }
            }
        }

        // Copy static files if they exist
        const publicDir = path.join(projectRoot, 'public');
        if (fs.existsSync(publicDir)) {
            buildProgress.update(75, { state: 'Copying static assets' });
            copyFolderRecursiveSync(publicDir, distDir);
            buildProgress.update(85, { state: 'Static assets copied' });
        } else {
            buildProgress.update(85, { state: 'No static assets to copy' });
        }

        // Ensure index.html exists in dist directory
        buildProgress.update(90, { state: 'Finalizing build output' });
        if (!fs.existsSync(path.join(distDir, 'index.html'))) {
            // Copy from project root or create a minimal one
            const srcIndexPath = path.join(projectRoot, 'index.html');
            if (fs.existsSync(srcIndexPath)) {
                fs.copyFileSync(srcIndexPath, path.join(distDir, 'index.html'));
            } else {
                const minimalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>kalxjs App</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./bundle.js"></script>
</body>
</html>`;
                fs.writeFileSync(path.join(distDir, 'index.html'), minimalHtml);
            }
        }

        // Complete the progress bar
        buildProgress.update(100, { state: 'Build completed successfully!' });
        buildProgress.stop();

        // Calculate build size
        let totalSize = 0;
        const calculateDirSize = (directory) => {
            const files = fs.readdirSync(directory);
            files.forEach(file => {
                const filePath = path.join(directory, file);
                if (fs.statSync(filePath).isDirectory()) {
                    calculateDirSize(filePath);
                } else {
                    totalSize += fs.statSync(filePath).size;
                }
            });
        };

        try {
            calculateDirSize(distDir);
        } catch (err) {
            // Ignore errors in size calculation
        }

        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

        // Display success message in a fancy box
        console.log('\n');
        console.log(boxen(
            gradient.rainbow('🎉 Build Completed Successfully! 🎉') + '\n\n' +
            chalk.white('Output directory: ') + chalk.green(distDir) + '\n' +
            chalk.white('Build size: ') + chalk.yellow(`${sizeInMB} MB`) + '\n\n' +
            chalk.white('To serve the production build:') + '\n' +
            chalk.cyan('  npx serve -s dist'),
            {
                padding: 1,
                margin: 1,
                borderColor: 'green',
                borderStyle: 'round'
            }
        ));

    } catch (err) {
        // Stop any running progress bars
        try {
            buildProgress?.stop();
        } catch (e) {
            // Ignore errors from progress bar
        }

        spinner.fail(chalk.red('Build process failed'));

        // Display error in a fancy box
        console.log('\n');
        console.log(boxen(
            chalk.redBright('⚠️ Build Failed ⚠️') + '\n\n' +
            chalk.white('Error details:') + '\n' +
            chalk.red(err.stack || err.message) + '\n\n' +
            chalk.yellow('Troubleshooting tips:') + '\n' +
            chalk.cyan('1.') + ' Check your project configuration files\n' +
            chalk.cyan('2.') + ' Ensure all dependencies are installed: ' + chalk.white('npm install') + '\n' +
            chalk.cyan('3.') + ' Check for syntax errors in your code\n' +
            chalk.cyan('4.') + ' Try running with verbose mode: ' + chalk.white('kalxjs build --verbose'),
            {
                padding: 1,
                margin: 1,
                borderColor: 'red',
                borderStyle: 'round'
            }
        ));
        console.log('\n');

        process.exit(1);
    }
}

/**
 * Copy folder recursively
 * @param {string} source - Source folder
 * @param {string} target - Target folder
 */
function copyFolderRecursiveSync(source, target) {
    // Check if source folder exists
    if (!fs.existsSync(source)) {
        return;
    }

    // Create target folder if doesn't exist
    const targetFolder = path.join(target, path.basename(source));
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
    }

    // Copy files and subfolders
    if (fs.lstatSync(source).isDirectory()) {
        const files = fs.readdirSync(source);

        files.forEach(function (file) {
            const sourcePath = path.join(source, file);
            const targetPath = path.join(targetFolder, file);

            if (fs.lstatSync(sourcePath).isDirectory()) {
                copyFolderRecursiveSync(sourcePath, targetFolder);
            } else {
                fs.copyFileSync(sourcePath, targetPath);
            }
        });
    }
}

module.exports.build = build;