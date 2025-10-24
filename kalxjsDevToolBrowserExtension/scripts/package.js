/**
 * KALXJS DevTools Extension Package Script
 * Creates distributable package for Chrome Web Store
 */

import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.dirname(path.dirname(import.meta.url.replace('file://', '')));

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

        if (!fs.existsSync(this.buildDir)) {
            throw new Error('Build directory not found. Run "npm run build" first.');
        }

        const manifestPath = path.join(PROJECT_ROOT, 'manifest.json');
        if (!fs.existsSync(manifestPath)) {
            throw new Error('manifest.json not found');
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

        // Create dist directory
        if (!fs.existsSync(this.distDir)) {
            fs.mkdirSync(this.distDir, { recursive: true });
        }

        // Clean previous packages
        const existingPackages = fs.readdirSync(this.distDir)
            .filter(file => file.startsWith(this.packageName) && file.endsWith('.zip'));

        existingPackages.forEach(pkg => {
            const pkgPath = path.join(this.distDir, pkg);
            fs.unlinkSync(pkgPath);
            console.log(`   Removed old package: ${pkg}`);
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

        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression
            });

            output.on('close', () => {
                const sizeKB = Math.round(archive.pointer() / 1024 * 100) / 100;
                console.log(`   ZIP package created: ${zipName} (${sizeKB} KB)`);
                resolve(zipPath);
            });

            output.on('error', reject);
            archive.on('error', reject);

            archive.pipe(output);

            // Add manifest.json from root
            const manifestPath = path.join(PROJECT_ROOT, 'manifest.json');
            archive.file(manifestPath, { name: 'manifest.json' });

            // Add all build files
            archive.directory(this.buildDir, false);

            // Add assets if they exist
            const assetsPath = path.join(PROJECT_ROOT, 'src/assets');
            if (fs.existsSync(assetsPath)) {
                archive.directory(assetsPath, 'src/assets');
            }

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
if (import.meta.url === `file://${process.argv[1]}`) {
    const packager = new ExtensionPackager();
    packager.package();
}

export default ExtensionPackager;