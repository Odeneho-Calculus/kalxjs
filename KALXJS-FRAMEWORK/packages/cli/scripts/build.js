const fs = require('fs-extra');
const path = require('path');

async function build() {
    const rootDir = path.resolve(__dirname, '..');
    const distDir = path.join(rootDir, 'dist');
    const templatesDir = path.join(rootDir, 'templates');
    const templatesJsDir = path.join(templatesDir, 'js');

    try {
        // Clean dist directory
        await fs.remove(distDir);
        await fs.ensureDir(distDir);

        // Ensure directories exist
        await fs.ensureDir(templatesDir);
        await fs.ensureDir(templatesJsDir);
        await fs.ensureDir(path.join(templatesJsDir, 'src'));
        await fs.ensureDir(path.join(templatesJsDir, 'src', 'components'));
        await fs.ensureDir(path.join(templatesJsDir, 'src', 'views'));
        await fs.ensureDir(path.join(templatesJsDir, 'src', 'router'));
        await fs.ensureDir(path.join(templatesJsDir, 'src', 'store'));
        await fs.ensureDir(path.join(templatesJsDir, 'src', 'styles'));

        // Copy necessary files
        await fs.copy(path.join(rootDir, 'src'), path.join(distDir, 'src'));
        await fs.copy(path.join(rootDir, 'templates'), path.join(distDir, 'templates'));
        await fs.copy(path.join(rootDir, 'bin'), path.join(distDir, 'bin'));

        // Copy or create template files if they don't exist
        const templateFiles = {
            'package.json': {
                path: path.join(templatesJsDir, 'package.json'),
                content: JSON.stringify({
                    name: "{{projectName}}",
                    version: "0.1.0",
                    type: "module",
                    dependencies: {
                        "@kalxjs/core": "^1.2.2"
                    }
                }, null, 2)
            },
            'index.html': {
                path: path.join(templatesJsDir, 'index.html'),
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{projectName}}</title>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>`
            }
        };

        for (const [name, file] of Object.entries(templateFiles)) {
            if (!await fs.pathExists(file.path)) {
                await fs.writeFile(file.path, file.content);
            }
        }

        // Make bin file executable
        const binFile = path.join(distDir, 'bin', 'kalxjs.js');
        if (await fs.pathExists(binFile)) {
            await fs.chmod(binFile, '755');
        }

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
