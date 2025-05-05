const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

/**
 * Build project for production
 * @param {Object} options - Command options
 */
function build(options = {}) {
    const spinner = ora('Building project for production...').start();

    try {
        // Get project root directory
        const projectRoot = process.cwd();

        // Check if this is a kalxjs project by looking for package.json
        if (!fs.existsSync(path.join(projectRoot, 'package.json'))) {
            spinner.fail('No package.json found. Are you in a kalxjs project directory?');
            process.exit(1);
        }

        // Read package.json to verify it's a kalxjs project
        const packageJson = require(path.join(projectRoot, 'package.json'));
        if (!packageJson.dependencies || !packageJson.dependencies.kalxjs) {
            spinner.warn('This does not appear to be a kalxjs project, but proceeding anyway...');
        }

        // Create or ensure dist directory exists
        const distDir = path.join(projectRoot, 'dist');
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
        }

        // Run build process using bundler (if available)
        if (packageJson.scripts && packageJson.scripts.build) {
            // Use the project's build script
            spinner.text = 'Running build script...';
            execSync('npm run build', { stdio: 'inherit' });
        } else {
            // Fallback to manual build process
            spinner.text = 'No build script found, using default bundling process...';

            // Check for a bundler like webpack, vite, rollup, or use a default
            let bundleCommand;

            if (fs.existsSync(path.join(projectRoot, 'vite.config.js'))) {
                bundleCommand = 'npx vite build';
            } else if (fs.existsSync(path.join(projectRoot, 'webpack.config.js'))) {
                bundleCommand = 'npx webpack --mode production';
            } else if (fs.existsSync(path.join(projectRoot, 'rollup.config.js'))) {
                bundleCommand = 'npx rollup -c';
            } else {
                // Use esbuild as a fallback bundler
                // First check if esbuild is installed
                try {
                    // Install esbuild if not already installed
                    spinner.text = 'Installing build dependencies...';
                    execSync('npm install --save-dev esbuild', { stdio: 'ignore' });

                    // Create a simple build script
                    const buildScript = `
const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: [path.join(process.cwd(), 'src/main.js')],
  bundle: true,
  minify: true,
  outfile: path.join(process.cwd(), 'dist/bundle.js'),
  loader: { '.js': 'jsx' },
  format: 'esm',
  target: ['es2018'],
  define: {
    'process.env.NODE_ENV': '"production"'
  }
}).catch(() => process.exit(1));
`;

                    // Save build script temporarily
                    fs.writeFileSync(path.join(projectRoot, 'kalxjs-build.js'), buildScript);

                    // Run the build script
                    spinner.text = 'Bundling with esbuild...';
                    execSync('node kalxjs-build.js', { stdio: 'inherit' });

                    // Clean up the temporary build script
                    fs.unlinkSync(path.join(projectRoot, 'kalxjs-build.js'));

                } catch (err) {
                    spinner.fail('Failed to use fallback bundler: ' + err.message);
                    process.exit(1);
                }
            }

            // Execute the bundle command if one was set
            if (bundleCommand) {
                execSync(bundleCommand, { stdio: 'inherit' });
            }
        }

        // Copy static files if they exist
        const publicDir = path.join(projectRoot, 'public');
        if (fs.existsSync(publicDir)) {
            spinner.text = 'Copying static files...';
            copyFolderRecursiveSync(publicDir, distDir);
        }

        // Ensure index.html exists in dist directory
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

        spinner.succeed('Build completed successfully!');
        console.log(`\nOutput directory: ${chalk.green(distDir)}`);
        console.log('\nTo serve the production build:');
        console.log(chalk.cyan('  npx serve -s dist\n'));

    } catch (err) {
        spinner.fail('Build failed:');
        console.error(chalk.red(err.message));
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