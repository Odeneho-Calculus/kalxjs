/**
 * KALXJS DevTools Extension Package Script
 * Creates distributable package for Chrome Web Store
 */

import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);

class ExtensionPackager {
    constructor() {
        this.buildDir = path.join(PROJECT_ROOT, 'build');
        this.distDir = path.join(PROJECT_ROOT, 'dist');
        this.packageName = 'kalxjs-devtools-extension';
        this.startTime = Date.now();
    }

    /**
     * Create distributable package
     */
    async package() {
        console.log('📦 Creating KALXJS DevTools Extension package...');

        try {
            // Validate build exists
            await this.validateBuild();

            // Prepare distribution directory
            await this.prepareDistribution();

            // Create ZIP package
            await this.createZipPackage();

            // Generate package info
            this.generatePackageInfo();

            console.log(`✅ Package created successfully in ${Date.now() - this.startTime}ms`);

        } catch (error) {
            console.error('❌ Packaging failed:', error);
            process.exit(1);
        }
    }

    /**
     * Validate build directory exists and is complete
     */
    async validateBuild() {
        console.log('✅ Validating build...');
        console.log('   Build dir:', this.buildDir);

        if (!fs.existsSync(this.buildDir)) {
            throw new Error('Build directory not found. Run "npm run build" first.');
        }

        const buildContents = fs.readdirSync(this.buildDir);
        console.log('   Build contains:', buildContents.join(', '));

        // Check for manifest in build directory
        const manifestInBuild = path.join(this.buildDir, 'manifest.json');
        if (fs.existsSync(manifestInBuild)) {
            console.log('   ✓ manifest.json found in build/');
        } else {
            console.log('   ⚠ manifest.json NOT found in build/');
            const manifestPath = path.join(PROJECT_ROOT, 'manifest.json');
            if (!fs.existsSync(manifestPath)) {
                throw new Error('manifest.json not found');
            }
        }

        // Check required build files
        const requiredFiles = [
            'background/service-worker.js',
            'content-script/content.js',
            'content-script/injected.js',
            'devtools/devtools.html',
            'devtools/devtools.js',
            'devtools/panel/panel.html'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.buildDir, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Required build file missing: ${file}`);
            }
        }

        console.log('   Build validation passed');
    }

    /**
     * Prepare distribution directory
     */
    async prepareDistribution() {
        console.log('📁 Preparing distribution directory...');
        console.log('   Dist dir:', this.distDir);

        // Create dist directory
        if (!fs.existsSync(this.distDir)) {
            fs.mkdirSync(this.distDir, { recursive: true });
            console.log('   ✓ Created dist directory');
        } else {
            console.log('   ✓ Dist directory exists');
        }

        // Clean previous packages
        const distContents = fs.readdirSync(this.distDir);
        console.log('   Dist contains:', distContents.join(', '));

        const existingPackages = distContents
            .filter(file => file.startsWith(this.packageName) && file.endsWith('.zip'));

        existingPackages.forEach(pkg => {
            const pkgPath = path.join(this.distDir, pkg);
            fs.unlinkSync(pkgPath);
            console.log(`   ✓ Removed old package: ${pkg}`);
        });

        console.log('   Distribution directory prepared');
    }

    /**
     * Create ZIP package for Chrome Web Store
     */
    async createZipPackage() {
        console.log('🗜️  Creating ZIP package...');

        // Read version from package.json
        const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const version = packageJson.version;

        const zipName = `${this.packageName}-v${version}.zip`;
        const zipPath = path.join(this.distDir, zipName);

        console.log('   ZIP name:', zipName);
        console.log('   ZIP path:', zipPath);

        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            output.on('close', () => {
                const sizeKB = Math.round(archive.pointer() / 1024 * 100) / 100;
                console.log(`   ✓ ZIP package created: ${zipName} (${sizeKB} KB)`);
                resolve(zipPath);
            });

            output.on('error', (err) => {
                console.error('   ✗ Output stream error:', err);
                reject(err);
            });
            archive.on('error', (err) => {
                console.error('   ✗ Archive error:', err);
                reject(err);
            });

            archive.pipe(output);

            // Add all build files to root - manifest.json is already in build dir from rollup
            const files = fs.readdirSync(this.buildDir);
            console.log('   Adding files to ZIP:', files.join(', '));
            files.forEach(file => {
                const filePath = path.join(this.buildDir, file);
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    archive.directory(filePath, file);
                } else {
                    archive.file(filePath, { name: file });
                }
            });

            // Add documentation files
            const docsToInclude = ['README.md', 'LICENSE', 'CHANGELOG.md'];
            docsToInclude.forEach(doc => {
                const docPath = path.join(PROJECT_ROOT, doc);
                if (fs.existsSync(docPath)) {
                    archive.file(docPath, { name: doc });
                }
            });

            archive.finalize();
        });
    }

    /**
     * Generate package information file
     */
    generatePackageInfo() {
        console.log('📋 Generating package info...');

        // Read package.json and manifest
        const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
        const manifestPath = path.join(PROJECT_ROOT, 'manifest.json');

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        const packageInfo = {
            name: packageJson.name,
            displayName: manifest.name,
            version: packageJson.version,
            description: packageJson.description,
            author: packageJson.author,
            license: packageJson.license,

            // Build info
            buildDate: new Date().toISOString(),
            buildDuration: Date.now() - this.startTime,

            // Extension info
            manifestVersion: manifest.manifest_version,
            permissions: manifest.permissions,
            hostPermissions: manifest.host_permissions,

            // Package info
            packageName: `${this.packageName}-v${packageJson.version}.zip`,
            packageSize: this.getPackageSize(),

            // Chrome Web Store info
            chromeWebStore: {
                category: 'Developer Tools',
                languages: ['en'],
                minimumChromeVersion: '88',
                supportedPlatforms: ['chrome', 'edge', 'brave', 'opera']
            },

            // Installation instructions
            installation: {
                development: [
                    '1. Open Chrome and navigate to chrome://extensions/',
                    '2. Enable "Developer mode"',
                    '3. Click "Load unpacked" and select the build folder',
                    '4. The extension will be loaded and ready to use'
                ],
                production: [
                    '1. Install from Chrome Web Store (coming soon)',
                    '2. Or load the ZIP package in Developer mode'
                ]
            },

            // Usage instructions
            usage: [
                '1. Open a web page using KALXJS framework',
                '2. Open Chrome DevTools (F12)',
                '3. Navigate to the "KALXJS" panel',
                '4. Inspect components, state, events, and performance'
            ]
        };

        // Write package info
        const infoPath = path.join(this.distDir, 'package-info.json');
        fs.writeFileSync(infoPath, JSON.stringify(packageInfo, null, 2));

        // Write human-readable info
        const readmePath = path.join(this.distDir, 'PACKAGE-README.md');
        const readmeContent = this.generateReadme(packageInfo);
        fs.writeFileSync(readmePath, readmeContent);

        console.log(`   Package info saved to: ${infoPath}`);
        console.log(`   Package README saved to: ${readmePath}`);
    }

    /**
     * Get package size
     */
    getPackageSize() {
        const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const version = packageJson.version;
        const zipName = `${this.packageName}-v${version}.zip`;
        const zipPath = path.join(this.distDir, zipName);

        if (fs.existsSync(zipPath)) {
            const stats = fs.statSync(zipPath);
            return {
                bytes: stats.size,
                kb: Math.round(stats.size / 1024 * 100) / 100,
                mb: Math.round(stats.size / (1024 * 1024) * 100) / 100
            };
        }

        return null;
    }

    /**
     * Generate README for package
     */
    generateReadme(packageInfo) {
        return `# ${packageInfo.displayName}

Version: ${packageInfo.version}
Build Date: ${new Date(packageInfo.buildDate).toLocaleString()}
Package Size: ${packageInfo.packageSize?.kb || 'Unknown'} KB

## Description

${packageInfo.description}

## Installation

### Development Mode
${packageInfo.installation.development.map(step => step).join('\n')}

### Production Mode
${packageInfo.installation.production.map(step => step).join('\n')}

## Usage

${packageInfo.usage.map(step => step).join('\n')}

## Technical Details

- **Manifest Version**: ${packageInfo.manifestVersion}
- **Minimum Chrome Version**: ${packageInfo.chromeWebStore.minimumChromeVersion}
- **Supported Platforms**: ${packageInfo.chromeWebStore.supportedPlatforms.join(', ')}
- **Permissions**: ${packageInfo.permissions?.join(', ') || 'None'}

## Support

For support and documentation, visit: https://kalxjs.dev/devtools

## License

${packageInfo.license}

---

Built with ❤️ by the KALXJS Team
`;
    }
}

// Run packaging if script is executed directly
(async () => {
    try {
        console.log('Starting package script...');
        console.log('import.meta.url:', import.meta.url);
        console.log('process.argv[1]:', process.argv[1]);
        
        const packager = new ExtensionPackager();
        await packager.package();
    } catch (err) {
        console.error('Fatal error:', err);
        process.exit(1);
    }
})();

export default ExtensionPackager;